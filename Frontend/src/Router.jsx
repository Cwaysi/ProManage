import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Stakeholders from './components/Stakeholders';
import ProjectDetails from './components/ProjectDetails';
import Profile from './components/Profile';
import LogCard from './components/LogCard';
import StaffManagement from './components/StaffManagement';
import UpdateTask from './components/Update';
import NotFound from './components/NotFound';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/logout', element: <Logout /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projectdetails/:projectId', element: <ProjectDetails /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'updatetask/:id', element: <UpdateTask /> },
      { path: 'stakeholders', element: <Stakeholders /> },
      { path: 'profile', element: <Profile /> },
      { path: 'log', element: <LogCard /> },
      { path: 'staff', element: <StaffManagement /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default router;