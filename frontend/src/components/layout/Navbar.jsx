import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  PlusSquare, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">TacTac</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">
              <Home className="w-6 h-6" />
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/create" className="text-gray-600 hover:text-primary-600 transition-colors">
                  <PlusSquare className="w-6 h-6" />
                </Link>
                
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 hover:text-primary-600 transition-colors">
                    <Shield className="w-6 h-6" />
                  </Link>
                )}

                <Link to={`/user/${user.username}`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </Link>

                <Link to="/settings" className="text-gray-600 hover:text-primary-600 transition-colors">
                  <Settings className="w-6 h-6" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-4">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 text-gray-600 hover:text-primary-600"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 text-gray-600 hover:text-primary-600"
                >
                  <PlusSquare className="w-5 h-5" />
                  <span>Create Post</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 text-gray-600 hover:text-primary-600"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link
                  to={`/user/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 text-gray-600 hover:text-primary-600"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 text-gray-600 hover:text-primary-600"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 text-gray-600 hover:text-red-600 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-600 hover:text-primary-600 font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-primary-600 text-white px-4 py-2 rounded-lg text-center font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
