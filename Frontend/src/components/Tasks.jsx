import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import PageHeader from './common/PageHeader';
import TasksTable from './data/TasksTable';
import CreateTaskDialog from './Dashboard/CreateTaskDialog';
import ConfirmDialog from './common/ConfirmDialog';

export default function Tasks() {
  const navigate = useNavigate();
  const { user } = useUser();
  const isStaffOnly = !user?.is_staff && !user?.is_superuser;
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [reload, setReload] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/tasks/${toDelete.id}/`);
      setToDelete(null);
      setReload((r) => r + 1);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete task.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={isStaffOnly ? 'My tasks' : 'Task activities'}
        subtitle={
          isStaffOnly
            ? 'Only tasks you have logged.'
            : user?.is_superuser
              ? 'Every task logged by everyone across all projects.'
              : 'Tasks logged across the projects you lead.'
        }
        action={
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>
            New task
          </Button>
        }
      />
      <TasksTable
        fetchUrl="/api/tasks/"
        title={isStaffOnly ? 'My tasks' : 'All task activities'}
        reload={reload}
        onEdit={(row) => navigate(`/updatetask/${row.id}/`)}
        onDelete={(row) => setToDelete(row)}
      />
      <CreateTaskDialog open={open} onClose={() => setOpen(false)} onCreated={() => setReload((r) => r + 1)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete task"
        message={`Are you sure you want to delete this task${toDelete ? ` — “${toDelete.task}”` : ''}? This cannot be undone.`}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}