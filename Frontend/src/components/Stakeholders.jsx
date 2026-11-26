import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, TextField, MenuItem, Stack, Chip, Avatar, Typography, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import PageHeader from './common/PageHeader';
import Loading from './common/Loading';
import EmptyState from './common/EmptyState';
import StakeholdersTable from './data/StakeholdersTable';
import ConfirmDialog from './common/ConfirmDialog';
import { avatarColor, formatDate, getInitials } from '../utils';

const EMPTY_STAKE = { project: '', name: '', email: '', position: '', activity: '' };
const EMPTY_MEMBER = { project: '', user: '', responsibility: '', kpi: '' };

export default function Stakeholders() {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(() => searchParams.get('project') || '');
  const [tab, setTab] = useState('stakeholders');

  const [stakeholders, setStakeholders] = useState(null);
  const [members, setMembers] = useState(null);
  const [users, setUsers] = useState([]);

  const [stakeOpen, setStakeOpen] = useState(false);
  const [stakeEditing, setStakeEditing] = useState(null);
  const [stakeForm, setStakeForm] = useState(EMPTY_STAKE);
  const [stakeToDelete, setStakeToDelete] = useState(null);

  const [memOpen, setMemOpen] = useState(false);
  const [memEditing, setMemEditing] = useState(null);
  const [memForm, setMemForm] = useState(EMPTY_MEMBER);
  const [memToDelete, setMemToDelete] = useState(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentProject = useMemo(
    () => projects.find((p) => String(p.id) === String(projectId)),
    [projects, projectId]
  );
  const canManage = Boolean(user?.is_staff) || (currentProject && currentProject.created_by === user?.id);

  useEffect(() => {
    api.get('/api/projects/').then((res) => setProjects(res.data)).catch(() => {});
    api.get('/api/users/').then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setProjectId(searchParams.get('project') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!projectId) { setStakeholders([]); setMembers([]); return; }
    setStakeholders(null);
    setMembers(null);
    api.get(`/api/sstake/${projectId}/`).then((r) => setStakeholders(r.data)).catch(() => setStakeholders([]));
    api.get('/api/projectstaff/', { params: { project: projectId } }).then((r) => setMembers(r.data)).catch(() => setMembers([]));
  }, [projectId]);

  const pickProject = (id) => {
    setProjectId(id);
    setSearchParams(id ? { project: id } : {}, { replace: true });
  };

  const assignedUserIds = useMemo(
    () => new Set((members || []).filter((m) => !(memEditing && m.id === memEditing.id)).map((m) => m.user)),
    [members, memEditing]
  );
  const availableUsers = users;

  if (user && !user.is_staff && !user.is_superuser) {
    return (
      <div className="page">
        <PageHeader title="Stakeholders & team" subtitle="People management." />
        <Box className="glass">
          <EmptyState icon={LockPersonRoundedIcon} title="Managers & super admins only"
            hint="Staff cannot manage stakeholders or the project team. Ask a project manager or a super admin." />
        </Box>
      </div>
    );
  }

  if (projects.length === 0) return <Loading />;
  const openStakeAdd = () => { setStakeEditing(null); setStakeForm({ ...EMPTY_STAKE, project: projectId }); setError(''); setStakeOpen(true); };
  const openStakeEdit = (s) => { setStakeEditing(s); setStakeForm({ project: s.project, name: s.name, email: s.email || '', position: s.position || '', activity: s.activity || '' }); setError(''); setStakeOpen(true); };

  const saveStakeholder = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (stakeEditing) await api.put(`/api/stakeholders/${stakeEditing.id}/`, stakeForm);
      else await api.post('/api/createstake/', stakeForm);
      setStakeOpen(false);
      api.get(`/api/sstake/${projectId}/`).then((r) => setStakeholders(r.data));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save stakeholder.');
    } finally { setSaving(false); }
  };

  const confirmStakeDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/stakeholders/${stakeToDelete.id}/`);
      setStakeToDelete(null);
      api.get(`/api/sstake/${projectId}/`).then((r) => setStakeholders(r.data));
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete stakeholder.');
    } finally { setDeleting(false); }
  };

  const openMemberAdd = () => { setMemEditing(null); setMemForm({ ...EMPTY_MEMBER, project: projectId }); setError(''); setMemOpen(true); };
  const openMemberEdit = (m) => { setMemEditing(m); setMemForm({ project: m.project, user: m.user, responsibility: m.responsibility || '', kpi: m.kpi || '' }); setError(''); setMemOpen(true); };

  const saveMember = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    if (!memForm.user) { setError('Please choose a staff member.'); setSaving(false); return; }
    try {
      if (memEditing) await api.put(`/api/projectstaff/${memEditing.id}/`, memForm);
      else await api.post('/api/projectstaff/', memForm);
      setMemOpen(false);
      api.get('/api/projectstaff/', { params: { project: projectId } }).then((r) => setMembers(r.data));
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to save staff assignment.');
    } finally { setSaving(false); }
  };

  const confirmMemberDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/projectstaff/${memToDelete.id}/`);
      setMemToDelete(null);
      api.get('/api/projectstaff/', { params: { project: projectId } }).then((r) => setMembers(r.data));
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not remove staff member.');
    } finally { setDeleting(false); }
  };

  return (
    <div className="page">
      <PageHeader
        title="People &amp; team"
        subtitle="Assign staff with a responsibility + KPI to a project, and manage the project’s stakeholders."
      />

      {/* Project picker */}
      <Box className="glass" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField select fullWidth sx={{ maxWidth: 380 }} label="Project" size="small" value={projectId}
            onChange={(e) => pickProject(e.target.value)}>
            <MenuItem value="">Select a project…</MenuItem>
            {projects.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
          </TextField>
          {currentProject && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip size="small" variant="outlined" icon={<GroupRoundedIcon />}
                label={`Owner: ${currentProject.created_by_name || '—'}`} sx={{ color: 'var(--muted)' }} />
              <Chip size="small" variant="outlined"
                label={`${stakeholders?.length ?? 0} stakeholders`} sx={{ color: 'var(--muted)' }} />
              <Chip size="small" variant="outlined"
                label={`${members?.length ?? 0} staff`} sx={{ color: 'var(--muted)' }} />
            </Stack>
          )}
        </Stack>
      </Box>

      {!projectId && (
        <Box className="glass">
          <EmptyState icon={GroupRoundedIcon} title="Select a project"
            hint="Choose a project above to assign its staff (with a KPI) and manage its stakeholders." />
        </Box>
      )}

      {projectId && (
        <>
          <Box className="glass" sx={{ px: 2, pt: 1 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary">
              <Tab icon={<PeopleAltRoundedIcon fontSize="small" />} iconPosition="start" label="Stakeholders" value="stakeholders" />
              <Tab icon={<GroupRoundedIcon fontSize="small" />} iconPosition="start" label="Assigned staff (KPI)" value="team" />
            </Tabs>
          </Box>

          {tab === 'stakeholders' && (
            <Box sx={{ mt: 3 }}>
              {stakeholders === null ? <Loading /> : (
                <StakeholdersTable
                  rows={stakeholders}
                  title={`Stakeholders (${stakeholders.length})`}
                  onEdit={canManage ? openStakeEdit : undefined}
                  onDelete={canManage ? setStakeToDelete : undefined}
                  allowActions={canManage}
                />
              )}
              {canManage && stakeholders !== null && stakeholders.length === 0 && (
                <Box className="glass" sx={{ mt: 2 }}>
                  <EmptyState title="No stakeholders yet"
                    hint="Add sponsors, clients or partners connected to this project."
                    action={<Button variant="contained" onClick={openStakeAdd} startIcon={<AddRoundedIcon />}>Add stakeholder</Button>} />
                </Box>
              )}
              {canManage && stakeholders !== null && stakeholders.length > 0 && (
                <Button variant="outlined" startIcon={<AddRoundedIcon />} sx={{ mt: 2 }} onClick={openStakeAdd}>
                  Add stakeholder
                </Button>
              )}
            </Box>
          )}

          {tab === 'team' && (
            <Box sx={{ mt: 3 }}>
              {members === null ? <Loading /> : members.length === 0 ? (
                <Box className="glass">
                  <EmptyState icon={GroupRoundedIcon} title="No staff assigned yet"
                    hint={canManage
                      ? 'Assign staff with a responsibility summary and a KPI, so their logged tasks can be reviewed against what they were asked to do.'
                      : 'Only the project owner or a manager can assign staff.'}
                    action={canManage
                      ? <Button variant="contained" onClick={openMemberAdd} startIcon={<AddRoundedIcon />}>Assign staff</Button>
                      : undefined} />
                </Box>
              ) : (
                <>
                  {canManage && (
                    <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openMemberAdd} sx={{ mb: 2 }}>
                      Assign staff
                    </Button>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {members.map((m) => (
                      <Box key={m.id} className="glass" sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Avatar sx={{ bgcolor: avatarColor(m.user_name), fontWeight: 700 }}>
                            {getInitials(m.user_name.split(' ')[0], m.user_name.split(' ')[1])}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography fontWeight={700}>{m.user_name}</Typography>
                            <Chip size="small" variant="outlined" label={m.is_manager ? 'Manager' : 'Staff'}
                              sx={{ height: 18, fontSize: 10.5, fontWeight: 600, color: m.is_manager ? 'var(--primary)' : 'var(--muted)' }} />
                          </Box>
                          <Chip size="small" label={`${m.task_count} task${m.task_count === 1 ? '' : 's'} logged`}
                            sx={{ fontWeight: 700, color: m.task_count ? 'var(--success)' : 'var(--muted)',
                              bgcolor: m.task_count ? 'rgba(5,150,105,.08)' : 'var(--surface)' }} />
                          {canManage && (
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Edit"><IconButton size="small" onClick={() => openMemberEdit(m)}><EditRoundedIcon sx={{ fontSize: 18 }} color="primary" /></IconButton></Tooltip>
                              <Tooltip title="Remove"><IconButton size="small" onClick={() => setMemToDelete(m)}><DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" /></IconButton></Tooltip>
                            </Stack>
                          )}
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                          <Box>
                            <Typography fontSize={12.5} fontWeight={600} color="textSecondary">Responsibility</Typography>
                            <Typography fontSize={13.5}>{m.responsibility || '—'}</Typography>
                          </Box>
                          <Box sx={{ p: 1.2, borderRadius: 2, background: 'var(--primary-soft)', border: '1px solid #dbeafe' }}>
                            <Typography fontSize={12.5} fontWeight={600} color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrackChangesRoundedIcon sx={{ fontSize: 14 }} /> KPI
                            </Typography>
                            <Typography fontSize={13.5}>{m.kpi || '—'}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                          Assigned on {formatDate(m.created_at)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </>
      )}

      {/* Stakeholder add/edit */}
      <Dialog open={stakeOpen} onClose={() => setStakeOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{stakeEditing ? 'Edit stakeholder' : 'Add stakeholder'}</DialogTitle>
        <form onSubmit={saveStakeholder}>
          <DialogContent>
            {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.2}>
              <TextField select fullWidth label="Project" value={stakeForm.project}
                onChange={(e) => setStakeForm({ ...stakeForm, project: e.target.value })} required>
                {projects.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField fullWidth required label="Full name" value={stakeForm.name}
                  onChange={(e) => setStakeForm({ ...stakeForm, name: e.target.value })} />
                <TextField fullWidth label="Position" value={stakeForm.position}
                  onChange={(e) => setStakeForm({ ...stakeForm, position: e.target.value })} placeholder="e.g. Head Teacher" />
              </Box>
              <TextField fullWidth label="Email" type="email" value={stakeForm.email}
                onChange={(e) => setStakeForm({ ...stakeForm, email: e.target.value })} />
              <TextField fullWidth label="Activity / involvement" multiline minRows={2} value={stakeForm.activity}
                onChange={(e) => setStakeForm({ ...stakeForm, activity: e.target.value })} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setStakeOpen(false)} size="large" disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={<SaveRoundedIcon />}>
              {saving ? <CircularProgress size={20} color="inherit" /> : stakeEditing ? 'Save changes' : 'Add stakeholder'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Staff assignment add/edit (responsibility + KPI) */}
      <Dialog open={memOpen} onClose={() => setMemOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {memEditing ? 'Edit staff assignment' : `Assign staff · ${currentProject?.name || ''}`}
        </DialogTitle>
        <form onSubmit={saveMember}>
          <DialogContent>
            {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.2}>
              <TextField select fullWidth label="Staff member" value={memForm.user}
                onChange={(e) => setMemForm({ ...memForm, user: e.target.value })} required
                helperText={memEditing ? undefined : 'Only accounts of registered staff appear here.'}>
                <MenuItem value="" disabled>Choose a staff member…</MenuItem>
                {availableUsers.map((u) => (
                  <MenuItem key={u.id} value={u.id} disabled={!memEditing && assignedUserIds.has(u.id)}>
                    {u.full_name} {u.is_staff ? '(Manager)' : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField fullWidth label="Responsibility (what they will do)" multiline minRows={2}
                value={memForm.responsibility} onChange={(e) => setMemForm({ ...memForm, responsibility: e.target.value })}
                placeholder="e.g. Coordinate field inspections in the Northern region" />
              <TextField fullWidth label="KPI / target (how success is measured)" multiline minRows={2}
                value={memForm.kpi} onChange={(e) => setMemForm({ ...memForm, kpi: e.target.value })}
                placeholder="e.g. Complete 10 school inspections and log a task for each" />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setMemOpen(false)} size="large" disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={<SaveRoundedIcon />}>
              {saving ? <CircularProgress size={20} color="inherit" /> : memEditing ? 'Save changes' : 'Assign staff'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirms */}
      <ConfirmDialog
        open={Boolean(stakeToDelete)}
        title="Delete stakeholder"
        message={`Remove "${stakeToDelete?.name}" from the project?`}
        onClose={() => setStakeToDelete(null)}
        onConfirm={confirmStakeDelete}
        loading={deleting}
      />
      <ConfirmDialog
        open={Boolean(memToDelete)}
        title="Remove staff member"
        message={`Remove "${memToDelete?.user_name}" from this project? Existing tasks they logged are kept.`}
        onClose={() => setMemToDelete(null)}
        onConfirm={confirmMemberDelete}
        loading={deleting}
      />
    </div>
  );
}
