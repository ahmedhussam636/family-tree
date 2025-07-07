import React, { useState } from 'react';
import { useFamilyTree } from './hooks/useFamilyTree';
import { useToast } from './hooks/useToast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FamilyTreeView from './components/FamilyTreeView';
import MemberForm from './components/MemberForm';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';
import { FamilyMember } from './types/FamilyTree';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Menu, X } from 'lucide-react';

function App() {
  const {
    familyTree,
    selectedMember,
    setSelectedMember,
    addMember,
    updateMember,
    deleteMember,
    addSpouse,
    clearData,
  } = useFamilyTree();

  const { toasts, removeToast, showSuccess, showError } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [parentForNewMember, setParentForNewMember] = useState<string | undefined>();
  const [isAddingSpouse, setIsAddingSpouse] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
    isFullClear?: boolean;
  }>({
    isOpen: false,
    memberId: '',
    memberName: '',
    isFullClear: false
  });

  const handleAddMember = (parentId?: string) => {
    setParentForNewMember(parentId);
    setEditingMember(null);
    setIsAddingSpouse(null);
    setIsFormOpen(true);
    setIsSidebarOpen(false);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setParentForNewMember(undefined);
    setIsAddingSpouse(null);
    setIsFormOpen(true);
    setIsSidebarOpen(false);
  };

  const handleSaveMember = (memberData: Omit<FamilyMember, 'id' | 'children'>) => {
    try {
      if (editingMember) {
        updateMember(editingMember.id, memberData);
        showSuccess('تم تحديث بيانات العضو بنجاح!');
      } else if (isAddingSpouse) {
        addSpouse(isAddingSpouse, memberData);
        showSuccess('تم إضافة الزوج/الزوجة بنجاح!');
      } else {
        addMember(memberData);
        showSuccess('تم إضافة العضو الجديد بنجاح!');
      }
      setIsFormOpen(false);
      setEditingMember(null);
      setParentForNewMember(undefined);
      setIsAddingSpouse(null);
    } catch (error) {
      showError('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    setParentForNewMember(undefined);
    setIsAddingSpouse(null);
  };

  const handleExportToPDF = async () => {
    try {
      showSuccess('جاري تحضير ملف PDF...');
      
      const element = document.getElementById('family-tree-container');
      if (!element) {
        showError('لا يمكن العثور على الشجرة للتصدير');
        return;
      }

      // إخفاء العناصر غير المرغوب فيها مؤقتاً
      const sidebar = document.querySelector('.sidebar-overlay');
      const zoomControls = document.querySelector('.zoom-controls');
      const mobileMenu = document.querySelector('.mobile-menu-button');
      const addButton = document.querySelector('.lg\\:hidden.fixed.top-1\\/2');
      
      const originalSidebarDisplay = sidebar ? (sidebar as HTMLElement).style.display : '';
      const originalZoomDisplay = zoomControls ? (zoomControls as HTMLElement).style.display : '';
      const originalMenuDisplay = mobileMenu ? (mobileMenu as HTMLElement).style.display : '';
      const originalAddButtonDisplay = addButton ? (addButton as HTMLElement).style.display : '';
      
      if (sidebar) (sidebar as HTMLElement).style.display = 'none';
      if (zoomControls) (zoomControls as HTMLElement).style.display = 'none';
      if (mobileMenu) (mobileMenu as HTMLElement).style.display = 'none';
      if (addButton) (addButton as HTMLElement).style.display = 'none';

      // إعادة تعيين التكبير للتصدير
      const treeContent = element.querySelector('[style*="transform"]') as HTMLElement;
      const originalTransform = treeContent ? treeContent.style.transform : '';
      if (treeContent) {
        treeContent.style.transform = 'scale(1)';
      }

      // انتظار قصير للتأكد من تطبيق التغييرات
      await new Promise(resolve => setTimeout(resolve, 500));

      // التقاط صورة عالية الجودة للشجرة
      const canvas = await html2canvas(element, {
        backgroundColor: '#f9fafb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('family-tree-container');
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
            clonedElement.style.width = 'auto';
          }
        }
      });

      // إعادة العناصر المخفية
      if (sidebar) (sidebar as HTMLElement).style.display = originalSidebarDisplay;
      if (zoomControls) (zoomControls as HTMLElement).style.display = originalZoomDisplay;
      if (mobileMenu) (mobileMenu as HTMLElement).style.display = originalMenuDisplay;
      if (addButton) (addButton as HTMLElement).style.display = originalAddButtonDisplay;
      if (treeContent) treeContent.style.transform = originalTransform;

      // إنشاء PDF محسن
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      const orientation = ratio > 1.4 ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let pdfImgWidth, pdfImgHeight;
      
      if (ratio > pageWidth / pageHeight) {
        pdfImgWidth = pageWidth - 20;
        pdfImgHeight = pdfImgWidth / ratio;
      } else {
        pdfImgHeight = pageHeight - 40;
        pdfImgWidth = pdfImgHeight * ratio;
      }

      const imgX = (pageWidth - pdfImgWidth) / 2;
      const imgY = 25;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(familyTree.name, pageWidth / 2, 15, { align: 'center' });

      pdf.addImage(imgData, 'PNG', imgX, imgY, pdfImgWidth, pdfImgHeight, undefined, 'FAST');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const exportDate = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`تاريخ التصدير: ${exportDate}`, 15, pageHeight - 10);
      pdf.text(`عدد الأعضاء: ${familyTree.members.length}`, pageWidth - 15, pageHeight - 10, { align: 'right' });

      const fileName = `${familyTree.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      showSuccess('تم تصدير الشجرة بصيغة PDF بنجاح!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('حدث خطأ أثناء تصدير ملف PDF');
    }
  };

  const handleDeleteMember = (id: string) => {
    const member = familyTree.members.find(m => m.id === id);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'هذا العضو';
    
    setDeleteConfirm({
      isOpen: true,
      memberId: id,
      memberName,
      isFullClear: false
    });
  };

  const handleClearData = () => {
    setDeleteConfirm({
      isOpen: true,
      memberId: '',
      memberName: '',
      isFullClear: true
    });
  };

  const confirmDelete = () => {
    try {
      if (deleteConfirm.isFullClear) {
        clearData();
        showSuccess('تم مسح جميع البيانات بنجاح');
      } else {
        deleteMember(deleteConfirm.memberId);
        showSuccess(`تم حذف ${deleteConfirm.memberName} بنجاح`);
      }
    } catch (error) {
      showError(deleteConfirm.isFullClear ? 'حدث خطأ أثناء مسح البيانات' : 'حدث خطأ أثناء حذف العضو');
    }
    setDeleteConfirm({ isOpen: false, memberId: '', memberName: '', isFullClear: false });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, memberId: '', memberName: '', isFullClear: false });
  };

  const handleAddSpouse = (memberId: string) => {
    setIsAddingSpouse(memberId);
    setEditingMember(null);
    setParentForNewMember(undefined);
    setIsFormOpen(true);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Header
        familyTreeName={familyTree.name}
        membersCount={familyTree.members.length}
        onExport={handleExportToPDF}
        onClearData={handleClearData}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <FamilyTreeView
          members={familyTree.members}
          rootMemberId={familyTree.rootMemberId}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          onAddChild={handleAddMember}
          onAddSpouse={handleAddSpouse}
          onAddMember={() => handleAddMember()}
        />
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            members={familyTree.members}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 sidebar-overlay">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">أعضاء العائلة</h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-full overflow-hidden">
                <Sidebar
                  members={familyTree.members}
                  selectedMember={selectedMember}
                  onSelectMember={(member) => {
                    setSelectedMember(member);
                    setIsSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button - يظهر فقط عندما يوجد أعضاء */}
      {familyTree.members.length > 0 && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-20 right-4 z-40 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors mobile-menu-button"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isFormOpen && (
        <MemberForm
          member={editingMember || undefined}
          parentId={parentForNewMember}
          onSave={handleSaveMember}
          onCancel={handleCancelForm}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteConfirm.isOpen && (
        <ConfirmDialog
          title={deleteConfirm.isFullClear ? "تأكيد مسح البيانات" : "تأكيد الحذف"}
          message={
            deleteConfirm.isFullClear 
              ? "هل أنت متأكد من مسح جميع بيانات شجرة العائلة؟ لا يمكن التراجع عن هذا الإجراء."
              : `هل أنت متأكد من حذف ${deleteConfirm.memberName}؟ سيتم حذف جميع الأطفال المرتبطين به أيضاً.`
          }
          confirmText={deleteConfirm.isFullClear ? "مسح جميع البيانات" : "حذف"}
          cancelText="إلغاء"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          type="danger"
        />
      )}

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default App;