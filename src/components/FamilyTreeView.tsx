import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Plus, Presentation, Grid3X3, ChevronLeft, Home, Move } from 'lucide-react';
import { FamilyMember } from '../types/FamilyTree';
import FamilyNode from './FamilyNode';

interface FamilyTreeViewProps {
  members: FamilyMember[];
  rootMemberId: string;
  selectedMember: FamilyMember | null;
  onSelectMember: (member: FamilyMember) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSpouse: (memberId: string) => void;
  onAddMember: () => void;
}

const FamilyTreeView: React.FC<FamilyTreeViewProps> = ({
  members,
  rootMemberId,
  selectedMember,
  onSelectMember,
  onEditMember,
  onDeleteMember,
  onAddChild,
  onAddSpouse,
  onAddMember,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationPath, setPresentationPath] = useState<string[]>([]);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth / 2 - containerRef.current.clientWidth / 2,
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };
  const togglePresentationMode = () => {
    if (!isPresentationMode) {
      // بدء وضع العرض التقديمي من الجد الأكبر
      setPresentationPath([rootMemberId]);
    } else {
      // إنهاء وضع العرض التقديمي
      setPresentationPath([]);
    }
    setIsPresentationMode(!isPresentationMode);
  };

  const handlePresentationMemberClick = (member: FamilyMember) => {
    if (!isPresentationMode) {
      onSelectMember(member);
      return;
    }

    // في وضع العرض التقديمي - منع تكرار الكارد
    const memberIndex = presentationPath.indexOf(member.id);
    if (memberIndex !== -1) {
      // إذا كان العضو موجود في المسار، قطع المسار عند هذا العضو
      setPresentationPath(presentationPath.slice(0, memberIndex + 1));
      return;
    }

    const children = members.filter(m => m.parentId === member.id);
    
    if (children.length > 0) {
      // أضف العضو للمسار
      setPresentationPath(prev => [...prev, member.id]);
    } else {
      // إذا لم يكن له أطفال، اختره فقط
      onSelectMember(member);
    }
  };

  const goBackInPresentation = () => {
    if (presentationPath.length > 1) {
      setPresentationPath(prev => prev.slice(0, -1));
    }
  };

  const goToRootInPresentation = () => {
    setPresentationPath([rootMemberId]);
  };

  const buildTree = (memberId: string, level: number = 0): React.ReactNode => {
    const member = members.find(m => m.id === memberId);
    if (!member) return null;

    const directChildren = members.filter(m => m.parentId === memberId);
    const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;

    return (
      <div key={member.id} className="flex flex-col items-center relative mb-8 sm:mb-12">
        {/* مستوى الوالدين */}
        <div className="flex items-center justify-center mb-6 sm:mb-10 relative z-10">
          <FamilyNode
            member={member}
            spouse={spouse}
            isSelected={selectedMember?.id === member.id || selectedMember?.id === spouse?.id}
            onSelect={onSelectMember}
            onEdit={onEditMember}
            onDelete={onDeleteMember}
            onAddChild={onAddChild}
            onAddSpouse={onAddSpouse}
          />
        </div>

        {/* الأطفال */}
        {directChildren.length > 0 && (
          <div className="flex flex-col items-center w-full relative">
            {/* خط الاتصال العمودي من الوالدين */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 sm:h-16 bg-gray-400 z-0"></div>
            
            {/* خط أفقي يربط جميع الأطفال */}
            {directChildren.length > 1 && (
              <div className="relative mt-8 sm:mt-16 mb-6 sm:mb-10">
                <div 
                  className="absolute top-0 h-0.5 bg-gray-400 z-0"
                  style={{ 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${(directChildren.length - 1) * (window.innerWidth < 640 ? 250 : 400)}px`
                  }}
                ></div>
                
                {directChildren.map((_, index) => {
                  const spacing = window.innerWidth < 640 ? 250 : 400;
                  const totalWidth = (directChildren.length - 1) * spacing;
                  const startX = -totalWidth / 2;
                  const childX = startX + (index * spacing);
                  
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-6 sm:h-10 bg-gray-400 top-0 z-0"
                      style={{ 
                        left: '50%',
                        transform: `translateX(${childX}px)`
                      }}
                    ></div>
                  );
                })}
              </div>
            )}
            
            {/* خط عمودي واحد للطفل الوحيد */}
            {directChildren.length === 1 && (
              <div className="absolute top-8 sm:top-16 left-1/2 transform -translate-x-1/2 w-0.5 h-6 sm:h-10 bg-gray-400 z-0"></div>
            )}
            
            {/* عرض جميع الأطفال في صف واحد */}
            <div 
              className="flex items-start justify-center relative z-10 flex-wrap sm:flex-nowrap"
              style={{ 
                gap: window.innerWidth < 640 ? '80px' : '150px',
                marginTop: directChildren.length > 1 ? (window.innerWidth < 640 ? '60px' : '100px') : (window.innerWidth < 640 ? '60px' : '100px')
              }}
            >
              {directChildren.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {buildTree(child.id, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPresentationView = () => {
    if (presentationPath.length === 0) return null;

    return (
      <div className="flex flex-col items-center justify-start min-h-full p-4 sm:p-8">
        {/* شريط التنقل */}
        <div className="w-full max-w-4xl mb-6 sm:mb-8">
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {presentationPath.length > 1 && (
                <button
                  onClick={goBackInPresentation}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="العودة للخلف"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              )}
              <button
                onClick={goToRootInPresentation}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="العودة للجد الأكبر"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="text-center flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                عرض تقديمي للعائلة
              </h2>
              <p className="text-sm text-gray-500">
                الجيل {presentationPath.length}
              </p>
            </div>
            
            <button
              onClick={togglePresentationMode}
              className="btn-secondary text-sm"
            >
              <Grid3X3 className="w-4 h-4" />
              عرض الشجرة
            </button>
          </div>
        </div>

        {/* عرض المسار العمودي */}
        <div className="w-full max-w-2xl space-y-6">
          {/* عرض المسار الكامل */}
          {presentationPath.map((memberId, index) => {
            const member = members.find(m => m.id === memberId);
            if (!member) return null;

            const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;
            const children = members.filter(m => m.parentId === memberId);
            const isLastInPath = index === presentationPath.length - 1;

            return (
              <div key={`path-${memberId}-${index}`} className="relative">
                {/* العضو الحالي */}
                <div className="flex justify-center mb-4">
                  <div className={`transform transition-all duration-300 ${
                    isLastInPath ? 'scale-110' : 'scale-100 opacity-75'
                  }`}>
                    <FamilyNode
                      member={member}
                      spouse={spouse}
                      isSelected={selectedMember?.id === member.id || selectedMember?.id === spouse?.id}
                      onSelect={handlePresentationMemberClick}
                      onEdit={onEditMember}
                      onDelete={onDeleteMember}
                      onAddChild={onAddChild}
                      onAddSpouse={onAddSpouse}
                    />
                  </div>
                </div>

                {/* خط الاتصال العمودي - يظهر إذا لم يكن آخر عضو في المسار أو إذا كان له أطفال */}
                {(!isLastInPath || children.length > 0) && (
                  <div className="flex justify-center mb-4">
                    <div className={`w-0.5 h-8 ${isLastInPath ? 'bg-primary-400' : 'bg-gray-400'}`}></div>
                  </div>
                )}

                {/* الأطفال - يظهرون فقط للعضو الأخير في المسار */}
                {children.length > 0 && isLastInPath && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">الأطفال</h3>
                    </div>
                    
                    {/* خط أفقي يربط الأطفال */}
                    {children.length > 1 && (
                      <div className="relative flex justify-center mb-4">
                        <div 
                          className="h-0.5 bg-primary-400"
                          style={{ width: `${Math.min(children.length * 120, 600)}px` }}
                        ></div>
                        {children.map((_, childIndex) => (
                          <div
                            key={childIndex}
                            className="absolute w-0.5 h-4 bg-primary-400 top-0"
                            style={{ 
                              left: `${(childIndex / (children.length - 1)) * 100}%`,
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                        ))}
                      </div>
                    )}

                    {/* خط عمودي للطفل الوحيد */}
                    {children.length === 1 && (
                      <div className="flex justify-center mb-4">
                        <div className="w-0.5 h-4 bg-primary-400"></div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {children.map((child) => {
                        const childSpouse = child.spouseId ? members.find(m => m.id === child.spouseId) : null;
                        const hasGrandchildren = members.some(m => m.parentId === child.id);
                        
                        return (
                          <div 
                            key={child.id} 
                            className={`transform hover:scale-105 transition-all duration-200 ${
                              hasGrandchildren ? 'cursor-pointer ring-2 ring-primary-200 rounded-lg' : ''
                            }`}
                            onClick={() => handlePresentationMemberClick(child)}
                          >
                            <FamilyNode
                              member={child}
                              spouse={childSpouse}
                              isSelected={selectedMember?.id === child.id || selectedMember?.id === childSpouse?.id}
                              onSelect={handlePresentationMemberClick}
                              onEdit={onEditMember}
                              onDelete={onDeleteMember}
                              onAddChild={onAddChild}
                              onAddSpouse={onAddSpouse}
                            />
                            {hasGrandchildren && (
                              <div className="text-center mt-1">
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                  اضغط لرؤية الأطفال
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* رسالة عدم وجود أطفال */}
                {children.length === 0 && isLastInPath && (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-lg mb-4">لا يوجد أطفال لهذا العضو</p>
                    <button
                      onClick={() => onAddChild(member.id)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة طفل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (members.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* رسالة الترحيب - تظهر في الشاشات الكبيرة فقط */}
        <div className="text-center max-w-sm hidden lg:block">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ابدأ ببناء شجرة عائلتك</h3>
          <p className="text-gray-500 mb-4 text-sm">أضف أول عضو في العائلة لبدء بناء الشجرة</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={onAddMember}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              إضافة عضو جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* أدوات التحكم */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 space-y-3">
        {/* زر وضع العرض التقديمي */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-3">
          <button
            onClick={togglePresentationMode}
            className={`p-2 sm:p-3 rounded-lg transition-colors group w-full ${
              isPresentationMode 
                ? 'bg-primary-100 text-primary-600' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={isPresentationMode ? 'عرض الشجرة الكاملة' : 'وضع العرض التقديمي'}
          >
            {isPresentationMode ? (
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>

        {/* أدوات التحكم في التكبير - تظهر فقط في الوضع العادي */}
        {!isPresentationMode && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-3 flex flex-col gap-1 sm:gap-2 zoom-controls mb-3">
            <button
              onClick={toggleGrid}
              className={`p-2 sm:p-3 rounded-lg transition-colors group ${
                showGrid 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={showGrid ? 'إخفاء الشبكة' : 'إظهار الشبكة'}
            >
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors group"
              title="تكبير"
              disabled={zoom >= 3}
            >
              <ZoomIn className={`w-4 h-4 sm:w-5 sm:h-5 ${zoom >= 3 ? 'text-gray-300' : 'text-gray-600 group-hover:text-primary-600'}`} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors group"
              title="تصغير"
              disabled={zoom <= 0.3}
            >
              <ZoomOut className={`w-4 h-4 sm:w-5 sm:h-5 ${zoom <= 0.3 ? 'text-gray-300' : 'text-gray-600 group-hover:text-primary-600'}`} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-lg transition-colors group"
              title="إعادة تعيين الموضع والتكبير"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary-600" />
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="p-1 text-center">
              <Move className="w-3 h-3 text-gray-400 mx-auto mb-1" />
              <span className="text-xs text-gray-500">اسحب للتحريك</span>
            </div>
            <div className="text-xs text-gray-500 text-center px-1 sm:px-2 py-1 bg-gray-50 rounded font-medium">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* منطقة عرض المحتوى */}
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-hidden relative ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        id="family-tree-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* خلفية الشبكة */}
        {showGrid && !isPresentationMode && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
              opacity: 0.3
            }}
          />
        )}
        
        {/* المحتوى */}
        {isPresentationMode ? (
          <div className="w-full h-full overflow-auto bg-gray-50 p-4 sm:p-8">
            {renderPresentationView()}
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ 
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div className="min-w-max">
              {buildTree(rootMemberId)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeView;