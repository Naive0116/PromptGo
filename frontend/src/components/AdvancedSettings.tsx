import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Code, FileText, Database, Server, Copy, Check } from 'lucide-react';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  tags: string[];
}

interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

interface SystemPromptInfo {
  name: string;
  description: string;
  content: string;
  editable: boolean;
}

interface BuiltinKnowledge {
  id: string;
  title: string;
  content_preview: string;
  metadata: Record<string, unknown>;
}

interface SystemConfig {
  api_endpoints: APIEndpoint[];
  framework_templates: FrameworkTemplate[];
  system_prompts: SystemPromptInfo[];
  builtin_knowledge: BuiltinKnowledge[];
  rag_stats: Record<string, unknown>;
}

interface AdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedSettings({ isOpen, onClose }: AdvancedSettingsProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    api: true,
    frameworks: false,
    prompts: false,
    knowledge: false,
    rag: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !config) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/system/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setError('加载配置失败');
      }
    } catch (e) {
      setError(`请求失败: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PUT': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#1d1d1f]">高级设置</h2>
            <p className="text-xs text-[#86868b] mt-0.5">查看后端配置、API 端点、系统提示词</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-5 h-5 text-[#86868b]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
              <button onClick={loadConfig} className="ml-2 underline">重试</button>
            </div>
          )}

          {config && (
            <>
              {/* API Endpoints */}
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('api')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  {expandedSections.api ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Server className="w-4 h-4 text-[#0071e3]" />
                  <span className="font-medium text-[#1d1d1f]">API 端点</span>
                  <span className="text-xs text-[#86868b] ml-auto">{config.api_endpoints.length} 个</span>
                </button>
                {expandedSections.api && (
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {config.api_endpoints.map((endpoint, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[#fafafa] rounded-lg hover:bg-[#f0f0f5] transition-colors">
                        <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-mono text-[#1d1d1f] break-all">{endpoint.path}</code>
                          <p className="text-xs text-[#86868b] mt-1">{endpoint.description}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {endpoint.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-[#e8e8ed] text-[#86868b] rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Framework Templates */}
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('frameworks')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  {expandedSections.frameworks ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Code className="w-4 h-4 text-[#34c759]" />
                  <span className="font-medium text-[#1d1d1f]">框架模板</span>
                  <span className="text-xs text-[#86868b] ml-auto">{config.framework_templates.length} 个</span>
                </button>
                {expandedSections.frameworks && (
                  <div className="p-4 space-y-3">
                    {config.framework_templates.map((template) => (
                      <div key={template.id} className="border border-[rgba(0,0,0,0.06)] rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#fafafa]">
                          <div>
                            <span className="font-medium text-sm text-[#1d1d1f]">{template.name}</span>
                            <span className="text-xs text-[#86868b] ml-2">{template.description}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(template.template, template.id)}
                            className="p-1.5 hover:bg-[#e8e8ed] rounded transition-colors"
                            title="复制模板"
                          >
                            {copiedId === template.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#86868b]" />
                            )}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono text-[#1d1d1f] bg-[#1d1d1f]/5 overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {template.template}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Prompts */}
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('prompts')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  {expandedSections.prompts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <FileText className="w-4 h-4 text-[#ff9500]" />
                  <span className="font-medium text-[#1d1d1f]">系统提示词</span>
                  <span className="text-xs text-[#86868b] ml-auto">{config.system_prompts.length} 个</span>
                </button>
                {expandedSections.prompts && (
                  <div className="p-4 space-y-3">
                    {config.system_prompts.map((prompt, i) => (
                      <div key={i} className="border border-[rgba(0,0,0,0.06)] rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#fafafa]">
                          <div>
                            <span className="font-medium text-sm text-[#1d1d1f]">{prompt.name}</span>
                            <span className="text-xs text-[#86868b] ml-2">{prompt.description}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(prompt.content, `prompt-${i}`)}
                            className="p-1.5 hover:bg-[#e8e8ed] rounded transition-colors"
                            title="复制提示词"
                          >
                            {copiedId === `prompt-${i}` ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#86868b]" />
                            )}
                          </button>
                        </div>
                        <pre className="p-3 text-xs font-mono text-[#1d1d1f] bg-[#1d1d1f]/5 overflow-x-auto max-h-64 whitespace-pre-wrap">
                          {prompt.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Builtin Knowledge */}
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('knowledge')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  {expandedSections.knowledge ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Database className="w-4 h-4 text-[#af52de]" />
                  <span className="font-medium text-[#1d1d1f]">内置知识库</span>
                  <span className="text-xs text-[#86868b] ml-auto">{config.builtin_knowledge.length} 条</span>
                </button>
                {expandedSections.knowledge && (
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {config.builtin_knowledge.map((item) => (
                      <div key={item.id} className="p-3 bg-[#fafafa] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-[#1d1d1f]">{item.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#af52de]/10 text-[#af52de] rounded">
                            {(item.metadata as Record<string, string>).type || 'knowledge'}
                          </span>
                        </div>
                        <p className="text-xs text-[#86868b] line-clamp-3">{item.content_preview}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RAG Stats */}
              <div className="border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('rag')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                >
                  {expandedSections.rag ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Database className="w-4 h-4 text-[#007aff]" />
                  <span className="font-medium text-[#1d1d1f]">RAG 向量库状态</span>
                </button>
                {expandedSections.rag && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(config.rag_stats).map(([key, value]) => (
                        <div key={key} className="p-3 bg-[#fafafa] rounded-lg">
                          <p className="text-xs text-[#86868b] mb-1">{key}</p>
                          <p className="text-sm font-medium text-[#1d1d1f]">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[rgba(0,0,0,0.08)] bg-[#f5f5f7] flex-shrink-0">
          <p className="text-xs text-[#86868b]">
            后端 API 文档: <a href="http://localhost:8000/docs" target="_blank" className="text-[#0071e3] hover:underline">http://localhost:8000/docs</a>
          </p>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
