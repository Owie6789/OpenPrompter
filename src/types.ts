export interface PromptHistoryItem {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  keyChanges: string[];
  confidenceScore: number;
  promptType: string;
  createdAt: string;
  modelUsed: string;
  personaName?: string;
  customInstructions?: string;
}

export interface CustomPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPreset?: boolean;
}

export interface PromptTemplate {
  name: string;
  category: string;
  description: string;
  promptText: string;
  iconName: string;
}
