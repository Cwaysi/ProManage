import { Box } from '@mui/material';
import { statusColor } from '../../utils';

export default function StatusChip({ status }) {
  const color = statusColor(status);
  return (
    <Box className="status-chip" sx={{ '--chip-color': color, color: 'var(--text)' }}>
      <span className="dot" />
      {status || '—'}
    </Box>
  );
}