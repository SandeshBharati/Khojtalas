import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, CheckCircle2, XCircle, Check, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('All');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Matches') return n.type === 'MATCH_FOUND';
    if (filter === 'Approvals') return n.type === 'ITEM_APPROVED' || n.type === 'ITEM_REJECTED';
    return n.type === 'GENERAL';
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated on your lost and found items.</p>
        </div>
        <button 
          onClick={markAllRead}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Check className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Matches', 'Approvals', 'General'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications yet</h3>
            <p className="text-slate-500">When you get updates, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-6 flex gap-4 relative transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-orange-50/10' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange" />
                )}
                
                <div className="shrink-0">
                  {notif.type === 'MATCH_FOUND' ? (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                      <Bell className="w-5 h-5" />
                    </div>
                  ) : notif.type === 'ITEM_APPROVED' ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : notif.type === 'ITEM_REJECTED' ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h4 className={`text-base truncate ${!notif.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.type === 'MATCH_FOUND' ? 'Match Found!' : notif.type === 'ITEM_APPROVED' ? 'Item Approved' : 'Notification'}
                    </h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(notif.timestamp), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-3">
                    {notif.message}
                  </p>

                  {notif.type === 'MATCH_FOUND' && notif.score !== undefined && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-2">
                      <span>Text: 45%</span>
                      <span>•</span>
                      <span>Image: 25%</span>
                      <span>•</span>
                      <span>Location: 20%</span>
                      <span>•</span>
                      <span>Time: 97%</span>
                    </div>
                  )}

                  <div>
                    {notif.match_id ? (
                      <Link 
                        to={`/matches/${notif.match_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-orange/80"
                      >
                        View Match <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : notif.found_item_id ? (
                      <Link 
                        to={`/item/${notif.found_item_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-orange/80"
                      >
                        View Item <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
