# SNAP Voice Interview Implementation

## Overview
The SNAP Voice Interview Assistant has been completely rewritten using the official OpenAI Agents SDK for TypeScript. This implementation provides a cleaner, more maintainable architecture that properly handles voice interviews for SNAP benefits eligibility.

## Key Components

### 1. **RealtimeAgent Configuration** (`lib/realtime-agent.ts`)
- Defines the SNAP interviewer agent with Fake State HHS guidelines
- Includes structured interview flow following QA best practices
- Implements tools for escalation and benefit calculation
- Configures voice, turn detection, and transcription settings

### 2. **Voice Interview Component** (`components/voice-interview.tsx`)
- Uses the official `RealtimeSession` from `@openai/agents/realtime`
- Handles connection lifecycle with proper cleanup
- Provides visual feedback for AI states (speaking, thinking, listening)
- No automatic connection on page load - requires user action

### 3. **API Token Endpoint** (`app/api/realtime-token/route.ts`)
- Creates ephemeral sessions for secure browser connections
- Uses model: `gpt-4o-realtime-preview-2025-06-03`
- Returns client secret for WebRTC authentication

## Architecture Benefits

### SDK Advantages:
- **Simpler Code**: SDK handles WebRTC complexity internally
- **Built-in Features**: Automatic interruption handling, audio management
- **Better Error Handling**: Structured error states and recovery
- **Event System**: Clean event-based architecture for state updates
- **Native Tools**: Easy integration of tools and handoffs

### Interview Flow:
1. User clicks "Start Voice Interview" button
2. Component fetches ephemeral token from API
3. RealtimeSession connects using WebRTC
4. AI introduces itself and asks first question
5. Conversation continues with structured questions
6. Transcripts are captured and displayed in real-time
7. Progress tracker updates based on topics covered

## Testing Instructions

### Prerequisites:
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Run development server: `npm run dev`
- Allow microphone permissions when prompted

### Test Flow:
1. Navigate to http://localhost:3000
2. Click "Try Voice Interview Demo"
3. Click "Start Voice Interview" button
4. Allow microphone access
5. Wait for "Connected • Listening" status
6. AI will greet you and ask about household composition
7. Speak your responses naturally
8. Watch transcripts appear in real-time
9. Monitor progress tracker on the right
10. Click "End Call" to disconnect

### Key Features to Test:
- **No Auto-Start**: Verify no voice on page load
- **Clear First Question**: AI asks specific household question
- **Interruption Handling**: Can interrupt AI mid-sentence
- **Visual Feedback**: "AI is speaking" indicator appears
- **Progress Tracking**: Sections update as topics covered
- **Clean Disconnect**: Proper cleanup when ending call

## Interview Questions Structure

The AI follows this structured flow:
1. **Introduction** - Explains process and confidentiality
2. **Household Composition** - Who lives together and shares meals
3. **Income Sources** - Employment, benefits, support
4. **Monthly Expenses** - Rent, utilities, medical, childcare
5. **Special Circumstances** - Elderly, disabled, students
6. **Summary** - Confirms information and next steps

## Troubleshooting

### If voice doesn't work:
1. Check browser console for errors
2. Verify microphone permissions granted
3. Ensure OPENAI_API_KEY is valid
4. Check network connectivity
5. Try refreshing and reconnecting

### Common Issues:
- **"Failed to connect"**: Check API key and network
- **No audio**: Verify microphone permissions
- **Duplicate voices**: Fixed - removed duplicate event handlers and sendMessage
- **AI not speaking**: Uses response.create event to trigger initial response

## Technical Details

### Dependencies:
```json
"@openai/agents": "^0.0.15",
"zod": "^3.25.67"
```

### Model Configuration:
- Model: `gpt-4o-realtime-preview-2025-06-03`
- Voice: `alloy`
- Turn Detection: `server_vad`
- Audio Format: `pcm16`
- Transcription: `whisper-1`

### Event Handling:
- `history_updated`: Captures conversation transcripts
- `audio_interrupted`: Handles interruptions
- `tool_approval_requested`: Auto-approves demo tools
- `response.audio.delta/done`: Tracks AI speaking state

## Next Steps

### Potential Enhancements:
1. Add Spanish language support
2. Implement more sophisticated tools
3. Add handoffs to specialist agents
4. Integrate with database for saving interviews
5. Add guardrails for sensitive information
6. Implement custom voice settings
7. Add visual waveform display
8. Create admin dashboard for monitoring

### Production Considerations:
1. Implement proper error recovery
2. Add session timeout handling
3. Create fallback for connection issues
4. Add analytics and monitoring
5. Implement security controls
6. Add compliance logging
7. Create backup recording system
8. Add quality assurance reviews

## Fake State Human  Alignment

The implementation follows Fake State Human Services requirements:
- Structured QA-style interview methodology
- Discrepancy detection and clarification
- Complete information gathering
- Human-in-the-loop design (staff review summaries)
- 10-15 minute interview duration
- Focus on accuracy and completeness

This system serves as an MVP demonstration of how AI can streamline SNAP interviews while maintaining program integrity and improving applicant experience.