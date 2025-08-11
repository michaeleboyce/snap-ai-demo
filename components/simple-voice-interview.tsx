'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SimpleVoiceInterviewProps {
  onTranscript: (transcript: string, role: 'user' | 'assistant') => void;
  sessionId: string;
  messages?: Array<{ role: string; content: string }>;
}

export default function SimpleVoiceInterview({ onTranscript, sessionId, messages = [] }: SimpleVoiceInterviewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    // Send initial greeting only once, and only if we haven't already
    if (!hasGreetedRef.current && messages.length === 0) {
      hasGreetedRef.current = true;
      const timer = setTimeout(() => {
        const greeting = "Hello! I'm here to help you with your SNAP benefits interview. This should take about 10-15 minutes. Let's start with some basic information. Can you tell me who lives in your household?";
        onTranscript(greeting, 'assistant');
        // Speak the greeting
        speakText(greeting);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency array ensures this only runs once

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Please allow microphone access to use voice interview');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    console.log('Processing audio blob, size:', audioBlob.size);
    
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        console.log('Sending audio to API, base64 length:', base64Audio?.length);
        
        if (!base64Audio) {
          console.error('Failed to convert audio to base64');
          setIsProcessing(false);
          return;
        }
        
        // Send to our API for transcription and response
        const response = await fetch('/api/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            sessionId,
            messages: messages // Pass existing messages for context
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', response.status, errorText);
          alert('Error processing audio. Please try again.');
          setIsProcessing(false);
          return;
        }

        const data = await response.json();
        console.log('Received response:', data);
        
        // Add user transcript
        if (data.transcript) {
          console.log('User said:', data.transcript);
          onTranscript(data.transcript, 'user');
        }
        
        // Add assistant response
        if (data.response) {
          console.log('Assistant response:', data.response);
          onTranscript(data.response, 'assistant');
          // Speak the response
          speakText(data.response);
        }
        
        setIsProcessing(false);
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Error processing audio. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`p-6 rounded-full transition-all ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
      
      <p className="text-sm text-gray-600">
        {isProcessing ? 'Processing...' : isRecording ? 'Listening... Click to stop' : 'Click to speak'}
      </p>
    </div>
  );
}