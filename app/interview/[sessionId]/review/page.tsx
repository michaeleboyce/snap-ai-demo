'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getInterview } from '@/app/actions/interviews';
import AppShell from '@/components/app-shell';
import Link from 'next/link';
import { ArrowLeft, FileText, User, Calendar, Hash, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import InfoCard from '@/components/ui/info-card';
import MessageList from '@/components/message-list';
import type { Interview } from '@/lib/db/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function renderSummaryValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return 'Not provided';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => (
      <div key={index} className="ml-4">
        • {renderSummaryValue(item)}
      </div>
    ));
  }
  if (typeof value === 'object') {
    return (
      <div className="ml-4 space-y-1">
        {Object.entries(value).map(([key, val]) => (
          <div key={key}>
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {renderSummaryValue(val)}
          </div>
        ))}
      </div>
    );
  }
  return JSON.stringify(value);
}

export default function ReviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadInterview() {
      try {
        const data = await getInterview(sessionId);
        setInterview(data);
      } catch (error) {
        console.error('[ReviewPage] Error loading interview:', error);
        setError(error instanceof Error ? error.message : 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    }
    
    if (sessionId) {
      loadInterview();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Interview</h2>
          <p className="text-red-700">{error}</p>
          <Link
            href="/interview-history"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!interview) {
    return (
      <AppShell>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Interview Not Found</h2>
          <p className="text-gray-600 mb-6">The interview session could not be found.</p>
          <Link
            href="/interview-history"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
        </div>
      </AppShell>
    );
  }

  // Parse the transcript
  const messages: Message[] = [];
  
  // First try to get from saveState
  const saveState = interview.saveState as { transcript?: Array<{role: string, content: string}> };
  if (saveState?.transcript) {
    messages.push(...saveState.transcript.map(t => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
      timestamp: new Date()
    })));
  } else if (interview.transcript) {
    // Fallback to parsing the text transcript
    const lines = interview.transcript.split('\n\n');
    lines.forEach(line => {
      const [roleText, ...contentParts] = line.split(': ');
      const content = contentParts.join(': ');
      if (content) {
        const role = roleText.toLowerCase().includes('assistant') || roleText.toLowerCase().includes('interviewer') 
          ? 'assistant' 
          : 'user';
        messages.push({
          role,
          content,
          timestamp: new Date()
        });
      }
    });
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href="/interview-history"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Review</h1>
        <p className="text-gray-600">Review completed interview session</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interview Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Session ID</p>
                  <p className="text-sm font-mono">{interview.sessionId.slice(0, 20)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-sm">{interview.completedAt ? new Date(interview.completedAt).toLocaleString() : 'In Progress'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Applicant</p>
                  <p className="text-sm">{interview.applicantName || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Exchanges</p>
                  <p className="text-sm">{interview.exchangeCount || messages.filter(m => m.role === 'user').length} messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {interview.summary && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Summary</h2>
              <div className="space-y-4">
                {typeof interview.summary === 'string' ? (
                  <p className="text-gray-700">{interview.summary}</p>
                ) : (
                  Object.entries(interview.summary as any).map(([key, value]) => {
                    if (key === 'timestamp' || key === 'totalMessages') return null;
                    return (
                      <div key={key} className="border-b pb-3 last:border-0">
                        <h3 className="font-semibold text-gray-900 capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                        </h3>
                        <div className="text-gray-700 text-sm">
                          {renderSummaryValue(value)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Interview Transcript</h2>
            </div>
            {messages.length > 0 ? (
              <MessageList messages={messages} autoScroll={false} />
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No transcript available
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Collected Information */}
          {(interview.householdSize || interview.monthlyIncome || interview.completedSections) && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Collected Information</h3>
              <div className="space-y-3 text-sm">
                {interview.householdSize && (
                  <div>
                    <p className="text-gray-500">Household Size</p>
                    <p className="font-medium">{interview.householdSize} members</p>
                  </div>
                )}
                {interview.monthlyIncome && (
                  <div>
                    <p className="text-gray-500">Monthly Income</p>
                    <p className="font-medium">${interview.monthlyIncome}</p>
                  </div>
                )}
                {interview.completedSections && (interview.completedSections as string[]).length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-2">Completed Sections</p>
                    <div className="flex flex-wrap gap-1">
                      {(interview.completedSections as string[]).map(section => (
                        <span key={section} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs capitalize">
                          {section}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flags */}
          {interview.flags && (interview.flags as string[]).length > 0 && (
            <InfoCard title="Review Flags" icon={AlertCircle} variant="warning">
              <ul className="space-y-1 text-sm">
                {(interview.flags as string[]).map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Print Interview
              </button>
              {interview.status === 'in_progress' && (
                <Link
                  href={`/interview?resume=${interview.sessionId}`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  Resume Interview
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}