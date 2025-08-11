import { CheckCircle } from 'lucide-react';

interface EligibilityData {
  likely_eligible?: boolean;
  expedited_qualifying?: boolean;
  confidence_score?: number;
  reasons?: string[];
}

interface EligibilityProps {
  data: EligibilityData;
}

export default function Eligibility({ data }: EligibilityProps) {
  if (!data) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
        <CheckCircle className="w-6 h-6" />
        Eligibility Assessment
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Likely Eligible</p>
          <p className="text-lg font-semibold">
            {data.likely_eligible ? (
              <span className="text-green-600">Yes</span>
            ) : (
              <span className="text-red-600">No</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Expedited Qualifying</p>
          <p className="text-lg font-semibold">
            {data.expedited_qualifying ? (
              <span className="text-orange-600">Yes - Fast Track</span>
            ) : (
              <span className="text-gray-600">No</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
          <p className="text-lg font-semibold">{data.confidence_score || 0}%</p>
        </div>
      </div>
      {data.reasons && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Key Factors:</p>
          <ul className="list-disc list-inside text-sm text-gray-800">
            {data.reasons.map((reason: string, index: number) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


