export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  initialTranscript: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  suggestedResponses?: string[];
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'single-adult',
    name: 'Single Adult',
    description: 'Working individual living alone',
    icon: '👤',
    initialTranscript: [
      {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"
      },
      {
        role: 'user',
        content: "It's just me. I live alone in my apartment."
      },
      {
        role: 'assistant',
        content: "Thank you for that information. So you're a household of one person. Now, let's talk about your income. Are you currently working, and if so, what is your monthly income from all sources?"
      }
    ],
    suggestedResponses: [
      "I work full-time and make $1,800 per month",
      "I work part-time and earn about $1,200 monthly",
      "I'm unemployed and looking for work"
    ]
  },
  {
    id: 'family-children',
    name: 'Family with Children',
    description: 'Two parents with two children',
    icon: '👨‍👩‍👧‍👦',
    initialTranscript: [
      {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"
      },
      {
        role: 'user',
        content: "There's four of us - me, my spouse, and our two kids aged 8 and 12."
      },
      {
        role: 'assistant',
        content: "Thank you. So you have a household of four - two adults and two children. Are there any other family members or individuals who live with you and share meals?"
      }
    ],
    suggestedResponses: [
      "No, it's just the four of us",
      "My mother also lives with us",
      "We have a roommate but they buy their own food"
    ]
  },
  {
    id: 'elderly-disabled',
    name: 'Elderly/Disabled',
    description: 'Senior citizen with disability',
    icon: '👵',
    initialTranscript: [
      {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"
      },
      {
        role: 'user',
        content: "I'm 68 years old and live by myself. I have mobility issues from arthritis."
      },
      {
        role: 'assistant',
        content: "Thank you for sharing that. I've noted that you're 68 years old, living alone, and have a disability related to arthritis. This information is important as there are special considerations for seniors and individuals with disabilities. Now, let's discuss your income. Do you receive Social Security, disability benefits, or any other income?"
      }
    ],
    suggestedResponses: [
      "I get $1,100 from Social Security and $200 from disability",
      "Just Social Security, about $950 a month",
      "Social Security plus a small pension totaling $1,400 monthly"
    ]
  },
  {
    id: 'complex-household',
    name: 'Complex Household',
    description: 'Multi-generational with mixed income',
    icon: '🏠',
    initialTranscript: [
      {
        role: 'assistant',
        content: "Hello! I'm here to help you with your SNAP benefits application. This interview will take about 10 to 15 minutes. Everything we discuss is confidential and will only be used to determine your eligibility. Let's start with who lives in your household. Can you tell me who buys and prepares food together in your home?"
      },
      {
        role: 'user',
        content: "It's complicated. I live with my teenage daughter, my adult son who works, and my mother who's retired. We all share groceries except my son sometimes buys his own food."
      },
      {
        role: 'assistant',
        content: "I understand. Let me clarify to ensure I have this correct. You mentioned four people total: yourself, your teenage daughter, your adult working son, and your retired mother. You said you mostly share food together, but your son sometimes purchases separately. For SNAP purposes, do you all generally purchase and prepare food together as one household?"
      }
    ],
    suggestedResponses: [
      "Yes, we pool our money for groceries and eat together",
      "My son keeps his food separate about half the time",
      "We shop together but my mom has special dietary needs"
    ]
  }
];

export function getDemoScenario(id: string): DemoScenario | undefined {
  return demoScenarios.find(scenario => scenario.id === id);
}

export function getRandomScenario(): DemoScenario {
  const randomIndex = Math.floor(Math.random() * demoScenarios.length);
  return demoScenarios[randomIndex];
}