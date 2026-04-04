import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  AlertTriangle, 
  RotateCcw, 
  RefreshCw, 
  Package, 
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import './LowStockProducts.css';

const LowStockProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        limit: 20,
        search: searchTerm,
        franchise: selectedFranchise
      }).toString();

      const [prodRes, franRes] = await Promise.all([
        api.get(`/api/low-stock-products?${query}`),
        api.get('/franchise/all')
      ]);

      setProducts(prodRes.data.products || []);
      setFranchises(franRes.data.franchise || []);
    } catch (error) {
      toast.error('Error fetching low stock products');
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, selectedFranchise]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchData();
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedFranchise('');
    setPage(1);
    fetchData();
  };

  const getFranchiseName = () => {
    if (!selectedFranchise) return "Kalyan main hub";
    const f = franchises.find(fran => fran._id === selectedFranchise);
    return f ? f.franchiseName : "Kalyan main hub";
  };

  return (
    <div className="page-container low-stock-page">
      <div className="low-stock-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          <div className="title-group">
            <h1 className="low-stock-title">
              <AlertTriangle className="icon-orange" size={24} />
              Low Stock Products in {getFranchiseName()}
            </h1>
            <p className="subtitle">Products with quantity at or below minimum threshold</p>
          </div>
        </div>

        <div className="low-stock-controls">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search by product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <div className="control-actions">
            <select 
              className="franchise-select"
              value={selectedFranchise}
              onChange={(e) => setSelectedFranchise(e.target.value)}
            >
              <option value="">Select Franchise</option>
              {franchises.map(f => (
                <option key={f._id} value={f._id}>{f.franchiseName}</option>
              ))}
            </select>
            <button className="reset-btn" onClick={handleReset}>
              <RotateCcw size={18} /> Reset
            </button>
            <button className="refresh-btn" onClick={fetchData}>
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="attention-banner">
        <AlertTriangle size={18} />
        <span>{products.length} Products Need Attention</span>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Sl.no</th>
                <th>Rack</th>
                <th>Code</th>
                <th>Product Name</th>
                <th>Qty</th>
                <th>Min</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="loading-cell"><Loader2 className="spinner" /> Loading products...</td></tr>
              ) : products.length > 0 ? (
                products.map((p, index) => (
                  <tr key={p._id}>
                    <td>{(page - 1) * 20 + index + 1}</td>
                    <td><span className="rack-badge">{p.rackNumber || 0}</span></td>
                    <td className="pink-text">{p.productCode}</td>
                    <td className="font-bold">{p.name || p.productName}</td>
                    <td className="red-text">{p.quantity}</td>
                    <td>{p.minimumQuantity}</td>
                    <td>₹{p.price}</td>
                    <td>
                      {p.quantity === 0 ? (
                        <span className="out-of-stock-badge">Out of Stock</span>
                      ) : (
                        <span className="low-stock-badge">Low Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn stock-in" onClick={() => navigate('/stock-management')}>
                          <Package size={14} />
                          <span>In</span>
                        </button>
                        <button className="action-btn stock-out" onClick={() => navigate('/stock-management')}>
                          <Package size={14} />
                          <span>Out</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="empty-state">No low stock products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LowStockProducts;
