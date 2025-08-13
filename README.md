# SNAP AI Interview Assistant - Fake State HHS POC

## Overview
This is a proof-of-concept (POC) for an AI-enabled SNAP Interview Assistant developed in partnership between Fake State Department of Social Services (DSS) and US Digital Response (USDR). The system uses conversational AI to conduct structured SNAP eligibility interviews following Fake State's Quality Assurance best practices.

**Live Demo**: https://snap-ai-demo.vercel.app/

## Project Goals
- Reduce interview-related error rates
- Improve administrative efficiency 
- Maintain compliance with H.R.1 requirements
- Preserve human-in-the-loop decision making
- Promote responsible AI deployment

## Current Features
✅ **Voice Interview System** - Real-time conversational AI using OpenAI's Realtime API  
✅ **Text Interview System** - Alternative text-based chat interface  
✅ **Structured Interview Flow** - Following CT DSS QA methodology  
✅ **Real-time Transcription** - Live capture and display of conversation  
✅ **Progress Tracking** - AI-powered assessment of interview section coverage  
✅ **Summary Generation** - Structured eligibility summaries for staff review  
✅ **Interview Persistence** - Save/resume functionality with database storage  
✅ **Interview History** - View and resume past interview sessions  
✅ **Interview Review Page** - Detailed view of completed interviews with transcripts  
✅ **Exchange Count Tracking** - Monitor interview interaction depth  
✅ **Empty Session Prevention** - Avoid saving interviews with no content  
✅ **Microphone Cleanup** - Proper WebRTC disconnection on navigation  
✅ **Human-in-the-loop** - Staff maintain final determination authority  

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI/Voice**: OpenAI Realtime API, OpenAI Agents SDK
- **Database**: PostgreSQL (via Neon), Drizzle ORM
- **Deployment**: Vercel
- **Languages**: English (Spanish support planned)

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- OpenAI API key with Realtime API access
- PostgreSQL database (we use Neon)

### Environment Variables
Create a `.env.local` file:
```bash
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgres_connection_string
```

### Installation
```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup
```bash
pnpm run db:push  # Create tables
pnpm run db:seed  # Add sample data (optional)
```

## Project Structure
```
/app                    # Next.js app router pages
  /api                  # API endpoints
  /interview            # Main interview interface
  /summary              # Interview summaries
  /staff-review         # Staff review dashboard (TODO)
/components             # React components
  /voice-interview.tsx  # Voice interview handler
  /interview-progress   # Progress tracker
/lib                    # Core libraries
  /realtime-agent.ts    # OpenAI agent configuration
  /db                   # Database schemas
