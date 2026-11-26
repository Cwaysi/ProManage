export const getInitials = (first = '', last = '', fallback = 'U') =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.trim().toUpperCase() || fallback;

export const fullName = (u) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || 'User';

export const canManage = (user, ownerId) =>
  Boolean(user?.is_staff) ||
  (ownerId !== undefined && ownerId !== null && ownerId === user?.id);

export const roleLabel = (u) =>
  u?.is_superuser ? 'Super admin' : u?.is_staff ? 'Manager' : 'Staff';

export const computeProgress = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e <= s) return 100;
  const now = Date.now();
  const pct = Math.floor(((now - s) / (e - s)) * 100);
  return Math.min(100, Math.max(0, pct));
};

export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const statusColor = (status = '') => {
  const map = {
    Open: '#059669',
    Pending: '#d97706',
    Ongoing: '#2563eb',
    Closed: '#64748b',
  };
  return map[status] || '#94a3b8';
};

export const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = [
    '#2563eb', '#0e7490', '#0f766e', '#4338ca',
    '#4f46e5', '#64748b', '#0369a1', '#475569',
  ];
  return colors[Math.abs(hash) % colors.length];
};