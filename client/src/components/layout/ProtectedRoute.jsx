import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Auth state still initializing (checking localStorage / verifying token)
  // Render nothing yet — avoids a flash of the login page for already-logged-in users
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the page they were trying to reach so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;