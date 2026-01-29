import { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, X, Check, ChevronRight, RefreshCcw, Sparkles, Settings,
  FileText, Puzzle, Wand2, Code2, AlertTriangle, Lightbulb, Target,
  Download, Upload, ShieldAlert, BookOpen
} from 'lucide-react';
import type { Message, QuestionResponse, QuestionOption } from '../types';

// 普提狗吉祥物组件
function PromptGoDog({ mood = 'thinking' }: { mood?: 'thinking' | 'happy' | 'idle' }) {
  const moodEmoji = {
    thinking: '🐕',
    happy: '🐕',
    idle: '🐕'
  };
  
  return (
    <div className={`text-3xl ${mood === 'thinking' ? 'animate-pulse-soft' : ''}`}>
      {moodEmoji[mood]}
    </div>
  );
}

// 框架配置
const FRAMEWORK_OPTIONS = [
  {
    id: 'standard',
    name: 'Standard',
    label: '标准格式',
    description: '角色/任务/约束/输出',
    IconComponent: FileText,
    color: 'from-[#0071e3] to-[#0077ed]',
    suitable: '通用场景'
  },
  {
    id: 'langgpt',
    name: 'LangGPT',
    label: '结构化模板',
    description: 'Role/Skills/Rules/Workflow',
    IconComponent: Puzzle,
    color: 'from-[#bf5af2] to-[#9d4edd]',
    suitable: '复杂角色扮演'
  },
  {
    id: 'costar',
    name: 'CO-STAR',
    label: '内容创作',
    description: '背景/目标/风格/受众',
    IconComponent: Wand2,
    color: 'from-[#ff9f0a] to-[#ff6b35]',
    suitable: '文案写作'
  },
  {
    id: 'structured',
    name: 'XML',
    label: 'XML结构化',
    description: '标签化/程序友好',
    IconComponent: Code2,
    color: 'from-[#30d158] to-[#34c759]',
    suitable: '技术场景'
  }
];

interface PromptSettingsDisplay {
  mode: 'auto' | 'manual';
  scenario: string;
  scenarioName?: string;
  personality: string | null;
  personalityName?: string;
  template: string;
  templateName?: string;
}

interface ChatPanelProps {
  messages: Message[];
  currentQuestion: QuestionResponse | null;
  isLoading: boolean;
  currentTurn: number;
  maxTurns: number;
  onSendMessage: (content: string) => void;
  onStart: (idea: string) => void;
  onRefinePrompt?: (content: string) => void;
  onRethink?: () => void;
  status: 'idle' | 'in_progress' | 'completed';
  promptFramework?: string;
  onFrameworkChange?: (framework: string) => void;
  onOpenSettings?: () => void;
  promptSettingsDisplay?: PromptSettingsDisplay;
  // 优化建议批注系统
  hasPendingChanges?: boolean;
  previousPromptText?: string;
  currentPromptText?: string;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
}

