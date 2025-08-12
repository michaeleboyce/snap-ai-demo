'use client';

import { AlertCircle, Loader2 } from 'lucide-react';

interface VoiceStatusProps {
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  isAISpeaking: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  error: string | null;
  partialTranscript: { user: string; assistant: string };
}

export default function VoiceStatus({
  connectionState,
  isAISpeaking,
  isProcessing,
  isMuted,
  error,
  partialTranscript,
}: VoiceStatusProps) {
  return (
    <div className=\"space-y-4\">
      {/* Connection Status */}
      <div className=\"flex items-center gap-2 text-sm\">
        <span className={`inline-block w-2 h-2 rounded-full ${
          connectionState === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          connectionState === 'error' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />
        <span className=\"text-gray-600\">
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
        <div className=\"flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg\">
          <AlertCircle className=\"w-4 h-4\" />
          {error}
        </div>
      )}

      {/* AI Status Indicators */}
      {connectionState === 'connected' && (
        <div className=\"flex flex-col items-center gap-2\">
          {isAISpeaking && (
            <div className=\"flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg\">
              <div className=\"flex gap-1\">
                <span className=\"inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse\" />
                <span className=\"inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse\" style={{ animationDelay: '0.1s' }} />
                <span className=\"inline-block w-1 h-4 bg-blue-600 rounded-full animate-pulse\" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className=\"text-sm text-blue-700\">AI is speaking</span>
            </div>
          )}
          
          {isProcessing && !isAISpeaking && (
            <div className=\"flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg\">
              <Loader2 className=\"w-4 h-4 animate-spin text-gray-600\" />
              <span className=\"text-sm text-gray-700\">AI is thinking...</span>
            </div>
          )}
        </div>
      )}

      {/* Partial Transcript Display */}
      {partialTranscript.assistant && (
        <div className=\"w-full max-w-md\">
          <div className=\"bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 italic\">
            {partialTranscript.assistant}...
          </div>
        </div>
      )}
    </div>
  );
}