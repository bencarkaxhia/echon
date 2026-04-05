/**
 * Family Tree Graph - Interactive Visual Tree
 * Beautiful graph visualization with ReactFlow
 * 
 * PATH: echon/frontend/src/components/FamilyTreeGraph.tsx
 */

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyTree } from '../lib/api';
import { getMediaUrl } from '../lib/api';

interface FamilyTreeGraphProps {
  tree: FamilyTree;
  currentUserId: string;
  onNodeClick?: (nodeId: string) => void;
}

// Custom node component
const PersonNode = ({ data }: any) => {
  return (
    <div
      className={`relative bg-gradient-to-br ${
        data.isCurrentUser
          ? 'from-echon-gold to-echon-candle'
          : 'from-echon-shadow to-echon-wood'
      } rounded-lg p-3 border-2 ${
        data.isCurrentUser ? 'border-echon-gold' : 'border-echon-wood'
      } shadow-xl min-w-[100px] cursor-pointer hover:scale-105 transition-transform`}
    >
      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-1">
        {data.photo ? (
          <img
            src={getMediaUrl(data.photo)}
            alt={data.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-echon-cream"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-echon-wood flex items-center justify-center text-lg border-2 border-echon-cream">
            {data.name.charAt(0)}
          </div>
        )}

        {/* Name */}
        <div className="text-center">
          <p className={`font-semibold text-xs ${data.isCurrentUser ? 'text-echon-shadow' : 'text-echon-cream'}`}>
            {data.name}
          </p>
          {data.isCurrentUser && (
            <p className="text-[10px] text-echon-shadow font-bold">YOU</p>
          )}
          {data.birthDate && (
            <p className={`text-[10px] ${data.isCurrentUser ? 'text-echon-shadow/70' : 'text-echon-cream-dark'}`}>
              {new Date(data.birthDate).getFullYear()}
            </p>
          )}
        </div>
      </div>

      {/* Glow effect for current user */}
      {data.isCurrentUser && (
        <div className="absolute -inset-1 bg-echon-gold opacity-20 blur-xl -z-10 rounded-lg" />
      )}
    </div>
  );
};

const nodeTypes = {
  person: PersonNode,
};

export default function FamilyTreeGraph({
  tree,
  currentUserId,
  onNodeClick,
}: FamilyTreeGraphProps) {
  // Build hierarchical layout
  const buildTreeLayout = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Find current user
    const currentUserNode = tree.nodes.find(n => n.id === currentUserId);
    if (!currentUserNode) return { nodes, edges };

    // Build hierarchy: parents above, children below, siblings same level
    const positioned = new Set<string>();
    
    // Helper: Position node
    const positionNode = (nodeId: string, level: number, x: number) => {
      // Convert to string to ensure consistency
      const id = String(nodeId);
      if (positioned.has(id)) return;
      
      const node = tree.nodes.find(n => String(n.id) === id);
      if (!node) return;

      positioned.add(id);

      nodes.push({
        id: id, // Use string ID
        type: 'person',
        position: { x, y: level * 200 },
        data: {
          name: node.name,
          photo: node.profile_photo_url,
          birthDate: node.birth_date,
          isCurrentUser: id === String(currentUserId),
        },
      });
    };

    // Start with current user at center
    positionNode(currentUserId, 0, 400);

    // Find and position parents (level -1)
    // Pattern 1: {a: X, b: currentUser, type: father/mother/parent} → X is parent
    // Pattern 2: {a: currentUser, b: X, type: son/daughter/child} → X is parent
    const addedParentEdges = new Set<string>();
    let parentX = 200;
    tree.edges.forEach(edge => {
      const aStr = String(edge.person_a_id);
      const bStr = String(edge.person_b_id);
      const cu = String(currentUserId);
      const relType = edge.relationship_type;
      let parentId: string | null = null;

      if (bStr === cu && ['father', 'mother', 'parent'].includes(relType)) {
        parentId = aStr; // X is father/parent of me
      } else if (aStr === cu && ['son', 'daughter', 'child'].includes(relType)) {
        parentId = bStr; // I am son/daughter of X
      }

      if (parentId && !addedParentEdges.has(parentId)) {
        addedParentEdges.add(parentId);
        positionNode(parentId, -1, parentX);
        edges.push({
          id: String(edge.id),
          source: parentId,
          target: cu,
          type: ConnectionLineType.SmoothStep,
          animated: false,
          style: { stroke: '#10B981', strokeWidth: 3 },
          label: relType,
          labelStyle: { fill: '#FEF3C7', fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
        });
        parentX += 300;
      }
    });

    // Find and position children (level +1)
    // Pattern 1: {a: X, b: currentUser, type: son/daughter/child} → X is child
    // Pattern 2: {a: currentUser, b: X, type: father/mother/parent} → X is child
    const addedChildEdges = new Set<string>();
    let childX = 200;
    tree.edges.forEach(edge => {
      const aStr = String(edge.person_a_id);
      const bStr = String(edge.person_b_id);
      const cu = String(currentUserId);
      const relType = edge.relationship_type;
      let childId: string | null = null;

      if (bStr === cu && ['son', 'daughter', 'child'].includes(relType)) {
        childId = aStr; // X is son/daughter/child of me
      } else if (aStr === cu && ['father', 'mother', 'parent'].includes(relType)) {
        childId = bStr; // I am father/mother of X
      }

      if (childId && !addedChildEdges.has(childId)) {
        addedChildEdges.add(childId);
        positionNode(childId, 1, childX);
        edges.push({
          id: String(edge.id),
          source: cu,
          target: childId,
          type: ConnectionLineType.SmoothStep,
          animated: false,
          style: { stroke: '#3B82F6', strokeWidth: 3 },
          label: relType,
          labelStyle: { fill: '#FEF3C7', fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
        });
        childX += 300;
      }
    });

    // Find and position siblings (level 0)
    let siblingLeftX = 100;
    let siblingRightX = 700;
    tree.edges.forEach(edge => {
      const personAStr = String(edge.person_a_id);
      const personBStr = String(edge.person_b_id);
      const currentUserStr = String(currentUserId);
      
      if (personAStr === currentUserStr || personBStr === currentUserStr) {
        const relType = edge.relationship_type;
        const otherId = personAStr === currentUserStr ? personBStr : personAStr;
        
        if (['brother', 'sister', 'sibling'].includes(relType) && !positioned.has(otherId)) {
          const useLeft = siblingLeftX < 400;
          positionNode(otherId, 0, useLeft ? siblingLeftX : siblingRightX);
          
          edges.push({
            id: String(edge.id),
            source: currentUserStr,
            target: otherId,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#F59E0B', strokeWidth: 3 },
            label: relType,
            labelStyle: { fill: '#FEF3C7', fontSize: 11, fontWeight: 600 },
            labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
          });
          
          if (useLeft) siblingLeftX -= 300;
          else siblingRightX += 300;
        }
      }
    });

    // Add spouse (level 0, right side)
    tree.edges.forEach(edge => {
      const personAStr = String(edge.person_a_id);
      const personBStr = String(edge.person_b_id);
      const currentUserStr = String(currentUserId);
      
      if (personAStr === currentUserStr || personBStr === currentUserStr) {
        const relType = edge.relationship_type;
        const otherId = personAStr === currentUserStr ? personBStr : personAStr;
        
        if (['husband', 'wife', 'spouse'].includes(relType) && !positioned.has(otherId)) {
          positionNode(otherId, 0, 650);
          edges.push({
            id: String(edge.id),
            source: currentUserStr,
            target: otherId,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#EC4899', strokeWidth: 3 },
            label: relType,
            labelStyle: { fill: '#FEF3C7', fontSize: 11, fontWeight: 600 },
            labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
          });
        }
      }
    });

    // Add grandparents (level -2)
    let grandparentX = 100;
    tree.edges.forEach(edge => {
      const relType = edge.relationship_type;
      const currentUserStr = String(currentUserId);
      const personAStr = String(edge.person_a_id);
      
      if (['grandfather', 'grandmother', 'grandparent'].includes(relType)) {
        if (String(edge.person_b_id) === currentUserStr && !positioned.has(personAStr)) {
          positionNode(personAStr, -2, grandparentX);
          edges.push({
            id: String(edge.id),
            source: personAStr,
            target: currentUserStr,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#10B981', strokeWidth: 2 },
            label: relType,
            labelStyle: { fill: '#FEF3C7', fontSize: 10, fontWeight: 600 },
            labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
          });
          grandparentX += 300;
        }
      }
    });

    // Add grandchildren (level +2)
    let grandchildX = 100;
    tree.edges.forEach(edge => {
      const relType = edge.relationship_type;
      const currentUserStr = String(currentUserId);
      const personBStr = String(edge.person_b_id);
      
      if (['grandson', 'granddaughter', 'grandchild'].includes(relType)) {
        if (String(edge.person_a_id) === currentUserStr && !positioned.has(personBStr)) {
          positionNode(personBStr, 2, grandchildX);
          edges.push({
            id: String(edge.id),
            source: currentUserStr,
            target: personBStr,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: { stroke: '#3B82F6', strokeWidth: 2 },
            label: relType,
            labelStyle: { fill: '#FEF3C7', fontSize: 10, fontWeight: 600 },
            labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
          });
          grandchildX += 300;
        }
      }
    });

    // Add any remaining unpositioned nodes (extended family, etc.)
    let extraX = 100;
    let extraY = 300;
    tree.nodes.forEach(node => {
      const nodeIdStr = String(node.id);
      if (!positioned.has(nodeIdStr)) {
        positionNode(nodeIdStr, 3, extraX);
        extraX += 250;
        if (extraX > 800) {
          extraX = 100;
          extraY += 200;
        }
      }
    });

    // Add ALL remaining edges (relationships between any positioned nodes)
    tree.edges.forEach(edge => {
      const edgeIdStr = String(edge.id);
      const personAStr = String(edge.person_a_id);
      const personBStr = String(edge.person_b_id);
      
      const existingEdge = edges.find(e => e.id === edgeIdStr);
      const bothPositioned = positioned.has(personAStr) && positioned.has(personBStr);
      
      if (!existingEdge && bothPositioned) {
        // Determine edge color
        let edgeColor = '#D4AF37';
        const relType = edge.relationship_type;
        
        if (['father', 'mother', 'parent'].includes(relType)) {
          edgeColor = '#10B981';
        } else if (['son', 'daughter', 'child'].includes(relType)) {
          edgeColor = '#3B82F6';
        } else if (['brother', 'sister', 'sibling'].includes(relType)) {
          edgeColor = '#F59E0B';
        } else if (['husband', 'wife', 'spouse'].includes(relType)) {
          edgeColor = '#EC4899';
        }

        edges.push({
          id: edgeIdStr,
          source: personAStr,
          target: personBStr,
          type: ConnectionLineType.SmoothStep,
          animated: false,
          style: { stroke: edgeColor, strokeWidth: 2 },
          label: relType.replace(/_/g, ' '),
          labelStyle: { fill: '#FEF3C7', fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#1C1917', fillOpacity: 0.8 },
        });
      }
    });

    return { nodes, edges };
  }, [tree, currentUserId]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildTreeLayout(),
    [buildTreeLayout]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when tree changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildTreeLayout();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [buildTreeLayout, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[400px] md:h-[500px] bg-echon-black rounded-lg border-2 border-echon-wood overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        attributionPosition="bottom-left"
        className="bg-gradient-to-br from-echon-black via-echon-root to-black"
      >
        <Background color="#D4AF37" gap={20} size={1} />
        <Controls className="bg-echon-shadow border border-echon-wood rounded-lg" />
      </ReactFlow>
    </div>
  );
}