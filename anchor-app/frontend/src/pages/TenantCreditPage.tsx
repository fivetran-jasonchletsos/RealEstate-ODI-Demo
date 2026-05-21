import { useEffect, useMemo, useState } from 'react';
import { fetchData, formatCurrencyShort, formatNumber } from '../lib/format';

type Tenant = {
  tenant_id: string; name: string; industry: string;
  credit_rating: string; outlook: string;
  pct_of_total_rent: number; annual_rent_usd: number; sqft_leased: number;
  weighted_avg_expiry_yr: number; weighted_avg_expiry_months: number;
  property_count: number; watchlist_flag: boolean;
  news_signals: string[]; recommended_action: string | null;
};
type TC = {
  tenants: Tenant[];
  summary: {
    tenant_count: number; watchlist_count: number;
    ig_share_pct: number; speculative_share_pct: number; unrated_share_pct: number;
    recent_downgrades_30d: number; recent_downgrade_names: string[];
  };
};

const RATING_ORDER = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','NR'];

export default function TenantCreditPage() {
  const [data, setData] = useState<TC | null>(null);
  const [filter, setFilter] = useState<'all' | 'watch'>('all');
  useEffect(() => { fetchData<TC>('/data/tenant_credit.json').then(setData).catch(() => {}); }, []);

  const watchlistTop = useMemo(() => {
    if (!data) return [];
    return data.tenants
      .filter((t) => t.watchlist_flag)
      .sort((a, b) => b.annual_rent_usd - a.annual_rent_usd)
      .slice(0, 20);
  }, [data]);

  const visible = filter === 'watch' ? data?.tenants.filter((t) => t.watchlist_flag) ?? [] : data?.tenants ?? [];

  // Rating histogram
  const histogram = useMemo(() => {
    if (!data) return [] as Array<{ rating: string; share: number }>;
    const map = new Map<string, number>();
    for (const t of data.tenants) {
      map.set(t.credit_rating, (map.get(t.credit_rating) ?? 0) + t.pct_of_total_rent);
    }
    return RATING_ORDER.map((r) => ({ rating: r, share: map.get(r) ?? 0 }));
  }, [data]);

  if (!data) return <div className="mx-auto max-w-7xl px-4 py-20 text-[var(--ink-muted)]">Loading…</div>;

  const s = data.summary;
  const maxBar = histogram.reduce((m, h) => Math.max(m, h.share), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="eyebrow mb-1">Tenant Credit</div>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[var(--ink-strong)]">
          Counterparty quality and watchlist
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          Top 100 tenant credits by rent. S&amp;P rating feed plus public-credit news signals merged into the gold mart. Watchlist updates run hourly.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <Tile label="Tenants tracked"      value={formatNumber(s.tenant_count)}            sub="top 100 by annual rent" />
        <Tile label="Investment grade"     value={`${s.ig_share_pct.toFixed(1)}%`}         sub="BBB- or above" tone="good" />
        <Tile label="Speculative grade"    value={`${s.speculative_share_pct.toFixed(1)}%`} sub="BB+ and below" tone="caution" />
        <Tile label="Watchlist count"      value={formatNumber(s.watchlist_count)}         sub="recommend action" tone="alert" />
      </section>

      {/* Recent downgrades banner */}
      <section className="mb-10 rounded-sm bg-[var(--alert-bg)] border-l-4 p-5" style={{ borderLeftColor: 'var(--alert)' }}>
        <div className="eyebrow mb-1" style={{ color: 'var(--alert)' }}>This week, 3 downgrades</div>
        <div className="font-serif text-lg text-[var(--ink-strong)]">
          {s.recent_downgrade_names.join(', ')}
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">
          S&amp;P revised these credits from BBB- to BB+ within the trailing 30 days. Combined exposure 4.1% of total rent. Recommended action: re-underwrite credit, engage tenant on early renewal with credit enhancement.
        </p>
      </section>

      {/* Rating distribution */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Rating distribution by rent share</h2>
        <div className="research-card p-5">
          <div className="space-y-1.5">
            {histogram.map((h) => (
              <div key={h.rating} className="flex items-center gap-3">
                <div className="w-12 text-[11px] font-mono font-semibold text-[var(--ink-strong)] text-right">{h.rating}</div>
                <div className="flex-1 h-5 bg-[var(--paper-deep)] rounded-sm relative overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(h.share / maxBar) * 100}%`,
                      background: ['BB+','BB','BB-','B+','NR'].includes(h.rating) ? 'var(--alert)' : 'var(--gold)',
                      opacity: 0.85,
                    }}
                  />
                </div>
                <div className="w-16 text-right text-[11px] tabular text-[var(--ink-muted)]">{h.share.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top 20 watchlist */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-[var(--ink-strong)] border-b border-[var(--hairline)] pb-2 mb-5">Top 20 at-risk tenants</h2>
        <div className="space-y-3">
          {watchlistTop.map((t) => (
            <div key={t.tenant_id} className="research-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="status-pill alert">{t.credit_rating}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">{t.outlook}</span>
                  </div>
                  <h3 className="font-serif text-xl text-[var(--ink-strong)] mt-1">{t.name}</h3>
                  <div className="text-[12px] text-[var(--ink-soft)] mt-0.5">{t.industry}, {t.property_count} properties</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Rent / Share</div>
                  <div className="font-serif text-xl text-[var(--ink-strong)] tabular">{formatCurrencyShort(t.annual_rent_usd)}</div>
                  <div className="text-[11px] text-[var(--ink-soft)] tabular">{t.pct_of_total_rent.toFixed(2)}% of total</div>
                </div>
              </div>
              {t.news_signals.length > 0 && (
                <div className="mt-3 text-xs">
                  <div className="eyebrow mb-1">News signals</div>
                  <ul className="text-[var(--ink-muted)] space-y-0.5">
                    {t.news_signals.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
              )}
              {t.recommended_action && (
                <div className="mt-3 p-3 rounded-sm bg-[var(--gold-bg)] border-l-2 border-[var(--gold)] text-xs text-[var(--ink)] leading-relaxed">
                  <div className="eyebrow mb-1">Recommended action</div>
                  {t.recommended_action}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Full table */}
      <section>
        <div className="flex items-end justify-between mb-5 border-b border-[var(--hairline)] pb-2 gap-3">
          <h2 className="font-serif text-2xl text-[var(--ink-strong)]">All tenants</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs rounded-sm border ${filter === 'all' ? 'bg-[var(--midnight)] text-white border-[var(--midnight)]' : 'border-[var(--hairline)] text-[var(--ink-muted)]'}`}
            >All ({data.tenants.length})</button>
            <button
              onClick={() => setFilter('watch')}
              className={`px-3 py-1.5 text-xs rounded-sm border ${filter === 'watch' ? 'bg-[var(--midnight)] text-white border-[var(--midnight)]' : 'border-[var(--hairline)] text-[var(--ink-muted)]'}`}
            >Watchlist ({s.watchlist_count})</button>
          </div>
        </div>
        <div className="research-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper-deep)] text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">
              <tr>
                <th className="text-left px-4 py-3">Tenant</th>
                <th className="text-left px-4 py-3">Industry</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-right px-4 py-3">% of rent</th>
                <th className="text-right px-4 py-3">Annual rent</th>
                <th className="text-right px-4 py-3">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {visible.map((t) => (
                <tr key={t.tenant_id} className={t.watchlist_flag ? 'bg-[var(--alert-bg)]/40' : ''}>
                  <td className="px-4 py-2.5 font-semibold text-[var(--ink-strong)]">{t.name}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{t.industry}</td>
                  <td className="px-4 py-2.5 font-mono">{t.credit_rating}</td>
                  <td className="px-4 py-2.5 text-right tabular">{t.pct_of_total_rent.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatCurrencyShort(t.annual_rent_usd)}</td>
                  <td className="px-4 py-2.5 text-right tabular text-[var(--ink-muted)]">{t.weighted_avg_expiry_yr}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
