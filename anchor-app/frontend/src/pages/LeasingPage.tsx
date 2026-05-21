import { useEffect, useState } from 'react';
import { fetchData, formatCurrencyShort, formatNumber, formatPercent, formatSqft } from '../lib/format';

type Leasing = {
  active_prospects: Array<{
    prospect_id: string; tenant: string; asset_class: string; metro: string; stage: string;
    sqft: number; annual_rent_psf_usd: number; term_yrs: number; days_in_stage: number;
    property_id: string; broker: string;
  }>;
  by_region: Array<{
    metro: string; active_prospects: number; sqft_pipeline: number;
    tour_to_loi_pct: number; loi_to_executed_pct: number; vs_plan_pct: number;
  }>;
  conversion: {
    tour_to_proposal_pct: number;
    proposal_to_loi_pct: number;
    loi_to_executed_pct: number;
    tour_to_executed_pct: number;
    avg_lease_term_yrs: number;
    avg_concession_months: number;
    avg_ti_psf_usd: number;
    by_quarter: Array<{ quarter: string; tour_to_loi_pct: number }>;
  };
  top_expiring_leases: Array<{
    lease_id: string; tenant: string; property_id: string; metro: string;
    sqft: number; annual_rent_usd: number; months_to_expiry: number;
    renewal_probability_pct: number; current_psf_vs_market_pct: number;
  }>;
  velocity_agent_recommendations: Array<{
    property_id: string; property_name: string; metro: string;
    current_asking_psf: number; market_clearing_psf: number; delta_pct: number;
    tour_velocity_30d: number; tour_velocity_market_avg: number;
    recommendation: string; confidence_pct: number;
  }>;
};

