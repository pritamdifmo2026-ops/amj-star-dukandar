import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../notificationApi';
import type { INotification } from '../notificationApi';
import { useAppSelector } from '@/store/hooks';
import { useSocket } from '@/shared/contexts/SocketContext';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const NotificationBell: React.FC = () => {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [localList, setLocalList] = useState<INotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: fetched = [] } = useQuery<INotification[]>({
    queryKey: ['notifications'],
    queryFn: notificationApi.getAll,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  // Sync fetched data into local list
  useEffect(() => {
    setLocalList(fetched);
  }, [fetched]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;
    const handler = (notification: INotification) => {
      setLocalList((prev) => [notification, ...prev]);
    };
    socket.on('bell_notification', handler);
    return () => { socket.off('bell_notification', handler); };
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isAuthenticated) return null;

  const unreadCount = localList.filter((n) => !n.isRead).length;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setLocalList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {}
  };

  const handleClickNotification = async (n: INotification) => {
    try {
      if (!n.isRead) {
        await notificationApi.markRead(n._id);
        setLocalList((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      }
      if (n.link) {
        navigate(n.link);
      }
      setOpen(false);
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        className="relative flex items-center justify-center bg-transparent border-none text-heading cursor-pointer p-1 hover:text-primary transition-colors"
        onClick={() => setOpen((p) => !p)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-surface leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-border rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] z-[1100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-heading text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary bg-transparent border-none cursor-pointer hover:underline p-0"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {localList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-body text-sm gap-2">
                <Bell size={28} className="opacity-30" />
                <span>No notifications yet</span>
              </div>
            ) : (
              localList.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !n.isRead ? 'bg-blue-50/60' : 'bg-white'
                  }`}
                  style={{ background: undefined }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-0.5 ${!n.isRead ? 'text-heading' : 'text-body'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-body line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1 shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-body/60 mt-1">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
