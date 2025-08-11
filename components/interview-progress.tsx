'use client';

import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface InterviewSection {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  questions: string[];
}

interface InterviewProgressProps {
  messages: Array<{ role: string; content: string }>;
}

export default function InterviewProgress({ messages }: InterviewProgressProps) {
  const sections: InterviewSection[] = [
    {
      id: 'household',
      label: 'Household Composition',
      completed: false,
      required: true,
      questions: [
        'How many people live in your household?',
        'What are their ages?',
        'What is their relationship to you?',
      ],
    },
    {
      id: 'income',
      label: 'Income Information',
      completed: false,
      required: true,
      questions: [
        'Do you or anyone in your household work?',
        'How much do you earn?',
        'Do you receive any benefits?',
      ],
    },
    {
      id: 'expenses',
      label: 'Monthly Expenses',
      completed: false,
      required: true,
      questions: [
        'How much is your rent/mortgage?',
        'What are your utility costs?',
        'Do you have medical expenses?',
      ],
    },
    {
      id: 'assets',
      label: 'Assets & Resources',
      completed: false,
      required: true,
      questions: [
        'Do you have a bank account?',
        'Do you own a vehicle?',
        'Do you have any savings?',
      ],
    },
    {
      id: 'special',
      label: 'Special Circumstances',
      completed: false,
      required: false,
      questions: [
        'Is anyone disabled?',
        'Is anyone elderly (60+)?',
        'Is anyone pregnant?',
        'Are there students?',
      ],
    },
  ];

  // Analyze messages to determine completed sections
  const transcript = messages.map(m => m.content).join(' ').toLowerCase();

  // Check household section
  if (transcript.includes('household') || transcript.includes('people live') || 
      transcript.includes('family') || transcript.includes('members')) {
    const householdSection = sections.find(s => s.id === 'household');
    if (householdSection && (
      transcript.match(/\d+\s*(people|person|member)/i) ||
      transcript.includes('live alone') ||
      transcript.includes('by myself')
    )) {
      householdSection.completed = true;
    }
  }

  // Check income section
  if (transcript.includes('income') || transcript.includes('earn') || 
      transcript.includes('work') || transcript.includes('job') ||
      transcript.includes('salary') || transcript.includes('wage')) {
    const incomeSection = sections.find(s => s.id === 'income');
    if (incomeSection && transcript.match(/\$?\d+/)) {
      incomeSection.completed = true;
    }
  }

  // Check expenses section
  if (transcript.includes('rent') || transcript.includes('utilities') || 
      transcript.includes('expense') || transcript.includes('cost')) {
    const expenseSection = sections.find(s => s.id === 'expenses');
    if (expenseSection && transcript.match(/\$?\d+/)) {
      expenseSection.completed = true;
    }
  }

  // Check assets section
  if (transcript.includes('bank') || transcript.includes('savings') || 
      transcript.includes('vehicle') || transcript.includes('car') ||
      transcript.includes('assets') || transcript.includes('property')) {
    const assetSection = sections.find(s => s.id === 'assets');
    if (assetSection) {
      assetSection.completed = true;
    }
  }

  // Check special circumstances
  if (transcript.includes('disabled') || transcript.includes('elderly') || 
      transcript.includes('pregnant') || transcript.includes('student') ||
      transcript.includes('60') || transcript.includes('sixty')) {
    const specialSection = sections.find(s => s.id === 'special');
    if (specialSection) {
      specialSection.completed = true;
    }
  }

  const completedCount = sections.filter(s => s.completed).length;
  const requiredCount = sections.filter(s => s.required).length;
  const completionPercentage = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Interview Progress</h3>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{completedCount} of {sections.length} sections</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
              section.completed ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            {section.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : section.required ? (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  section.completed ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {section.label}
                </span>
                {section.required && !section.completed && (
                  <span className="text-xs text-red-600 font-medium">Required</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {completedCount < requiredCount && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-900 font-medium">
                {requiredCount - sections.filter(s => s.required && s.completed).length} required sections remaining
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Please complete all required sections to determine eligibility
              </p>
            </div>
          </div>
        </div>
      )}

      {completionPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-900 font-medium">
                Interview Complete!
              </p>
              <p className="text-xs text-green-700 mt-1">
                All sections have been covered. You can now generate the summary.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}