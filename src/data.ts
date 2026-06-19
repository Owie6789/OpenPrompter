import { CustomPersona, PromptTemplate } from "./types";

export const PRESET_PERSONAS: CustomPersona[] = [
  {
    id: "p1",
    name: "Standard Prompt Engineer",
    description: "The default persona optimized for structured logical prompting, clarity, and safety.",
    systemPrompt: "You are an expert prompt engineer specialized in building logical, clear, high-performing prompts for large language models.",
    isPreset: true
  },
  {
    id: "p2",
    name: "Technical Software Architect",
    description: "Tailor optimized prompts for clean code, debugging, API design, and system architecture.",
    systemPrompt: "You are a master software architect and principal engineer. Focus the prompt optimization heavily on code quality, robust handling, TypeScript/Python syntax, performance, and API design.",
    isPreset: true
  },
  {
    id: "p3",
    name: "SaaS Copywriter & Growth Marketer",
    description: "Tailor optimized prompts for copy that converts, emails, landing pages, and hooks.",
    systemPrompt: "You are an elite SaaS copywriter & direct response growth marketer. Redesign this prompt ensuring the outputs have high conversion power, beautiful visual structural pacing, and captivating hooks.",
    isPreset: true
  },
  {
    id: "p4",
    name: "Creative Content Director",
    description: "Ideal for video scripts, blog outliners, and deep metaphors.",
    systemPrompt: "You are a creative content developer and screenwriter. Focus on rich storytelling accents, dynamic pacing, cinematic descriptions, and highly engaging metaphors.",
    isPreset: true
  },
  {
    id: "p5",
    name: "Academic Researcher & Analyst",
    description: "Format optimizations for systemic reviews, deep data analysis, and rigorous fact-checks.",
    systemPrompt: "You are an executive researcher and expert data analyst. Inject academic rigor, systematic analysis schemas, logical deductions, and data citation rules into the optimized prompt structure.",
    isPreset: true
  }
];

export const PRESET_TEMPLATES: PromptTemplate[] = [
  {
    name: "Code Refactoring Architect",
    category: "Coding",
    description: "Refactor messy, repetitive code into production-ready solid architectures.",
    promptText: "Refactor this code to be more concise and performant. Highlight complexity issues, list alternative implementations, and make sure TypeScript types are robust. [Paste your code here]",
    iconName: "Code"
  },
  {
    name: "Direct Copywriter Generator",
    category: "Marketing",
    description: "Construct a direct response sales letter using standard PAS frameworks.",
    promptText: "Write a high-converting direct-response copy framework using the Problem-Agitate-Solve (PAS) structure. Target this specific audience: [Define your target customer] for this product: [Name product and key value proposition].",
    iconName: "Megaphone"
  },
  {
    name: "Intelligent PDF Summarizer",
    category: "Analysis",
    description: "Extract core metrics, decisions, and actionable insights out of dense papers.",
    promptText: "Summarize this analytical research. Extract (1) the core hypotheses, (2) the key statistical findings, (3) any research limitations, and (4) a 3-bullet action list of next steps. [Paste raw text/pdf transcription here]",
    iconName: "FileText"
  },
  {
    name: "Interactive Language Coach",
    category: "Education",
    description: "Roleplay conversational practice in full immersions with real-time grammar checks.",
    promptText: "Act as my interactive French language tutor. We will have a dynamic dialogue about travel and food. Correct my grammatical mistakes after every turn with inline explanations in English, and suggest a better phrasing.",
    iconName: "GraduationCap"
  },
  {
    name: "SaaS Product Spec Creator",
    category: "Product",
    description: "Transcribe vague features into precise user stories with detailed edge cases.",
    promptText: "Draft a comprehensive PRD (Product Requirements Document) for a new real-time collaboration feature. Outline the user persona, 3 user stories with full acceptance criteria, and specific corner case handling.",
    iconName: "Settings"
  },
  {
    name: "B2B Outreach Email",
    category: "Sales",
    description: "Design highly-personalized hooks for B2B outbound sequences.",
    promptText: "Compose a personalized, zero-fluff cold email targeting SaaS founders. Highlight our mutual value, keep it under 150 words, include an easy binary Call-to-Action, and use this specific angle: [Your value pitch].",
    iconName: "Mail"
  }
];
