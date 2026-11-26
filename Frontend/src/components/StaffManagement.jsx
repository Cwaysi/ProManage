import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Button, Avatar, Chip, Typography, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import PageHeader from './common/PageHeader';
import Loading from './common/Loading';
import EmptyState from './common/EmptyState';
import ConfirmDialog from './common/ConfirmDialog';
import { avatarColor, formatDate, getInitials } from '../utils';

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'superadmin', label: 'Super admin' },
];

function roleFromUser(u) {
  if (u.is_superuser) return 'superadmin';
  if (u.is_staff) return 'manager';
  return 'staff';
}

const ROLE_COLOR = {
  superadmin: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  manager: { color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
  staff: { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
};

function UserCell({ u }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: avatarColor(u.full_name) }}>
        {getInitials(u.first_name, u.last_name)}
      </Avatar>
      <Box>
        <Typography fontSize={13.5} fontWeight={600}>{u.full_name}</Typography>
        <Typography fontSize={11.5} color="textSecondary">@{u.username}</Typography>
      </Box>
    </Box>
  );
}

const EMPTY = { username: '', first_name: '', last_name: '', email: '', password: '', role: 'staff' };

export default function StaffManagement() {
  const { user } = useUser();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/api/users/').then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  if (!user?.is_superuser) {
    return (
      <div className="page">
        <PageHeader title="Staff & roles" subtitle="User account management." />
        <Box className="glass">
          <EmptyState icon={LockPersonRoundedIcon} title="Super admins only"
            hint="Only a super administrator can create users and change their roles." />
        </Box>
      </div>
    );
  }

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setOpen(true); };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, first_name: u.first_name || '', last_name: u.last_name || '',
      email: u.email || '', password: '', role: roleFromUser(u) });
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    if (!form.username.trim()) { setError('Username is required.'); setSaving(false); return; }
    const payload = {
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      is_staff: form.role !== 'staff',
      is_superuser: form.role === 'superadmin',
    };
    if (form.password) payload.password = form.password;
    try {
      if (editing) await api.put(`/api/users/${editing.id}/`, payload);
      else {
        if (!payload.password) { setError('A password is required when creating an account.'); setSaving(false); return; }
        await api.post('/api/users/', payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.username?.[0] || d?.detail || 'Failed to save user.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/users/${toDelete.id}/`);
      setToDelete(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete user.');
    } finally { setDeleting(false); }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'full_name', headerName: 'User', width: 220, renderCell: (p) => <UserCell u={p.row} /> },
    { field: 'email', headerName: 'Email', width: 220 },
    {
      field: 'role', headerName: 'Role', width: 140, sortable: false,
      renderCell: (p) => {
        const c = ROLE_COLOR[p.value] || ROLE_COLOR.staff;
        const label = ROLES.find((r) => r.value === p.value)?.label || p.value;
        return <Chip size="small" label={label} sx={{ color: c.color, bgcolor: c.bg, border: `1px solid ${c.border}`, fontWeight: 600 }} />;
      },
    },
    { field: 'date_joined', headerName: 'Created', width: 130, renderCell: (p) => formatDate(p.value) },
    {
      field: 'actions', headerName: 'Actions', width: 110, sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(p.row)}><EditRoundedIcon sx={{ fontSize: 18 }} color="primary" /></IconButton>
          </Tooltip>
          <Tooltip title={p.row.id === user?.id ? 'You cannot delete your own account' : 'Delete'}>
            <span>
              <IconButton size="small" disabled={p.row.id === user?.id} onClick={() => setToDelete(p.row)}>
                <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Staff & roles"
        subtitle="Create users, change roles (Staff / Manager / Super admin) and remove accounts."
        action={
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add staff
          </Button>
        }
      />

      {rows === null ? <Loading /> : (
        <Box className="glass" sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <div className="section-head">
            <h2>User accounts</h2>
            <Chip size="small" variant="outlined" label={`${rows.length} users`} />
          </div>
          <Box className="dgrid" sx={{ height: { xs: 420, md: 560 } }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.id}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              pageSizeOptions={[10, 25]}
              disableRowSelectionOnClick
              sx={{ '& .MuiDataGrid-cell': { py: 1.2 } }}
            />
          </Box>
        </Box>
      )}
      {/* Add / edit user */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? `Edit ${editing.full_name}` : 'Add staff account'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField fullWidth required label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <TextField fullWidth required label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </Box>
              <TextField fullWidth required label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField fullWidth label={editing ? 'New password (leave blank to keep current)' : 'Password'}
                type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                helperText="At least 8 characters" />
              <TextField select fullWidth label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpen(false)} size="large" disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={<SaveRoundedIcon />}>
              {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Save changes' : 'Create account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete staff account"
        message={`Delete "${toDelete?.full_name}" (@${toDelete?.username})? Their assignments and logged tasks are removed.`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
