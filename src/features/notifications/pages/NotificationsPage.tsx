import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ArrowLeft, CheckCheck, ShoppingBag, MessageSquare,
  FileText, CreditCard, Clock, AlertTriangle, Sparkles,
} from 'lucide-react';
import { notificationApi, type INotification } from '../notificationApi';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function dayKey(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatFullDate(dateStr);
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  message:                <MessageSquare size={16} />,
  inquiry:                <MessageSquare size={16} />,
  quotation:              <FileText size={16} />,
  counter_offer:          <FileText size={16} />,
  order_status:           <ShoppingBag size={16} />,
  subscription_expired:   <CreditCard size={16} />,
  subscription_expiring:  <Clock size={16} />,
  admin_alert:            <AlertTriangle size={16} />,
  lead_matched:           <Sparkles size={16} />,
};

const TYPE_COLOR: Record<string, string> = {
  message:                'bg-blue-100 text-blue-600',
  inquiry:                'bg-blue-100 text-blue-600',
  quotation:              'bg-purple-100 text-purple-600',
  counter_offer:          'bg-purple-100 text-purple-600',
  order_status:           'bg-green-100 text-green-600',
  subscription_expired:   'bg-red-100 text-red-600',
  subscription_expiring:  'bg-amber-100 text-amber-600',
  admin_alert:            'bg-orange-100 text-orange-600',
  lead_matched:           'bg-orange-100 text-orange-600',
};

const PAGE_SIZE = 20;

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await notificationApi.getPaged(p, PAGE_SIZE);
      if (p === 1) {
        setNotifications(res.notifications);
      } else {
        setNotifications(prev => [...prev, ...res.notifications]);
      }
      setTotal(res.total);
      setPage(p);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const handleClick = async (n: INotification) => {
    if (!n.isRead) {
      await notificationApi.markRead(n._id).catch(() => {});
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  // Group notifications by calendar day
  const groups: { label: string; items: INotification[] }[] = [];
  for (const n of notifications) {
    const label = dayKey(n.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(n);
    } else {
      groups.push({ label, items: [n] });
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasMore = notifications.length < total;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#eef2f6] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] bg-[#f1f5f9] text-[#475569] border-none cursor-pointer hover:bg-[#e2e8f0] transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-[#0f172a] m-0 leading-tight">All Notifications</h1>
          {total > 0 && (
            <p className="text-xs text-[#64748b] m-0">{total} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/20 rounded-[8px] px-3 py-1.5 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
          >
            <CheckCheck size={14} />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-16">
        {!initialLoaded ? (
          <div className="flex flex-col gap-3 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[12px] p-4 flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#f1f5f9] shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 bg-[#f1f5f9] rounded w-3/4" />
                  <div className="h-3 bg-[#f1f5f9] rounded w-full" />
                  <div className="h-2 bg-[#f1f5f9] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#64748b]">
            <Bell size={48} className="opacity-20" />
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2 px-1">{group.label}</p>
                <div className="flex flex-col gap-1">
                  {group.items.map(n => {
                    const icon = TYPE_ICON[n.type] ?? <Bell size={16} />;
                    const iconCls = TYPE_COLOR[n.type] ?? 'bg-[#f1f5f9] text-[#475569]';
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleClick(n)}
                        className={`w-full text-left rounded-[12px] p-4 flex gap-3 items-start transition-all cursor-pointer border ${
                          !n.isRead
                            ? 'bg-blue-50/70 border-blue-100 hover:bg-blue-50'
                            : 'bg-white border-[#f1f5f9] hover:border-[#e2e8f0] hover:bg-[#fafbfc]'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconCls}`}>
                          {icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold m-0 mb-0.5 ${!n.isRead ? 'text-[#0f172a]' : 'text-[#334155]'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-[#475569] m-0 leading-relaxed">{n.body}</p>
                          <p className="text-[11px] text-[#94a3b8] m-0 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>

                        {/* Unread dot */}
                        {!n.isRead && (
                          <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => loadPage(page + 1)}
                disabled={loading}
                className="w-full py-3 rounded-[12px] border border-[#e2e8f0] bg-white text-sm font-bold text-[#475569] cursor-pointer hover:bg-[#f1f5f9] transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : `Load more (${total - notifications.length} remaining)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
