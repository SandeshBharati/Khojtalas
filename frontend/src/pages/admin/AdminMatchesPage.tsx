import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase';
import { Link as LinkIcon, Search, ArrowRight, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface MatchData {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number;
  status: string;
  createdAt: any;
  lostItemTitle?: string;
  foundItemTitle?: string;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesSnap = await get(ref(db, 'matches'));
        const itemsSnap = await get(ref(db, 'items'));

        const itemsMap: Record<string, any> = {};
        if (itemsSnap.exists()) {
          itemsSnap.forEach((child) => {
            itemsMap[child.key!] = child.val();
          });
        }

        const matchList: MatchData[] = [];
        if (matchesSnap.exists()) {
          matchesSnap.forEach((child) => {
            const val = child.val();
            const lostItem = itemsMap[val.lostItemId];
            const foundItem = itemsMap[val.foundItemId];
            matchList.push({
              id: child.key!,
              lostItemId: val.lostItemId,
              foundItemId: val.foundItemId,
              score: val.score || val.total_score || 0,
              status: val.status || 'pending',
              createdAt: val.createdAt,
              lostItemTitle: lostItem ? `${lostItem.brand || ''} ${lostItem.model || lostItem.category || 'Unknown'}`.trim() : 'Unknown Item',
              foundItemTitle: foundItem ? `${foundItem.brand || ''} ${foundItem.model || foundItem.category || 'Unknown'}`.trim() : 'Unknown Item',
            });
          });
        }

        matchList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMatches(matchList);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filtered = matches.filter((m) =>
    !search ||
    m.lostItemTitle?.toLowerCase().includes(search.toLowerCase()) ||
    m.foundItemTitle?.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full capitalize">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E85D24]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
          <p className="text-sm text-gray-500 mt-1">{matches.length} total match{matches.length !== 1 ? 'es' : ''} found</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search matches by item name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E85D24]/20 focus:border-[#E85D24] outline-none bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
          <p className="text-sm text-gray-500 mt-1">Matches will appear here when the system finds potential item matches.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Match ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Lost Item</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4"></th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Found Item</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Score</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    {m.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/admin/items/${m.lostItemId}`} className="text-sm font-medium text-gray-900 hover:text-[#E85D24]">
                      {m.lostItemTitle}
                    </Link>
                  </td>
                  <td className="px-2 py-4 text-center">
                    <ArrowRight className="w-4 h-4 text-gray-300 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/admin/items/${m.foundItemId}`} className="text-sm font-medium text-gray-900 hover:text-[#E85D24]">
                      {m.foundItemTitle}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${m.score >= 0.8 ? 'text-green-600' : m.score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                      {(m.score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(m.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/matches/${m.id}`}
                      className="text-sm font-medium text-[#E85D24] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
