'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { evaluateCoverageAction } from '@/app/actions/evaluate-coverage';

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
  const [aiSections, setAISections] = useState<Record<string, boolean> | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  const transcriptText = useMemo(() => {
    return messages
      .map((m) => `${m.role === 'user' ? 'Applicant' : 'Interviewer'}: ${m.content}`)
      .join('\n\n');
  }, [messages]);

  useEffect(() => {
    if (!transcriptText) {
      setAISections(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoadingAI(true);
        setAIError(null);
        const sections = await evaluateCoverageAction(transcriptText);
        if (cancelled) return;
        setAISections(sections as unknown as Record<string, boolean>);
      } catch (err) {
        if (cancelled) return;
        setAIError(err instanceof Error ? err.message : 'Failed to evaluate');
        setAISections(null);
      } finally {
        if (!cancelled) setIsLoadingAI(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [transcriptText]);
  // Advanced content analysis using multiple patterns and context
  const analyzeContent = (transcript: string, patterns: RegExp[], keywords: string[]): boolean => {
    // Check for any pattern match
    for (const pattern of patterns) {
      if (pattern.test(transcript)) return true;
    }
    // Check for multiple keyword presence (at least 2)
    let keywordCount = 0;
    for (const keyword of keywords) {
      if (transcript.includes(keyword)) keywordCount++;
    }
    return keywordCount >= 2;
  };

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

  // Analyze messages to determine completed sections with advanced NLP
  
  // Split into user and assistant messages for better context
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase()).join(' ');
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content.toLowerCase()).join(' ');

  // Check household section with sophisticated patterns
  const householdSection = sections.find(s => s.id === 'household');
  if (householdSection) {
    const householdPatterns = [
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(people?|person|members?|individuals?)\b/i,
      /\b(live|living|reside|stay)\s*(alone|by myself|with|together)\b/i,
      /\b(household|family|home)\s*(size|members?|composition)\b/i,
      /\b(myself|me|my spouse|my (child|children|kids?|son|daughter|parent|mother|father))\b/i
    ];
    const householdKeywords = ['household', 'family', 'live', 'members', 'people', 'children', 'spouse', 'alone', 'together', 'home'];
    
    // Check if question was asked and answered
    const questionAsked = assistantMessages.includes('household') || assistantMessages.includes('who lives') || assistantMessages.includes('who buys');
    const hasAnswer = analyzeContent(userMessages, householdPatterns, householdKeywords);
    
    householdSection.completed = questionAsked && hasAnswer;
  }

  // Check income section with detailed patterns
  const incomeSection = sections.find(s => s.id === 'income');
  if (incomeSection) {
    const incomePatterns = [
      /\$?\d{1,3}(,\d{3})*(\.\d{2})?\s*(per|a|an?)\s*(hour|week|month|year)/i,
      /\b(earn|make|receive|get|paid)\s*\$?\d+/i,
      /\b(unemployed|no income|don't work|not working|retired)\b/i,
      /\b(social security|disability|ssi|ssdi|unemployment|welfare|tanf|snap)\b/i,
      /\b(salary|wage|income|pay|earnings?)\s*(is|are|:|of)?\s*\$?\d+/i
    ];
    const incomeKeywords = ['income', 'earn', 'work', 'job', 'salary', 'wage', 'benefits', 'unemployed', 'retired', 'disability'];
    
    const questionAsked = assistantMessages.includes('income') || assistantMessages.includes('earn') || assistantMessages.includes('work');
    const hasAnswer = analyzeContent(userMessages, incomePatterns, incomeKeywords);
    
    incomeSection.completed = questionAsked && hasAnswer;
  }

  // Check expenses section with comprehensive patterns
  const expenseSection = sections.find(s => s.id === 'expenses');
  if (expenseSection) {
    const expensePatterns = [
      /\b(rent|mortgage)\s*(is|:|costs?)?\s*\$?\d+/i,
      /\b(pay|spend|costs?)\s*\$?\d+\s*(for|on)\s*(rent|utilities|electric|gas|heat)/i,
      /\$?\d{2,4}\s*(for|in)?\s*(rent|mortgage|utilities|bills)/i,
      /\b(utilities?|electric|gas|heat|water|phone)\s*(bill|cost|payment)?\s*(is|are|:|costs?)?\s*\$?\d+/i
    ];
    const expenseKeywords = ['rent', 'mortgage', 'utilities', 'electric', 'gas', 'heat', 'water', 'expense', 'cost', 'pay', 'bill'];
    
    const questionAsked = assistantMessages.includes('rent') || assistantMessages.includes('mortgage') || assistantMessages.includes('utilities') || assistantMessages.includes('expenses');
    const hasAnswer = analyzeContent(userMessages, expensePatterns, expenseKeywords);
    
    expenseSection.completed = questionAsked && hasAnswer;
  }

  // Check assets section with detailed validation
  const assetSection = sections.find(s => s.id === 'assets');
  if (assetSection) {
    const assetPatterns = [
      /\b(have|own|don't have|no)\s*(a)?\s*(bank|checking|savings)\s*accounts?/i,
      /\b(car|vehicle|truck|van)\s*(worth|valued|costs?)?\s*\$?\d*/i,
      /\b(savings?|assets?|property|properties)\s*(of|worth|valued)?\s*\$?\d*/i,
      /\b(no savings|no assets|don't own|nothing saved)\b/i
    ];
    const assetKeywords = ['bank', 'savings', 'checking', 'vehicle', 'car', 'assets', 'property', 'account', 'own'];
    
    const questionAsked = assistantMessages.includes('bank') || assistantMessages.includes('savings') || assistantMessages.includes('vehicle') || assistantMessages.includes('assets');
    const hasAnswer = analyzeContent(userMessages, assetPatterns, assetKeywords);
    
    assetSection.completed = questionAsked && hasAnswer;
  }

  // Check special circumstances with nuanced detection
  const specialSection = sections.find(s => s.id === 'special');
  if (specialSection) {
    const specialPatterns = [
      /\b(disabled|disability|handicapped|impaired)\b/i,
      /\b(elderly|senior|\d{2}\s*years?\s*old|over\s*60|sixty)\b/i,
      /\b(pregnant|expecting|baby on the way)\b/i,
      /\b(student|school|college|university|education)\b/i,
      /\b(yes|no)\s*(disabled|elderly|pregnant|student)/i
    ];
    const specialKeywords = ['disabled', 'disability', 'elderly', 'pregnant', 'student', 'school', 'medical', 'condition'];
    
    const questionAsked = assistantMessages.includes('disabled') || assistantMessages.includes('elderly') || 
                         assistantMessages.includes('pregnant') || assistantMessages.includes('student') ||
                         assistantMessages.includes('special circumstances');
    const hasAnswer = analyzeContent(userMessages, specialPatterns, specialKeywords) || 
                     (questionAsked && (userMessages.includes('no') || userMessages.includes('none')));
    
    specialSection.completed = questionAsked && hasAnswer;
  }

  // If AI provided a judgment, override heuristic completion values
  if (aiSections) {
    for (const section of sections) {
      if (section.id in aiSections) {
        section.completed = !!aiSections[section.id];
      }
    }
  }

  const completedCount = sections.filter(s => s.completed).length;
  const requiredCount = sections.filter(s => s.required).length;
  const completionPercentage = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Interview Progress</h3>
        <span className="text-xs text-gray-500">
          {isLoadingAI ? 'Evaluating with AI…' : aiError ? 'Using heuristic estimate' : 'AI assessed'}
        </span>
      </div>
      
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