import { useState, useEffect, ReactNode } from 'react';
import { 
  X, Sparkles, Check, ChevronDown, ChevronUp, RotateCcw,
  Code2, Headphones, PenTool, BarChart3, GraduationCap, Zap,
  Briefcase, FlaskConical, Lightbulb, FileText, Star, Bot,
  User, MessageSquare, BookOpen, Target, Layers, Wand2
} from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_auto?: boolean;
  recommended_personality?: string;
  recommended_template?: string;
  tooltip?: string;
}

interface Personality {
  id: string;
  name: string;
  description: string;
  icon: string;
  tooltip?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  tooltip?: string;
}

interface PromptSettings {
  mode: 'auto' | 'manual';
  scenario: string;
  personality: string | null;
  template: string;
  verbosity?: number;
}

interface PromptSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PromptSettings;
  onSave: (settings: PromptSettings) => void;
}

const IconComponent = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => {
  const iconMap: Record<string, ReactNode> = {
    Sparkles: <Wand2 className={className} />,
    Code: <Code2 className={className} />,
    Code2: <Code2 className={className} />,
    Headphones: <Headphones className={className} />,
    PenTool: <PenTool className={className} />,
    BarChart3: <BarChart3 className={className} />,
    GraduationCap: <GraduationCap className={className} />,
    Zap: <Zap className={className} />,
    Briefcase: <Briefcase className={className} />,
    FlaskConical: <FlaskConical className={className} />,
    Lightbulb: <Lightbulb className={className} />,
    FileText: <FileText className={className} />,
    Star: <Star className={className} />,
    Bot: <Bot className={className} />,
    User: <User className={className} />,
    MessageSquare: <MessageSquare className={className} />,
    BookOpen: <BookOpen className={className} />,
    Target: <Target className={className} />,
    Layers: <Layers className={className} />,
  };
  return iconMap[name] || <Layers className={className} />;
};

