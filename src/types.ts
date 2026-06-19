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

export interface OptimizationResult {
  optimized_prompt: string;
  improvements: string[];
  key_changes: string[];
  confidence_score: number;
  prompt_type: string;
}

export type SharePayloadType = "template" | "persona";

export interface TemplateShareData {
  name: string;
  category: string;
  description: string;
  promptText: string;
  iconName: string;
}

export interface PersonaShareData {
  name: string;
  description: string;
  systemPrompt: string;
}

export type ShareData = TemplateShareData | PersonaShareData;
