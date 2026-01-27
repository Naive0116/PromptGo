import { Clock, Trash2, MessageSquare, FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Conversation, Prompt } from '../types';

interface HistoryListProps {
  conversations: Conversation[];
  prompts: Prompt[];
  onSelectConversation?: (id: string) => void;
  onSelectPrompt?: (prompt: Prompt) => void;
  onDeleteConversation?: (id: string) => void;
  onDeletePrompt?: (id: string) => void;
  isLoading?: boolean;
}

export function HistoryList({
  conversations,
  prompts,
  onSelectConversation,
  onSelectPrompt,
  onDeleteConversation,
  onDeletePrompt,
  isLoading,
}: HistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPrompt = async (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.raw_text);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncate = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
        <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#86868b]" />
          历史记录
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-5 text-center text-[#86868b] text-sm">加载中...</div>
        ) : (
          <>
            {conversations.length > 0 && (
              <div className="px-3 py-2">
                <h3 className="px-2 py-2 text-xs font-semibold text-[#86868b] uppercase tracking-wide">
                  对话
                </h3>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-all"
                    onClick={() => onSelectConversation?.(conv.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#0071e3]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1d1d1f] truncate">
                          {truncate(conv.initial_idea)}
                        </p>
                        <p className="text-xs text-[#86868b]">
                          {formatDate(conv.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation?.(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full text-[#86868b] hover:bg-[#ff453a]/10 hover:text-[#ff453a] transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {prompts.length > 0 && (
              <div className="px-3 py-2 border-t border-[rgba(0,0,0,0.06)]">
                <h3 className="px-2 py-2 text-xs font-semibold text-[#86868b] uppercase tracking-wide">
                  已保存的提示词
                </h3>
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-all"
                    onClick={() => onSelectPrompt?.(prompt)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#bf5af2]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#bf5af2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1d1d1f] truncate">
                          {truncate(prompt.raw_text, 25)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[#86868b]">
                            {formatDate(prompt.created_at)}
                          </p>
                          {prompt.tags && prompt.tags.length > 0 && (
                            <span className="text-xs text-[#bf5af2] font-medium">
                              #{prompt.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => handleCopyPrompt(e, prompt)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-[#86868b] hover:bg-[#0071e3]/10 hover:text-[#0071e3] transition-all"
                        title="复制提示词"
                      >
                        {copiedId === prompt.id ? (
                          <Check className="w-4 h-4 text-[#30d158]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePrompt?.(prompt.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-[#86868b] hover:bg-[#ff453a]/10 hover:text-[#ff453a] transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {conversations.length === 0 && prompts.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#f5f5f7] flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#86868b]" />
                </div>
                <p className="text-[#86868b] text-sm">暂无历史记录</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
