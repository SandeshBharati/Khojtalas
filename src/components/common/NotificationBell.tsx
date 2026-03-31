import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: number, matchId?: number, foundItemId?: number) => {
    markAsRead(id);
    setIsOpen(false);
    if (matchId) {
      navigate(`/matches/${matchId}`);
    } else if (foundItemId) {
      navigate(`/item/${foundItemId}`);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-brand-orange rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-brand-orange hover:text-brand-orange/80 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentNotifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, notif.match_id, notif.found_item_id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 relative ${!notif.read ? 'bg-orange-50/30' : ''}`}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange" />
                    )}
                    
                    <div className="shrink-0 mt-1">
                      {notif.type === 'MATCH_FOUND' ? (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-brand-orange">
                          <Bell className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'ITEM_APPROVED' ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : notif.type === 'ITEM_REJECTED' ? (
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notif.type === 'MATCH_FOUND' ? 'Match Found!' : notif.type === 'ITEM_APPROVED' ? 'Item Approved' : 'Notification'}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2 text-sm text-brand-orange font-medium hover:bg-orange-50 rounded-lg transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
