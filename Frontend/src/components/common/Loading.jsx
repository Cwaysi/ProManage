import { Box, Typography } from '@mui/material';

export default function Loading({ label = 'Loading…' }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
      <Box className="loader-ring" />
      <Typography variant="body2" color="textSecondary">
        {label}
      </Typography>
    </Box>
  );
}