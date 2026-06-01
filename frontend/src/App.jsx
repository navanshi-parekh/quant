import React, { useState } from 'react';

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
  const [selectedSectors, setSelectedSectors] = useState(['Technology', 'Energy']);

  // Advanced Strategy States
  const [diversification, setDiversification] = useState('balanced');
  const [horizonStrategy, setHorizonStrategy] = useState('long_term');
  const [targetProfit, setTargetProfit] = useState(15);

  const sectorsList = ['Technology', 'IT', 'Automobile', 'Energy', 'Finance', 'Commodities'];

  const handleSectorChange = (sector) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const executePipelineRequest = async (payloadPrompt, selectedMarket) => {
    setLoading(true);
    setError(null);
    setData(null);

    const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';

    try {
      const response = await fetch(`${backendBaseUrl}/api/generate-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: payloadPrompt, 
          market: selectedMarket,
          diversification: diversification,
          horizon_strategy: horizonStrategy,
          target_profit_percentage: Number(targetProfit)
        }),
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
    executePipelineRequest(synthesizedPrompt, market);
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    executePipelineRequest(prompt, market);
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
  
  const getMilestonePoints = (trajectoryArray) => {
    if (!trajectoryArray || trajectoryArray.length === 0) return [];
    const len = trajectoryArray.length;
    const start = { ...trajectoryArray[0], descriptiveLabel: "Initial Capital", technicalLabel: "Month 0 (Allocation Baseline)" };
    const midIndex = Math.floor((len - 1) / 2);
    const mid = { ...trajectoryArray[midIndex], descriptiveLabel: "Mid-Term Progression", technicalLabel: `Month ${midIndex} (Compounding Velocity)` };
    const end = { ...trajectoryArray[len - 1], descriptiveLabel: "Terminal Valuation", technicalLabel: `Month ${len - 1} (${horizon} Year Forecast Target)` };
    
    if (midIndex === 0 || midIndex === len - 1) {
      return [start, end];
    }
    return [start, mid, end];
  };

  const milestoneTrajectory = data?.backtest_trajectory ? getMilestonePoints(data.backtest_trajectory) : [];
  
  const maxTrajectoryVal = milestoneTrajectory.length 
    ? Math.max(...milestoneTrajectory.map(t => t.valuation || 0)) 
    : 1;
  const minTrajectoryVal = milestoneTrajectory.length 
    ? Math.min(...milestoneTrajectory.map(t => t.valuation || 0)) 
    : 0;

  const checkIsOvervalued = (peValue) => {
    return market === 'indian' ? peValue > 25.0 : peValue > 30.0;
  };

  return (
    <div style={styles.container}>
      {/* CSS Injection for Dynamic Breakpoints without adding external files */}
      <style>{`
        @media (max-width: 900px) {
          .input-layout-responsive { grid-template-columns: 1fr !important; }
          .grid-2col-responsive { grid-template-columns: 1fr !important; }
          .header-responsive { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .chart-outer-responsive { min-width: 500px !important; }
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
              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'COMPUTING INTENT...' : 'RUN AI PROMPT OPTIMIZATION'}
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
                {loading ? 'RECALCULATING CONSTRAINTS...' : 'APPLY STRATEGIC MATRIX CONFIG'}
              </button>
            </form>
          </section>
        </div>

        {/* Structural Telemetry Layout Row */}
        <div style={styles.splitTelemetryRow}>
          <section style={{...styles.educationalCard, margin: 0, flex: 1.2}}>
            <h3 style={styles.cardTitle}>🧠 Quantitative Risk Matrix Breakdown: What is Beta (β)?</h3>
            <p style={styles.educationalText}>
              <strong>Beta ($\beta$)</strong> indexes systematic asset volatility against a structural market benchmark (baseline index = <strong>1.0</strong>). 
              Low beta entries (&lt;1.0) provide high drawdown cushion, while high beta choices (&gt;1.0) accelerate performance capture curves during market rallies.
            </p>
          </section>

          {data && data.market_macro && (
            <section style={{...styles.educationalCard, margin: 0, flex: 1, borderLeft: '4px solid #58a6ff', backgroundColor: '#0b162a'}}>
              <h3 style={styles.cardTitle}>🌐 {data.market_macro.index_name} Index Macro Telemetry</h3>
              <div style={styles.macroTelemetryGrid}>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>INDEX PRICE</div>
                  <div style={{fontSize: '16px', fontWeight: 'bold', color: '#e6edf3'}}>{currencySymbol}{data.market_macro.index_price.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>INDEX P/E</div>
                  <div style={{fontSize: '16px', fontWeight: 'bold', color: '#ff9800'}}>{data.market_macro.index_pe}</div>
                </div>
                <div>
                  <div style={{fontSize: '11px', color: '#8b949e'}}>PORTFOLIO P/E GAUGE</div>
                  <div style={{
                    fontSize: '16px', 
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
                <div style={styles.kpiLabel}>PORTFOLIO BETA FACTOR</div>
                <div style={{...styles.kpiValue, color: getRiskColor(data.profile?.risk_profile || riskProfile)}}>
                  {data.portfolio_beta || 0}
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>ESTIMATED PORTFOLIO YIELD (CAGR)</div>
                <div style={{...styles.kpiValue, color: '#34d399'}}>{data.expected_portfolio_return || 0}%</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>TARGET EXPONENT MILESTONE</div>
                <div style={{...styles.kpiValue, color: '#a855f7'}}>
                  {currencySymbol}{(data.profile?.target_profit_milestone || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Backtest Trajectory Map */}
            {data.backtest_trajectory && milestoneTrajectory.length > 0 && (
              <section style={{...styles.card, marginBottom: '24px', border: '1px solid #334155'}}>
                <h3 style={styles.cardTitle}>📈 Portfolio Growth Engine Timeline Forecast</h3>
                <p style={{fontSize: '12px', color: '#8b949e', marginTop: '-10px', marginBottom: '20px'}}>
                  This predictive map illustrates how your deployed allocation constructs compound from day one through your designated <strong>{horizon} year</strong> target window.
                </p>
                <div style={styles.chartScrollFrame}>
                  <div style={styles.chartOuterFrame} className="chart-outer-responsive">
                    {milestoneTrajectory.map((point, index) => {
                      const valuation = point.valuation || 0;
                      const heightPercent = maxTrajectoryVal !== minTrajectoryVal 
                        ? ((valuation - minTrajectoryVal) / (maxTrajectoryVal - minTrajectoryVal)) * 60 + 25 
                        : 85;
                      const isTerminal = index === milestoneTrajectory.length - 1;

                      return (
                        <div key={index} style={{...styles.chartColGroup, flex: 1}}>
                          <div style={{...styles.chartValueTooltip, fontSize: '13px', fontWeight: 'bold', color: isTerminal ? '#34d399' : '#e6edf3'}}>
                            {currencySymbol}{Math.round(valuation).toLocaleString('en-IN')}
                          </div>
                          <div style={{
                            ...styles.chartBarUnit, 
                            height: `${heightPercent}px`,
                            width: '55%',
                            backgroundColor: isTerminal ? 'rgba(16,185,129,0.2)' : 'rgba(30,41,59,0.5)',
                            border: isTerminal ? '2px solid #10b981' : '1px solid #475569',
                            boxShadow: isTerminal ? '0 0 15px rgba(16,185,129,0.15)' : 'none'
                          }}></div>
                          <div style={{fontSize: '12px', fontWeight: 'bold', color: isTerminal ? '#34d399' : '#58a6ff', marginTop: '4px'}}>
                            {point.descriptiveLabel}
                          </div>
                          <div style={{fontSize: '10px', color: '#6e7681'}}>{point.technicalLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.chartExplanationBox}>
                  <span style={{color: '#a855f7', fontWeight: 'bold', fontSize: '12px'}}>🔍 Understanding Your Forecast Path:</span>
                  <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.6'}}>
                    Starting with an active deployed cash line of <strong>{currencySymbol}{Math.round(milestoneTrajectory[0]?.valuation || 0).toLocaleString('en-IN')}</strong>, 
                    the allocation strategy captures a projected compounded annual yield of <strong>{data.expected_portfolio_return}%</strong>. Over the specified 
                    <strong> {horizon} year horizon</strong>, compound math expands your baseline asset matrix out to an estimated value of 
                    <strong style={{color: '#34d399'}}> {currencySymbol}{Math.round(milestoneTrajectory[milestoneTrajectory.length - 1]?.valuation || 0).toLocaleString('en-IN')}</strong>.
                  </p>
                </div>
              </section>
            )}

            {/* Matrix Data Grids */}
            <div style={styles.dashboardLayout}>
              <div style={styles.fullWidthCard}>
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

              <div style={styles.fullWidthCard}>
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>⚡ Executive Briefing & Strategy Intelligence</h3>
                  <div style={styles.reportBlock}>
                    {data.report && data.report.split('\n').map((paragraph, index) => {
                      if (!paragraph.trim()) return null;
                      
                      const cleanText = paragraph.replace(/\*\*/g, '');
                      const isAssetAllocationLine = cleanText.includes(':') && (cleanText.includes('shares') || cleanText.includes('%') || cleanText.includes('ETF'));
                      const isExecutionStep = /^\d+\./.test(cleanText.trim()) || cleanText.toLowerCase().includes('step');

                      if (isAssetAllocationLine) {
                        const [title, description] = cleanText.split(/:(.+)/);
                        return (
                          <div key={index} style={styles.intelligenceCard}>
                            <div style={styles.intelligenceCardHeader}>
                              <span style={styles.intelligenceIndicatorDot}></span>
                              <strong>{title.trim()}</strong>
                              <span style={styles.briefBadge}>TACTICAL CONVICTION</span>
                            </div>
                            <p style={{fontSize: '12px', color: '#cbd5e1', marginTop: '6px', margin: 0, lineHeight: '1.5'}}>{description ? description.trim() : ''}</p>
                          </div>
                        );
                      }

                      if (isExecutionStep) {
                        return (
                          <div key={index} style={styles.executionStepRow}>
                            <div style={styles.executionStepNumber}>✓</div>
                            <div style={{fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5'}}>{cleanText}</div>
                          </div>
                        );
                      }

                      return (
                        <div key={index} style={styles.narrativeParagraphBlock}>
                          <p style={{margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', textAlign: 'justify'}}>{cleanText}</p>
                        </div>
                      );
                    })}
                  </div>
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
  textarea: { backgroundColor: '#141822', border: '1px solid #2d3545', borderRadius: '8px', color: '#e6edf3', padding: '16px', fontSize: '13px', minHeight: '180px', resize: 'none', outline: 'none', lineHeight: '1.6', fontFamily: 'inherit' },
  submitButton: { backgroundColor: '#238636', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '14px 20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontFamily: 'inherit' },
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
  errorCard: { backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', borderRadius: '8px', color: '#f85149', padding: '14px', marginBottom: '24px', fontSize: '13px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { backgroundColor: '#0d111a', border: '1px solid #1f242e', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  kpiLabel: { color: '#8b949e', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.6px' },
  kpiValue: { fontSize: '20px', fontWeight: '800' },
  chartScrollFrame: { padding: '10px 0', width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  chartOuterFrame: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '170px', paddingBottom: '14px', borderBottom: '2px dashed #1f242e' },
  chartColGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '100px' },
  chartValueTooltip: { fontFamily: 'monospace' },
  chartBarUnit: { borderRadius: '6px 6px 0 0', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' },
  chartExplanationBox: { backgroundColor: '#141b2e', border: '1px solid #23355c', borderRadius: '8px', padding: '14px', marginTop: '20px' },
  dashboardLayout: { display: 'flex', flexDirection: 'column', gap: '24px' },
  fullWidthCard: { width: '100%' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#0d111a', border: '1px solid #1f242e', borderRadius: '12px', padding: '24px' },
  cardTitle: { color: '#e6edf3', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #1f242e', paddingBottom: '12px', marginBottom: '16px', textTransform: 'uppercase' },
  tableWrapper: { overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '600px' },
  th: { borderBottom: '2px solid #1f242e', padding: '12px 10px', color: '#8b949e', fontWeight: '700' },
  tr: { borderBottom: '1px solid #161b26' },
  td: { padding: '14px 10px', verticalAlign: 'middle' },
  tickerBadge: { backgroundColor: '#1c2333', border: '1px solid #2d3545', borderRadius: '6px', padding: '5px 10px', fontWeight: 'bold', color: '#e6edf3' },
  shareCount: { color: '#10b981', fontSize: '15px', fontWeight: '700' },
  valuationAlertTag: { marginLeft: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' },
  reportBlock: { display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: 'none', overflowY: 'visible' },
  intelligenceCard: { backgroundColor: '#131924', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', position: 'relative' },
  intelligenceCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#38bdf8', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '6px' },
  intelligenceIndicatorDot: { width: '6px', height: '6px', backgroundColor: '#38bdf8', borderRadius: '50%' },
  briefBadge: { marginLeft: 'auto', fontSize: '9px', backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold', color: '#38bdf8' },
  executionStepRow: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #10b981' },
  executionStepNumber: { backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0, fontWeight: 'bold' },
  narrativeParagraphBlock: { padding: '0 4px' }
};

export default App;