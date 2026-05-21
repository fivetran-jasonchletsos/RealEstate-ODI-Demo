import { useEffect, useMemo, useState } from 'react';
import { fetchData, formatNumber } from '../lib/format';

type Building = {
  property_id: string; name: string; asset_class: string; metro: string;
  energy_intensity_kwh_per_sqft: number; water_use_gal_per_sqft: number;
  ghg_kgco2e_per_sqft: number; energy_star_score: number | null;
  leed_rating: string; breeam_rating: string | null;
  tenant_comfort_index: number; local_law_97_at_risk: boolean;
  bms_telemetry_status: string;
};
type ESG = {
  buildings: Building[];
  portfolio_totals: {
    avg_energy_intensity_kwh_per_sqft: number;
    avg_ghg_kgco2e_per_sqft: number;
    leed_certified_pct: number;
    energy_star_avg: number;
    scope_1_2_emissions_kt_co2e: number;
    scope_1_2_emissions_prior_yr_kt_co2e: number;
    emissions_reduction_yoy_pct: number;
    ll97_at_risk_assets: number;
    ll97_estimated_annual_penalty_usd: number;
    ll97_mitigation_capex_usd: number;
  };
  ghg_by_class: Array<{ asset_class: string; kgco2e_per_sqft: number }>;
  regulator_lens: {
    summary: string;
    regimes: Array<{
      name: string; scope: string; binding_year: number;
      anchor_assets_in_scope: number; current_compliance_pct: number;
      estimated_2030_capex_usd: number;
    }>;
  };
};

