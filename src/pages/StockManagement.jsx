import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Search, Loader2, Package, Warehouse, History } from 'lucide-react';
import api from '../api/axios';
import './StockManagement.css';

const StockManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('IN'); // 'IN' or 'OUT'
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get('/subproduct/all');
      setItems(response.data.products || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;
    
    setSubmitting(true);
    const endpoint = modalType === 'IN' ? '/stock/add' : '/stock/out';
    const payload = {
      franchise: selectedItem.franchise?._id || selectedItem.franchise,
      product: selectedItem._id,
      quantity: Number(quantity)
    };

    try {
      await api.post(endpoint, payload);
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setQuantity('');
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.franchise?.franchiseName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Stock Operations</h1>
          <p>Quickly update inventory levels for any branch</p>
        </div>
      </div>

      <div className="content-card glass">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search items to update..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Franchise</th>
                <th>Current Stock</th>
                <th className="text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="loading-row"><Loader2 className="spinner" /></td></tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="product-cell">
                        <div className={`product-icon ${item.quantity <= item.minimumQuantity ? 'red' : 'blue'}`}>
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-small">{item.productCode}</p>
                        </div>
                      </div>
                    </td>
                    <td><div className="name-cell"><Warehouse size={14} /> {item.franchise?.franchiseName}</div></td>
                    <td>
                      <span className={`stock-badge ${item.quantity <= item.minimumQuantity ? 'low' : ''}`}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-center">
                        <button className="stock-btn in" onClick={() => handleAction(item, 'IN')}>
                          <ArrowUpCircle size={18} /> Stock In
                        </button>
                        <button className="stock-btn out" onClick={() => handleAction(item, 'OUT')}>
                          <ArrowDownCircle size={18} /> Stock Out
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="empty-state">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                {modalType === 'IN' ? <ArrowUpCircle className="text-success" /> : <ArrowDownCircle className="text-error" />}
                <h3>{modalType === 'IN' ? 'Add Stock' : 'Remove Stock'}</h3>
              </div>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <div className="modal-info-bar">
              <div className="info-item">
                <label>Item</label>
                <span>{selectedItem?.name}</span>
              </div>
              <div className="info-item">
                <label>Location</label>
                <span>{selectedItem?.franchise?.franchiseName}</span>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Quantity to {modalType === 'IN' ? 'Add' : 'Remove'}</label>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter positive number"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className={`submit-btn ${modalType === 'OUT' ? 'btn-error' : 'btn-success'}`} disabled={submitting}>
                  {submitting ? 'Processing...' : `Confirm Stock ${modalType === 'IN' ? 'In' : 'Out'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
