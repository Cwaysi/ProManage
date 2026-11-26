import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Button, Alert, CircularProgress, Stack, Box, Typography, Slider,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import api from '../../api';

const STATUSES = ['Open', 'Ongoing', 'Pending', 'Closed'];
const EMPTY = { name: '', details: '', startdate: '', enddate: '', status: 'Open', progress: 0 };

export default function ProjectFormDialog({ open, project, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setForm(
        project
          ? {
              name: project.name,
              details: project.details || '',
              startdate: project.startdate || '',
              enddate: project.enddate || '',
              status: project.status || 'Open',
              progress: typeof project.progress === 'number' ? project.progress : 0,
            }
          : EMPTY
      );
    }
  }, [open, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (project) await api.put(`/api/projects/${project.id}/`, form);
      else await api.post('/api/createproject/', form);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{project ? 'Edit project' : 'Create a new project'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
          <Stack spacing={2.2}>
            <TextField fullWidth required label="Project name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth required label="Details" multiline minRows={2} value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="What is this project about?" />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField fullWidth required label="Start date" type="date" value={form.startdate}
                onChange={(e) => setForm({ ...form, startdate: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth label="End date" type="date" value={form.enddate}
                onChange={(e) => setForm({ ...form, enddate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField select fullWidth label="Status" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            {/* Manager-controlled progress */}
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight={600} fontSize={14}>Project progress</Typography>
                <Typography fontWeight={800} color="primary">{form.progress}%</Typography>
              </Box>
              <Slider
                value={typeof form.progress === 'number' ? form.progress : 0}
                onChange={(_, v) => setForm({ ...form, progress: v })}
                step={5} min={0} max={100}
                marks={[{ value: 0, label: '0' }, { value: 100, label: '100' }]}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} size="large" disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={<SaveRoundedIcon />}>
            {saving ? <CircularProgress size={20} color="inherit" /> : project ? 'Save changes' : 'Create project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}