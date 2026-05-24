import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Three-cluster nav, dark-theme variant (mirrors Clarity / Altavest):
//   1. Persona links (Home + industry pages, flat)
//   2. dbt-Wizard ▾ — narrative dropdown (Overview / Scenario / Live / Outcome)
//   3. ODI ▾ — plumbing dropdown (Architecture / Pipeline / About)
type NavEntry =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'group'; label: string; rootTo: string; matchPrefixes: string[]; children: { to: string; label: string }[] };

const NAV: NavEntry[] = [
  { kind: 'link', to: '/',              label: 'Home' },
  { kind: 'link', to: '/leasing',       label: 'Leasing' },
  { kind: 'link', to: '/tenant-credit', label: 'Tenant Credit' },
  { kind: 'link', to: '/esg',           label: 'Building Performance' },
  { kind: 'link', to: '/comparables',   label: 'Comparables' },
  { kind: 'link', to: '/policy',        label: 'Why ODI' },
  {
    kind: 'group',
    label: 'dbt-Wizard',
    rootTo: '/wizard-live',
    matchPrefixes: ['/scenario', '/wizard-live', '/outcome'],
    children: [
      { to: '/scenario',    label: 'Scenario' },
      { to: '/wizard-live', label: 'Live build' },
      { to: '/outcome',     label: 'Outcome' },
    ],
  },
  {
    kind: 'group',
    label: 'ODI',
    rootTo: '/architecture',
    matchPrefixes: ['/architecture', '/pipeline', '/about'],
    children: [
      { to: '/architecture', label: 'Architecture' },
      { to: '/pipeline',     label: 'Pipeline' },
      { to: '/about',        label: 'About' },
    ],
  },
];

// Flattened version for the mobile grid (dropdown groups become rows of links).
const NAV_FLAT: { to: string; label: string }[] = NAV.flatMap((e) =>
  e.kind === 'link' ? [{ to: e.to, label: e.label }] : e.children,
);

const DEMOS = [
  { key: 'realestate',  name: 'Anchor Properties',  industry: 'Commercial real estate, REIT',          url: 'https://fivetran-jasonchletsos.github.io/RealEstate-ODI-Demo/',   accent: '#c8a951' },
  { key: 'finserv',     name: 'Meridian Capital',   industry: 'Financial services, wealth and banking', url: 'https://fivetran-jasonchletsos.github.io/FinServ-ODI-Demo/',      accent: '#1d4ed8' },
  { key: 'insurance',   name: 'Atlas Risk',         industry: 'Insurance, policies, claims',            url: 'https://fivetran-jasonchletsos.github.io/Insurance-ODI-Demo/',    accent: '#0369a1' },
  { key: 'media',       name: 'Lighthouse Media',   industry: 'Media, audience intelligence',           url: 'https://fivetran-jasonchletsos.github.io/Media-ODI-Demo/',        accent: '#7c3aed' },
  { key: 'retail',      name: 'Storefront',         industry: 'Retail and e-commerce',                  url: 'https://fivetran-jasonchletsos.github.io/RetailEcom-ODI-Demo/',   accent: '#ea580c' },
  { key: 'techsaas',    name: 'SaaS Pulse',         industry: 'Tech, SaaS analytics',                   url: 'https://fivetran-jasonchletsos.github.io/TechSaaS-ODI-Demo/',     accent: '#059669' },
  { key: 'supplychain', name: 'Manifest',           industry: 'Supply chain, logistics',                url: 'https://fivetran-jasonchletsos.github.io/SupplyChain-ODI-Demo/',  accent: '#0891b2' },
  { key: 'lifesci',     name: 'Cohort',             industry: 'Life sciences, clinical research',       url: 'https://fivetran-jasonchletsos.github.io/LifeSci-ODI-Demo/',      accent: '#be185d' },
  { key: 'healthcare',  name: 'Clarity Health',     industry: 'Healthcare, clinical analytics',         url: 'https://fivetran-jasonchletsos.github.io/Healthcare-EPIC-Snowflake-Demo/', accent: '#0d9488' },
];
const CURRENT = 'realestate';

