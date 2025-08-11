# AI Architecture Documentation - SNAP Interview Assistant

## Executive Summary
This document details the AI architecture of the Connecticut SNAP Interview Assistant, built using OpenAI's Agents SDK for TypeScript. The system implements a voice-enabled conversational agent that conducts structured SNAP benefits eligibility interviews following Connecticut DSS Quality Assurance best practices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser Client                       │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Voice Interview Component                   │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ RealtimeSession  │  │   UI State Management    │   │  │
│  │  │  (SDK Client)    │  │  - Connection Status     │   │  │
│  │  │                  │  │  - Speaking Indicators   │   │  │
│  │  └────────┬─────────┘  │  - Transcript Display    │   │  │
│  │           │             └──────────────────────────┘   │  │
│  └───────────┼───────────────────────────────────────────┘  │
│              │                                               │
│              │ WebRTC Audio Stream                          │
│              ▼                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Ephemeral Token API (/api/realtime-token)     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenAI Realtime API                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │              RealtimeAgent Configuration               │  │
│  │  - SNAP Interview Instructions                         │  │
│  │  - Voice & Turn Detection Settings                     │  │
│  │  - Tool Definitions                                    │  │
│  │  - Handoff Capabilities                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## OpenAI Agents SDK Integration

### 1. Core SDK Components Used

#### RealtimeAgent (`@openai/agents/realtime`)
The foundation of our voice interview system, defining the agent's behavior and capabilities.

```typescript
import { RealtimeAgent, tool } from '@openai/agents/realtime';

const snapInterviewAgent = new RealtimeAgent({
  name: 'SNAP Interview Assistant',
  instructions: '...', // Detailed interview guidelines
  handoffDescription: 'SNAP benefits interview specialist',
});
```

**Key Features:**
- **Instructions**: Multi-paragraph guidelines following CT DSS QA methodology
- **Handoff Support**: Can delegate to specialist agents for complex cases
- **Tool Integration**: Custom tools for calculations and escalations
- **Voice Configuration**: Natural conversation flow optimized for interviews

#### RealtimeSession (`@openai/agents/realtime`)
Manages the WebRTC connection and conversation lifecycle.

```typescript
import { RealtimeSession } from '@openai/agents/realtime';

const session = new RealtimeSession(snapInterviewAgent, {
  model: 'gpt-4o-realtime-preview-2025-06-03',
  config: {
    voice: 'alloy',
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    turnDetection: { type: 'server_vad' },
    inputAudioTranscription: { model: 'whisper-1' },
  },
});
```

**Session Management Features:**
- **Automatic WebRTC handling**: SDK manages peer connections internally
- **Audio stream management**: Automatic microphone and speaker setup
- **Event-driven architecture**: Clean event handlers for state changes
- **History tracking**: Automatic conversation history management

### 2. Agent Configuration Deep Dive

#### Instructions Architecture
The agent instructions follow a structured format optimized for voice interviews:

```typescript
instructions: `
  VOICE INTERVIEW GUIDELINES:
  - Speak clearly and at a moderate pace
  - Keep responses concise but complete
  - Use warm, professional tone
  
  INTERVIEW STRUCTURE:
  1. Introduction: Explain process and confidentiality
  2. Household Composition: Who buys/prepares food together
  3. Income: All sources (work, benefits, support)
  4. Expenses: Rent/mortgage, utilities, medical
  5. Special Circumstances: Disability, elderly, students
  6. Summary: Confirm key information
  
  KEY QUESTIONS TO ASK:
  [Specific questions following QA methodology]
  
  DISCREPANCY DETECTION:
  [Logic for identifying inconsistencies]
`
```

#### Tool Implementation
Tools extend the agent's capabilities for complex operations:

