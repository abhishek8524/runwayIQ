import { ReactNode } from 'react';

interface AgentCardProps {
  title: string;
  subtitle?: string;
  borderColor: string;
  children: ReactNode;
}

export function AgentCard({ title, subtitle, borderColor, children }: AgentCardProps) {
  return (
    <div 
      className="bg-white border-[0.5px] border-[#E5E7EB] p-[14px] overflow-hidden"
      style={{ 
        borderLeft: `2px solid ${borderColor}`,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: '10px',
        borderBottomRightRadius: '10px'
      }}
    >
      <div className="mb-3">
        <div className="text-[12px] mb-0.5" style={{ color: '#374151', fontWeight: 500 }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
