import React, { useState } from 'react';
import { Search, Users, Filter } from 'lucide-react';
import { FamilyMember } from '../types/FamilyTree';

interface SidebarProps {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  onSelectMember: (member: FamilyMember) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  members,
  selectedMember,
  onSelectMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === '' || 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || member.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في أعضاء العائلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="all">جميع الأعضاء</option>
            <option value="male">الذكور</option>
            <option value="female">الإناث</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              أعضاء العائلة ({filteredMembers.length})
            </span>
          </div>

          <div className="space-y-2">
            {filteredMembers.map(member => (
              <div
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMember?.id === member.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    member.gender === 'male' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-pink-100 text-pink-600'
                  }`}>
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                      {member.birthDate && (
                        <span> • {new Date().getFullYear() - new Date(member.birthDate).getFullYear()} سنة</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">لا توجد نتائج للبحث</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;