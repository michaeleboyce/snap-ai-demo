'use client';

import Link from 'next/link';

interface VoiceInstructionsProps {
  connectionState: 'idle' | 'connecting' | 'connected' | 'error';
}

export default function VoiceInstructions({ connectionState }: VoiceInstructionsProps) {
  if (connectionState !== 'idle') return null;

  return (
    <div className="text-center max-w-md space-y-3\">
      {/* Header */}
      <div className="text-center mb-2\">
        <h3 className="text-xl font-bold text-gray-800 mb-2\">🎙️ Ready to Start Your Interview?</h3>
        <p className="text-gray-600\">Click the button below to begin speaking with our AI assistant</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4\">
        <h3 className="font-semibold text-blue-900 mb-2\">Before You Begin</h3>
        <ul className="text-sm text-blue-800 space-y-1 text-left\">
          <li>• You&apos;ll be speaking with an AI assistant</li>
          <li>• The interview takes about 10-15 minutes</li>
          <li>• Have income and expense information ready</li>
          <li>• You can say &quot;I want to speak to a human&quot; at any time</li>
        </ul>
        <div className="mt-2 text-left text-xs">
          <Link href="/terms" className="text-blue-700 underline">View approved terms & disclosures</Link>
        </div>
      </div>

      {/* Final instructions */}
      <p className="text-sm text-gray-600\">
        Click &quot;Start Voice Interview&quot; when you&apos;re ready to begin.
      </p>
      <p className="text-xs text-gray-500\">
        You&apos;ll need to allow microphone access when prompted.
      </p>
    </div>
  );
}