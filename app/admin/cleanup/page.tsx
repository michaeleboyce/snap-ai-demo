import { cleanupEmptyInterviews } from '@/app/actions/cleanup';
import AppShell from '@/components/app-shell';
import { Trash2 } from 'lucide-react';

type CleanupResult = {
  success: boolean;
  deletedCount: number;
  deletedSessions: string[];
  error?: string;
};

export default async function CleanupPage() {
  // Automatically run cleanup on page load
  let result: CleanupResult;
  try {
    result = await cleanupEmptyInterviews();
  } catch (error) {
    console.error('Cleanup error:', error);
    result = {
      success: false,
      deletedCount: 0,
      deletedSessions: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
  
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-8 h-8 text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900">Database Cleanup</h1>
          </div>
          
          {result.success !== false ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Cleanup Complete</h2>
              <p className="text-green-800">
                Successfully deleted <strong>{result.deletedCount}</strong> empty interview sessions.
              </p>
            
            {result.deletedCount > 0 && (
              <div className="mt-3">
                <p className="text-sm text-green-700 font-medium mb-2">Deleted Sessions:</p>
                <div className="bg-white rounded p-2 max-h-48 overflow-y-auto">
                  <ul className="text-xs text-gray-600 space-y-1 font-mono">
                    {result.deletedSessions.map((sessionId, index) => (
                      <li key={index}>{sessionId}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Cleanup Failed</h2>
              <p className="text-red-800">
                Error: {result.error || 'Unknown error occurred'}
              </p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">What was cleaned:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Interview sessions with 0 exchanges</li>
              <li>• Interview sessions with null transcripts</li>
              <li>• Sessions created but never started</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}