import { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Chip, Stack, Divider } from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import Loading from './common/Loading';
import PageHeader from './common/PageHeader';
import { formatDate, fullName, getInitials, roleLabel } from '../utils';

const INFO = [
  { icon: BadgeRoundedIcon, label: 'Username', key: 'username' },
  { icon: EmailRoundedIcon, label: 'Email', key: 'email' },
  { icon: CalendarMonthRoundedIcon, label: 'Joined', key: 'date_joined' },
];

export default function Profile() {
  const { user, loading, logout } = useUser();
  const [tasksDone, setTasksDone] = useState('—');
  const [projectsMade, setProjectsMade] = useState('—');

  useEffect(() => {
    if (!user) return;
    api.get('/api/dashboard/')
      .then((res) => {
        setTasksDone(res.data.my_tasks);
        setProjectsMade(res.data.my_projects);
      })
      .catch(() => {});
  }, [user]);

  if (loading || !user) return <Loading />;

  return (
    <div className="page">
      <PageHeader title="My profile" subtitle="Your account and workspace overview." />

      <Box className="glass" sx={{ maxWidth: 720, overflow: 'hidden' }}>
        <div className="profile-cover" />

        <Box sx={{ p: 3, mt: -4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: 92, height: 92, fontSize: 30, fontWeight: 700, background: 'var(--primary)',
              border: '4px solid var(--card)' }}>
              {getInitials(user.first_name, user.last_name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="h4" fontWeight={700}>{fullName(user)}</Typography>
              <Chip label={roleLabel(user)} variant="outlined" sx={{ mt: 0.5, fontWeight: 600,
                color: user.is_staff ? 'var(--primary)' : 'var(--muted)',
                borderColor: user.is_staff ? '#bfdbfe' : 'var(--border)' }} />
            </Box>
            <Button variant="outlined" color="error" onClick={logout} startIcon={<LogoutRoundedIcon />} size="large">
              Sign out
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={2}>
            {INFO.map(({ icon: Icon, label, key }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'var(--surface-2)',
                  display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>
                  <Icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>{label}</Typography>
                  <Typography fontWeight={700}>
                    {key === 'date_joined' ? formatDate(user.date_joined) : user[key] || '—'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box sx={{ p: 2, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <Typography fontSize={30} fontWeight={800} color="var(--primary)">{tasksDone}</Typography>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>Tasks assigned to me</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <Typography fontSize={30} fontWeight={800} color="var(--accent)">{projectsMade}</Typography>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>Projects I created</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
}