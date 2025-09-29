'use client';

import { useCallback, useState } from 'react';
import { Loader2, Mic, MicOff, Phone, PhoneOff, AlertCircle } from 'lucide-react';
import ConsentDialog from '@/components/consent-dialog';
import Link from 'next/link';
import { useVoiceSession } from '@/hooks/useVoiceSession';

interface VoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  onConnectionChange: (connected: boolean) => void;
  hasConsented?: boolean;
  onUserSpeechStart?: () => void;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export default function VoiceInterview({
  onTranscript,
  onConnectionChange,
  hasConsented = false,
  onUserSpeechStart,
  initialMessages
}: VoiceInterviewProps) {
  const [showConsent, setShowConsent] = useState(false);

  // Use the centralized voice session hook
  const {
    connectionState,
    isMuted,
    isAISpeaking,
    isProcessing,
    error,
    partialTranscript,
    hasUserSpoken,
    handoffInProgress,
    handleConnect,
    handleDisconnect,
    handleToggleMute,
    requestHumanHandoff,
  } = useVoiceSession({
    onTranscript,
    onConnectionChange,
    onUserSpeechStart,
    initialMessages
  });

  const handleStartClick = useCallback(() => {
    if (hasConsented) {
      // Parent already collected consent; connect directly
      void handleConnect();
    } else {
      setShowConsent(true);
    }
  }, [hasConsented, handleConnect]);

  const handleConsentDecline = useCallback(() => {
    setShowConsent(false);
    alert('Please call 1-800-555-SNAP to schedule a human interview.');
  }, []);

  const handleConsentAccept = useCallback(() => {
    setShowConsent(false);
    handleConnect();
  }, [handleConnect]);

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