import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h1 className="header-title">Management System</h1>
      </div>

      <div className="header-right">
        <div className="icon-button">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </div>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Admin'}</span>
            <span className="user-role">Administrator</span>
          </div>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>

        <button className="logout-button" onClick={logout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
