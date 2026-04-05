/**
 * Shared relationship type catalogue.
 * Used by: AddRelationship, InviteMember, JoinSpace, PendingApprovals.
 *
 * PATH: echon/frontend/src/lib/relationshipTypes.ts
 */

export interface RelationshipType {
  value: string;
  label: string;
  emoji: string;
  inverse: string;
  category: string;
}

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  // Nuclear
  { value: 'father',        label: 'Father',           emoji: '👨',  inverse: 'son',           category: 'Close Family' },
  { value: 'mother',        label: 'Mother',           emoji: '👩',  inverse: 'daughter',      category: 'Close Family' },
  { value: 'son',           label: 'Son',              emoji: '👦',  inverse: 'father',        category: 'Close Family' },
  { value: 'daughter',      label: 'Daughter',         emoji: '👧',  inverse: 'mother',        category: 'Close Family' },
  { value: 'brother',       label: 'Brother',          emoji: '🧑',  inverse: 'sibling',       category: 'Close Family' },
  { value: 'sister',        label: 'Sister',           emoji: '👩',  inverse: 'sibling',       category: 'Close Family' },
  { value: 'husband',       label: 'Husband',          emoji: '🤵',  inverse: 'wife',          category: 'Close Family' },
  { value: 'wife',          label: 'Wife',             emoji: '👰',  inverse: 'husband',       category: 'Close Family' },
  // Grandparents / Grandchildren
  { value: 'grandfather',   label: 'Grandfather',      emoji: '👴',  inverse: 'grandchild',    category: 'Grandparents & Grandchildren' },
  { value: 'grandmother',   label: 'Grandmother',      emoji: '👵',  inverse: 'grandchild',    category: 'Grandparents & Grandchildren' },
  { value: 'grandson',      label: 'Grandson',         emoji: '👦',  inverse: 'grandparent',   category: 'Grandparents & Grandchildren' },
  { value: 'granddaughter', label: 'Granddaughter',    emoji: '👧',  inverse: 'grandparent',   category: 'Grandparents & Grandchildren' },
  // Extended
  { value: 'uncle',         label: 'Uncle',            emoji: '👨',  inverse: 'nephew',        category: 'Extended Family' },
  { value: 'aunt',          label: 'Aunt',             emoji: '👩',  inverse: 'niece',         category: 'Extended Family' },
  { value: 'nephew',        label: 'Nephew',           emoji: '👦',  inverse: 'uncle',         category: 'Extended Family' },
  { value: 'niece',         label: 'Niece',            emoji: '👧',  inverse: 'aunt',          category: 'Extended Family' },
  { value: 'cousin',        label: 'Cousin',           emoji: '🧑',  inverse: 'cousin',        category: 'Extended Family' },
  // Step
  { value: 'step_father',   label: 'Step Father',      emoji: '👨',  inverse: 'step_son',      category: 'Step Family' },
  { value: 'step_mother',   label: 'Step Mother',      emoji: '👩',  inverse: 'step_daughter', category: 'Step Family' },
  { value: 'step_son',      label: 'Step Son',         emoji: '👦',  inverse: 'step_father',   category: 'Step Family' },
  { value: 'step_daughter', label: 'Step Daughter',    emoji: '👧',  inverse: 'step_mother',   category: 'Step Family' },
  { value: 'step_brother',  label: 'Step Brother',     emoji: '🧑',  inverse: 'step_sibling',  category: 'Step Family' },
  { value: 'step_sister',   label: 'Step Sister',      emoji: '👩',  inverse: 'step_sibling',  category: 'Step Family' },
  { value: 'half_sibling',  label: 'Half Sibling',     emoji: '🧑',  inverse: 'half_sibling',  category: 'Step Family' },
  // Other
  { value: 'adopted_parent',label: 'Adopted Parent',   emoji: '👤',  inverse: 'adopted_child', category: 'Other' },
  { value: 'adopted_child', label: 'Adopted Child',    emoji: '👶',  inverse: 'adopted_parent',category: 'Other' },
  { value: 'in_law',        label: 'In-Law',           emoji: '🤝',  inverse: 'in_law',        category: 'Other' },
  { value: 'spouse',        label: 'Spouse (generic)', emoji: '💑',  inverse: 'spouse',        category: 'Other' },
  { value: 'parent',        label: 'Parent (generic)', emoji: '👤',  inverse: 'child',         category: 'Other' },
  { value: 'child',         label: 'Child (generic)',  emoji: '👶',  inverse: 'parent',        category: 'Other' },
  { value: 'sibling',       label: 'Sibling (generic)',emoji: '👥',  inverse: 'sibling',       category: 'Other' },
  { value: 'grandparent',   label: 'Grandparent (gen)',emoji: '👴',  inverse: 'grandchild',    category: 'Other' },
  { value: 'grandchild',    label: 'Grandchild (gen)', emoji: '👶',  inverse: 'grandparent',   category: 'Other' },
];

/** Groups the catalogue by category for use in <optgroup> or grouped UIs. */
export function groupedRelationshipTypes(): Record<string, RelationshipType[]> {
  return RELATIONSHIP_TYPES.reduce<Record<string, RelationshipType[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});
}

/** Human-readable label for a stored value, with emoji. */
export function relationshipLabel(value: string): string {
  const t = RELATIONSHIP_TYPES.find((r) => r.value === value);
  return t ? `${t.emoji} ${t.label}` : value.replace(/_/g, ' ');
}
