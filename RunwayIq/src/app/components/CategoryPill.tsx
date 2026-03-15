interface CategoryPillProps {
  category: 'revenue' | 'cogs' | 'opex' | 'payroll' | 'all';
  active?: boolean;
}

export function CategoryPill({ category, active = false }: CategoryPillProps) {
  const config = {
    revenue: { bg: '#D1FAE5', text: '#059669' },
    cogs: { bg: '#EBF0FF', text: '#1A56DB' },
    opex: { bg: '#FEF3C7', text: '#D97706' },
    payroll: { bg: '#EEEDFE', text: '#7F77DD' },
    all: { bg: '#F3F4F6', text: '#374151' },
  };
  
  const { bg, text } = config[category];
  
  return (
    <span
      className={`inline-block px-3 py-1 rounded-md text-[11px] capitalize ${
        active && category === 'all' ? 'bg-[#EBF0FF]' : ''
      }`}
      style={{
        backgroundColor: active && category === 'all' ? '#EBF0FF' : bg,
        color: active && category === 'all' ? '#1A56DB' : text,
        fontWeight: 500
      }}
    >
      {category}
    </span>
  );
}
