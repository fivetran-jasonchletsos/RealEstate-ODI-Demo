// Anchor Properties — Open Data Infrastructure architecture page.
//
// Ported from Clarity Health to give Anchor the same medallion / multi-engine
// hero. Industry-flavoured for CRE / REIT: Lease Mgmt (SQL Server) + Yardi
// Financials (Oracle) + Building IoT stream + SEC quarterly REIT filings.
// Snowflake is primary; Athena/DuckDB/Trino/Spark stay listed as same open-lake
// reads.

import { Link } from 'react-router-dom';
import { AliveMedallion, type SourceNode, type EngineNode } from '../components/AliveMedallion';
import ProductStageRail from '../components/ProductStageRail';

// ─── Source data wired into AliveMedallion ──────────────────────────────────

const CRE_SOURCES: SourceNode[] = [
  { id: 'lease', label: 'Lease Management',   sub: 'SQL Server log-CDC',     logo: 'sqlserver', freshness: '44s lag',   status: 'healthy' },
  { id: 'fin',   label: 'Yardi Financials',   sub: 'Oracle LogMiner',         logo: 'oracle',    freshness: '2 min lag', status: 'healthy' },
  { id: 'iot',   label: 'Building IoT',       sub: 'Sensor stream',           logo: 'hl7',       freshness: 'live',      status: 'healthy', streaming: true },
  { id: 'sec',   label: 'SEC Filings',        sub: 'Quarterly REIT reports',  logo: 'sec',       freshness: '7d lag',    status: 'healthy' },
];

const CRE_ENGINES: EngineNode[] = [
  { name: 'Snowflake', active: true, logo: 'snowflake' },
  { name: 'Athena',                  logo: 'athena' },
  { name: 'DuckDB',                  logo: 'duckdb' },
  { name: 'Trino',                   logo: 'trino' },
  { name: 'Spark',                   logo: 'spark' },
];

const CRE_ROLES = [
  { label: 'Asset Mgrs',         sub: 'NOI & occupancy' },
  { label: 'Leasing',            sub: 'pipeline & TI' },
  { label: 'Property Ops',       sub: 'maintenance & ESG' },
  { label: 'Investor Relations', sub: 'REIT reporting' },
];

