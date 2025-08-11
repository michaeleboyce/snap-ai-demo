import { AlertCircle } from 'lucide-react';

interface FlagsProps {
  data: any;
}

export default function Flags({ data }: FlagsProps) {
  if (!data) return null;
  const hasAny = (data.missing_information?.length || 0) > 0 || (data.inconsistencies?.length || 0) > 0 || (data.follow_up_required?.length || 0) > 0;
  if (!hasAny) return null;
  return (
    <div className="border border-orange-200 bg-orange-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center gap-2">
        <AlertCircle className="w-6 h-6" />
        Flags & Follow-ups
      </h2>

      {data.missing_information?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Missing Information:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {data.missing_information.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {data.inconsistencies?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Inconsistencies Detected:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {data.inconsistencies.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {data.follow_up_required?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Follow-up Required:</p>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {data.follow_up_required.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


