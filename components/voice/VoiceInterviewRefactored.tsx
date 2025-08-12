'use client';

import { useCallback, useEffect, useState } from 'react';
import ConsentDialog from '@/components/consent-dialog';
import VoiceControls from './VoiceControls';
import VoiceStatus from './VoiceStatus';
import VoiceInstructions from './VoiceInstructions';
import { useVoiceSession } from '@/hooks/useVoiceSession';

interface VoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
  hasConsented?: boolean;
  onUserSpeechStart?: () => void;
}

export default function VoiceInterviewRefactored({ 
  onTranscript, 
  onConnectionChange, 
  hasConsented = false, 
  onUserSpeechStart 
}: VoiceInterviewProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [idleSince, setIdleSince] = useState<number | null>(null);
  
  // Use the voice session hook for all session management
  const {
    connectionState,
    isMuted,
    isAISpeaking,
    isProcessing,
    error,
    partialTranscript,
    hasUserSpoken,
    handleConnect,
    handleDisconnect,
    handleToggleMute,
    requestHumanHandoff,
  } = useVoiceSession({ onTranscript, onConnectionChange, onUserSpeechStart });

  const handleStartClick = useCallback(() => {
    if (hasConsented) {
      void handleConnect();
    } else {
      setShowConsent(true);
    }
  }, [hasConsented, handleConnect]);

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
    alert('Please call 1-855-6-CONNECT to schedule a human interview.');
  }, []);

  const handleConsentAccept = useCallback(() => {
    setShowConsent(false);
    handleConnect();
  }, [handleConnect]);

  // Set up idle tracking and human handoff listener
  useEffect(() => {
    const handleHandoffRequest = () => {
      console.log('[VoiceInterviewRefactored] Received event: interview:request_human');
      requestHumanHandoff();
    };
    window.addEventListener('interview:request_human', handleHandoffRequest);

    // Inactivity detection
    const setupIdleTimers = () => {
      const tick = () => {
        const last = idleSince ?? Date.now();
        const elapsed = Date.now() - last;
        
        // Warn at 60s, end at 90s
        if (elapsed > 60_000) {
          // Could add idle warning UI here
        }
        if (elapsed > 90_000) {
          console.log('[VoiceInterviewRefactored] Idle timeout reached, ending call');
          handleDisconnect();
        }
      };
      const intervalId = window.setInterval(tick, 5_000);
      return () => window.clearInterval(intervalId);
    };

    const idleIntervalCleanup = setupIdleTimers();

    return () => {
      window.removeEventListener('interview:request_human', handleHandoffRequest);
      idleIntervalCleanup();
    };
  }, [idleSince, handleDisconnect, requestHumanHandoff]);

  // Update idle timestamp on any activity
  useEffect(() => {
    setIdleSince(Date.now());
  }, [connectionState, isAISpeaking, isProcessing]);

  return (
    <div className=\"flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border-2 border-green-200\">
      {/* Instructions (only when idle) */}
      <VoiceInstructions connectionState={connectionState} />
      
      {/* Status */}
      <VoiceStatus
        connectionState={connectionState}
        isAISpeaking={isAISpeaking}
        isProcessing={isProcessing}
        isMuted={isMuted}
        error={error}
        partialTranscript={partialTranscript}
      />

      {/* Controls */}
      <VoiceControls
        connectionState={connectionState}
        isMuted={isMuted}
        hasUserSpoken={hasUserSpoken}
        isProcessing={isProcessing}
        onStart={handleStartClick}
        onDisconnect={handleDisconnect}
        onToggleMute={handleToggleMute}
      />

      {/* Consent Dialog */}
      {!hasConsented && showConsent && (
        <ConsentDialog
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}
    </div>
  );
}