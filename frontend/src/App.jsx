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
    } else {
      alert('Invalid file structure. Please drop or select an official corporate .pdf report.');
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  // FIXED: Standardized transmission architecture ensuring sector payloads map smoothly via both prompt and manual forms
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
      
      // CRITICAL UPGRADE: Hand off sectors explicitly down the multi-part data payload stream
      activeSectors.forEach((sector) => {
        formDataBody.append('sectors', sector);
      });
      
      if (attachedFile) {
        formDataBody.append('file', attachedFile);
      }

      const response = await fetch(`${backendBaseUrl}/api/generate-recommendation`, {
        method: 'POST',
        body: formDataBody,
      });
      
      if (!response.ok) throw new Error('Internal validation processing fault over backend endpoints.');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message || 'Connection lost or internal server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const currency = market === 'american' ? 'USD' : 'INR';
    const sectorsToPass = selectedSectors.length > 0 ? selectedSectors : ['Technology'];
    const synthesizedPrompt = `Deploy exactly ${amount} ${currency} for a horizon of ${horizon} years directly into the following sectors: ${sectorsToPass.join(', ')}. Strategy is ${horizonStrategy} aiming for a risk profile of ${riskProfile}.`;
    executePipelineRequest(synthesizedPrompt, market, sectorsToPass);
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const sectorsToPass = selectedSectors.length > 0 ? selectedSectors : ['Technology'];
    executePipelineRequest(prompt, market, sectorsToPass);
  };

  const getRiskColor = (risk) => {
    if (!risk) return '#8b949e';
    switch(risk.toLowerCase()) {
      case 'conservative': return '#34d399';
      case 'moderate': return '#f59e0b';
      case 'aggressive': return '#ef4444';
      default: return '#58a6ff';
    }
  };

  const currencySymbol = market === 'american' ? '$' : '₹';
  const currencyCode = market === 'american' ? 'USD' : 'INR';

  const checkIsOvervalued = (peValue) => {
    return market === 'indian' ? peValue > 25.0 : peValue > 30.0;
  };

  // FIXED: Seamless key-value flattening ensures nested JSON strings map out natively without [object Object] interference
  const renderIntelligenceBlock = (rawText, accentColor, badgeLabel) => {
    if (!rawText) return <div style={{fontSize: '12px', color: '#6e7681'}}>No analysis payload returned.</div>;
    
    let cleanString = "";
    if (Array.isArray(rawText)) {
      cleanString = rawText.join('\n');
    } else if (typeof rawText === 'object') {
      cleanString = Object.entries(rawText)
        .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
        .join('\n');
    } else {
      cleanString = String(rawText);
    }

    return cleanString.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const cleanText = paragraph.replace(/\*\*/g, '').replace(/[\{\}\"\[\]\,]/g, '');
      if (!cleanText.trim()) return null;

      const isHeaderLine = cleanText.includes(':') && (cleanText.includes('%') || cleanText.toLowerCase().includes('conviction') || cleanText.toLowerCase().includes('mitigation') || cleanText.toLowerCase().includes('risk') || cleanText.toLowerCase().includes('case') || cleanText.toLowerCase().includes('bullet'));
      const isBulletStep = cleanText.trim().startsWith('-') || cleanText.trim().startsWith('*') || /^\d+\./.test(cleanText.trim());

      if (isHeaderLine) {
        const [title, description] = cleanText.split(/:(.+)/);
        return (
          <div key={idx} style={{...styles.intelligenceCard, borderLeft: `3px solid ${accentColor}`}}>
            <div style={{...styles.intelligenceCardHeader, color: accentColor}}>
              <span style={{...styles.intelligenceIndicatorDot, backgroundColor: accentColor}}></span>
              <strong>{title.trim()}</strong>
              <span style={{...styles.briefBadge, color: accentColor, borderColor: accentColor, backgroundColor: `${accentColor}10`}}>{badgeLabel}</span>
            </div>
            {description && <p style={{fontSize: '12px', color: '#cbd5e1', marginTop: '6px', margin: 0, lineHeight: '1.5'}}>{description.trim()}</p>}
          </div>
        );
      }

      if (isBulletStep) {
        const lineContent = cleanText.replace(/^[\s\-\*\d\.]\s*/, '');
        return (
          <div key={idx} style={{...styles.executionStepRow, borderLeft: `3px solid ${accentColor}`}}>
            <div style={{...styles.executionStepNumber, color: accentColor, borderColor: accentColor, backgroundColor: `${accentColor}10`}}>✓</div>
            <div style={{fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5'}}>{lineContent}</div>
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
        @media (max-width: 1100px) {
          .input-layout-responsive { grid-template-columns: 1fr !important; }
          .grid-2col-responsive { grid-template-columns: 1fr !important; }
          .header-responsive { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .adversarial-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header style={styles.header} className="header-responsive">
        <div>
          <h1 style={styles.title}>QUANT-LLM ADVISOR TERMINAL</h1>
          <p style={styles.subtitle}>Institutional Grade Multi-Agent Optimization Engine</p>
        </div>
        <div style={styles.statusBadge}><span style={styles.statusDot}></span> ENGINE ONLINE</div>
      </header>

      <main style={styles.main}>
        {/* Market Selector Toggles */}
        <div style={styles.marketToggleRow}>
          <button style={{...styles.marketTab, ...(market === 'indian' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('indian'); setAmount(75000); setData(null); }}>🇮🇳 INDIAN DESK</button>
          <button style={{...styles.marketTab, ...(market === 'american' ? styles.activeMarketTab : {})}} onClick={() => { setMarket('american'); setAmount(5000); setData(null); }}>🇺🇸 US DESK</button>
        </div>

        <div style={styles.inputConfigLayout} className="input-layout-responsive">
          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>🤖 AI Prompt Interface</h2>
            <form onSubmit={handlePromptSubmit} style={styles.form}>
              <textarea
                style={styles.textarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe your investment goals for the ${market} desk...`}
                disabled={loading}
              />
              
              {/* Context Augmentation Drag/Drop input */}
              <div style={styles.pdfDropZone}>
                <div style={{fontSize: '11px', color: '#8b949e', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase'}}>
                  📁 Context Augmentation: Corporate Report (Optional)
                </div>
                {!attachedFile ? (
                  <label style={styles.pdfLabelUpload}>
                    <input type="file" accept=".pdf" onChange={handleFileDropChange} style={{display: 'none'}} />
                    <span style={{color: '#58a6ff', cursor: 'pointer'}}>Click to upload quarterly report PDF</span> or drag file here
                  </label>
                ) : (
                  <div style={styles.fileSuccessRow}>
                    <span style={styles.fileIcon}>📄</span>
                    <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px'}}>
                      <strong style={{color: '#34d399', fontSize: '12px'}}>{attachedFile.name}</strong>
                    </div>
                    <button type="button" onClick={removeAttachedFile} style={styles.removeFileBtn}>✕</button>
                  </div>
                )}
              </div>

              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'PROCESSING COMPREHENSIVE DATA...' : 'RUN AI PROMPT OPTIMIZATION'}
              </button>
            </form>
          </section>

          <section style={styles.controlCard}>
            <h2 style={styles.sectionHeader}>🎛️ Strategic Constraint Parameters</h2>
            <form onSubmit={handleManualSubmit} style={styles.manualForm}>
              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Allocation: <strong>{currencySymbol}{amount.toLocaleString('en-IN')}</strong></label>
                  <input type="range" min={market === 'american' ? "500" : "5000"} max={market === 'american' ? "50000" : "1000000"} step={market === 'american' ? "250" : "5000"} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={styles.slider} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Horizon: <strong>{horizon} Years</strong></label>
                  <input type="range" min="1" max="5" step="0.5" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} style={styles.slider} />
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Diversification Profile:</label>
                  <select value={diversification} onChange={(e) => setDiversification(e.target.value)} style={styles.select}>
                    <option value="balanced">Balanced Distribution</option>
                    <option value="concentrated">Concentrated Portfolio</option>
                    <option value="diversified">High Diversification (Gold/ETFs)</option>
                  </select>
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Investment Timeline View:</label>
                  <select value={horizonStrategy} onChange={(e) => setHorizonStrategy(e.target.value)} style={styles.select}>
                    <option value="long_term">Long-Term Compounding</option>
                    <option value="short_term">Capital Preservation</option>
                  </select>
                </div>
              </div>

              <div style={styles.grid2Col} className="grid-2col-responsive">
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Expected Profit Margin: <strong>{targetProfit}% Target</strong></label>
                  <input type="range" min="5" max="50" step="1" value={targetProfit} onChange={(e) => setTargetProfit(Number(e.target.value))} style={styles.slider} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.label}>Risk Allocation Core:</label>
                  <select value={riskProfile} onChange={(e) => setRiskProfile(e.target.value)} style={styles.select}>
                    <option value="moderate">Moderate Strategy</option>
                    <option value="conservative">Conservative Strategy</option>
                    <option value="aggressive">Aggressive Growth</option>
                  </select>
                </div>
              </div>

              <div style={styles.sliderGroup}>
                <label style={styles.label}>Target Sector Exposure:</label>
                <div style={styles.checkboxContainer}>
                  {sectorsList.map((sector) => (
                    <label key={sector} style={styles.checkboxLabel}>
                      <input type="checkbox" checked={selectedSectors.includes(sector)} onChange={() => handleSectorChange(sector)} style={styles.checkbox} />
                      {sector}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" style={{...styles.submitButton, backgroundColor: '#0284c7'}} disabled={loading}>
                {loading ? 'RECALCULATING MATRIX CORES...' : 'APPLY STRATEGIC MATRIX CONFIG'}
              </button>
            </form>
          </section>
        </div>

        {/* Structural Telemetry Layout Row */}
        <div style={styles.splitTelemetryRow}>
          <section style={{...styles.educationalCard, margin: 0, flex: 1.2}}>
            <h3 style={styles.cardTitle}>🧠 Sharpe Ratio Core Metric: Risk-Adjusted Return Performance</h3>
            <p style={styles.educationalText}>
              The **Sharpe Ratio** tracks your excess returns relative to the portfolio's underlying mathematical volatility. Higher metrics (&gt;1.5) indicate the current distribution is generating structural alpha per unit of capital risk, rather than simply hunting beta.
            </p>
          </section>

          {data && data.market_macro && (
            <section style={{...styles.educationalCard, margin: 0, flex: 1, borderLeft: '4px solid #58a6ff', backgroundColor: '#0b162a'}}>
              <h3 style={styles.cardTitle}>🌐 {data.market_macro.index_name} Index Macro Telemetry</h3>
              <div style={styles.macroTelemetryGrid}>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>INDEX PRICE</div>
                  <div style={{fontSize: '14px', fontWeight: 'bold', color: '#e6edf3'}}>{currencySymbol}{data.market_macro.index_price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>INDEX P/E</div>
                  <div style={{fontSize: '14px', fontWeight: 'bold', color: '#ff9800'}}>{data.market_macro.index_pe}</div>
                </div>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>PORTFOLIO P/E GAUGE</div>
                  <div style={{
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: data.market_macro.portfolio_avg_pe > data.market_macro.index_pe ? '#ef4444' : '#34d399'
                  }}>
                    {data.market_macro.portfolio_avg_pe} 
                    <span style={{fontSize: '10px', marginLeft: '4px'}}>
                      {data.market_macro.portfolio_avg_pe > data.market_macro.index_pe ? '(Premium)' : '(Discount)'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {error && <div style={styles.errorCard}>⚠️ ERROR: {error}</div>}

        {data && data.optimized_portfolio && (
          <div style={{marginTop: '24px'}}>
            {/* KPI Telemetry Metrics */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>TOTAL ALLOCATED CAPITAL</div>
                <div style={{...styles.kpiValue, color: '#58a6ff'}}>
                  {currencySymbol}{(data.profile?.investment_amount || amount).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>SHARPE RATIO ENGINE</div>
                <div style={{...styles.kpiValue, color: data.sharpe_ratio > 1.0 ? '#34d399' : '#f59e0b'}}>
                  SR {data.sharpe_ratio || 0.0}
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>LIVE RISK-FREE BASELINE</div>
                <div style={{...styles.kpiValue, color: '#a855f7'}}>{data.risk_free_rate || 6.75}%</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>ESTIMATED PORTFOLIO YIELD (CAGR)</div>
                <div style={{...styles.kpiValue, color: '#34d399'}}>{data.expected_portfolio_return || 0}%</div>
              </div>
            </div>

            {/* Backtest Trajectory Map */}
            {data.backtest_trajectory && data.backtest_trajectory.length > 0 && (
              <section style={{...styles.card, marginBottom: '24px', border: '1px solid #1f242e'}}>
                <h3 style={styles.cardTitle}>📈 Portfolio Growth Engine Timeline Forecast</h3>
                <p style={{fontSize: '12px', color: '#8b949e', marginTop: '-10px', marginBottom: '20px'}}>
                  This vector timeline charts your compounded valuation trajectory over the specified **{horizon} year** deployment target window.
                </p>
                
                <div style={{ width: '100%', height: 260, marginTop: '20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.backtest_trajectory} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#161b26" vertical={false} />
                      <XAxis dataKey="label" stroke="#6e7681" tickLine={false} style={{ fontSize: '11px' }} />
                      <YAxis 
                        stroke="#6e7681" 
                        tickLine={false} 
                        style={{ fontSize: '11px' }}
                        tickFormatter={(v) => `${currencySymbol}${Math.round(v).toLocaleString('en-IN')}`} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d111a', borderColor: '#2d3545', borderRadius: '8px' }}
                        itemStyle={{ color: '#58a6ff', fontSize: '12px' }}
                        labelStyle={{ color: '#8b949e', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString('en-IN')}`, 'Portfolio Valuation']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valuation" 
                        stroke="#58a6ff" 
                        strokeWidth={3} 
                        dot={{ r: 3, stroke: '#58a6ff', strokeWidth: 2, fill: '#070a13' }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={styles.chartExplanationBox}>
                  <span style={{color: '#a855f7', fontWeight: 'bold', fontSize: '12px'}}>🔍 Forecast Summary Analytics:</span>
                  <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.6', margin: 0}}>
                    Starting with an active asset allocation baseline of <strong>{currencySymbol}{Math.round(data.backtest_trajectory[0]?.valuation || 0).toLocaleString('en-IN')} {currencyCode}</strong>, your optimized portfolio captures a projected compounded annual yield of <strong>{data.expected_portfolio_return}%</strong>. Compounding expands your baseline out to an estimated terminal valuation of <strong style={{color: '#34d399'}}>{currencySymbol}{Math.round(data.backtest_trajectory[data.backtest_trajectory.length - 1]?.valuation || 0).toLocaleString('en-IN')} {currencyCode}</strong>.
                  </p>
                </div>
              </section>
            )}

            {/* Asset Matrix Spreadsheet Card */}
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
                      {data.optimized_portfolio.map((asset, idx) => {
                        const betaValue = asset.beta || 0;
                        const peValue = asset.pe_ratio || 0;
                        return (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}>
                              <span style={styles.tickerBadge}>{asset.symbol}</span>
                              {checkIsOvervalued(peValue) && (
                                <span style={styles.valuationAlertTag}>⚠️ OVERVALUED</span>
                              )}
                            </td>
                            <td style={styles.td}>{currencySymbol}{(asset.current_price || 0).toLocaleString('en-IN')}</td>
                            <td style={{...styles.td, color: getRiskColor(betaValue > 1.1 ? 'aggressive' : betaValue >= 0.85 ? 'moderate' : 'conservative')}}>
                              β {betaValue}
                            </td>
                            <td style={styles.td}>{peValue > 0 ? peValue : 'N/A'}</td>
                            <td style={{...styles.td, color: '#34d399'}}>{asset.dividend_yield || 0}%</td>
                            <td style={styles.td}>{asset.allocation_percentage || 0}%</td>
                            <td style={styles.td}><strong style={styles.shareCount}>{asset.suggested_shares_to_buy || 0}</strong></td>
                            <td style={styles.td}>{currencySymbol}{(asset.actual_deployment_cost || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ADVERSARIAL AGENT INTELLIGENCE SIDE-BY-SIDE PANELS */}
            <div style={styles.adversarialGrid} className="adversarial-grid-responsive">
              <div style={styles.card}>
                <h3 style={{...styles.cardTitle, color: '#34d399', borderBottom: '1px solid rgba(52,211,153,0.2)'}}>
                  🟢 BULL CASE ANALYST: GROWTH CONVICTION
                </h3>
                <div style={styles.reportBlock}>
                  {renderIntelligenceBlock(data.report_bull, '#34d399', 'BULL STRATEGY')}
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={{...styles.cardTitle, color: '#ef4444', borderBottom: '1px solid rgba(239,68,68,0.2)'}}>
                  🔴 BEAR CASE ANALYST: RISK & HEADWINDS
                </h3>
                <div style={styles.reportBlock}>
                  {renderIntelligenceBlock(data.report_bear, '#ef4444', 'RISK MITIGATION')}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#070a13', color: '#c9d1d9', minHeight: '100vh', fontFamily: '"Fira Code", monospace, system-ui', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #161b26', paddingBottom: '20px', marginBottom: '24px' },
  title: { color: '#58a6ff', fontSize: '24px', fontWeight: '800', letterSpacing: '1.2px' },
  subtitle: { color: '#6e7681', fontSize: '13px', marginTop: '4px' },
  statusBadge: { backgroundColor: '#0d192b', border: '1px solid #1f3a5f', borderRadius: '20px', padding: '6px 14px', color: '#58a6ff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #10b981' },
  main: { maxWidth: '1600px', margin: '0 auto' },
  marketToggleRow: { display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#0d111a', padding: '8px', borderRadius: '12px', border: '1px solid #1f242e' },
  marketTab: { flex: 1, backgroundColor: 'transparent', border: 'none', color: '#8b949e', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
  activeMarketTab: { backgroundColor: '#1c2333', color: '#58a6ff', border: '1px solid #2d3545' },
  inputConfigLayout: { display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', marginBottom: '24px' },
  controlCard: { backgroundColor: '#0d111a', border: '1px solid #1f242e', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  sectionHeader: { fontSize: '13px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px', borderBottom: '1px solid #1f242e', paddingBottom: '8px', fontWeight: '700' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' },
  manualForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  grid2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  textarea: { backgroundColor: '#141822', border: '1px solid #2d3545', borderRadius: '8px', color: '#e6edf3', padding: '16px', fontSize: '13px', minHeight: '140px', resize: 'none', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit' },
  pdfDropZone: { border: '1px dashed #2d3545', backgroundColor: '#141822', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column' },
  pdfLabelUpload: { fontSize: '11px', color: '#8b949e', textAlign: 'center', padding: '10px', cursor: 'pointer', display: 'block' },
  fileSuccessRow: { display: 'flex', alignItems: 'center', backgroundColor: '#0d191b', border: '1px solid #1b4431', borderRadius: '6px', padding: '6px 12px', gap: '8px' },
  fileIcon: { fontSize: '14px' },
  removeFileBtn: { marginLeft: 'auto', backgroundColor: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
  submitButton: { backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit', marginTop: '4px' },
  sliderGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', color: '#c9d1d9' },
  slider: { width: '100%', cursor: 'pointer', accentColor: '#0284c7' },
  select: { backgroundColor: '#141822', border: '1px solid #2d3545', borderRadius: '8px', color: '#e6edf3', padding: '10px', fontSize: '12px', outline: 'none', fontFamily: 'inherit' },
  checkboxContainer: { display: 'flex', flexWrap: 'wrap', gap: '12px', backgroundColor: '#141822', padding: '10px', borderRadius: '8px', border: '1px solid #2d3545' },
  checkboxLabel: { fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  checkbox: { cursor: 'pointer', accentColor: '#0284c7' },
  splitTelemetryRow: { display: 'flex', gap: '24px', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: '24px' },
  educationalCard: { backgroundColor: '#0b1324', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' },
  educationalText: { fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', marginTop: '4px' },
  macroTelemetryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', marginTop: '8px' },
  errorCard: { border: '1px solid #f85149', borderRadius: '8px', color: '#f85149', padding: '14px', marginBottom: '24px', fontSize: '13px', backgroundColor: 'rgba(248,81,73,0.07)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { backgroundColor: '#0d111a', border: '1px solid #1f242e', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  kpiLabel: { color: '#8b949e', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.6px' },
  kpiValue: { fontSize: '20px', fontWeight: '800' },
  chartExplanationBox: { backgroundColor: '#141b2e', border: '1px solid #23355c', borderRadius: '8px', padding: '14px', marginTop: '20px' },
  card: { backgroundColor: '#0d111a', border: '1px solid #1f242e', borderRadius: '12px', padding: '24px' },
  cardTitle: { color: '#e6edf3', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #1f242e', paddingBottom: '12px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableWrapper: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '600px' },
  th: { borderBottom: '2px solid #1f242e', padding: '12px 10px', color: '#8b949e', fontWeight: '700' },
  tr: { borderBottom: '1px solid #161b26' },
  td: { padding: '14px 10px', verticalAlign: 'middle' },
  tickerBadge: { backgroundColor: '#1c2333', border: '1px solid #2d3545', borderRadius: '6px', padding: '5px 10px', fontWeight: 'bold', color: '#e6edf3' },
  shareCount: { color: '#10b981', fontSize: '15px', fontWeight: '700' },
  valuationAlertTag: { marginLeft: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' },
  adversarialGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' },
  reportBlock: { display: 'flex', flexDirection: 'column', gap: '14px' },
  intelligenceCard: { backgroundColor: '#131924', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', position: 'relative' },
  intelligenceCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '6px' },
  intelligenceIndicatorDot: { width: '6px', height: '6px', borderRadius: '50%' },
  briefBadge: { marginLeft: 'auto', fontSize: '9px', border: '1px solid', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' },
  executionStepRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px' },
  executionStepNumber: { border: '1px solid', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, fontWeight: 'bold' },
  narrativeParagraphBlock: { padding: '0 4px' }
};

export default App;