import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/curenet_logo.png';

const navLinks = [
  { to: '/', label: 'HOME' },
  { to: '/doctors', label: 'ALL DOCTORS' },
  { to: '/about', label: 'ABOUT' },
  { to: '/contact', label: 'CONTACT US' },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm font-sans w-full">
      <div className="w-full px-4 sm:px-6 md:px-10 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={closeMobileMenu}>
          <img src={logo} className="w-32 md:w-44 cursor-pointer" alt="CureNET" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium text-gray-600 items-center">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="hover:text-blue-600 whitespace-nowrap">
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex gap-4 items-center shrink-0">
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="text-gray-800 font-bold hover:text-blue-600 truncate max-w-[120px] lg:max-w-none"
              >
                {displayName}
              </Link>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200 shrink-0">
                {initial}
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
                className="bg-blue-600 text-white px-4 lg:px-6 py-2 rounded-full font-medium hover:bg-blue-700"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white w-full">
          <div className="w-full px-4 sm:px-6 md:px-10 py-4 flex flex-col gap-4">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
                onClick={closeMobileMenu}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="text-gray-800 font-bold hover:text-blue-600 py-2 flex items-center gap-2"
                    onClick={closeMobileMenu}
                  >
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {initial}
                    </span>
                    {displayName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-500 text-sm font-medium hover:underline text-left py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="text-blue-600 font-medium py-2"
                    onClick={closeMobileMenu}
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-600 text-white text-center py-2.5 px-4 rounded-full font-medium"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
