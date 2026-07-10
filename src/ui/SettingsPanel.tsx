import { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, XCircle, Loader2, Download, ChevronDown, Copy, Check, RefreshCw } from 'lucide-react';
import type { ProviderConfig, ProviderType } from '../llm/types';
import {
  pingOllama,
  fetchOllamaModels,
  pullOllamaModel,
  type OllamaModelInfo,
} from '../llm/LLMServiceFactory';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  config: ProviderConfig;
  onConfigChange: (config: ProviderConfig) => void;
}

interface RecommendedModel {
  name: string;
  label: string;
  desc: string;
  role: 'text' | 'vision' | 'both';
}

const RECOMMENDED_MODELS: RecommendedModel[] = [
  { name: 'llama3.2', label: 'Llama 3.2', desc: 'Medical text planning, no vision', role: 'text' },
  { name: 'gemma3:4b', label: 'Gemma 3 4B', desc: 'Official Google, text + vision (3.3GB)', role: 'both' },
  { name: 'llava:7b', label: 'LLaVA 7B', desc: 'Proven vision support (4.7GB)', role: 'vision' },
  { name: 'llama3.2:latest', label: 'Llama 3.2 3B', desc: 'Fast general text (2GB)', role: 'text' },
];

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)}GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
}

export default function SettingsPanel({ open, onClose, config, onConfigChange }: SettingsPanelProps) {
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'checking' | 'online' | 'offline'>('unknown');
  const [installedModels, setInstalledModels] = useState<OllamaModelInfo[]>([]);
  const [pulling, setPulling] = useState<{ model: string; status: string; percent: number | null } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const baseUrl = config.ollamaUrl || 'http://localhost:11434';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const refreshModels = useCallback(async () => {
    setOllamaStatus('checking');
    const online = await pingOllama(baseUrl);
    setOllamaStatus(online ? 'online' : 'offline');
    if (online) {
      const models = await fetchOllamaModels(baseUrl);
      setInstalledModels(models);
    } else {
      setInstalledModels([]);
    }
  }, [baseUrl]);

  // Check Ollama when panel opens or provider changes to ollama
  useEffect(() => {
    if (open && config.provider === 'ollama') {
      refreshModels();
    }
  }, [open, config.provider, refreshModels]);

  const handlePull = async (modelName: string) => {
    setPulling({ model: modelName, status: 'Starting...', percent: null });
    const success = await pullOllamaModel(
      modelName,
      (status, percent) => setPulling({ model: modelName, status, percent }),
      baseUrl,
    );
    if (success) {
      await refreshModels();
    }
    // Keep the final status visible briefly
    setTimeout(() => setPulling(null), 1500);
  };

  if (!open) return null;

  const setProvider = (provider: ProviderType) => {
    onConfigChange({ ...config, provider });
  };

  const isInstalled = (name: string) =>
    installedModels.some((m) => m.name === name || m.name === name.replace(':latest', '') || m.name + ':latest' === name);

  const textModel = config.ollamaTextModel || 'llama3.2';
  const visionModel = config.ollamaVisionModel || 'llava:7b';

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        ref={panelRef}
        className="absolute top-12 right-4 w-96 max-h-[80vh] bg-bg-tertiary border border-neutral-600 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-strong shrink-0">
          <span className="text-sm font-medium text-neutral-200">LLM Settings</span>
          <button onClick={onClose} className="p-0.5 rounded hover:bg-border-strong text-text-secondary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* UI Settings */}
          <div className="pb-4 border-b border-border-strong mb-4 space-y-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">Theme</label>
              <div className="flex bg-bg-secondary rounded-lg p-0.5 gap-1">
                <button
                  onClick={() => onConfigChange({ ...config, theme: 'dark' })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    (!config.theme || config.theme === 'dark') ? 'bg-blue-600 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => onConfigChange({ ...config, theme: 'light' })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    config.theme === 'light' ? 'bg-blue-600 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary block mb-1.5">
                Text Size
              </label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={config.fontScale ?? 1.0}
                onChange={(e) => onConfigChange({ ...config, fontScale: parseFloat(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>Smaller</span>
                <span>Default</span>
                <span>Larger</span>
              </div>
            </div>
          </div>

          {/* Provider Toggle */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Provider</label>
            <div className="flex bg-bg-secondary rounded-lg p-0.5 gap-1">
              <button
                onClick={() => setProvider('claude')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  config.provider === 'claude' ? 'bg-blue-600 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Claude
              </button>
              <button
                onClick={() => setProvider('ollama')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  config.provider === 'ollama' ? 'bg-blue-600 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Ollama
              </button>
              <button
                onClick={() => setProvider('openrouter')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  config.provider === 'openrouter' ? 'bg-blue-600 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                OpenRouter
              </button>
            </div>
          </div>

          {/* Claude fields */}
          {config.provider === 'claude' && (
            <div>
              <label className="text-xs text-text-secondary block mb-1.5">API Key</label>
              <input
                type="password"
                value={config.apiKey ?? ''}
                onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-text-tertiary mt-1">
                Stored in localStorage only. Never sent to our servers.
              </p>
            </div>
          )}

          {/* OpenRouter fields */}
          {config.provider === 'openrouter' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">API Key</label>
                <input
                  type="password"
                  value={config.apiKey ?? ''}
                  onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
                  placeholder="sk-or-..."
                  className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1.5">Base URL</label>
                <input
                  type="text"
                  value={config.openRouterUrl ?? 'https://openrouter.ai/api/v1'}
                  onChange={(e) => onConfigChange({ ...config, openRouterUrl: e.target.value })}
                  placeholder="https://openrouter.ai/api/v1"
                  className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1.5">Text Model</label>
                <input
                  type="text"
                  value={config.openRouterTextModel ?? 'openai/gpt-4o-mini'}
                  onChange={(e) => onConfigChange({ ...config, openRouterTextModel: e.target.value })}
                  placeholder="openai/gpt-4o-mini"
                  className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary block mb-1.5">Vision Model</label>
                <input
                  type="text"
                  value={config.openRouterVisionModel ?? 'openai/gpt-4o-mini'}
                  onChange={(e) => onConfigChange({ ...config, openRouterVisionModel: e.target.value })}
                  placeholder="openai/gpt-4o-mini"
                  className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
                />
              </div>

              <p className="text-[10px] text-text-tertiary">
                Use any OpenRouter-compatible model name. Examples: openai/gpt-4o-mini or google/gemini-2.0-flash-1.
              </p>
            </div>
          )}

          {/* Ollama fields */}
          {config.provider === 'ollama' && (
            <>
              {/* Status */}
              <div className="flex items-center gap-2 text-xs">
                {ollamaStatus === 'checking' && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="text-text-secondary">Connecting...</span>
                  </>
                )}
                {ollamaStatus === 'online' && (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Ollama running</span>
                    <span className="text-text-tertiary">({installedModels.length} model{installedModels.length !== 1 ? 's' : ''})</span>
                  </>
                )}
                {ollamaStatus === 'offline' && (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400">Ollama not running</span>
                  </>
                )}
                <button
                  onClick={refreshModels}
                  className="text-text-tertiary hover:text-neutral-300 ml-auto text-xs"
                >
                  Refresh
                </button>
              </div>

              {ollamaStatus === 'offline' && (
                <OllamaOfflineHelp onRetry={refreshModels} />
              )}

              {/* Ollama URL */}
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">Ollama URL</label>
                <input
                  type="text"
                  value={config.ollamaUrl ?? 'http://localhost:11434'}
                  onChange={(e) => onConfigChange({ ...config, ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none focus:border-blue-500"
                />
              </div>

              {ollamaStatus === 'online' && (
                <>
                  {/* Text Model (Call 1) */}
                  <div>
                    <label className="text-xs text-text-secondary block mb-1.5">
                      Text Model <span className="text-neutral-600">(Call 1: slice planning)</span>
                    </label>
                    <ModelDropdown
                      value={textModel}
                      models={installedModels}
                      onChange={(m) => onConfigChange({ ...config, ollamaTextModel: m })}
                    />
                  </div>

                  {/* Vision Model (Call 2) */}
                  <div>
                    <label className="text-xs text-text-secondary block mb-1.5">
                      Vision Model <span className="text-neutral-600">(Call 2: image analysis)</span>
                    </label>
                    <ModelDropdown
                      value={visionModel}
                      models={installedModels}
                      onChange={(m) => onConfigChange({ ...config, ollamaVisionModel: m })}
                    />
                  </div>

                  {/* Recommended Models */}
                  <div>
                    <label className="text-xs text-text-secondary block mb-2">Available Models</label>
                    <div className="space-y-1.5">
                      {RECOMMENDED_MODELS.map((rm) => {
                        const installed = isInstalled(rm.name);
                        const isPulling = pulling?.model === rm.name;
                        return (
                          <div
                            key={rm.name}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                              installed ? 'bg-bg-secondary' : 'bg-bg-secondary/50 border border-dashed border-border-strong'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-neutral-200 font-medium">{rm.label}</span>
                                <RoleBadge role={rm.role} />
                                {installed && <CheckCircle className="w-3 h-3 text-green-500" />}
                              </div>
                              <p className="text-text-tertiary text-[10px] mt-0.5">{rm.desc}</p>
                            </div>
                            {!installed && !isPulling && (
                              <button
                                onClick={() => handlePull(rm.name)}
                                disabled={!!pulling}
                                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-text-primary text-[10px] font-medium disabled:opacity-30"
                              >
                                <Download className="w-3 h-3" />
                                Pull
                              </button>
                            )}
                            {isPulling && (
                              <div className="shrink-0 text-right">
                                <div className="flex items-center gap-1 text-blue-400">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span className="text-[10px]">{pulling.percent != null ? `${pulling.percent}%` : '...'}</span>
                                </div>
                              </div>
                            )}
                            {installed && !isPulling && (
                              <div className="shrink-0 flex gap-1">
                                {(rm.role === 'text' || rm.role === 'both') && (
                                  <button
                                    onClick={() => onConfigChange({ ...config, ollamaTextModel: rm.name })}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      textModel === rm.name
                                        ? 'bg-purple-600 text-text-primary'
                                        : 'bg-border-strong text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    Text
                                  </button>
                                )}
                                {(rm.role === 'vision' || rm.role === 'both') && (
                                  <button
                                    onClick={() => onConfigChange({ ...config, ollamaVisionModel: rm.name })}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      visionModel === rm.name
                                        ? 'bg-teal-600 text-text-primary'
                                        : 'bg-border-strong text-text-secondary hover:text-text-primary'
                                    }`}
                                  >
                                    Vision
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pull progress bar */}
                  {pulling && (
                    <div className="bg-bg-secondary rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-mono">{pulling.model}</span>
                        <span className="text-text-tertiary">{pulling.percent != null ? `${pulling.percent}%` : pulling.status}</span>
                      </div>
                      {pulling.percent != null && (
                        <div className="h-1 bg-border-strong rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${pulling.percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Offline Help ---

function OllamaOfflineHelp({ onRetry }: { onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copyCommand = () => {
    navigator.clipboard.writeText('ollama serve');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startPolling = () => {
    setPolling(true);
    // Check every 2 seconds
    intervalRef.current = setInterval(async () => {
      const ok = await pingOllama();
      if (ok) {
        setPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        onRetry();
      }
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-bg-secondary rounded-lg px-3 py-3 space-y-2.5">
      <div className="text-xs text-text-secondary">
        Ollama is not running. Start it in your terminal:
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-bg-primary text-neutral-200 font-mono text-xs px-3 py-1.5 rounded">
          ollama serve
        </code>
        <button
          onClick={copyCommand}
          className="p-1.5 rounded bg-border-strong hover:bg-neutral-600 text-neutral-300 transition-colors"
          title="Copy command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        {!polling ? (
          <button
            onClick={startPolling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-text-primary text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Wait for Ollama...
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Waiting for Ollama to start...
          </div>
        )}
      </div>
      <div className="text-[10px] text-neutral-600">
        Don't have Ollama? <a href="https://ollama.com/download" target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-400 underline">Download it here</a>
      </div>
    </div>
  );
}

// --- Sub-components ---

function RoleBadge({ role }: { role: 'text' | 'vision' | 'both' }) {
  if (role === 'text') return <span className="px-1 py-0 rounded text-[9px] bg-purple-900/50 text-purple-400">text</span>;
  if (role === 'vision') return <span className="px-1 py-0 rounded text-[9px] bg-teal-900/50 text-teal-400">vision</span>;
  return <span className="px-1 py-0 rounded text-[9px] bg-amber-900/50 text-amber-400">text+vision</span>;
}

function ModelDropdown({
  value,
  models,
  onChange,
}: {
  value: string;
  models: OllamaModelInfo[];
  onChange: (model: string) => void;
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setDropOpen(!dropOpen)}
        className="w-full flex items-center justify-between bg-bg-secondary border border-border-strong rounded-lg px-3 py-2 text-sm text-neutral-100 hover:border-neutral-600"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
      </button>
      {dropOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg-tertiary border border-border-strong rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto">
          {models.map((m) => (
            <button
              key={m.name}
              onClick={() => {
                onChange(m.name);
                setDropOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-1.5 text-sm text-left transition-colors ${
                value === m.name ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-300 hover:bg-border-strong'
              }`}
            >
              <span className="truncate">{m.name}</span>
              <span className="text-[10px] text-text-tertiary shrink-0 ml-2">{formatSize(m.size)}</span>
            </button>
          ))}
          {models.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-tertiary">No models installed</div>
          )}
        </div>
      )}
    </div>
  );
}
