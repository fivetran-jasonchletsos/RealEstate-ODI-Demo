import { useEffect, useState } from 'react';
import { fetchData, formatBytes, formatNumber } from '../lib/format';

// Fivetran connector IDs map to https://fivetran.com/dashboard/connectors/<fivetran_id>
const FIVETRAN_IDS: Record<string, string> = {
  'yardi-voyager':        'yardi_voyager_anchor',
  'mri-software':         'mri_software_anchor',
  'vts':                  'vts_anchor',
  'procore':              'procore_anchor',
  'honeywell-bms':        'honeywell_bms_anchor',
  'costar':               'costar_anchor',
  'real-capital-analytics': 'rca_anchor',
  'sp-credit':            'sp_credit_anchor',
};

function fivetranUrl(connectorId: string): string {
  const fid = FIVETRAN_IDS[connectorId] ?? connectorId;
  return `https://fivetran.com/dashboard/connectors/${fid}`;
}

type Connector = {
  id: string; name: string; category: string; status: 'ok' | 'warn' | 'fail';
  rows_last_sync: number; last_sync_at: string; lag_minutes: number; freshness_sla_minutes: number;
  warn_note?: string;
};
type Layer = {
  layer: string; rows_in: number; rows_out: number; tables: number;
  last_run: string; status: string; owner: string;
};
type Pipeline = {
  connectors: Connector[];
  layers: Layer[];
  failure_simulator: {
    title: string;
    description: string;
    scenarios: Array<{ id: string; label: string; blast_radius: string; expected_recovery: string }>;
  };
};

type Iceberg = {
  tables: Array<{
    database: string; table: string; rows: number; bytes: number; partitions: string[];
    source_system: string; last_updated_at: string; schema_columns: number;
  }>;
};

