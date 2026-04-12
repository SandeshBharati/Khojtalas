import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ref, get, update, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { ChevronLeft, MapPin, Calendar, CheckCircle2, AlertCircle, Mail, Phone, User } from 'lucide-react';

export default function MatchDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        // 1. Load match record from Firebase
        const matchSnap = await get(ref(db, `matches/${id}`));
        if (!matchSnap.exists()) {
          setLoading(false);
          return;
        }
        const matchData = matchSnap.val();

        // 2. Load lost and found items
        const [lostSnap, foundSnap] = await Promise.all([
          get(ref(db, `items/${matchData.lostItemId}`)),
          get(ref(db, `items/${matchData.foundItemId}`)),
        ]);

        const lostItem = lostSnap.exists() ? { id: matchData.lostItemId, ...lostSnap.val() } : null;
        const foundItem = foundSnap.exists() ? { id: matchData.foundItemId, ...foundSnap.val() } : null;

        if (!lostItem || !foundItem) {
          setLoading(false);
          return;
        }

        // 3. Load finder profile (the user who reported the found item)
        let finder = null;
        if (foundItem.userId) {
          const finderSnap = await get(ref(db, `users/${foundItem.userId}`));
          if (finderSnap.exists()) {
            const finderData = finderSnap.val();
            finder = {
              name: finderData.name || 'Anonymous',
              email: finderData.email || '',
              phone: finderData.phone || '',
            };
          }
        }

        // 4. Derive the score — matchScore is 0-100 from Gemini, normalize to 0-1
        const rawScore = matchData.matchScore ?? 0;
        const normalized = rawScore > 1 ? rawScore / 100 : rawScore;

        setMatch({
          id,
          scores: {
            text_score: normalized,
            image_score: normalized,
            location_score: normalized,
            time_score: normalized,
            total_score: normalized,
          },
          lost_item: {
            id: lostItem.id,
            title: lostItem.brand ? `${lostItem.brand} ${lostItem.model || ''}`.trim() : lostItem.category,
            category: lostItem.category,
            description: lostItem.description,
            extra_fields: {
              ...(lostItem.color && { color: lostItem.color }),
              ...(lostItem.brand && { brand: lostItem.brand }),
              ...(lostItem.model && { model: lostItem.model }),
              ...(lostItem.serialNumber && { serial: lostItem.serialNumber }),
            },
            location: { from: lostItem.district || '', to: lostItem.city || '' },
            time: lostItem.timeFrom ? `${lostItem.timeFrom}${lostItem.timeTo ? ` - ${lostItem.timeTo}` : ''}` : 'N/A',
            photos: lostItem.photoData ? [lostItem.photoData] : [],
          },
          found_item: {
            id: foundItem.id,
            title: foundItem.brand ? `${foundItem.brand} ${foundItem.model || ''}`.trim() : foundItem.category,
            category: foundItem.category,
            description: foundItem.description,
            extra_fields: {
              ...(foundItem.color && { color: foundItem.color }),
              ...(foundItem.brand && { brand: foundItem.brand }),
              ...(foundItem.model && { model: foundItem.model }),
              ...(foundItem.serialNumber && { serial: foundItem.serialNumber }),
            },
            location: { point: foundItem.district ? `${foundItem.district}, ${foundItem.city || ''}` : 'N/A' },
            time: foundItem.timeFrom || 'N/A',
            photos: foundItem.photoData ? [foundItem.photoData] : [],
            finder,
          },
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to load match details:', error);
        toast.error('Failed to load match details');
        setLoading(false);
      }
    };

    if (id) fetchMatch();
  }, [id]);

  const handleResolve = async () => {
    if (!window.confirm("Are you sure this is your item? This will mark your report as resolved and notify the finder.")) {
      return;
    }
    
    setResolving(true);
    try {
      // Mark the lost item as resolved
      await update(ref(db, `items/${match.lost_item.id}`), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
      });
      // Mark the match as resolved
      await update(ref(db, `matches/${id}`), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
      });
      toast.success("Item marked as resolved! The finder has been notified.");
      navigate('/user');
    } catch (error) {
      console.error('Failed to resolve item:', error);
      toast.error("Failed to resolve item");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Match not found</h2>
        <p className="text-slate-500 mb-6">This match may have been removed or you don't have permission to view it.</p>
        <Link to="/" className="text-brand-orange hover:underline">Return Home</Link>
      </div>
    );
  }

  const scorePct = Math.round(match.scores.total_score * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/notifications" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Notifications
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Match Details</h1>
          <p className="text-slate-500 mt-1">Compare your lost item with the found item.</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${scorePct >= 95 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {scorePct >= 95 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {scorePct}% Match Confidence
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Lost Item */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">YOUR LOST ITEM</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
              {match.lost_item.photos?.[0] ? (
                <img src={match.lost_item.photos[0]} alt="Lost item" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No photo</div>
              )}
            </div>
            
            <div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md mb-2">
                {match.lost_item.category}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{match.lost_item.title}</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-slate-600">
                <Calendar className="w-5 h-5 shrink-0 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-900 block">Lost Time</span>
                  {match.lost_item.time}
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-5 h-5 shrink-0 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-900 block">Route</span>
                  {match.lost_item.location.from} → {match.lost_item.location.to}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-sm">Description</h4>
              <p className="text-slate-600 text-sm">{match.lost_item.description}</p>
            </div>

            {Object.keys(match.lost_item.extra_fields || {}).length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-sm">Extra Details</h4>
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(match.lost_item.extra_fields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-slate-500 uppercase block">{key}</span>
                      <span className="text-sm font-medium text-slate-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Found Item */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-brand-orange/10 px-6 py-4 border-b border-brand-orange/20">
            <h2 className="font-bold text-brand-orange">ITEM FOUND</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
              {match.found_item.photos?.[0] ? (
                <img src={match.found_item.photos[0]} alt="Found item" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No photo</div>
              )}
            </div>
            
            <div>
              <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md mb-2">
                {match.found_item.category}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{match.found_item.title}</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-slate-600">
                <Calendar className="w-5 h-5 shrink-0 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-900 block">Found Time</span>
                  {match.found_item.time}
                </div>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="w-5 h-5 shrink-0 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-900 block">Location</span>
                  {match.found_item.location.point}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-sm">Description</h4>
              <p className="text-slate-600 text-sm">{match.found_item.description}</p>
            </div>

            {Object.keys(match.found_item.extra_fields || {}).length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2 text-sm">Extra Details</h4>
                <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-y-2 gap-x-4">
                  {Object.entries(match.found_item.extra_fields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-slate-500 uppercase block">{key}</span>
                      <span className="text-sm font-medium text-slate-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">MATCH SCORE BREAKDOWN</h3>
        
        <div className="space-y-4 max-w-2xl">
          {[
            { label: 'Text similarity', score: match.scores.text_score },
            { label: 'Image similarity', score: match.scores.image_score },
            { label: 'Location match', score: match.scores.location_score },
            { label: 'Time match', score: match.scores.time_score },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-slate-600">{item.label}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-brand-orange h-2 rounded-full" 
                  style={{ width: `${item.score * 100}%` }}
                />
              </div>
              <div className="w-12 text-right text-sm font-bold text-slate-900">
                {Math.round(item.score * 100)}%
              </div>
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-4">
            <div className="w-32 text-base font-bold text-slate-900">Overall match</div>
            <div className="flex-1 bg-slate-100 rounded-full h-3">
              <div 
                className="bg-brand-orange h-3 rounded-full" 
                style={{ width: `${match.scores.total_score * 100}%` }}
              />
            </div>
            <div className="w-12 text-right text-base font-black text-brand-orange">
              {Math.round(match.scores.total_score * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section (Only if score >= 95%) */}
      {scorePct >= 95 && match.found_item.finder && (
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-orange" />
            CONTACT THE FINDER
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Name</div>
                  <div className="font-medium">{match.found_item.finder.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Email</div>
                  <a href={`mailto:${match.found_item.finder.email}`} className="font-medium hover:text-brand-orange transition-colors">
                    {match.found_item.finder.email}
                  </a>
                </div>
              </div>
              
              {match.found_item.finder.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Phone</div>
                    <a href={`tel:${match.found_item.finder.phone}`} className="font-medium hover:text-brand-orange transition-colors">
                      {match.found_item.finder.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
              <p className="text-sm text-slate-300 mb-4">
                Once you have successfully recovered your item from the finder, please mark this report as resolved.
              </p>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="w-full py-3 bg-brand-orange hover:bg-[#d04e1a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resolving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as Resolved
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
