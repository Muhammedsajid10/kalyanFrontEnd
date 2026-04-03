import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      <div className={`main-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />

        <main className="main-content">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default AdminLayout;
