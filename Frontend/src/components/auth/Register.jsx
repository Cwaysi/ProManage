import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextField, Button, Alert, CircularProgress, Stack, Box,
} from '@mui/material';
import api from '../../api';
import AuthLayout from './AuthLayout';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const fields = ['first_name', 'last_name', 'email', 'username', 'password', 'confirm'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (fields.some((f) => !form[f].trim())) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/user/register/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        username: form.username,
        password: form.password,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.username?.[0] ||
          data?.email?.[0] ||
          data?.detail ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2>Create account</h2>
      <p className="auth-sub">Join the workspace to start tracking projects.</p>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} variant="filled">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField fullWidth label="First name" value={form.first_name} onChange={set('first_name')} />
            <TextField fullWidth label="Last name" value={form.last_name} onChange={set('last_name')} />
          </Box>
          <TextField fullWidth label="Email address" type="email" value={form.email} onChange={set('email')} />
          <TextField fullWidth label="Username" value={form.username} onChange={set('username')} autoComplete="username" />
          <TextField
            fullWidth label="Password" type="password" value={form.password}
            onChange={set('password')} autoComplete="new-password" helperText="At least 8 characters"
          />
          <TextField
            fullWidth label="Confirm password" type="password" value={form.confirm}
            onChange={set('confirm')} autoComplete="new-password"
          />
          <Button
            type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.2, fontSize: 15 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
          </Button>
        </Stack>
      </form>

      <Box sx={{ textAlign: 'center', mt: 3, color: 'var(--muted)', fontSize: 14 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Sign in
        </Link>
      </Box>
    </AuthLayout>
  );
}