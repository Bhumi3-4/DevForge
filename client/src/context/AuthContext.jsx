import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we've checked for an existing session

  //  On app load: restore session from localStorage, then verify with backend 
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('devforge_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify the token is still valid and get fresh user data
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        // Token invalid/expired — clear it (axios interceptor also handles this,
        // but we clear here too in case the request never reaches that interceptor path)
        localStorage.removeItem('devforge_token');
        localStorage.removeItem('devforge_user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  //  Register 
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('devforge_token', data.token);
    setUser(data.user);
    toast.success('Account created successfully!');
    return data;
  };

  //  Login 
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('devforge_token', data.token);
    setUser(data.user);
    toast.success('Welcome back!');
    return data;
  };

  //  Logout 
  const logout = () => {
    localStorage.removeItem('devforge_token');
    localStorage.removeItem('devforge_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  //  Update user in context after a profile edit 
  // Lets ProfilePage update the navbar avatar/name without a full page refresh
  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

//  Custom hook for consuming this context 
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};