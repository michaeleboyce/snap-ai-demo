import { Send } from 'lucide-react';

interface TextInputProps {
  value: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function TextInput({ value, isProcessing, onChange, onSend }: TextInputProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSend()}
        placeholder="Type your response..."
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        disabled={isProcessing}
      />
      <button
        onClick={onSend}
        disabled={isProcessing || !value.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}


