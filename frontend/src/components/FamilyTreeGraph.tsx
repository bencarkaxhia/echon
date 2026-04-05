/**
 * Family Tree Graph - Dagre-powered auto-layout
 * Shows ALL members and ALL relationships, auto-positioned by generation.
 *
 * PATH: echon/frontend/src/components/FamilyTreeGraph.tsx
 */

import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
  NodeMouseHandler,
  Handle,
  Position,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { FamilyTree } from '../lib/api';
import { getMediaUrl } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FamilyTreeGraphProps {
  tree: FamilyTree;
  currentUserId: string;
  onNodeClick?: (nodeId: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_W = 130;
const NODE_H = 110;

// Which types make person_a the PARENT of person_b
const PARENT_TYPES = new Set([
  'father', 'mother', 'parent',
  'grandfather', 'grandmother', 'grandparent',
  'step_father', 'step_mother', 'adopted_parent',
]);

// Which types make person_a the CHILD of person_b
const CHILD_TYPES = new Set([
  'son', 'daughter', 'child',
  'grandson', 'granddaughter', 'grandchild',
  'step_son', 'step_daughter', 'adopted_child',
]);

const SPOUSE_TYPES  = new Set(['husband', 'wife', 'spouse']);

const EDGE_COLORS: Record<string, string> = {
  parent:   '#10B981', father:   '#10B981', mother:   '#10B981',
  grandparent: '#059669', grandfather: '#059669', grandmother: '#059669',
  child:    '#3B82F6', son:      '#3B82F6', daughter: '#3B82F6',
  grandchild: '#2563EB', grandson: '#2563EB', granddaughter: '#2563EB',
  sibling:  '#F59E0B', brother:  '#F59E0B', sister:   '#F59E0B',
  spouse:   '#EC4899', husband:  '#EC4899', wife:     '#EC4899',
};

// ─── Dagre layout ────────────────────────────────────────────────────────────

function buildLayout(tree: FamilyTree): { nodes: Node[]; edges: Edge[] } {
  if (!tree?.nodes?.length) return { nodes: [], edges: [] };

  // 1. Deduplicate edges: one per unordered pair, preferring specific over generic
  const edgeMap = new Map<string, typeof tree.edges[number]>();
  const SPECIFICITY: Record<string, number> = {
    father: 10, mother: 10, son: 10, daughter: 10,
    grandfather: 10, grandmother: 10, grandson: 10, granddaughter: 10,
    husband: 10, wife: 10, brother: 10, sister: 10,
    step_father: 8, step_mother: 8, step_son: 8, step_daughter: 8,
    step_brother: 8, step_sister: 8,
    parent: 5, child: 5, sibling: 5, spouse: 5,
    grandparent: 5, grandchild: 5, half_sibling: 5,
    adopted_parent: 5, adopted_child: 5,
  };

  for (const edge of tree.edges) {
    const a = String(edge.person_a_id);
    const b = String(edge.person_b_id);
    const key = [a, b].sort().join('||');
    const existing = edgeMap.get(key);
    const newSpec  = SPECIFICITY[edge.relationship_type] ?? 1;
    const oldSpec  = existing ? (SPECIFICITY[existing.relationship_type] ?? 1) : -1;
    if (newSpec > oldSpec) edgeMap.set(key, edge);
  }

  const deduped = Array.from(edgeMap.values());

  // 2. Build dagre graph
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 100, marginx: 40, marginy: 40 });

  for (const node of tree.nodes) {
    g.setNode(String(node.id), { width: NODE_W, height: NODE_H });
  }

  // For dagre layout direction: only parent→child edges determine rank
  for (const edge of deduped) {
    const a = String(edge.person_a_id);
    const b = String(edge.person_b_id);
    const t = edge.relationship_type;
    if (PARENT_TYPES.has(t)) {
      g.setEdge(a, b); // a is parent, b is child → top-to-bottom
    } else if (CHILD_TYPES.has(t)) {
      g.setEdge(b, a); // a is child, b is parent → reverse for dagre
    }
    // Siblings/spouses: no dagre edge (same rank naturally)
  }

  dagre.layout(g);

  // 3. Build ReactFlow nodes with dagre positions
  const rfNodes: Node[] = tree.nodes.map((n) => {
    const pos = g.node(String(n.id));
    return {
      id: String(n.id),
      type: 'person',
      position: {
        x: pos ? pos.x - NODE_W / 2 : 0,
        y: pos ? pos.y - NODE_H / 2 : 0,
      },
      data: { node: n },
    };
  });

  // 4. Build ReactFlow edges from deduplicated list
  const rfEdges: Edge[] = deduped.map((edge) => {
    const a   = String(edge.person_a_id);
    const b   = String(edge.person_b_id);
    const t   = edge.relationship_type;
    const col = EDGE_COLORS[t] ?? '#6B7280';

    // Normalise direction: always top (parent/older) → bottom (child/younger)
    let src = a, tgt = b;
    if (CHILD_TYPES.has(t)) { src = b; tgt = a; }

    return {
      id: String(edge.id),
      source: src,
      target: tgt,
      type: ConnectionLineType.SmoothStep,
      animated: SPOUSE_TYPES.has(t),
      style: { stroke: col, strokeWidth: SPOUSE_TYPES.has(t) ? 2 : 3 },
      label: t.replace(/_/g, ' '),
      labelStyle: { fill: '#FEF3C7', fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: '#1C1917', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}

// ─── Person node ─────────────────────────────────────────────────────────────

function PersonNode({ data }: { data: { node: FamilyTree['nodes'][number]; isCurrentUser?: boolean } }) {
  const { node } = data;
  const isMe = data.isCurrentUser;
  return (
    <>
      {/* ReactFlow connection handles — invisible but required for edge routing */}
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />

      <div
        className={`
          flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 shadow-lg cursor-pointer
          hover:scale-105 transition-transform select-none
          ${isMe
            ? 'bg-gradient-to-br from-echon-gold to-echon-candle border-echon-gold text-echon-shadow'
            : 'bg-gradient-to-br from-echon-shadow to-echon-wood border-echon-wood/60 text-echon-cream hover:border-echon-gold/60'}
        `}
        style={{ width: NODE_W, minHeight: NODE_H }}
      >
        {node.profile_photo_url ? (
          <img
            src={getMediaUrl(node.profile_photo_url)}
            alt={node.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shrink-0"
          />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-white/20 shrink-0 font-bold
            ${isMe ? 'bg-echon-shadow/30' : 'bg-echon-wood/50'}`}>
            {node.name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="text-xs font-bold text-center leading-tight w-full truncate px-1">
          {node.name}
        </p>
        {isMe && <p className="text-[9px] font-black tracking-widest opacity-70">YOU</p>}
        {node.birth_date && (
          <p className="text-[9px] opacity-60">{new Date(node.birth_date).getFullYear()}</p>
        )}
      </div>
    </>
  );
}

const nodeTypes = { person: PersonNode };

// ─── Inner graph (needs ReactFlow context) ───────────────────────────────────

function GraphInner({ tree, currentUserId, onNodeClick }: FamilyTreeGraphProps) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Recompute layout whenever tree changes
  useEffect(() => {
    const { nodes: ln, edges: le } = buildLayout(tree);

    // Tag current user node
    const tagged = ln.map((n) => ({
      ...n,
      data: { ...n.data, isCurrentUser: n.id === String(currentUserId) },
    }));

    setNodes(tagged);
    setEdges(le);

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [tree, currentUserId, setNodes, setEdges, fitView]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => onNodeClick?.(node.id),
    [onNodeClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      fitView
      minZoom={0.05}
      maxZoom={2}
      attributionPosition="bottom-left"
      className="bg-gradient-to-br from-echon-black via-echon-root to-black"
    >
      <Background color="#D4AF37" gap={24} size={0.8} style={{ opacity: 0.15 }} />
      <Controls className="bg-echon-shadow border border-echon-wood rounded-lg" />
      <MiniMap
        nodeColor={(n) => (n.data?.isCurrentUser ? '#D4AF37' : '#44403C')}
        maskColor="rgba(0,0,0,0.7)"
        style={{ background: '#1C1917', border: '1px solid #44403C', borderRadius: 8 }}
      />
    </ReactFlow>
  );
}

// ─── Public export (wraps provider) ─────────────────────────────────────────

export default function FamilyTreeGraph(props: FamilyTreeGraphProps) {
  return (
    <div className="w-full h-[600px] rounded-xl border-2 border-echon-wood overflow-hidden">
      <ReactFlowProvider>
        <GraphInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
