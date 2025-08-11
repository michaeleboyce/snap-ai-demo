interface ProgressBarProps {
  exchangesCount: number;
}

export default function ProgressBar({ exchangesCount }: ProgressBarProps) {
  const widthPercent = Math.min((exchangesCount / 20) * 100, 90);
  return (
    <div className="border-b px-6 py-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Interview Progress</span>
        <span className="text-sm text-gray-500">{exchangesCount} exchanges</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}


