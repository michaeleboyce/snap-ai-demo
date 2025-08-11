'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Loader2, ArrowRight } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';
import AppShell from '@/components/app-shell';
import MessageList from '@/components/message-list';
import InterviewProgress from '@/components/interview-progress';
import dynamic from 'next/dynamic';

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
  
  const [sessionId] = useState(() => generateSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [transcript] = useState('');

  // Initialize interview with welcome message for text mode only
  useEffect(() => {
    if (isTextMode) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits interview. This should take about 10-15 minutes. Let's start with some basic information. Can you tell me who lives in your household?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
    // Voice mode greeting is handled by VoiceInterview component
  }, [isTextMode]); // Include isTextMode dependency

  // Removed auto-scroll per request; leave optional via MessageList prop

  // Handle voice transcripts
  const handleVoiceTranscript = useCallback((transcript: string, role: 'user' | 'assistant') => {
    const message: Message = {
      role,
      content: transcript,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    
    // Save transcript periodically
    if (messages.length % 5 === 0) {
      fetch('/api/save-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript: messages.map(m => `${m.role === 'user' ? 'Applicant' : 'Interviewer'}: ${m.content}`).join('\n\n'),
          status: 'in_progress',
          audioEnabled: true,
        }),
      });
    }
  }, [messages, sessionId]);

  // Send text message
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // For text mode, use GPT-4 for conversation
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

  // Generate summary and complete interview
  const completeInterview = async () => {
    setIsProcessing(true);
    
    // Save transcript
    const fullTranscript = messages
      .map(m => `${m.role === 'user' ? 'Applicant' : 'Interviewer'}: ${m.content}`)
      .join('\n\n');

    await fetch('/api/save-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        transcript: fullTranscript,
        status: 'processing',
        audioEnabled: !isTextMode,
      }),
    });

    // Generate summary
    await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        transcript: fullTranscript,
      }),
    });

    // Navigate to summary page
    router.push(`/summary/${sessionId}`);
  };

  return (
    <AppShell rightSlot={!isTextMode && isConnected ? (
      <div className="flex items-center gap-2 text-green-700">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium">Voice Connected</span>
      </div>
    ) : null}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Container */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg">
          {/* Progress Bar */}
          <div className="border-b px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Interview Progress</span>
              <span className="text-sm text-gray-500">{messages.length} exchanges</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((messages.length / 20) * 100, 90)}%` }}
              />
            </div>
          </div>

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
            ) : (
              // Voice Input
              <div className="flex flex-col items-center gap-4">
                <VoiceInterview 
                  onTranscript={handleVoiceTranscript}
                  onConnectionChange={setIsConnected}
                />
              </div>
            )}
            
            {/* Complete Interview Button */}
            {messages.length > 10 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={completeInterview}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Complete Interview & Generate Summary
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Tracker */}
          <InterviewProgress messages={messages} />

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
        </div>
      </div>
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