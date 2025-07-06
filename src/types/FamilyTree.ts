export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender: 'male' | 'female';
  photo?: string;
  notes?: string;
  parentId?: string;
  spouseId?: string;
  relationship?: string; // صلة القرابة
  children: string[];
  level: number;
  position: number;
}

export interface FamilyTree {
  id: string;
  name: string;
  members: FamilyMember[];
  rootMemberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreePosition {
  x: number;
  y: number;
  level: number;
}