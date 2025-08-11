'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
}

export default function VoiceInterview({ onTranscript, onConnectionChange }: VoiceInterviewProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const hasConfiguredRef = useRef<boolean>(false);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const attachRemoteAudio = () => {
    if (!remoteAudioRef.current) {
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      remoteAudioRef.current = audioEl;
      document.body.appendChild(audioEl);
    }
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }
    remoteAudioRef.current.srcObject = remoteStreamRef.current;
  };

  const connectToRealtime = async () => {
    try {
      setIsProcessing(true);
      // Get ephemeral session
      const response = await fetch('/api/realtime-token', { method: 'POST' });
      const tokenPayload = await response.json();
      const ephemeralKey = tokenPayload?.client_secret?.value || tokenPayload?.client_secret || tokenPayload?.value || tokenPayload?.token;
      const model = tokenPayload?.model || 'gpt-4o-realtime-preview-2024-12-17';

      if (!ephemeralKey) {
        throw new Error('Failed to obtain ephemeral key');
      }

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
        ],
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      });
      pcRef.current = pc;

      // Remote audio
      attachRemoteAudio();
      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) return;
        if (event.track.kind !== 'audio') return;
        // Replace any existing remote audio track to avoid duplicate playback
        remoteStreamRef.current.getTracks().forEach((t) => remoteStreamRef.current!.removeTrack(t));
        remoteStreamRef.current.addTrack(event.track);
        const audioEl = remoteAudioRef.current;
        if (audioEl) {
          const playAttempt = (async () => {
            try { await audioEl.play(); } catch (e) { /* ignore autoplay block */ }
          })();
        }
      };

      // Wait for server-created data channel and use it
      pc.ondatachannel = (e) => {
        const dc = e.channel;
        dcRef.current = dc;
        dc.onopen = () => {
          setIsConnected(true);
          setIsProcessing(false);
          onConnectionChange(true);
          if (!hasConfiguredRef.current) {
            hasConfiguredRef.current = true;
            // Configure the session
            dc.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: 'You are a Connecticut SNAP benefits eligibility interviewer. Be conversational and helpful. Ask about household composition, income, and expenses.',
                voice: 'alloy',
                turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 200 },
                input_audio_transcription: { model: 'whisper-1' },
                temperature: 0.8,
              },
            }));
            // Initial greeting (send only once)
            dc.send(JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['text', 'audio'],
                instructions: 'Start by greeting the user and explaining this is a SNAP benefits interview that will take about 10-15 minutes. Then ask about their household composition.'
              },
            }));
          }
        };
        dc.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'response.audio_transcript.delta':
                break;
              case 'response.audio_transcript.done':
                if (data.transcript) onTranscript(data.transcript, 'assistant');
                break;
              case 'conversation.item.input_audio_transcription.completed':
                if (data.transcript) onTranscript(data.transcript, 'user');
                break;
              case 'error':
                console.error('Realtime API error:', data?.error);
                console.error('Realtime API payload:', data);
                break;
            }
          } catch {}
        };
      };

      // Local mic
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      localStreamRef.current = localStream;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // Receive audio is negotiated automatically with send tracks; no extra recvonly transceiver to avoid duplicates

      // Create SDP offer and exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: offer.sdp || '',
      });
      const answer = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });

    } catch (error) {
      console.error('Failed to connect:', error);
      setIsProcessing(false);
    }
  };
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      const stream = localStreamRef.current;
      if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  };

  const stopConversation = () => {
    try {
      if (dcRef.current) {
        try { dcRef.current.close(); } catch {}
        dcRef.current = null;
      }
      if (pcRef.current) {
        try { pcRef.current.close(); } catch {}
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }
    } finally {
      setIsConnected(false);
      onConnectionChange(false);
      setIsStopped(true);
    }
  };

  const startConversation = async () => {
    setIsStopped(false);
    await connectToRealtime();
  };

  useEffect(() => {
    connectToRealtime();
    return () => {
      try { stopConversation(); } catch {}
      if (remoteAudioRef.current) {
        try { remoteAudioRef.current.srcObject = null; } catch {}
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {isProcessing ? (
        <div className="p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600 mt-2">Connecting to voice assistant...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {!isConnected || isStopped ? (
            <button
              onClick={startConversation}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isStopped ? 'Restart conversation' : 'Start conversation'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={stopConversation}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white"
              >
                Stop conversation
              </button>
              <button
                onClick={toggleMute}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isMuted ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? 'Unmute mic' : 'Mute mic'}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>
              {isConnected
                ? isStopped
                  ? 'Connected • Stopped'
                  : isMuted
                    ? 'Connected • Mic muted'
                    : 'Connected • Listening'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}