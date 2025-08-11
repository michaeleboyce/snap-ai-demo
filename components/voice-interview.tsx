'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeSession } from '@openai/agents/realtime';
import { snapInterviewAgent, sessionConfig } from '@/lib/realtime-agent';
import { Loader2, Mic, MicOff, Phone, PhoneOff, AlertCircle } from 'lucide-react';
import ConsentDialog from '@/components/consent-dialog';

interface VoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
}

interface TranscriptBuffer {
  user: string;
  assistant: string;
}

export default function VoiceInterview({ onTranscript, onConnectionChange }: VoiceInterviewProps) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState<TranscriptBuffer>({ user: '', assistant: '' });
  const [showConsent, setShowConsent] = useState(false);
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const cleanupRef = useRef<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  const handleStartClick = useCallback(() => {
    setShowConsent(true);
  }, []);

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
    alert('Please call 1-855-6-CONNECT to schedule a human interview.');
  }, []);

  const handleConnect = useCallback(async () => {
    if (connectionState === 'connected' || connectionState === 'connecting') return;
    
    setConnectionState('connecting');
    setError(null);
    setIsProcessing(true);
    console.log('[VoiceInterview] Starting connection...');

    try {
      // Get ephemeral token from our API
      console.log('[VoiceInterview] Fetching ephemeral token...');
      const tokenResponse = await fetch('/api/realtime-token', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Token endpoint failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('[VoiceInterview] Token received:', { 
        hasSecret: !!tokenData.client_secret,
        model: tokenData.model 
      });
      
      const apiKey = tokenData.client_secret?.value || 
                    tokenData.client_secret || 
                    tokenData.value || 
                    tokenData.token;

      if (!apiKey) {
        throw new Error('No API key in token response');
      }

      // Create new session with the agent
      console.log('[VoiceInterview] Creating RealtimeSession...');
      const session = new RealtimeSession(snapInterviewAgent, {
        ...sessionConfig,
        model: tokenData.model || sessionConfig.model,
      });
      
      sessionRef.current = session;

      // Listen to the underlying transport for raw events
      if (session.transport) {
        console.log('[VoiceInterview] Setting up transport event listeners...');
        
        // Listen to all events from the transport
        session.transport.on('*', (event: unknown) => {
          const typedEvent = event as { type?: string; transcript?: string; delta?: string; text?: string };
          // console.log('[Transport Event]', typedEvent.type, event);
          
          // Handle user input transcription
          if (typedEvent.type === 'conversation.item.input_audio_transcription.completed') {
            if (typedEvent.transcript) {
              console.log('[User Transcript]', typedEvent.transcript);
              onTranscript(typedEvent.transcript, 'user');
            }
          }
          
          // Handle assistant transcript chunks (streaming)
          if (typedEvent.type === 'response.audio_transcript.delta') {
            if (typedEvent.delta) {
              setPartialTranscript(prev => ({
                ...prev,
                assistant: prev.assistant + typedEvent.delta
              }));
            }
          }
          
          // Handle completed assistant transcript
          if (typedEvent.type === 'response.audio_transcript.done') {
            if (typedEvent.transcript) {
              console.log('[Assistant Transcript]', typedEvent.transcript);
              onTranscript(typedEvent.transcript, 'assistant');
              setPartialTranscript(prev => ({ ...prev, assistant: '' }));
            }
          }

          // Note: Removed response.text.done handler to avoid duplicate transcripts
          // The audio transcript events should be sufficient

          // Track speaking state
          if (typedEvent.type === 'response.audio.delta') {
            setIsAISpeaking(true);
            setIsProcessing(false);
          } else if (typedEvent.type === 'response.audio.done' || typedEvent.type === 'response.done') {
            setIsAISpeaking(false);
            setIsProcessing(false);
          } else if (typedEvent.type === 'response.created') {
            setIsProcessing(true);
          }
        });
      }

      // Note: We're using transport events for real-time transcripts instead of history_updated
      // to avoid duplicate transcript processing

      session.on('audio_interrupted', () => {
        console.log('[VoiceInterview] Audio interrupted');
        setIsAISpeaking(false);
        // Clear partial transcript on interruption
        setPartialTranscript({ user: '', assistant: '' });
      });

      session.on('tool_approval_requested', (_context, _agent, request) => {
        console.log('[VoiceInterview] Tool approval requested:', request);
        // Auto-approve tools for demo
        session.approve(request.approvalItem);
      });

      // Connect to the session
      console.log('[VoiceInterview] Connecting to OpenAI Realtime API...');
      await session.connect({ apiKey });
      
      console.log('[VoiceInterview] Connected successfully!');
      setConnectionState('connected');
      setIsProcessing(false);
      onConnectionChange(true);

      // Trigger the agent to start speaking by creating an initial response (one-time only)
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        setTimeout(() => {
          console.log('[VoiceInterview] Triggering initial response (one-time)...');
          // Access the transport to send a response.create event directly
          const transport = session.transport as { send?: (data: unknown) => void };
          if (transport && transport.send) {
            transport.send({
              type: 'response.create'
            });
            console.log('[VoiceInterview] Sent response.create event');
          } else {
            console.log('[VoiceInterview] Could not access transport.send');
          }
        }, 500);
      }

    } catch (err) {
      console.error('[VoiceInterview] Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('error');
      setIsProcessing(false);
      onConnectionChange(false);
    }
  }, [connectionState, onTranscript, onConnectionChange]);

  const handleConsentAccept = useCallback(() => {
    setShowConsent(false);
    handleConnect();
  }, [handleConnect]);

  const handleDisconnect = useCallback(() => {
    console.log('[VoiceInterview] Disconnecting...');
    cleanupRef.current = true;
    
    if (sessionRef.current) {
      try {
        // Interrupt any ongoing responses
        sessionRef.current.interrupt();
        
        // Disconnect the transport if it exists
        if (sessionRef.current.transport) {
          const transport = sessionRef.current.transport as any;
          
          // Stop media streams
          if (transport.mediaStream) {
            transport.mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
              track.stop();
              console.log('[VoiceInterview] Stopped media track:', track.kind);
            });
          }
          
          // Disconnect transport
          if (transport.disconnect) {
            transport.disconnect();
          }
        }
      } catch (err) {
        console.error('[VoiceInterview] Error during disconnect:', err);
      }
      sessionRef.current = null;
    }
    
    // Clear transcript buffers
    setPartialTranscript({ user: '', assistant: '' });
    
    // Reset the trigger flag so it can trigger again on next connection
    hasTriggeredRef.current = false;
    
    setConnectionState('idle');
    setIsAISpeaking(false);
    setIsProcessing(false);
    onConnectionChange(false);
    cleanupRef.current = false;
  }, [onConnectionChange]);

  const handleToggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    // The SDK handles muting through the browser's MediaStream
    // For now, we'll just track the state for UI purposes
    console.log('[VoiceInterview] Mute toggled:', newMuted);
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = () => {
      console.log('[VoiceInterview] Cleaning up voice session...');
      if (sessionRef.current) {
        try {
          // Interrupt any ongoing responses
          sessionRef.current.interrupt();
          // Disconnect the transport if it exists
          if (sessionRef.current.transport && (sessionRef.current.transport as any).disconnect) {
            (sessionRef.current.transport as any).disconnect();
          }
          // Stop any media streams
          if (sessionRef.current.transport && (sessionRef.current.transport as any).mediaStream) {
            const stream = (sessionRef.current.transport as any).mediaStream;
            stream.getTracks().forEach((track: MediaStreamTrack) => {
              track.stop();
              console.log('[VoiceInterview] Stopped media track:', track.kind);
            });
          }
          // Clear the session reference
          sessionRef.current = null;
        } catch (err) {
          console.error('[VoiceInterview] Error during cleanup:', err);
        }
      }
      // Reset states
      setConnectionState('idle');
      setIsAISpeaking(false);
      setIsProcessing(false);
      setPartialTranscript({ user: '', assistant: '' });
      hasTriggeredRef.current = false;
    };

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on component unmount
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block w-2 h-2 rounded-full ${
          connectionState === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          connectionState === 'error' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />
        <span className="text-gray-600">
          {connectionState === 'connected' ? (
            isAISpeaking ? 'AI is speaking...' : 
            isProcessing ? 'AI is thinking...' :
            isMuted ? 'Connected • Mic muted' : 
            'Connected • Listening'
          ) :
          connectionState === 'connecting' ? 'Connecting...' :
          connectionState === 'error' ? 'Connection failed' :
          'Not connected'}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {connectionState === 'idle' || connectionState === 'error' ? (
          <button
            onClick={handleStartClick}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Start Voice Interview
          </button>
        ) : connectionState === 'connecting' ? (
          <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin" />
            Connecting...
          </div>
        ) : (
          <>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </>
        )}
      </div>

      {/* AI Status Indicators */}
      {connectionState === 'connected' && (
        <div className="flex flex-col items-center gap-2">
          {isAISpeaking && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div className="flex gap-1">
                <span className="inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse" />
                <span className="inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                <span className="inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm text-blue-700">AI is speaking</span>
            </div>
          )}
          
          {isProcessing && !isAISpeaking && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-700">AI is thinking...</span>
            </div>
          )}
        </div>
      )}

      {/* Partial Transcript Display (for streaming) */}
      {partialTranscript.assistant && (
        <div className="w-full max-w-md mt-2">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 italic">
            {partialTranscript.assistant}...
          </div>
        </div>
      )}

      {/* Instructions */}
      {connectionState === 'idle' && (
        <div className="text-center max-w-md space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Before You Begin</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• You&apos;ll be speaking with an AI assistant</li>
              <li>• The interview takes about 10-15 minutes</li>
              <li>• Have income and expense information ready</li>
              <li>• You can say &quot;I want to speak to a human&quot; at any time</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Click &quot;Start Voice Interview&quot; when you&apos;re ready to begin.
          </p>
          <p className="text-xs text-gray-500">
            You&apos;ll need to allow microphone access when prompted.
          </p>
        </div>
      )}

      {/* Consent Dialog */}
      <ConsentDialog
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}