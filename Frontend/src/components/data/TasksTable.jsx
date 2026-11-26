import { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Avatar, Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import api from '../../api';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { useUser } from '../../context/UserContext';
import { canManage, formatDate, getInitials, avatarColor } from '../../utils';

function StaffCell({ name }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: avatarColor(name) }}>
        {getInitials(name.split(' ')[0], name.split(' ')[1])}
      </Avatar>
      <Typography fontSize={13}>{name}</Typography>
    </Box>
  );
}

function buildColumns(onEdit, onDelete) {
  const cols = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'project_name', headerName: 'Project', width: 150 },
    { field: 'task', headerName: 'Task', minWidth: 220, flex: 1 },
    { field: 'notes', headerName: 'Notes', minWidth: 180, flex: 1 },
    { field: 'challenges', headerName: 'Challenges', minWidth: 180, flex: 1 },
    {
      field: 'user_name',
      headerName: 'Staff',
      width: 150,
      renderCell: (params) => <StaffCell name={params.value} />,
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
  ];

  if (onEdit || onDelete) {
    cols.push({
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (params) => <RowActions row={params.row} onEdit={onEdit} onDelete={onDelete} />,
    });
  }
  return cols;
}

function RowActions({ row, onEdit, onDelete }) {
  const { user } = useUser();
  if (!canManage(user, row.user)) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {onEdit && (
        <Tooltip title="Edit task">
          <IconButton size="small" onClick={() => onEdit(row)}>
            <EditRoundedIcon sx={{ fontSize: 18 }} color="primary" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete task">
          <IconButton size="small" onClick={() => onDelete(row)}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default function TasksTable({ fetchUrl = '/api/tasks/', title = 'Task activities', reload = 0, onEdit, onDelete }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api
      .get(fetchUrl)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [fetchUrl, reload]);

  return (
    <Box className="glass" sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <div className="section-head">
        <h2>{title}</h2>
        <Typography variant="caption" color="textSecondary">{rows?.length || 0} records</Typography>
      </div>
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No tasks found" hint="Tasks assigned to this project will appear here." />
      ) : (
        <Box className="dgrid" sx={{ height: { xs: 400, md: 520 } }}>
          <DataGrid
            rows={rows}
            columns={buildColumns(onEdit, onDelete)}
            getRowHeight={() => 'auto'}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[5, 10, 20]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: 'tasks' } } }}
            disableRowSelectionOnClick
            sx={{ '& .MuiDataGrid-cell': { py: 1.2 } }}
          />
        </Box>
      )}
    </Box>
  );
}