import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import KanbanBoard from './pages/KanbanBoard';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import Messages from './pages/Messages';

function App() {
  return (
    <Routes>
      {/*  Public Routes  */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/board" element={<KanbanBoard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route path="/messages" element={<Messages />} />
<Route path="/messages/:userId" element={<Messages />} />

      {/*  Fallback  */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;