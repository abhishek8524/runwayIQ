import { CategoryPill } from '../components/CategoryPill';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Transaction } from '../../lib/api';
import { fmtMoney } from '../../lib/format';

type FilterCategory = 'all' | 'revenue' | 'cogs' | 'opex' | 'payroll';

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    api.transactions.getAll()
      .then(setTransactions)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(txn => {
    const matchesSearch = txn.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || txn.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const totalIn = transactions.filter(t => t.direction === 'inflow').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'outflow').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">
      <div className="mb-6">
        <div className="text-[20px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
          Transactions
        </div>
        <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
          All financial activity
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
              style={{ color: '#374151' }}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'revenue', 'cogs', 'opex', 'payroll'] as FilterCategory[]).map(cat => (
              <button key={cat} onClick={() => setActiveFilter(cat)}>
                <CategoryPill category={cat} active={activeFilter === cat} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[12px]" style={{ color: '#9CA3AF' }}>Loading transactions…</div>
        ) : error ? (
          <div className="p-8 text-center text-[12px]" style={{ color: '#E24B4A' }}>{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {['Date', 'Description', 'Category', 'Amount', 'Direction'].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] uppercase tracking-wider ${h === 'Amount' ? 'text-right' : h === 'Direction' ? 'text-center' : 'text-left'}`}
                      style={{ color: '#9CA3AF', fontWeight: 600 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[12px]" style={{ color: '#9CA3AF' }}>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map(txn => (
                    <tr key={txn.id} className="border-t border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-3 text-[11px]" style={{ color: '#374151' }}>
                        {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: '#374151' }}>
                        {txn.description}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryPill category={txn.category as FilterCategory} />
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[12px]"
                        style={{ color: txn.direction === 'inflow' ? '#059669' : '#E24B4A', fontWeight: 500 }}
                      >
                        {txn.direction === 'inflow' ? '+' : '-'}{fmtMoney(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded ${txn.direction === 'inflow' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEE2E2] text-[#E24B4A]'}`}
                          style={{ fontWeight: 500 }}
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
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
          <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Total Inflows</div>
          <div className="text-[20px] text-[#059669]" style={{ fontWeight: 500 }}>
            +{fmtMoney(totalIn)}
          </div>
        </div>
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
          <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Total Outflows</div>
          <div className="text-[20px] text-[#E24B4A]" style={{ fontWeight: 500 }}>
            -{fmtMoney(totalOut)}
          </div>
        </div>
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
          <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Net</div>
          <div
            className="text-[20px]"
            style={{ color: totalIn - totalOut >= 0 ? '#059669' : '#E24B4A', fontWeight: 500 }}
          >
            {fmtMoney(totalIn - totalOut)}
          </div>
        </div>
      </div>
    </div>
  );
}
