'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeSession } from '@openai/agents/realtime';
import { snapInterviewAgent, sessionConfig } from '@/lib/realtime-agent';
import { Loader2, Mic, MicOff, Phone, PhoneOff, AlertCircle } from 'lucide-react';
import ConsentDialog from '@/components/consent-dialog';
import Link from 'next/link';

interface VoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
  hasConsented?: boolean;
  onUserSpeechStart?: () => void;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface TranscriptBuffer {
  user: string;
  assistant: string;
}

export default function VoiceInterview({ onTranscript, onConnectionChange, hasConsented = false, onUserSpeechStart, initialMessages }: VoiceInterviewProps) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState<TranscriptBuffer>({ user: '', assistant: '' });
  const [idleSince, setIdleSince] = useState<number | null>(null);
  const idleWarningTimeoutRef = useRef<number | null>(null);
  const idleEndTimeoutRef = useRef<number | null>(null);
  const kickstartTimeoutRef = useRef<number | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [hasUserSpoken, setHasUserSpoken] = useState(false);
  const [handoffInProgress, setHandoffInProgress] = useState(false);
  const handoffTimeoutRef = useRef<number | null>(null);
  
  const sessionRef = useRef<RealtimeSession | null>(null);
  const cleanupRef = useRef<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  const handleStartClick = useCallback(() => {
    if (hasConsented) {
      // Parent already collected consent; connect directly
      void handleConnect();
    } else {
      setShowConsent(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConsented]);

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
    alert('Please call 1-800-555-SNAP to schedule a human interview.');
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
              // If we're in handoff flow, treat transcript completion as sufficient
              if (handoffInProgress) {
                console.log('[VoiceInterview] Transcript.done during handoff; disconnecting and signaling ready');
                if (handoffTimeoutRef.current) {
                  window.clearTimeout(handoffTimeoutRef.current);
                  handoffTimeoutRef.current = null;
                }
                setHandoffInProgress(false);
                handleDisconnect();
                console.log('[VoiceInterview] Dispatching event: interview:handoff_ready (after transcript.done)');
                window.dispatchEvent(new CustomEvent('interview:handoff_ready'));
              }
            }
          }

          // Note: Removed response.text.done handler to avoid duplicate transcripts
          // The audio transcript events should be sufficient

          // Track speaking state
          if (typedEvent.type === 'response.audio.delta') {
            setIsAISpeaking(true);
            setIsProcessing(false);
            // If we started speaking, clear any pending kickstart
            if (kickstartTimeoutRef.current) {
              window.clearTimeout(kickstartTimeoutRef.current);
              kickstartTimeoutRef.current = null;
            }
          } else if (typedEvent.type === 'response.audio.done' || typedEvent.type === 'response.done') {
            setIsAISpeaking(false);
            setIsProcessing(false);
            // If we were performing a human handoff closing message, now disconnect and notify
            if (handoffInProgress) {
              console.log('[VoiceInterview] Received response.done during handoff; disconnecting and signaling ready');
              setHandoffInProgress(false);
              if (handoffTimeoutRef.current) {
                window.clearTimeout(handoffTimeoutRef.current);
                handoffTimeoutRef.current = null;
              }
              // Perform disconnect, then signal page to navigate
              handleDisconnect();
              const readyEvent = new CustomEvent('interview:handoff_ready');
              console.log('[VoiceInterview] Dispatching event: interview:handoff_ready');
              window.dispatchEvent(readyEvent);
            }
          } else if (typedEvent.type === 'response.created') {
            setIsProcessing(true);
            if (handoffInProgress) {
              console.log('[VoiceInterview] response.created during handoff');
            }
          }
          // Idle tracking: any incoming event indicates activity
          setIdleSince(Date.now());
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

      // Add initial messages from demo scenario if provided
      if (initialMessages && initialMessages.length > 0) {
        console.log('[VoiceInterview] Adding initial messages from demo scenario:', initialMessages.length);
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

      // Trigger the agent to start speaking by creating an initial response (one-time only)
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        
        // First attempt: Try immediately after connection
        const triggerInitialResponse = () => {
          console.log('[VoiceInterview] Attempting to trigger initial response...');
          
          // Method 1: Try using session's built-in methods if available
          const sessionWithMethod = session as { createResponse?: () => void };
          if (sessionWithMethod.createResponse) {
            console.log('[VoiceInterview] Using session.createResponse()');
            sessionWithMethod.createResponse();
            return true;
          }
          
          // Method 2: Try using the transport directly
          const transport = session.transport as { send?: (data: unknown) => void };
          if (transport && transport.send) {
            console.log('[VoiceInterview] Using transport.send()');
            transport.send({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text'],
                instructions: undefined  // Let the agent use its default instructions
              }
            });
            return true;
          }
          
          // Method 3: Try sending an empty user message to trigger response
          if (transport && transport.send) {
            console.log('[VoiceInterview] Sending empty user message');
            transport.send({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: '' }]
              }
            });
            transport.send({ type: 'response.create' });
            return true;
          }
          
          console.log('[VoiceInterview] Could not trigger initial response - no methods available');
          return false;
        };
        
        // Try immediately
        if (!triggerInitialResponse()) {
          // If failed, retry after a short delay
          setTimeout(() => {
            if (!triggerInitialResponse()) {
              console.log('[VoiceInterview] Failed to trigger initial response after retry');
            }
          }, 500);
        }

        // Fallback kickstart: if the model hasn't started within 2s, force a greeting
        kickstartTimeoutRef.current = window.setTimeout(() => {
          if (!isAISpeaking && sessionRef.current) {
            console.log('[VoiceInterview] Forcing initial response (fallback after 2s)');
            const transport = sessionRef.current.transport as { send?: (data: unknown) => void };
            if (transport && transport.send) {
              // Send a simple user message to trigger the agent
              transport.send({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{ type: 'input_text', text: 'Start the interview' }]
                }
              });
              // Immediately request a response
              transport.send({ type: 'response.create' });
            }
          }
          kickstartTimeoutRef.current = null;
        }, 2000);
      }

    } catch (err) {
      console.error('[VoiceInterview] Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('error');
      setIsProcessing(false);
      onConnectionChange(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [connectionState, onTranscript, onConnectionChange, isAISpeaking, initialMessages]);

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
          const transport = sessionRef.current.transport as unknown as { mediaStream?: MediaStream; disconnect?: () => void } & Record<string, unknown>;
          
          // Stop media streams
          if (transport.mediaStream) {
            transport.mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
              track.stop();
              console.log('[VoiceInterview] Stopped media track:', track.kind);
            });
          }
          // Attempt to stop any other MediaStreams exposed by the transport
          try {
            const candidateKeys = ['localStream', 'microphoneStream', 'inputStream', 'remoteStream', 'outputMediaStream'];
            for (const key of candidateKeys) {
              const maybeStream = (transport as Record<string, unknown>)[key];
              if (maybeStream && typeof (maybeStream as { getTracks?: () => MediaStreamTrack[] }).getTracks === 'function') {
                (maybeStream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => {
                  track.stop();
                  console.log('[VoiceInterview] Stopped media track from', key, ':', track.kind);
                });
              }
            }
          } catch {}
          
          // Disconnect transport
          if (transport.disconnect) {
            transport.disconnect();
          }
        }
        // Best-effort: close the session if supported
        try {
          (sessionRef.current as unknown as { disconnect?: () => void }).disconnect?.();
          (sessionRef.current as unknown as { close?: () => void }).close?.();
        } catch {}
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
    setHasUserSpoken(false);
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

  // Cleanup on unmount - only run once
  useEffect(() => {
    // Listen for human handoff requests from the page
    const handleHandoffRequest = () => {
      console.log('[VoiceInterview] Received event: interview:request_human');
      try {
        // If not connected, we can immediately notify to navigate
        if (!sessionRef.current || !sessionRef.current.transport) {
          console.log('[VoiceInterview] Not connected; signaling handoff ready immediately');
          const ready = new CustomEvent('interview:handoff_ready');
          window.dispatchEvent(ready);
          return;
        }
        // Ask the agent to speak a short closing before we disconnect
        const transport = sessionRef.current.transport as unknown as { send?: (data: unknown) => void };
        console.log('[VoiceInterview] Sending polite closing via transport.send(response.create)');
        transport.send?.({
          type: 'response.create',
          response: {
            modalities: ['audio', 'text'],
            instructions: "Thank you for your time. I'll connect you to a human representative now.",
          }
        });
        setHandoffInProgress(true);
        console.log('[VoiceInterview] Handoff in progress; waiting for response.done (fallback 4s)');
        // Fallback: ensure we navigate even if we miss the response.done event
        handoffTimeoutRef.current = window.setTimeout(() => {
          if (handoffInProgress) {
            console.log('[VoiceInterview] Handoff fallback timeout fired; disconnecting and signaling ready');
            setHandoffInProgress(false);
            handleDisconnect();
            const ready = new CustomEvent('interview:handoff_ready');
            console.log('[VoiceInterview] Dispatching event: interview:handoff_ready (fallback)');
            window.dispatchEvent(ready);
          }
          handoffTimeoutRef.current = null;
        }, 4000);
      } catch (err) {
        console.error('[VoiceInterview] Handoff request failed, disconnecting immediately:', err);
        handleDisconnect();
        const ready = new CustomEvent('interview:handoff_ready');
        console.log('[VoiceInterview] Dispatching event: interview:handoff_ready (error path)');
        window.dispatchEvent(ready);
      }
    };
    window.addEventListener('interview:request_human', handleHandoffRequest);

    // Inactivity detection: warn at 60s idle, end at 90s
    const setupIdleTimers = () => {
      const tick = () => {
        const last = idleSince ?? Date.now();
        const elapsed = Date.now() - last;
        // warn at 60s
        if (elapsed > 60_000 && !idleWarningTimeoutRef.current) {
          idleWarningTimeoutRef.current = window.setTimeout(() => {
            if (connectionState === 'connected' && sessionRef.current) {
              const transport = sessionRef.current.transport as { send?: (data: unknown) => void };
              transport?.send?.({ type: 'response.create', response: { instructions: 'It looks like we have been idle. Are you still there? If you are finished, you may say END INTERVIEW.' } });
            }
            idleWarningTimeoutRef.current = null;
          }, 0);
        }
        // end at 90s
        if (elapsed > 90_000 && !idleEndTimeoutRef.current) {
          idleEndTimeoutRef.current = window.setTimeout(() => {
            console.log('[VoiceInterview] Idle timeout reached, ending call');
            handleDisconnect();
            idleEndTimeoutRef.current = null;
          }, 0);
        }
      };
      const intervalId = window.setInterval(tick, 5_000);
      return () => window.clearInterval(intervalId);
    };
    const clearPendingTimers = () => {
      if (idleWarningTimeoutRef.current) { window.clearTimeout(idleWarningTimeoutRef.current); idleWarningTimeoutRef.current = null; }
      if (idleEndTimeoutRef.current) { window.clearTimeout(idleEndTimeoutRef.current); idleEndTimeoutRef.current = null; }
    };

    const idleIntervalCleanup = setupIdleTimers();

    const cleanup = () => {
      console.log('[VoiceInterview] Cleaning up voice session...');
      clearPendingTimers();
      if (kickstartTimeoutRef.current) { window.clearTimeout(kickstartTimeoutRef.current); kickstartTimeoutRef.current = null; }
      if (sessionRef.current) {
        try {
          // Interrupt any ongoing responses
          sessionRef.current.interrupt();
          // Disconnect the transport if it exists
          if (sessionRef.current.transport) {
            (sessionRef.current.transport as { disconnect?: () => void }).disconnect?.();
          }
          // Stop any media streams
          if (sessionRef.current.transport && (sessionRef.current.transport as { mediaStream?: MediaStream }).mediaStream) {
            const stream = (sessionRef.current.transport as { mediaStream?: MediaStream }).mediaStream as MediaStream;
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
      window.removeEventListener('interview:request_human', handleHandoffRequest);
      idleIntervalCleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border-2 border-green-200">
      {/* Voice Interview Header - only show when not connected */}
      {connectionState === 'idle' && !showConsent && (
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-gray-800 mb-2">🎙️ Ready to Start Your Interview?</h3>
          <p className="text-gray-600">Click the button below to begin speaking with our AI assistant</p>
        </div>
      )}
      
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
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
        {connectionState === 'idle' || connectionState === 'error' ? (
          <button
            onClick={handleStartClick}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold animate-pulse"
          >
            <Phone className="w-6 h-6" />
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
        {/* Speak-to-start prompt */}
        {(!hasUserSpoken && !showConsent && connectionState !== 'idle') && (
          <div className="flex items-center gap-2 mt-1 text-base text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 animate-pulse">
            <Mic className="w-4 h-4" />
            <span className="font-medium">Begin speaking to begin the interview...</span>
          </div>
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
            <div className="mt-2 text-left text-xs">
              <Link href="/terms" className="text-blue-700 underline">View approved terms & disclosures</Link>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Click &quot;Start Voice Interview&quot; when you&apos;re ready to begin.
          </p>
          <p className="text-xs text-gray-500">
            You&apos;ll need to allow microphone access when prompted.
          </p>
        </div>
      )}

      {/* Consent Dialog (only if parent has not already collected consent) */}
      {!hasConsented && showConsent && (
        <ConsentDialog
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}
    </div>
  );
}