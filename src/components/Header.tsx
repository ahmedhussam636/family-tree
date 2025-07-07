import React from 'react';
import { Download, Users , Trash2 } from 'lucide-react';

interface HeaderProps {
  familyTreeName: string;
  membersCount: number;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({
  familyTreeName,
  membersCount,
  onExport,
  onClearData,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 relative z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a href="/">
              <img
              src="/jedour-logo.png" 
              alt="جذور - بناء شجرة العائلة" 
              className="h-40 w-auto"
              />
            </a> 
             <div className="border-r border-gray-500 pr-3 h-11 ">
                {/* <h1 className="text-xl font-bold text-gray-900">جذور</h1>
                <p className="text-sm text-gray-500">بناء شجرة العائلة</p> */}
                <span>&nbsp;</span>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{membersCount} عضو</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Members Count */}
            <div className="sm:hidden flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs">
              <Users className="w-3 h-3 text-gray-500" />
              <span className="font-medium text-gray-700">{membersCount}</span>
            </div>

            <button
              onClick={onExport}
              className="btn-primary"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">تصدير PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            {onClearData && membersCount > 0 && (
              <button
                onClick={onClearData}
                className="btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2 text-red-600 hover:bg-red-50"
                title="مسح جميع البيانات"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">مسح</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;