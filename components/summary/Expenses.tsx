import { Home } from 'lucide-react';

interface ExpensesData {
  rent_mortgage?: number;
  utilities?: number;
  medical?: number;
  total_deductions?: number;
}

interface ExpensesProps {
  data: ExpensesData;
}

export default function Expenses({ data }: ExpensesProps) {
  if (!data) return null;
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Home className="w-6 h-6 text-blue-600" />
        Expenses & Deductions
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Rent/Mortgage</p>
          <p className="text-lg font-semibold">${data.rent_mortgage || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Utilities</p>
          <p className="text-lg font-semibold">${data.utilities || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Medical</p>
          <p className="text-lg font-semibold">${data.medical || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
          <p className="text-lg font-semibold text-blue-600">${data.total_deductions || 0}</p>
        </div>
      </div>
    </div>
  );
}


