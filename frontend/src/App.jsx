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

  // PHASE 4: PDF Attachment File State Tracker
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
      alert('Invalid file structure. Please drop or select an official corporate .pdf report.');
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
      formDataBody.append('target_profit_percentage', Number(targetProfit)); // FIXED: Corrected syntax to Number
      
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
        const errorData = await response.json().catch(() => ({ detail: 'Backend generation fault.' }));
        const rawErrorMsg = errorData.detail ? (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : String(errorData.detail)) : 'Internal processing breakdown across endpoints.';
        throw new Error(rawErrorMsg);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Connection lost or internal server error.');
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
    if (!rawText) return <div style={{fontSize: '12px', color: '#6e7681'}}>No analysis payload returned.</div>;
    
    let cleanString = "";
    if (Array.isArray(rawText)) {
      cleanString = rawText.join('\n');
    } else if (typeof rawText === 'object') {
      cleanString = Object.entries(rawText)
        .map(([key, val]) => {
          const skipKeyPrefix = ['title', 'bullet', 'text', 'body', 'content', 'value', 'desc', 'description'].includes(key.toLowerCase());
          const valueStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return skipKeyPrefix ? valueStr : `${key}: ${valueStr}`;
        })
        .join('\n');
    } else {
      cleanString = String(rawText);
    }

    return cleanString.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const cleanText = paragraph.replace(/\*\*/g, '').replace(/[\{\}\"\[\]\,]/g, '').trim();
      if (!cleanText) return null;

      const isHeaderLine = cleanText.includes(':') && (cleanText.includes('%') || cleanText.toLowerCase().includes('conviction') || cleanText.toLowerCase().includes('mitigation') || cleanText.toLowerCase().includes('risk') || cleanText.toLowerCase().includes('case') || cleanText.toLowerCase().includes('bullet') || cleanText.toLowerCase().includes('driver') || cleanText.toLowerCase().includes('exposure') || cleanText.toLowerCase().includes('summary'));
      const isBulletStep = cleanText.startsWith('-') || cleanText.startsWith('*') || /^\d+\./.test(cleanText);

      if (isHeaderLine) {
        const [title, description] = cleanText.split(/:(.+)/);
        return (
          <div key={idx} style={{...styles.intelligenceCard, borderLeft: `4px solid ${accentColor}`, boxShadow: `0 2px 12px ${accentColor}15`}}>
            <div style={{...styles.intelligenceCardHeader, color: accentColor}}>
              <span style={{...styles.intelligenceIndicatorDot, backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}`}}></span>
              <strong>{title.trim()}</strong>
              <span style={{...styles.briefBadge, color: accentColor, borderColor: accentColor, backgroundColor: `${accentColor}15`}}>{badgeLabel}</span>
            </div>
            {description && <p style={{fontSize: '12px', color: '#cbd5e1', marginTop: '6px', margin: 0, lineHeight: '1.6'}}>{description.trim()}</p>}
          </div>
        );
      }

      if (isBulletStep) {
        const lineContent = cleanText.replace(/^[\s\-\*\d\.]\s*/, '');
        return (
          <div key={idx} style={{...styles.executionStepRow, borderLeft: `3px solid ${accentColor}`}}>
            <div style={{...styles.executionStepNumber, color: accentColor, borderColor: accentColor, backgroundColor: `${accentColor}15`}}>✓</div>
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
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #070a13; }
        ::-webkit-scrollbar-thumb { background: #1f293d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #38bdf8; }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: #141b2e;
          height: 5px;
          border-radius: 10px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #38bdf8;
          cursor: pointer;
          box-shadow: 0 0 10px #38bdf8;
          transition: transform 0.1s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanning-loader {
          position: relative;
          overflow: hidden;
        }
        .scanning-loader::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, transparent, rgba(56, 189, 248, 0.1), transparent);
          animation: scanline 1.8s linear infinite;
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
          <span style={styles.statusDot}></span> TERMINAL SECURE
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.marketToggleRow}>
          <button type="button" style={{...styles.marketTab, ...(market === 'indian' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('indian'); setAmount(75000); setData(null); }}>🇮🇳 INDIAN DESK</button>
          <button type="button" style={{...styles.marketTab, ...(market === 'american' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('american'); setAmount(5000); setData(null); }}>🇺🇸 US DESK</button>
        </div>

        <div style={styles.mainWorkspaceLayout} className="main-workspace-layout">
          
          {/* Column 1 */}
          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>🤖 AI Prompt Interface</h2>
            <div style={styles.formStack}>
              <textarea
                style={styles.textarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={attachedFile ? `Provide focus parameters for auditing ${attachedFile.name}...` : `Describe asset constraints or tactical deployment goals for the ${market} desk...`}
                disabled={loading}
              />
              <button 
                type="button" 
                onClick={handlePromptSubmit} 
                style={styles.submitButtonGreen} 
                disabled={loading}
              >
                {loading ? 'CALCULATING CORE INFERENCE...' : attachedFile ? 'RUN AUDIT REPORT MATCH' : 'RUN AI PROMPT OPTIMIZATION'}
              </button>
            </div>
          </section>

          {/* Column 2 */}
          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>🎛️ Strategic Constraint Parameters</h2>
            <div style={styles.manualForm}>
              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Allocation: <strong style={{color: '#38bdf8'}}>{currencySymbol}{amount.toLocaleString('en-IN')}</strong></label>
                  <input type="range" min={market === 'american' ? "500" : "5000"} max={market === 'american' ? "50000" : "1000000"} step={market === 'american' ? "250" : "5000"} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Horizon: <strong style={{color: '#38bdf8'}}>{horizon} Years</strong></label>
                  <input type="range" min="1" max="5" step="0.5" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} />
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Diversification Profile</label>
                  <select value={diversification} onChange={(e) => setDiversification(e.target.value)} style={styles.select}>
                    <option value="balanced">Balanced Matrix</option>
                    <option value="concentrated">Concentrated Tactical</option>
                    <option value="diversified">High Spread (Gold/ETFs)</option>
                  </select>
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Timeline Target View</label>
                  <select value={horizonStrategy} onChange={(e) => setHorizonStrategy(e.target.value)} style={styles.select}>
                    <option value="long_term">Long-Term Compounding</option>
                    <option value="short_term">Capital Preservation</option>
                  </select>
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Target Margin: <strong style={{color: '#a855f7'}}>{targetProfit}% Expected</strong></label>
                  <input type="range" min="5" max="50" step="1" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Risk Matrix Assignment</label>
                  <select value={riskProfile} onChange={(e) => setRiskProfile(e.target.value)} style={styles.select}>
                    <option value="moderate">Moderate Base</option>
                    <option value="conservative">Conservative Profile</option>
                    <option value="aggressive">Aggressive Growth</option>
                  </select>
                </div>
              </div>

              <div style={styles.sliderGroup}>
                <label style={styles.label}>Target Sector Exposure</label>
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
                  {loading ? 'RECOMPUTING VALUES...' : 'APPLY STRATEGIC MATRIX CONFIG'}
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={removeAttachedFile} 
                  style={styles.submitButtonRed}
                >
                  ↩ RESET DESK TO QUANT MODE
                </button>
              )}
            </div>
          </section>

          {/* Column 3 */}
          <section style={{...styles.controlCard, borderColor: attachedFile ? '#38bdf835' : 'rgba(255, 255, 255, 0.05)'}}>
            <h2 style={{...styles.sectionHeader, color: attachedFile ? '#38bdf8' : '#8b949e'}}>📑 Isolated Context Auditing Workspace</h2>
            <div style={styles.separatedUploaderLayout}>
              <p style={{fontSize: '11px', color: '#8b949e', margin: '0 0 12px 0', lineHeight: '1.6'}}>
                Drop standard brokerage research PDF sheets or corporate quarterly filings below. Ingestion automatically toggles dashboard operational tracks.
              </p>
              
              <div style={{...styles.pdfDropZone, backgroundColor: attachedFile ? 'rgba(56, 189, 248, 0.02)' : '#0e1322', borderColor: attachedFile ? '#38bdf850' : '#1f293d'}}>
                {!attachedFile ? (
                  <label style={styles.pdfLabelUpload}>
                    <input type="file" accept=".pdf" onChange={handleFileDropChange} style={{display: 'none'}} />
                    <div style={{fontSize: '28px', marginBottom: '8px', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.3))'}}>📁</div>
                    <span style={{color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold'}}>Upload Corporate PDF Filing</span>
                    <div style={{fontSize: '10px', color: '#6e7681', marginTop: '6px'}}>Decouples interface views dynamically upon upload</div>
                  </label>
                ) : (
                  <div style={styles.fileSuccessRow}>
                    <span style={{fontSize: '22px', filter: 'drop-shadow(0 0 6px #38bdf8)'}}>📄</span>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden'}}>
                      <span style={{color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px'}}>
                        {attachedFile.name}
                      </span>
                      <span style={{fontSize: '10px', color: '#6e7681'}}>Contextual Pipeline Armed</span>
                    </div>
                    <button type="button" onClick={removeAttachedFile} style={styles.removeFileBtn}>✕</button>
                  </div>
                )}
              </div>

              {attachedFile && (
                <div style={styles.activeUploaderStatusBadge}>
                  <span style={styles.uploaderPulseDot}></span> AUDIT MODE ENGAGED
                </div>
              )}
            </div>
          </section>

        </div>

        {loading && (
          <div style={styles.loadingContainerTrack}>
            <div style={styles.loadingBarProgressFilled} className="scanning-loader"></div>
            <div style={{fontSize: '10px', color: '#38bdf8', letterSpacing: '2px', textAlign: 'center', marginTop: '8px', fontWeight: 'bold'}}>
              COMPILING MULTI-AGENT INFERENCE CHANNELS... PLEASE WAIT
            </div>
          </div>
        )}

        <div style={styles.splitTelemetryRow}>
          <section style={styles.educationalCard}>
            <h3 style={styles.cardTitle}>🧠 Sharpe Ratio Core Metric: Risk-Adjusted Return Performance</h3>
            <p style={styles.educationalText}>
              The **Sharpe Ratio** tracks excess returns relative to the portfolio's underlying mathematical volatility parameters. Higher metrics (&gt;1.5) indicate alpha generation.
            </p>
          </section>

          {data && data.market_macro && !attachedFile && (
            <section style={{...styles.educationalCard, borderLeft: '4px solid #38bdf8', background: 'linear-gradient(135deg, #0b162a 0%, #0d111a 100%)'}}>
              <h3 style={styles.cardTitle}>🌐 {data.market_macro.index_name} Index Macro Telemetry</h3>
              <div style={styles.macroTelemetryGrid}>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>INDEX PRICE</div>
                  <div style={{fontSize: '14px', fontWeight: 'bold', color: '#e6edf3'}}>{currencySymbol}{data.market_macro.index_price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>INDEX P/E</div>
                  <div style={{fontSize: '14px', fontWeight: 'bold', color: '#ff9800'}}>{data.market_macro.index_pe}</div>
                </div>
                <div>
                  <div style={{fontSize: '10px', color: '#8b949e'}}>AVG PORTFOLIO P/E</div>
                  <div style={{fontSize: '14px', fontWeight: 'bold', color: data.market_macro.portfolio_avg_pe > data.market_macro.index_pe ? '#ef4444' : '#10b981'}}>{data.market_macro.portfolio_avg_pe}</div>
                </div>
              </div>
            </section>
          )}
        </div>

        {error && <div style={styles.errorCard}>⚠️ ERROR DIAGNOSTIC: {error}</div>}

        {data && (
          <div style={{marginTop: '24px'}}>
            
            {!attachedFile && data.optimized_portfolio && (
              <>
                <div style={styles.kpiGrid}>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>TOTAL ALLOCATED CAPITAL</div>
                    <div style={{...styles.kpiValue, color: '#38bdf8'}}>{currencySymbol}{(data.profile?.investment_amount || amount).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>SHARPE RATIO ENGINE</div>
                    <div style={{...styles.kpiValue, color: data.sharpe_ratio > 1.0 ? '#10b981' : '#f59e0b'}}>SR {data.sharpe_ratio || 0.0}</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>LIVE RISK-FREE BASELINE</div>
                    <div style={{...styles.kpiValue, color: '#a855f7'}}>{data.risk_free_rate || 6.75}%</div>
                  </div>
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>ESTIMATED PORTFOLIO RETURN (CAGR)</div>
                    <div style={{...styles.kpiValue, color: '#10b981'}}>{data.expected_portfolio_return || 0}%</div>
                  </div>
                </div>

                {data.backtest_trajectory && data.backtest_trajectory.length > 0 && (
                  <section style={{...styles.card, marginBottom: '24px'}}>
                    <h3 style={styles.cardTitle}>📈 Portfolio Growth Engine Timeline Forecast</h3>
                    <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.backtest_trajectory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#161b26" vertical={false} />
                          <XAxis dataKey="label" stroke="#6e7681" style={{ fontSize: '11px' }} tickLine={false} />
                          <YAxis stroke="#6e7681" style={{ fontSize: '11px' }} tickLine={false} tickFormatter={(v) => `${currencySymbol}${Math.round(v).toLocaleString('en-IN')}`} />
                          <Tooltip contentStyle={{ backgroundColor: '#0d111a', borderColor: '#232d3f', borderRadius: '8px' }} itemStyle={{ color: '#38bdf8', fontSize: '13px' }} labelStyle={{ color: '#6e7681', fontSize: '11px' }} formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString('en-IN')}`, 'Portfolio Value']} />
                          <Line type="monotone" dataKey="valuation" stroke="#38bdf8" strokeWidth={3} dot={{ r: 2, fill: '#38bdf8', strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                <div style={{marginBottom: '24px'}}>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>📊 Optimal Asset Matrix & Fundamental Screener</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>SYMBOL</th>
                            <th style={styles.th}>PRICE</th>
                            <th style={styles.th}>VOLATILITY (BETA)</th>
                            <th style={styles.th}>P/E RATIO</th>
                            <th style={styles.th}>DIV YIELD</th>
                            <th style={styles.th}>WEIGHT</th>
                            <th style={styles.th}>SHARES</th>
                            <th style={styles.th}>NET SPENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.optimized_portfolio.map((asset, idx) => (
                            <tr key={idx} style={styles.tr}>
                              <td style={styles.td}>
                                <span style={styles.tickerBadge}>{asset.symbol}</span>
                                {checkIsOvervalued(asset.pe_ratio) && <span style={styles.valuationAlertTag}>⚠️ PREMIUM P/E</span>}
                              </td>
                              <td style={styles.td}>{currencySymbol}{(asset.current_price || 0).toLocaleString('en-IN')}</td>
                              <td style={{...styles.td, color: getRiskColor(asset.beta > 1.1 ? 'aggressive' : asset.beta >= 0.85 ? 'moderate' : 'conservative'), fontWeight: 'bold'}}>β {asset.beta}</td>
                              <td style={styles.td}>{asset.pe_ratio || 'N/A'}</td>
                              <td style={{...styles.td, color: '#10b981'}}>{asset.dividend_yield || 0}%</td>
                              <td style={styles.td}>{asset.allocation_percentage}%</td>
                              <td style={styles.td}><strong style={styles.shareCount}>{asset.suggested_shares_to_buy}</strong></td>
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
                    <h3 style={{...styles.cardTitle, color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.15)'}}>🟢 BULL CASE ANALYST: MARKET ASSET CONVICTION</h3>
                    <div style={styles.reportBlock}>{renderIntelligenceBlock(data.report_bull, '#10b981', 'PORTFOLIO BULL')}</div>
                  </div>
                  <div style={styles.card}>
                    <h3 style={{...styles.cardTitle, color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.15)'}}>🔴 BEAR CASE ANALYST: PORTFOLIO EXPOSURE HAZARDS</h3>
                    <div style={styles.reportBlock}>{renderIntelligenceBlock(data.report_bear, '#ef4444', 'PORTFOLIO BEAR')}</div>
                  </div>
                </div>
              </>
            )}

            {attachedFile && (
              <div style={{...styles.card, border: '1px solid #38bdf840', background: 'linear-gradient(180deg, #0a1122 0%, #070a13 100%)'}}>
                <h3 style={{...styles.cardTitle, color: '#38bdf8', borderBottom: '1px solid rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                  <span>📑</span> DEDICATED CORPORATE EARNINGS AUDIT SECURE VIEW: {attachedFile.name.toUpperCase()}
                </h3>
                <p style={{fontSize: '12px', color: '#8b949e', marginTop: '0', marginBottom: '24px', lineHeight: '1.6'}}>
                  Mathematical allocation matrices safely bypassed. System operating in focused Document Audit Mode, extracting contextual summaries, core statements, and balance sheet vectors from the parsing stack.
                </p>
                
                <div style={styles.ragDisplayGridResp} className="adversarial-grid-responsive">
                  <div style={styles.ragExtractSubPane}>
                    <h4 style={{fontSize: '12px', color: '#10b981', margin: '0 0 14px 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(16,185,129,0.1)', paddingBottom: '6px'}}>✨ EXTRACTED REVENUE WINS & STRATEGIC HIGHLIGHTS</h4>
                    <div style={styles.reportBlock}>
                      {renderIntelligenceBlock(data.doc_bull || data.report_bull || data.bull_case, '#10b981', 'DOCUMENT WIN')}
                    </div>
                  </div>
                  
                  <div style={styles.ragExtractSubPane}>
                    <h4 style={{fontSize: '12px', color: '#ef4444', margin: '0 0 14px 0', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: '6px'}}>⚠️ DISCLOSED RISK ENVELOPS & MARGIN PRESSURES</h4>
                    <div style={styles.reportBlock}>
                      {renderIntelligenceBlock(data.doc_bear || data.report_bear || data.bear_case, '#ef4444', 'DOCUMENT RISK')}
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
  container: { backgroundColor: '#070a13', color: '#c9d1d9', minHeight: '100vh', fontFamily: '"Fira Code", monospace, system-ui', padding: '24px', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '20px', marginBottom: '24px' },
  title: { color: '#38bdf8', fontSize: '24px', fontWeight: '800', letterSpacing: '1.5px', fontFamily: '"Absolute Vodka", "Fira Code", monospace', display: 'block', textAlign: 'left', width: 'fit-content', textShadow: '0 0 15px rgba(56,189,248,0.25)' },
  underlineContainer: { width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '2px' },
  centerBlueLine: { height: '3px', backgroundColor: '#38bdf8', width: '385px', borderRadius: '2px', boxShadow: '0 0 8px #38bdf8' },
  subtitle: { color: '#6e7681', fontSize: '13px', marginTop: '8px' },
  statusBadge: { backgroundColor: '#0a1526', border: '1px solid #1d3b66', borderRadius: '20px', padding: '6px 14px', color: '#38bdf8', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #10b981' },
  main: { maxWidth: '1600px', margin: '0 auto' },
  marketToggleRow: { display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#0c111d', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' },
  marketTab: { flex: 1, backgroundColor: 'transparent', border: 'none', color: '#6e7681', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  activeMarketTab: { backgroundColor: '#151e2e', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.15)' },
  mainWorkspaceLayout: { display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.9fr', gap: '24px', marginBottom: '24px' },
  controlCard: { backgroundColor: '#0c111d', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  sectionHeader: { fontSize: '13px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '18px', letterSpacing: '1px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px', fontWeight: '700' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' },
  manualForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  textarea: { backgroundColor: '#090d16', border: '1px solid #1f293d', borderRadius: '10px', color: '#e6edf3', padding: '16px', fontSize: '13px', minHeight: '130px', resize: 'none', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit' },
  separatedUploaderLayout: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-start' },
  pdfDropZone: { border: '1px dashed #1f293d', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  pdfLabelUpload: { fontSize: '11px', color: '#8b949e', cursor: 'pointer', display: 'block', lineHeight: '1.5' },
  fileSuccessRow: { display: 'flex', alignItems: 'center', backgroundColor: '#0c181a', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '12px 14px', gap: '12px', width: '100%', boxSizing: 'border-box' },
  removeFileBtn: { marginLeft: 'auto', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '4px' },
  activeUploaderStatusBadge: { marginTop: '14px', alignSelf: 'center', backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', borderRadius: '20px', padding: '5px 14px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' },
  uploaderPulseDot: { width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%', display: 'inline-block' },
  loadingContainerTrack: { backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', marginBottom: '24px' },
  loadingBarProgressFilled: { height: '4px', width: '100%', background: 'linear-gradient(90deg, #38bdf8, #a855f7, #38bdf8)', backgroundSize: '200% 100%', borderRadius: '4px' },
  submitButtonGreen: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: '4px' },
  submitButtonBlue: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: '4px' },
  submitButtonRed: { backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: '4px' },
  sliderGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', color: '#8b949e' },
  select: { backgroundColor: '#090d16', border: '1px solid #1f293d', borderRadius: '10px', color: '#e6edf3', padding: '10px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  checkboxContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', backgroundColor: '#090d16', padding: '10px', borderRadius: '10px', border: '1px solid #1f293d' },
  checkboxLabel: { fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#141b2e50' },
  checkbox: { cursor: 'pointer', accentColor: '#38bdf8' },
  splitTelemetryRow: { display: 'flex', gap: '24px', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: '24px' },
  educationalCard: { backgroundColor: '#0b1220', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', flex: 1 },
  educationalText: { fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' },
  macroTelemetryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', marginTop: '12px' },
  errorCard: { border: '1px solid #ef4444', borderRadius: '12px', color: '#ef4444', padding: '16px', marginBottom: '24px', fontSize: '13px', backgroundColor: 'rgba(239,68,68,0.04)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { backgroundColor: '#0c111d', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' },
  kpiLabel: { color: '#8b949e', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.8px' },
  kpiValue: { fontSize: '22px', fontWeight: '800' },
  card: { backgroundColor: '#0c111d', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '24px' },
  cardTitle: { color: '#e6edf3', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tableWrapper: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '600px' },
  th: { borderBottom: '2px solid #1f293d', padding: '12px 10px', color: '#8b949e', fontWeight: '700' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.02)' },
  td: { padding: '14px 10px', verticalAlign: 'middle' },
  tickerBadge: { backgroundColor: '#141b2e', border: '1px solid #1f293d', borderRadius: '6px', padding: '5px 10px', fontWeight: 'bold', color: '#e6edf3' },
  shareCount: { color: '#10b981', fontSize: '15px', fontWeight: '700' },
  valuationAlertTag: { marginLeft: '8px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '9px', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' },
  adversarialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' },
  reportBlock: { display: 'flex', flexDirection: 'column', gap: '14px' },
  intelligenceCard: { backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px', position: 'relative' },
  intelligenceCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', marginBottom: '8px' },
  intelligenceIndicatorDot: { width: '6px', height: '6px', borderRadius: '50%' },
  briefBadge: { marginLeft: 'auto', fontSize: '9px', border: '1px solid', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  executionStepRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: 'rgba(20,27,46,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.01)' },
  executionStepNumber: { border: '1px solid', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, fontWeight: 'bold' },
  narrativeParagraphBlock: { padding: '0 4px' },
  ragDisplayGridResp: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  ragExtractSubPane: { backgroundColor: '#080c14', border: '1px solid rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }
};

export default App;