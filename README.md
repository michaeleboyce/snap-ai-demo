# SNAP AI Interview Assistant - Connecticut DSS POC

## Overview
This is a proof-of-concept (POC) for an AI-enabled SNAP Interview Assistant developed in partnership between Connecticut Department of Social Services (DSS) and US Digital Response (USDR). The system uses conversational AI to conduct structured SNAP eligibility interviews following Connecticut's Quality Assurance best practices.

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

#### 1. Interview Completion & Reliability Issues
- [ ] Fix interview completion detection (INTERVIEW_COMPLETE not always triggering)
- [ ] Improve AI agent's awareness of when interview is truly complete
- [ ] Add fallback completion triggers based on section coverage
- [ ] Implement timeout handling for stalled interviews
- [ ] Add manual "End Interview" option with confirmation

#### 2. Upfront Disclosures & Consent
- [ ] Create welcome screen explaining AI agent benefits
- [ ] Implement verbal consent flow: "Do you consent to speak with an AI assistant?"
- [ ] Display helpline number prominently (1-855-6-CONNECT)
- [ ] Add visual and verbal opt-out instructions
- [ ] Explain data usage and privacy protections
- [ ] Add disclaimer about human review requirement

#### 3. Staff Review Module Integration
- [ ] Connect staff review page to real interview data (currently uses mock data)
- [ ] Add side-by-side transcript and summary view
- [ ] Implement intelligent error detection:
  - [ ] Income vs expenses validation
  - [ ] Missing required information flagging
  - [ ] Policy violation detection
  - [ ] Inconsistency highlighting
- [ ] Add inline editing for corrections
- [ ] Create approval/denial workflow with reason codes
- [ ] Add case notes system
- [ ] Generate determination letter templates
- [ ] Export functionality for processed applications

### 🟡 Important (High Value for Demo)

#### 4. Demo Scenarios & Templates
- [ ] Complete demo scenario implementation (partially done)
- [ ] Create realistic test personas:
  - [ ] Single adult, low income
  - [ ] Family with children
  - [ ] Elderly person on fixed income
  - [ ] Disabled applicant
  - [ ] Mixed immigration status household
- [ ] Add "Load Demo" buttons for quick testing
- [ ] Create scripted responses for consistent demos
- [ ] Add demo mode indicator in UI

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
- [ ] ImpaCT system integration
- [ ] ConneCT benefits portal
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
- ⚠️ Interview completion detection unreliable (INTERVIEW_COMPLETE not always triggered)
- ⚠️ Staff review page uses mock data only
- ⚠️ No consent/disclosure flow implemented
- ⚠️ Demo scenarios partially implemented
- ⚠️ Summary sometimes contains raw JSON objects
- ⚠️ No Spanish language support yet

#### Not Yet Implemented ❌
- ❌ Upfront AI disclosure and consent
- ❌ Voice-triggered opt-out ("speak to human")
- ❌ Real data in staff review dashboard
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

## Contact

**Connecticut DSS**  
Laurie Ann Wagner, Customer Experience Officer  
laurieann.wagner@ct.gov

**US Digital Response**  
[Contact via website](https://www.usdigitalresponse.org/)

## Acknowledgments

This project is funded by a Public Benefit Innovation Fund (PBIF) grant proposal submitted to the Center for Civic Futures. The goal is to demonstrate responsible AI deployment in public benefits administration while maintaining program integrity and improving user experience.

---

*Last Updated: January 2025*