export function ChatPanel({
  messages,
  currentQuestion,
  isLoading,
  currentTurn,
  maxTurns,
  onSendMessage,
  onStart,
  onRefinePrompt,
  onRethink,
  status,
  promptFramework = 'standard',
  onFrameworkChange,
  onOpenSettings,
  promptSettingsDisplay,
  hasPendingChanges = false,
  previousPromptText,
  currentPromptText,
  onAcceptChanges,
  onRejectChanges,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newCustomItem, setNewCustomItem] = useState('');
  const [customOptimizeInput, setCustomOptimizeInput] = useState('');
  const [showDiffDetail, setShowDiffDetail] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hasPendingChanges]);

  useEffect(() => {
    setSelectedOptions(new Set());
    setCustomItems([]);
    setNewCustomItem('');
  }, [currentQuestion?.question]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (status === 'idle') {
      onStart(input.trim());
    } else if (status === 'completed') {
      onRefinePrompt?.(input.trim());
    } else {
      onSendMessage(input.trim());
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检查是否正在使用输入法（IME）进行组合输入
    // isComposing 为 true 表示输入法正在组合文字（如拼音输入中文）
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return; // 输入法组合中，不处理回车
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOptionToggle = (option: QuestionOption) => {
    if (isLoading) return;
    const newSelected = new Set(selectedOptions);
    // 使用 label 而不是 value，这样显示给用户的是友好的中文文本
    const displayText = option.label;
    if (newSelected.has(displayText)) {
      newSelected.delete(displayText);
    } else {
      newSelected.add(displayText);
    }
    setSelectedOptions(newSelected);
  };

  const handleAddCustomItem = () => {
    if (!newCustomItem.trim()) return;
    setCustomItems([...customItems, newCustomItem.trim()]);
    setNewCustomItem('');
  };

  const handleRemoveCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const handleConfirmSelection = () => {
    if (isLoading) return;
    
    const allSelections: string[] = [
      ...Array.from(selectedOptions),
      ...customItems
    ];
    
    if (allSelections.length === 0) return;
    
    const response = allSelections.join('、');
    onSendMessage(response);
    
    setSelectedOptions(new Set());
    setCustomItems([]);
  };

  const hasSelections = selectedOptions.size > 0 || customItems.length > 0;
  const hasPendingCustomItem = newCustomItem.trim().length > 0;
  const progress = maxTurns > 0 ? (currentTurn / maxTurns) * 100 : 0;

  return (
    <div className="flex flex-col h-full card-elevated overflow-hidden">
      {/* 标题栏 */}
      <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0071e3]" />
            产婆术引导
          </h2>
          {(status === 'in_progress' || status === 'completed') && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              status === 'completed' 
                ? 'bg-[#30d158]/10 text-[#30d158]' 
                : 'bg-[#0071e3]/10 text-[#0071e3]'
            }`}>
              {status === 'completed' ? '✓ 智慧诞生' : `${currentTurn}/${maxTurns} 轮`}
            </span>
          )}
        </div>
        {(status === 'in_progress' || status === 'completed') && (
          <div className="mt-3">
            <div className="w-full bg-[#f5f5f7] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  status === 'completed' 
                    ? 'bg-gradient-to-r from-[#30d158] to-[#34c759]' 
                    : 'bg-gradient-to-r from-[#0071e3] to-[#bf5af2]'
                }`}
                style={{ width: status === 'completed' ? '100%' : `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {/* 空状态 - 框架选择 + 文件上传 + 欢迎界面 */}
        {status === 'idle' && (
          <div className="space-y-6">
            {/* 框架选择器 */}
            <div>
              <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide mb-3">选择提示词框架</p>
              <div className="grid grid-cols-2 gap-2">
                {FRAMEWORK_OPTIONS.map((framework) => (
                  <button
                    key={framework.id}
                    onClick={() => onFrameworkChange?.(framework.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all duration-200 ${
                      promptFramework === framework.id
                        ? 'bg-gradient-to-br ' + framework.color + ' text-white shadow-lg shadow-black/10'
                        : 'bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] border border-[#d2d2d7] hover:border-[#0071e3]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        promptFramework === framework.id ? 'bg-white/20' : 'bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed]'
                      }`}>
                        <framework.IconComponent className={`w-5 h-5 ${promptFramework === framework.id ? 'text-white' : 'text-[#1d1d1f]'}`} />
                      </div>
                      <span className="font-semibold text-sm">{framework.name}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${promptFramework === framework.id ? 'text-white/80' : 'text-[#86868b]'}`}>
                      {framework.description}
                    </p>
                    {promptFramework === framework.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 提示词设置按钮 - Apple 风格 */}
            <div className="flex justify-center">
              <button
                onClick={onOpenSettings}
                className="group flex items-center gap-3 px-5 py-3 bg-white hover:bg-[#f5f5f7] border border-[#d2d2d7] hover:border-[#0071e3]/30 rounded-2xl text-sm font-medium text-[#1d1d1f] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#0077ed] flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                {promptSettingsDisplay?.mode === 'auto' ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Auto</span>
                    <span className="text-xs text-[#86868b] bg-[#f5f5f7] px-2 py-0.5 rounded-full">智能推断</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{promptSettingsDisplay?.scenarioName || promptSettingsDisplay?.scenario}</span>
                    {promptSettingsDisplay?.personalityName && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[#86868b]"></span>
                        <span className="text-[#bf5af2] font-medium">{promptSettingsDisplay.personalityName}</span>
                      </>
                    )}
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-[#86868b] group-hover:text-[#0071e3] transition-colors" />
              </button>
            </div>

            {/* 普提狗欢迎语 */}
            <div className="text-center py-6">
              <div className="mb-4 animate-float">
                <PromptGoDog mood="idle" />
              </div>
              <h3 className="text-lg font-semibold text-[#1d1d1f] mb-1">
                嗨，我是普提狗
              </h3>
              <p className="text-[#86868b] text-sm max-w-xs mx-auto leading-relaxed">
                告诉我你想让 AI 做什么，我来帮你"嗅"出最精准的提示词。
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`message-bubble ${
                message.role === 'user' ? 'message-user' : 'message-assistant'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1.5 text-xs ${
                message.role === 'user' ? 'text-white/70' : 'text-[#86868b]'
              }`}>
                {message.role === 'user' ? '你' : '🐕 普提狗'}
              </div>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}

        {/* 选项卡片 - 苏格拉底式追问 */}
        {currentQuestion && status === 'in_progress' && (
          <div className="bg-gradient-to-br from-[#f5f5f7] to-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)]">
            <p className="text-sm text-[#86868b] mb-1">🐕 普提狗眉头一皱，追问道：</p>
            {currentQuestion.hint && (
              <p className="text-sm text-[#0071e3] mb-4 font-medium">{currentQuestion.hint}</p>
            )}
            
            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOptions.has(option.label);
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionToggle(option)}
                      disabled={isLoading}
                      className={`option-tag ${
                        isSelected ? 'option-tag-selected' : 'option-tag-default'
                      } disabled:opacity-50`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            {customItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {customItems.map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-[#30d158]/10 text-[#248a3d] rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleRemoveCustomItem(index)}
                      className="hover:text-[#1d6f2f] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddCustomItem();
                    }
                  }}
                  placeholder="+ 添加自定义想法..."
                  rows={1}
                  className="input-field text-sm resize-none min-h-[42px] max-h-24"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={handleAddCustomItem}
                  disabled={!newCustomItem.trim()}
                  className="w-[42px] h-[42px] flex items-center justify-center bg-[#f5f5f7] text-[#86868b] rounded-xl hover:bg-[#e8e8ed] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            {newCustomItem.trim() && (
              <p className="text-xs text-[#ff9f0a] mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> 有未添加的想法，请点击 + 添加后再确认
              </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[rgba(0,0,0,0.06)]">
              {currentQuestion.current_understanding && typeof currentQuestion.current_understanding === 'string' && (
                <p className="text-xs text-[#86868b] flex-1 pr-4 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ff9f0a]" /> {currentQuestion.current_understanding}
                </p>
              )}
              {currentQuestion.current_understanding && typeof currentQuestion.current_understanding === 'object' && currentQuestion.current_understanding.goal && currentQuestion.current_understanding.goal !== 'UNKNOWN' && (
                <p className="text-xs text-[#86868b] flex-1 pr-4 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ff9f0a]" /> 目标: {currentQuestion.current_understanding.goal}
                </p>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {onRethink && (
                  <button
                    onClick={onRethink}
                    disabled={isLoading}
                    className="btn-secondary text-sm py-2"
                    title="换个思路"
                  >
                    <RefreshCcw className="w-4 h-4 mr-1.5 inline" />
                    换个思路
                  </button>
                )}
                <button
                  onClick={handleConfirmSelection}
                  disabled={!hasSelections || isLoading || hasPendingCustomItem}
                  className="btn-primary text-sm py-2 flex items-center gap-1"
                  title={hasPendingCustomItem ? '请先添加未提交的自定义条目' : ''}
                >
                  确认选择
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 完成状态 - 智慧诞生 */}
        {status === 'completed' && (
          <div className="bg-gradient-to-br from-[#30d158]/5 to-[#34c759]/10 rounded-2xl p-5 border-2 border-[#30d158]/30">
            <div className="flex items-center gap-2 mb-3">
              <PromptGoDog mood="happy" />
              <p className="text-sm font-medium text-[#248a3d]">
                智慧诞生了！点击 Go，让它去改变世界。
              </p>
            </div>
            <p className="text-xs text-[#86868b] mb-3">快捷优化维度：</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: '目标更明确', value: '请帮我让目标描述更加明确和具体', Icon: Target },
                { label: '输入更完整', value: '请帮我补充更多输入信息的说明', Icon: Download },
                { label: '输出更可控', value: '请帮我让输出格式更加规范和可控', Icon: Upload },
                { label: '约束更严格', value: '请帮我添加更多约束条件', Icon: ShieldAlert },
                { label: '添加示例', value: '请帮我添加一些输入输出示例', Icon: BookOpen },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => onRefinePrompt?.(item.value)}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm bg-white border-2 border-[#30d158]/40 text-[#248a3d] rounded-full hover:bg-[#30d158]/10 hover:border-[#30d158]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <item.Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* 自定义优化输入 - 内联式 */}
            <div className="pt-3 border-t border-[#30d158]/20">
              <p className="text-xs text-[#86868b] mb-2">或提出自定义要求：</p>
              <div className="flex gap-2 items-end">
                <textarea
                  value={customOptimizeInput}
                  onChange={(e) => setCustomOptimizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (customOptimizeInput.trim()) {
                        onRefinePrompt?.(customOptimizeInput.trim());
                        setCustomOptimizeInput('');
                      }
                    }
                  }}
                  placeholder="描述你的优化需求..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 text-sm bg-white border-2 border-[#0071e3]/20 rounded-xl focus:border-[#0071e3]/50 focus:ring-2 focus:ring-[#0071e3]/10 outline-none resize-none min-h-[46px] max-h-24 transition-all shadow-sm"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={() => {
                    if (customOptimizeInput.trim()) {
                      onRefinePrompt?.(customOptimizeInput.trim());
                      setCustomOptimizeInput('');
                    }
                  }}
                  disabled={!customOptimizeInput.trim() || isLoading}
                  className="px-4 py-3 text-sm bg-[#0071e3] text-white rounded-xl hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 - 普提狗思考中 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#f5f5f7] rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="animate-pulse-soft">
                <PromptGoDog mood="thinking" />
              </div>
              <span className="text-[#86868b] text-sm">普提狗正在进行哲学思考...</span>
            </div>
          </div>
        )}

        {/* 优化建议对比卡片 - 在对话流中显示 */}
        {hasPendingChanges && previousPromptText && currentPromptText && (
          <div className="flex justify-start">
            <div className="max-w-[95%] bg-gradient-to-br from-[#ff9f0a]/5 to-[#ff6b35]/5 border-2 border-[#ff9f0a]/30 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#ff9f0a]/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#ff9f0a]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1d1d1f]">优化建议已生成</h4>
                    <p className="text-xs text-[#86868b]">请审阅修改，选择接受或撤销</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDiffDetail(!showDiffDetail)}
                  className="text-xs text-[#0071e3] hover:underline flex items-center gap-1"
                >
                  {showDiffDetail ? '收起' : '展开'}
                </button>
              </div>
              
              {showDiffDetail && (
                <div className="space-y-3 mb-4">
                  <div className="bg-white/80 rounded-xl p-3 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">原版本</span>
                    </div>
                    <pre className="text-xs text-[#86868b] whitespace-pre-wrap font-mono leading-relaxed line-through max-h-32 overflow-y-auto">
                      {previousPromptText.length > 500 ? previousPromptText.substring(0, 500) + '...' : previousPromptText}
                    </pre>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">新版本</span>
                    </div>
                    <pre className="text-xs text-[#1d1d1f] whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">
                      {currentPromptText.length > 500 ? currentPromptText.substring(0, 500) + '...' : currentPromptText}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={onAcceptChanges}
                  className="flex-1 px-4 py-2.5 text-sm bg-[#30d158] text-white rounded-xl hover:bg-[#28a745] transition-all font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  接受修改
                </button>
                <button
                  onClick={onRejectChanges}
                  className="flex-1 px-4 py-2.5 text-sm bg-white border-2 border-[#ff3b30]/30 text-[#ff3b30] rounded-xl hover:bg-[#ff3b30]/5 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  撤销修改
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区 */}
      <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-[rgba(0,0,0,0.06)] bg-white/50">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              status === 'idle'
                ? '告诉我你想让 AI 做什么...'
                : status === 'completed'
                ? '描述你的调整需求...'
                : '输入你的回答...'
            }
            disabled={isLoading}
            rows={1}
            className="input-field resize-none min-h-[46px] max-h-32"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary h-[46px] px-5 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="font-medium">Go</span>
          </button>
        </div>
        <p className="text-xs text-[#86868b] mt-2 text-center">Enter 发送 · Shift+Enter 换行</p>
      </form>
    </div>
  );
}
