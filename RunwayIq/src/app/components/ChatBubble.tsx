import { ReactNode } from 'react';

interface ChatBubbleProps {
  type: 'user' | 'ai';
  children: ReactNode;
}

export function ChatBubble({ type, children }: ChatBubbleProps) {
  if (type === 'user') {
    return (
      <div className="flex justify-end">
        <div 
          className="max-w-[70%] px-4 py-2 text-white text-[13px]"
          style={{ 
            backgroundColor: '#1A56DB', 
            borderRadius: '10px',
            borderTopRightRadius: '2px'
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-start">
      <div 
        className="max-w-[70%] px-4 py-2 bg-white border border-[#E5E7EB] text-[13px]"
        style={{ 
          color: '#374151',
          borderRadius: '10px',
          borderTopLeftRadius: '2px'
        }}
      >
        {children}
      </div>
    </div>
  );
}
