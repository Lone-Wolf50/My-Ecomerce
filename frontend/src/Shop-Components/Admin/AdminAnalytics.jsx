import React from 'react';
import { BarChart3, TrendingUp, Package, Radio } from 'lucide-react';

const CHART_HEIGHT = 220;

const BAR_GRADIENTS = [
  { id: 'g0',  top: '#F9D776', bot: '#C9A227' },
  { id: 'g1',  top: '#818CF8', bot: '#4F46E5' },
  { id: 'g2',  top: '#F9A8D4', bot: '#DB2777' },
  { id: 'g3',  top: '#6EE7B7', bot: '#059669' },
  { id: 'g4',  top: '#FCD34D', bot: '#D97706' },
  { id: 'g5',  top: '#93C5FD', bot: '#2563EB' },
  { id: 'g6',  top: '#C4B5FD', bot: '#7C3AED' },
  { id: 'g7',  top: '#FCA5A5', bot: '#DC2626' },
  { id: 'g8',  top: '#67E8F9', bot: '#0891B2' },
  { id: 'g9',  top: '#BEF264', bot: '#65A30D' },
  { id: 'g10', top: '#FDA4AF', bot: '#E11D48' },
  { id: 'g11', top: '#CBD5E1', bot: '#475569' },
];

const formatAmount = (n) => {
  if (n >= 1_000_000) return `GH₵${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `GH₵${(n / 1_000).toFixed(1)}k`;
  return `GH₵${n.toLocaleString()}`;
};

const AdminAnalytics = ({
  products = [],
  orders = [],
  chartPeriod = 'Monthly',
  setChartPeriod = () => {},
  broadcastMsg = '',
  setBroadcastMsg = () => {},
  onUpdateBroadcast = () => {},
  loading = false,
}) => {
  const totalValue     = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const categories     = [...new Set(products.map(p => p.category))];
  const totalRevenue   = orders.filter(o => o.status?.toLowerCase() === 'delivered').reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const pendingRevenue = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const flowRatio      = (totalRevenue + pendingRevenue) > 0 ? (totalRevenue / (totalRevenue + pendingRevenue)) * 100 : 0;

  const getChartData = () => {
    if (chartPeriod === 'Daily') {
      return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => ({
        name: day,
        amount: orders.filter(o => new Date(o.created_at).getDay() === i).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0),
      }));
    }
    if (chartPeriod === 'Yearly') {
      const y = new Date().getFullYear();
      return [y-2, y-1, y].map(year => ({
        name: year.toString(),
        amount: orders.filter(o => new Date(o.created_at).getFullYear() === year).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0),
      }));
    }
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
      name: m,
      amount: orders.filter(o => new Date(o.created_at).getMonth() === i).reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0),
    }));
  };

  const chartData   = getChartData();
  const maxAmount   = Math.max(...chartData.map(d => d.amount), 1);
  const periodTotal = chartData.reduce((acc, c) => acc + c.amount, 0);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Mono:wght@400;500&display=swap');

    .aa-root {
      font-family: 'DM Mono', monospace;
      color: #0D0D0D;
    }
    .aa-serif { font-family: 'Cormorant Garamond', serif; }

    .aa-card {
      background: #FAFAFA;
      border: 1px solid rgba(0,0,0,0.07);
      border-radius: 28px;
      padding: 36px;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }
    .aa-card:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.08); }

    .aa-dark {
      background: #0B0B0B;
      border-color: rgba(255,255,255,0.06);
      color: #fff;
    }

    .aa-eyebrow {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      opacity: 0.3;
    }

    .aa-tag {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 100px;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      background: #0D0D0D;
      color: #fff;
    }

    /* pill toggle */
    .aa-toggle {
      display: flex;
      background: rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 14px;
      padding: 5px;
      gap: 2px;
    }
    .aa-toggle-btn {
      padding: 8px 20px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      border: none;
      background: transparent;
      cursor: pointer;
      color: rgba(0,0,0,0.3);
      transition: all 0.2s;
    }
    .aa-toggle-btn:hover { color: #0D0D0D; }
    .aa-toggle-btn.active {
      background: #0D0D0D;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    /* bars */
    .aa-bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 36px; }
    .aa-bar-wrap {
      position: relative;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .aa-bar {
      width: 100%;
      max-width: 42px;
      border-radius: 10px 10px 4px 4px;
      transition: filter 0.2s, transform 0.2s;
      cursor: pointer;
    }
    .aa-bar-col:hover .aa-bar {
      filter: brightness(1.1);
      transform: translateY(-3px);
    }

    /* value label above bar */
    .aa-bar-label {
      position: absolute;
      bottom: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.04em;
      white-space: nowrap;
      color: rgba(0,0,0,0.5);
      transition: opacity 0.2s, color 0.2s;
      pointer-events: none;
    }
    .aa-bar-col:hover .aa-bar-label { color: #0D0D0D; }

    /* textarea */
    .aa-textarea {
      width: 100%;
      background: rgba(0,0,0,0.025);
      border: 1px solid rgba(0,0,0,0.07);
      padding: 16px;
      border-radius: 16px;
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #0D0D0D;
      outline: none;
      min-height: 100px;
      resize: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .aa-textarea:focus { border-color: #C9A227; }

    .aa-btn {
      width: 100%;
      background: #0D0D0D;
      color: #fff;
      padding: 16px;
      border-radius: 100px;
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s, transform 0.15s;
      margin-top: 16px;
    }
    .aa-btn:hover:not(:disabled) { background: #C9A227; transform: translateY(-1px); }
    .aa-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .aa-divider {
      width: 100%;
      height: 1px;
      background: rgba(0,0,0,0.06);
      margin: 4px 0 0;
    }

    .aa-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 640px) { .aa-grid-2 { grid-template-columns: 1fr; } }

    .aa-gold { color: #C9A227; }
    .aa-muted { opacity: 0.25; }

    .aa-progress-track {
      width: 100%;
      height: 3px;
      background: rgba(255,255,255,0.08);
      border-radius: 99px;
      overflow: hidden;
    }
    .aa-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #C9A227, #F9D776);
      border-radius: 99px;
      transition: width 1s ease;
    }
  `;

  return (
    <>
      <style>{styles}</style>

      {/* SVG gradient defs */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {BAR_GRADIENTS.map(g => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g.top} />
              <stop offset="100%" stopColor={g.bot} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      <div className="aa-root" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ paddingBottom: 8 }}>
          <div className="aa-eyebrow" style={{ marginBottom: 8 }}>Performance Overview</div>
          <h2 className="aa-serif" style={{ fontSize: 42, margin: 0, fontStyle: 'italic', fontWeight: 400, lineHeight: 1 }}>
            Analytics
          </h2>
        </div>

        {/* KPI cards */}
        <div className="aa-grid-2">

          {/* Revenue */}
          <div className="aa-card aa-dark">
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(201,162,39,0.06)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <span className="aa-eyebrow" style={{ color: 'rgba(255,255,255,0.3)' }}>Financial Pulse</span>
              <div style={{ padding: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex' }}>
                <TrendingUp size={16} color="#C9A227" />
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A227', marginBottom: 8 }}>Cleared Revenue</div>
              <div className="aa-serif" style={{ fontSize: 40, fontStyle: 'italic', lineHeight: 1 }}>
                GH₵ {totalRevenue.toLocaleString()}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', marginBottom: 8, opacity: 0.5 }}>
                <span>Pending: GH₵ {pendingRevenue.toLocaleString()}</span>
                <span className="aa-gold">{flowRatio.toFixed(0)}% cleared</span>
              </div>
              <div className="aa-progress-track">
                <div className="aa-progress-fill" style={{ width: `${flowRatio}%` }} />
              </div>
            </div>
          </div>

          {/* Vault */}
          <div className="aa-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <span className="aa-eyebrow">Vault Density</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 100, fontSize: 9, fontWeight: 500, letterSpacing: '0.1em' }}>
                <Package size={11} />
                GH₵ {(totalValue / 1000).toFixed(1)}k
              </div>
            </div>

            <div className="aa-serif" style={{ fontSize: 40, fontStyle: 'italic', lineHeight: 1 }}>
              {products.length}
              <span style={{ fontSize: 14, fontFamily: 'DM Mono, monospace', fontStyle: 'normal', opacity: 0.3, marginLeft: 10 }}>Assets</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {categories.map(cat => (
                <span key={cat} className="aa-tag">{cat}</span>
              ))}
              {categories.length === 0 && <span className="aa-tag" style={{ opacity: 0.3 }}>No categories</span>}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="aa-card" style={{ padding: '36px' }}>
          {/* Chart header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
            <div>
              <h3 className="aa-serif" style={{ fontSize: 28, fontStyle: 'italic', margin: '0 0 6px', fontWeight: 400 }}>
                {chartPeriod} Performance
              </h3>
              <div className="aa-eyebrow">
                Gross Volume: GH₵ {periodTotal.toLocaleString()}
              </div>
            </div>
            <div className="aa-toggle">
              {['Daily', 'Monthly', 'Yearly'].map(t => (
                <button
                  key={t}
                  className={`aa-toggle-btn${chartPeriod === t ? ' active' : ''}`}
                  onClick={() => setChartPeriod(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                minWidth: 'max-content',
                height: `${CHART_HEIGHT + 60}px`,
                paddingBottom: 4,
                paddingTop: 32,
              }}
            >
              {chartData.map((data, i) => {
                const ratio   = data.amount / maxAmount;
                const barPx   = Math.max(Math.round(ratio * CHART_HEIGHT), data.amount > 0 ? 10 : 3);
                const gradId  = BAR_GRADIENTS[i % BAR_GRADIENTS.length].id;

                return (
                  <div key={i} className="aa-bar-col">
                    <div className="aa-bar-wrap" style={{ height: `${CHART_HEIGHT}px` }}>
                      {/* Value label */}
                      <div className="aa-bar-label">
                        {data.amount > 0 ? formatAmount(data.amount) : '—'}
                      </div>

                      {/* SVG bar for crisp gradient */}
                      <svg
                        className="aa-bar"
                        width="42"
                        height={barPx}
                        style={{ opacity: data.amount > 0 ? 1 : 0.12 }}
                      >
                        <rect
                          x="0" y="0"
                          width="42" height={barPx}
                          rx="8"
                          fill={`url(#${gradId})`}
                        />
                      </svg>
                    </div>

                    {/* X label */}
                    <span style={{
                      marginTop: 10,
                      fontSize: 9,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      opacity: 0.3,
                      textAlign: 'center',
                      transition: 'opacity 0.2s',
                    }}>
                      {data.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="aa-divider" />
        </div>

        {/* Broadcast */}
        <div className="aa-card" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ padding: 8, background: 'rgba(201,162,39,0.1)', borderRadius: 12, display: 'flex' }}>
              <Radio size={14} color="#C9A227" />
            </div>
            <div>
              <div className="aa-eyebrow" style={{ marginBottom: 2 }}>Global Broadcast</div>
              <h3 className="aa-serif aa-gold" style={{ fontSize: 22, margin: 0, fontStyle: 'italic', fontWeight: 400 }}>
                Homepage Announcement
              </h3>
            </div>
          </div>

          <textarea
            className="aa-textarea"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="Tell your clients something important…"
          />

          <button
            className="aa-btn"
            onClick={onUpdateBroadcast}
            disabled={loading}
          >
            {loading ? 'Transmitting…' : 'Broadcast Message'}
          </button>
        </div>

      </div>
    </>
  );
};

export default AdminAnalytics;