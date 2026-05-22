// Comparable-listings similarity engine for Anchor Properties.
//
// Computes a top-K nearest-neighbor list for each property using CRE comp
// dimensions: asset class, metro (submarket), size band, cap-rate band,
// and vintage band.  Mirrors what a Cortex embedding pipeline would produce
// in production — the math runs locally so the static site ships the
// deal network without a runtime API.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Property = {
  property_id: string;
  name: string;
  asset_class: string;   // office | industrial | multifamily | mixed_use
  metro_code: string;    // e.g. "NYC", "CHI"
  city: string;
  state: string;
  gla_sqft: number;
  noi_ytd_usd: number;
  occupancy_pct: number;
  walt_yrs: number;
  rolling_expiry_24m_pct: number;
  value_psf_usd: number;
  cap_rate_pct: number;
  yield_on_cost_pct: number;
  watchlist_flag: boolean;
};

export type ComparableNeighbor = {
  property_id: string;
  property: Property;
  score: number;    // 0..1
  why: string;      // human-readable comp rationale
};

// ---------------------------------------------------------------------------
// Weights  (property type + submarket highest, then size/price, then vintage)
// ---------------------------------------------------------------------------
const W_ASSET_CLASS = 1.4;
const W_METRO       = 1.2;
const W_SIZE_BAND   = 0.7;
const W_CAP_BAND    = 0.5;
const W_VINTAGE_EST = 0.2;   // estimated from value_psf as proxy (no year_built in data)

const K = 8; // neighbors per property

// ---------------------------------------------------------------------------
// Band helpers
// ---------------------------------------------------------------------------
function sizeBand(sqft: number): string {
  if (sqft < 300_000) return "sub-300k";
  if (sqft < 500_000) return "300k-500k";
  if (sqft < 750_000) return "500k-750k";
  if (sqft < 1_000_000) return "750k-1M";
  return "1M+";
}

function capBand(cap: number): string {
  if (cap < 5.0) return "sub-5";
  if (cap < 5.75) return "5-5.75";
  if (cap < 6.5) return "5.75-6.5";
  if (cap < 7.0) return "6.5-7";
  return "7+";
}

// value_psf as a very rough vintage/quality proxy
function valueBand(psf: number): string {
  if (psf < 300) return "value";
  if (psf < 500) return "core-plus";
  if (psf < 700) return "core";
  return "trophy";
}

// ---------------------------------------------------------------------------
// Pairwise score
// ---------------------------------------------------------------------------
function pairScore(a: Property, b: Property): { score: number; why: string } {
  const assetMatch = a.asset_class === b.asset_class ? 1 : 0;
  const metroMatch = a.metro_code === b.metro_code ? 1 : 0;
  const sizeMatch  = sizeBand(a.gla_sqft) === sizeBand(b.gla_sqft) ? 1 : 0;
  const capMatch   = capBand(a.cap_rate_pct) === capBand(b.cap_rate_pct) ? 1 : 0;
  const valMatch   = valueBand(a.value_psf_usd) === valueBand(b.value_psf_usd) ? 1 : 0;

  const raw =
    W_ASSET_CLASS * assetMatch +
    W_METRO       * metroMatch +
    W_SIZE_BAND   * sizeMatch  +
    W_CAP_BAND    * capMatch   +
    W_VINTAGE_EST * valMatch;

  const maxRaw = W_ASSET_CLASS + W_METRO + W_SIZE_BAND + W_CAP_BAND + W_VINTAGE_EST;
  const score = raw / maxRaw;

  // Generate a terse "why" label for the strongest match dimension
  let why = "Similar profile";
  if (assetMatch && metroMatch) {
    why = `${assetClassLabel(a.asset_class)}, ${a.metro_code} market`;
  } else if (assetMatch) {
    why = `Same asset class: ${assetClassLabel(a.asset_class)}`;
  } else if (metroMatch) {
    why = `Same metro: ${a.metro_code}`;
  } else if (sizeMatch && capMatch) {
    why = `${sizeBand(a.gla_sqft)} sqft, ${capBand(a.cap_rate_pct)}% cap band`;
  } else if (sizeMatch) {
    why = `Similar size: ${sizeBand(a.gla_sqft)} sqft`;
  } else if (capMatch) {
    why = `Cap rate band: ${capBand(a.cap_rate_pct)}%`;
  }

  return { score, why };
}

function assetClassLabel(cls: string): string {
  const labels: Record<string, string> = {
    office:     "Office",
    industrial: "Industrial",
    multifamily: "Multifamily",
    mixed_use:  "Mixed Use",
  };
  return labels[cls] ?? cls;
}

// ---------------------------------------------------------------------------
// Top-K neighbor cache
// ---------------------------------------------------------------------------
let _cache: Map<string, ComparableNeighbor[]> | null = null;
let _props: Property[] = [];

function build(properties: Property[]): Map<string, ComparableNeighbor[]> {
  const result = new Map<string, ComparableNeighbor[]>();

  for (let i = 0; i < properties.length; i++) {
    const a = properties[i];
    const scored: (ComparableNeighbor & { _raw: number })[] = [];

    for (let j = 0; j < properties.length; j++) {
      if (i === j) continue;
      const b = properties[j];
      const { score, why } = pairScore(a, b);
      if (score <= 0) continue;
      scored.push({
        property_id: b.property_id,
        property: b,
        score,
        why,
        _raw: score,
      });
    }

    scored.sort((x, y) => y._raw - x._raw);

    const final: ComparableNeighbor[] = scored.slice(0, K).map(({ property_id, property, score, why }) => ({
      property_id,
      property,
      score,
      why,
    }));

    result.set(a.property_id, final);
  }

  return result;
}

export function initComparables(properties: Property[]): void {
  _props = properties;
  _cache = null; // reset so next call to comparablesFor rebuilds
}

export function comparablesFor(propertyId: string): ComparableNeighbor[] {
  if (!_cache) _cache = build(_props);
  return _cache.get(propertyId) ?? [];
}

export function allProperties(): Property[] {
  return _props;
}

// Build the graph edges for the force-directed network (undirected union of top-K)
export type GraphNode = {
  id: string;
  label: string;
  assetClass: string;
  metro: string;
  score?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  score: number;
};

export function buildComparableGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!_cache) _cache = build(_props);

  const nodes: GraphNode[] = _props.map((p) => ({
    id: p.property_id,
    label: p.name,
    assetClass: p.asset_class,
    metro: p.metro_code,
  }));

  const edgeSet = new Map<string, GraphEdge>();
  for (const [pid, neighbors] of _cache.entries()) {
    for (const nb of neighbors) {
      const key = [pid, nb.property_id].sort().join("||");
      if (!edgeSet.has(key)) {
        edgeSet.set(key, { source: pid, target: nb.property_id, score: nb.score });
      }
    }
  }

  return { nodes, edges: Array.from(edgeSet.values()) };
}

export function assetClassColor(cls: string): string {
  const colors: Record<string, string> = {
    office:      "#c8a951",  // gold
    industrial:  "#1a5b69",  // teal
    multifamily: "#16613f",  // green
    mixed_use:   "#8b5a1d",  // bronze
  };
  return colors[cls] ?? "#555c6a";
}

export { assetClassLabel };
