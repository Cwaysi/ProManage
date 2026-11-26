import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FolderOffRoundedIcon from '@mui/icons-material/FolderOffRounded';
import api from '../api';
import ProjectCard from './ProjectCard';
import PageHeader from './common/PageHeader';
import EmptyState from './common/EmptyState';
import Loading from './common/Loading';
import ConfirmDialog from './common/ConfirmDialog';
import ProjectFormDialog from './common/ProjectFormDialog';
import { useUser } from '../context/UserContext';
import { canManage } from '../utils';

export default function Projects() {
  const { user } = useUser();
  const canCreate = Boolean(user?.is_staff || user?.is_superuser);
  const isStaffView = !user?.is_staff && !user?.is_superuser;
  const [data, setData] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/api/projects/').then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${toDelete.id}/`);
      setToDelete(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete project.');
    } finally {
      setDeleting(false);
    }
  };

  if (!data) return <Loading />;

  return (
    <div className="page">
      <PageHeader
        title="Projects"
        subtitle={isStaffView ? 'Projects assigned to you.' : 'Manage and track every project in your workspace.'}
        action={
          canCreate && (
            <Button variant="contained" size="large" startIcon={<AddRoundedIcon />}
              onClick={() => { setEditing(null); setFormOpen(true); }}>
              New project
            </Button>
          )
        }
      />

      {data.length === 0 ? (
        <Box className="glass">
          <EmptyState icon={FolderOffRoundedIcon} title="No projects yet"
            hint={isStaffView
              ? 'You are not assigned to any project yet. Ask a project lead to add you.'
              : 'Create your first project to start tracking progress.'}
            action={canCreate
              ? <Button variant="contained" onClick={() => { setEditing(null); setFormOpen(true); }} startIcon={<AddRoundedIcon />}>New project</Button>
              : undefined} />
        </Box>
      ) : (
        <div className="cards-grid">
          {data.map((p) => (
            <ProjectCard
              key={p.id}
              {...p}
              canManage={canManage(user, p.created_by)}
              onEdit={() => { setEditing(p); setFormOpen(true); }}
              onDelete={() => setToDelete(p)}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={formOpen}
        project={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete project"
        message={`Are you sure you want to delete "${toDelete?.name}"? This cannot be undone.`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}