import { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Avatar, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import api from '../../api';
import Loading from '../common/Loading';
import EmptyState from '../common/EmptyState';
import { useUser } from '../../context/UserContext';
import { canManage, formatDate, getInitials, avatarColor } from '../../utils';

function PersonCell({ name }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: avatarColor(name) }}>
        {getInitials(name.split(' ')[0], name.split(' ')[1])}
      </Avatar>
      <Typography fontSize={13}>{name}</Typography>
    </Box>
  );
}

function baseColumns(onEdit, onDelete, allowActions) {
  const cols = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'project_name', headerName: 'Project', width: 160 },
    { field: 'name', headerName: 'Name', width: 170, renderCell: (params) => <PersonCell name={params.value} /> },
    { field: 'position', headerName: 'Position', width: 160 },
    {
      field: 'email',
      headerName: 'Contact',
      width: 220,
      renderCell: (params) => (
        <Box component="a" href={`mailto:${params.value}`} sx={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
          {params.value || '—'}
        </Box>
      ),
    },
    {
      field: 'activity',
      headerName: 'Activity',
      minWidth: 180,
      flex: 1,
      renderCell: (params) => (
        <Typography fontSize={13} sx={{ color: 'var(--muted)' }}>{params.value || '—'}</Typography>
      ),
    },
    { field: 'created_at', headerName: 'Added', width: 120, renderCell: (params) => formatDate(params.value) },
  ];

  if (onEdit || onDelete) {
    cols.push({
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <RowActions row={params.row} onEdit={onEdit} onDelete={onDelete} allowActions={allowActions} />
      ),
    });
  }
  return cols;
}

function RowActions({ row, onEdit, onDelete, allowActions }) {
  const { user } = useUser();
  if (!allowActions && !canManage(user, row.created_by)) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {onEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(row)}>
            <EditRoundedIcon sx={{ fontSize: 18 }} color="primary" />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(row)}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} color="error" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default function StakeholdersTable({ fetchUrl = '/api/createstake/', title = 'Team & stakeholders', rows: rowsProp, onEdit, onDelete, allowActions }) {
  const [rows, setRows] = useState(rowsProp || null);

  useEffect(() => {
    if (rowsProp !== undefined) {
      setRows(rowsProp);
      return;
    }
    api
      .get(fetchUrl)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [fetchUrl, rowsProp]);

  return (
    <Box className="glass" sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <div className="section-head">
        <h2>{title}</h2>
        <Chip size="small" label={`${rows?.length || 0} people`} variant="outlined" />
      </div>
      {rows === null ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No stakeholders yet" hint="Add stakeholders to this project to see them here." />
      ) : (
        <Box className="dgrid" sx={{ height: { xs: 400, md: 480 } }}>
          <DataGrid
            rows={rows}
            columns={baseColumns(onEdit, onDelete, allowActions)}
            getRowHeight={() => 'auto'}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            pageSizeOptions={[5, 10, 20]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, csvOptions: { fileName: 'stakeholders' } } }}
            disableRowSelectionOnClick
            sx={{ '& .MuiDataGrid-cell': { py: 1.2 } }}
          />
        </Box>
      )}
    </Box>
  );
}