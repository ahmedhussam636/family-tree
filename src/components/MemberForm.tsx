import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Upload, Calendar } from 'lucide-react';
import { FamilyMember } from '../types/FamilyTree';

interface MemberFormProps {
  member?: FamilyMember;
  parentId?: string;
  onSave: (member: Omit<FamilyMember, 'id' | 'children'>) => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({
  member,
  parentId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    deathDate: '',
    gender: 'male' as 'male' | 'female',
    photo: '',
    notes: '',
    parentId: parentId || '',
    spouseId: '',
    relationship: '',
    level: 0,
    position: 0,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName,
        birthDate: member.birthDate || '',
        deathDate: member.deathDate || '',
        gender: member.gender,
        photo: member.photo || '',
        notes: member.notes || '',
        parentId: member.parentId || '',
        spouseId: member.spouseId || '',
        relationship: member.relationship || '',
        level: member.level,
        position: member.position,
      });
      
      if (member.photo) {
        setPhotoPreview(member.photo);
      }
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    if (photoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onSave({
          ...formData,
          photo: base64,
        });
      };
      reader.readAsDataURL(photoFile);
    } else {
      onSave({
        ...formData,
        photo: photoPreview || formData.photo,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const relationshipOptions = [
    { value: '', label: 'اختر صلة القرابة' },
    { value: 'father', label: 'الأب' },
    { value: 'mother', label: 'الأم' },
    { value: 'son', label: 'الابن' },
    { value: 'daughter', label: 'الابنة' },
    { value: 'brother', label: 'الأخ' },
    { value: 'sister', label: 'الأخت' },
    { value: 'grandfather', label: 'الجد' },
    { value: 'grandmother', label: 'الجدة' },
    { value: 'grandson', label: 'الحفيد' },
    { value: 'granddaughter', label: 'الحفيدة' },
    { value: 'uncle', label: 'العم' },
    { value: 'aunt', label: 'العمة' },
    { value: 'cousin_male', label: 'ابن العم' },
    { value: 'cousin_female', label: 'بنت العم' },
    { value: 'husband', label: 'الزوج' },
    { value: 'wife', label: 'الزوجة' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            {member ? 'تعديل عضو العائلة' : 'إضافة عضو جديد'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* رفع الصورة */}
          <div className="text-center">
            <div className="relative inline-block">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="معاينة الصورة"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary-200"
                  />
                  <button
                    type="button"
                    onClick={handlePhotoRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="btn-secondary text-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {photoPreview ? 'تغيير الصورة' : 'إضافة صورة'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الأول *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم العائلة *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الجنس
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                صلة القرابة
              </label>
              <select
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className="input-field"
              >
                {relationshipOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الميلاد
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="date-input"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الوفاة
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="deathDate"
                  value={formData.deathDate}
                  onChange={handleChange}
                  className="date-input"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input-field resize-none"
              rows={3}
              placeholder="أضف أي ملاحظات إضافية..."
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="btn-primary w-full sm:flex-1"
            >
              <Save className="w-4 h-4" />
              {member ? 'حفظ التغييرات' : 'إضافة العضو'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary w-full sm:w-auto"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;