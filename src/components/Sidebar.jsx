import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Warehouse, 
  ClipboardList, 
  TrendingUp, 
  Settings,
  X,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import './Sidebar.css';
import logo from '../assets/kalyan logooo.png';

const Sidebar = ({ isOpen, toggle }) => {
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Franchise', icon: <Warehouse size={20} />, path: '/franchise' },
    { name: 'Categories', icon: <Tags size={20} />, path: '/categories' },
    { name: 'Products', icon: <Package size={20} />, path: '/products' },
    { name: 'Sub Products', icon: <PlusCircle size={20} />, path: '/sub-products' },
    { name: 'Product Stock', icon: <TrendingUp size={20} />, path: '/stocks' },
    { name: 'Stock Management', icon: <ClipboardList size={20} />, path: '/stock-management' },
    { name: 'Low Stock', icon: <AlertTriangle size={20} />, path: '/low-stock' },
    { name: 'Stocks Report', icon: <TrendingUp size={20} />, path: '/stocks-report' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <img src={logo} alt="Kalyan Logo" className="sidebar-logo" />
        </div>
        <button className="mobile-close" onClick={toggle}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={() => window.innerWidth < 1024 && toggle()}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="settings-link">
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
