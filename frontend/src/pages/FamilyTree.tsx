/**
 * Family Tree Page
 * Visual representation of family relationships
 * 
 * PATH: echon/frontend/src/pages/FamilyTree.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { relationshipsApi, FamilyTree } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function FamilyTreePage() {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const navigate = useNavigate();

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/space/family')}
              className="text-echon-cream hover:text-echon-gold mb-4 flex items-center gap-2"
            >
              ← Back to Family
            </button>
            <h1 className="text-4xl font-bold text-echon-gold mb-2">Family Tree</h1>
            <p className="text-echon-cream-dark">
              {tree.nodes.length} family members, {tree.edges.length} relationships
            </p>
          </div>
          <button
            onClick={() => setShowAddRelationship(true)}
            className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Add Relationship
          </button>
        </div>

        {/* Simple List View (for now) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tree.nodes.map((node) => (
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
                    src={`http://localhost:8000${node.profile_photo_url}`}
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
                  {node.relationships.map((rel, idx) => {
                    const otherPerson = tree.nodes.find((n) => n.id === rel.to_person_id);
                    return (
                      <div
                        key={idx}
                        className="text-sm flex items-center gap-2"
                        style={{ color: getRelationshipColor(rel.type) }}
                      >
                        <span className="capitalize">{rel.type}</span>
                        <span className="text-echon-cream-dark">→</span>
                        <span className="text-echon-cream">{otherPerson?.name || 'Unknown'}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bio */}
              {node.bio && (
                <p className="text-echon-cream-dark text-sm mt-4 line-clamp-2">{node.bio}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add Relationship Modal placeholder */}
        {showAddRelationship && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-echon-shadow rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-echon-gold mb-4">Add Relationship</h2>
              <p className="text-echon-cream mb-4">
                Relationship modal coming soon! For now, use the API directly.
              </p>
              <button
                onClick={() => setShowAddRelationship(false)}
                className="bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-2 rounded-lg font-semibold transition-colors w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}