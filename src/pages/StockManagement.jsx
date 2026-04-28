import { useState, useEffect, useRef } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Search, Loader2, Package, Warehouse, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './StockManagement.css';

const ITEMS_PER_PAGE = 10;

const StockManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('IN');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounce search
  const debounceTimer = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 400);
  };

  // Fetch paginated sub-products
  const fetchItems = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (search.trim()) params.append('search', search.trim());
      const res = await api.get(`/subproduct/all?${params.toString()}`);
      setItems(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Error fetching inventory data');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

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
      franchise: selectedItem.stock[0].franchiseId || selectedItem.franchise,
      product: selectedItem._id,
      quantity: Number(quantity)
    };

    try {
      await api.post(endpoint, payload);
      toast.success(`Stock ${modalType === 'IN' ? 'added' : 'removed'} successfully`);
      fetchItems(currentPage, debouncedSearch);
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error processing transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setQuantity('');
  };


  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Stock Operations</h1>
          <p>Quickly update inventory levels for any branch</p>
        </div>
      </div>

      <div className="content-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search items to update..."
              value={searchTerm}
              onChange={handleSearchChange}
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
              ) : items.length > 0 ? (
                items.map((item) => (
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

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} items
            </span>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`e-${idx}`} className="page-ellipsis">…</span>
                  ) : (
                    <button key={item} className={`page-btn ${currentPage === item ? 'active' : ''}`} onClick={() => handlePageChange(item)}>{item}</button>
                  )
                )
              }
              <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
            </div>
          </div>
        )}
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