export default function ESGPage() {
  const [data, setData] = useState<ESG | null>(null);
  useEffect(() => { fetchData<ESG>('/data/building_performance.json').then(setData).catch(() => {}); }, []);

  const worst = useMemo(() => {
    if (!data) return [];
    return [...data.buildings].sort((a, b) => b.ghg_kgco2e_per_sqft - a.ghg_kgco2e_per_sqft).slice(0, 10);
  }, [data]);

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-20 text-[var(--ink-muted)]">Loading…</div>;
  const t = data.portfolio_totals;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">Building Performance & ESG</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          Energy, water, emissions, certifications
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Honeywell BMS streams telemetry from 600+ assets in 5-minute buckets. dbt computes daily and monthly performance rollups against ESG targets, LEED criteria, and local emission caps.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Tile label="Scope 1+2 emissions"        value={`${t.scope_1_2_emissions_kt_co2e.toFixed(1)} kt CO₂e`} sub={`vs ${t.scope_1_2_emissions_prior_yr_kt_co2e.toFixed(1)} prior yr`} tone="good" />
        <Tile label="Emissions YoY"              value={`${t.emissions_reduction_yoy_pct.toFixed(1)}%`}        sub="trailing 12 months" tone="good" />
        <Tile label="LEED certified portfolio"   value={`${t.leed_certified_pct.toFixed(0)}%`}                 sub="of assets" />
        <Tile label="Avg Energy Star score"      value={t.energy_star_avg.toFixed(0)}                          sub="rated assets only" />
        <Tile label="Avg energy intensity"       value={`${t.avg_energy_intensity_kwh_per_sqft.toFixed(1)}`}   sub="kWh / sqft / yr" />
        <Tile label="Avg GHG intensity"          value={`${t.avg_ghg_kgco2e_per_sqft.toFixed(1)}`}             sub="kg CO₂e / sqft / yr" />
        <Tile label="LL97 at-risk assets"        value={String(t.ll97_at_risk_assets)}                          sub="NYC, 2024 compliance year" tone="alert" />
        <Tile label="LL97 mitigation capex"      value={`$${(t.ll97_mitigation_capex_usd / 1_000_000).toFixed(0)}M`} sub="committed through 2030" />
      </section>

      {/* Regulatory regimes */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-2">Regulator lens</h2>
        <p className="text-sm text-[var(--ink-muted)] leading-relaxed mb-5 max-w-3xl">{data.regulator_lens.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.regulator_lens.regimes.map((r) => (
            <div key={r.name} className="research-card p-5">
              <div className="font-serif text-lg text-[var(--ink-strong)]">{r.name}</div>
              <div className="text-[12px] text-[var(--ink-soft)] mt-1">{r.scope}, binding {r.binding_year}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">In scope</div>
                  <div className="font-bold tabular">{r.anchor_assets_in_scope} assets</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Compliant</div>
                  <div className={`font-bold tabular ${r.current_compliance_pct < 85 ? 'text-[var(--caution)]' : 'text-[var(--good)]'}`}>
                    {r.current_compliance_pct}%
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Est. 2030 capex</div>
                  <div className="font-bold tabular">${(r.estimated_2030_capex_usd / 1_000_000).toFixed(0)}M</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GHG by class */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">GHG intensity by asset class</h2>
        <div className="research-card p-5">
          <div className="space-y-2">
            {data.ghg_by_class.map((g) => {
              const max = data.ghg_by_class.reduce((m, x) => Math.max(m, x.kgco2e_per_sqft), 1);
              return (
                <div key={g.asset_class} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-[var(--ink-muted)] capitalize">{g.asset_class.replace('_', ' ')}</div>
                  <div className="flex-1 h-6 bg-[var(--paper-deep)] rounded-sm overflow-hidden">
                    <div className="h-full" style={{ width: `${(g.kgco2e_per_sqft / max) * 100}%`, background: 'var(--midnight)' }} />
                  </div>
                  <div className="w-24 text-right text-sm tabular font-semibold text-[var(--ink-strong)]">{g.kgco2e_per_sqft.toFixed(1)} kg/sqft</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Worst-performers list */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Highest GHG intensity, 10 assets</h2>
        <div className="research-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Property</th>
                <th className="text-left px-4 py-3">Class / Metro</th>
                <th className="text-right px-4 py-3">Energy</th>
                <th className="text-right px-4 py-3">Water</th>
                <th className="text-right px-4 py-3">GHG</th>
                <th className="text-left px-4 py-3">Energy Star</th>
                <th className="text-left px-4 py-3">LEED</th>
                <th className="text-left px-4 py-3">BMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {worst.map((b) => (
                <tr key={b.property_id} className={b.local_law_97_at_risk ? 'bg-[var(--alert-bg)]/40' : ''}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--ink-strong)]">{b.property_id}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{b.asset_class}, {b.metro}</td>
                  <td className="px-4 py-2.5 text-right tabular">{b.energy_intensity_kwh_per_sqft.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right tabular">{b.water_use_gal_per_sqft.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right tabular font-semibold">{b.ghg_kgco2e_per_sqft.toFixed(1)}</td>
                  <td className="px-4 py-2.5 tabular">{b.energy_star_score ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{b.leed_rating}</td>
                  <td className="px-4 py-2.5">
                    <span className={`status-pill ${b.bms_telemetry_status === 'streaming' ? 'good' : b.bms_telemetry_status === 'intermittent' ? 'caution' : 'alert'}`}>
                      {b.bms_telemetry_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[11px] text-[var(--ink-soft)]">
          Energy in kWh/sqft/yr. Water in gal/sqft/yr. GHG in kg CO₂e/sqft/yr. Highlighted rows are at risk under NYC Local Law 97 emission caps. Total assets streaming: {formatNumber(data.buildings.length)}.
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'good' | 'alert' | 'caution' }) {
  const color =
    tone === 'good' ? 'var(--good)' :
    tone === 'alert' ? 'var(--alert)' :
    tone === 'caution' ? 'var(--caution)' :
    'var(--ink-strong)';
  return (
    <div className="research-card px-5 py-4">
      <div className="text-[10.5px] font-semibold text-[var(--ink-soft)] uppercase tracking-[0.08em]">{label}</div>
      <div className="mt-1 font-serif text-3xl leading-none tabular" style={{ color }}>{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}
