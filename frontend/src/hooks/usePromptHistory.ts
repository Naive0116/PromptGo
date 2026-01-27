import { useState, useCallback, useEffect } from 'react';
import type { Conversation, Prompt } from '../types';
import { conversationApi, promptApi } from '../services/api';

export function usePromptHistory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await conversationApi.list();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promptApi.list();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await conversationApi.delete(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }, []);

  const deletePrompt = useCallback(async (id: string) => {
    try {
      await promptApi.delete(id);
      setPrompts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadPrompts();
  }, [loadConversations, loadPrompts]);

  return {
    conversations,
    prompts,
    isLoading,
    error,
    loadConversations,
    loadPrompts,
    deleteConversation,
    deletePrompt,
  };
}
