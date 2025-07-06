import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FamilyMember, FamilyTree } from '../types/FamilyTree';

export const useFamilyTree = () => {
  const [familyTree, setFamilyTree] = useState<FamilyTree>({
    id: uuidv4(),
    name: 'شجرة عائلتي',
    members: [],
    rootMemberId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const addMember = useCallback((member: Omit<FamilyMember, 'id' | 'children'>) => {
    const newMember: FamilyMember = {
      ...member,
      id: uuidv4(),
      children: [],
    };

    setFamilyTree(prev => {
      const updated = {
        ...prev,
        members: [...prev.members, newMember],
        updatedAt: new Date().toISOString(),
      };

      // If this is the first member, make it the root
      if (prev.members.length === 0) {
        updated.rootMemberId = newMember.id;
      }

      // Add child reference to parent
      if (member.parentId) {
        updated.members = updated.members.map(m => 
          m.id === member.parentId 
            ? { ...m, children: [...m.children, newMember.id] }
            : m
        );
      }

      return updated;
    });

    return newMember.id;
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<FamilyMember>) => {
    setFamilyTree(prev => ({
      ...prev,
      members: prev.members.map(member => 
        member.id === id ? { ...member, ...updates } : member
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setFamilyTree(prev => {
      const memberToDelete = prev.members.find(m => m.id === id);
      if (!memberToDelete) return prev;

      // Remove from parent's children array
      let updatedMembers = prev.members.map(member => ({
        ...member,
        children: member.children.filter(childId => childId !== id)
      }));

      // Remove spouse relationship
      if (memberToDelete.spouseId) {
        updatedMembers = updatedMembers.map(member => 
          member.id === memberToDelete.spouseId 
            ? { ...member, spouseId: '' }
            : member
        );
      }

      // Remove the member and all their descendants
      const removeDescendants = (memberId: string) => {
        const member = updatedMembers.find(m => m.id === memberId);
        if (member) {
          // Remove all children recursively
          member.children.forEach(childId => {
            removeDescendants(childId);
          });
          // Remove the member itself
          updatedMembers = updatedMembers.filter(m => m.id !== memberId);
        }
      };

      removeDescendants(id);

      // Update root if necessary
      let newRootId = prev.rootMemberId;
      if (prev.rootMemberId === id && updatedMembers.length > 0) {
        // Find a member without a parent to be the new root
        const rootCandidate = updatedMembers.find(m => !m.parentId);
        newRootId = rootCandidate ? rootCandidate.id : updatedMembers[0].id;
      }

      return {
        ...prev,
        members: updatedMembers,
        rootMemberId: newRootId,
        updatedAt: new Date().toISOString(),
      };
    });

    if (selectedMember?.id === id) {
      setSelectedMember(null);
    }
  }, [selectedMember]);

  const addSpouse = useCallback((memberId: string, spouseData: Omit<FamilyMember, 'id' | 'children'>) => {
    const spouseId = uuidv4();
    const spouse: FamilyMember = {
      ...spouseData,
      id: spouseId,
      children: [],
      relationship: spouseData.gender === 'male' ? 'husband' : 'wife',
    };

    setFamilyTree(prev => {
      const updatedMembers = [...prev.members, spouse];
      
      // Link the spouse relationship
      const memberIndex = updatedMembers.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          spouseId: spouseId
        };
        
        // Set spouse's spouseId to link back
        const spouseIndex = updatedMembers.findIndex(m => m.id === spouseId);
        if (spouseIndex !== -1) {
          updatedMembers[spouseIndex] = {
            ...updatedMembers[spouseIndex],
            spouseId: memberId
          };
        }
      }

      return {
        ...prev,
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
    });

    return spouseId;
  }, []);

  const getMemberById = useCallback((id: string) => {
    return familyTree.members.find(member => member.id === id);
  }, [familyTree.members]);

  const getChildren = useCallback((parentId: string) => {
    return familyTree.members.filter(member => member.parentId === parentId);
  }, [familyTree.members]);

  const getParent = useCallback((childId: string) => {
    const child = getMemberById(childId);
    return child?.parentId ? getMemberById(child.parentId) : null;
  }, [getMemberById]);

  const exportData = useCallback(() => {
    return JSON.stringify(familyTree, null, 2);
  }, [familyTree]);

  const importData = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData) as FamilyTree;
      setFamilyTree(imported);
      setSelectedMember(null);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, []);

  return {
    familyTree,
    selectedMember,
    setSelectedMember,
    addMember,
    updateMember,
    deleteMember,
    addSpouse,
    getMemberById,
    getChildren,
    getParent,
    exportData,
    importData,
  };
};