```typescript
const escalateToSupervisor = tool({
  name: 'escalate_to_supervisor',
  description: 'Escalate complex cases to a supervisor',
  parameters: z.object({
    reason: z.string(),
    complexityFactors: z.array(z.string()),
  }),
  needsApproval: false,
  execute: async ({ reason, complexityFactors }) => {
    // Implementation logic
  },
});

const calculateEstimatedBenefit = tool({
  name: 'calculate_estimated_benefit',
  description: 'Calculate rough estimated SNAP benefit',
  parameters: z.object({
    householdSize: z.number(),
    monthlyIncome: z.number(),
    // Additional parameters
  }),
  execute: async (params) => {
    // Calculation logic following FNS guidelines
  },
});
```

### 3. Session Lifecycle Management

#### Connection Flow
```typescript
// 1. Get ephemeral token
const tokenResponse = await fetch('/api/realtime-token');
const { client_secret } = await tokenResponse.json();

// 2. Create session with agent
const session = new RealtimeSession(agent, config);

// 3. Connect using token
await session.connect({ apiKey: client_secret.value });

// 4. Trigger initial response (for WebRTC transport)
session.transport.send({
  type: 'response.create',
  response: {
    modalities: ['audio', 'text'],
    instructions: 'Start the interview'
  }
});

// 5. Session is now active - automatic audio handling begins
```

#### Event Handling Architecture
```typescript
session.on('history_updated', (history) => {
  // Process conversation history
  // Extract transcripts for display
  // Update progress tracking
});

session.on('audio_interrupted', () => {
  // Handle interruption
  // Update UI state
});

session.on('tool_approval_requested', (context, agent, request) => {
  // Review tool execution request
  // Approve/deny based on policy
  session.approve(request.approvalItem);
});

// Generic event handler for all events
session.on('*', (event) => {
  // Track AI speaking states
  // Monitor connection health
  // Log for debugging
});
```

### 4. Audio Processing Pipeline

#### Input Audio Flow
1. **Browser MediaStream** → Captured via getUserMedia
2. **WebRTC Transport** → SDK handles peer connection
3. **Server VAD** → Voice Activity Detection on server
4. **Whisper Transcription** → Real-time speech-to-text
5. **Agent Processing** → Context-aware response generation

#### Output Audio Flow
1. **Agent Response** → Generated based on context
2. **TTS Conversion** → Using 'alloy' voice model
3. **PCM16 Stream** → Audio chunks sent via WebRTC
4. **Browser Playback** → Automatic audio element management
5. **Interruption Handling** → Cut-off on user speech

### 5. State Management Architecture

#### Connection States
```typescript
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

// State transitions
idle → connecting → connected
     ↓           ↓
   error      idle (disconnect)
```

#### Audio States
- **isAISpeaking**: Tracks when AI is generating audio
- **isProcessing**: Indicates AI is thinking/preparing response
- **isMuted**: Local microphone mute state
- **isInterrupted**: Handles speech interruption events

### 6. Security Architecture

#### Ephemeral Token System
```typescript
// Server-side token generation
POST /api/realtime-token
→ Creates short-lived session
→ Returns client_secret with limited scope
→ Expires after session timeout

// Client-side usage
- Token never exposed in client code
- WebRTC connection secured via token
- No direct API key exposure
```

#### Data Privacy Measures
- No persistent storage of audio streams
- Transcripts processed in memory
- Optional database storage only for summaries
- HIPAA-compliant architecture ready

### 7. Scalability Considerations

#### Current Architecture Limitations
- Single session per component instance
- No session persistence across refreshes
- Limited to one active interview per browser

#### Production Scaling Path
```typescript
// Future multi-session support
class InterviewSessionManager {
  private sessions: Map<string, RealtimeSession>;
  
  createSession(userId: string): RealtimeSession {
    // Create isolated session per user
  }
  
  resumeSession(sessionId: string): RealtimeSession {
    // Resume from saved state
  }
}
```

### 8. Quality Assurance Integration

