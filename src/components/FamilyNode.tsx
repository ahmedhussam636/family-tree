import React from 'react';
import { User, Edit, Trash2, Plus } from 'lucide-react';
import { FamilyMember } from '../types/FamilyTree';

interface FamilyNodeProps {
  member: FamilyMember;
  spouse?: FamilyMember;
  isSelected: boolean;
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSpouse: (memberId: string) => void;
  isPresentationMode?: boolean;
}

const FamilyNode: React.FC<FamilyNodeProps> = ({
  member,
  spouse,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onAddSpouse,
  isPresentationMode = false,
}) => {
  const getAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return '';
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    
    if (age < 0) {
      return 'متوفي';
    }
    
    return deathDate ? `(${age} سنة)` : `${age} سنة`;
  };

  const getRelationshipLabel = (relationship?: string) => {
    const relationshipLabels: { [key: string]: string } = {
      'father': 'الأب',
      'mother': 'الأم',
      'son': 'الابن',
      'daughter': 'الابنة',
      'brother': 'الأخ',
      'sister': 'الأخت',
      'grandfather': 'الجد',
      'grandmother': 'الجدة',
      'grandson': 'الحفيد',
      'granddaughter': 'الحفيدة',
      'uncle': 'العم',
      'aunt': 'العمة',
      'cousin_male': 'ابن العم',
      'cousin_female': 'بنت العم',
      'husband': 'الزوج',
      'wife': 'الزوجة',
    };
    
    return relationship ? relationshipLabels[relationship] || relationship : '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const PersonCard = ({ person, isSpouse = false }: { person: FamilyMember; isSpouse?: boolean }) => (
    <div className="flex items-start gap-2 sm:gap-3">
      <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden ${
        person.gender === 'male' 
          ? 'bg-blue-100 text-blue-600' 
          : 'bg-pink-100 text-pink-600'
      }`}>
        {person.photo ? (
          <img 
            src={person.photo} 
            alt={`${person.firstName} ${person.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-3 h-3 sm:w-6 sm:h-6" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
          {person.firstName} {person.lastName}
        </h3>
        {person.relationship && (
          <p className="text-xs sm:text-sm text-primary-600 font-medium">
            {getRelationshipLabel(person.relationship)}
          </p>
        )}
        <p className="text-xs sm:text-sm text-gray-500">
          {getAge(person.birthDate, person.deathDate)}
        </p>
        {person.birthDate && (
          <p className="text-xs text-gray-400 hidden sm:block">
            {formatDate(person.birthDate)}
            {person.deathDate && ` - ${formatDate(person.deathDate)}`}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`family-node ${isSelected ? 'selected' : ''} animate-scale-in ${
        spouse ? 'min-w-[280px] sm:min-w-[400px]' : 'min-w-[200px] sm:min-w-[280px]'
      } max-w-[90vw] ${isPresentationMode ? 'cursor-pointer hover:shadow-xl' : 'cursor-pointer'}`}
      onClick={() => onSelect(member)}
    >
      {spouse ? (
        <div className="space-y-3 sm:space-y-4">
          <PersonCard person={member} />
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-pink-200 via-red-300 to-pink-200"></div>
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">متزوجان</span>
            <div className="flex-1 h-px bg-gradient-to-r from-pink-200 via-red-300 to-pink-200"></div>
          </div>
          
          <PersonCard person={spouse} isSpouse={true} />
        </div>
      ) : (
        <PersonCard person={member} />
      )}

      {/* عرض الملاحظات */}
      {(member.notes || spouse?.notes) && (
        <div className="mt-3 space-y-2">
          {member.notes && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              <span className="font-medium">{member.firstName}:</span> {member.notes}
            </p>
          )}
          {spouse?.notes && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              <span className="font-medium">{spouse.firstName}:</span> {spouse.notes}
            </p>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(member.id);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="إضافة طفل"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
          </button>
          {!member.spouseId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSpouse(member.id);
              }}
              className="text-xs px-1 sm:px-2 py-1 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
              title="إضافة زوج/زوجة"
            >
              زواج
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="تعديل"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(member.id);
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
          </button>
          {spouse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(spouse);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="تعديل الزوج/الزوجة"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyNode;