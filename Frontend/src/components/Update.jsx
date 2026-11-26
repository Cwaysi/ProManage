import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Stack, Avatar } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import api from '../api';
import Loading from './common/Loading';
import { getInitials } from '../utils';

export default function UpdateTask() {
  const history = useNavigate();
  const { id } = useParams();
  const [initial, setInitial] = useState(null);
  const [taskData, setTaskData] = useState({ project_name: '', task: '', notes: '', challenges: '', project: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/api/updatetask/${id}/`)
      .then((res) => {
        setInitial(res.data);
        setTaskData({
          project: res.data.project,
          project_name: res.data.project_name,
          task: res.data.task || '',
          notes: res.data.notes || '',
          challenges: res.data.challenges || '',
        });
      })
      .catch((err) => setError(err.response?.data?.detail || 'Could not load task.'));
  }, [id]);

  const handleChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/updatetask/${id}/`, {
        task: taskData.task,
        notes: taskData.notes,
        challenges: taskData.challenges,
      });
      history('/tasks');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  if (error && !initial) return <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>;
  if (!initial) return <Loading />;

  return (
    <div className="page">
      <Button component={Link} to="/tasks" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, fontWeight: 600 }}>
        Back to tasks
      </Button>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.6fr' }, gap: 3, maxWidth: 900 }}>
        {/* Summary */}
        <Box className="glass" sx={{ p: 3, alignSelf: 'start' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'var(--primary)', fontWeight: 800 }}>
              {getInitials(taskData.project_name, '', 'T')}
            </Avatar>
            <Box>
              <Typography fontSize={12} color="textSecondary" fontWeight={600}>TASK ID #{id}</Typography>
              <Typography fontWeight={700}>{taskData.project_name}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {taskData.task || 'No task description.'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Editing the task text below does not change the project or owner.
          </Typography>
        </Box>

        {/* Form */}
        <Box className="glass" sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={800} mb={2}>Update task</Typography>
          {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.4}>
              <TextField label="Project (read only)" value={taskData.project_name} disabled
                helperText="Use the dashboard to move a task between projects." />
              <TextField label="Task" name="task" multiline minRows={2} value={taskData.task}
                onChange={handleChange} required placeholder="What needs to be done?" />
              <TextField label="Notes" name="notes" multiline minRows={2} value={taskData.notes} onChange={handleChange} />
              <TextField label="Challenges" name="challenges" multiline minRows={2} value={taskData.challenges} onChange={handleChange} />
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                <Button component={Link} to="/tasks" size="large">Cancel</Button>
                <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={<SaveRoundedIcon />}
                 >
                  {saving ? <CircularProgress size={20} color="inherit" /> : 'Update task'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Box>
    </div>
  );
}