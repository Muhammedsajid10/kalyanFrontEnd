import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import './Dashboard.css';

import LoadingScreen from '../components/LoadingScreen';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalFranchise: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, lowStockRes] = await Promise.all([
          api.get('/api/dashboard'),
          api.get('/api/low-stock-products')
        ]);

        setStats({
          totalProducts: dashRes.data.totalProducts || 0,
          totalCategories: dashRes.data.totalCategories || 0,
          totalFranchise: dashRes.data.totalfranchise || 0,
          lowStockCount: dashRes.data.lowStockCount || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Syncing Dashboard Data..." />;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {/* Total Categories */}
        <div className="stat-card">
          <span className="stat-label">Total Categories</span>
          <span className="stat-value">{stats.totalCategories}</span>
          <div className="card-indicator"></div>
        </div>

        {/* Total Franchise */}
        <div className="stat-card">
          <span className="stat-label">Total Franchise</span>
          <span className="stat-value">{stats.totalFranchise}</span>
          <div className="card-indicator"></div>
        </div>

        {/* Total Products */}
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{stats.totalProducts}</span>
          <div className="card-indicator"></div>
        </div>

        {/* Low Stock Alert */}
        <div className="stat-card alert cursor-pointer" onClick={() => navigate('/low-stock')}>
          <span className="stat-label">
            <AlertTriangle size={18} />
            Low Stock Alert
          </span>
          <span className="stat-value">{stats.lowStockCount}</span>
          <span className="stat-link">Click to view details <ChevronRight size={12} /></span>
          <div className="card-indicator"></div>
        </div>
      </div>

      {/* Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="stock-alert-banner">
          <AlertTriangle className="icon" size={20} />
          <div className="alert-content">
            <span className="alert-title">Stock Alert!</span>
            You have <span className="font-bold">{stats.lowStockCount} products</span> below minimum quantity. 
            <a href="/low-stock" className="alert-link">View Details</a>
          </div>
        </div>
      )}
      
      {/* Additional sections can be added here if needed */}
    </div>
  );
};

export default Dashboard;
