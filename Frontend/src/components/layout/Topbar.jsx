import { useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Box, Typography, Avatar,
  Chip, InputBase, Tooltip,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useUser } from '../../context/UserContext';
import { getInitials, roleLabel } from '../../utils';

const TITLES = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Task activities',
  '/stakeholders': 'Stakeholders & team',
  '/profile': 'My profile',
  '/log': 'Activity log',
};

export default function Topbar({ onMenuOpen }) {
  const { user } = useUser();
  const location = useLocation();

  const title = Object.entries(TITLES).reduce(
    (acc, [path, label]) => (location.pathname.startsWith(path) ? label : acc),
    'ProManage'
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        backdropFilter: 'blur(10px)',
        background: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton edge="start" onClick={onMenuOpen} sx={{ display: { lg: 'none' } }}>
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="caption" color="textSecondary" fontWeight={500}>
            ProManage / {title === 'Dashboard' ? 'Overview' : title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Search (decorative quick filter) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.6,
            borderRadius: 2,
            background: '#f1f3f5',
            border: '1px solid var(--border)',
            minWidth: 220,
          }}
        >
          <SearchRoundedIcon fontSize="small" color="disabled" />
          <InputBase placeholder="Search…" size="small" sx={{ fontSize: 13, width: '100%' }} />
        </Box>

        <Tooltip title="Notifications">
          <IconButton sx={{ position: 'relative' }}>
            <NotificationsNoneRoundedIcon />
            <Box
              sx={{
                position: 'absolute', top: 10, right: 11,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--danger)',
              }}
            />
          </IconButton>
        </Tooltip>

        <Tooltip title="Profile">
          <IconButton sx={{ display: 'flex', gap: 1, borderRadius: 2, pl: 0.8 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
              {getInitials(user?.first_name, user?.last_name)}
            </Avatar>
            <Chip label={roleLabel(user)} size="small" variant="outlined"
              sx={{ display: { xs: 'none', sm: 'flex' }, fontWeight: 600, color: 'var(--muted)' }} />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}