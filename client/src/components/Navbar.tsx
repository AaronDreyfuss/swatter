import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useDarkMode from '../hooks/useDarkMode';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <Link
        to="/projects"
        className="text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
      >
        Swatter
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{user.email}</span>
        <button onClick={toggle} className="btn-ghost">
          {isDark ? 'Light' : 'Dark'}
        </button>
        <button onClick={handleLogout} className="btn-secondary">
          Log out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
