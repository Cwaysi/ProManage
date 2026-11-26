import { Box, Button, Typography } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
      <Box>
        <Typography sx={{ fontSize: { xs: 84, md: 140 }, fontWeight: 700, lineHeight: 1, color: 'var(--primary)' }}>
          404
        </Typography>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Page not found
        </Typography>
        <Typography color="textSecondary" mb={3}>
          The page you are looking for doesn’t exist or was moved.
        </Typography>
        <Button component={Link} to="/" variant="contained" startIcon={<HomeRoundedIcon />} size="large">
          Back to dashboard
        </Button>
      </Box>
    </Box>
  );
}