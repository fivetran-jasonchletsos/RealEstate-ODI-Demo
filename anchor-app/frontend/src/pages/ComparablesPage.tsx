import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  initComparables,
  buildComparableGraph,
  comparablesFor,
  assetClassColor,
  assetClassLabel,
  type GraphNode,
  type GraphEdge,
  type Property,
  type ComparableNeighbor,
} from '../lib/related';
import { fetchData, formatPercent, formatSqft } from '../lib/format';

type PortfolioData = { top_properties: Property[] };

// ---------------------------------------------------------------------------
// Force simulation (no external dependency)
// ---------------------------------------------------------------------------
type Vec2 = { x: number; y: number };

function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  onTick: (positions: Vec2[]) => void,
  onDone: (positions: Vec2[]) => void
) {
  const n = nodes.length;
  const pos: Vec2[] = nodes.map(() => ({
    x: width / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.55,
    y: height / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.55,
  }));
  const vel: Vec2[] = nodes.map(() => ({ x: 0, y: 0 }));

  const idToIdx = new Map(nodes.map((nd, i) => [nd.id, i]));
  const adjMap = new Map<string, { target: number; score: number }[]>();
  for (const e of edges) {
    const si = idToIdx.get(e.source);
    const ti = idToIdx.get(e.target);
    if (si == null || ti == null) continue;
    if (!adjMap.has(e.source)) adjMap.set(e.source, []);
    if (!adjMap.has(e.target)) adjMap.set(e.target, []);
    adjMap.get(e.source)!.push({ target: ti, score: e.score });
    adjMap.get(e.target)!.push({ target: si, score: e.score });
  }

  const REPEL   = 4000;
  const SPRING  = 0.035;
  const REST    = 140;
  const CENTER  = 0.006;
  const DAMP    = 0.82;

  let alpha = 1.0;
  let frame = 0;
  let rafId: number;

  function tick() {
    alpha *= 0.992;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < n; i++) {
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist2 = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(dist2);
        fx += (dx / dist) * REPEL / dist2;
        fy += (dy / dist) * REPEL / dist2;
      }

      for (const { target: j, score } of (adjMap.get(nodes[i].id) ?? [])) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const stretch = dist - REST * (1 - score * 0.3);
        fx += (dx / dist) * SPRING * stretch;
        fy += (dy / dist) * SPRING * stretch;
      }

      fx += (cx - pos[i].x) * CENTER;
      fy += (cy - pos[i].y) * CENTER;

      vel[i].x = (vel[i].x + fx * alpha) * DAMP;
      vel[i].y = (vel[i].y + fy * alpha) * DAMP;
      pos[i].x = Math.max(20, Math.min(width - 20, pos[i].x + vel[i].x));
      pos[i].y = Math.max(20, Math.min(height - 20, pos[i].y + vel[i].y));
    }

    frame++;
    if (frame % 4 === 0) onTick([...pos.map(p => ({ ...p }))]);

    if (alpha > 0.01 && frame < 600) {
      rafId = requestAnimationFrame(tick);
    } else {
      onDone([...pos.map(p => ({ ...p }))]);
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------
const NODE_R     = 7;
const NODE_R_SEL = 12;
const NODE_R_HOV = 10;

function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  positions: Vec2[],
  idToIdx: Map<string, number>,
  selectedId: string | null,
  hoveredId: string | null,
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#11141e";
  ctx.fillRect(0, 0, W, H);

  // Edges
  for (const e of edges) {
    const si = idToIdx.get(e.source);
    const ti = idToIdx.get(e.target);
    if (si == null || ti == null) continue;
    const sp = positions[si];
    const tp = positions[ti];
    if (!sp || !tp) continue;

    const highlighted =
      e.source === selectedId || e.target === selectedId ||
      e.source === hoveredId  || e.target === hoveredId;

    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(tp.x, tp.y);
    if (highlighted) {
      ctx.strokeStyle = `rgba(200,169,81,${0.2 + e.score * 0.5})`;
      ctx.lineWidth = 1 + e.score * 2;
    } else {
      ctx.strokeStyle = `rgba(200,169,81,${0.02 + e.score * 0.06})`;
      ctx.lineWidth = 0.4 + e.score * 0.8;
    }
    ctx.stroke();
  }

  // Nodes — normal first, then selected/hovered on top
  const special = new Set([selectedId, hoveredId].filter(Boolean) as string[]);

  function drawNode(node: GraphNode, i: number) {
    const p = positions[i];
    if (!p) return;
    const isSel = node.id === selectedId;
    const isHov = node.id === hoveredId;
    const r = isSel ? NODE_R_SEL : isHov ? NODE_R_HOV : NODE_R;
    const color = assetClassColor(node.assetClass);

    if (isSel) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,169,81,0.15)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSel
      ? "#c8a951"
      : isHov
      ? "rgba(245,241,232,0.7)"
      : `rgba(245,241,232,0.18)`;
    ctx.lineWidth = isSel ? 2 : 1;
    ctx.stroke();

    if (isSel || isHov) {
      const label = node.label.length > 28 ? node.label.slice(0, 26) + "…" : node.label;
      ctx.font = `600 10px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isSel ? "#c8a951" : "#f5f1e8";
      ctx.textAlign = "center";
      ctx.fillText(label, p.x, p.y + r + 14);
      ctx.font = `9px 'JetBrains Mono', monospace`;
      ctx.fillStyle = "rgba(245,241,232,0.45)";
      ctx.fillText(node.metro, p.x, p.y + r + 25);
    }
  }

  nodes.forEach((node, i) => { if (!special.has(node.id)) drawNode(node, i); });
  nodes.forEach((node, i) => { if (special.has(node.id))  drawNode(node, i); });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ComparablesPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef<Vec2[]>([]);
  const [positions, setPositions] = useState<Vec2[]>([]);
  const [simDone, setSimDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const rafRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });

  useEffect(() => {
    fetchData<PortfolioData>('/data/portfolio.json').then((d) => {
      initComparables(d.top_properties);
      setGraphData(buildComparableGraph());
      setLoaded(true);
    }).catch(() => {});
  }, []);

  const { nodes, edges } = graphData;
  const idToIdx = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);

  const [size, setSize] = useState({ w: 900, h: 660 });
  useEffect(() => {
    function measure() {
      const el = canvasRef.current?.parentElement;
      if (el) setSize({ w: el.clientWidth, h: Math.min(el.clientWidth * 0.72, 660) });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!loaded || nodes.length === 0 || size.w < 100) return;
    setSimDone(false);
    const cleanup = runSimulation(
      nodes, edges, size.w, size.h,
      (pos) => { posRef.current = pos; setPositions([...pos]); },
      (pos) => { posRef.current = pos; setPositions([...pos]); setSimDone(true); }
    );
    return cleanup;
  }, [loaded, nodes, edges, size.w, size.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || posRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width  = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    cancelAnimationFrame(rafRef.current);

    function frame() {
      if (!ctx || !canvas) return;
      const dpr2 = window.devicePixelRatio || 1;
      const logW = canvas.width / dpr2;
      const logH = canvas.height / dpr2;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr2, dpr2);
      ctx.fillStyle = "#11141e";
      ctx.fillRect(0, 0, logW, logH);

      ctx.translate(transform.x + logW / 2, transform.y + logH / 2);
      ctx.scale(transform.scale, transform.scale);
      ctx.translate(-logW / 2, -logH / 2);

      // draw onto a same-size scratch canvas at logical resolution
      const scratch = document.createElement("canvas");
      scratch.width  = logW;
      scratch.height = logH;
      const sCtx = scratch.getContext("2d")!;
      drawGraph(sCtx, nodes, edges, posRef.current, idToIdx, selectedId, hoveredId);
      ctx.drawImage(scratch, 0, 0);

      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [positions, selectedId, hoveredId, transform, size, nodes, edges, idToIdx]);

  function toCanvas(clientX: number, clientY: number, canvas: HTMLCanvasElement): Vec2 {
    const rect = canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const cx = size.w / 2;
    const cy = size.h / 2;
    return {
      x: (lx - cx - transform.x) / transform.scale + cx,
      y: (ly - cy - transform.y) / transform.scale + cy,
    };
  }

  function nearestNode(cx: number, cy: number): GraphNode | null {
    let best: GraphNode | null = null;
    let bestDist = 22;
    posRef.current.forEach((p, i) => {
      if (!p) return;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < bestDist) { bestDist = d; best = nodes[i]; }
    });
    return best;
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragging.current) {
      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      setTransform(t => ({ ...t, x: dragging.current!.tx + dx, y: dragging.current!.ty + dy }));
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toCanvas(e.clientX, e.clientY, canvas);
    const node = nearestNode(x, y);
    setHoveredId(node?.id ?? null);
    canvas.style.cursor = node ? "pointer" : "grab";
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragging.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const moved = dragging.current
      ? Math.hypot(e.clientX - dragging.current.startX, e.clientY - dragging.current.startY) > 4
      : false;
    dragging.current = null;
    if (!moved) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = toCanvas(e.clientX, e.clientY, canvas);
      const node = nearestNode(x, y);
      setSelectedId(node?.id ?? null);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(t => ({ ...t, scale: Math.max(0.3, Math.min(4, t.scale * factor)) }));
  }

  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const selectedNeighbors = selectedId ? comparablesFor(selectedId) : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--midnight-deep)', color: 'var(--paper)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid rgba(200,169,81,0.15)' }} className="px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow-light mb-2">Comparable Listings Network</div>
            <h1 className="font-serif text-3xl sm:text-4xl" style={{ color: 'var(--paper)' }}>
              Deal Comparables
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,241,232,0.5)' }}>
              {nodes.length} properties, {edges.length} comp edges. Weighted by asset class, metro,
              size band, and cap-rate band. Top-{8} comps per asset.
            </p>
          </div>
          <div
            className="font-mono text-right"
            style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,241,232,0.3)' }}
          >
            Drag to pan, scroll to zoom, click any node
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex-1 min-w-0 relative" style={{ background: '#11141e', minHeight: `${size.h}px` }}>
          <canvas
            ref={canvasRef}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={() => { setHoveredId(null); dragging.current = null; }}
            onWheel={onWheel}
            style={{ display: 'block', cursor: 'grab', userSelect: 'none' }}
          />
          {(!simDone && loaded) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="font-mono text-xs uppercase" style={{ letterSpacing: '0.3em', color: 'rgba(200,169,81,0.5)' }}>
                Calculating comp network...
              </p>
            </div>
          )}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="font-mono text-xs uppercase" style={{ letterSpacing: '0.3em', color: 'rgba(200,169,81,0.5)' }}>
                Loading portfolio data...
              </p>
            </div>
          )}
          {/* Asset class legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-x-4 gap-y-1.5 max-w-xs">
            {[
              ['office',      'Office'],
              ['industrial',  'Industrial'],
              ['multifamily', 'Multifamily'],
              ['mixed_use',   'Mixed Use'],
            ].map(([cls, label]) => (
              <span key={cls} className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded-full"
                  style={{ width: 8, height: 8, background: assetClassColor(cls) }}
                />
                <span
                  className="font-mono"
                  style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(245,241,232,0.4)' }}
                >
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <aside
          className="w-full lg:w-80 flex-none overflow-y-auto"
          style={{
            borderLeft: '1px solid rgba(200,169,81,0.12)',
            borderTop: '1px solid rgba(200,169,81,0.12)',
            maxHeight: `${size.h + 80}px`,
            background: '#11141e',
          }}
        >
          {selectedNode ? (
            <SelectedPanel
              node={selectedNode}
              neighbors={selectedNeighbors}
              onSelect={setSelectedId}
              onNavigate={(id) => navigate(`/property/${id}`)}
              nodeCount={nodes.length}
              edgeCount={edges.length}
            />
          ) : (
            <DefaultPanel nodeCount={nodes.length} edgeCount={edges.length} />
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-panel sub-components
// ---------------------------------------------------------------------------
function DefaultPanel({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <p
        className="font-mono"
        style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(245,241,232,0.38)' }}
      >
        Click any node to explore
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,241,232,0.55)' }}>
        Every property in the portfolio is a node. Edges connect the strongest
        CRE comps based on asset class, metro, size band, and cap-rate band.
        Clusters form by property type and geography. Drag to pan, scroll to zoom.
      </p>
      <p
        className="font-mono mt-2"
        style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(245,241,232,0.28)' }}
      >
        {nodeCount} properties, {edgeCount} comp edges
      </p>
      <div style={{ borderTop: '1px solid rgba(200,169,81,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,241,232,0.35)' }}>
          Similarity computed from{' '}
          <span style={{ color: 'var(--gold)' }}>CORTEX.COMPLETE</span> tag-vector
          overlap across asset class (1.4x), metro (1.2x), size band (0.7x), cap-rate
          band (0.5x), and value tier (0.2x). Top-8 comps per asset, undirected union.
        </p>
      </div>
    </div>
  );
}

function SelectedPanel({
  node,
  neighbors,
  onSelect,
  onNavigate,
  nodeCount,
  edgeCount,
}: {
  node: GraphNode;
  neighbors: ComparableNeighbor[];
  onSelect: (id: string) => void;
  onNavigate: (id: string) => void;
  nodeCount: number;
  edgeCount: number;
}) {
  const prop = neighbors[0]?.property; // use first neighbor's data to backfill node's own property
  // Find the property itself from neighbors' source knowledge:
  // The node itself isn't stored in GraphNode, but we know its id/label/assetClass/metro
  return (
    <div className="p-5">
      {/* Title */}
      <div
        className="inline-block font-mono mb-1"
        style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--gold)' }}
      >
        {assetClassLabel(node.assetClass)}
      </div>
      <h2 className="font-serif text-lg leading-snug" style={{ color: 'var(--paper)' }}>
        {node.label}
      </h2>
      <p
        className="font-mono mt-1"
        style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(245,241,232,0.45)' }}
      >
        {node.metro} metro
      </p>

      {/* View detail link */}
      <button
        onClick={() => onNavigate(node.id)}
        className="mt-3 font-mono text-xs uppercase border px-3 py-1.5 transition-colors"
        style={{
          letterSpacing: '0.22em',
          color: 'var(--gold)',
          borderColor: 'rgba(200,169,81,0.4)',
          background: 'transparent',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,169,81,0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        View property detail
      </button>

      {/* Comparable listings */}
      <div style={{ borderTop: '1px solid rgba(200,169,81,0.12)', marginTop: '1.25rem', paddingTop: '1rem' }}>
        <p
          className="font-mono"
          style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.28em', color: 'rgba(245,241,232,0.38)' }}
        >
          Top comps
        </p>
        <ol className="mt-2 space-y-1">
          {neighbors.map((nb) => (
            <li key={nb.property_id}>
              <button
                onClick={() => onSelect(nb.property_id)}
                className="w-full text-left px-2 py-2 transition-colors"
                style={{ borderLeft: '2px solid rgba(200,169,81,0.15)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderLeftColor = 'var(--gold)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,169,81,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderLeftColor = 'rgba(200,169,81,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-serif text-sm truncate" style={{ color: 'var(--paper)' }}>
                    {nb.property.name}
                  </span>
                  <span
                    className="font-mono flex-none"
                    style={{ fontSize: '0.6rem', color: 'var(--gold)' }}
                  >
                    {Math.round(nb.score * 100)}%
                  </span>
                </div>
                <p
                  className="font-mono truncate mt-0.5"
                  style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(245,241,232,0.38)' }}
                >
                  {nb.property.metro_code}, {assetClassLabel(nb.property.asset_class)}, {formatSqft(nb.property.gla_sqft)}
                </p>
                <p
                  className="font-mono truncate mt-0.5"
                  style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(245,241,232,0.5)' }}
                >
                  {nb.why}
                </p>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* Cortex note */}
      <div style={{ borderTop: '1px solid rgba(200,169,81,0.1)', marginTop: '1.25rem', paddingTop: '1rem' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(245,241,232,0.3)' }}>
          Comps scored via{' '}
          <span style={{ color: 'var(--gold)' }}>CORTEX.COMPLETE</span> tag-vector
          similarity. {nodeCount} assets, {edgeCount} edges.
        </p>
      </div>
    </div>
  );
}
