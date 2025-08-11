import { listInterviews } from '@/app/actions/interviews';
import AppShell from '@/components/app-shell';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, PlayCircle, FileText, Calendar } from 'lucide-react';

export default async function InterviewHistoryPage() {
  const interviews = await listInterviews();
  
  const statusConfig = {
    in_progress: {
      label: 'In Progress',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      borderColor: 'border-amber-200',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
      borderColor: 'border-green-200',
    },
    abandoned: {
      label: 'Abandoned',
      icon: XCircle,
      color: 'text-gray-600 bg-gray-50',
      borderColor: 'border-gray-200',
    },
    error: {
      label: 'Error',
      icon: XCircle,
      color: 'text-red-600 bg-red-50',
      borderColor: 'border-red-200',
    },
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview History</h1>
        <p className="text-gray-600">View and resume your past SNAP interview sessions</p>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Interviews Yet</h2>
          <p className="text-gray-600 mb-6">Start your first interview to begin the SNAP application process</p>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Start New Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const config = statusConfig[interview.status as keyof typeof statusConfig] || statusConfig.error;
            const StatusIcon = config.icon;
            
            return (
              <div
                key={interview.id}
                className={`bg-white rounded-lg shadow-sm border ${config.borderColor} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                      </span>
                      {interview.demoScenarioId && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Demo: {interview.demoScenarioId}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {interview.applicantName || 'Interview'} - Session {interview.sessionId.slice(0, 8)}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Started: {new Date(interview.startedAt).toLocaleString()}
                      </span>
                      {interview.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Completed: {new Date(interview.completedAt).toLocaleString()}
                        </span>
                      )}
                      {interview.exchangeCount !== null && interview.exchangeCount > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {interview.exchangeCount} exchanges
                        </span>
                      )}
                    </div>
                    
                    {(interview.householdSize || interview.monthlyIncome) && (
                      <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                        {interview.householdSize && (
                          <span>Household Size: <strong>{interview.householdSize}</strong></span>
                        )}
                        {interview.monthlyIncome && (
                          <span>Monthly Income: <strong>${interview.monthlyIncome}</strong></span>
                        )}
                      </div>
                    )}
                    
                    {interview.completedSections && interview.completedSections.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Completed Sections:</span>
                        <div className="flex gap-2 mt-1">
                          {(interview.completedSections as string[]).map((section) => (
                            <span
                              key={section}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize"
                            >
                              {section}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {interview.flags && (interview.flags as string[]).length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <span>⚠️ Flags:</span>
                        {(interview.flags as string[]).map((flag, i) => (
                          <span key={i} className="text-amber-700">{flag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {interview.status === 'in_progress' && (
                      <Link
                        href={`/interview?resume=${interview.sessionId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Resume
                      </Link>
                    )}
                    {interview.status === 'completed' && (
                      <Link
                        href={`/interview/${interview.sessionId}/review`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}