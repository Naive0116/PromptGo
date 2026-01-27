import type {
  Conversation,
  ConversationStartResponse,
  ConversationMessageResponse,
  Prompt
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

interface RefinePromptResponse {
  prompt: {
    role: string;
    task: string;
    constraints: string[];
    output_format: string;
    examples: string[];
  };
  raw_text: string;
  tags: string[];
}

export interface LLMConfig {
  llmProvider?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  maxTurns?: number;
  promptFramework?: string;
}

export const conversationApi = {
  create: (initialIdea: string, config?: LLMConfig) =>
    request<ConversationStartResponse>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        initial_idea: initialIdea,
        config: config ? {
          llm_provider: config.llmProvider,
          base_url: config.baseUrl,
          api_key: config.apiKey,
          model: config.model,
          max_turns: config.maxTurns,
          prompt_framework: config.promptFramework
        } : undefined
      }),
    }),

  list: (limit = 50, offset = 0) =>
    request<Conversation[]>(`/conversations?limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    request<Conversation>(`/conversations/${id}`),

  sendMessage: (id: string, content: string) =>
    request<ConversationMessageResponse>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  refinePrompt: (id: string, refinement: string) =>
    request<RefinePromptResponse>(`/conversations/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ content: refinement }),
    }),

  rethink: (id: string) =>
    request<ConversationMessageResponse>(`/conversations/${id}/rethink`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    }),
};

export const promptApi = {
  list: (limit = 50, offset = 0) =>
    request<Prompt[]>(`/prompts?limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    request<Prompt>(`/prompts/${id}`),

  update: (id: string, data: Partial<Prompt>) =>
    request<Prompt>(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/prompts/${id}`, {
      method: 'DELETE',
    }),
};
