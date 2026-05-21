export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">Position Paper</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          Why CRE data is fragmented — and how ODI bridges it
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          A brief on the structural reasons commercial real-estate data lives in eight systems and ten thousand spreadsheets, and what an open lake unlocks for the investment platform.
        </p>
      </header>

      <section className="research-card p-6 mb-8">
        <div className="eyebrow mb-2">The problem</div>
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] mb-4">Eight systems of record, none of them is the truth</h2>
        <div className="space-y-3 text-[var(--ink)] leading-relaxed text-[15px]">
          <p>
            A $42B REIT does not have a data problem. It has a system-of-record problem. Yardi owns the rent roll for 85% of the portfolio. MRI owns it for the other 15% — assets inherited from a 2022 carve-out that still cannot be migrated because the operating partner won't sign off on retraining. VTS owns the leasing pipeline. Procore owns the construction budget. Honeywell BMS owns the meters. CoStar and Real Capital Analytics own the market context. S&amp;P owns the credit feed.
          </p>
          <p>
            Each system is the source of truth for its domain. None of them is the source of truth for the asset. The asset only exists in the union — and the union is currently a brittle network of Excel exports, SFTP drops, monthly close meetings, and one analyst who knows where every CSV lives.
          </p>
          <p>
            Asset management bridges this with shadow systems. Every desk runs its own pipeline workbook. The lease abstracter keeps a Google Sheet of expiries. The capex PM keeps a Smartsheet that diverges from Procore by the second week of every project. The CIO's morning brief is the product of three analysts reconciling the same numbers from three sources at 5am.
          </p>
        </div>
      </section>

      <section className="research-card p-6 mb-8" style={{ borderColor: 'var(--gold)' }}>
        <div className="eyebrow mb-2" style={{ color: 'var(--gold-dim)' }}>The thesis</div>
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] mb-4">The asset is the data. The data is the strategy.</h2>
        <div className="space-y-3 text-[var(--ink)] leading-relaxed text-[15px]">
          <p>
            An investment platform makes decisions on one thing: the joined view across rent, market, cost, credit, and physical performance. That joined view does not exist in any single source. It can only exist in a layer above the sources.
          </p>
          <p>
            ODI proposes that the layer above the sources is not another vendor warehouse. It is an <em>open lake</em> the REIT owns. Fivetran lands every source into Iceberg on S3. dbt builds the conformed silver and gold marts. Snowflake serves the dashboards today; Spark serves the ML team; an AI agent reads the same gold tables next quarter — no copies, no extracts, no warehouse tax on every new use case.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">What changes for the asset-management organization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANGES.map((c) => (
            <div key={c.title} className="research-card p-5">
              <div className="layer-chip gold inline-flex mb-3">{c.tag}</div>
              <h3 className="font-serif text-lg text-[var(--ink-strong)]">{c.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Why open table format matters specifically for CRE</h2>
        <div className="space-y-3 text-[var(--ink)] leading-relaxed text-[15px]">
          <p>
            CRE data evolves. Yardi adds columns. Tenant industries get reclassified. Lease abstracts get re-coded when a new lease accountant inherits the file. Procore renames cost categories on every new project template.
          </p>
          <p>
            Apache Iceberg handles schema evolution natively. A new column added to Yardi's rent roll appears in the bronze table without a re-load. dbt picks it up next run. The downstream marts surface the change. This is not a luxury — it is the difference between a quarterly close that lands on time and one that doesn't.
          </p>
        </div>
      </section>

      <section className="rounded-sm bg-[var(--midnight)] text-white p-6">
        <div className="eyebrow-light mb-2">The bottom line</div>
        <p className="font-serif text-xl leading-snug">
          The IC opens the morning brief at 7am. The brief renders against gold marts built six hours earlier from Yardi, MRI, VTS, Procore, BMS, CoStar, RCA, and S&amp;P — landed, conformed, governed, and ready. No analyst reconciles spreadsheets at 5am. The investment platform finally has one lens on every asset.
        </p>
      </section>
    </div>
  );
}

const CHANGES = [
  { tag: 'Before',  title: 'Three analysts reconcile rent + market + cost at 5am', body: 'Spreadsheets cycle through email. Numbers diverge by Tuesday. The IC packet is a compromise of three versions of the truth.' },
  { tag: 'After',   title: 'The packet renders from the gold mart', body: 'fct_property_noi_monthly joined to fct_market_cap_rates joined to fct_capex_project_status. One query, one set of numbers, one provenance chain.' },
  { tag: 'Before',  title: 'Leasing-pipeline visibility lags two weeks', body: 'VTS reports run on Friday. Asset management gets the rollup the next Tuesday. By then the deal is colder.' },
  { tag: 'After',   title: 'VTS streams every 15 minutes; the velocity agent flags misprices the same day', body: 'Tour velocity, conversion, and submarket clearing rates are joined in the gold mart. The agent recommends a reprice with confidence before the broker calls.' },
  { tag: 'Before',  title: 'Capex variance shows up at month-end close', body: 'Project accounting closes the books, the variance lands four weeks late, the budget is already blown.' },
  { tag: 'After',   title: 'Procore cost feed surfaces variance in 60-min increments', body: 'Forecast-at-complete updates daily. Amber flags hit the dashboard the same week a scope expands. Six-week lead time over traditional close.' },
];
