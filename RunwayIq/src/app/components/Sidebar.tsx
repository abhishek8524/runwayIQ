import { LayoutGrid, Activity, SlidersHorizontal, MessageCircle, List } from 'lucide-react';
import { Link, useLocation } from 'react-router';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Dashboard' },
  { path: '/forecast', icon: Activity, label: 'Forecast' },
  { path: '/transactions', icon: List, label: 'Transactions' },
  { path: '/what-if', icon: SlidersHorizontal, label: 'What-if' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="w-[54px] bg-white border-r-[0.5px] border-[#E5E7EB] flex flex-col items-center py-4 gap-3">
      <div className="mb-4 text-[10px] text-[#1A56DB]" style={{ fontWeight: 600 }}>
        RIQ
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 w-[34px] py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: isActive ? '#EBF0FF' : 'transparent' }}
          >
            <Icon 
              size={16} 
              style={{ color: isActive ? '#1A56DB' : '#9CA3AF' }}
              strokeWidth={2}
            />
            <span 
              className="text-[7px] text-center leading-tight"
              style={{ color: isActive ? '#1A56DB' : '#9CA3AF' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
