import { Users } from 'lucide-react';

interface HouseholdMember {
  name?: string;
  age?: number;
  relationship?: string;
}

interface HouseholdData {
  size?: number;
  composition_notes?: string;
  members?: HouseholdMember[];
}

interface HouseholdProps {
  data: HouseholdData;
}

export default function Household({ data }: HouseholdProps) {
  if (!data) return null;
  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-600" />
        Household Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Household Size</p>
          <p className="text-2xl font-bold text-gray-900">{data.size || 0} people</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Composition Notes</p>
          <p className="text-sm text-gray-800">{data.composition_notes || 'No special notes'}</p>
        </div>
      </div>
      {data.members && data.members.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Members:</p>
          <ul className="list-disc list-inside text-sm text-gray-800">
            {data.members.map((member: HouseholdMember, index: number) => (
              <li key={index}>
                {member.name || 'Unknown'} - Age: {member.age || 'N/A'}, Relationship: {member.relationship || 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


