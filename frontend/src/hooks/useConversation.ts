import { useState, useCallback } from 'react';
import type {
  Message,
  SocraticResponse,
  QuestionResponse,
  GeneratedPromptResponse
} from '../types';
import { conversationApi, LLMConfig } from '../services/api';

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  currentResponse: SocraticResponse | null;
  status: 'idle' | 'in_progress' | 'completed';
  currentTurn: number;
  maxTurns: number;
  isLoading: boolean;
  error: string | null;
  generatedPromptText: string | null;
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    conversationId: null,
    messages: [],
    currentResponse: null,
    status: 'idle',
    currentTurn: 0,
    maxTurns: 5,
    isLoading: false,
    error: null,
    generatedPromptText: null,
  });

  const startConversation = useCallback(async (initialIdea: string, config?: LLMConfig) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await conversationApi.create(initialIdea, config);

      const initialMessage: Message = {
        id: 'initial',
        role: 'user',
        content: initialIdea,
        created_at: new Date().toISOString(),
      };

      setState({
        conversationId: result.conversation_id,
        messages: [initialMessage],
        currentResponse: result.response,
        status: result.status as 'in_progress' | 'completed',
        currentTurn: result.current_turn,
        maxTurns: result.max_turns,
        isLoading: false,
        error: null,
        generatedPromptText: null,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start conversation';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!state.conversationId) {
      throw new Error('No active conversation');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      const result = await conversationApi.sendMessage(state.conversationId, content);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response.type === 'question'
          ? (result.response as QuestionResponse).question
          : (result.response as GeneratedPromptResponse).raw_text,
        created_at: new Date().toISOString(),
      };

      const newGeneratedPromptText = result.response.type === 'prompt'
        ? (result.response as GeneratedPromptResponse).raw_text
        : null;

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        currentResponse: result.response,
        status: result.status as 'in_progress' | 'completed',
        currentTurn: result.current_turn,
        isLoading: false,
        generatedPromptText: newGeneratedPromptText || prev.generatedPromptText,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, [state.conversationId]);

  const refinePrompt = useCallback(async (refinement: string) => {
    if (!state.conversationId || !state.generatedPromptText) {
      throw new Error('No prompt to refine');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: refinement,
        created_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      const result = await conversationApi.refinePrompt(state.conversationId, refinement);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.raw_text,
        created_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        currentResponse: {
          type: 'prompt',
          prompt: result.prompt,
          raw_text: result.raw_text,
          tags: result.tags || [],
        } as GeneratedPromptResponse,
        generatedPromptText: result.raw_text,
        isLoading: false,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refine prompt';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, [state.conversationId, state.generatedPromptText]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const conversation = await conversationApi.get(conversationId);

      const messages: Message[] = conversation.messages?.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        created_at: m.created_at,
      })) || [];

      let currentResponse: SocraticResponse | null = null;
      let generatedPromptText: string | null = null;

      if (conversation.prompt) {
        currentResponse = {
          type: 'prompt',
          prompt: {
            role: conversation.prompt.role_definition || '',
            task: conversation.prompt.task_description || '',
            constraints: conversation.prompt.constraints || [],
            output_format: conversation.prompt.output_format || '',
            examples: [],
          },
          raw_text: conversation.prompt.raw_text,
          tags: conversation.prompt.tags || [],
        } as GeneratedPromptResponse;
        generatedPromptText = conversation.prompt.raw_text;
      }

      setState({
        conversationId: conversation.id,
        messages,
        currentResponse,
        status: conversation.status as 'idle' | 'in_progress' | 'completed',
        currentTurn: conversation.current_turn,
        maxTurns: conversation.max_turns,
        isLoading: false,
        error: null,
        generatedPromptText,
      });

      return conversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      conversationId: null,
      messages: [],
      currentResponse: null,
      status: 'idle',
      currentTurn: 0,
      maxTurns: 5,
      isLoading: false,
      error: null,
      generatedPromptText: null,
    });
  }, []);

  const setPromptPreview = useCallback((promptResponse: GeneratedPromptResponse) => {
    setState(prev => ({
      ...prev,
      currentResponse: promptResponse,
      status: 'completed',
      generatedPromptText: promptResponse.raw_text,
    }));
  }, []);

  const rethink = useCallback(async () => {
    if (!state.conversationId) {
      throw new Error('No active conversation');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await conversationApi.rethink(state.conversationId);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response.type === 'question'
          ? (result.response as QuestionResponse).question
          : (result.response as GeneratedPromptResponse).raw_text,
        created_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        currentResponse: result.response,
        isLoading: false,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rethink';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, [state.conversationId]);

  return {
    ...state,
    startConversation,
    sendMessage,
    refinePrompt,
    loadConversation,
    reset,
    setPromptPreview,
    rethink,
  };
}
