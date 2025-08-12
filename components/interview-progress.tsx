'use client';

import { useMemo } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useCoverage } from '@/hooks/useCoverage';

interface InterviewSection {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  questions?: string[];
}

interface InterviewProgressProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onCoverageChange?: (coverage: {
    household: boolean;
    income: boolean;
    expenses: boolean;
    assets: boolean;
    special: boolean;
    complete: boolean;
  }) => void;
}

export default function InterviewProgress({ messages, onCoverageChange }: InterviewProgressProps) {
  // Use centralized coverage management
  const { coverage, isLoading: isLoadingAI, error: aiError, completionPercentage } = useCoverage({ 
    messages, 
    debounceMs: 2000 // Increased debounce for better performance
  });

  // Create base sections structure (static)
  const baseSections: InterviewSection[] = useMemo(() => [
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
        'Do you have any bank or credit union accounts (checking or savings)?',
        'Do you own any vehicles? If so, how many and what are they worth?',
        'Do you have any savings, cash on hand, or retirement accounts (401k/IRA)?',
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
  ], []);

  // Apply AI assessment results to sections
  const sections: InterviewSection[] = useMemo(() => {
    const sectionsWithStatus = baseSections.map(section => ({
      ...section,
      completed: coverage ? !!coverage[section.id as keyof typeof coverage] : false,
    }));
    
    return sectionsWithStatus;
  }, [baseSections, coverage]);

  const completedCount = sections.filter(s => s.completed).length;
  const requiredCount = sections.filter(s => s.required).length;

  // Notify parent of coverage changes
  useMemo(() => {
    if (onCoverageChange && coverage) {
      onCoverageChange(coverage);
    }
  }, [onCoverageChange, coverage]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Interview Progress</h3>
        <span className="text-xs text-gray-500">
          {isLoadingAI ? 'Evaluating with AI…' : aiError ? 'AI evaluation failed' : 'AI assessed'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
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
          <div key={section.id} className="group">
            <div 
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                section.completed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {section.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  section.completed ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {section.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
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
                {requiredCount - completedCount} required section{requiredCount - completedCount !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Please complete all required sections for eligibility determination
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Evaluation Status */}
      {isLoadingAI && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">🤖 AI is evaluating your interview progress...</p>
        </div>
      )}
      
      {aiError && (
        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-700">⚠️ Using fallback evaluation (AI unavailable)</p>
        </div>
      )}
    </div>
  );
}