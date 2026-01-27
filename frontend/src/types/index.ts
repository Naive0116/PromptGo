export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionResponse {
  type: 'question';
  question: string;
  options: QuestionOption[];
  allow_custom: boolean;
  hint?: string;
  current_understanding?: string;
  current_turn: number;
  max_turns: number;
}

export interface PromptData {
  role: string;
  task: string;
  constraints: string[];
  output_format: string;
  examples: string[];
}

export interface GeneratedPromptResponse {
  type: 'prompt';
  prompt: PromptData;
  raw_text: string;
  tags: string[];
}

export type SocraticResponse = QuestionResponse | GeneratedPromptResponse;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  conversation_id?: string;
  raw_text: string;
  role_definition?: string;
  task_description?: string;
  constraints: string[];
  output_format?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  initial_idea: string;
  status: 'in_progress' | 'completed';
  current_turn: number;
  max_turns: number;
  created_at: string;
  messages?: Message[];
  prompt?: Prompt;
}

export interface ConversationStartResponse {
  conversation_id: string;
  status: string;
  current_turn: number;
  max_turns: number;
  response: SocraticResponse;
}

export interface ConversationMessageResponse {
  status: string;
  current_turn: number;
  max_turns: number;
  response: SocraticResponse;
}
