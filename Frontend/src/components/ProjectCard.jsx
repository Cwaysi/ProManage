import { Link } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import StatusChip from './common/StatusChip';
import { computeProgress, formatDate, getInitials } from '../utils';

export default function ProjectCard(props) {
  const { id, name, details, startdate, enddate, status, created_by_name, progress, canManage, onEdit, onDelete } = props;
  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : computeProgress(startdate, enddate);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ y: -3 }}>
      <div className="pcard">
        <div className="pcard-banner">
          <div className="pcard-avatar">{getInitials(name, '', 'P')}</div>
          {canManage && (
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit project">
                <IconButton
                  size="small"
                  onClick={onEdit}
                  sx={{ bgcolor: 'rgba(255,255,255,.92)', '&:hover': { bgcolor: '#fff' } }}
                >
                  <EditRoundedIcon sx={{ fontSize: 18 }} color="primary" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete project">
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{ bgcolor: 'rgba(255,255,255,.92)', '&:hover': { bgcolor: '#fff' } }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </div>

        <div className="pcard-body">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <StatusChip status={status} />
          </Box>
          <Typography fontWeight={700} fontSize={16} mt={1}>
            {name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            by {created_by_name || '—'}
          </Typography>
          <div className="pcard-details">{details}</div>
        </div>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, height: 6, borderRadius: 5, background: 'var(--surface-2)', overflow: 'hidden' }}>
            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 5, transition: 'width .6s ease', background: 'var(--primary)' }} />
          </Box>
          <Typography fontSize={12} fontWeight={700}>{pct}%</Typography>
        </Box>

        <div className="pcard-meta">
          <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} />
          {formatDate(startdate)} — {formatDate(enddate)}
        </div>

        <div className="pcard-foot">
          <Link to={`/projectdetails/${id}/`}>
            <Button size="small" variant="contained" startIcon={<VisibilityRoundedIcon />}>
              View details
            </Button>
          </Link>
          <Typography variant="caption" color="textSecondary" fontWeight={600}>
            #{id}
          </Typography>
        </div>
      </div>
    </motion.div>
  );
}