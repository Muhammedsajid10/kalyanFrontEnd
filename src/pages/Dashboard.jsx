import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Warehouse,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../api/axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalFranchise: 0,
    lowStockCount: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
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
          lowStockCount: lowStockRes.data.totalProducts || 0
        });

        setLowStockItems(lowStockRes.data.products || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = [
    { name: 'Jan', stockIn: 400, stockOut: 240 },
    { name: 'Feb', stockIn: 300, stockOut: 139 },
    { name: 'Mar', stockIn: 200, stockOut: 980 },
    { name: 'Apr', stockIn: 278, stockOut: 390 },
    { name: 'May', stockIn: 189, stockOut: 480 },
    { name: 'Jun', stockIn: 239, stockOut: 380 },
  ];

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Overview</h1>
        <div className="date-filter">
          Last 30 Days
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats.totalProducts}</span>
            <span className="stat-trend positive">
              <ArrowUpRight size={16} /> 12%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon categories">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{stats.totalCategories}</span>
            <span className="stat-trend positive">
              <ArrowUpRight size={16} /> 4%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon franchise">
            <Warehouse size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Franchises</span>
            <span className="stat-value">{stats.totalFranchise}</span>
            <span className="stat-trend neutral">
              0%
            </span>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon low-stock">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value">{stats.lowStockCount}</span>
            <span className="stat-trend negative">
              <ArrowDownRight size={16} /> Update needed
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card glass">
          <h3>Stock Movement</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="stockIn" stroke="var(--primary)" fillOpacity={1} fill="url(#colorIn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass">
          <h3>Inventory Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                />
                <Legend />
                <Bar dataKey="stockIn" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="recent-activity glass">
        <div className="section-header">
          <h3>Low Stock Critical Alerts</h3>
          <button className="view-all">View All</button>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Qty</th>
                <th>Min Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 5).map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.quantity}</td>
                    <td>{item.minimumQuantity}</td>
                    <td>
                      <span className="status-badge critical">Low Stock</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No low stock items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
