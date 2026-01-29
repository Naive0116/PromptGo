import { useState } from 'react';
import { Copy, Check, Edit3, Save, X, FileText, Sparkles, Lightbulb, CheckCircle2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { GeneratedPromptResponse } from '../types';

interface PromptPreviewProps {
  promptResponse: GeneratedPromptResponse | null;
  previousPromptResponse?: GeneratedPromptResponse | null;
  currentUnderstanding?: string;
  status: 'idle' | 'in_progress' | 'completed';
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
  hasPendingChanges?: boolean;
}

export function PromptPreview({
  promptResponse,
  previousPromptResponse,
  currentUnderstanding,
  status,
  onAcceptChanges,
  onRejectChanges,
  hasPendingChanges = false,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showDiff, setShowDiff] = useState(true);

  const hasChanges = hasPendingChanges && previousPromptResponse && promptResponse &&
    previousPromptResponse.raw_text !== promptResponse.raw_text;

  const handleCopy = async () => {
    if (!promptResponse) return;
    
    const textToCopy = isEditing ? editedText : promptResponse.raw_text;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (promptResponse) {
      setEditedText(promptResponse.raw_text);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText('');
  };

  const handleCopyRaw = async () => {
    if (!promptResponse) return;
    await navigator.clipboard.writeText(promptResponse.raw_text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="flex flex-col h-full card-elevated overflow-hidden">
      {/* 标题栏 */}
      <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
        <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#bf5af2]" />
          真理之言
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
        {/* 空状态 */}
        {status === 'idle' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#bf5af2]/10 to-[#0071e3]/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#bf5af2]" />
            </div>
            <p className="text-[#86868b] text-sm">
              开始对话后，提示词将在这里诞生
            </p>
          </div>
        )}

        {/* 进行中状态 */}
        {status === 'in_progress' && !promptResponse && (
          <div className="space-y-4">
            <div className="bg-[#f5f5f7] rounded-2xl p-5">
              <h3 className="text-sm font-medium text-[#1d1d1f] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse"></span>
                正在嗅探逻辑漏洞...
              </h3>
              <p className="text-sm text-[#86868b]">
                继续回答问题，提示词将逐步完善
              </p>
            </div>

            {currentUnderstanding && (
              <div className="bg-gradient-to-br from-[#0071e3]/5 to-[#bf5af2]/5 rounded-2xl p-5 border border-[#0071e3]/10">
                <h3 className="text-sm font-medium text-[#0071e3] mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> 当前嗅探结果
                </h3>
                <p className="text-sm text-[#1d1d1f] leading-relaxed">{currentUnderstanding}</p>
              </div>
            )}
          </div>
        )}

        {promptResponse && (
          <div className="space-y-4">
            {/* 修改建议通知栏 */}
            {hasChanges && (
              <div className="bg-gradient-to-r from-[#ff9f0a]/10 to-[#ff6b35]/10 border-2 border-[#ff9f0a]/30 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ff9f0a]/20 flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-[#ff9f0a]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1d1d1f]">优化建议已生成</h4>
                      <p className="text-xs text-[#86868b]">请审阅以下修改，选择接受或拒绝</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className="text-xs text-[#0071e3] hover:underline flex items-center gap-1"
                  >
                    {showDiff ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showDiff ? '收起对比' : '展开对比'}
                  </button>
                </div>
                
                {showDiff && previousPromptResponse && (
                  <div className="bg-white/60 rounded-xl p-3 mb-3 text-xs space-y-2 max-h-40 overflow-y-auto">
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium shrink-0">原版</span>
                      <pre className="text-[#86868b] whitespace-pre-wrap font-mono line-through leading-relaxed">{previousPromptResponse.raw_text.substring(0, 200)}...</pre>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-medium shrink-0">新版</span>
                      <pre className="text-[#1d1d1f] whitespace-pre-wrap font-mono leading-relaxed">{promptResponse.raw_text.substring(0, 200)}...</pre>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={onAcceptChanges}
                    className="flex-1 px-4 py-2.5 text-sm bg-[#30d158] text-white rounded-xl hover:bg-[#28a745] transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    接受修改
                  </button>
                  <button
                    onClick={onRejectChanges}
                    className="flex-1 px-4 py-2.5 text-sm bg-white border-2 border-[#ff3b30]/30 text-[#ff3b30] rounded-xl hover:bg-[#ff3b30]/5 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    撤销修改
                  </button>
                </div>
              </div>
            )}

            {/* 置顶悬浮工具栏 */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm pb-3 -mx-5 px-5 pt-1">
              <div className="flex gap-2 justify-end">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn-primary text-sm py-2"
                    >
                      <Save className="w-4 h-4 mr-1.5 inline" />
                      保存
                    </button>
                    <button
                      onClick={handleCancel}
                      className="btn-secondary text-sm py-2"
                    >
                      <X className="w-4 h-4 mr-1.5 inline" />
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCopy}
                      className="btn-primary text-sm py-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1.5 inline" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1.5 inline" />
                          复制
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleEdit}
                      className="btn-secondary text-sm py-2"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5 inline" />
                      编辑
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-96 p-4 bg-[#f5f5f7] border-0 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 text-[#1d1d1f]"
              />
            ) : (
              <div className="space-y-3">
                {promptResponse.prompt.role && (
                  <div className="bg-[#f5f5f7] rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                      角色定义
                    </h3>
                    <p className="text-sm text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
                      {promptResponse.prompt.role}
                    </p>
                  </div>
                )}

                {promptResponse.prompt.task && (
                  <div className="bg-[#f5f5f7] rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                      任务描述
                    </h3>
                    <p className="text-sm text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
                      {promptResponse.prompt.task}
                    </p>
                  </div>
                )}

                {promptResponse.prompt.constraints && promptResponse.prompt.constraints.length > 0 && (
                  <div className="bg-[#f5f5f7] rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                      约束条件
                    </h3>
                    <ul className="text-sm text-[#1d1d1f] space-y-1.5">
                      {promptResponse.prompt.constraints.map((constraint, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-[#0071e3] mt-1">•</span>
                          <span>{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {promptResponse.prompt.output_format && (
                  <div className="bg-[#f5f5f7] rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-2">
                      输出格式
                    </h3>
                    <p className="text-sm text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
                      {promptResponse.prompt.output_format}
                    </p>
                  </div>
                )}

                {promptResponse.tags && promptResponse.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {promptResponse.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#bf5af2]/10 text-[#bf5af2] text-xs font-medium rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 完整提示词 - 深色代码块 */}
                <div className="bg-[#1d1d1f] rounded-2xl p-5 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wide">
                      完整提示词
                    </h3>
                    <button
                      onClick={handleCopyRaw}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 text-white/80 rounded-full hover:bg-white/20 transition-all"
                      title="复制完整提示词"
                    >
                      {copiedRaw ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#30d158]" />
                          <span className="text-[#30d158]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
                    {promptResponse.raw_text}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
