import { Settings } from 'lucide-react';
import { Link } from 'react-router';

interface TopNavProps {
  breadcrumb?: string;
}

export function TopNav({ breadcrumb }: TopNavProps) {
  return (
    <div className="h-[44px] bg-white border-b-[0.5px] border-[#E5E7EB] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="text-[10px] text-[#1A56DB]" style={{ fontWeight: 600 }}>
          RUNWAYIQ
        </div>
        {breadcrumb && (
          <>
            <span className="text-[#9CA3AF]">/</span>
            <span className="text-[12px]" style={{ color: '#374151' }}>
              {breadcrumb}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-[7px] h-[7px] rounded-full bg-[#E24B4A] absolute -top-1 -right-1" />
          <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center">
            <span className="text-[10px]" style={{ color: '#374151' }}>🔔</span>
          </div>
        </div>
        
        <div 
          className="px-3 py-1 rounded-full text-[10px]"
          style={{ backgroundColor: '#F3F4F6', color: '#374151', fontWeight: 500 }}
        >
          Acme Corp
        </div>
        
        <Link
          to="/settings"
          className="px-3 py-1.5 rounded-md text-white text-[11px] flex items-center gap-1.5"
          style={{ backgroundColor: '#1A56DB', fontWeight: 500 }}
        >
          <Settings size={12} />
          Settings
        </Link>
      </div>
    </div>
  );
}
