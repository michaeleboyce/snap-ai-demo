import { DollarSign } from 'lucide-react';

interface IncomeSource {
  type?: string;
  amount?: number;
  frequency?: string;
}

interface IncomeData {
  total_monthly?: number;
  verification_needed?: boolean;
  sources?: IncomeSource[];
}

interface IncomeProps {
  data: IncomeData;
}

export default function Income({ data }: IncomeProps) {
  if (!data) return null;
  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-green-600" />
        Income Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900">${data.total_monthly || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Verification Needed</p>
          <p className="text-lg font-semibold">
            {data.verification_needed ? (
              <span className="text-orange-600">Yes</span>
            ) : (
              <span className="text-green-600">No</span>
            )}
          </p>
        </div>
      </div>
      {data.sources && data.sources.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Income Sources:</p>
          <ul className="list-disc list-inside text-sm text-gray-800">
            {data.sources.map((source: IncomeSource, index: number) => (
              <li key={index}>
                {source.type || 'Unknown source'}: ${source.amount || 0} {source.frequency ? `(${source.frequency})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


