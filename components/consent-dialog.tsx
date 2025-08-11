'use client';

import { useState } from 'react';
import { CheckCircle, Phone, Bot, Shield, Clock, User, Info, Lock, ArrowRight } from 'lucide-react';

interface ConsentDialogProps {
  onAccept: () => void;
  onDecline: () => void;
  language?: 'en' | 'es';
}

export default function ConsentDialog({ onAccept, onDecline, language = 'en' }: ConsentDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);

  const handleProceed = () => {
    if (understood && consentGiven) {
      onAccept();
    }
  };

  const content = {
    en: {
      title: 'Welcome to the SNAP Interview Assistant',
      subtitle: 'Connecticut Department of Social Services',
      intro: 'This interview uses artificial intelligence (AI) to help you apply for SNAP benefits. Before we begin, please review the following important information.',
      benefits: {
        title: 'Benefits of AI Assistant',
        items: [
          'Available 24/7 to assist you',
          'No wait times - start immediately',
          'Consistent and accurate information gathering',
          'Private and secure conversation'
        ]
      },
      howItWorks: {
        title: 'How It Works',
        items: [
          'The AI will ask you questions about your household and income',
          'Your responses are recorded and transcribed',
          'A human caseworker reviews all applications',
          'Final eligibility decisions are made by qualified staff'
        ]
      },
      privacy: {
        title: 'Your Privacy & Rights',
        items: [
          'All information is kept strictly confidential',
          'Data is encrypted and securely stored',
          'You can request human assistance at any time',
          'You have the right to review and correct your information'
        ]
      },
      optOut: {
        title: 'Opt-Out Options',
        text: 'You can speak to a human representative at any time by:',
        options: [
          'Saying "I want to speak to a human" during the interview',
          'Calling our helpline at 1-855-6-CONNECT',
          'Visiting your local DSS office'
        ]
      },
      terms: {
        title: 'Terms of Use',
        content: [
          'By proceeding with this AI-assisted interview, you acknowledge and agree to the following:',
          '1. AI Assistant Disclosure: You understand that you will be interacting with an artificial intelligence system designed to conduct SNAP eligibility interviews. This AI assistant is not a human but has been trained to follow Connecticut DSS guidelines.',
          '2. Recording & Quality Assurance: Your interview will be recorded and transcribed for quality assurance purposes. These recordings help ensure accuracy and improve our services.',
          '3. Human Review: All information collected will be reviewed by qualified DSS staff who will make the final eligibility determination. The AI does not make decisions about your benefits.',
          '4. Data Privacy: Your personal information will be protected according to state and federal privacy laws. We will not share your information except as required for benefit administration.',
          '5. Voluntary Participation: Using the AI assistant is voluntary. You may request a traditional interview with a human caseworker at any time.',
          '6. Accuracy of Information: You agree to provide accurate and complete information. Providing false information may affect your eligibility and could result in penalties.'
        ],
        scrollPrompt: 'Please scroll to read all terms'
      },
      consent: {
        understand: 'I understand that I am speaking with an AI assistant',
        agree: 'I consent to proceed with the AI-assisted interview',
        button: 'Begin Interview',
        decline: 'Request Human Interview'
      },
      footer: 'By proceeding, you acknowledge that this is an AI-powered system and that your responses will be reviewed by human staff for final determination.',
      estimatedTime: 'Estimated interview time: 10-15 minutes'
    }
  };

  const t = content[language];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-blue-100">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700">{t.intro}</p>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {t.benefits.title}
            </h2>
            <ul className="space-y-2">
              {t.benefits.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How It Works */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              {t.howItWorks.title}
            </h2>
            <ol className="space-y-2">
              {t.howItWorks.items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Privacy */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              {t.privacy.title}
            </h2>
            <ul className="space-y-2">
              {t.privacy.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms of Use */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t.terms.title}</h2>
            <div 
              className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50"
              onScroll={(e) => {
                const el = e.target as HTMLDivElement;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 10) {
                  setHasScrolledTerms(true);
                }
              }}
            >
              <div className="text-sm text-gray-600 space-y-2">
                {t.terms.content.map((paragraph, index) => (
                  <p key={index} className={index === 0 ? 'font-medium' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
              {!hasScrolledTerms && (
                <p className="text-xs text-gray-500 mt-4 text-center">{t.terms.scrollPrompt}</p>
              )}
            </div>
          </div>

          {/* Opt-Out Options */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              {t.optOut.title}
            </h2>
            <p className="text-gray-700 mb-3">{t.optOut.text}</p>
            <ul className="space-y-2">
              {t.optOut.options.map((option, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">▸</span>
                  <span className="text-gray-700">{option}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-700" />
              <span className="font-semibold text-amber-900">1-855-6-CONNECT</span>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 border-t pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <span className="text-gray-700">{t.consent.understand}</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <span className="text-gray-700">{t.consent.agree}</span>
            </label>
          </div>

          {/* Footer Text */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{t.estimatedTime}</span>
          </div>
          <p className="text-sm text-gray-600 italic">{t.footer}</p>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {t.consent.decline}
            </button>
            <button
              onClick={handleProceed}
              disabled={!understood || !consentGiven || !hasScrolledTerms}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                understood && consentGiven && hasScrolledTerms
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t.consent.button}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}