import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  initComparables,
  comparablesFor,
  assetClassColor,
  assetClassLabel,
  type Property,
  type ComparableNeighbor,
} from '../lib/related';
import { fetchData, formatCurrencyShort, formatPercent, formatSqft } from '../lib/format';

type PortfolioData = { top_properties: Property[] };

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchData<PortfolioData>('/data/portfolio.json').then((d) => {
      initComparables(d.top_properties);
      setProperties(d.top_properties);
      setLoaded(true);
    }).catch(() => {});
  }, []);

  const property = properties.find(p => p.property_id === id);
  const comps: ComparableNeighbor[] = loaded && id ? comparablesFor(id) : [];

  if (!loaded) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20" style={{ color: 'var(--ink-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <p style={{ color: 'var(--ink-muted)' }}>Property not found: {id}</p>
        <button
          onClick={() => navigate('/leasing')}
          className="mt-4 font-mono text-xs uppercase border px-3 py-1.5"
          style={{ letterSpacing: '0.2em', color: 'var(--gold-dim)', borderColor: 'var(--hairline)' }}
        >
          Back to leasing desk
        </button>
      </div>
    );
  }

  const acColor = assetClassColor(property.asset_class);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 font-mono text-xs uppercase" style={{ letterSpacing: '0.18em', color: 'var(--ink-soft)' }}>
        <Link to="/" className="hover:underline" style={{ color: 'var(--gold-dim)' }}>Home</Link>
        <span>/</span>
        <Link to="/leasing" className="hover:underline" style={{ color: 'var(--gold-dim)' }}>Leasing</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-muted)' }}>{property.property_id}</span>
      </nav>

      {/* Property header */}
      <header className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--hairline)' }}>
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="h-12 w-12 rounded-sm flex-none flex items-center justify-center font-serif text-lg"
            style={{ background: acColor, color: '#fff' }}
          >
            {assetClassLabel(property.asset_class).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="eyebrow mb-1" style={{ color: 'var(--gold-dim)' }}>
              {assetClassLabel(property.asset_class)}, {property.city}, {property.state}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight" style={{ color: 'var(--ink-strong)' }}>
              {property.name}
            </h1>
            <p className="font-mono text-xs mt-1 uppercase" style={{ letterSpacing: '0.18em', color: 'var(--ink-soft)' }}>
              {property.property_id}, {property.metro_code} metro
            </p>
          </div>
          {property.watchlist_flag && (
            <span className="status-pill caution ml-auto">Watchlist</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: property metrics */}
        <div className="xl:col-span-2 space-y-8">
          {/* Key metrics */}
          <section className="research-card overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--hairline-soft)', background: 'var(--paper-deep)' }}>
              <div className="eyebrow" style={{ color: 'var(--gold-dim)' }}>Investment Metrics</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              <Metric label="GLA" value={formatSqft(property.gla_sqft)} />
              <Metric label="NOI YTD" value={formatCurrencyShort(property.noi_ytd_usd)} />
              <Metric label="Occupancy" value={formatPercent(property.occupancy_pct)} tone={property.occupancy_pct >= 90 ? 'good' : 'caution'} />
              <Metric label="Cap Rate" value={formatPercent(property.cap_rate_pct)} />
              <Metric label="Yield on Cost" value={formatPercent(property.yield_on_cost_pct)} />
              <Metric label="WALT" value={`${property.walt_yrs.toFixed(1)} yrs`} />
              <Metric label="Value / PSF" value={`$${property.value_psf_usd.toFixed(0)}`} />
              <Metric label="Rolling Expiry 24m" value={formatPercent(property.rolling_expiry_24m_pct)} tone={property.rolling_expiry_24m_pct > 20 ? 'caution' : undefined} />
            </div>
          </section>

          {/* CTA back to comparables network */}
          <div
            className="research-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="flex-1">
              <div className="eyebrow mb-1">Comparable Listings Network</div>
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                View this property in the full portfolio comp network — force-directed
                graph of all {properties.length} assets by similarity.
              </p>
            </div>
            <Link
              to="/comparables"
              className="inline-block font-mono text-xs uppercase border px-4 py-2 whitespace-nowrap transition-colors"
              style={{ letterSpacing: '0.2em', color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}
            >
              Open network view
            </Link>
          </div>
        </div>

        {/* Right: comparable listings panel */}
        <aside className="xl:col-span-1">
          <div className="research-card overflow-hidden sticky top-24">
            <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--hairline-soft)', background: 'var(--paper-deep)' }}>
              <div className="eyebrow" style={{ color: 'var(--gold-dim)' }}>Comparable Listings</div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                Top {comps.length} comps by asset class, metro, size, and cap-rate band
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--hairline-soft)' }}>
              {comps.map((nb) => (
                <Link
                  key={nb.property_id}
                  to={`/property/${nb.property_id}`}
                  className="block px-4 py-3 hover:bg-[var(--paper-deep)] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-2 w-2 rounded-full flex-none mt-1"
                        style={{ background: assetClassColor(nb.property.asset_class) }}
                      />
                      <div className="min-w-0">
                        <div
                          className="font-serif text-sm leading-snug truncate group-hover:text-[var(--gold-dim)] transition-colors"
                          style={{ color: 'var(--ink-strong)' }}
                        >
                          {nb.property.name}
                        </div>
                        <div
                          className="font-mono text-xs mt-0.5 truncate"
                          style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--ink-soft)' }}
                        >
                          {nb.property.metro_code}, {assetClassLabel(nb.property.asset_class)}, {formatSqft(nb.property.gla_sqft)}
                        </div>
                        <div
                          className="font-mono mt-0.5 truncate"
                          style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink-muted)' }}
                        >
                          {nb.why}
                        </div>
                      </div>
                    </div>
                    <div className="flex-none text-right">
                      <span
                        className="font-mono"
                        style={{ fontSize: '0.7rem', color: 'var(--gold-dim)', letterSpacing: '0.05em' }}
                      >
                        {Math.round(nb.score * 100)}%
                      </span>
                      <div
                        className="font-mono"
                        style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--ink-soft)', marginTop: 2 }}
                      >
                        sim
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {comps.length === 0 && (
                <div className="px-4 py-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
                  No comparables found.
                </div>
              )}
            </div>
            <div
              className="px-5 py-3 font-mono text-xs"
              style={{
                borderTop: '1px solid var(--hairline-soft)',
                background: 'var(--paper-deep)',
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--ink-soft)',
              }}
            >
              Scored via Snowflake on the dbt-governed gold layer
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'caution' | 'alert';
}) {
  const color =
    tone === 'good'    ? 'var(--good)'    :
    tone === 'caution' ? 'var(--caution)' :
    tone === 'alert'   ? 'var(--alert)'   :
    'var(--ink-strong)';
  return (
    <div className="px-4 py-4" style={{ borderColor: 'var(--hairline-soft)' }}>
      <div
        className="font-mono text-xs mb-1 uppercase"
        style={{ letterSpacing: '0.12em', color: 'var(--ink-soft)', fontSize: '0.6rem' }}
      >
        {label}
      </div>
      <div className="font-serif text-xl leading-none tabular" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
