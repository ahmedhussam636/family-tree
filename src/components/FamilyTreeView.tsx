import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Plus, Presentation, Grid3X3, ChevronLeft, Home } from 'lucide-react';
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
  const [animatingChildren, setAnimatingChildren] = useState<string[]>([]);
  const [showingChildren, setShowingChildren] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth / 2 - containerRef.current.clientWidth / 2,
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const togglePresentationMode = () => {
    if (!isPresentationMode) {
      // بدء وضع العرض التقديمي من الجد الأكبر
      setPresentationPath([rootMemberId]);
      setAnimatingChildren([]);
      setShowingChildren([]);
    } else {
      // إنهاء وضع العرض التقديمي
      setPresentationPath([]);
      setAnimatingChildren([]);
      setShowingChildren([]);
    }
    setIsPresentationMode(!isPresentationMode);
  };

  const handlePresentationMemberClick = (member: FamilyMember) => {
    if (!isPresentationMode) {
      onSelectMember(member);
      return;
    }

    // في وضع العرض التقديمي
    const children = members.filter(m => m.parentId === member.id);
    
    if (children.length > 0) {
      // إذا كان العضو في المسار الحالي، انتقل إليه
      const memberIndex = presentationPath.indexOf(member.id);
      if (memberIndex !== -1) {
        // قطع المسار عند هذا العضو
        setPresentationPath(presentationPath.slice(0, memberIndex + 1));
        setAnimatingChildren([]);
        setShowingChildren([]);
      } else {
        // أضف العضو للمسار
        setPresentationPath(prev => [...prev, member.id]);
        
        // إظهار الأطفال فوراً
        setShowingChildren(children.map(child => child.id));
        
        // تشغيل الأنيميشن للأطفال بتأخير متدرج
        setTimeout(() => {
          setAnimatingChildren(children.map(child => child.id));
        }, 100);
        
        // إزالة الأنيميشن بعد انتهائه
        setTimeout(() => {
          setAnimatingChildren([]);
        }, 1500);
      }
    } else {
      // إذا لم يكن له أطفال، اختره فقط
      onSelectMember(member);
    }
  };

  const goBackInPresentation = () => {
    if (presentationPath.length > 1) {
      setPresentationPath(prev => prev.slice(0, -1));
      setAnimatingChildren([]);
      setShowingChildren([]);
    }
  };

  const goToRootInPresentation = () => {
    setPresentationPath([rootMemberId]);
    setAnimatingChildren([]);
    setShowingChildren([]);
  };

  const buildTree = (memberId: string, level: number = 0): React.ReactNode => {
    const member = members.find(m => m.id === memberId);
    if (!member) return null;

    const directChildren = members.filter(m => m.parentId === memberId);
    const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;

    return (
      <div key={member.id} className="flex flex-col items-center relative">
        {/* مستوى الوالدين */}
        <div className="flex items-center justify-center mb-4 sm:mb-8 relative z-10">
          <FamilyNode
            member={member}
            spouse={spouse}
            isSelected={selectedMember?.id === member.id || selectedMember?.id === spouse?.id}
            onSelect={onSelectMember}
            onEdit={onEditMember}
            onDelete={onDeleteMember}
            onAddChild={onAddChild}
            onAddSpouse={onAddSpouse}
            isPresentationMode={false}
          />
        </div>

        {/* الأطفال */}
        {directChildren.length > 0 && (
          <div className="flex flex-col items-center w-full relative">
            {/* خط الاتصال العمودي من الوالدين */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-6 sm:h-12 bg-gray-400 z-0"></div>
            
            {/* خط أفقي يربط جميع الأطفال */}
            {directChildren.length > 1 && (
              <div className="relative mt-6 sm:mt-12 mb-4 sm:mb-8">
                <div 
                  className="absolute top-0 h-0.5 bg-gray-400 z-0"
                  style={{ 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${(directChildren.length - 1) * (window.innerWidth < 640 ? 200 : 350)}px`
                  }}
                ></div>
                
                {directChildren.map((_, index) => {
                  const spacing = window.innerWidth < 640 ? 200 : 350;
                  const totalWidth = (directChildren.length - 1) * spacing;
                  const startX = -totalWidth / 2;
                  const childX = startX + (index * spacing);
                  
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-4 sm:h-8 bg-gray-400 top-0 z-0"
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
              <div className="absolute top-6 sm:top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-4 sm:h-8 bg-gray-400 z-0"></div>
            )}
            
            {/* عرض جميع الأطفال في صف واحد */}
            <div 
              className="flex items-start justify-center relative z-10 flex-wrap sm:flex-nowrap"
              style={{ 
                gap: window.innerWidth < 640 ? '50px' : '100px',
                marginTop: directChildren.length > 1 ? (window.innerWidth < 640 ? '40px' : '80px') : (window.innerWidth < 640 ? '40px' : '80px')
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
      <div className="flex flex-col items-center justify-start min-h-full p-6 sm:p-12">
        {/* شريط التنقل */}
        <div className="w-full max-w-5xl mb-12">
          <div className="flex items-center justify-between bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              {presentationPath.length > 1 && (
                <button
                  onClick={goBackInPresentation}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-105"
                  title="العودة للخلف"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              )}
              <button
                onClick={goToRootInPresentation}
                className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-105"
                title="العودة للجد الأكبر"
              >
                <Home className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                عرض تقديمي للعائلة
              </h2>
              <p className="text-sm text-gray-500">
                الجيل {presentationPath.length}
              </p>
            </div>
            
            <button
              onClick={togglePresentationMode}
              className="btn-secondary text-sm px-6 py-3"
            >
              <Grid3X3 className="w-5 h-5" />
              عرض الشجرة
            </button>
          </div>
        </div>

        {/* عرض المسار العمودي */}
        <div className="w-full max-w-4xl space-y-16">
          {presentationPath.map((memberId, index) => {
            const member = members.find(m => m.id === memberId);
            if (!member) return null;

            const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;
            const children = members.filter(m => m.parentId === memberId);
            const isLastInPath = index === presentationPath.length - 1;

            return (
              <div key={`${memberId}-${index}`} className="relative">
                {/* العضو الحالي */}
                <div className="flex justify-center mb-12">
                  <div className={`transform transition-all duration-700 ${
                    isLastInPath ? 'scale-110 shadow-2xl' : 'scale-100 opacity-75'
                  }`}>
                    <div 
                      className={`${isLastInPath && children.length > 0 ? 'cursor-pointer ring-4 ring-primary-200 rounded-2xl p-2 hover:ring-primary-400 transition-all duration-300' : ''}`}
                      onClick={() => children.length > 0 && handlePresentationMemberClick(member)}
                    >
                      <FamilyNode
                        member={member}
                        spouse={spouse}
                        isSelected={selectedMember?.id === member.id || selectedMember?.id === spouse?.id}
                        onSelect={onSelectMember}
                        onEdit={onEditMember}
                        onDelete={onDeleteMember}
                        onAddChild={onAddChild}
                        onAddSpouse={onAddSpouse}
                        isPresentationMode={true}
                      />
                    </div>
                  </div>
                </div>

                {/* خط الاتصال العمودي المتحرك - يظهر فقط إذا كان هناك أطفال وتم الضغط */}
                {children.length > 0 && isLastInPath && showingChildren.some(childId => children.find(c => c.id === childId)) && (
                  <div className="flex justify-center mb-12">
                    <div className="w-2 h-16 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full animate-pulse shadow-lg"></div>
                  </div>
                )}

                {/* الأطفال - يظهرون فقط للعضو الأخير في المسار وبعد الضغط */}
                {children.length > 0 && isLastInPath && showingChildren.some(childId => children.find(c => c.id === childId)) && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold mb-1">الأطفال</h3>
                        <p className="text-primary-100 text-sm">({children.length} أطفال)</p>
                      </div>
                    </div>
                    
                    {/* خط أفقي متحرك يربط الأطفال */}
                    {children.length > 1 && (
                      <div className="relative flex justify-center mb-12">
                        <div 
                          className="h-2 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 rounded-full shadow-lg animate-line-draw"
                          style={{ width: `${Math.min(children.length * 180, 720)}px` }}
                        ></div>
                        {children.map((_, childIndex) => (
                          <div
                            key={childIndex}
                            className="absolute w-2 h-8 bg-primary-500 top-0 rounded-full shadow-md animate-bounce-in"
                            style={{ 
                              left: `${(childIndex / (children.length - 1)) * 100}%`,
                              transform: 'translateX(-50%)',
                              animationDelay: `${childIndex * 150}ms`
                            }}
                          ></div>
                        ))}
                      </div>
                    )}

                    {/* خط عمودي للطفل الوحيد */}
                    {children.length === 1 && (
                      <div className="flex justify-center mb-8">
                        <div className="w-2 h-8 bg-primary-500 rounded-full shadow-lg animate-bounce-in"></div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {children.map((child, childIndex) => {
                        const childSpouse = child.spouseId ? members.find(m => m.id === child.spouseId) : null;
                        const hasGrandchildren = members.some(m => m.parentId === child.id);
                        const isAnimating = animatingChildren.includes(child.id);
                        
                        return (
                          <div 
                            key={child.id} 
                            className={`transform transition-all duration-800 ${
                              isAnimating 
                                ? 'animate-bounce-in opacity-100 scale-100' 
                                : 'opacity-100 scale-100'
                            } ${
                              hasGrandchildren ? 'cursor-pointer hover:scale-105 hover:rotate-1' : ''
                            }`}
                            style={{
                              animationDelay: `${childIndex * 150}ms`
                            }}
                            onClick={() => hasGrandchildren && handlePresentationMemberClick(child)}
                          >
                            <div className={`relative ${
                              hasGrandchildren 
                                ? 'ring-2 ring-primary-200 hover:ring-primary-400 rounded-2xl p-3 transition-all duration-500 hover:shadow-xl' 
                                : 'hover:shadow-lg transition-shadow duration-300'
                            }`}>
                              {/* تأثير الإضاءة للكاردات التفاعلية */}
                              {hasGrandchildren && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                              )}
                              
                              <div className="relative z-10">
                                <FamilyNode
                                  member={child}
                                  spouse={childSpouse}
                                  isSelected={selectedMember?.id === child.id || selectedMember?.id === childSpouse?.id}
                                  onSelect={onSelectMember}
                                  onEdit={onEditMember}
                                  onDelete={onDeleteMember}
                                  onAddChild={onAddChild}
                                  onAddSpouse={onAddSpouse}
                                  isPresentationMode={true}
                                />
                              </div>
                            </div>
                            
                            {hasGrandchildren && (
                              <div className="text-center mt-4">
                                <div className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                  <span>اضغط لرؤية الأطفال ✨</span>
                                </div>
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
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 max-w-md mx-auto shadow-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-lg mb-6 font-medium">لا يوجد أطفال لهذا العضو</p>
                      <button
                        onClick={() => onAddChild(member.id)}
                        className="btn-primary text-base px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="w-5 h-5" />
                        إضافة طفل جديد
                      </button>
                    </div>
                  </div>
                )}

                {/* خط الاتصال للعضو التالي في المسار */}
                {index < presentationPath.length - 1 && (
                  <div className="flex justify-center py-12">
                    <div className="w-1 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full shadow-sm"></div>
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
        <div className="text-center max-w-sm lg:block">
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
            className={`p-2 sm:p-3 rounded-lg transition-all duration-300 group w-full ${
              isPresentationMode 
                ? 'bg-primary-100 text-primary-600 scale-110' 
                : 'hover:bg-gray-100 text-gray-600 hover:scale-105'
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 sm:p-3 flex flex-col gap-1 sm:gap-2 zoom-controls">
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
              title="إعادة تعيين"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary-600" />
            </button>
            <div className="text-xs text-gray-500 text-center px-1 sm:px-2 py-1 bg-gray-50 rounded font-medium">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* منطقة عرض المحتوى */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-auto bg-gray-50"
        id="family-tree-container"
        style={{ padding: isPresentationMode ? '0' : (window.innerWidth < 640 ? '20px' : '60px') }}
      >
        {isPresentationMode ? (
          renderPresentationView()
        ) : (
          <div 
            className="min-w-max flex justify-center transition-transform duration-300 ease-in-out"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center top'
            }}
          >
            {buildTree(rootMemberId)}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyTreeView;