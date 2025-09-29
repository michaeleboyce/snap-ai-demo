'use client';

import { useCallback, useRef, useState } from 'react';
import { RealtimeSession } from '@openai/agents/realtime';
import { snapInterviewAgent, sessionConfig } from '@/lib/realtime-agent';

interface TranscriptBuffer {
  user: string;
  assistant: string;
}

interface UseVoiceSessionProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
  onUserSpeechStart?: () => void;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function useVoiceSession({ onTranscript, onConnectionChange, onUserSpeechStart, initialMessages }: UseVoiceSessionProps) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState<TranscriptBuffer>({ user: '', assistant: '' });
  const [hasUserSpoken, setHasUserSpoken] = useState(false);
  const [handoffInProgress, setHandoffInProgress] = useState(false);
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const cleanupRef = useRef<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);
  const kickstartTimeoutRef = useRef<number | null>(null);
  const handoffTimeoutRef = useRef<number | null>(null);

  const handleConnect = useCallback(async () => {
    if (connectionState === 'connected' || connectionState === 'connecting') return;
    
    setConnectionState('connecting');
    setError(null);
    setIsProcessing(true);
    console.log('[useVoiceSession] Starting connection...');

    try {
      // Get ephemeral token from our API
      console.log('[useVoiceSession] Fetching ephemeral token...');
      const tokenResponse = await fetch('/api/realtime-token', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Token endpoint failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      console.log('[useVoiceSession] Token received:', { 
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
      console.log('[useVoiceSession] Creating RealtimeSession...');
      const session = new RealtimeSession(snapInterviewAgent, {
        ...sessionConfig,
        model: tokenData.model || sessionConfig.model,
      });
      
      sessionRef.current = session;

      // Set up transport event listeners
      if (session.transport) {
        console.log('[useVoiceSession] Setting up transport event listeners...');

        session.transport.on('*', (event: unknown) => {
          const typedEvent = event as { type?: string; transcript?: string; delta?: string; text?: string };

          // Trigger initial AI response when session is ready
          // Only trigger if there are no initial messages (fresh interview)
          if (typedEvent.type === 'session.created' && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;

            // If there are initial messages, the conversation is already in progress
            // so don't trigger a new greeting
            if (!initialMessages || initialMessages.length === 0) {
              console.log('[useVoiceSession] Session created, triggering initial AI response...');
              try {
                // Send empty message to trigger AI's initial greeting
                // The agent instructions specify it should speak first
                session.sendMessage({ role: 'user', content: [] });
                console.log('[useVoiceSession] Sent empty message to trigger AI greeting');
              } catch (err) {
                console.error('[useVoiceSession] Error triggering initial response:', err);
              }
            } else {
              console.log('[useVoiceSession] Session created with existing messages, not triggering initial greeting');
            }
          }

          // Handle user input transcription
          if (typedEvent.type === 'conversation.item.input_audio_transcription.completed') {
            if (typedEvent.transcript) {
              console.log('[User Transcript]', typedEvent.transcript);
              onTranscript(typedEvent.transcript, 'user');
              if (!hasUserSpoken) {
                setHasUserSpoken(true);
                onUserSpeechStart?.();
              }
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

              if (handoffInProgress) {
                console.log('[useVoiceSession] Transcript.done during handoff; disconnecting and signaling ready');
                if (handoffTimeoutRef.current) {
                  window.clearTimeout(handoffTimeoutRef.current);
                  handoffTimeoutRef.current = null;
                }
                setHandoffInProgress(false);
                handleDisconnect();
                console.log('[useVoiceSession] Dispatching event: interview:handoff_ready (after transcript.done)');
                window.dispatchEvent(new CustomEvent('interview:handoff_ready'));
              }
            }
          }

          // Track speaking state
          if (typedEvent.type === 'response.audio.delta') {
            setIsAISpeaking(true);
            setIsProcessing(false);
          } else if (typedEvent.type === 'response.audio.done' || typedEvent.type === 'response.done') {
            setIsAISpeaking(false);
            setIsProcessing(false);

            if (handoffInProgress) {
              console.log('[useVoiceSession] Received response.done during handoff; disconnecting and signaling ready');
              setHandoffInProgress(false);
              if (handoffTimeoutRef.current) {
                window.clearTimeout(handoffTimeoutRef.current);
                handoffTimeoutRef.current = null;
              }
              handleDisconnect();
              const readyEvent = new CustomEvent('interview:handoff_ready');
              console.log('[useVoiceSession] Dispatching event: interview:handoff_ready');
              window.dispatchEvent(readyEvent);
            }
          } else if (typedEvent.type === 'response.created') {
            setIsProcessing(true);
            if (handoffInProgress) {
              console.log('[useVoiceSession] response.created during handoff');
            }
          }
        });
      }

      session.on('audio_interrupted', () => {
        console.log('[useVoiceSession] Audio interrupted');
        setIsAISpeaking(false);
        setPartialTranscript({ user: '', assistant: '' });
      });

      session.on('tool_approval_requested', (_context, _agent, request) => {
        console.log('[useVoiceSession] Tool approval requested:', request);
        session.approve(request.approvalItem);
      });

      // Connect to the session
      console.log('[useVoiceSession] Connecting to OpenAI Realtime API...');
      await session.connect({ apiKey });
      
      console.log('[useVoiceSession] Connected successfully!');
      setConnectionState('connected');
      setIsProcessing(false);
      onConnectionChange(true);

      // Add initial messages from demo scenario if provided
      if (initialMessages && initialMessages.length > 0) {
        console.log('[useVoiceSession] Adding initial messages from demo scenario:', initialMessages.length);
        const transport = session.transport as { send?: (data: unknown) => void };
        if (transport && transport.send) {
          for (const message of initialMessages) {
            transport.send({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: message.role,
                content: [{ type: 'input_text', text: message.content }]
              }
            });
          }
        }
      }

      // Initial response will be triggered by session.created event (see transport listener above)

    } catch (err) {
      console.error('[useVoiceSession] Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('error');
      setIsProcessing(false);
      onConnectionChange(false);
    }
  }, [connectionState, onTranscript, onConnectionChange, isAISpeaking, hasUserSpoken, onUserSpeechStart, handoffInProgress, initialMessages]);

  const handleDisconnect = useCallback(() => {
    console.log('[useVoiceSession] Disconnecting...');
    cleanupRef.current = true;
    
    if (sessionRef.current) {
      try {
        sessionRef.current.interrupt();
        
        if (sessionRef.current.transport) {
          const transport = sessionRef.current.transport as unknown as { 
            mediaStream?: MediaStream; 
            disconnect?: () => void 
          } & Record<string, unknown>;
          
          // Stop media streams
          if (transport.mediaStream) {
            transport.mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
              track.stop();
              console.log('[useVoiceSession] Stopped media track:', track.kind);
            });
          }

          // Stop other potential MediaStreams
          try {
            const candidateKeys = ['localStream', 'microphoneStream', 'inputStream', 'remoteStream', 'outputMediaStream'];
            for (const key of candidateKeys) {
              const maybeStream = (transport as any)[key];
              if (maybeStream && typeof maybeStream.getTracks === 'function') {
                (maybeStream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => {
                  track.stop();
                  console.log('[useVoiceSession] Stopped media track from', key, ':', track.kind);
                });
              }
            }
          } catch {}
          
          if (transport.disconnect) {
            transport.disconnect();
          }
        }

        try {
          (sessionRef.current as unknown as { disconnect?: () => void }).disconnect?.();
          (sessionRef.current as unknown as { close?: () => void }).close?.();
        } catch {}
      } catch (err) {
        console.error('[useVoiceSession] Error during disconnect:', err);
      }
      sessionRef.current = null;
    }
    
    // Reset state
    setPartialTranscript({ user: '', assistant: '' });
    hasTriggeredRef.current = false;
    setConnectionState('idle');
    setIsAISpeaking(false);
    setIsProcessing(false);
    onConnectionChange(false);
    setHasUserSpoken(false);
    cleanupRef.current = false;
  }, [onConnectionChange]);

  const handleToggleMute = useCallback(() => {
    if (!sessionRef.current) {
      console.warn('[useVoiceSession] Cannot mute: no active session');
      return;
    }

    const newMuted = !isMuted;

    try {
      // Use the built-in mute() method provided by RealtimeSession
      sessionRef.current.mute(newMuted);
      setIsMuted(newMuted);
      console.log(`[useVoiceSession] ${newMuted ? 'Muted' : 'Unmuted'} microphone via session.mute()`);
    } catch (err) {
      console.error('[useVoiceSession] Error toggling mute:', err);
    }
  }, [isMuted]);

  const requestHumanHandoff = useCallback(() => {
    console.log('[useVoiceSession] Received human handoff request');
    try {
      if (!sessionRef.current || !sessionRef.current.transport) {
        console.log('[useVoiceSession] Not connected; signaling handoff ready immediately');
        const ready = new CustomEvent('interview:handoff_ready');
        window.dispatchEvent(ready);
        return;
      }

      const transport = sessionRef.current.transport as unknown as { send?: (data: unknown) => void };
      console.log('[useVoiceSession] Sending polite closing via transport.send(response.create)');
      transport.send?.({
        type: 'response.create',
        response: {
          modalities: ['audio', 'text'],
          instructions: "Thank you for your time. I'll connect you to a human representative now.",
        }
      });
      setHandoffInProgress(true);
      console.log('[useVoiceSession] Handoff in progress; waiting for response.done (fallback 4s)');
      
      // Fallback timeout
      handoffTimeoutRef.current = window.setTimeout(() => {
        if (handoffInProgress) {
          console.log('[useVoiceSession] Handoff fallback timeout fired; disconnecting and signaling ready');
          setHandoffInProgress(false);
          handleDisconnect();
          const ready = new CustomEvent('interview:handoff_ready');
          console.log('[useVoiceSession] Dispatching event: interview:handoff_ready (fallback)');
          window.dispatchEvent(ready);
        }
        handoffTimeoutRef.current = null;
      }, 4000);
    } catch (err) {
      console.error('[useVoiceSession] Handoff request failed, disconnecting immediately:', err);
      handleDisconnect();
      const ready = new CustomEvent('interview:handoff_ready');
      console.log('[useVoiceSession] Dispatching event: interview:handoff_ready (error path)');
      window.dispatchEvent(ready);
    }
  }, [handoffInProgress, handleDisconnect]);

  return {
    // State
    connectionState,
    isMuted,
    isAISpeaking,
    isProcessing,
    error,
    partialTranscript,
    hasUserSpoken,
    handoffInProgress,
    
    // Actions
    handleConnect,
    handleDisconnect,
    handleToggleMute,
    requestHumanHandoff,
  };
}