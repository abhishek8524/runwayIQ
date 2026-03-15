interface CategoryPillProps {
  category: string;
  active?: boolean;
}

const CATEGORY_CONFIG: Record<string, { bg: string; text: string }> = {
  revenue:   { bg: '#D1FAE5', text: '#059669' },
  cogs:      { bg: '#EBF0FF', text: '#1A56DB' },
  opex:      { bg: '#FEF3C7', text: '#D97706' },
  payroll:   { bg: '#EEEDFE', text: '#7F77DD' },
  marketing: { bg: '#FCE7F3', text: '#DB2777' },
  all:       { bg: '#F3F4F6', text: '#374151' },
};

const FALLBACK = { bg: '#F3F4F6', text: '#6B7280' };

export function CategoryPill({ category, active = false }: CategoryPillProps) {
  const base = CATEGORY_CONFIG[category] ?? FALLBACK;
  const activeAll = active && category === 'all';

  return (
    <span
      className="inline-block px-3 py-1 rounded-md text-[11px] capitalize"
      style={{
        backgroundColor: activeAll ? '#EBF0FF' : base.bg,
        color: activeAll ? '#1A56DB' : base.text,
        fontWeight: 500,
      }}
    >
      {category}
    </span>
  );
}