// Approximate per-layer stats — sourced from the same Iceberg catalog
// surfaced in the lower-page table sections. Numbers chosen to match a $42B
// 8-source CRE portfolio at roughly current Anchor scale.
const LAYER_STATS = {
  bronze: { tables: 8, rows: 41_840_000, bytes: 14_200_000_000 },
  silver: { tables: 6, rows: 18_640_000, bytes:  7_410_000_000 },
  gold:   { tables: 7, rows:  6_420_000, bytes:  2_120_000_000 },
};

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">ODI Reference Architecture</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          The Anchor data platform
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Eight source systems land into one open lake. dbt builds bronze, silver, and gold marts.
          Snowflake serves the dashboards — but the same tables are queryable by any engine, today and tomorrow.
        </p>
      </header>

      {/* ── Data Flow diagram — the AliveMedallion hero ────────────────────── */}
      <section className="mb-12">
        <div className="research-card p-6 sm:p-8">
          <div className="eyebrow mb-1">Data Flow</div>
          <h2 className="font-serif text-2xl text-[var(--ink-strong)] mb-6">
            From eight source systems to one governed gold layer
          </h2>

          <ProductStageRail accent="#0e7490" />

          <AliveMedallion
            sources={CRE_SOURCES}
            bronze={LAYER_STATS.bronze}
            silver={LAYER_STATS.silver}
            gold={LAYER_STATS.gold}
            engines={CRE_ENGINES}
            roles={CRE_ROLES}
            accent="#c8a951"
          />
        </div>
      </section>

      {/* ── Source detail ──────────────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SOURCES.map((s) => (
            <div key={s.name} className="research-card p-5">
              <div className="layer-chip bronze inline-flex mb-3">Source</div>
              <h3 className="font-serif text-lg text-[var(--ink-strong)]">{s.name}</h3>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)] leading-relaxed">{s.note}</p>
              <div className="mt-3 text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
                {s.tables} tables, {s.cadence}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline diagram (kept — narrative complement to medallion) */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Lineage</h2>
        <div className="research-card p-6 overflow-x-auto">
          <div className="flex items-stretch gap-3 min-w-[1000px]">
            {LINEAGE.map((l, i) => (
              <div key={l.title} className="flex items-center gap-3 flex-1">
                <div className={`flex-1 rounded-sm p-4 border ${l.accent}`} style={{ minHeight: 150 }}>
                  <div className="text-[10px] font-mono font-bold tracking-wider text-[var(--ink-soft)]">{l.tag}</div>
                  <div className="font-serif text-lg text-[var(--ink-strong)] mt-1">{l.title}</div>
                  <div className="text-xs text-[var(--ink-muted)] mt-2 leading-relaxed">{l.detail}</div>
                  <div className="mt-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-soft)]">{l.tech}</div>
                </div>
                {i < LINEAGE.length - 1 && (
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--gold)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* dbt layers */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">dbt model layers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LAYERS.map((l) => (
            <div key={l.layer} className="research-card p-5">
              <div className={`layer-chip ${l.chip} inline-flex mb-3`}>{l.layer}</div>
              <h3 className="font-serif text-lg text-[var(--ink-strong)]">{l.title}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{l.detail}</p>
              <ul className="mt-3 text-[12px] text-[var(--ink)] space-y-1 font-mono">
                {l.tables.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Destination */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Destination</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="research-card p-5">
            <div className="eyebrow mb-2">Storage</div>
            <h3 className="font-serif text-lg text-[var(--ink-strong)]">Apache Iceberg on S3</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
              <code>s3://anchor-odi-lake/{`{bronze,silver,gold}`}/</code>. Iceberg v2 with parquet ZSTD compression and Glue catalog. Time-travel enabled with 30-day retention.
            </p>
          </div>
          <div className="research-card p-5" style={{ borderColor: 'var(--gold)' }}>
            <div className="eyebrow mb-2" style={{ color: 'var(--gold-dim)' }}>Compute</div>
            <h3 className="font-serif text-lg text-[var(--ink-strong)]">Snowflake — primary serving engine</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
              Snowflake reads Iceberg tables via external volumes. dbt-snowflake builds gold marts. The same tables are simultaneously queryable by Athena, Trino, Spark, and DuckDB without copy.
            </p>
          </div>
        </div>
      </section>

      {/* ── Activations — NewCo native reverse-ETL, right after Transformations ── */}
      <ActivationsPanel />

      <section className="rounded-sm bg-[var(--midnight)] text-white p-6">
        <div className="eyebrow-light mb-2">Why this matters for a REIT</div>
        <p className="font-serif text-xl leading-snug">
          A $42B portfolio cannot afford to be locked into one compute vendor for the next decade.
          ODI gives Anchor control over storage, cost, and the engines that will run on top of the lake — including the AI agents that come next.
        </p>
      </section>
    </div>
  );
}

// =============================================================================
// ActivationsPanel — the gold layer doesn't just get queried, it gets acted on.
// Trigger: S&P downgrade/watchlist + lease expiry <180d + 3%+ of building NOI,
// joined nightly on fct_tenant_credit_risk. Destination: VTS, the leasing CRM.
// =============================================================================
function ActivationsPanel() {
  const TRIGGER = "A tenant record in the gold layer flips to high_priority_renewal_risk = true when three conditions join: an S&P credit-rating downgrade or watchlist placement, lease expiry within 180 days (fct_lease_expiry_profile), and the tenant represents 3%+ of that building's NOI (fct_property_noi_monthly) — computed nightly on fct_tenant_credit_risk.";
  const DESTINATION = 'VTS · Tenant, Lease, Deal, Task custom fields';
  const OUTCOME = "Leasing reps get a 164-day head start on renewal conversations for tenants who are both credit-downgraded and lease-expiring, instead of finding out at the next quarterly portfolio review — protecting the same $14M in at-risk NOI already flagged on the Investment Committee dashboard, and cutting time-to-outreach from a 45–60 day manual report cycle to same-day.";

  return (
    <section className="mb-12">
      <div className="research-card overflow-hidden">
        <header className="flex items-start justify-between gap-4 p-6 border-b border-[var(--hairline)]">
          <div>
            <div className="eyebrow" style={{ color: '#0e7490' }}>Activations · NewCo</div>
            <h2 className="font-serif text-2xl text-[var(--ink-strong)] mt-0.5">
              The gold layer doesn't just get queried. It gets acted on.
            </h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)] max-w-3xl leading-relaxed">
              Activations is the fourth native stage in NewCo, immediately after Transformations. It
              reads straight from the same Iceberg gold tables dbt just built and syncs the result to
              an operational system of record &mdash; no separate reverse-ETL vendor, no second copy of the
              data, no second connector to maintain.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0" style={{ background: '#0e7490' }}>
            Activations
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-2">Trigger · gold layer</div>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{TRIGGER}</p>
          </div>
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-2">Destination</div>
            <p className="text-sm text-[var(--ink)] leading-relaxed font-mono">{DESTINATION}</p>
          </div>
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-2">Outcome</div>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{OUTCOME}</p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[var(--hairline-soft)] flex items-center justify-between text-[11px] text-[var(--ink-soft)]" style={{ background: 'var(--paper-deep)' }}>
          <span>Connections &rarr; Destinations &rarr; Transformations &rarr; <strong style={{ color: '#0e7490' }}>Activations</strong> &middot; one platform, one lineage graph</span>
          <Link to="/activations-live" className="uppercase tracking-wider font-semibold hover:underline" style={{ color: '#0e7490' }}>
            Watch it sync &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

const SOURCES = [
  { name: 'Yardi Voyager',          note: 'Property mgmt + accounting. Rent roll, GL, AR/AP, lease abstracts.',  tables: '64', cadence: '15-min CDC' },
  { name: 'MRI Software',           note: 'Legacy property mgmt on ~15% of portfolio. Sunset by 2027.',          tables: '38', cadence: '60-min CDC' },
  { name: 'VTS',                    note: 'Leasing CRM. Prospects, tours, LOIs, executed leases, broker intel.', tables: '24', cadence: '15-min API' },
  { name: 'Procore',                note: 'Capital projects. Budgets, spend-to-date, forecast complete.',        tables: '31', cadence: '60-min API' },
  { name: 'Honeywell BMS',          note: 'Building telemetry. Energy, water, comfort sensors, air quality.',    tables: '12', cadence: 'Streaming, 5-min buffer' },
  { name: 'CoStar',                 note: 'Market data. Rent comps, supply pipeline, submarket fundamentals.',   tables: '28', cadence: 'Daily file' },
  { name: 'Real Capital Analytics', note: 'Transaction comps and cap-rate trends by metro and asset class.',     tables: '36', cadence: 'Daily file' },
  { name: 'S&P Credit Ratings',     note: 'Tenant credit feed. Rating actions, outlook, watchlist placements.',  tables: '14', cadence: 'Real-time push' },
];

const LINEAGE = [
  { tag: '01', title: 'Sources',   detail: '8 systems, 247 source tables. Yardi, MRI, VTS, Procore, BMS, CoStar, RCA, S&P.', tech: 'SaaS APIs + streaming', accent: 'border-[var(--hairline)] bg-[var(--paper)]' },
  { tag: '02', title: 'Fivetran',  detail: 'Managed ingest + Connector SDK for BMS streams. Schema evolution, exactly-once semantics, CDC.', tech: 'Fivetran', accent: 'border-[var(--gold)] bg-[var(--gold-bg)]' },
  { tag: '03', title: 'Iceberg',   detail: 'Bronze layer in Anchor\'s S3 bucket. Iceberg v2, parquet ZSTD, Glue catalog. ACID + time-travel.', tech: 'S3 + Glue', accent: 'border-[var(--hairline)] bg-[var(--paper)]' },
  { tag: '04', title: 'dbt',       detail: 'Silver (conformed, deduped, history-built) and gold (business-ready facts and dimensions).', tech: 'dbt-snowflake', accent: 'border-[var(--hairline)] bg-[var(--paper)]' },
  { tag: '05', title: 'Snowflake', detail: 'Primary serving engine. Reads gold Iceberg tables via external volumes. Same tables queryable by other engines.', tech: 'Snowflake + Iceberg', accent: 'border-[var(--gold)] bg-[var(--gold-bg)]' },
];

const LAYERS = [
  { layer: 'bronze', chip: 'bronze', title: 'Raw, replicated',     detail: 'Source-shaped tables, append-only, partitioned by ingest date. No transforms — full fidelity for replay.', tables: ['yardi_voyager_rentroll_raw','procore_cost_raw','honeywell_bms_telemetry_raw','sp_credit_actions_raw'] },
  { layer: 'silver', chip: 'silver', title: 'Conformed, deduped',  detail: 'Cross-source entity resolution (Yardi + MRI -> stg_properties). SCD2 history on leases and tenants.',          tables: ['stg_properties','stg_leases','stg_rentroll_monthly','stg_capex_projects','stg_bms_hourly','stg_tenant_credit'] },
  { layer: 'gold',   chip: 'gold',   title: 'Business-ready marts', detail: 'NOI by property, lease expiry profile, tenant credit risk, leasing-pipeline velocity, ESG emissions.',         tables: ['fct_property_noi_monthly','fct_lease_expiry_profile','fct_tenant_credit_risk','fct_leasing_pipeline_velocity','fct_capex_project_status','fct_building_performance_daily','fct_below_market_assets_flagged'] },
];
