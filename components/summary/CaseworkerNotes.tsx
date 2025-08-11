import { FileText } from 'lucide-react';

interface CaseworkerNotesProps {
  notes?: string;
}

export default function CaseworkerNotes({ notes }: CaseworkerNotesProps) {
  if (!notes) return null;
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-6 h-6 text-gray-600" />
        Caseworker Quick Review
      </h2>
      <p className="text-gray-700">{notes}</p>
    </div>
  );
}


