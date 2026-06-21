'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  contextWindow: string;
  latency: 'Ultra-Low' | 'Low' | 'Medium' | 'High';
  capabilities: string[];
  description: string;
  recommended: boolean;
}

const modelOptions: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Ultra-Low',
    capabilities: ['Text', 'Audio input', 'Vision', 'Tool Calling'],
    description: 'Default. Next-generation speed and quality. Highly capable, supports native multimodal inputs and real-time execution.',
    recommended: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google AI',
    contextWindow: '2,097,152 tokens',
    latency: 'Medium',
    capabilities: ['Text', 'Audio input', 'Vision', 'Tool Calling', 'Deep Reasoning'],
    description: 'Heavyweight reasoning model. Slower but capable of handling extremely complex architectural tasks and long contexts.',
    recommended: false,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Exp)',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Ultra-Low',
    capabilities: ['Text', 'Audio input', 'Vision', 'Tool Calling', 'Search Grounding'],
    description: 'Experimental 2.0 Flash model. Offers cutting-edge features but may have changing APIs or instability.',
    recommended: false,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Low',
    capabilities: ['Text', 'Audio', 'Vision', 'Tool Calling'],
    description: 'Solid, reliable, and fast baseline model. Great for most conversational tasks and simple coding.',
    recommended: false,
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Ultra-Low',
    capabilities: ['Text', 'Audio', 'Vision'],
    description: 'Extremely fast and lightweight model variant. Perfect for quick routing, auditing, and simple JSON tasks.',
    recommended: false,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    contextWindow: '2,097,152 tokens',
    latency: 'High',
    capabilities: ['Text', 'Audio', 'Vision', 'Tool Calling', 'Math'],
    description: 'Legacy Pro model. Highly capable reasoning engine available on the free tier with a generous context window.',
    recommended: false,
  },
];

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Provider status
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  // Read cookies and status on mount
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? match[2] : null;
    };

    const cookieModel = getCookie('selected_model');
    const cookieTemp = getCookie('model_temperature');
    const cookieMaxTokens = getCookie('model_max_tokens');

    if (cookieModel) setSelectedModel(cookieModel);
    if (cookieTemp) setTemperature(parseFloat(cookieTemp));
    if (cookieMaxTokens) setMaxTokens(parseInt(cookieMaxTokens, 10));

    // Fetch provider status
    fetch('/api/models/status')
      .then(res => res.json())
      .then(data => {
        if (data.providers) {
          setProviderStatus(data.providers);
        }
      })
      .catch(err => console.error('Failed to fetch provider status:', err));
  }, []);

  // Save changes to cookies
  const saveCookie = (name: string, value: string | number) => {
    document.cookie = `${name}=${value}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    saveCookie('selected_model', modelId);
  };

  const handleTemperatureChange = (val: number) => {
    setTemperature(val);
    saveCookie('model_temperature', val);
  };

  const handleMaxTokensChange = (val: number) => {
    setMaxTokens(val);
    saveCookie('model_max_tokens', val);
  };

  const handleTestModel = async () => {
    if (!prompt.trim() || isPending) return;

    setIsPending(true);
    setResponse('Connecting to model...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.response || 'No response returned.');
      } else {
        const errData = await res.json();
        setResponse(`Error: ${errData.error || 'Failed to fetch response.'}`);
      }
    } catch (err) {
      setResponse(`Error: Network issue. Details: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--donna-text-muted)', fontSize: '1.2rem' }}>←</Link>
          <span className={styles.title}>Model Directory</span>
        </div>
        <div className={styles.headerBadge}>
          Active: {modelOptions.find(m => m.id === selectedModel)?.name || selectedModel}
        </div>
      </header>

      <section className={styles.contentArea}>
        
        {/* Model Selection Cards */}
        <div className={styles.modelsGrid}>
          {modelOptions.map((model) => {
            const isSelected = selectedModel === model.id;
            const isAvailable = providerStatus[model.provider] !== false; // default true if loading
            
            return (
              <div 
                key={model.id} 
                className={`${styles.modelCard} ${isSelected ? styles.cardSelected : ''} ${!isAvailable ? 'opacity-50 grayscale' : ''}`}
                onClick={() => isAvailable && handleSelectModel(model.id)}
              >
                {model.recommended && isAvailable && (
                  <span className={styles.recommendedBadge}>RECOMMENDED</span>
                )}
                {!isAvailable && (
                  <span className="absolute top-4 right-4 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">Missing Key</span>
                )}
                {isAvailable && Object.keys(providerStatus).length > 0 && (
                   <span className="absolute top-4 right-4 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">Available</span>
                )}
                
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.modelName}>{model.name}</h3>
                    <p className={styles.modelProvider}>{model.provider}</p>
                  </div>
                  {isSelected && (
                    <span className={styles.activeIndicator}>
                      <span className={styles.activeDot} />
                      Active
                    </span>
                  )}
                </div>

                <p className={styles.modelDescription}>{model.description}</p>

                <div className={styles.modelMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Context Limit:</span>
                    <span className={styles.metricValue}>{model.contextWindow}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Latency:</span>
                    <span className={`${styles.latencyBadge} ${
                      model.latency === 'Ultra-Low' ? styles.latencyUltraLow :
                      model.latency === 'Low' ? styles.latencyLow : styles.latencyMedium
                    }`}>{model.latency}</span>
                  </div>
                </div>

                <div className={styles.capabilities}>
                  {model.capabilities.map((cap) => (
                    <span key={cap} className={styles.capTag}>{cap}</span>
                  ))}
                </div>

                <button 
                  className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ''} ${!isAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAvailable) handleSelectModel(model.id);
                  }}
                  disabled={!isAvailable}
                >
                  {!isAvailable ? 'Requires API Key' : isSelected ? 'Currently Selected' : 'Select Model'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Configuration Panel & Playground */}
        <div className={styles.configPlaygroundGrid}>
          
          {/* Configuration */}
          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Parameters Configuration</h2>
            <p className={styles.panelSubtitle}>Tune the generation properties of the selected model.</p>
            
            <div className={styles.configGroup}>
              <div className={styles.configHeader}>
                <label className={styles.configLabel}>Temperature</label>
                <span className={styles.configValue}>{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.05"
                className={styles.rangeInput}
                value={temperature}
                onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
              />
              <span className={styles.configDescription}>
                Controls randomness: 0 is completely deterministic, while 1 is creative and random.
              </span>
            </div>

            <div className={styles.configGroup}>
              <div className={styles.configHeader}>
                <label className={styles.configLabel}>Max Output Tokens</label>
                <span className={styles.configValue}>{maxTokens}</span>
              </div>
              <input 
                type="range" 
                min="256" 
                max="4096" 
                step="128"
                className={styles.rangeInput}
                value={maxTokens}
                onChange={(e) => handleMaxTokensChange(parseInt(e.target.value, 10))}
              />
              <span className={styles.configDescription}>
                Maximum number of tokens the model generates in a single turn (100 tokens ≈ 75 words).
              </span>
            </div>
          </div>

          {/* Live Playground */}
          <div className={styles.panelCard}>
            <h2 className={styles.panelTitle}>Model Playground</h2>
            <p className={styles.panelSubtitle}>Test the selected model with custom prompts dynamically.</p>

            <div className={styles.playgroundBody}>
              <div className={styles.inputArea}>
                <textarea 
                  className={styles.playgroundTextarea}
                  placeholder="Enter a prompt to test the model (e.g. 'Generate a python script to ping a server')..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isPending}
                />
                <button 
                  className={`${styles.testBtn} ${isPending ? styles.testBtnPending : ''}`}
                  onClick={handleTestModel}
                  disabled={!prompt.trim() || isPending}
                >
                  {isPending ? 'Sending...' : 'Test Response'}
                </button>
              </div>

              <div className={styles.outputArea}>
                <div className={styles.outputLabel}>Model Response:</div>
                <div className={`${styles.outputWindow} ${isPending ? styles.outputPending : ''}`}>
                  {response || <span className={styles.placeholder}>Output will appear here...</span>}
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
