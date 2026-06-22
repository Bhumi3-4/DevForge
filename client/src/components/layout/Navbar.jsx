import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);

  //  Fetch unread notification count on mount 
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch {
        // Silently fail — a missing badge count shouldn't break the navbar
      }
    };
    fetchUnreadCount();
  }, []);

  //  Close user menu when clicking outside it 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Messages', path: '/messages' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/*  Logo  */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-blue-500">Dev</span>Forge
          </Link>

          {/*  Desktop Nav Links  */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/*  Right side: search, bell, avatar  */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Search projects"
            >
              <Search size={20} />
            </button>

            <Link
              to="/notifications"
              className="relative text-gray-400 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/*  User menu dropdown  */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-gray-700"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1">
                  <p className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700 truncate">
                    {user?.name}
                  </p>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    <User size={16} /> My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/*  Mobile menu toggle  */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/*  Mobile menu panel  */}
        {mobileNavOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileNavOpen(false)}
                className="text-gray-300 hover:text-white text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/notifications"
              onClick={() => setMobileNavOpen(false)}
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileNavOpen(false)}
              className="text-gray-300 hover:text-white text-sm font-medium"
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-left text-red-400 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;