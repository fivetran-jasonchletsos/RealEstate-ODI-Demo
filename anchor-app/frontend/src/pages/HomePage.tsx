import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData, formatCurrencyShort, formatNumber, formatPercent, formatDeltaPct } from '../lib/format';

type Signal = {
  id: string; title: string; detail: string; severity: 'alert' | 'caution' | 'info';
  owner: string; link?: string;
};

type Summary = {
  portfolio_value_usd: number;
  property_count: number;
  asset_classes: Record<string, number>;
  states_covered: number;
  gla_sqft: number;
  occupancy_pct: number;
  occupancy_pct_prior_qtr: number;
  noi_ytd_usd: number;
  noi_run_rate_usd: number;
  same_store_noi_growth_pct: number;
  affo_per_share_usd: number;
  affo_payout_ratio_pct: number;
  dividend_coverage_ratio: number;
  debt_to_ebitda: number;
  weighted_avg_lease_term_yrs: number;
  weighted_avg_cost_of_debt_pct: number;
  top_signals: Signal[];
};

type Portfolio = {
  top_properties: Array<{
    property_id: string; name: string; asset_class: string;
    metro_code: string; city: string; state: string;
    gla_sqft: number; noi_ytd_usd: number; occupancy_pct: number; walt_yrs: number;
    watchlist_flag: boolean;
  }>;
  regions_summary: Array<{ region: string; city: string; state: string; noi_share_pct: number }>;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Summary | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    fetchData<Summary>('/data/summary.json').then(setStats).catch(() => {});
    fetchData<Portfolio>('/data/portfolio.json').then(setPortfolio).catch(() => {});
  }, []);

  const occDelta = stats ? stats.occupancy_pct - stats.occupancy_pct_prior_qtr : null;

  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--midnight)] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          aria-hidden
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 28px, rgba(216,191,106,0.5) 28px 29px)' }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <div className="eyebrow-light mb-4">Anchor Properties, Open Data Infrastructure</div>
              <h1 className="font-serif text-4xl sm:text-6xl text-white leading-[0.98] tracking-tight">
                One lake.<br />
                <span className="text-[var(--gold-bright)]">Every asset.</span><br />
                One investment lens.
              </h1>
              <p className="mt-6 text-base sm:text-lg text-white/75 max-w-2xl leading-relaxed">
                A $42B portfolio spread across eight source systems and a thousand asset-management
                spreadsheets, landed once into open Iceberg tables on S3. The CIO opens this page;
                the VP of Asset Management closes a lease tour by Thursday.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/leasing')}
                  className="inline-flex items-center gap-2 rounded-sm font-semibold text-sm text-[var(--midnight)] px-5 py-3 shadow-lg hover:opacity-95 transition-opacity"
                  style={{ background: 'var(--gold)' }}
                >
                  Open the desk
                </button>
                <button
                  onClick={() => navigate('/architecture')}
                  className="inline-flex items-center gap-2 rounded-sm font-semibold text-sm text-white bg-white/5 border border-white/20 px-5 py-3 hover:bg-white/10 transition-colors"
                >
                  See the ODI architecture
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white text-[var(--ink)] rounded-sm border border-[var(--hairline)] shadow-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--paper-deep)]">
                  <div className="eyebrow">Portfolio Snapshot</div>
                  <div className="text-[10px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider">Snowflake, Iceberg</div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-[var(--hairline-soft)] tabular">
                  <Stat label="Portfolio value" value={stats ? formatCurrencyShort(stats.portfolio_value_usd) : '—'} hint="gross asset value" />
                  <Stat label="Properties" value={stats ? formatNumber(stats.property_count) : '—'} hint={`${stats?.states_covered ?? '—'} states`} />
                  <Stat label="GLA" value={stats ? `${(stats.gla_sqft / 1_000_000).toFixed(1)}M` : '—'} hint="sqft gross leasable area" />
                  <Stat
                    label="Occupancy"
                    value={stats ? formatPercent(stats.occupancy_pct) : '—'}
                    hint="vs prior quarter"
                    delta={occDelta != null ? Number(occDelta.toFixed(1)) : null}
                  />
                </div>
                <div className="px-5 py-3 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] text-[var(--ink-soft)] bg-[var(--paper-deep)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--good)] animate-pulse" />
                    Snapshot 2026-05-20, 28 Iceberg tables
                  </span>
                  <button onClick={() => navigate('/pipeline')} className="font-semibold hover:text-[var(--ink-strong)] uppercase tracking-wider">
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-2 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between border-b border-[var(--hairline)] pb-3">
          <div>
            <div className="eyebrow mb-1">Investment Committee Read</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink-strong)] tracking-tight">
              The portfolio in eight numbers
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              NOI, same-store growth, AFFO coverage, balance-sheet leverage, lease-term protection, and cost of debt — the lens the CIO opens first.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="NOI YTD"               value={stats ? formatCurrencyShort(stats.noi_ytd_usd) : '—'}    sub={stats ? `Run-rate ${formatCurrencyShort(stats.noi_run_rate_usd)}` : ''} />
          <KPI label="Same-store NOI growth" value={stats ? formatDeltaPct(stats.same_store_noi_growth_pct) : '—'} sub="trailing twelve months" tone={stats && stats.same_store_noi_growth_pct > 0 ? 'good' : 'alert'} />
          <KPI label="AFFO per share"        value={stats ? `$${stats.affo_per_share_usd.toFixed(2)}` : '—'} sub={stats ? `Payout ratio ${stats.affo_payout_ratio_pct.toFixed(0)}%` : ''} />
          <KPI label="Dividend coverage"     value={stats ? `${stats.dividend_coverage_ratio.toFixed(2)}x` : '—'} sub="AFFO ÷ dividends" tone={stats && stats.dividend_coverage_ratio > 1.15 ? 'good' : 'caution'} />
          <KPI label="Debt / EBITDA"         value={stats ? `${stats.debt_to_ebitda.toFixed(1)}x` : '—'} sub="net leverage" tone={stats && stats.debt_to_ebitda < 6 ? 'good' : 'caution'} />
          <KPI label="WALT"                  value={stats ? `${stats.weighted_avg_lease_term_yrs.toFixed(1)} yrs` : '—'} sub="weighted avg lease term" />
          <KPI label="Cost of debt"          value={stats ? formatPercent(stats.weighted_avg_cost_of_debt_pct) : '—'} sub="weighted avg" />
          <KPI label="Watchlist properties"  value={portfolio ? String(portfolio.top_properties.filter((p) => p.watchlist_flag).length) : '—'} sub="occupancy or expiry risk" tone="caution" onClick={() => navigate('/leasing')} />
        </div>
      </section>

      {/* Top 3 issues on CIO's desk */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-2 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between border-b border-[var(--hairline)] pb-3">
          <div>
            <div className="eyebrow mb-1">On the CIO's desk this week</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink-strong)] tracking-tight">
              Three signals worth your time
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(stats?.top_signals ?? []).map((s) => (
            <button
              key={s.id}
              onClick={() => s.link && navigate(s.link)}
              className="text-left research-card p-5 hover:border-[var(--gold)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`status-pill ${s.severity === 'alert' ? 'alert' : s.severity === 'caution' ? 'caution' : 'neutral'}`}>
                  {s.severity}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">{s.owner}</span>
              </div>
              <div className="font-serif text-lg text-[var(--ink-strong)] tracking-tight leading-snug">{s.title}</div>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{s.detail}</p>
            </button>
          ))}
        </div>
      </section>

      {/* US map by NOI */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 border-b border-[var(--hairline)] pb-4">
          <div>
            <div className="eyebrow mb-1">Geographic Concentration</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink-strong)]">NOI by metro</h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-2xl">
              Bubble area scales to share of portfolio NOI. Selected metros only — the full Iceberg gold mart covers all 843 assets.
            </p>
          </div>
        </div>
        <USMap regions={portfolio?.regions_summary ?? []} />
      </section>

      {/* Asset class mix */}
      <section className="bg-white border-y border-[var(--hairline)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="eyebrow mb-2">Asset Class Mix</div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink-strong)] tracking-tight">
              Office, industrial, multifamily, mixed-use
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
              Portfolio composition shaped by the past three vintages of dispositions — net seller of office, net buyer of industrial in Sun Belt logistics corridors.
            </p>
          </div>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.asset_classes).map(([k, v]) => (
                <div key={k} className="research-card p-5">
                  <div className="eyebrow mb-1">{k.replace('_', ' ')}</div>
                  <div className="font-serif text-3xl text-[var(--ink-strong)] tabular leading-none">{v}</div>
                  <div className="mt-2 text-xs text-[var(--ink-soft)]">properties</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Closing principle */}
      <section className="bg-[var(--midnight-deep)] text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="eyebrow-light mb-3">Design Principles</div>
          <p className="font-serif text-2xl sm:text-3xl text-white leading-snug">
            "The asset is the data.<br />
            <span className="text-[var(--gold-bright)]">The data is the strategy.</span>"
          </p>
          <p className="mt-4 text-sm text-white/70 max-w-2xl mx-auto">
            Anchor Properties chose ODI because eight source systems and ten thousand asset-management
            spreadsheets cannot be the foundation of a $42B investment platform.
          </p>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, hint, delta }: { label: string; value: string; hint: string; delta?: number | null }) {
  const deltaColor = delta == null ? 'var(--ink-soft)' : delta >= 0 ? 'var(--good)' : 'var(--alert)';
  return (
    <div className="px-5 py-4">
      <div className="text-[10.5px] font-semibold text-[var(--ink-soft)] uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="font-serif text-2xl text-[var(--ink-strong)] leading-none tabular">{value}</div>
        {delta != null && (
          <span className="text-[11px] font-semibold tabular" style={{ color: deltaColor }}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{hint}</div>
    </div>
  );
}

function KPI({ label, value, sub, tone, onClick }: { label: string; value: string; sub?: string; tone?: 'good' | 'alert' | 'caution'; onClick?: () => void }) {
  const color =
    tone === 'good' ? 'var(--good)' :
    tone === 'alert' ? 'var(--alert)' :
    tone === 'caution' ? 'var(--caution)' :
    'var(--ink-strong)';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`research-card px-5 py-4 text-left ${onClick ? 'hover:border-[var(--gold)] transition-colors cursor-pointer' : ''}`}>
      <div className="text-[10.5px] font-semibold text-[var(--ink-soft)] uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 font-serif text-3xl leading-none tabular" style={{ color }}>{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </Tag>
  );
}

// Simple, schematic US map. We position 10 dots at approximate coords; size = NOI share.
const METRO_COORDS: Record<string, [number, number]> = {
  NYC: [78, 35], BOS: [83, 30], DC: [76, 40], PHL: [78, 36], MIA: [76, 78],
  ATL: [68, 58], NSH: [64, 50], CHA: [73, 52], CHI: [60, 38], MIN: [56, 28],
  DAL: [50, 65], HOU: [52, 72], AUS: [48, 68], DEN: [38, 47], PHX: [28, 60],
  LA:  [16, 55], SF:  [12, 45], SEA: [18, 22],
};

function USMap({ regions }: { regions: Array<{ region: string; city: string; state: string; noi_share_pct: number }> }) {
  const maxShare = regions.reduce((m, r) => Math.max(m, r.noi_share_pct), 1);
  return (
    <div className="research-card p-4 sm:p-6">
      <div className="relative" style={{ paddingBottom: '52%' }}>
        <svg viewBox="0 0 100 56" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Stylized US outline */}
          <path
            d="M5,32 L7,22 L13,16 L20,15 L26,18 L34,17 L42,16 L50,15 L58,15 L66,15 L74,16 L80,18 L86,22 L88,28 L86,34 L84,40 L80,46 L74,52 L66,56 L58,56 L50,55 L42,54 L34,52 L26,50 L20,48 L14,46 L9,42 L6,38 Z"
            fill="#f0ead8"
            stroke="#d8d1bf"
            strokeWidth="0.3"
          />
          {/* Texas */}
          <path d="M44,55 L46,68 L52,74 L56,72 L58,64 L56,55 Z" fill="#f0ead8" stroke="#d8d1bf" strokeWidth="0.3" />
          {/* Florida */}
          <path d="M70,56 L74,68 L77,76 L75,80 L72,72 L69,62 Z" fill="#f0ead8" stroke="#d8d1bf" strokeWidth="0.3" />

          {regions.map((r) => {
            const c = METRO_COORDS[r.region];
            if (!c) return null;
            const radius = 1.5 + (r.noi_share_pct / maxShare) * 4.5;
            return (
              <g key={r.region}>
                <circle cx={c[0]} cy={c[1]} r={radius} fill="#c8a951" fillOpacity={0.55} stroke="#1a1f2e" strokeWidth={0.4} />
                <text x={c[0]} y={c[1] - radius - 1.5} textAnchor="middle" fontSize={2.6} fill="#1a1f2e" fontWeight="600" fontFamily="Inter">
                  {r.region}
                </text>
                <text x={c[0]} y={c[1] + radius + 3} textAnchor="middle" fontSize={2} fill="#555c6a" fontFamily="Inter">
                  {r.noi_share_pct.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 text-[11px] text-[var(--ink-soft)] flex flex-wrap gap-x-6 gap-y-1">
        <span><span className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: '#c8a951', opacity: 0.55, border: '1px solid #1a1f2e' }} /> Bubble area, share of portfolio NOI</span>
        <span>Source: fct_property_noi_monthly aggregated by metro</span>
      </div>
    </div>
  );
}