export default function LeasingPage() {
  const [data, setData] = useState<Leasing | null>(null);
  useEffect(() => { fetchData<Leasing>('/data/leasing.json').then(setData).catch(() => {}); }, []);

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-20 text-[var(--ink-muted)]">Loading…</div>;

  const totalPipeSqft = data.by_region.reduce((s, r) => s + r.sqft_pipeline, 0);
  const totalActive = data.active_prospects.length;
  const conv = data.conversion;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">Leasing Desk</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          Pipeline, conversion, and the velocity agent
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          VTS streams the pipeline. Snowflake + dbt do the conversion math. The velocity agent reads gold tables to flag mis-priced assets and suggest repositions.
        </p>
      </header>

      {/* Top tiles */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Tile label="Active prospects"       value={formatNumber(totalActive)}              sub="across all stages" />
        <Tile label="Pipeline sqft"          value={formatSqft(totalPipeSqft)}              sub="under negotiation" />
        <Tile label="Tour to executed"       value={formatPercent(conv.tour_to_executed_pct)} sub="trailing 12 mo" />
        <Tile label="Avg lease term"         value={`${conv.avg_lease_term_yrs.toFixed(1)} yrs`} sub={`avg ${conv.avg_concession_months.toFixed(1)} mo free rent`} />
      </section>

      {/* Pipeline by metro */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Pipeline by metro</h2>
        <div className="research-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Metro</th>
                <th className="text-right px-4 py-3">Active prospects</th>
                <th className="text-right px-4 py-3">Pipeline sqft</th>
                <th className="text-right px-4 py-3">Tour → LOI</th>
                <th className="text-right px-4 py-3">LOI → executed</th>
                <th className="text-right px-4 py-3">vs plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {data.by_region.map((r) => (
                <tr key={r.metro}>
                  <td className="px-4 py-3 font-semibold text-[var(--ink-strong)]">{r.metro}</td>
                  <td className="px-4 py-3 text-right tabular">{r.active_prospects}</td>
                  <td className="px-4 py-3 text-right tabular">{formatSqft(r.sqft_pipeline)}</td>
                  <td className="px-4 py-3 text-right tabular">{r.tour_to_loi_pct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right tabular">{r.loi_to_executed_pct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right tabular">
                    <span className={r.vs_plan_pct < -10 ? 'text-[var(--alert)] font-semibold' : r.vs_plan_pct < 0 ? 'text-[var(--caution)] font-semibold' : 'text-[var(--good)] font-semibold'}>
                      {r.vs_plan_pct >= 0 ? '+' : ''}{r.vs_plan_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Velocity Agent */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-5 border-b border-[var(--hairline)] pb-2">
          <h2 className="font-serif text-2xl text-[var(--ink-strong)]">Velocity-agent recommendations</h2>
          <span className="layer-chip gold">gold.fct_below_market_assets_flagged</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.velocity_agent_recommendations.map((r) => (
            <div key={r.property_id} className="research-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="layer-chip silver">{r.metro}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">conf. {r.confidence_pct}%</span>
              </div>
              <div className="font-serif text-lg text-[var(--ink-strong)]">{r.property_name}</div>
              <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">{r.property_id}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Asking</div>
                  <div className="font-bold tabular">${r.current_asking_psf.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Market</div>
                  <div className="font-bold tabular">${r.market_clearing_psf.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Delta</div>
                  <div className={`font-bold tabular ${r.delta_pct > 0 ? 'text-[var(--alert)]' : 'text-[var(--good)]'}`}>
                    {r.delta_pct >= 0 ? '+' : ''}{r.delta_pct.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-[var(--ink-muted)] leading-relaxed">
                <span className="font-semibold text-[var(--ink-strong)]">Tour velocity:</span> {r.tour_velocity_30d}/30d (market avg {r.tour_velocity_market_avg}).
              </div>
              <div className="mt-3 p-3 rounded-sm bg-[var(--gold-bg)] border-l-2 border-[var(--gold)] text-xs text-[var(--ink)] leading-relaxed">
                <div className="eyebrow mb-1">Recommendation</div>
                {r.recommendation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top expiring leases */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Top 20 expiring leases</h2>
        <div className="research-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Tenant</th>
                <th className="text-left px-4 py-3">Property / Metro</th>
                <th className="text-right px-4 py-3">SqFt</th>
                <th className="text-right px-4 py-3">Annual rent</th>
                <th className="text-right px-4 py-3">Months to expiry</th>
                <th className="text-right px-4 py-3">Renewal prob.</th>
                <th className="text-right px-4 py-3">vs market</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {data.top_expiring_leases.map((l) => (
                <tr key={l.lease_id}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--ink-strong)]">{l.tenant}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{l.property_id}, {l.metro}</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatNumber(l.sqft)}</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatCurrencyShort(l.annual_rent_usd)}</td>
                  <td className="px-4 py-2.5 text-right tabular">
                    <span className={l.months_to_expiry <= 6 ? 'text-[var(--alert)] font-semibold' : l.months_to_expiry <= 12 ? 'text-[var(--caution)] font-semibold' : ''}>
                      {l.months_to_expiry}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">{l.renewal_probability_pct}%</td>
                  <td className="px-4 py-2.5 text-right tabular">
                    <span className={l.current_psf_vs_market_pct < -10 ? 'text-[var(--good)] font-semibold' : l.current_psf_vs_market_pct > 5 ? 'text-[var(--alert)] font-semibold' : ''}>
                      {l.current_psf_vs_market_pct >= 0 ? '+' : ''}{l.current_psf_vs_market_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Conversion trend */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="research-card p-5">
          <div className="eyebrow mb-2">Conversion funnel (trailing 12 mo)</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-[var(--ink-muted)]">Tour to proposal</span>
              <span className="font-bold tabular">{conv.tour_to_proposal_pct.toFixed(1)}%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[var(--ink-muted)]">Proposal to LOI</span>
              <span className="font-bold tabular">{conv.proposal_to_loi_pct.toFixed(1)}%</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[var(--ink-muted)]">LOI to executed</span>
              <span className="font-bold tabular">{conv.loi_to_executed_pct.toFixed(1)}%</span>
            </li>
            <li className="flex items-center justify-between border-t border-[var(--hairline-soft)] pt-2 mt-2">
              <span className="font-semibold text-[var(--ink-strong)]">Tour to executed (overall)</span>
              <span className="font-bold tabular text-[var(--gold-dim)]">{conv.tour_to_executed_pct.toFixed(1)}%</span>
            </li>
          </ul>
        </div>
        <div className="research-card p-5">
          <div className="eyebrow mb-2">Tour to LOI by quarter</div>
          <div className="flex items-end justify-around h-32 mt-2 gap-3">
            {conv.by_quarter.map((q) => {
              const h = Math.max(8, q.tour_to_loi_pct * 4);
              return (
                <div key={q.quarter} className="flex flex-col items-center gap-1 flex-1">
                  <div className="text-[10px] tabular font-bold text-[var(--ink-strong)]">{q.tour_to_loi_pct.toFixed(1)}%</div>
                  <div className="w-full rounded-sm" style={{ background: 'var(--gold)', height: `${h}px` }} />
                  <div className="text-[10px] text-[var(--ink-soft)]">{q.quarter}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-[var(--ink-muted)]">
            Trailing four quarters. The decline reflects SF Bay softness and elevated office sublease overhang.
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="research-card px-5 py-4">
      <div className="text-[10.5px] font-semibold text-[var(--ink-soft)] uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 font-serif text-3xl text-[var(--ink-strong)] leading-none tabular">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}
