import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Typography, Divider, Tooltip, Chip, IconButton,
} from '@mui/material';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import { useUser } from '../../context/UserContext';
import { fullName, getInitials, roleLabel } from '../../utils';

const NAV = [
  { label: 'Dashboard', path: '/', icon: SpaceDashboardRoundedIcon },
  { label: 'Projects', path: '/projects', icon: FolderRoundedIcon },
  { label: 'Tasks', path: '/tasks', icon: ChecklistRoundedIcon },
];

export default function SidebarContent({ onNavigate }) {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navItem = (label, path, Icon) => {
    const active = isActive(path);
    return (
      <ListItemButton
        key={path}
        onClick={() => go(path)}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          py: 1.1,
          transition: 'all .15s ease',
          ...(active && {
            background: 'var(--primary-soft)',
            '&:hover': { background: 'var(--primary-soft)' },
            '& .MuiListItemIcon-root': { color: 'var(--primary)' },
            '& .MuiListItemText-primary': { color: 'var(--primary)', fontWeight: 700 },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: -12,
              top: '18%',
              bottom: '18%',
              width: 3,
              borderRadius: 2,
              background: 'var(--primary)',
            },
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 38 }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
      </ListItemButton>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, mb: 3 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 2,
            background: 'var(--primary)',
            display: 'grid', placeItems: 'center', color: '#fff',
          }}
        >
          <RocketLaunchRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography fontWeight={700} fontSize={17} lineHeight={1.2} color="#0f172a">ProManage</Typography>
          <Typography variant="caption" color="textSecondary">Project tracker</Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 2 }} />

      <Typography variant="overline" sx={{ px: 3, color: 'text.secondary', fontWeight: 700 }}>
        Workspace
      </Typography>

      <List sx={{ px: 1.5, flex: 1 }}>
        {NAV.map(({ label, path, icon }) => navItem(label, path, icon))}
        {(user?.is_staff || user?.is_superuser) &&
          navItem('Stakeholders & team', '/stakeholders', Diversity3RoundedIcon)}
        {user?.is_superuser &&
          navItem('Activity Log', '/log', ManageHistoryRoundedIcon)}
        {user?.is_superuser &&
          navItem('Staff & roles', '/staff', ManageAccountsRoundedIcon)}
      </List>

      <Divider sx={{ mx: 2, mb: 2 }} />

      <Box sx={{ px: 2 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            p: 1.5, borderRadius: 3,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}
        >
          <Tooltip title="View profile">
            <IconButton sx={{ p: 0 }} onClick={() => go('/profile')}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
                {getInitials(user?.first_name, user?.last_name)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {fullName(user)}
            </Typography>
            <Chip
              size="small"
              label={roleLabel(user)}
              variant="outlined"
              sx={{
                height: 18, fontSize: 10.5, fontWeight: 600, mt: 0.3,
                color: user?.is_staff ? 'var(--primary)' : 'var(--muted)',
                borderColor: user?.is_staff ? '#bfdbfe' : 'var(--border)',
              }}
            />
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={logout} color="error">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}