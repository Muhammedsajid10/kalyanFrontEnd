import { useState, useEffect } from 'react';
import { Search, Loader2, Package, Filter, AlertTriangle, CheckCircle2, MoreHorizontal, Layers, Warehouse, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import './ProductStock.css';

const ProductStock = () => {
  const [stocks, setStocks] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockRes, franRes] = await Promise.all([
        api.get('/subproduct/all'),
        api.get('/franchise/all')
      ]);
      setStocks(stockRes.data.products || []);
      setFranchises(franRes.data.franchise || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStockStatus = (quantity, minQuantity) => {
    if (quantity <= 0) return { label: 'Out of Stock', class: 'out', icon: <AlertTriangle size={12} /> };
    if (quantity <= minQuantity) return { label: 'Low Stock', class: 'low', icon: <AlertTriangle size={12} /> };
    return { label: 'In Stock', class: 'good', icon: <CheckCircle2 size={12} /> };
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFranchise = !franchiseFilter || (stock.franchise?._id === franchiseFilter || stock.franchise === franchiseFilter);
    
    const status = getStockStatus(stock.quantity, stock.minimumQuantity);
    const matchesStatus = stockStatusFilter === 'all' || 
                        (stockStatusFilter === 'low' && status.class === 'low') ||
                        (stockStatusFilter === 'out' && status.class === 'out');

    return matchesSearch && matchesFranchise && matchesStatus;
  });

  const totalQuantity = filteredStocks.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = filteredStocks.filter(item => item.quantity <= item.minimumQuantity).length;

  return (
    <div className="page-container product-stock-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Product Stocks</h1>
          <p>Real-time inventory levels across all distribution centers</p>
        </div>
        <div className="header-actions">
          <button className="add-button secondary" onClick={fetchData}>
            <TrendingUp size={18} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="stock-grid mb-4">
        <div className="summary-card glass">
          <div className="summary-icon blue" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Package size={24} />
          </div>
          <div className="summary-info">
            <h4>Total Items</h4>
            <p>{filteredStocks.length}</p>
          </div>
        </div>
        <div className="summary-card glass">
          <div className="summary-icon teal" style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' }}>
            <Layers size={24} />
          </div>
          <div className="summary-info">
            <h4>Total Quantity</h4>
            <p>{totalQuantity.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card glass">
          <div className="summary-icon red" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="summary-info">
            <h4>Low Stock Alerts</h4>
            <p>{lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="content-card glass">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <Warehouse size={16} className="filter-icon" />
              <select value={franchiseFilter} onChange={(e) => setFranchiseFilter(e.target.value)}>
                <option value="">All Franchises</option>
                {franchises.map(f => (
                  <option key={f._id} value={f._id}>{f.franchiseName}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <Filter size={16} className="filter-icon" />
              <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Information</th>
                <th>Franchise / Branch</th>
                <th>Current Stock</th>
                <th>Min Qty</th>
                <th>Status</th>
                <th className="text-right">Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="loading-row"><Loader2 className="spinner" /></td>
                </tr>
              ) : filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => {
                  const status = getStockStatus(stock.quantity, stock.minimumQuantity);
                  const percentage = Math.min((stock.quantity / (stock.minimumQuantity || 1)) * 50, 100);
                  
                  return (
                    <tr key={stock._id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-icon"><Package size={16} /></div>
                          <div>
                            <p className="font-medium">{stock.name}</p>
                            <p className="text-small">{stock.productCode}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="franchise-info">
                          <Warehouse size={14} />
                          <span>{stock.franchise?.franchiseName || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="quantity-display">
                          <span className="quantity-main">{stock.quantity}</span>
                          <span className="quantity-sub">units available</span>
                        </div>
                      </td>
                      <td className="text-muted">{stock.minimumQuantity}</td>
                      <td>
                        <span className={`stock-status-chip ${status.class}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="progress-container">
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${percentage}%`,
                              background: status.class === 'low' || status.class === 'out' ? '#ef4444' : '#10b981'
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">No stock records found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductStock;
