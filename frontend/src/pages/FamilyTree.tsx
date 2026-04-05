/**
 * Family Tree Page
 * Visual representation of family relationships
 * 
 * PATH: echon/frontend/src/pages/FamilyTree.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { relationshipsApi, FamilyTree, Relationship, getMediaUrl } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import AddRelationship from '../components/AddRelationship';
import EditRelationship from '../components/EditRelationship';
import FamilyTreeGraph from '../components/FamilyTreeGraph';

export default function FamilyTreePage() {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'graph'>('graph'); // Default to graph!
  const [editingRelationship, setEditingRelationship] = useState<{
    relationship: Relationship;
    personAName: string;
    personBName: string;
  } | null>(null);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const data = await relationshipsApi.getTree(spaceId);
      setTree(data);
    } catch (error) {
      console.error('Failed to load family tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string, personName: string) => {
    if (!confirm(`Are you sure you want to delete this relationship with ${personName}?`)) {
      return;
    }

    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await relationshipsApi.delete(relationshipId, spaceId);
      
      // Reload tree
      await loadTree();
    } catch (error) {
      console.error('Failed to delete relationship:', error);
      alert('Failed to delete relationship. Please try again.');
    }
  };

  const getRelationshipColor = (type: string) => {
    const colors: Record<string, string> = {
      parent: '#4ade80',
      child: '#60a5fa',
      sibling: '#f59e0b',
      spouse: '#ec4899',
      grandparent: '#10b981',
      grandchild: '#3b82f6',
      cousin: '#f97316',
    };
    return colors[type] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-root flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading family tree...</div>
      </div>
    );
  }

  if (!tree || tree.nodes.length === 0) {
    return (
      <div className="min-h-screen bg-echon-root">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => navigate('/space/family')}
                className="text-echon-cream hover:text-echon-gold mb-4 flex items-center gap-2"
              >
                ← Back to Family
              </button>
              <h1 className="text-4xl font-bold text-echon-gold mb-2">Family Tree</h1>
              <p className="text-echon-cream-dark">Visualize your family connections</p>
            </div>
          </div>

          {/* Empty state */}
          <div className="bg-echon-shadow rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🌳</div>
            <h2 className="text-2xl font-semibold text-echon-cream mb-2">
              Start Building Your Family Tree
            </h2>
            <p className="text-echon-cream-dark mb-6">
              Add relationships to see your family connections visualized
            </p>
            <button
              onClick={() => setShowAddRelationship(true)}
              className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Add First Relationship
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-root">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate('/space/family')}
              className="text-echon-cream hover:text-echon-gold mb-2 flex items-center gap-2 text-sm"
            >
              ← Back to Family
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-echon-gold mb-1">Family Tree</h1>
            <p className="text-echon-cream-dark text-sm">
              {tree.nodes.length} family members, {tree.edges.length} relationships
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="flex bg-echon-shadow rounded-lg p-1 border border-echon-wood">
              <button
                onClick={() => setViewMode('graph')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-all text-sm ${
                  viewMode === 'graph'
                    ? 'bg-echon-gold text-echon-shadow font-semibold'
                    : 'text-echon-cream hover:text-echon-gold'
                }`}
              >
                🌳 Graph
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition-all text-sm ${
                  viewMode === 'cards'
                    ? 'bg-echon-gold text-echon-shadow font-semibold'
                    : 'text-echon-cream hover:text-echon-gold'
                }`}
              >
                📋 Cards
              </button>
            </div>
            
            <button
              onClick={() => setShowAddRelationship(true)}
              className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Graph View */}
        {viewMode === 'graph' && currentUser && (
          <div className="mb-8">
            <FamilyTreeGraph
              tree={tree}
              currentUserId={currentUser.id}
              onNodeClick={(nodeId) => setSelectedNode(nodeId)}
            />
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{tree.nodes.map((node) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-echon-shadow rounded-lg p-6 cursor-pointer transition-all ${
                selectedNode === node.id ? 'ring-2 ring-echon-gold' : ''
              }`}
              onClick={() => setSelectedNode(node.id)}
            >
              {/* Profile */}
              <div className="flex items-center gap-4 mb-4">
                {node.profile_photo_url ? (
                  <img
                    src={getMediaUrl(node.profile_photo_url)}
                    alt={node.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-echon-wood flex items-center justify-center text-2xl">
                    {node.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-echon-cream">{node.name}</h3>
                  {node.birth_date && (
                    <p className="text-echon-cream-dark text-sm">
                      Born {new Date(node.birth_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>

              {/* Relationships */}
              {node.relationships.length > 0 && (
                <div className="space-y-1">
                  {(() => {
                    // Deduplicate relationships - only show unique person pairs
                    const seen = new Set<string>();
                    return node.relationships
                      .filter((rel) => {
                        const pairKey = [node.id, rel.to_person_id].sort().join('-');
                        if (seen.has(pairKey)) return false;
                        seen.add(pairKey);
                        return true;
                      })
                      .map((rel, idx) => {
                        const otherPerson = tree.nodes.find((n) => n.id === rel.to_person_id);
                        
                        // Find the relationship where THIS node is person_a
                        // This gives us the correct perspective
                        const relObj = tree.edges.find(
                          e => e.person_a_id === node.id && e.person_b_id === rel.to_person_id
                        );
                        
                        if (!relObj || !otherPerson) return null;
                        
                        return (
                          <div
                            key={idx}
                            className="text-sm flex items-center justify-between gap-2 p-2 rounded hover:bg-echon-wood/20 group"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span 
                                className="capitalize"
                                style={{ color: getRelationshipColor(relObj.relationship_type) }}
                              >
                                {relObj.relationship_type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-echon-cream-dark">→</span>
                              <span className="text-echon-cream">{otherPerson.name}</span>
                            </div>
                            
                            {/* Edit/Delete buttons (show on hover) */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRelationship({
                                    relationship: relObj,
                                    personAName: node.name,
                                    personBName: otherPerson?.name || 'Unknown'
                                  });
                                }}
                                className="text-echon-gold hover:text-echon-candle p-1"
                                title="Edit relationship"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRelationship(relObj.id, otherPerson?.name || 'this person');
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Delete relationship"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                  })()}
                </div>
              )}

              {/* Bio */}
              {node.bio && (
                <p className="text-echon-cream-dark text-sm mt-4 line-clamp-2">{node.bio}</p>
              )}
            </motion.div>
          ))}
          </div>
        )}

        {/* Add Relationship Modal */}
        <AddRelationship
          isOpen={showAddRelationship}
          onClose={() => setShowAddRelationship(false)}
          onSuccess={() => {
            loadTree();  // Reload tree after adding relationship
          }}
        />

        {/* Edit Relationship Modal */}
        <EditRelationship
          isOpen={!!editingRelationship}
          onClose={() => setEditingRelationship(null)}
          onSuccess={() => {
            loadTree();  // Reload tree after editing
          }}
          relationship={editingRelationship?.relationship || null}
          personAName={editingRelationship?.personAName || ''}
          personBName={editingRelationship?.personBName || ''}
        />
      </div>
    </div>
  );
}


//////////////////////////////////////////////////////////////////////////////////////
//////////////////////// FamilyTree.tsx - Initial version OK /////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
// /**
//  * Family Tree Page
//  * Visual representation of family relationships
//  * 
//  * PATH: echon/frontend/src/pages/FamilyTree.tsx
//  */

// import { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { relationshipsApi, FamilyTree, Relationship } from '../lib/api';
// import { getCurrentSpace } from '../lib/auth';
// import { useNavigate } from 'react-router-dom';
// import AddRelationship from '../components/AddRelationship';
// import EditRelationship from '../components/EditRelationship';

// export default function FamilyTreePage() {
//   const [tree, setTree] = useState<FamilyTree | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedNode, setSelectedNode] = useState<string | null>(null);
//   const [showAddRelationship, setShowAddRelationship] = useState(false);
//   const [editingRelationship, setEditingRelationship] = useState<{
//     relationship: Relationship;
//     personAName: string;
//     personBName: string;
//   } | null>(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     loadTree();
//   }, []);

//   const loadTree = async () => {
//     try {
//       const spaceId = getCurrentSpace();
//       if (!spaceId) return;

//       const data = await relationshipsApi.getTree(spaceId);
//       setTree(data);
//     } catch (error) {
//       console.error('Failed to load family tree:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteRelationship = async (relationshipId: string, personName: string) => {
//     if (!confirm(`Are you sure you want to delete this relationship with ${personName}?`)) {
//       return;
//     }

//     try {
//       const spaceId = getCurrentSpace();
//       if (!spaceId) return;

//       await relationshipsApi.delete(relationshipId, spaceId);
      
//       // Reload tree
//       await loadTree();
//     } catch (error) {
//       console.error('Failed to delete relationship:', error);
//       alert('Failed to delete relationship. Please try again.');
//     }
//   };

//   const getRelationshipColor = (type: string) => {
//     const colors: Record<string, string> = {
//       parent: '#4ade80',
//       child: '#60a5fa',
//       sibling: '#f59e0b',
//       spouse: '#ec4899',
//       grandparent: '#10b981',
//       grandchild: '#3b82f6',
//       cousin: '#f97316',
//     };
//     return colors[type] || '#6b7280';
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-echon-root flex items-center justify-center">
//         <div className="text-echon-cream text-xl">Loading family tree...</div>
//       </div>
//     );
//   }

//   if (!tree || tree.nodes.length === 0) {
//     return (
//       <div className="min-h-screen bg-echon-root">
//         <div className="max-w-7xl mx-auto px-4 py-12">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-8">
//             <div>
//               <button
//                 onClick={() => navigate('/space/family')}
//                 className="text-echon-cream hover:text-echon-gold mb-4 flex items-center gap-2"
//               >
//                 ← Back to Family
//               </button>
//               <h1 className="text-4xl font-bold text-echon-gold mb-2">Family Tree</h1>
//               <p className="text-echon-cream-dark">Visualize your family connections</p>
//             </div>
//           </div>

//           {/* Empty state */}
//           <div className="bg-echon-shadow rounded-lg p-12 text-center">
//             <div className="text-6xl mb-4">🌳</div>
//             <h2 className="text-2xl font-semibold text-echon-cream mb-2">
//               Start Building Your Family Tree
//             </h2>
//             <p className="text-echon-cream-dark mb-6">
//               Add relationships to see your family connections visualized
//             </p>
//             <button
//               onClick={() => setShowAddRelationship(true)}
//               className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors"
//             >
//               + Add First Relationship
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-echon-root">
//       <div className="max-w-7xl mx-auto px-4 py-12">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <button
//               onClick={() => navigate('/space/family')}
//               className="text-echon-cream hover:text-echon-gold mb-4 flex items-center gap-2"
//             >
//               ← Back to Family
//             </button>
//             <h1 className="text-4xl font-bold text-echon-gold mb-2">Family Tree</h1>
//             <p className="text-echon-cream-dark">
//               {tree.nodes.length} family members, {tree.edges.length} relationships
//             </p>
//           </div>
//           <button
//             onClick={() => setShowAddRelationship(true)}
//             className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors"
//           >
//             + Add Relationship
//           </button>
//         </div>

//         {/* Simple List View (for now) */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {tree.nodes.map((node) => (
//             <motion.div
//               key={node.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className={`bg-echon-shadow rounded-lg p-6 cursor-pointer transition-all ${
//                 selectedNode === node.id ? 'ring-2 ring-echon-gold' : ''
//               }`}
//               onClick={() => setSelectedNode(node.id)}
//             >
//               {/* Profile */}
//               <div className="flex items-center gap-4 mb-4">
//                 {node.profile_photo_url ? (
//                   <img
//                     src={getMediaUrl(node.profile_photo_url)}
//                     alt={node.name}
//                     className="w-16 h-16 rounded-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-16 h-16 rounded-full bg-echon-wood flex items-center justify-center text-2xl">
//                     {node.name.charAt(0)}
//                   </div>
//                 )}
//                 <div>
//                   <h3 className="text-xl font-semibold text-echon-cream">{node.name}</h3>
//                   {node.birth_date && (
//                     <p className="text-echon-cream-dark text-sm">
//                       Born {new Date(node.birth_date).getFullYear()}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               {/* Relationships */}
//               {node.relationships.length > 0 && (
//                 <div className="space-y-1">
//                   {node.relationships.map((rel, idx) => {
//                     const otherPerson = tree.nodes.find((n) => n.id === rel.to_person_id);
//                     // Find the actual relationship object
//                     const relObj = tree.edges.find(
//                       e => (e.person_a_id === node.id && e.person_b_id === rel.to_person_id) ||
//                            (e.person_b_id === node.id && e.person_a_id === rel.to_person_id)
//                     );
                    
//                     return (
//                       <div
//                         key={idx}
//                         className="text-sm flex items-center justify-between gap-2 p-2 rounded hover:bg-echon-wood/20 group"
//                       >
//                         <div className="flex items-center gap-2 flex-1">
//                           <span 
//                             className="capitalize"
//                             style={{ color: getRelationshipColor(rel.type) }}
//                           >
//                             {rel.type.replace(/_/g, ' ')}
//                           </span>
//                           <span className="text-echon-cream-dark">→</span>
//                           <span className="text-echon-cream">{otherPerson?.name || 'Unknown'}</span>
//                         </div>
                        
//                         {/* Edit/Delete buttons (show on hover) */}
//                         {relObj && (
//                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setEditingRelationship({
//                                   relationship: relObj,
//                                   personAName: node.name,
//                                   personBName: otherPerson?.name || 'Unknown'
//                                 });
//                               }}
//                               className="text-echon-gold hover:text-echon-candle p-1"
//                               title="Edit relationship"
//                             >
//                               ✏️
//                             </button>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleDeleteRelationship(relObj.id, otherPerson?.name || 'this person');
//                               }}
//                               className="text-red-400 hover:text-red-300 p-1"
//                               title="Delete relationship"
//                             >
//                               🗑️
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Bio */}
//               {node.bio && (
//                 <p className="text-echon-cream-dark text-sm mt-4 line-clamp-2">{node.bio}</p>
//               )}
//             </motion.div>
//           ))}
//         </div>

//         {/* Add Relationship Modal */}
//         <AddRelationship
//           isOpen={showAddRelationship}
//           onClose={() => setShowAddRelationship(false)}
//           onSuccess={() => {
//             loadTree();  // Reload tree after adding relationship
//           }}
//         />

//         {/* Edit Relationship Modal */}
//         <EditRelationship
//           isOpen={!!editingRelationship}
//           onClose={() => setEditingRelationship(null)}
//           onSuccess={() => {
//             loadTree();  // Reload tree after editing
//           }}
//           relationship={editingRelationship?.relationship || null}
//           personAName={editingRelationship?.personAName || ''}
//           personBName={editingRelationship?.personBName || ''}
//         />
//       </div>
//     </div>
//   );
// }
