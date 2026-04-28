import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Layers, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './SubProducts.css';

const ITEMS_PER_PAGE = 10;

const SubProducts = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    productId: '',
    franchiseId: '',
    quantity: 0,
    minimumQuantity: 0,
    price: 0,
    categoryName: '',
    rackNumber: ''
  });

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
      toast.error('Error fetching inventory');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products & franchises once for form dropdowns
  const fetchStatic = async () => {
    try {
      const [prodRes, franRes] = await Promise.all([
        api.get('/product/all?page=1&limit=1000'),
        api.get('/franchise/all')
      ]);
      setProducts(prodRes.data.products || []);
      setFranchises(franRes.data.franchise || []);
    } catch (error) {
      console.error('Error fetching static data:', error);
    }
  };

  useEffect(() => { fetchStatic(); }, []);

  useEffect(() => {
    fetchItems(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleProductChange = (e) => {
    const selectedProd = products.find(p => p._id === e.target.value);
    if (selectedProd) {
      setFormData({
        ...formData,
        productId: selectedProd._id,
        name: selectedProd.name,
        productCode: selectedProd.productCode,
        price: selectedProd.price,
        categoryName: selectedProd.category?.categoryName || '',
        rackNumber: selectedProd.rackNumber || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name,
      productCode: formData.productCode,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      minimumQuantity: Number(formData.minimumQuantity),
      rackNumber: Number(formData.rackNumber),
      franchise: formData.franchiseId,
      category: {
        categoryId: formData.productId,
        categoryName: formData.categoryName
      }
    };

    try {
      if (editingItem) {
        await api.put(`/subproduct/update/${editingItem._id}`, payload);
        toast.success('Inventory item updated successfully');
      } else {
        await api.post('/subproduct/create', payload);
        toast.success('Added to inventory successfully');
      }
      fetchItems(currentPage, debouncedSearch);
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await api.delete(`/subproduct/delete/${id}`);
        toast.success('Item deleted successfully');
        const newPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        fetchItems(newPage, debouncedSearch);
      } catch (error) {
        toast.error('Error deleting item');
        console.error('Error deleting sub-product:', error);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      productCode: item.productCode,
      productId: item.productName?._id || item.productName || '',
      franchiseId: item.franchise?._id || item.franchise || '',
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      price: item.price,
      categoryName: item.categoryName || '',
      rackNumber: item.rackNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      productCode: '',
      productId: '',
      franchiseId: '',
      quantity: 0,
      minimumQuantity: 0,
      price: 0,
      categoryName: '',
      rackNumber: ''
    });
  };



  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Inventory (Sub-Products)</h1>
          <p>Manage stock levels across different franchises</p>
        </div>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add to Inventory
        </button>
      </div>

      <div className="content-card glass">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name, code or franchise..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button className="filter-btn">
            <Filter size={18} />
            Filters
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Details</th>
                <th>Franchise</th>
                <th>Stock Level</th>
                <th>Price</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-row"><Loader2 className="spinner" /></td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-icon teal"><Layers size={16} /></div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-small">{item.productCode} • {item.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="franchise-tag">{item.franchise?.franchiseName || 'N/A'}</span></td>
                    <td>
                      <div className="stock-level">
                        <span className={`stock-status ${item.quantity <= item.minimumQuantity ? 'low' : 'good'}`}>
                          {item.quantity} / {item.minimumQuantity}
                        </span>
                        <div className="stock-bar">
                          <div
                            className="stock-progress"
                            style={{
                              width: `${Math.min((item.quantity / (item.minimumQuantity || 1)) * 50, 100)}%`,
                              backgroundColor: item.quantity <= item.minimumQuantity ? 'var(--error)' : 'var(--success)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">₹{item.price}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => handleEdit(item)}><Edit2 size={16} /></button>
                        <button className="icon-btn delete" onClick={() => handleDelete(item._id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No inventory items found.</td>
                </tr>
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
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={item}
                      className={`page-btn ${currentPage === item ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  )
                )
              }
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card wide">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Inventory Item' : 'Add to Inventory'}</h3>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Franchise</label>
                  <select
                    value={formData.franchiseId}
                    onChange={(e) => setFormData({ ...formData, franchiseId: e.target.value })}
                    required
                  >
                    <option value="">Select Franchise</option>
                    {franchises.map(f => (
                      <option key={f._id} value={f._id}>{f.franchiseName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Product Template</label>
                  <select
                    value={formData.productId}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">Choose Product</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.productCode})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Current Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Quantity Alert</label>
                  <input
                    type="number"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sale Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rack Number</label>
                  <input
                    type="text"
                    value={formData.rackNumber}
                    onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubProducts;
