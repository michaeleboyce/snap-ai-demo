'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, User, DollarSign, Home, FileText, Clock, Search, Download } from 'lucide-react';
import AppShell from '@/components/app-shell';
import InfoCard from '@/components/ui/info-card';
import StatusBadge from '@/components/ui/StatusBadge';
import { listInterviews, updateInterviewStatus } from '@/app/actions/interviews';
import type { Interview as DBInterview } from '@/lib/db/schema';

export default function StaffReviewPage() {
  const [interviews, setInterviews] = useState<DBInterview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<DBInterview | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function exportToCSV() {
    const headers = ['Session ID', 'Applicant Name', 'Status', 'Household Size', 'Monthly Income', 'Started At', 'Completed At', 'Flags'];
    const rows = filteredInterviews.map(i => [
      i.sessionId,
      i.applicantName || 'N/A',
      i.status || 'in_progress',
      i.householdSize || 'N/A',
      i.monthlyIncome || 'N/A',
      i.startedAt ? new Date(i.startedAt).toLocaleString() : 'N/A',
      i.completedAt ? new Date(i.completedAt).toLocaleString() : 'N/A',
      i.flags && (i.flags as string[]).length > 0 ? (i.flags as string[]).join('; ') : 'None'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SNAP_Applications_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await listInterviews();
        setInterviews(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredInterviews = interviews.filter(interview => {
    const matchesStatus = filterStatus === 'all' || ((interview.status as string) || 'in_progress') === filterStatus;
    const matchesSearch = !searchTerm ||
      (interview.applicantName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      interview.sessionId.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = useMemo(() => ({
    in_progress: interviews.filter(i => (i.status as string) === 'in_progress').length,
    completed: interviews.filter(i => (i.status as string) === 'completed').length,
    abandoned: interviews.filter(i => (i.status as string) === 'abandoned').length,
    error: interviews.filter(i => (i.status as string) === 'error').length,
  }), [interviews]);

  return (
    <AppShell>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">{error}</div>
      )}
      {loading && (
        <div className="mb-4 text-gray-600">Loading interviews…</div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Review Dashboard</h1>
        <p className="text-gray-600">Review and process SNAP interview applications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-700">{stats.in_progress}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abandoned</p>
              <p className="text-2xl font-bold text-red-600">{stats.abandoned}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error</p>
              <p className="text-2xl font-bold text-blue-600">{stats.error}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or session ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Interview List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Interview Applications</h2>
        </div>
        <div className="divide-y">
      {filteredInterviews.map((interview) => (
            <div
            key={interview.id}
              className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedInterview(interview)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                  {interview.applicantName || 'Unknown Applicant'}
                    </h3>
                    <p className="text-sm text-gray-600">
                  Session: {interview.sessionId} • {interview.completedAt ? new Date(interview.completedAt).toLocaleString() : 'In Progress'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="w-4 h-4" />
                  <span>{interview.householdSize ?? '—'} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                  <span>{interview.monthlyIncome ? `$${interview.monthlyIncome}/mo` : '—'}</span>
                    </div>
                  </div>
                  <div>
                <StatusBadge status={(interview.status as any) || 'in_progress'} />
                  </div>
                </div>
              </div>
          {interview.flags && (interview.flags as string[]).length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div className="flex gap-2">
                {(interview.flags as string[]).map((flag, index) => (
                      <span key={index} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Interview Detail Modal */}
      {selectedInterview && (
        <InterviewDetailModal
          interview={selectedInterview}
          onClose={() => setSelectedInterview(null)}
          onStatusChange={(newStatus) => {
            setInterviews(prev => prev.map(i =>
              i.id === selectedInterview.id ? { ...i, status: newStatus } : i
            ));
            setSelectedInterview(null);
          }}
        />
      )}
    </AppShell>
  );
}

// StatusBadge component is now imported from ui/StatusBadge.tsx

interface InterviewDetailModalProps {
  interview: DBInterview;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

function InterviewDetailModal({ interview, onClose, onStatusChange }: InterviewDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === 'denied' && !denialReason) {
      alert('Please provide a denial reason');
      return;
    }

    setIsSaving(true);
    try {
      // Save to database
      await updateInterviewStatus(
        interview.id,
        newStatus,
        notes || undefined,
        newStatus === 'denied' ? denialReason : undefined
      );
      
      // Update local state
      onStatusChange(newStatus);
      
      // Generate determination letter if approved/denied
      if (newStatus === 'approved' || newStatus === 'denied') {
        generateDeterminationLetter(interview, newStatus, notes, denialReason);
      }
    } catch (error) {
      console.error('Error updating interview status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function generateDeterminationLetter(
    interview: DBInterview, 
    status: string, 
    notes: string, 
    reason?: string
  ) {
    // Create letter content
    const letterDate = new Date().toLocaleDateString();
    const letterContent = `
CONNECTICUT DEPARTMENT OF SOCIAL SERVICES
SNAP BENEFITS DETERMINATION LETTER

Date: ${letterDate}
Case ID: ${interview.sessionId}
Applicant: ${interview.applicantName || 'Not Provided'}

Dear Applicant,

RE: SNAP Benefits Application ${status === 'approved' ? 'APPROVAL' : 'DENIAL'}

${status === 'approved' ? 
`We are pleased to inform you that your application for SNAP benefits has been APPROVED.

Based on the information provided:
- Household Size: ${interview.householdSize || 'N/A'} members
- Monthly Income: $${interview.monthlyIncome || 'N/A'}

Your benefits will begin on the first of next month. You will receive your EBT card within 7-10 business days.

Important Next Steps:
1. Watch for your EBT card in the mail
2. Call 1-800-997-2555 to activate your card
3. Report any changes in income or household size immediately` 
: 
`We regret to inform you that your application for SNAP benefits has been DENIED.

Reason for Denial: ${reason || 'Eligibility requirements not met'}

${notes ? `Additional Information: ${notes}` : ''}

Your Right to Appeal:
You have the right to appeal this decision within 90 days. To request a fair hearing:
- Call: 1-855-6-CONNECT
- Write to: DSS Fair Hearing Unit, 55 Farmington Ave, Hartford, CT 06105
- Visit your local DSS office`}

${notes && status === 'approved' ? `\nCase Notes: ${notes}` : ''}

If you have questions about this determination, please contact:
Phone: 1-855-6-CONNECT (1-855-626-6632)
Website: www.ct.gov/dss

Sincerely,

Connecticut Department of Social Services
SNAP Benefits Unit

This determination was made on ${letterDate} following review of your AI-assisted interview completed on ${interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'N/A'}.
    `.trim();

    // Create and download the letter
    const blob = new Blob([letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SNAP_Determination_${interview.sessionId}_${status}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderSummaryValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) return 'Not provided';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return (
      <div className="ml-4 space-y-1">
        {value.map((item, idx) => (<div key={idx}>• {renderSummaryValue(item)}</div>))}
      </div>
    );
    if (typeof value === 'object') return (
      <div className="ml-4 space-y-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}><span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span> {renderSummaryValue(v)}</div>
        ))}
      </div>
    );
    return JSON.stringify(value);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Review Application</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Application Summary */}
          <div className="border rounded-lg p-4 bg-gray-50 border-gray-200 text-gray-900">
            <h3 className="font-semibold mb-3 flex items-center gap-2">Application Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Applicant Name</p>
                <p className="font-semibold">{interview.applicantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Session ID</p>
                <p className="font-mono text-sm">{interview.sessionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Household Size</p>
                <p className="font-semibold">{interview.householdSize ?? '—'} members</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="font-semibold">{interview.monthlyIncome ? `$${interview.monthlyIncome}` : '—'}</p>
              </div>
            </div>
          </div>

          {/* AI Summary (real data) */}
          {Boolean(interview.summary) && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
              <div className="text-sm text-gray-700 space-y-2">
                {typeof interview.summary === 'string' ? (
                  <p>{interview.summary}</p>
                ) : (
                  Object.entries(interview.summary as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="border-b pb-2 last:border-0">
                      <div className="font-medium capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</div>
                      {renderSummaryValue(value)}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Flags */}
          {interview.flags && (interview.flags as string[]).length > 0 && (
            <InfoCard title="Issues Detected" icon={AlertTriangle} variant="warning">
              <ul className="space-y-2 text-sm">
                {(interview.flags as string[]).map((flag, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          )}

          {/* Transcript Preview */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Interview Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {interview.transcript ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{interview.transcript}</pre>
              ) : (
                <p className="text-sm text-gray-600 italic">No transcript available</p>
              )}
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={isSaving}
                className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Processing...' : 'Approve Application'}
              </button>
              <button
                onClick={() => handleStatusChange('needs_info')}
                disabled={isSaving}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Processing...' : 'Request More Info'}
              </button>
              <button
                onClick={() => handleStatusChange('denied')}
                disabled={isSaving}
                className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Processing...' : 'Deny Application'}
              </button>
            </div>
            
            {/* Denial Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                If denying, provide reason:
              </label>
              <select
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select reason...</option>
                <option value="income_exceeds">Income exceeds limits</option>
                <option value="incomplete_info">Incomplete information</option>
                <option value="ineligible_status">Ineligible immigration status</option>
                <option value="assets_exceed">Assets exceed limits</option>
                <option value="other">Other (specify in notes)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}