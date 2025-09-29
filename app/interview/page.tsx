'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Loader2, ArrowRight, AlertCircle, Phone, CheckCircle } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';
import AppShell from '@/components/app-shell';
import MessageList from '@/components/message-list';
import InterviewProgress from '@/components/interview-progress';
import ConsentDialog from '@/components/consent-dialog';
import dynamic from 'next/dynamic';
import { createInterview, getInterview, saveInterviewCheckpoint } from '@/app/actions/interviews';
import { getDemoScenario } from '@/lib/demo-scenarios';
import Link from 'next/link';
import { getCompletionPercentage } from '@/lib/interview-completion';
import { useCompletion } from '@/hooks/useCompletion';
import { useCoverage } from '@/hooks/useCoverage';

const VoiceInterview = dynamic(() => import('@/components/voice-interview'), {
  ssr: false,
  loading: () => <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isTextMode = searchParams.get('mode') === 'text';
  const resumeSessionId = searchParams.get('resume');
  const demoScenarioId = searchParams.get('demo');
  
  const [sessionId] = useState(() => resumeSessionId || generateSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [transcript] = useState('');
  // Use centralized coverage management
  const { coverage } = useCoverage({ messages });
  const [isLoading, setIsLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  // const [interviewCreated, setInterviewCreated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  
  // Use centralized completion logic
  const {
    isCompleting,
    completionStatus,
    idleWarning,
    isReadyForCompletion,
    completeInterview,
    handleManualComplete,
  } = useCompletion({ sessionId, messages, coverage, hasConsented });

  // Initialize interview - handle resume and demo scenarios
  useEffect(() => {
    const initializeInterview = async () => {
      setIsLoading(true);
      
      try {
        // Handle resume scenario - skip consent for existing interviews
        if (resumeSessionId) {
          const existingInterview = await getInterview(resumeSessionId);
          if (existingInterview && existingInterview.saveState) {
            setHasConsented(true); // They already consented
            // setInterviewCreated(true);
            const savedState = existingInterview.saveState as { transcript?: Array<{role: 'user' | 'assistant', content: string}> };
            if (savedState.transcript) {
              const resumedMessages = savedState.transcript.map(t => ({
                role: t.role,
                content: t.content,
                timestamp: new Date(),
              }));
              setMessages(resumedMessages);
              // Add a resume message
              const resumeMessage: Message = {
                role: 'assistant',
                content: "Welcome back! Let's continue where we left off. " + 
                        (existingInterview.currentSection ? 
                         `We were discussing your ${existingInterview.currentSection}. ` : '') + 
                        "Please continue with your responses.",
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, resumeMessage]);
            }
          } else {
            setResumeError('Could not find or load the previous interview session.');
          }
        }
        // Handle demo scenario - skip consent for demos
        else if (demoScenarioId) {
          setHasConsented(true); // Skip consent for demos
          const scenario = getDemoScenario(demoScenarioId);
          if (scenario) {
            const demoMessages = scenario.initialTranscript.map(t => ({
              role: t.role,
              content: t.content,
              timestamp: new Date(),
            }));
            setMessages(demoMessages);
            // Create interview record for demo
            await createInterview({
              sessionId,
              audioEnabled: !isTextMode,
              demoScenarioId,
            });
            // setInterviewCreated(true);
            setIsDemo(true);
          }
        }
        // New interview - show consent dialog
        else {
          setShowConsent(true);
        }
      } catch (error) {
        console.error('Error initializing interview:', error);
        setResumeError('Failed to initialize interview session.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeInterview();
  }, [isTextMode, resumeSessionId, demoScenarioId, sessionId]);

  // Handle consent acceptance
  const handleConsentAccept = async () => {
    setShowConsent(false);
    setHasConsented(true);
    
    // Initialize welcome message based on mode
    if (isTextMode) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits interview. This should take about 10-15 minutes. Let's start with some basic information. Can you tell me who lives in your household?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
    // Voice mode will start with its own welcome
  };

  // Handle consent decline
  const handleConsentDecline = () => {
    // Redirect to human assistance page or show contact information
    router.push('/contact-human');
  };

  // Removed auto-scroll per request; leave optional via MessageList prop


  // Handle voice transcripts
  const handleVoiceTranscript = useCallback(async (transcript: string, role: 'user' | 'assistant') => {
    const message: Message = {
      role,
      content: transcript,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    
    // Create interview on very first message if it doesn't exist
    if (role === 'user') {
      try {
        const existing = await getInterview(sessionId);
        if (!existing) {
          console.log('[Interview] Creating interview for first voice message:', sessionId);
          await createInterview({
            sessionId,
            audioEnabled: true,
          });
        }
      } catch (error) {
        console.error('[Interview] Error creating interview for voice:', error);
      }
    }
    
    // Only route to human assistance when the USER says it (not when assistant mentions it)
    if (role === 'user') {
      const t = transcript.toLowerCase();
      if (t.includes('speak to a human') || t.includes('talk to a human') || t.includes('human representative')) {
        console.log('[Interview] User requested human assistance');
        // Ask the voice component to perform a graceful handoff (closing message + stop recording)
        const evt = new CustomEvent('interview:request_human');
        window.dispatchEvent(evt);
        return;
      }
    }
    
    // Save transcript periodically using server action
    if (messages.length % 5 === 0 && messages.length > 0) {
      const transcriptData = [...messages, message].map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      // Create interview if it doesn't exist (for new non-demo interviews)
      const saveTranscript = async () => {
        try {
          let existing = await getInterview(sessionId);
          if (!existing) {
            console.log('[Interview] Creating new interview for voice session:', sessionId);
            existing = await createInterview({
              sessionId,
              audioEnabled: true,
            });
          }
          
          if (existing) {
            await saveInterviewCheckpoint(sessionId, transcriptData);
          }
        } catch (error) {
          console.error('[Interview] Error saving transcript:', error);
        }
      };
      
      saveTranscript();
    }
  }, [messages, sessionId]);

  // Send text message
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    // Check for opt-out phrases in text mode
    if (inputText.toLowerCase().includes('speak to a human') || 
        inputText.toLowerCase().includes('talk to a human') ||
        inputText.toLowerCase().includes('human representative')) {
      console.log('[Interview] User requested human assistance');
      router.push('/contact-human');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Create interview on first user message if it doesn't exist
    const existing = await getInterview(sessionId);
    if (!existing) {
      await createInterview({
        sessionId,
        audioEnabled: false,
      });
    }

    try {
      // For text mode, use GPT-4.1 for conversation
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId,
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed keyword-based auto-complete hook. Completion handled by heuristics and manual end.

  // Human handoff ready: navigate after component confirms recording stopped
  useEffect(() => {
    const onReady = () => {
      router.push('/contact-human');
    };
    window.addEventListener('interview:handoff_ready', onReady);
    return () => window.removeEventListener('interview:handoff_ready', onReady);
  }, [router]);


  return (
    <AppShell rightSlot={!isTextMode && isConnected ? (
      <div className="flex items-center gap-2 text-green-700">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium">Voice Connected</span>
      </div>
    ) : null}>
        {/* Consent Dialog */}
        {showConsent && (
          <ConsentDialog
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading interview...</span>
          </div>
        )}
        
        {/* Resume Error */}
        {resumeError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{resumeError}</span>
            </div>
          </div>
        )}
        
        {/* Only show interview UI if consent is given */}
        {!isLoading && hasConsented && (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Container */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg">
          {/* Progress Bar */}
          <div className="border-b px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Interview Progress</span>
              <span className="text-sm text-gray-500">{messages.filter(m => m.role === 'user').length} responses</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${coverage ? getCompletionPercentage(coverage) : 0}%` }}
              />
            </div>
            {completionStatus && (
              <p className="text-xs text-gray-600">{completionStatus}</p>
            )}
          </div>

           {/* Demo Mode Banner */}
           {isDemo && (
             <div className="mx-6 mt-4">
               <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm text-purple-800">
                 Demo Mode: This session uses a scripted starting context.
               </div>
             </div>
           )}

           {/* Idle Warning */}
           {idleWarning && (
             <div className="mx-6 mt-4">
               <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                 {idleWarning}
               </div>
             </div>
           )}

           {/* Completion Ready Banner */}
           {coverage && getCompletionPercentage(coverage) >= 100 && (
             <div className="mx-6 mt-4">
               <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-green-600" />
                 <span className="text-sm text-green-800 font-medium">
                   Interview complete! Click the button below to submit.
                 </span>
               </div>
             </div>
           )}

          {/* Voice Controls (moved higher on the page for visibility) */}
          {!isTextMode && (
            <div className="px-6 pt-4">
              <div className="flex flex-col items-center gap-4">
                <VoiceInterview
                  onTranscript={handleVoiceTranscript}
                  onConnectionChange={setIsConnected}
                  hasConsented={hasConsented}
                  onUserSpeechStart={() => {
                    // placeholder for future UI actions when speech starts
                  }}
                  initialMessages={messages.length > 0 ? messages.map(m => ({ role: m.role, content: m.content })) : undefined}
                />
              </div>
            </div>
          )}

          {/* Messages Area */}
          <MessageList messages={messages} autoScroll={true} />
          {transcript && (
            <div className="px-6 pb-4">
              <div className="bg-slate-50 text-slate-700 rounded-xl px-4 py-3 italic ring-1 ring-slate-900/5">
                <p className="text-sm">{transcript}...</p>
              </div>
            </div>
          )}
          {isProcessing && !transcript && (
            <div className="px-6 pb-4">
              <div className="bg-slate-50 text-slate-700 rounded-xl px-4 py-3 ring-1 ring-slate-900/5 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t px-6 py-4">
            {isTextMode ? (
              // Text Input
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isProcessing}
                />
                <button
                  onClick={sendTextMessage}
                  disabled={isProcessing || !inputText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ) : null}
            
            {/* Complete Interview Button */}
            {isReadyForCompletion && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={completeInterview}
                  disabled={isCompleting}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base"
                >
                  {isCompleting ? 'Processing...' : 'Complete Interview & Generate Summary'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Manual End Interview with confirmation */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleManualComplete}
                disabled={isCompleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
              >
                End Interview
              </button>
            </div>
          </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <InterviewProgress messages={messages} onCoverageChange={() => {}} />

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Interview Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Answer all questions as completely as possible</li>
                <li>• Include all household members who buy and prepare food together</li>
                <li>• Report all sources of income for your household</li>
                <li>• Mention any medical expenses or dependent care costs</li>
              </ul>
            </div>

            {/* Human Assistance Option */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Need Human Assistance?
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                You can request to speak with a human at any time:
              </p>
              <ul className="text-sm text-amber-800 space-y-1 mb-4">
                <li>• Say &quot;I want to speak to a human&quot;</li>
                <li>• Call 1-800-555-SNAP</li>
              </ul>
              <Link
                href="/contact-human"
                className="block w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-center text-sm font-medium"
              >
                Contact Human Representative
              </Link>
            </div>
          </div>
        </div>
        )}
    </AppShell>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin" />}>
      <InterviewContent />
    </Suspense>
  );
}