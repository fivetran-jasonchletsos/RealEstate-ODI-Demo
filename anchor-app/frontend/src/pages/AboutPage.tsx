export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Canonical ODI Story block — verbatim */}
      <section className="research-card p-6 mb-10" style={{ borderColor: 'var(--gold)' }}>
        <div className="eyebrow mb-2" style={{ color: 'var(--gold-dim)' }}>The ODI Story</div>
        <h2 className="font-serif text-2xl tracking-tight text-[var(--ink-strong)]">
          Data infrastructure for agents you trust.
        </h2>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          <em>"MDS was optimized for humans. ODI is designed for a future with humans and
          production agents at scale."</em> This demo is one instance of that architecture:
          Fivetran's 750+ connectors and Managed Data Lake Service (MDLS) land data into open
          table formats; dbt transformations build the governed semantic layer; multiple compute
          engines and AI agents read the same gold tables.
        </p>
        <a
          href="https://fivetran-jasonchletsos.github.io/Fivetran-Demo-Repository/story/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: 'var(--gold-dim)' }}
        >
          Read the full ODI Story
        </a>
      </section>

      <header className="mb-8">
        <div className="eyebrow mb-1">ODI Reference Architecture</div>
        <h1 className="font-serif text-3xl tracking-tight text-[var(--ink-strong)]">About Anchor Properties</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          Anchor Properties is a reference build that demonstrates how a publicly-traded commercial real estate REIT
          can run its investment and asset-management platform on Fivetran's Open Data Infrastructure: Yardi, MRI,
          VTS, Procore, Honeywell BMS, CoStar, RCA, and S&amp;P credit feeds landing into a customer-owned Apache
          Iceberg lake on S3, dbt building the gold marts, and Snowflake serving the workload — with the same
          tables readable by any other engine.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">What this demo shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="research-card p-5">
              <div className="layer-chip gold inline-flex mb-3">{p.tag}</div>
              <h3 className="font-serif text-lg text-[var(--ink-strong)]">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Anchor's portfolio at a glance</h2>
        <div className="research-card p-5">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {PORTFOLIO_FACTS.map((f) => (
              <li key={f.k} className="flex items-start gap-3">
                <div className="layer-chip silver shrink-0 mt-0.5">{f.tag}</div>
                <div className="min-w-0">
                  <div className="font-serif font-semibold text-[var(--ink-strong)]">{f.k}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{f.v}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">Data sources</h2>
        <div className="space-y-3">
          {DATA_SOURCES.map((s) => (
            <article key={s.title} className="research-card p-5">
              <div className="flex items-start gap-3">
                <span className="layer-chip bronze shrink-0">Source</span>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg text-[var(--ink-strong)]">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{s.description}</p>
                  <div className="mt-2 text-xs text-[var(--ink-soft)]">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Provides:</span> {s.provides}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-4">ODI vs MDS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="research-card p-5">
            <div className="eyebrow mb-2">Traditional MDS</div>
            <h3 className="font-serif text-lg text-[var(--ink-strong)]">Warehouse-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
              <li>Single proprietary warehouse owns storage and compute.</li>
              <li>Data exits via expensive egress or replication.</li>
              <li>Compute engine choice locked to vendor roadmap.</li>
              <li>Customer pays for storage twice (lake plus warehouse).</li>
              <li>Schema evolution is vendor-managed.</li>
            </ul>
          </div>
          <div className="research-card p-5" style={{ borderColor: 'var(--gold)' }}>
            <div className="eyebrow mb-2" style={{ color: 'var(--gold-dim)' }}>Open Data Infrastructure</div>
            <h3 className="font-serif text-lg text-[var(--ink-strong)]">Open lake-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <li>Customer owns the storage layer (S3 plus Iceberg).</li>
              <li>Any compute engine — Snowflake, Athena, Trino, Spark, DuckDB.</li>
              <li>Catalog is open (Glue, Nessie, Polaris).</li>
              <li>Pay once for storage; swap compute as workloads evolve.</li>
              <li>Schema evolution is in the Iceberg spec, vendor-neutral.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-sm bg-[var(--paper-deep)] border border-[var(--hairline)] p-5 text-sm text-[var(--ink)]">
        <div className="eyebrow mb-2" style={{ color: 'var(--alert)' }}>Disclaimer</div>
        <p className="text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--ink-strong)]">All data shown is synthetic.</strong>{' '}
          Anchor Properties, tenant names, lease terms, credit signals, and capital-project budgets are invented.
          Nothing on this site constitutes investment advice, an offer to sell, or a solicitation to buy securities.
        </p>
      </section>
    </div>
  );
}

const PILLARS = [
  {
    tag: 'Pillar 1',
    title: 'Customer-owned storage',
    body: 'Every row of rent roll, every Procore cost line, every BMS telemetry reading lands in Anchor\'s S3 bucket as an Apache Iceberg table. Anchor owns the bytes; engines come and go.',
  },
  {
    tag: 'Pillar 2',
    title: 'Open table format',
    body: 'Iceberg v2 provides ACID transactions, schema evolution, time-travel queries, and partition evolution. Yardi added six columns last quarter — the lake absorbed it without a re-load.',
  },
  {
    tag: 'Pillar 3',
    title: 'Any compute engine',
    body: 'Snowflake serves the dashboards. dbt builds the marts. The same parquet files are queryable by Spark for ML and DuckDB on an analyst laptop — no extraction, no duplication.',
  },
];

const PORTFOLIO_FACTS = [
  { tag: 'GAV',    k: '$42B gross asset value', v: '843 properties across 38 US states' },
  { tag: 'Office', k: '480 office properties', v: 'CBD + suburban, mix of Class A and Class B/B+' },
  { tag: 'Indl',   k: '280 industrial / logistics', v: 'Sun Belt distribution corridors and last-mile infill' },
  { tag: 'Multi',  k: '65 multifamily', v: 'Class A urban + suburban garden' },
  { tag: 'MU',     k: '18 mixed-use developments', v: 'Retail-anchored ground-floor with residential above' },
  { tag: 'GLA',    k: '138.4M sqft gross leasable area', v: 'Weighted-average lease term 6.4 years' },
];

const DATA_SOURCES = [
  { title: 'Yardi Voyager',           description: 'Anchor\'s primary property-management and accounting system. Holds the rent roll, general ledger, AP/AR, and lease abstracts for ~85% of the portfolio.',            provides: 'Properties, leases, rent roll, GL postings, AR/AP, lease abstracts' },
  { title: 'MRI Software',            description: 'Legacy property-management platform retained on ~15% of the portfolio (assets acquired from a 2022 corporate carve-out). Will sunset by 2027.',                    provides: 'Properties, leases, rent roll, GL postings on inherited assets' },
  { title: 'VTS',                     description: 'Leasing CRM used by Anchor\'s in-house leasing team and outside brokerage partners. Tracks the full prospect journey: tour, proposal, LOI, executed lease.',         provides: 'Active leasing pipeline, conversion velocity, broker activity, market intel' },
  { title: 'Procore',                 description: 'Construction-management platform for all capital projects above $1M. Holds budgets, change orders, RFIs, cost-to-complete forecasts, and drawing approvals.',        provides: 'Project budgets, spend-to-date, forecast at complete, schedule, change orders' },
  { title: 'Honeywell BMS feeds',     description: 'Building management systems across the office and mixed-use portfolio. Streams chilled-water consumption, electrical sub-metering, occupancy sensors, and air-quality readings.', provides: 'Energy intensity, water use, GHG emissions, tenant-comfort telemetry' },
  { title: 'CoStar + RealCapitalAnalytics', description: 'Third-party market data feeds. CoStar covers rent comparables and supply pipeline; RCA covers transaction comparables and cap-rate trends.',                provides: 'Market rents, supply pipeline, cap rates, comparable transactions' },
  { title: 'S&P Credit Ratings',      description: 'Tenant credit feed from S&P Global Ratings. Daily rating actions, outlook revisions, and credit-watch placements.',                                                 provides: 'Tenant credit ratings, outlook, rating-action history, watchlist flags' },
];
