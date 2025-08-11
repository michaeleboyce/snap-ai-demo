'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, User, DollarSign, Home, FileText, Clock, Search } from 'lucide-react';
import AppShell from '@/components/app-shell';
import InfoCard from '@/components/ui/info-card';

interface Interview {
  id: string;
  sessionId: string;
  completedAt: string;
  status: 'pending_review' | 'approved' | 'denied' | 'needs_info';
  applicantName?: string;
  householdSize?: number;
  monthlyIncome?: number;
  flags?: string[];
}

// Mock data for demo
const mockInterviews: Interview[] = [
  {
    id: '1',
    sessionId: 'session-001',
    completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'pending_review',
    applicantName: 'John Doe',
    householdSize: 3,
    monthlyIncome: 2400,
    flags: ['Income verification needed', 'Medical expenses unclear'],
  },
  {
    id: '2',
    sessionId: 'session-002',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'pending_review',
    applicantName: 'Jane Smith',
    householdSize: 1,
    monthlyIncome: 1200,
    flags: [],
  },
  {
    id: '3',
    sessionId: 'session-003',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'approved',
    applicantName: 'Bob Johnson',
    householdSize: 4,
    monthlyIncome: 3100,
    flags: [],
  },
];

export default function StaffReviewPage() {
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInterviews = interviews.filter(interview => {
    const matchesStatus = filterStatus === 'all' || interview.status === filterStatus;
    const matchesSearch = !searchTerm || 
      interview.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.sessionId.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    pending: interviews.filter(i => i.status === 'pending_review').length,
    approved: interviews.filter(i => i.status === 'approved').length,
    denied: interviews.filter(i => i.status === 'denied').length,
    needsInfo: interviews.filter(i => i.status === 'needs_info').length,
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Review Dashboard</h1>
        <p className="text-gray-600">Review and process SNAP interview applications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Denied</p>
              <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Info</p>
              <p className="text-2xl font-bold text-blue-600">{stats.needsInfo}</p>
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
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="needs_info">Needs Info</option>
          </select>
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
                      Session: {interview.sessionId} • {new Date(interview.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="w-4 h-4" />
                      <span>{interview.householdSize} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${interview.monthlyIncome}/mo</span>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={interview.status} />
                  </div>
                </div>
              </div>
              {interview.flags && interview.flags.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div className="flex gap-2">
                    {interview.flags.map((flag, index) => (
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

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending_review: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    needs_info: 'bg-blue-100 text-blue-800',
  };

  const labels = {
    pending_review: 'Pending Review',
    approved: 'Approved',
    denied: 'Denied',
    needs_info: 'Needs Info',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

interface InterviewDetailModalProps {
  interview: Interview;
  onClose: () => void;
  onStatusChange: (status: Interview['status']) => void;
}

function InterviewDetailModal({ interview, onClose, onStatusChange }: InterviewDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [denialReason, setDenialReason] = useState('');

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
          <InfoCard title="Application Summary" variant="neutral">
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
                <p className="font-semibold">{interview.householdSize} members</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Income</p>
                <p className="font-semibold">${interview.monthlyIncome}</p>
              </div>
            </div>
          </InfoCard>

          {/* Flags */}
          {interview.flags && interview.flags.length > 0 && (
            <InfoCard title="Issues Detected" icon={AlertTriangle} variant="warning">
              <ul className="space-y-2 text-sm">
                {interview.flags.map((flag, index) => (
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
              <p className="text-sm text-gray-600 italic">
                [Full transcript would be displayed here with ability to search and highlight discrepancies]
              </p>
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
                onClick={() => onStatusChange('approved')}
                className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                Approve Application
              </button>
              <button
                onClick={() => onStatusChange('needs_info')}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Request More Info
              </button>
              <button
                onClick={() => {
                  if (denialReason) {
                    onStatusChange('denied');
                  } else {
                    alert('Please provide a denial reason');
                  }
                }}
                className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                Deny Application
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