#### Interview Completeness Tracking
```typescript
interface InterviewProgress {
  household: { asked: boolean; complete: boolean };
  income: { asked: boolean; complete: boolean };
  expenses: { asked: boolean; complete: boolean };
  assets: { asked: boolean; complete: boolean };
  special: { asked: boolean; complete: boolean };
}

// Real-time progress analysis
function analyzeProgress(history: ConversationHistory): InterviewProgress {
  // Parse transcripts for topic coverage
  // Identify missing information
  // Flag for follow-up
}
```

#### Discrepancy Detection
- Pattern matching in responses
- Consistency validation across answers
- Automatic clarification prompts
- Escalation for complex cases

### 9. Connecticut DSS Alignment

#### QA Methodology Implementation
The agent follows Connecticut's Quality Assurance interview structure:

1. **Standardized Question Flow**: Consistent ordering and phrasing
2. **Complete Information Gathering**: All required topics covered
3. **Discrepancy Identification**: Real-time inconsistency detection
4. **Documentation Standards**: Structured summary generation
5. **Human Oversight**: Staff review before determination

#### Compliance Features
- **Recording Capability**: Optional session recording
- **Audit Trail**: Complete conversation history
- **Time Tracking**: Interview duration monitoring
- **Language Support**: Extensible for Spanish
- **Accessibility**: Voice-first interface

### 10. Performance Optimization

#### SDK Optimizations
- **Connection Pooling**: Reuses WebRTC connections
- **Audio Buffering**: Smooth playback handling
- **Efficient Event Processing**: Batched state updates
- **Memory Management**: Automatic cleanup on disconnect

#### Application-Level Optimizations
```typescript
// Debounced transcript updates
const debouncedTranscriptUpdate = debounce((transcript) => {
  updateUI(transcript);
}, 100);

// Lazy component loading
const VoiceInterview = dynamic(() => import('./voice-interview'), {
  ssr: false,
});
```

## SDK Best Practices

### 1. Error Handling
```typescript
try {
  await session.connect({ apiKey });
} catch (error) {
  // Graceful degradation
  // User-friendly error messages
  // Automatic retry logic
}
```

### 2. Resource Cleanup
```typescript
useEffect(() => {
  return () => {
    session.interrupt();
    session.removeAllListeners();
    // Ensure complete cleanup
  };
}, []);
```

### 3. Event Management
```typescript
// Specific event handlers for known events
session.on('history_updated', handleHistory);

// Catch-all for monitoring
session.on('*', (event) => {
  console.log('[Debug]', event.type);
});
```

### 4. State Synchronization
```typescript
// Keep UI in sync with session state
session.on('connection_changed', (connected) => {
  setUIState(connected ? 'active' : 'inactive');
});
```

## Future SDK Enhancements

### Planned Features
1. **Multi-agent Orchestration**: Complex handoff scenarios
2. **Guardrails Integration**: Content filtering and validation
3. **Advanced Tools**: Database queries, API integrations
4. **Session Persistence**: Resume interrupted interviews
5. **Analytics Integration**: Performance and quality metrics

### SDK Evolution Path
- **Version 0.0.15** (Current): Basic voice agent support
- **Version 0.1.0** (Planned): Enhanced tool capabilities
- **Version 0.2.0** (Future): Multi-modal support
- **Version 1.0.0** (Target): Production-ready with full feature set

## Conclusion

The OpenAI Agents SDK provides a robust foundation for building voice-enabled AI applications. By abstracting WebRTC complexity and providing high-level primitives like RealtimeAgent and RealtimeSession, the SDK enables rapid development of sophisticated conversational systems.

The SNAP Interview Assistant demonstrates best practices for:
- Agent configuration and instruction design
- Session lifecycle management
- Event-driven architecture
- Tool integration
- Security and compliance
- Production scalability

This architecture serves as a blueprint for similar government service applications, showing how AI can enhance public benefit delivery while maintaining program integrity and human oversight.