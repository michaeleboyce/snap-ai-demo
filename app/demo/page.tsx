import { demoScenarios } from '@/lib/demo-scenarios';
import AppShell from '@/components/app-shell';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export default function DemoPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Scenarios</h1>
        <p className="text-gray-600">Select a pre-configured scenario to test the SNAP interview assistant</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demoScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{scenario.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{scenario.name}</h3>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Initial Context:</p>
                <p className="text-sm text-gray-600 italic line-clamp-3">
                  &quot;{scenario.initialTranscript[1]?.content || scenario.initialTranscript[0]?.content}&quot;
                </p>
              </div>

              {scenario.suggestedResponses && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Suggested Responses:</p>
                  <div className="space-y-1">
                    {scenario.suggestedResponses.slice(0, 2).map((response, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                        • {response}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/interview?demo=${scenario.id}&mode=text`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <PlayCircle className="w-4 h-4" />
                  Text Mode
                </Link>
                <Link
                  href={`/interview?demo=${scenario.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <PlayCircle className="w-4 h-4" />
                  Voice Mode
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Demo Mode Information</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Demo scenarios start with pre-filled context to speed up testing</li>
          <li>• Each scenario represents a common SNAP applicant profile</li>
          <li>• Suggested responses help guide the conversation flow</li>
          <li>• All demo interviews are saved and can be reviewed later</li>
        </ul>
      </div>
    </AppShell>
  );
}