export function PromptSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: PromptSettingsModalProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [compatibilityMatrix, setCompatibilityMatrix] = useState<Record<string, string[]>>({});
  
  const [localSettings, setLocalSettings] = useState<PromptSettings>({...settings, verbosity: settings.verbosity ?? 5});
  const [showPreview, setShowPreview] = useState(false);
  const [skeletonPreview, setSkeletonPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getVerbosityLabel = (value: number) => {
    if (value <= 3) return '极简';
    if (value <= 6) return '标准';
    return '详尽';
  };

  const getVerbosityDescription = (value: number) => {
    if (value <= 3) return '仅核心内容，无解释';
    if (value <= 6) return '平衡详细程度';
    return '全面解释和多个示例';
  };

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      fetchOptions();
    }
  }, [isOpen, settings]);

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/config/prompt-options');
      const data = await res.json();
      setScenarios(data.scenarios || []);
      setPersonalities(data.personalities || []);
      setTemplates(data.templates || []);
      setCompatibilityMatrix(data.compatibility_matrix || {});
    } catch (e) {
      console.error('Failed to fetch prompt options:', e);
    }
  };

  const fetchSkeletonPreview = async () => {
    if (localSettings.scenario === 'auto') {
      setSkeletonPreview('Auto 模式下，系统将根据您的输入自动推断最佳配置。');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/config/preview-skeleton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: localSettings.scenario,
          personality: localSettings.personality,
          template: localSettings.template,
        }),
      });
      const data = await res.json();
      setSkeletonPreview(data.skeleton || '');
    } catch (e) {
      console.error('Failed to fetch skeleton preview:', e);
      setSkeletonPreview('预览加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showPreview) {
      fetchSkeletonPreview();
    }
  }, [showPreview, localSettings.scenario, localSettings.personality, localSettings.template]);

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario?.is_auto) {
      setLocalSettings({
        mode: 'auto',
        scenario: 'auto',
        personality: null,
        template: 'standard',
      });
    } else {
      setLocalSettings({
        mode: 'manual',
        scenario: scenarioId,
        personality: scenario?.recommended_personality || null,
        template: scenario?.recommended_template || 'standard',
      });
    }
  };

  const handlePersonalitySelect = (personalityId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      personality: personalityId,
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      template: templateId,
    }));
  };

  const handleReset = () => {
    setLocalSettings({
      mode: 'auto',
      scenario: 'auto',
      personality: null,
      template: 'standard',
    });
  };

  const handleApply = () => {
    onSave(localSettings);
    onClose();
  };

  const getRecommendedPersonality = () => {
    const scenario = scenarios.find(s => s.id === localSettings.scenario);
    return scenario?.recommended_personality;
  };

  const getRecommendedTemplate = () => {
    const scenario = scenarios.find(s => s.id === localSettings.scenario);
    return scenario?.recommended_template;
  };

  const getCompatiblePersonalities = () => {
    if (localSettings.scenario === 'auto') return personalities.map(p => p.id);
    return compatibilityMatrix[localSettings.scenario] || personalities.map(p => p.id);
  };

  if (!isOpen) return null;

  const compatiblePersonalities = getCompatiblePersonalities();
  const recommendedPersonality = getRecommendedPersonality();
  const recommendedTemplate = getRecommendedTemplate();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0071e3]" />
            提示词设置
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5 text-[#86868b]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 场景选择 */}
          <div>
            <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide mb-3">
              场景选择
            </p>
            <div className="grid grid-cols-4 gap-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioSelect(scenario.id)}
                  title={scenario.tooltip || scenario.description}
                  className={`group relative p-4 rounded-2xl text-center transition-all duration-200 ${
                    localSettings.scenario === scenario.id
                      ? 'bg-gradient-to-br from-[#0071e3] to-[#0077ed] text-white shadow-lg shadow-[#0071e3]/25'
                      : 'bg-white hover:bg-[#fafafa] text-[#1d1d1f] border-2 border-[#e5e5e5] hover:border-[#0071e3]/50'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                    localSettings.scenario === scenario.id 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-br from-[#f0f0f5] to-[#e5e5ea]'
                  }`}>
                    <IconComponent 
                      name={scenario.icon} 
                      className={`w-5 h-5 ${
                        localSettings.scenario === scenario.id ? 'text-white' : 'text-[#1d1d1f]'
                      }`} 
                    />
                  </div>
                  <span className="font-medium text-xs block">{scenario.name}</span>
                  {localSettings.scenario === scenario.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 人设风格 */}
          <div className={localSettings.scenario === 'auto' ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide mb-3">
              人设风格 {localSettings.scenario === 'auto' && '(Auto 模式自动选择)'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {personalities.map((personality) => {
                const isCompatible = compatiblePersonalities.includes(personality.id);
                const isRecommended = personality.id === recommendedPersonality;
                const isSelected = localSettings.personality === personality.id;
                
                return (
                  <button
                    key={personality.id}
                    onClick={() => handlePersonalitySelect(personality.id)}
                    disabled={!isCompatible}
                    title={personality.tooltip || personality.description}
                    className={`relative p-4 rounded-2xl text-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#bf5af2] to-[#a855f7] text-white shadow-lg shadow-[#bf5af2]/25'
                        : isCompatible
                        ? 'bg-white hover:bg-[#fafafa] text-[#1d1d1f] border-2 border-[#e5e5e5] hover:border-[#bf5af2]/50'
                        : 'bg-[#f5f5f7] text-[#86868b] opacity-40 cursor-not-allowed border-2 border-[#e5e5e5]'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                      isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-[#f0f0f5] to-[#e5e5ea]'
                    }`}>
                      <IconComponent 
                        name={personality.icon} 
                        className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#1d1d1f]'}`} 
                      />
                    </div>
                    <span className="font-medium text-xs block">{personality.name}</span>
                    {isRecommended && !isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 text-[9px] font-medium bg-gradient-to-r from-[#ff9f0a] to-[#ff6b00] text-white px-2 py-0.5 rounded-full shadow-sm">
                        推荐
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 输出模板 */}
          <div className={localSettings.scenario === 'auto' ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide mb-3">
              输出模板 {localSettings.scenario === 'auto' && '(Auto 模式自动选择)'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {templates.map((template) => {
                const isRecommended = template.id === recommendedTemplate;
                const isSelected = localSettings.template === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    title={template.tooltip || template.description}
                    className={`relative p-4 rounded-2xl text-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#30d158] to-[#28a745] text-white shadow-lg shadow-[#30d158]/25'
                        : 'bg-white hover:bg-[#fafafa] text-[#1d1d1f] border-2 border-[#e5e5e5] hover:border-[#30d158]/50'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                      isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-[#f0f0f5] to-[#e5e5ea]'
                    }`}>
                      <IconComponent 
                        name={template.icon} 
                        className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#1d1d1f]'}`} 
                      />
                    </div>
                    <span className="font-medium text-xs block">{template.name}</span>
                    {isRecommended && !isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 text-[9px] font-medium bg-gradient-to-r from-[#ff9f0a] to-[#ff6b00] text-white px-2 py-0.5 rounded-full shadow-sm">
                        推荐
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 冗余度控制 - 基于 GPT-5 的 oververbosity 设计 */}
          <div>
            <p className="text-xs font-medium text-[#86868b] uppercase tracking-wide mb-3">
              输出详细程度
            </p>
            <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    (localSettings.verbosity ?? 5) <= 3 
                      ? 'bg-gradient-to-br from-[#30d158]/10 to-[#30d158]/20' 
                      : (localSettings.verbosity ?? 5) <= 6 
                      ? 'bg-gradient-to-br from-[#0071e3]/10 to-[#0071e3]/20'
                      : 'bg-gradient-to-br from-[#bf5af2]/10 to-[#bf5af2]/20'
                  }`}>
                    {(localSettings.verbosity ?? 5) <= 3 
                      ? <Zap className="w-5 h-5 text-[#30d158]" />
                      : (localSettings.verbosity ?? 5) <= 6 
                      ? <FileText className="w-5 h-5 text-[#0071e3]" />
                      : <BookOpen className="w-5 h-5 text-[#bf5af2]" />
                    }
                  </div>
                  <div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {getVerbosityLabel(localSettings.verbosity ?? 5)}
                    </span>
                    <span className="text-[#86868b] text-sm ml-2">
                      {getVerbosityDescription(localSettings.verbosity ?? 5)}
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#0071e3]">
                  {localSettings.verbosity ?? 5}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={localSettings.verbosity ?? 5}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  verbosity: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gradient-to-r from-[#30d158] via-[#0071e3] to-[#bf5af2] rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #30d158, #0071e3, #bf5af2)`
                }}
              />
              <div className="relative text-xs text-[#86868b] mt-1 h-4">
                <span className="absolute left-0 top-0">极简</span>
                <span className="absolute left-[44.444%] top-0 -translate-x-1/2">标准</span>
                <span className="absolute right-0 top-0">详尽</span>
              </div>
            </div>
          </div>

          {/* 预览区域 */}
          <div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-[#0071e3] hover:underline"
            >
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              预览提示词骨架
            </button>
            {showPreview && (
              <div className="mt-3 p-4 bg-[#f5f5f7] rounded-xl">
                {isLoading ? (
                  <p className="text-sm text-[#86868b]">加载中...</p>
                ) : (
                  <pre className="text-xs text-[#1d1d1f] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                    {skeletonPreview}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.08)] bg-[#f5f5f7]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#1d1d1f] flex items-center gap-1">
              当前：
              <span className="font-medium flex items-center gap-1">
                {localSettings.scenario === 'auto' ? (
                  <><Wand2 className="w-3.5 h-3.5 inline text-[#0071e3]" /> Auto</>
                ) : scenarios.find(s => s.id === localSettings.scenario)?.name || localSettings.scenario}
              </span>
              {localSettings.personality && (
                <>
                  {' | '}
                  <span className="font-medium">
                    {personalities.find(p => p.id === localSettings.personality)?.name || localSettings.personality}
                  </span>
                </>
              )}
              {' | '}
              <span className="font-medium">
                {templates.find(t => t.id === localSettings.template)?.name || localSettings.template}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2 text-sm font-medium text-white bg-[#0071e3] rounded-full hover:bg-[#0077ed] transition-colors"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
