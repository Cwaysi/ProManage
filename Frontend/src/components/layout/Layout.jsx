import { useState } from 'react';
import { Box, Drawer } from '@mui/material';
import { Outlet } from 'react-router-dom';
import SidebarContent from './Sidebar';
import Topbar from './Topbar';
import Loading from '../common/Loading';
import { useUser } from '../../context/UserContext';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading } = useUser();

  const drawer = <SidebarContent onNavigate={() => setMobileOpen(false)} />;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Loading />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: 264,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 264,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100vh',
            overflowY: 'auto',
            background: 'var(--card)',
            borderRight: '1px solid var(--border)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: 264, background: 'var(--card)' },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}