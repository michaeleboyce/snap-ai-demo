'use client';

import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceControlsProps {
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
  isMuted: boolean;
  hasUserSpoken: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
}

export default function VoiceControls({
  connectionState,
  isMuted,
  hasUserSpoken,
  // isProcessing: unused for now
  onStart,
  onDisconnect,
  onToggleMute,
}: VoiceControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2\">
      <div className="flex items-center gap-3\">
        {connectionState === 'idle' || connectionState === 'error' ? (
          <button
            onClick={onStart}
            className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold animate-pulse\"
          >
            <Phone className="w-6 h-6\" />
            Start Voice Interview
          </button>
        ) : connectionState === 'connecting' ? (
          <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg\">
            <Loader2 className="w-5 h-5 animate-spin\" />
            Connecting...
          </div>
        ) : (
          <>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors\"
            >
              <PhoneOff className="w-4 h-4\" />
              End Call
            </button>
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4\" /> : <Mic className="w-4 h-4\" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </>
        )}
      </div>
      
      {/* Speak-to-start prompt */}
      {(!hasUserSpoken && connectionState !== 'idle') && (
        <div className="flex items-center gap-2 mt-1 text-base text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 animate-pulse\">
          <Mic className="w-4 h-4\" />
          <span className="font-medium\">Begin speaking to begin the interview...</span>
        </div>
      )}
    </div>
  );
}