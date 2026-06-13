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
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Ultra-Low',
    capabilities: ['Text', 'Audio input', 'Vision', 'Tool Calling', 'Code Execution'],
    description: 'Default. Next-generation speed and quality. Highly capable, supports native multimodal inputs and real-time execution.',
    recommended: true,
  },
  {
    id: 'gemini-2.0-pro-exp-02-05',
    name: 'Gemini 2.0 Pro (Experimental)',
    provider: 'Google AI',
    contextWindow: '2,097,152 tokens',
    latency: 'Medium',
    capabilities: ['Complex Reasoning', 'Advanced Coding', 'Vision', 'Tool Calling'],
    description: 'Designed for high-accuracy reasoning, complex coding, and multi-step logic workflows. Outstanding for heavy scripting tasks.',
    recommended: false,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    contextWindow: '2,097,152 tokens',
    latency: 'Medium',
    capabilities: ['Deep Context', 'Audio input', 'Vision', 'Tool Calling', 'Code Execution'],
    description: 'Production-grade long context model. Excels in detailed analysis, structural translation, and broad code repositories.',
    recommended: false,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI',
    contextWindow: '1,048,576 tokens',
    latency: 'Low',
    capabilities: ['Text', 'Audio input', 'Vision', 'Speed'],
    description: 'Efficient and light production model. Ideal for simple conversations and quick notifications.',
    recommended: false,
  },
];

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  
  // Playground state
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isPending, setIsPending] = useState(false);

  // Read cookies on mount
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
            
            return (
              <div 
                key={model.id} 
                className={`${styles.modelCard} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => handleSelectModel(model.id)}
              >
                {model.recommended && (
                  <span className={styles.recommendedBadge}>RECOMMENDED</span>
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
                  className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectModel(model.id);
                  }}
                >
                  {isSelected ? 'Currently Selected' : 'Select Model'}
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
