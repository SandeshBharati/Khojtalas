import React from 'react';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Notification } from '../../hooks/useNotifications';

interface MatchToastProps {
  notification: Notification;
  t: string | number;
}

export default function MatchToast({ notification, t }: MatchToastProps) {
  const navigate = useNavigate();

  const handleView = () => {
    toast.dismiss(t);
    if (notification.match_id) {
      navigate(`/matches/${notification.match_id}`);
    } else if (notification.found_item_id) {
      navigate(`/item/${notification.found_item_id}`);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white border-[0.5px] border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-5">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange" />
      
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-brand-orange font-bold">
            <Bell className="w-4 h-4" />
            <span>Match found!</span>
          </div>
          <button 
            onClick={() => toast.dismiss(t)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-slate-700 text-sm mb-3">
          Someone found your "{notification.lost_item_title || 'item'}"
        </p>
        
        {notification.score !== undefined && (
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Confidence: {notification.score_pct}</span>
              <span className="font-bold text-slate-700">{Math.round(notification.score * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-brand-orange h-1.5 rounded-full" 
                style={{ width: `${notification.score * 100}%` }}
              />
            </div>
          </div>
        )}
        
        <button 
          onClick={handleView}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-brand-orange font-medium text-sm rounded-lg transition-colors border border-slate-200"
        >
          View Found Item
        </button>
      </div>
    </div>
  );
}
