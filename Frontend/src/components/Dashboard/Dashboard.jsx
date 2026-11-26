import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import api from '../../api';
import { useUser } from '../../context/UserContext';
import CreateTaskDialog from './CreateTaskDialog';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import StatusChip from '../common/StatusChip';
import PageHeader from '../common/PageHeader';
import ConfirmDialog from '../common/ConfirmDialog';
import { greeting, fullName, computeProgress, formatDate } from '../../utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const PIE_COLORS = ['#2563eb', '#059669', '#f59e0b', '#6b7280', '#0ea5e9', '#7c3aed', '#dc2626'];

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [openTask, setOpenTask] = useState(false);
  const [error, setError] = useState('');
  const [toDeleteTask, setToDeleteTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);

  const load = () => {
    api.get('/api/dashboard/')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'));
    api.get('/api/createtask/')
      .then((res) => setMyTasks(res.data))
      .catch(() => {});
  };

  const confirmDeleteTask = async () => {
    setDeletingTask(true);
    try {
      await api.delete(`/api/tasks/${toDeleteTask.id}/`);
      setToDeleteTask(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete task.');
    } finally {
      setDeletingTask(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!stats) return error ? <EmptyState title="Could not load dashboard" hint={error} /> : <Loading />;

  const statCards = [
    { label: 'Total projects', value: stats.total_projects, icon: FolderRoundedIcon },
    { label: 'Open projects', value: stats.open_projects, icon: RocketLaunchRoundedIcon },
    { label: 'My tasks', value: stats.my_tasks, icon: ChecklistRoundedIcon },
    { label: 'Stakeholders', value: stats.total_stakeholders, icon: Diversity3RoundedIcon },
  ];

  const pieData = (stats.status_breakdown || []).filter((s) => s.status).map((s) => ({ name: s.status, value: s.count }));

  return (
    <div className="page">
      <PageHeader
        title={`${greeting()}, ${fullName(user)}`}
        subtitle="Overview of your projects and team activity."
        action={
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={() => setOpenTask(true)}>
            New task
          </Button>
        }
      />

      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={item} className="stat-card">
            <div className="stat-icon"><s.icon /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts + my tasks */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 3, mb: 3 }}>
        <Box className="glass" sx={{ p: 3 }}>
          <div className="section-head">
            <h2>Project status overview</h2>
            <Chip size="small" label={`${stats.total_projects} total`} variant="outlined" />
          </div>
          {pieData.length ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, alignItems: 'center' }}>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%"
                      paddingAngle={3} stroke="none" cornerRadius={6}>
                      {pieData.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pieData.map((entry, idx) => (
                  <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <Typography fontSize={14} flex={1}>{entry.name}</Typography>
                    <Typography fontWeight={700}>{entry.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState title="No projects yet" hint="Create your first project to see analytics here." />
          )}
        </Box>
{/* My tasks */}
        <Box className="glass" sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          <div className="section-head">
            <h2>My recent tasks</h2>
            <Link to="/tasks" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
              View all <ArrowForwardRoundedIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
            </Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState title="No tasks assigned to you yet" hint="Create one from the button above."
              action={<Button size="small" variant="contained" onClick={() => setOpenTask(true)} startIcon={<AddRoundedIcon />}>New task</Button>} />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              {myTasks.slice(0, 5).map((t) => (
                <Box
                  key={t.id}
                  sx={{ p: 1.5, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 1,
                    transition: 'transform .2s ease, border-color .2s ease',
                    '&:hover': { transform: 'translateX(4px)', borderColor: 'var(--primary)' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} fontSize={14} color="var(--text)" noWrap>{t.task}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {t.project_name} · {formatDate(t.created_at)}
                    </Typography>
                  </Box>
                  <Tooltip title="Edit task">
                    <IconButton size="small" onClick={() => navigate(`/updatetask/${t.id}/`)}>
                      <EditRoundedIcon sx={{ fontSize: 18 }} color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete task">
                    <IconButton size="small" onClick={() => setToDeleteTask(t)}>
                      <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
{/* Recent projects */}
      <Box className="glass" sx={{ p: 3 }}>
        <div className="section-head">
          <h2>Recent projects</h2>
          <Link to="/projects" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
            Browse all <ArrowForwardRoundedIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
          </Link>
        </div>
        {stats.recent_projects.length === 0 ? (
          <EmptyState title="No projects yet" hint="Projects you create will show up here." />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            {stats.recent_projects.map((p, i) => {
              const progress = typeof p.progress === 'number' ? p.progress : computeProgress(p.startdate, p.enddate);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link to={`/projectdetails/${p.id}/`}>
                    <Box sx={{ p: 2, borderRadius: 3, background: 'var(--surface)', border: '1px solid var(--border)',
                      transition: 'transform .25s ease, box-shadow .3s ease, border-color .3s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow)', borderColor: 'var(--primary)' } }}>
                      <Box className="row-between">
                        <Typography fontWeight={700} fontSize={14} noWrap>{p.name}</Typography>
                        <StatusChip status={p.status} />
                      </Box>
                      <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', mb: 1.2 }}>
                        {p.details}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1, height: 6, borderRadius: 5, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <Box sx={{ width: `${progress}%`, height: '100%', borderRadius: 5, background: 'var(--primary)' }} />
                        </Box>
                        <Typography fontSize={12} fontWeight={700}>{progress}%</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        {formatDate(p.startdate)} — {formatDate(p.enddate)}
                      </Typography>
                    </Box>
                  </Link>
                </motion.div>
              );
            })}
          </Box>
        )}
      </Box>

      <CreateTaskDialog open={openTask} onClose={() => setOpenTask(false)} onCreated={load} />
      <ConfirmDialog
        open={Boolean(toDeleteTask)}
        title="Delete task"
        message={`Are you sure you want to delete this task${toDeleteTask ? ` — “${toDeleteTask.task}”` : ''}? This cannot be undone.`}
        onClose={() => setToDeleteTask(null)}
        onConfirm={confirmDeleteTask}
        loading={deletingTask}
      />
    </div>
  );
}