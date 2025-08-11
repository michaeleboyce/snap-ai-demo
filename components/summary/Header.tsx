interface SummaryHeaderProps {
  sessionId: string;
  completedAt?: string | null;
}

export default function SummaryHeader({ sessionId, completedAt }: SummaryHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Summary</h1>
      <p className="text-gray-600">
        Session ID: <span className="font-mono text-sm">{sessionId}</span>
      </p>
      <p className="text-gray-600">
        Completed: {completedAt ? new Date(completedAt).toLocaleString() : 'Processing...'}
      </p>
    </div>
  );
}


