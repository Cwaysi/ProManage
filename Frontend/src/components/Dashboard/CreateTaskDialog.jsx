import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, CircularProgress, Alert, Stack,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import api from '../../api';

export default function CreateTaskDialog({ open, onClose, onCreated }) {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project: '', task: '', notes: '', challenges: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ project: '', task: '', notes: '', challenges: '' });
      setError('');
      api
        .get('/api/projects/')
        .then((res) => setProjects(res.data))
        .catch(() => setError('Could not load projects.'));
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.project) {
      setError('Please select a project.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/createtask/', {
        project: form.project,
        task: form.task,
        notes: form.notes,
        challenges: form.challenges,
      });
      if (res.status === 201) {
        onCreated?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle fontWeight={800}>Create a new task</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
          <Stack spacing={2.2}>
            <TextField
              select fullWidth label="Project" required value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              helperText="Which project does this task belong to?"
            >
              <MenuItem value="" disabled>Select a project</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label="Task" required multiline minRows={2} value={form.task}
              onChange={(e) => setForm({ ...form, task: e.target.value })}
              placeholder="What needs to be done?"
            />
            <TextField
              fullWidth label="Notes" multiline minRows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any extra details…"
            />
            <TextField
              fullWidth label="Challenges" multiline minRows={2} value={form.challenges}
              onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              placeholder="Risks or blockers…"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} size="large">Cancel</Button>
          <Button
            type="submit" variant="contained" size="large" disabled={loading}
            startIcon={<SaveRoundedIcon />}
           
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}