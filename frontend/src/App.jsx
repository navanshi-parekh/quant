import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Core Parameters States
  const [market, setMarket] = useState('indian');
  const [amount, setAmount] = useState(75000);
  const [horizon, setHorizon] = useState(2);
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [selectedSectors, setSelectedSectors] = useState(['Technology', 'Energy', 'Finance', 'Commodities']);

  // Advanced Strategy States
  const [diversification, setDiversification] = useState('balanced');
  const [horizonStrategy, setHorizonStrategy] = useState('long_term');
  const [targetProfit, setTargetProfit] = useState(15);

  // PDF Attachment Tracker
  const [attachedFile, setAttachedFile] = useState(null);

  const sectorsList = ['Technology', 'IT', 'Automobile', 'Energy', 'Finance', 'Commodities'];

  const handleSectorChange = (sector) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const handleFileDropChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setAttachedFile(file);
      setData(null); 
    } else {
      alert('Invalid file format. Select a valid institutional PDF document.');
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setData(null);   
    setPrompt('');   
    setError(null);
  };

  const executePipelineRequest = async (payloadPrompt, selectedMarket, activeSectors) => {
    setLoading(true);
    setError(null);
    setData(null);

    const backendBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    try {
      const formDataBody = new FormData();
      formDataBody.append('prompt', payloadPrompt);
      formDataBody.append('market', selectedMarket);
      formDataBody.append('diversification', diversification);
      formDataBody.append('horizon_strategy', horizonStrategy);
      formDataBody.append('target_profit_percentage', Number(targetProfit));
      
      activeSectors.forEach((sector) => {
        formDataBody.append('sectors', sector); 
        formDataBody.append('sector', sector);  
      });
      
      if (attachedFile) {
        formDataBody.append('file', attachedFile);
      }

      const response = await fetch(`${backendBaseUrl}/api/generate-recommendation`, {
        method: 'POST',
        body: formDataBody,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Pipeline execution fault.' }));
        const rawErrorMsg = errorData.detail ? (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : String(errorData.detail)) : 'Internal engine breakdown across endpoints.';
        throw new Error(rawErrorMsg);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Connection timeout or server node error.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    const currency = market === 'american' ? 'USD' : 'INR';
    const sectorsToPass = selectedSectors.length > 0 ? selectedSectors : ['Technology'];
    
    const synthesizedPrompt = `Allocate exactly ${amount} ${currency} for an investment window of ${horizon} years directly into the following sector matrix: ${sectorsToPass.join(', ')}. Strategy profile is ${horizonStrategy} targeting a risk matrix configuration of ${riskProfile}.`;
    executePipelineRequest(synthesizedPrompt, market, sectorsToPass);
  };

  const handlePromptSubmit = (e) => {
    if (e) e.preventDefault();
    const sectorsToPass = selectedSectors.length > 0 ? selectedSectors : ['Technology'];
    const currency = market === 'american' ? 'USD' : 'INR';
    
    let structuredPrompt = prompt.trim();
    if (!structuredPrompt && !attachedFile) return;

    const constraintMetadataFallback = `[System Profile Schema Alignment Parameters -> Allocation Capital amount: ${amount} ${currency}, Time Horizon window: ${horizon} years, Active Target profile: ${riskProfile}, Sectors target list matrix: ${sectorsToPass.join(', ')}]`;

    if (structuredPrompt) {
      if (!structuredPrompt.includes(String(amount)) && !structuredPrompt.toLowerCase().includes('years')) {
        structuredPrompt += ` ${constraintMetadataFallback}`;
      }
    } else if (!structuredPrompt && attachedFile) {
      structuredPrompt = `Perform an independent context audit summary extraction tracking for corporate filing data report: ${attachedFile.name}. Base backup parameters config: ${constraintMetadataFallback}`;
    }

    executePipelineRequest(structuredPrompt, market, sectorsToPass);
  };

  const getRiskColor = (risk) => {
    if (!risk) return '#8b949e';
    switch(risk.toLowerCase()) {
      case 'conservative': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'aggressive': return '#ef4444';
      default: return '#38bdf8';
    }
  };

  const currencySymbol = market === 'american' ? '$' : '₹';

  const checkIsOvervalued = (peValue) => {
    return market === 'indian' ? peValue > 25.0 : peValue > 30.0;
  };

  const renderIntelligenceBlock = (rawText, accentColor, badgeLabel) => {
    if (!rawText) return <div style={{fontSize: '12px', color: '#6e7681'}}>No payload returned.</div>;
    
    const forceExtractStrings = (input) => {
      if (input === null || input === undefined) return '';
      if (typeof input !== 'object') return String(input);
      if (Array.isArray(input)) return input.map(item => forceExtractStrings(item)).join('\n');
      
      if (typeof input === 'object') {
        const commonTextKeys = ['text', 'bullet', 'body', 'content', 'value', 'desc', 'description', 'title', 'summary'];
        for (const key of commonTextKeys) {
          if (input[key] && typeof input[key] === 'string') return input[key];
        }
        return Object.values(input)
          .map(val => (val !== null && typeof val === 'object') ? forceExtractStrings(val) : String(val))
          .filter(str => str.trim() !== '' && str !== '[object Object]' && str !== 'object Object')
          .join('\n');
      }
      return String(input);
    };

    let cleanString = forceExtractStrings(rawText);

    if (!cleanString || cleanString.trim() === '' || cleanString.includes('[object Object]') || cleanString === 'object Object') {
      try {
        cleanString = typeof rawText === 'object' ? Object.values(rawText).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('\n') : String(rawText);
      } catch (e) {
        cleanString = "Serialization parsing boundary block.";
      }
    }

    return cleanString.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const cleanText = paragraph.replace(/\*\*/g, '').replace(/[\{\}\"\[\]\,]/g, '').trim();
      if (!cleanText || cleanText === 'object Object' || cleanText === '[object Object]') return null;

      const isHeaderLine = cleanText.includes(':') && (cleanText.includes('%') || cleanText.toLowerCase().includes('conviction') || cleanText.toLowerCase().includes('mitigation') || cleanText.toLowerCase().includes('risk') || cleanText.toLowerCase().includes('case') || cleanText.toLowerCase().includes('bullet') || cleanText.toLowerCase().includes('driver') || cleanText.toLowerCase().includes('exposure') || cleanText.toLowerCase().includes('summary') || cleanText.toLowerCase().includes('opportunity'));
      const isBulletStep = cleanText.startsWith('-') || cleanText.startsWith('*') || /^\d+\./.test(cleanText);

      if (isHeaderLine) {
        const [title, description] = cleanText.split(/:(.+)/);
        return (
          <div key={idx} style={{...styles.intelligenceCard, borderLeft: `3px solid ${accentColor}`}}>
            <div style={{...styles.intelligenceCardHeader, color: accentColor}}>
              <span style={{...styles.intelligenceIndicatorDot, backgroundColor: accentColor}}></span>
              <strong>{title.trim()}</strong>
              <span style={{...styles.briefBadge, color: accentColor, borderColor: accentColor, backgroundColor: `${accentColor}10`}}>{badgeLabel}</span>
            </div>
            {description && <p style={{fontSize: '12px', color: '#cbd5e1', marginTop: '6px', margin: 0, lineHeight: '1.6'}}>{description.trim()}</p>}
          </div>
        );
      }

      if (isBulletStep) {
        const lineContent = cleanText.replace(/^[\s\-\*\d\.]\s*/, '');
        return (
          <div key={idx} style={{...styles.executionStepRow, borderLeft: `2px solid ${accentColor}`}}>
            <div style={{fontSize: '12px', color: '#e2e8f0', lineHeight: '1.6'}}>{lineContent}</div>
          </div>
        );
      }

      return (
        <div key={idx} style={styles.narrativeParagraphBlock}>
          <p style={{margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', textAlign: 'justify'}}>{cleanText}</p>
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 1200px) {
          .main-workspace-layout { grid-template-columns: 1fr !important; }
          .grid-2col-responsive { grid-template-columns: 1fr !important; }
          .header-responsive { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .adversarial-grid-responsive { grid-template-columns: 1fr !important; }
        }
        
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #070a13; }
        ::-webkit-scrollbar-thumb { background: #1a2336; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #0284c7; }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: #141b2e;
          height: 4px;
          border-radius: 2px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #0284c7;
          cursor: pointer;
          transition: transform 0.1s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanning-loader { position: relative; overflow: hidden; }
        .scanning-loader::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, transparent, rgba(2, 132, 199, 0.15), transparent);
          animation: scanline 2s linear infinite;
        }
      `}</style>

      <header style={styles.header} className="header-responsive">
        <div>
          <h1 style={styles.title}>QUANT-LLM ADVISOR TERMINAL</h1>
          <div style={styles.underlineContainer}>
            <div style={styles.centerBlueLine}></div>
          </div>
          <p style={styles.subtitle}>Institutional Grade Multi-Agent Optimization Engine</p>
        </div>
        <div style={styles.statusBadge}>
          <span style={styles.statusDot}></span> SECURE NODE
        </div>
      </header>

      <main style={styles.main}>
        {/* Desk Selectors */}
        <div style={styles.marketToggleRow}>
          <button type="button" style={{...styles.marketTab, ...(market === 'indian' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('indian'); setAmount(75000); setData(null); }}>INDIAN ASSET ROUTING</button>
          <button type="button" style={{...styles.marketTab, ...(market === 'american' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('american'); setAmount(5000); setData(null); }}>US ASSET ROUTING</button>
        </div>

        {/* THREE-COLUMN COMPLIANT INPUT WORKSPACE */}
        <div style={styles.mainWorkspaceLayout} className="main-workspace-layout">
          
          {/* Column 1: Unstructured Data Ingestion */}
          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>Unstructured Parameter Ingestion</h2>
            <div style={styles.formStack}>
              <textarea
                style={styles.textarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={attachedFile ? `Specify audit evaluation vectors for ${attachedFile.name}...` : `Input custom cross-asset target constraints or risk mandate terminology...`}
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={handlePromptSubmit} 
                style={styles.submitButtonGreen} 
                disabled={loading}
              >
                {loading ? 'EXECUTING INFERENCE PASS...' : attachedFile ? 'EXECUTE ISOLATED DOCUMENT AUDIT' : 'EXECUTE PARAMETER OPTIMIZATION'}
              </button>
            </div>
          </section>

          {/* Column 2: Hard Strategy Dials */}
          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>Structured Volatility Mandates</h2>
            <div style={styles.manualForm}>
              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Capital Allocation: <strong style={{color: '#0284c7'}}>{currencySymbol}{amount.toLocaleString('en-IN')}</strong></label>
                  <input type="range" min={market === 'american' ? "500" : "5000"} max={market === 'american' ? "50000" : "1000000"} step={market === 'american' ? "250" : "5000"} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Execution Horizon: <strong style={{color: '#0284c7'}}>{horizon} Years</strong></label>
                  <input type="range" min="1" max="5" step="0.5" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} />
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Covariance Distribution</label>
                  <select value={diversification} onChange={(e) => setDiversification(e.target.value)} style={styles.select}>
                    <option value="balanced">Equal-Weight Distribution</option>
                    <option value="concentrated">High Conviction Tactical</option>
                    <option value="diversified">Systemic Macro Hedged</option>
                  </select>
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Liquidity Temporal View</label>
                  <select value={horizonStrategy} onChange={(e) => setHorizonStrategy(e.target.value)} style={styles.select}>
                    <option value="long_term">Long-Term Compounding</option>
                    <option value="short_term">Capital Preservation</option>
                  </select>
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Target Return Hurdle: <strong style={{color: '#0284c7'}}>{targetProfit}% CAGR</strong></label>
                  <input type="range" min="5" max="50" step="1" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Risk Coefficient Cap</label>
                  <select value={riskProfile} onChange={(e) => setRiskProfile(e.target.value)} style={styles.select}>
                    <option value="moderate">Moderate Volatility Profile</option>
                    <option value="conservative">Low Volatility Mandate</option>
                    <option value="aggressive">Unconstrained Capital Growth</option>
                  </select>
                </div>
              </div>

              <div style={styles.sliderGroup}>
                <label style={styles.label}>Asset Class Vector Restrictions</label>
                <div style={styles.checkboxContainer}>
                  {sectorsList.map((sector) => (
                    <label key={sector} style={styles.checkboxLabel}>
                      <input type="checkbox" checked={selectedSectors.includes(sector)} onChange={() => handleSectorChange(sector)} style={styles.checkbox} />
                      {sector}
                    </label>
                  ))}
                </div>
              </div>

              {!attachedFile ? (
                <button 
                  type="button" 
                  onClick={handleManualSubmit} 
                  style={styles.submitButtonBlue} 
                  disabled={loading}
                >
                  {loading ? 'RECOMPUTING BOUNDARIES...' : 'DISPATCH STRUCTURED CONFIGURATION'}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={removeAttachedFile} 
                  style={styles.submitButtonRed}
                >
                  FLUSH CONTEXT & RESTORE QUANT MODE
                </button>
              )}
            </div>
          </section>

          {/* Column 3: Corporate Report Drop Zone */}
          <section style={{...styles.controlCard, borderColor: attachedFile ? '#0284c740' : 'rgba(255, 255, 255, 0.03)'}}>
            <h2 style={{...styles.sectionHeader, color: attachedFile ? '#0284c7' : '#8b949e'}}>Contextual Grounding Stream</h2>
            <div style={styles.separatedUploaderLayout}>
              <p style={{fontSize: '11px', color: '#8b949e', margin: '0 0 12px 0', lineHeight: '1.6'}}>
                Upload corporate filings, standard financial logs, or accounting statements to isolate text summary auditing parameters.
              </p>
              
              <div style={{...styles.pdfDropZone, backgroundColor: attachedFile ? 'rgba(2, 132, 199, 0.02)' : '#090d16', borderColor: attachedFile ? '#0284c740' : '#1a2336'}}>
                {!attachedFile ? (
                  <label style={styles.pdfLabelUpload}>
                    <input type="file" accept=".pdf" onChange={handleFileDropChange} style={{display: 'none'}} />
                    <div style={{fontSize: '24px', marginBottom: '8px', color: '#1a2336'}}>FORM_ATTACH_IO</div>
                    <span style={{color: '#0284c7', cursor: 'pointer', fontWeight: 'bold'}}>Ingest Corporate PDF Document</span>
                    <div style={{fontSize: '10px', color: '#6e7681', marginTop: '6px'}}>Decouples interface pipelines dynamically</div>
                  </label>
                ) : (
                  <div style={styles.fileSuccessRow}>
                    <span style={{fontSize: '16px', color: '#0284c7'}}>DATA_ARMED</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden'}}>
                      <span style={{color: '#e6edf3', fontSize: '11px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px'}}>
                        {attachedFile.name}
                      </span>
                    </div>
                    <button type="button" onClick={removeAttachedFile} style={styles.removeFileBtn}>✕</button>
                  </div>
                )}
              </div>

              {attachedFile && (
                <div style={styles.activeUploaderStatusBadge}>
                  <span style={styles.uploaderPulseDot}></span> SYSTEM TRADING AS AUDIT MODE
                </div>
              )}
            </div>
          </section>

        </div>

        {/* PROGRESS LOADER BAR */}
        {loading && (
          <div style={styles.loadingContainerTrack}>
            <div style={styles.loadingBarProgressFilled} className="scanning-loader"></div>
            <div style={{fontSize: '10px', color: '#0284c7', letterSpacing: '1.5px', textAlign: 'center', marginTop: '8px', fontWeight: 'bold'}}>
              COMPILING CROSS-NODE VERIFICATIONS... RETRIEVING DATA LAYER
            </div>
          </div>
        )}

        {/* Risk Sharpe ratio telemetry section */}
        <div style={styles.splitTelemetryRow}>
          <section style={styles.educationalCard}>
            <h3 style={styles.cardTitle}>Variance Optimization Protocol: Risk-Adjusted Return Telemetry</h3>
            <p style={styles.educationalText}>
              The mathematical Sharpe ratio monitors excess yield performance relative to volatility parameters. Indices crossing &gt;1.5 signify that alpha generation is structural rather than speculative beta risk tracking.
            </p>
          </section>

          {data && data.market_macro && !attachedFile && (
            <section style={{...styles.educationalCard, borderLeft: '3px solid #0284c7', backgroundColor: '#090d16'}}>
              <h3 style={styles.cardTitle}>{data.market_macro.index_name} Reference Benchmark</h3>
              <div style={styles.macroTelemetryGrid}>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>BENCHMARK PRICE</div>
                  <div style={{fontSize: '13px', fontWeight: 'bold', color: '#e6edf3'}}>{currencySymbol}{data.market_macro.index_price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>BENCHMARK P/E</div>
                  <div style={{fontSize: '13px', fontWeight: 'bold', color: '#ff9800'}}>{data.market_macro.index_pe}</div>
                </div>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>PORTFOLIO COV P/E</div>
                  <div style={{fontSize: '13px', fontWeight: 'bold', color: data.market_macro.portfolio_avg_pe > data.market_macro.index_pe ? '#ef4444' : '#10b981'}}>{data.market_macro.portfolio_avg_pe}</div>
                </div>
              </div>
            </section>
          )}
        </div>

        {error && <div style={styles.errorCard}>CRITICAL LOG FAULT: {error}</div>}

        {/* --- DYNAMIC OUTPUT DESK LAYOUT --- */}
        
        {/* PERSISTENT WORKSPACE BASELINE: Prevents empty flashing layouts */}
        {!data && !loading && (
          <div style={styles.emptyStateContainer}>
            <div style={{fontSize: '11px', color: '#6e7681', letterSpacing: '1px'}}>AWAITING PARAMETER DISPATCH TERMINAL IDLE</div>
          </div>
        )}

        {data && (
          <div style={{marginTop: '24px'}}>
            
            {/* MODE A: PORTFOLIO OPTIMIZATION DATA DESK */}
            {!attachedFile && data.optimized_portfolio && (
              <>
                <div style={styles.kpiGrid}>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>COMMITTED CAPITAL BOUNDS</div>
                    <div style={{...styles.kpiValue, color: '#0284c7'}}>{currencySymbol}{(data.profile?.investment_amount || amount).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>RISK-ADJUSTED MEASURE (SHARPE)</div>
                    <div style={{...styles.kpiValue, color: data.sharpe_ratio > 1.0 ? '#10b981' : '#f59e0b'}}>SR {data.sharpe_ratio || 0.0}</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>SOVEREIGN RISK-FREE BASEROOT</div>
                    <div style={{...styles.kpiValue, color: '#9333ea'}}>{data.risk_free_rate || 6.75}%</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>PROJECTED PORTFOLIO RETURN</div>
                    <div style={{...styles.kpiValue, color: '#10b981'}}>{data.expected_portfolio_return || 0}%</div>
                  </div>
                </div>

                {data.backtest_trajectory && data.backtest_trajectory.length > 0 && (
                  <section style={{...styles.card, marginBottom: '24px'}}>
                    <h3 style={styles.cardTitle}>Compounded Capital Growth Valuation Curve</h3>
                    <div style={{ width: '100%', height: 240, marginTop: '16px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.backtest_trajectory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#141b2e" vertical={false} />
                          <XAxis dataKey="label" stroke="#6e7681" style={{ fontSize: '11px' }} tickLine={false} />
                          <YAxis stroke="#6e7681" style={{ fontSize: '11px' }} tickLine={false} tickFormatter={(v) => `${currencySymbol}${Math.round(v).toLocaleString('en-IN')}`} />
                          <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1a2336', borderRadius: '4px' }} itemStyle={{ color: '#0284c7', fontSize: '12px' }} labelStyle={{ color: '#6e7681', fontSize: '11px' }} formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString('en-IN')}`, 'Portfolio Value']} />
                          <Line type="monotone" dataKey="valuation" stroke="#0284c7" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                <div style={{marginBottom: '24px'}}>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Asset Allocation Matrix & Fundamental Screen Metrics</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>ASSET CLASSIFICATION</th>
                            <th style={styles.th}>PRICE UNIT</th>
                            <th style={styles.th}>VOLATILITY (BETA)</th>
                            <th style={styles.th}>P/E RATIO</th>
                            <th style={styles.th}>DIVIDEND YIELD</th>
                            <th style={styles.th}>WEIGHT ALLOC</th>
                            <th style={styles.th}>UNIT SHARES</th>
                            <th style={styles.th}>DEPLOYED CAPITAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.optimized_portfolio.map((asset, idx) => (
                            <tr key={idx} style={styles.tr}>
                              <td style={styles.td}>
                                <span style={styles.tickerBadge}>{asset.symbol}</span>
                                {checkIsOvervalued(asset.pe_ratio) && <span style={styles.valuationAlertTag}>BENCHMARK PREMIUM</span>}
                              </td>
                              <td style={styles.td}>{currencySymbol}{(asset.current_price || 0).toLocaleString('en-IN')}</td>
                              <td style={{...styles.td, color: getRiskColor(asset.beta > 1.1 ? 'aggressive' : asset.beta >= 0.85 ? 'moderate' : 'conservative')}}>β {asset.beta}</td>
                              <td style={styles.td}>{asset.pe_ratio || 'N/A'}</td>
                              <td style={{...styles.td, color: '#10b981'}}>{asset.dividend_yield || 0}%</td>
                              <td style={styles.td}>{asset.allocation_percentage}%</td>
                              <td style={styles.td}><strong style={{color: '#10b981'}}>{asset.suggested_shares_to_buy}</strong></td>
                              <td style={{...styles.td, fontWeight: 'bold', color: '#e6edf3'}}>{currencySymbol}{(asset.actual_deployment_cost || 0).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={styles.adversarialGrid} className="adversarial-grid-responsive">
                  <div style={styles.card}>
                    <h3 style={{...styles.cardTitle, color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.1)'}}>
                      STRATEGIC CONVICTION ANALYSIS
                    </h3>
                    <div style={styles.reportBlock}>{renderIntelligenceBlock(data.report_bull, '#10b981', 'GROWTH')}</div>
                  </div>
                  <div style={styles.card}>
                    <h3 style={{...styles.cardTitle, color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.1)'}}>
                      EXPOSURE RISK MITIGATION BRIEF
                    </h3>
                    <div style={styles.reportBlock}>{renderIntelligenceBlock(data.report_bear, '#ef4444', 'RISK')}</div>
                  </div>
                </div>
              </>
            )}

            {/* MODE B: CORPORATE INTELLIGENCE DOCUMENT DESK */}
            {attachedFile && (
              <div style={{...styles.card, border: '1px solid rgba(2,132,199,0.25)', backgroundColor: '#090d16'}}>
                <h3 style={{...styles.cardTitle, color: '#0284c7', borderBottom: '1px solid rgba(2,132,199,0.1)', paddingBottom: '12px', marginBottom: '12px'}}>
                  ISOLATED SYSTEM REPORT SECURE TRACK: {attachedFile.name.toUpperCase()}
                </h3>
                <p style={{fontSize: '11px', color: '#8b949e', marginTop: '0', marginBottom: '20px', lineHeight: '1.6'}}>
                  Quantitative parameters bypassed. Station operating in focused Context Ingestion Track, isolating management disclosures, operational metrics, and structural risk parameters directly from document layers.
                </p>
                
                <div style={styles.ragDisplayGridResp} className="adversarial-grid-responsive">
                  <div style={styles.ragExtractSubPane}>
                    <h4 style={{fontSize: '11px', color: '#10b981', margin: '0 0 12px 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(16,185,129,0.05)', paddingBottom: '6px', letterSpacing: '0.5px'}}>Ingested Highlight Factors</h4>
                    <div style={styles.reportBlock}>
                      {renderIntelligenceBlock(data.doc_bull || data.report_bull || data.bull_case, '#10b981', 'WIN')}
                    </div>
                  </div>
                  
                  <div style={styles.ragExtractSubPane}>
                    <h4 style={{fontSize: '11px', color: '#ef4444', margin: '0 0 12px 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(239,68,68,0.05)', paddingBottom: '6px', letterSpacing: '0.5px'}}>Ingested Disclosed Headwinds</h4>
                    <div style={styles.reportBlock}>
                      {renderIntelligenceBlock(data.doc_bear || data.report_bear || data.bear_case, '#ef4444', 'EXPOSURE')}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#070a13', color: '#c9d1d9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '16px', marginBottom: '24px' },
  title: { color: '#e6edf3', fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', margin: 0 },
  underlineContainer: { display: 'none' }, // Stripped bulky accent lines
  centerBlueLine: {},
  subtitle: { color: '#6e7681', fontSize: '12px', marginTop: '4px' },
  statusBadge: { border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '5px 10px', color: '#8b949e', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' },
  statusDot: { width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' },
  main: { maxWidth: '1600px', margin: '0 auto' },
  marketToggleRow: { display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#090d16', padding: '4px', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '4px' },
  marketTab: { flex: 1, backgroundColor: 'transparent', border: 'none', color: '#6e7681', padding: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.5px' },
  activeMarketTab: { backgroundColor: '#141b2e', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.1)' },
  
  // THREE COLUMN HIGH SIGNAL GRIDS
  mainWorkspaceLayout: { display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.9fr', gap: '20px', marginBottom: '20px' },
  controlCard: { backgroundColor: '#090d16', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  sectionHeader: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '6px', fontWeight: '700' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', justifyContent: 'space-between' },
  manualForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  textarea: { backgroundColor: '#070a13', border: '1px solid #1a2336', borderRadius: '4px', color: '#e6edf3', padding: '12px', fontSize: '12px', minHeight: '110px', resize: 'none', outline: 'none', lineHeight: '1.5', fontFamily: 'inherit' },
  
  // INGESTION DROP FILING BOUNDARIES
  separatedUploaderLayout: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start' },
  pdfDropZone: { border: '1px dashed #1a2336', borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  pdfLabelUpload: { fontSize: '11px', color: '#8b949e', cursor: 'pointer', display: 'block', lineHeight: '1.5' },
  fileSuccessRow: { display: 'flex', alignItems: 'center', backgroundColor: '#070a13', border: '1px solid rgba(2,132,199,0.2)', borderRadius: '4px', padding: '8px 12px', gap: '10px', width: '100%', boxSizing: 'border-box' },
  removeFileBtn: { marginLeft: 'auto', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
  activeUploaderStatusBadge: { marginTop: '12px', alignSelf: 'center', backgroundColor: 'rgba(2,132,199,0.04)', border: '1px solid rgba(2,132,199,0.15)', color: '#0284c7', borderRadius: '2px', padding: '4px 10px', fontSize: '9px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' },
  uploaderPulseDot: { width: '5px', height: '5px', backgroundColor: '#0284c7', borderRadius: '50%', display: 'inline-block' },
  
  // SYSTEM LOAD DATA BAR TELEMETRICS
  loadingContainerTrack: { backgroundColor: '#070a13', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', padding: '14px', marginBottom: '20px' },
  loadingBarProgressFilled: { height: '3px', width: '100%', background: '#0284c7', borderRadius: '2px' },

  // PROFESSIONAL CLEAN SCRIPTED ACTION BUTTONS
  submitButtonGreen: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'background-color 0.15s', ':hover': { backgroundColor: '#059669' } },
  submitButtonBlue: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'background-color 0.15s', ':hover': { backgroundColor: '#0369a1' } },
  submitButtonRed: { backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' },
  
  sliderGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', color: '#8b949e' },
  select: { backgroundColor: '#070a13', border: '1px solid #1a2336', borderRadius: '4px', color: '#e6edf3', padding: '8px', fontSize: '11px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  checkboxContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', backgroundColor: '#070a13', padding: '8px', border: '1px solid #1a2336', borderRadius: '4px' },
  checkboxLabel: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '2px 6px' },
  checkbox: { cursor: 'pointer', accentColor: '#0284c7' },
  
  splitTelemetryRow: { display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: '20px' },
  educationalCard: { backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', padding: '16px' },
  educationalText: { fontSize: '11px', color: '#94a3b8', lineHeight: '1.5', margin: '6px 0 0 0' },
  macroTelemetryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px', marginTop: '10px' },
  errorCard: { border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', padding: '12px', marginBottom: '20px', fontSize: '12px', backgroundColor: 'rgba(239,68,68,0.02)' },
  
  emptyStateContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', backgroundColor: '#090d16', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '6px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' },
  kpiCard: { backgroundColor: '#090d16', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiLabel: { color: '#8b949e', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' },
  kpiValue: { fontSize: '18px', fontWeight: '800', fontFamily: 'monospace' },
  card: { backgroundColor: '#090d16', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '6px', padding: '20px' },
  cardTitle: { color: '#e6edf3', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '10px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableWrapper: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', minWidth: '600px' },
  th: { borderBottom: '2px solid #1a2336', padding: '10px', color: '#8b949e', fontWeight: '700', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.01)' },
  td: { padding: '12px 10px', verticalAlign: 'middle' },
  tickerBadge: { backgroundColor: '#070a13', border: '1px solid #1a2336', borderRadius: '3px', padding: '3px 6px', fontWeight: 'bold', color: '#e6edf3', fontFamily: 'monospace' },
  shareCount: { color: '#10b981', fontFamily: 'monospace' },
  valuationAlertTag: { marginLeft: '8px', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: '8px', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold', textTransform: 'uppercase' },
  
  adversarialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' },
  reportBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
  
  // AUDIT OUTPUT BLOCKS TYPOGRAPHY
  intelligenceCard: { backgroundColor: '#070a13', border: '1px solid rgba(255,255,255,0.01)', borderRadius: '4px', padding: '12px' },
  intelligenceCardHeader: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  intelligenceIndicatorDot: { width: '5px', height: '5px', borderRadius: '50%' },
  briefBadge: { marginLeft: 'auto', fontSize: '8px', border: '1px solid', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold' },
  executionStepRow: { display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(20,27,46,0.15)', padding: '10px', borderRadius: '4px' },
  executionStepNumber: { display: 'none' }, // Stripped bulky circles
  narrativeParagraphBlock: { padding: '0 2px' },
  
  ragDisplayGridResp: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  ragExtractSubPane: { backgroundColor: '#070a13', border: '1px solid rgba(255,255,255,0.01)', padding: '16px', borderRadius: '6px' }
};

export default App;