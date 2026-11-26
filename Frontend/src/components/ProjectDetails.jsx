import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Avatar, Chip, Stack, LinearProgress,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import Loading from './common/Loading';
import EmptyState from './common/EmptyState';
import StatusChip from './common/StatusChip';
import ConfirmDialog from './common/ConfirmDialog';
import ProjectFormDialog from './common/ProjectFormDialog';
import TasksTable from './data/TasksTable';
import StakeholdersTable from './data/StakeholdersTable';
import { avatarColor, canManage, formatDate, getInitials } from '../utils';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [toDeleteTask, setToDeleteTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [reloadTasks, setReloadTasks] = useState(0);

  const load = async () => {
    try {
      const [p, m, s, t] = await Promise.all([
        api.get(`/api/sproject/${projectId}/`),
        api.get('/api/projectstaff/', { params: { project: projectId } }),
        api.get(`/api/sstake/${projectId}/`),
        api.get(`/api/stasks/${projectId}/`),
      ]);
      if (!p.data[0]) {
        setError('Project not found or you do not have access to it.');
        return;
      }
      setProject(p.data[0]);
      setMembers(m.data);
      setStakeholders(s.data);
      setTasks(t.data);
    } catch {
      setError('Could not load project details.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const tasksByUser = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      (map[t.user] = map[t.user] || []).push(t);
    });
    return map;
  }, [tasks]);

  const isOwner = project && canManage(user, project.created_by);

  const confirmDeleteTask = async () => {
    setDeletingTask(true);
    try {
      await api.delete(`/api/tasks/${toDeleteTask.id}/`);
      setToDeleteTask(null);
      setReloadTasks((r) => r + 1);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete task.');
    } finally {
      setDeletingTask(false);
    }
  };

  if (error) return <EmptyState title="Could not load project" hint={error} />;
  if (!project) return <Loading />;

  const progress = typeof project.progress === 'number' ? project.progress : 0;
  const loggedStaff = members.filter((m) => (tasksByUser[m.user] || []).length > 0).length;

  const stats = [
    { label: 'Tasks logged', value: tasks.length, icon: FactCheckRoundedIcon },
    { label: 'Team members', value: members.length, icon: GroupRoundedIcon },
    { label: 'Stakeholders', value: stakeholders.length, icon: PeopleAltRoundedIcon },
    { label: 'Progress', value: `${progress}%`, icon: TrendingUpRoundedIcon },
  ];

  return (
    <div className="page">
      <Button component={Link} to="/projects" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, fontWeight: 600 }}>
        Back to projects
      </Button>

      {/* ---- Overview hero ---- */}
      <Box className="glass" sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: 8, background: 'var(--primary)' }} />
        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 62, height: 62, borderRadius: 2, bgcolor: 'var(--primary)', fontWeight: 700, fontSize: 24 }}>
              {getInitials(project.name, '', 'P')}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={700}>{project.name}</Typography>
                <StatusChip status={project.status} />
                {project.created_by_name && (
                  <Chip size="small" variant="outlined" icon={<GroupRoundedIcon />}
                    label={`Managed by ${project.created_by_name}`} sx={{ color: 'var(--muted)' }} />
                )}
              </Box>
              <Typography color="textSecondary" sx={{ mt: 1 }}>
                <DescriptionRoundedIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {project.details || 'No description provided.'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                <CalendarTodayRoundedIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {formatDate(project.startdate)} — {formatDate(project.enddate)}
              </Typography>
            </Box>

            {/* Progress + quick actions */}
            <Box sx={{ width: { xs: '100%', md: 300 } }}>
              <Box className="row-between" sx={{ mb: 0.5 }}>
                <Typography fontWeight={700}>Overall progress</Typography>
                <Typography fontWeight={800} fontSize={20} color="var(--primary)">{progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate" value={progress}
                sx={{ height: 10, borderRadius: 5, bgcolor: 'var(--surface-2)',
                  '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'var(--primary)' } }}
              />
              {isOwner && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                  <Button size="small" variant="contained" startIcon={<EditRoundedIcon />} onClick={() => setEditOpen(true)}>
                    Edit &amp; progress
                  </Button>
                  <Button size="small" variant="outlined" component={Link}
                    to={`/stakeholders?project=${project.id}`} startIcon={<GroupRoundedIcon />}>
                    Manage team
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ---- Stats strip ---- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mt: 3 }}>
        {stats.map((s) => (
          <Box key={s.label} className="glass" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center',
              color: 'var(--primary)', background: 'var(--primary-soft)' }}>
              <s.icon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={20} lineHeight={1.1}>{s.value}</Typography>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ---- Team & contribution vs KPI ---- */}
      <Box className="glass" sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
        <div className="section-head">
          <h2>Team &amp; task contribution</h2>
          <Stack direction="row" spacing={1}>
            {members.length > 0 && (
              <Chip size="small" variant="outlined"
                label={loggedStaff === members.length ? 'All members active' : `${loggedStaff} of ${members.length} logged tasks`}
                sx={{ color: 'var(--muted)' }} />
            )}
            {isOwner && (
              <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />}
                component={Link} to={`/stakeholders?project=${project.id}`}>
                Assign staff / KPI
              </Button>
            )}
          </Stack>
        </div>

        {members.length === 0 ? (
          <EmptyState icon={GroupRoundedIcon}
            title="No staff assigned to this project yet"
            hint={isOwner
              ? 'Assign staff with a responsibility summary and KPI. Their logged tasks will be compared with what they were asked to do.'
              : 'The project lead has not assigned staff to this project yet.'}
            action={isOwner
              ? <Button variant="contained" component={Link} to={`/stakeholders?project=${project.id}`} startIcon={<AddRoundedIcon />}>Assign staff</Button>
              : undefined} />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
            {members.map((m) => {
              const memberTasks = tasksByUser[m.user] || [];
              return (
                <Box key={m.id} sx={{ p: 2.5, borderRadius: 3, border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: avatarColor(m.user_name), fontWeight: 700 }}>{getInitials(m.user_name.split(' ')[0], m.user_name.split(' ')[1])}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{m.user_name}</Typography>
                      <Chip size="small" label={m.is_manager ? 'Manager' : 'Staff'} variant="outlined"
                        sx={{ height: 18, fontSize: 10.5, fontWeight: 600, color: m.is_manager ? 'var(--primary)' : 'var(--muted)' }} />
                    </Box>
                    <Chip size="small" label={`${memberTasks.length} task${memberTasks.length === 1 ? '' : 's'}`}
                      sx={{ fontWeight: 700, color: memberTasks.length ? 'var(--success)' : 'var(--muted)',
                        bgcolor: memberTasks.length ? 'rgba(5,150,105,.08)' : 'var(--surface)' }} />
                  </Box>

                  <Typography fontSize={13} fontWeight={600} color="textSecondary">Responsibility</Typography>
                  <Typography fontSize={14} sx={{ mb: 1.5 }}>{m.responsibility || '—'}</Typography>

                  <Typography fontSize={13} fontWeight={600} color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrackChangesRoundedIcon sx={{ fontSize: 15 }} /> KPI / deliverable
                  </Typography>
                  <Box sx={{ p: 1.2, borderRadius: 2, background: 'var(--primary-soft)', border: '1px solid #dbeafe', mb: 1.5 }}>
                    <Typography fontSize={13.5}>{m.kpi || '—'}</Typography>
                  </Box>

                  <Typography fontSize={13} fontWeight={600} color="textSecondary">Logged activity on this project</Typography>
                  {memberTasks.length === 0 ? (
                    <Typography fontSize={13} color="textSecondary" sx={{ mt: 0.5 }}>No tasks logged yet.</Typography>
                  ) : (
                    <Box component="ul" sx={{ m: 0, mt: 0.5, p: 0, listStyle: 'none' }}>
                      {memberTasks.slice(0, 4).map((t) => (
                        <Box component="li" key={t.id} sx={{ display: 'flex', gap: 1, py: 0.5, alignItems: 'baseline' }}>
                          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', alignSelf: 'center', flexShrink: 0 }} />
                          <Typography fontSize={13.5} flex={1}>{t.task}</Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</Typography>
                        </Box>
                      ))}
                      {memberTasks.length > 4 && (
                        <Typography variant="caption" color="textSecondary">+ {memberTasks.length - 4} more…</Typography>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ---- Task activity ---- */}
      <Box sx={{ mt: 3 }}>
        <TasksTable
          fetchUrl={`/api/stasks/${project.id}/`}
          title={`Task activity on this project (${tasks.length})`}
          reload={reloadTasks}
          onEdit={(row) => navigate(`/updatetask/${row.id}/`)}
          onDelete={(row) => setToDeleteTask(row)}
        />
      </Box>

      {/* ---- Stakeholders ---- */}
      <Box sx={{ mt: 3 }}>
        <StakeholdersTable
          rows={stakeholders}
          title={`Stakeholders (${stakeholders.length})`}
        />
      </Box>

      {/* Edit / progress dialog */}
      <ProjectFormDialog
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />

      {/* Delete task */}
      <ConfirmDialog
        open={Boolean(toDeleteTask)}
        title="Delete task"
        message={`Are you sure you want to delete this task${toDeleteTask ? ` — “${toDeleteTask.task}”` : ''}?`}
        onClose={() => setToDeleteTask(null)}
        onConfirm={confirmDeleteTask}
        loading={deletingTask}
      />
    </div>
  );
}