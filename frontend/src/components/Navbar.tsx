import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/curenet_logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User' : '';
  const initial = (user?.firstName?.charAt(0) ?? user?.lastName?.charAt(0) ?? '?').toUpperCase();

  const dashboardPath =
    user?.role === 'patient'
      ? '/app/dashboard'
      : user?.role === 'doctor'
        ? '/app/doctor-dashboard'
        : '/app/admin-dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} className="w-44 cursor-pointer" alt="CureNET" />
        </Link>

        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600 items-center">
          <Link to="/" className="hover:text-blue-600">
            HOME
          </Link>
          <Link to="/app/doctors" className="hover:text-blue-600">
            ALL DOCTORS
          </Link>
          <Link to="/about" className="hover:text-blue-600">
            ABOUT
          </Link>
          <Link to="/contact" className="hover:text-blue-600">
            CONTACT US
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardPath}
                  className="text-gray-800 font-bold hover:text-blue-600"
                >
                  {displayName}
                </Link>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                  {initial}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-500 text-sm font-medium hover:underline border px-3 py-1 rounded hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Sign up
              </Link>
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
