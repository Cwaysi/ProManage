import { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import api from '../api';
import { useUser } from '../context/UserContext';
import PageHeader from './common/PageHeader';
import Loading from './common/Loading';
import EmptyState from './common/EmptyState';
import { formatDateTime } from '../utils';

const FLAGS = { 1: 'Added', 2: 'Changed', 3: 'Deleted' };
const ACTION_COLORS = { 1: '#059669', 2: '#d97706', 3: '#64748b' };

const columns = [
  { field: 'user_name', headerName: 'Staff', width: 150 },
  {
    field: 'action_flag',
    headerName: 'Action',
    width: 130,
    renderCell: (params) => (
      <Chip
        size="small"
        variant="outlined"
        label={FLAGS[params.value] || params.value}
        sx={{
          fontWeight: 600,
          color: ACTION_COLORS[params.value] || 'var(--muted)',
          borderColor: `${ACTION_COLORS[params.value] || '#cbd5e1'}4d`,
        }}
      />
    ),
  },
  { field: 'object_repr', headerName: 'Affected item', minWidth: 220, flex: 1 },
  {
    field: 'change_message',
    headerName: 'Details',
    minWidth: 260,
    flex: 1,
    renderCell: (params) => (
      <Typography fontSize={12.5} sx={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
        {/* eslint-disable-next-line no-useless-escape */}
        {String(params.value || '').replace(/[\[\]{}"]/g, '').slice(0, 80)}
      </Typography>
    ),
  },
  { field: 'action_time', headerName: 'Time', width: 170, renderCell: (params) => formatDateTime(params.value) },
];

export default function LogCard() {
  const { user } = useUser();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!user?.is_superuser) {
      setRows([]);
      return;
    }
    api
      .get('/api/log/')
      .then((res) => setRows(res.data.map((r, i) => ({ ...r, id: i }))))
      .catch(() => setRows([]));
  }, [user]);

  if (!user?.is_superuser) {
    return (
      <div className="page">
        <PageHeader title="Activity log" subtitle="System audit trail." />
        <Box className="glass">
          <EmptyState
            icon={LockPersonRoundedIcon}
            title="Super admins only"
            hint="The activity log is restricted to super administrators. Ask an administrator to view the audit trail."
          />
        </Box>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Activity log" subtitle="Audit trail of changes across the workspace." />
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Box className="glass">
          <EmptyState title="No activity yet" hint="Changes to projects, tasks and stakeholders appear here." />
        </Box>
      ) : (
        <Box className="glass" sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <div className="section-head">
            <h2>Recent changes</h2>
            <Chip size="small" label={`${rows.length} events`} variant="outlined" />
          </div>
          <Box className="dgrid" sx={{ height: { xs: 400, md: 560 } }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowHeight={() => 'auto'}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              pageSizeOptions={[5, 10, 20]}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: 'activity-log' } } }}
              disableRowSelectionOnClick
              sx={{ '& .MuiDataGrid-cell': { py: 1.2 } }}
            />
          </Box>
        </Box>
      )}
    </div>
  );
}