/docs                   # Documentation
```

## Development TODO List

### ✅ Completed Features

#### Core Functionality
- ✅ Voice interview system with OpenAI Realtime API
- ✅ Text-based interview alternative
- ✅ Real-time transcription and display
- ✅ Progress tracking with AI-powered section detection
- ✅ Summary generation for completed interviews
- ✅ Interview save/resume functionality
- ✅ Interview history page (`/interview-history`)
- ✅ Interview review page with full transcript
- ✅ Database schema with Drizzle ORM
- ✅ Exchange count tracking
- ✅ Empty session prevention
- ✅ Microphone cleanup on navigation
- ✅ Basic staff review page (with mock data)

### 🔴 Critical (Must Have for POC)

#### 1. Interview Completion & Reliability Issues ✅ **MAJOR FIXES COMPLETED**
- [x] **FIXED: Race condition in completion detection** - consolidated 3 competing systems into single reliable approach
- [x] **FIXED: Agent completion awareness** - using `check_interview_complete` tool properly  
- [x] **Add fallback completion triggers based on section coverage** - implemented in `useCompletion` hook
- [x] **Implement timeout handling for stalled interviews** - idle detection with 5-minute auto-complete
- [x] **Add manual "End Interview" option with confirmation** - implemented with confirmation dialog

#### 2. Upfront Disclosures & Consent
- [ ] Create welcome screen explaining AI agent benefits
- [ ] Implement verbal consent flow: "Do you consent to speak with an AI assistant?"
- [ ] Display helpline number prominently (1-800-555-SNAP)
- [ ] Add visual and verbal opt-out instructions
- [ ] Explain data usage and privacy protections
- [ ] Add disclaimer about human review requirement

#### 3. Staff Review Module Integration ✅ **LARGELY COMPLETE**
- [x] **IMPLEMENTED: Connect staff review page to real interview data** - now uses real database data
- [x] **IMPLEMENTED: Side-by-side transcript and summary view** - full transcript display with summary
- [x] **IMPLEMENTED: Export functionality for processed applications** - CSV export available
- [x] **IMPLEMENTED: Status tracking and filtering** - filter by completion status
- [ ] Implement intelligent error detection:
  - [ ] Income vs expenses validation
  - [ ] Missing required information flagging
  - [ ] Policy violation detection
  - [ ] Inconsistency highlighting
- [ ] Add inline editing for corrections
- [ ] Create approval/denial workflow with reason codes
- [ ] Add case notes system
- [ ] Generate determination letter templates

### 🟡 Important (High Value for Demo)

#### 4. Demo Scenarios & Templates ✅ **LARGELY COMPLETE**
- [x] **IMPLEMENTED: Complete demo scenario implementation** - fully functional demo system
- [x] **IMPLEMENTED: Create realistic test personas:**
  - [x] Single adult, low income
  - [x] Family with children  
  - [x] Elderly person on fixed income
  - [x] Complex household with mixed situations
- [x] **IMPLEMENTED: Add "Load Demo" buttons for quick testing** - available at `/demo` page
- [x] **IMPLEMENTED: Create scripted responses for consistent demos** - suggested responses included
- [x] **IMPLEMENTED: Add demo mode indicator in UI** - purple banner shows demo mode
- [x] **FIXED: Voice agent context continuity** - demo transcripts now properly passed to voice agent

#### 5. Spanish Language Support
- [ ] Add language selector on homepage
- [ ] Implement Spanish voice in realtime agent
- [ ] Translate all UI elements and instructions
- [ ] Create bilingual consent/disclosure flows
- [ ] Add Spanish interview templates
- [ ] Implement language persistence across session

#### 6. Evaluation & Analytics Framework
- [ ] Create evaluation endpoints for testing
- [ ] Build test dataset with known outcomes
- [ ] Implement bias testing across demographics
- [ ] Add accuracy metrics dashboard
- [ ] Track interview success rates
- [ ] Monitor average completion times
- [ ] Export evaluation results (JSON/CSV)
- [ ] Create performance benchmarks

#### 12. Component Architecture & Consistency Refactor

- [ ] Component inventory and audit
  - [ ] Catalog current components and pages: `AppShell`, `InfoCard`, `ui/dialog`, `ConsentDialog`, `VoiceInterview`, `InterviewProgress`, `MessageList`, summary components (`components/summary/*`), `Interview History`, `Review`, `Staff Review` pages
  - [ ] Identify duplicate patterns (cards, banners, badges, status pills, dialogs, section headers)

- [ ] Establish UI primitives library (`components/ui/*`)
  - [ ] `Button`, `Card` (header/body/footer slots), `Alert` (info/success/warning/error variants), `Badge/StatusPill`, `Dialog/Modal`, `Progress`, `Stat` (label/value), `SectionHeader`
  - [ ] Migrate `InfoCard` to use `Card` + `Alert` variants and deprecate custom ad-hoc banners
  - [ ] Consolidate all modals on top of base `Dialog` (headless, accessible)

- [ ] Consolidate dialogs/modals
  - [ ] Refactor `ConsentDialog` to use base `Dialog`
  - [ ] Extract generic `ConfirmDialog` and use it for “End Interview” confirmation
  - [ ] Create `ReviewDetailDialog` as a composition over `Dialog` for Staff Review

- [ ] Create renderless logic hooks (separate logic from view)
  - [ ] `useVoiceSession` wrapper around Realtime/VoicePipeline: lifecycle events, turn detection, idle handling, interruptions
  - [ ] `useInterviewTranscript` for message normalization, checkpoint saves, resume
  - [ ] `useCoverage` for debounced coverage evaluation and errors
  - [ ] `useCompletion` to unify completion detection: agent signal (INTERVIEW_COMPLETE) + coverage fallback + manual end

- [ ] Event bus and constants
  - [ ] Define custom events and channels in `lib/events.ts` (e.g., `interview:complete`, `interview:idle-warning`, `interview:idle-end`)
  - [ ] Replace ad-hoc window events with typed helpers

- [ ] Types and schemas
  - [ ] Centralize shared types in `types/` (`InterviewMessage`, `CoverageSections`, `InterviewSummary`, `InterviewStatus`)
  - [ ] Remove `any` usages; ensure `summary` is a typed JSON object across API/UI
  - [ ] Align server actions and pages on the same DTOs

- [ ] Layouts and composition
  - [ ] Introduce `PageLayout` with content/sidebar slots; apply to `Interview`, `Review`, `History`, `Staff Review`
  - [ ] Extract `StatusBadge` and reuse across `History`, `Review`, `Staff Review`
  - [ ] Unify “demo mode” indicators and contextual banners

- [ ] i18n and copy centralization
  - [ ] Move user-facing strings to a simple i18n setup (prep for Spanish)
  - [ ] Keep consent/disclosure copy in dedicated modules with translations

- [ ] Migration plan
  - [ ] Phase 1: Build primitives/hooks; adopt in `Interview` page
  - [ ] Phase 2: Migrate `Staff Review`, `Review`, `History`
  - [ ] Phase 3: Remove deprecated components and duplicate patterns

### 🟢 Nice to Have (Demo Enhancements)

#### 7. Enhanced Demo Features
- [ ] Add "Demo Mode" toggle with explanatory overlays
- [ ] Create guided walkthrough for stakeholders
- [ ] Add tooltips explaining AI decisions
- [ ] Implement "Skip to Section" for demos
- [ ] Add speed controls for demo playback
- [ ] Create presentation mode with larger text

#### 8. Analytics & Monitoring Dashboard
- [ ] Real-time interview status tracking
- [ ] Completion rate metrics
- [ ] Average interview duration by type
- [ ] Section coverage heatmap
- [ ] Error rate tracking
- [ ] Drop-off analysis
- [ ] User satisfaction metrics
- [ ] Staff efficiency metrics
- [ ] Weekly/monthly trend reports

#### 9. Additional Features
- [ ] Document upload and OCR integration
- [ ] SMS notifications for appointments
- [ ] Email summaries to applicants
- [ ] Calendar scheduling for callbacks
- [ ] Multi-language support (beyond Spanish)
- [ ] Accessibility improvements (WCAG AA compliance)
- [ ] Mobile-responsive optimizations
- [ ] Offline mode with sync

### 🔵 Future Considerations (Post-POC)

#### 10. Production Readiness
- [ ] Security audit and penetration testing
- [ ] HIPAA/PII compliance certification
- [ ] Load testing (target: 1000+ concurrent users)
- [ ] Disaster recovery and backup planning
- [ ] Staff training materials and videos
- [ ] User documentation and help center
- [ ] API documentation for integrations
- [ ] Deployment runbooks
- [ ] SLA definitions
- [ ] Incident response procedures

#### 11. System Integrations
- [ ] Document management system
- [ ] Case management workflow
- [ ] Federal reporting systems
- [ ] Identity verification services
- [ ] Electronic signature integration

## Key Files to Review

### Core Implementation
- `/lib/realtime-agent.ts` - AI agent configuration and interview logic
- `/components/voice-interview.tsx` - Voice interface component with save/resume
- `/components/text-interview.tsx` - Text-based interview alternative
- `/components/interview-progress.tsx` - Real-time progress tracking
- `/app/interview/page.tsx` - Main interview page with mode selection
- `/app/interview/[sessionId]/review/page.tsx` - Interview review page
- `/app/interview-history/page.tsx` - Interview history listing
- `/app/actions/interviews.ts` - Server actions for interview management
- `/lib/db/schema.ts` - Database schema definitions
- `/app/api/generate-summary-v2/route.ts` - Summary generation endpoint

### Documentation
- `/AI_ARCHITECTURE_DOCUMENTATION.md` - Technical architecture
- `/VOICE_INTERVIEW_IMPLEMENTATION.md` - Voice implementation details
- `/docs/PBIF_Grant_Proposal.pdf` - Original grant proposal

## Architecture Decisions

### Current Implementation
- **Server Actions**: Used for all database operations instead of API routes (except for streaming/technical operations)
- **Database**: PostgreSQL via Neon with Drizzle ORM for type-safe queries
- **State Management**: React hooks with local state, no global state management
- **Real-time Communication**: OpenAI Realtime API for voice, standard chat completions for text
- **Deployment**: Vercel with automatic deployments from main branch
- **Styling**: Tailwind CSS with custom component library

### Design Patterns
- **Component Composition**: Reusable UI components (InfoCard, MessageList, etc.)
- **Progressive Enhancement**: Voice mode with text fallback
- **Graceful Degradation**: Handle missing features without breaking
- **Human-in-the-Loop**: All automated decisions require human review

## Responsible AI Considerations

### Current Safeguards
- Human-in-the-loop review required
- Transparent AI disclosure to users
- Opt-out available at any time
- No automated decisions
- Full audit trail of conversations

### Planned Safeguards
- Bias testing across populations
- Regular accuracy assessments
- Privacy impact assessments
- Security controls (encryption, access control)
- Data retention policies

## Testing

### Manual Testing Checklist

#### Working Features ✅
- ✅ Voice interview starts and stops properly
- ✅ Text interview mode functions correctly
- ✅ Real-time transcription displays
- ✅ Progress tracking updates during interview
- ✅ Interview saves to database
- ✅ Interview history page displays saved interviews
- ✅ Resume interview from history works
- ✅ Review page displays completed interviews
- ✅ Microphone disconnects on navigation
- ✅ Empty sessions are not saved

#### Known Issues ⚠️
- [x] ~~Interview completion detection unreliable~~ **FIXED** - race conditions resolved, completion system unified
- [x] ~~Staff review page uses mock data only~~ **FIXED** - now uses real interview data from database
- ⚠️ No consent/disclosure flow implemented  
- ⚠️ Demo scenarios partially implemented
- ⚠️ Summary sometimes contains raw JSON objects
- ⚠️ No Spanish language support yet

## 🎉 **MAJOR REFACTORING COMPLETED (January 2025)**

### 🚀 **Critical Issues Resolved**
- **Race Condition Fix**: Eliminated "Interview not found" errors by fixing async sequencing
- **Completion Detection**: Unified 3 competing systems into single reliable approach
- **Component Architecture**: Broke down 671-line component into 5 focused pieces
- **Code Reduction**: Removed ~500 lines through deduplication and simplification
- **Testing**: Migrated from Jest to Vitest with comprehensive race condition tests

### 🎨 **New Architecture**
- **`/hooks`** - Custom hooks: `useCompletion`, `useCoverage`, `useVoiceSession`
- **`/components/ui`** - Reusable primitives: `StatusBadge`, `ConfirmDialog`, `Card`, `Alert`
- **`/components/voice`** - Focused voice components: `VoiceControls`, `VoiceStatus`, `VoiceInstructions`
- **Simplified pages** - Clean, focused page components with separated concerns

### 📊 **Performance Improvements**
- **Reduced API calls** with proper debouncing (2s vs 600ms)
- **Eliminated duplicate coverage assessment** 
- **Single source of truth** for completion state
- **Better error handling** with detailed logging and recovery

#### Not Yet Implemented ❌
- [x] ~~Upfront AI disclosure and consent~~ **IMPLEMENTED** - comprehensive consent dialog with all requirements
- [x] ~~Voice-triggered opt-out~~ **IMPLEMENTED** - "speak to human" triggers graceful handoff
- [x] ~~Real data in staff review dashboard~~ **IMPLEMENTED** - uses real interview data
- [x] ~~Demo scenario voice context~~ **IMPLEMENTED** - voice agent maintains demo transcript context
- ❌ Document upload functionality
- ❌ Evaluation framework
- ❌ Analytics dashboard

### Automated Testing (TODO)
- [ ] Unit tests for agent tools and functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Performance benchmarks
- [ ] Accessibility tests (WCAG AA)
- [ ] Load testing for concurrent users
- [ ] Security vulnerability scanning

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

### Production Environment Variables
- `OPENAI_API_KEY` - Production API key
- `DATABASE_URL` - Production database
- `NEXT_PUBLIC_APP_URL` - Production URL

## Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details


**US Digital Response**  
[Contact via website](https://www.usdigitalresponse.org/)

---

*Last Updated: January 2025*