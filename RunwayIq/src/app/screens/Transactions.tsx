import { CategoryPill } from '../components/CategoryPill';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { api, Transaction } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

const PAGE_SIZE = 25;

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.transactions.getAll()
      .then(setTransactions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Build filter list dynamically from actual categories in data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(transactions.map(t => t.category))).sort();
    return ['all', ...cats];
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter(txn => {
    const matchesSearch = !searchTerm ||
      txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || txn.category === activeFilter;
    return matchesSearch && matchesFilter;
  }), [transactions, searchTerm, activeFilter]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [searchTerm, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalIn  = transactions.filter(t => t.direction === 'inflow').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'outflow').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">

      {/* Header */}
      <div className="mb-2">
        <div className="text-[20px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
          Transactions
        </div>
        <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
          {loading ? 'Loading…' : `${transactions.length} total transactions`}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Inflows',  value: `+${fmtMoney(totalIn)}`,          color: '#059669' },
          { label: 'Total Outflows', value: `-${fmtMoney(totalOut)}`,          color: '#E24B4A' },
          { label: 'Net',            value: fmtMoney(totalIn - totalOut), color: totalIn - totalOut >= 0 ? '#059669' : '#E24B4A' },
        ].map(card => (
          <div key={card.label} className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-4">
            <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: '#9CA3AF', fontWeight: 600 }}>
              {card.label}
            </div>
            <div className="text-[20px]" style={{ color: card.color, fontWeight: 500 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by description or category…"
              className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
              style={{ color: '#374151' }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveFilter(cat)}>
                <CategoryPill category={cat} active={activeFilter === cat} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[12px]" style={{ color: '#9CA3AF' }}>Loading transactions…</div>
        ) : error ? (
          <div className="p-8 text-center text-[12px]" style={{ color: '#E24B4A' }}>{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    {[
                      { label: 'Date',        align: 'text-left'   },
                      { label: 'Description', align: 'text-left'   },
                      { label: 'Category',    align: 'text-left'   },
                      { label: 'Amount',      align: 'text-right'  },
                      { label: 'Type',        align: 'text-center' },
                    ].map(h => (
                      <th
                        key={h.label}
                        className={`px-4 py-3 text-[10px] uppercase tracking-wider ${h.align}`}
                        style={{ color: '#9CA3AF', fontWeight: 600 }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[12px]" style={{ color: '#9CA3AF' }}>
                        No transactions match your search
                      </td>
                    </tr>
                  ) : (
                    paginated.map(txn => (
                      <tr key={txn.id} className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-4 py-3 text-[11px] whitespace-nowrap" style={{ color: '#374151' }}>
                          {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: '#374151' }}>
                          {txn.description ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <CategoryPill category={txn.category} />
                        </td>
                        <td
                          className="px-4 py-3 text-right text-[12px] whitespace-nowrap"
                          style={{ color: txn.direction === 'inflow' ? '#059669' : '#E24B4A', fontWeight: 500 }}
                        >
                          {txn.direction === 'inflow' ? '+' : '-'}{fmtMoney(txn.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="px-2 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: txn.direction === 'inflow' ? '#D1FAE5' : '#FEE2E2',
                              color: txn.direction === 'inflow' ? '#059669' : '#E24B4A',
                              fontWeight: 500,
                            }}
                          >
                            {txn.direction === 'inflow' ? 'Inflow' : 'Outflow'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
                <span className="text-[11px]" style={{ color: '#9CA3AF' }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={14} style={{ color: '#374151' }} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-[11px]" style={{ color: '#9CA3AF' }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className="w-7 h-7 rounded text-[11px] transition-colors"
                        style={{
                          backgroundColor: page === p ? '#1A56DB' : 'transparent',
                          color: page === p ? '#fff' : '#374151',
                          fontWeight: page === p ? 600 : 400,
                        }}
                      >
                        {p}
                      </button>
                    ))
                  }
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={14} style={{ color: '#374151' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