// ─── NavEntryEl — renders a link or a dropdown group (dark theme) ───────────
function NavEntryEl({ entry, pathname }: { entry: NavEntry; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (entry.kind === 'link') {
    return (
      <NavLink
        to={entry.to}
        end={entry.to === '/'}
        className={({ isActive }) =>
          `relative px-2.5 py-2 font-medium tracking-tight transition-colors text-[13px] whitespace-nowrap ${
            isActive ? 'text-[var(--gold-bright)]' : 'text-white/80 hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {entry.label}
            {isActive && (
              <span className="absolute left-2.5 right-2.5 -bottom-[1px] h-[2px]" style={{ background: 'var(--gold)' }} />
            )}
          </>
        )}
      </NavLink>
    );
  }

  const isActive = entry.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative px-2.5 py-2 font-medium tracking-tight transition-colors text-[13px] whitespace-nowrap inline-flex items-center gap-1 ${
          isActive ? 'text-[var(--gold-bright)]' : 'text-white/80 hover:text-white'
        }`}
      >
        {entry.label}
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isActive && (
          <span className="absolute left-2.5 right-5 -bottom-[1px] h-[2px]" style={{ background: 'var(--gold)' }} />
        )}
      </button>
      {open && (
        <span role="menu" className="absolute left-0 top-full mt-1 min-w-[200px] rounded-sm border border-white/15 bg-[var(--midnight-deep)] shadow-xl overflow-hidden z-50">
          {entry.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end={c.to === '/'}
              className={({ isActive: ia }) =>
                `block px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  ia
                    ? 'bg-white/10 text-[var(--gold-bright)]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </span>
      )}
    </span>
  );
}

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <div className="gold-rail" />

      <header className="bg-[var(--midnight)] text-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0 group">
              <div className="h-10 w-10 rounded-sm flex items-center justify-center" style={{ background: 'var(--gold)' }}>
                <AnchorMark className="h-6 w-6 text-[var(--midnight)]" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-serif text-lg sm:text-xl tracking-tight truncate">
                  Anchor Properties
                </div>
                <div className="mt-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--gold-bright)]">
                  Investment and Asset Intelligence
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5 text-sm">
              {NAV.map((entry) => (
                <NavEntryEl key={entry.kind === 'link' ? entry.to : entry.label} entry={entry} pathname={location.pathname} />
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <DemoSwitcher />
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-sm text-white/80 hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileOpen ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden pb-4 border-t border-white/10 pt-3">
              <nav className="grid grid-cols-2 gap-1 text-sm">
                {NAV_FLAT.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-sm text-center font-medium border ${
                        isActive
                          ? 'bg-[var(--gold)] text-[var(--midnight)] border-[var(--gold)]'
                          : 'border-white/15 text-white/80 hover:bg-white/10'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[var(--midnight-deep)] text-white/80 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-sm flex items-center justify-center" style={{ background: 'var(--gold)' }}>
                <AnchorMark className="h-4 w-4 text-[var(--midnight)]" />
              </div>
              <div className="font-serif text-white">Anchor Properties</div>
            </div>
            <p className="leading-relaxed text-white/60">
              Investment and asset intelligence portal built on Fivetran Open Data Infrastructure.
              Synthetic data for ODI architecture demonstration only.
            </p>
          </div>
          <div>
            <div className="eyebrow-light mb-2">Data Pipeline</div>
            <p className="leading-relaxed text-white/70">
              Yardi Voyager, MRI, VTS, Procore, Honeywell BMS, CoStar, S&amp;P feeds. Landed via Fivetran into Apache Iceberg on S3, transformed with dbt across bronze, silver, and gold marts, served from Snowflake.
            </p>
          </div>
          <div>
            <div className="eyebrow-light mb-2">Open Standards</div>
            <p className="leading-relaxed text-white/70">
              Apache Iceberg, AWS Glue Data Catalog, ANSI SQL, dbt semantic layer. Any compute engine. No lock-in.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 text-[11px] text-white/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div>© 2026 Anchor Properties ODI Demo. Fivetran Open Data Infrastructure.</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div>Synthetic data. Fictional REIT.</div>
              <a
                href={`${(import.meta as any).env.BASE_URL?.replace(/\/$/, '')}/Anchor-Properties-3min-Demo-Runbook.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-white/20 text-white/70 hover:border-[var(--gold)]/50 hover:text-[var(--gold-bright)] transition-colors"
              >
                <svg viewBox="0 0 14 14" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 1v9M3 7l4 4 4-4" />
                  <rect x="1" y="11" width="12" height="2" rx="0.5" />
                </svg>
                3-min Runbook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border bg-[var(--gold)]/20 text-[var(--gold-bright)] border-[var(--gold)]/40 hover:bg-[var(--gold)]/30 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-bright)] animate-pulse" />
        Snapshot
        <svg viewBox="0 0 24 24" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-[300px] rounded-sm border border-[var(--hairline)] bg-white shadow-xl z-40 overflow-hidden">
          <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)] border-b border-[var(--hairline)]">
            Switch demo
          </div>
          <div className="py-1 max-h-[60vh] overflow-y-auto">
            {DEMOS.map((d) => {
              const current = d.key === CURRENT;
              const inner = (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.accent }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--ink-strong)] truncate">{d.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{d.industry}</div>
                  </div>
                  {current && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">Current</span>
                  )}
                </div>
              );
              return current ? (
                <div key={d.key} className="opacity-60 cursor-default">{inner}</div>
              ) : (
                <a key={d.key} href={d.url} className="block hover:bg-slate-50 transition-colors" onClick={() => setOpen(false)}>
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AnchorMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3 L20 8 L20 21 L4 21 L4 8 Z" />
      <rect x="8" y="11" width="2.5" height="3" fill="currentColor" stroke="none" />
      <rect x="13.5" y="11" width="2.5" height="3" fill="currentColor" stroke="none" />
      <rect x="8" y="16" width="2.5" height="3" fill="currentColor" stroke="none" />
      <rect x="13.5" y="16" width="2.5" height="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