export default function PipelinePage() {
  const [data, setData] = useState<Pipeline | null>(null);
  const [iceberg, setIceberg] = useState<Iceberg | null>(null);
  const [simRunning, setSimRunning] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<string | null>(null);

  useEffect(() => {
    fetchData<Pipeline>('/data/pipeline.json').then(setData).catch(() => {});
    fetchData<Iceberg>('/data/iceberg.json').then(setIceberg).catch(() => {});
  }, []);

  const runSim = (id: string, recovery: string) => {
    setSimRunning(id);
    setSimResult(null);
    setTimeout(() => {
      setSimRunning(null);
      setSimResult(`Drill complete. ${recovery}.`);
    }, 1400);
  };

  const dbLayers = ['bronze', 'silver', 'gold'] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">Pipeline Operations</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          Connector status, lineage, drills
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Eight Fivetran connectors land Anchor's source systems into Iceberg on S3 every 5 to 60 minutes. dbt builds the silver and gold marts. Snowflake serves the read workload.
        </p>
      </header>

      {/* Connector status */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Connectors</h2>
        <div className="research-card no-lift overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Fivetran ID</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-right px-4 py-3">Rows last sync</th>
                <th className="text-right px-4 py-3">Lag</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">SLA</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {data?.connectors.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold text-[var(--ink-strong)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] font-mono text-[11px] hidden md:table-cell">
                    {FIVETRAN_IDS[c.id] ?? c.id}
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-muted)] hidden sm:table-cell">{c.category}</td>
                  <td className="px-4 py-3 text-right tabular">{formatNumber(c.rows_last_sync)}</td>
                  <td className="px-4 py-3 text-right tabular">{c.lag_minutes} min</td>
                  <td className="px-4 py-3 text-right tabular text-[var(--ink-soft)] hidden sm:table-cell">{c.freshness_sla_minutes} min</td>
                  <td className="px-4 py-3">
                    <span className={`status-pill ${c.status === 'ok' ? 'good' : c.status === 'warn' ? 'caution' : 'alert'}`}>
                      {c.status}
                    </span>
                    {c.warn_note && <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{c.warn_note}</div>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <a
                      href={fivetranUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--gold-dim)] hover:text-[var(--gold)] transition-colors uppercase tracking-wider"
                    >
                      Open in Fivetran
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[11px] text-[var(--ink-soft)] flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Managed ingest layer: <strong>Fivetran</strong></span>
          <span className="text-[var(--hairline)]">|</span>
          <a
            href="https://fivetran.com/dashboard/connectors"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--gold-dim)] hover:text-[var(--gold)] uppercase tracking-wider transition-colors"
          >
            Open all connectors in Fivetran
            <svg viewBox="0 0 24 24" className="h-3 w-3 inline ml-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
            </svg>
          </a>
        </div>
      </section>

      {/* dbt layers */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Four-layer pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {data?.layers.map((l, i) => (
            <div key={l.layer} className="research-card p-5">
              <div className="text-[10px] font-mono tracking-wider text-[var(--ink-soft)] font-bold">{String(i + 1).padStart(2, '0')}</div>
              <div className="mt-1 font-serif text-xl text-[var(--ink-strong)] capitalize">{l.layer}</div>
              <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{l.owner}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Rows in</div>
                  <div className="font-bold text-[var(--ink-strong)] tabular">{formatNumber(l.rows_in)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Rows out</div>
                  <div className="font-bold text-[var(--ink-strong)] tabular">{formatNumber(l.rows_out)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Tables</div>
                  <div className="font-bold text-[var(--ink-strong)] tabular">{l.tables}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Status</div>
                  <span className={`status-pill ${l.status === 'ok' ? 'good' : 'caution'}`}>{l.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Iceberg tables */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Iceberg tables</h2>
        {dbLayers.map((layerName) => {
          const tables = iceberg?.tables.filter((t) => t.database === layerName) ?? [];
          return (
            <div key={layerName} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className={`layer-chip ${layerName}`}>{layerName}</span>
                <span className="text-xs text-[var(--ink-soft)]">{tables.length} tables</span>
              </div>
              <div className="research-card no-lift overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
                    <tr>
                      <th className="text-left px-4 py-2.5">Table</th>
                      <th className="text-left px-4 py-2.5">Source</th>
                      <th className="text-right px-4 py-2.5">Rows</th>
                      <th className="text-right px-4 py-2.5">Size</th>
                      <th className="text-right px-4 py-2.5">Cols</th>
                      <th className="text-left px-4 py-2.5">Partitions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline-soft)] font-mono text-[12px]">
                    {tables.map((t) => (
                      <tr key={t.table}>
                        <td className="px-4 py-2 text-[var(--ink-strong)]">{t.table}</td>
                        <td className="px-4 py-2 text-[var(--ink-muted)]">{t.source_system}</td>
                        <td className="px-4 py-2 text-right tabular">{formatNumber(t.rows)}</td>
                        <td className="px-4 py-2 text-right tabular">{formatBytes(t.bytes)}</td>
                        <td className="px-4 py-2 text-right tabular">{t.schema_columns}</td>
                        <td className="px-4 py-2 text-[var(--ink-muted)]">{t.partitions.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>

      {/* Failure simulator */}
      <section>
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Failure-drill simulator</h2>
        <div className="research-card p-5 mb-3">
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{data?.failure_simulator.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.failure_simulator.scenarios.map((s) => (
            <div key={s.id} className="research-card p-5">
              <div className="font-serif text-base text-[var(--ink-strong)]">{s.label}</div>
              <div className="mt-2 text-xs text-[var(--ink-muted)]">
                <div><span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--ink-soft)]">Blast radius:</span> {s.blast_radius}</div>
                <div className="mt-1"><span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--ink-soft)]">Expected recovery:</span> {s.expected_recovery}</div>
              </div>
              <button
                onClick={() => runSim(s.id, s.expected_recovery)}
                disabled={simRunning !== null}
                className="mt-3 inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-semibold text-[var(--midnight)] disabled:opacity-50"
                style={{ background: 'var(--gold)' }}
              >
                {simRunning === s.id ? 'Running…' : 'Run drill'}
              </button>
            </div>
          ))}
        </div>
        {simResult && (
          <div className="mt-4 research-card p-4 border-l-4" style={{ borderLeftColor: 'var(--good)' }}>
            <div className="eyebrow mb-1" style={{ color: 'var(--good)' }}>Drill output</div>
            <div className="text-sm text-[var(--ink)]">{simResult}</div>
          </div>
        )}
      </section>
    </div>
  );
}
