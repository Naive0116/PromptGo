import { useState, useEffect } from 'react';
import { Plus, PanelLeftClose, PanelLeft, Settings, X, Save } from 'lucide-react';
import { ChatPanel, PromptPreview, HistoryList } from '../components';
import { useConversation } from '../hooks/useConversation';
import { usePromptHistory } from '../hooks/usePromptHistory';
import type { QuestionResponse, GeneratedPromptResponse, Prompt } from '../types';

// 普提狗 Logo 组件
function PromptGoLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-[#0071e3] to-[#bf5af2] flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold">🐕</span>
    </div>
  );
}

interface SettingsData {
  llmProvider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTurns: number;
  promptFramework: string;
  // OCR 解析配置
  ocrProvider: string;
  ocrBaseUrl: string;
  ocrApiKey: string;
  ocrModel: string;
}

function SettingsPanel({ 
  isOpen, 
  onClose,
  settings,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void;
  settings: SettingsData;
  onSave: (settings: SettingsData) => void;
}) {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings);

  // 同步外部settings变化到localSettings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    localStorage.setItem('promptforge_settings', JSON.stringify(localSettings));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1d1d1f]">设置</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5 text-[#86868b]" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              LLM 提供商
            </label>
            <input
              type="text"
              value={localSettings.llmProvider}
              onChange={(e) => setLocalSettings({ ...localSettings, llmProvider: e.target.value })}
              placeholder="例如: anthropic, deepseek, qwen, openai, custom"
              className="input-field"
              list="provider-suggestions"
            />
            <datalist id="provider-suggestions">
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="qwen">通义千问</option>
              <option value="openai">OpenAI</option>
              <option value="custom">自定义代理/兼容接口</option>
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Base URL <span className="text-[#86868b] font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={localSettings.baseUrl}
              onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
              placeholder="例如: https://api.openai-proxy.com/v1"
              className="input-field"
            />
            <p className="mt-2 text-xs text-[#86868b]">
              留空则使用官方默认地址
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
              placeholder="输入你的 API Key"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              模型名称
            </label>
            <input
              type="text"
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              placeholder="例如: gpt-4o, deepseek-chat"
              className="input-field"
              list="model-suggestions"
            />
            <datalist id="model-suggestions">
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="deepseek-chat">DeepSeek Chat</option>
              <option value="deepseek-reasoner">DeepSeek Reasoner</option>
              <option value="qwen-turbo">Qwen Turbo</option>
              <option value="qwen-plus">Qwen Plus</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              最大对话轮次
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={localSettings.maxTurns}
              onChange={(e) => setLocalSettings({ ...localSettings, maxTurns: parseInt(e.target.value) || 5 })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              提示词框架
            </label>
            <select
              value={localSettings.promptFramework}
              onChange={(e) => setLocalSettings({ ...localSettings, promptFramework: e.target.value })}
              className="input-field cursor-pointer"
            >
              <option value="standard">标准格式 - 角色/任务/约束/输出</option>
              <option value="langgpt">LangGPT - 结构化角色扮演模板</option>
              <option value="costar">CO-STAR - 背景/目标/风格/语气/受众/响应</option>
              <option value="structured">XML结构化 - 标签化格式</option>
            </select>
            <p className="mt-2 text-xs text-[#86868b]">
              {localSettings.promptFramework === 'standard' && '适合通用场景，结构清晰易懂'}
              {localSettings.promptFramework === 'langgpt' && '适合复杂角色扮演，包含技能和工作流'}
              {localSettings.promptFramework === 'costar' && '适合内容创作，强调风格和受众'}
              {localSettings.promptFramework === 'structured' && '适合技术场景，便于程序解析'}
            </p>
          </div>

          {/* OCR 文档解析配置 */}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.08)]">
            <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2">
              📄 文档解析配置
              <span className="text-xs font-normal text-[#86868b]">(用于 RAG 文件上传)</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  OCR 提供商
                </label>
                <select
                  value={localSettings.ocrProvider || 'qwen-vl'}
                  onChange={(e) => setLocalSettings({ ...localSettings, ocrProvider: e.target.value })}
                  className="input-field cursor-pointer"
                >
                  <option value="qwen-vl">通义千问 Qwen-VL（推荐）</option>
                  <option value="openai">OpenAI GPT-4 Vision</option>
                  <option value="none">不使用 OCR（仅解析文本）</option>
                </select>
                <p className="mt-2 text-xs text-[#86868b]">
                  图片和扫描件 PDF 需要 OCR 才能提取文字
                </p>
              </div>

              {localSettings.ocrProvider !== 'none' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      OCR API Key <span className="text-[#ff453a]">*</span>
                    </label>
                    <input
                      type="password"
                      value={localSettings.ocrApiKey || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, ocrApiKey: e.target.value })}
                      placeholder={localSettings.ocrProvider === 'qwen-vl' ? '通义千问 API Key' : 'OpenAI API Key'}
                      className="input-field"
                    />
                    <p className="mt-2 text-xs text-[#86868b]">
                      {localSettings.ocrProvider === 'qwen-vl' 
                        ? '从阿里云 DashScope 获取：https://dashscope.console.aliyun.com/' 
                        : '从 OpenAI 获取：https://platform.openai.com/api-keys'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      OCR Base URL <span className="text-[#86868b] font-normal">(可选)</span>
                    </label>
                    <input
                      type="text"
                      value={localSettings.ocrBaseUrl || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, ocrBaseUrl: e.target.value })}
                      placeholder={localSettings.ocrProvider === 'qwen-vl' 
                        ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' 
                        : 'https://api.openai.com/v1'}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      OCR 模型
                    </label>
                    <input
                      type="text"
                      value={localSettings.ocrModel || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, ocrModel: e.target.value })}
                      placeholder={localSettings.ocrProvider === 'qwen-vl' ? 'qwen-vl-max' : 'gpt-4o'}
                      className="input-field"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgba(0,0,0,0.08)] bg-[#f5f5f7]">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

interface UploadedFile {
  name: string;
  type: string;
  parsing?: boolean;
  content?: string;
}

export function SplitView() {
  const [showHistory, setShowHistory] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<SettingsData>(() => {
    const defaultSettings: SettingsData = { 
      llmProvider: 'anthropic', 
      baseUrl: '', 
      apiKey: '', 
      model: 'claude-sonnet-4-5-20250929', 
      maxTurns: 5, 
      promptFramework: 'standard',
      // OCR 默认配置
      ocrProvider: 'qwen-vl',
      ocrBaseUrl: '',
      ocrApiKey: '',
      ocrModel: 'qwen-vl-max'
    };
    const saved = localStorage.getItem('promptforge_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 合并旧设置与默认值，确保新字段（如baseUrl）有默认值
        return { ...defaultSettings, ...parsed };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const conversation = useConversation();
  const history = usePromptHistory();

  const currentQuestion = conversation.currentResponse?.type === 'question'
    ? conversation.currentResponse as QuestionResponse
    : null;

  const generatedPrompt = conversation.currentResponse?.type === 'prompt'
    ? conversation.currentResponse as GeneratedPromptResponse
    : null;

  const handleStart = async (idea: string) => {
    try {
      // 如果有上传的文件，将解析内容附加到用户输入
      let enrichedIdea = idea;
      const parsedFiles = uploadedFiles.filter(f => f.content && !f.content.includes('失败'));
      if (parsedFiles.length > 0) {
        const fileContexts = parsedFiles.map(f => 
          `【参考文档: ${f.name}】\n${f.content}`
        ).join('\n\n---\n\n');
        enrichedIdea = `${idea}\n\n---\n以下是用户上传的参考文档内容，请在生成提示词时参考其中的专业术语和背景知识：\n\n${fileContexts}`;
      }
      
      await conversation.startConversation(enrichedIdea, {
        llmProvider: settings.llmProvider,
        baseUrl: settings.baseUrl || undefined,
        apiKey: settings.apiKey || undefined,
        model: settings.model || undefined,
        maxTurns: settings.maxTurns,
        promptFramework: settings.promptFramework
      });
      
      // 开始对话后清空已上传文件
      setUploadedFiles([]);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await conversation.sendMessage(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleRefinePrompt = async (content: string) => {
    try {
      await conversation.refinePrompt(content);
    } catch (err) {
      console.error('Failed to refine prompt:', err);
    }
  };

  const handleReset = () => {
    conversation.reset();
    history.loadConversations();
    history.loadPrompts();
  };

  const handleSelectConversation = async (id: string) => {
    try {
      await conversation.loadConversation(id);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    const promptResponse: GeneratedPromptResponse = {
      type: 'prompt',
      prompt: {
        role: prompt.role_definition || '',
        task: prompt.task_description || '',
        constraints: prompt.constraints || [],
        output_format: prompt.output_format || '',
        examples: [],
      },
      raw_text: prompt.raw_text,
      tags: prompt.tags || [],
    };
    conversation.setPromptPreview(promptResponse);
  };

  const handleFrameworkChange = (framework: string) => {
    const newSettings = { ...settings, promptFramework: framework };
    setSettings(newSettings);
    localStorage.setItem('promptforge_settings', JSON.stringify(newSettings));
  };

  const handleFileUpload = async (file: File) => {
    const newFile: UploadedFile = {
      name: file.name,
      type: file.type,
      parsing: true,
    };
    setUploadedFiles(prev => [...prev, newFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // 传递 OCR 配置用于多模态解析
      if (settings.ocrProvider !== 'none') {
        if (settings.ocrApiKey) {
          formData.append('api_key', settings.ocrApiKey);
        }
        if (settings.ocrBaseUrl) {
          formData.append('base_url', settings.ocrBaseUrl);
        } else if (settings.ocrProvider === 'qwen-vl') {
          formData.append('base_url', 'https://dashscope.aliyuncs.com/compatible-mode/v1');
        }
        if (settings.ocrModel) {
          formData.append('model', settings.ocrModel);
        } else if (settings.ocrProvider === 'qwen-vl') {
          formData.append('model', 'qwen-vl-max');
        } else if (settings.ocrProvider === 'openai') {
          formData.append('model', 'gpt-4o');
        }
      }
      
      const response = await fetch('/api/documents/parse', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name ? { ...f, parsing: false, content: data.content } : f
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({ detail: '解析失败' }));
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name ? { ...f, parsing: false, content: errorData.detail || '解析失败' } : f
          )
        );
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadedFiles(prev => 
        prev.map(f => 
          f.name === file.name ? { ...f, parsing: false, content: '上传失败' } : f
        )
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f7]">
      {/* 苹果风格顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[rgba(0,0,0,0.08)] px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <PromptGoLogo size="md" />
          <div>
            <h1 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
              PromptGo
            </h1>
            <p className="text-xs text-[#86868b] -mt-0.5">AI 时代的精神助产术</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0071e3] hover:bg-[#0071e3]/10 rounded-full transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            新对话
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all active:scale-[0.98] ${
              showHistory 
                ? 'bg-[#0071e3] text-white' 
                : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
            }`}
          >
            {showHistory ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
            历史
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-[#86868b] hover:bg-[#f5f5f7] rounded-full transition-all active:scale-[0.98]"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {showHistory && (
          <div className="w-72 flex-shrink-0 border-r border-[rgba(0,0,0,0.08)]">
            <HistoryList
              conversations={history.conversations}
              prompts={history.prompts}
              isLoading={history.isLoading}
              onSelectConversation={handleSelectConversation}
              onSelectPrompt={handleSelectPrompt}
              onDeleteConversation={history.deleteConversation}
              onDeletePrompt={history.deletePrompt}
            />
          </div>
        )}

        <main className="flex-1 flex gap-5 p-5 overflow-hidden">
          <div className="flex-1 min-w-0">
            <ChatPanel
              messages={conversation.messages}
              currentQuestion={currentQuestion}
              isLoading={conversation.isLoading}
              currentTurn={conversation.currentTurn}
              maxTurns={conversation.maxTurns}
              onSendMessage={handleSendMessage}
              onStart={handleStart}
              onRefinePrompt={handleRefinePrompt}
              onRethink={conversation.rethink}
              status={conversation.status}
              promptFramework={settings.promptFramework}
              onFrameworkChange={handleFrameworkChange}
              onFileUpload={handleFileUpload}
              uploadedFiles={uploadedFiles}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          <div className="flex-1 min-w-0">
            <PromptPreview
              promptResponse={generatedPrompt}
              currentUnderstanding={currentQuestion?.current_understanding}
              status={conversation.status}
            />
          </div>
        </main>
      </div>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
      />

      {conversation.error && (
        <div className="fixed bottom-6 right-6 bg-[#ff453a] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <span className="text-sm font-medium">{conversation.error}</span>
        </div>
      )}
    </div>
  );
}
