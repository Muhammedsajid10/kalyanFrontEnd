import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Package, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './Products.css';

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catLoadingMore, setCatLoadingMore] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  // Refs to avoid stale closures in scroll handler
  const catPageRef = useRef(1);
  const catHasMoreRef = useRef(true);
  const catLoadingRef = useRef(false);
  const catSearchRef = useRef('');
  const [catSearch, setCatSearch] = useState('');
  const catDropdownRef = useRef(null);
  const catListRef = useRef(null);
  const catSearchTimer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    description: '',
    price: '',
    quantity: '',
    minimumQuantity: '',
    categoryId: '',
    categoryName: '',
    rackNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounce search — wait 400 ms after user stops typing
  const debounceTimer = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1); // reset to first page on new search
    }, 400);
  };

  // Fetch paginated products from server
  const fetchProducts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (search.trim()) params.append('search', search.trim());
      const res = await api.get(`/product/all?${params.toString()}`);
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Error fetching product data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories with pagination (lazy loading for dropdown)
  const loadCategories = async (page = 1, search = '', reset = false) => {
    if (catLoadingRef.current) return;  // guard against concurrent calls
    catLoadingRef.current = true;
    setCatLoadingMore(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) params.append('search', search.trim());
      const res = await api.get(`/category/all?${params.toString()}`);
      const newCats = res.data.category || [];
      setCategories(prev => reset ? newCats : [...prev, ...newCats]);
      const totalPg = res.data.totalPages || 1;
      catHasMoreRef.current = page < totalPg;
      catPageRef.current = page;
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      catLoadingRef.current = false;
      setCatLoadingMore(false);
    }
  };

  // Load first page of categories on mount
  useEffect(() => { loadCategories(1, '', true); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll handler — uses refs so it always has fresh values (no stale closure)
  const handleCatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (
      scrollHeight - scrollTop - clientHeight < 50 &&
      catHasMoreRef.current &&
      !catLoadingRef.current
    ) {
      loadCategories(catPageRef.current + 1, catSearchRef.current);
    }
  };

  // Search inside category dropdown — uses ref so scroll handler sees latest value
  const handleCatSearchInput = (e) => {
    const val = e.target.value;
    setCatSearch(val);
    catSearchRef.current = val;
    clearTimeout(catSearchTimer.current);
    catSearchTimer.current = setTimeout(() => {
      loadCategories(1, val, true);
    }, 400);
  };

  // Re-fetch products whenever page or search changes
  useEffect(() => {
    fetchProducts(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("sfdads")
    const payload = {
      name: formData.name,
      productCode: formData.productCode,
      description: formData.description,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      rackNumber: Number(formData.rackNumber),
      category: {
        categoryId: formData.categoryId,
        categoryName: formData.categoryName
      },

    };

    try {
      if (editingProduct) {
        await api.put(`/product/update/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/product/create', payload);
        toast.success('New product created successfully');
      }
      fetchProducts(currentPage, debouncedSearch);
      handleCloseModal();

    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/product/delete/${id}`);
        toast.success('Product deleted successfully');
        // If deleting last item on this page, go back one page
        const newPage = products.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        fetchProducts(newPage, debouncedSearch);
      } catch (error) {
        toast.error('Error deleting product');
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      productCode: product.productCode,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity || '',
      minimumQuantity: product.minimumQuantity || '',
      categoryId: product.category?.categoryId || '',
      categoryName: product.category?.categoryName || '',
      rackNumber: product.rackNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      productCode: '',
      description: '',
      price: '',
      quantity: '',
      minimumQuantity: '',
      categoryId: '',
      categoryName: '',
      rackNumber: ''
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Product Catalog</h1>
          <p>Manage master products and pricing</p>
        </div>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="content-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
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
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Rack No.</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-row"><Loader2 className="spinner" /></td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-icon"><Package size={16} /></div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-small">{p.productCode}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="category-tag">{p.category?.categoryName}</span></td>
                    <td className="font-medium">₹{p.price}</td>
                    <td>{p.rackNumber}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => handleEdit(p)}><Edit2 size={16} /></button>
                        <button className="icon-btn delete" onClick={() => handleDelete(p._id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} products
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
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Product Code</label>
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <div className="cat-dropdown" ref={catDropdownRef}>
                    <div
                      className={`cat-trigger ${catDropdownOpen ? 'open' : ''}`}
                      onClick={() => {
                        setCatDropdownOpen(o => !o);
                        if (!catDropdownOpen) {
                          setCatSearch('');
                          loadCategories(1, '', true);
                        }
                      }}
                    >
                      <span className={formData.categoryName ? '' : 'placeholder'}>
                        {formData.categoryName || 'Select Category'}
                      </span>
                      <ChevronDown size={14} className={`cat-chevron ${catDropdownOpen ? 'rotated' : ''}`} />
                    </div>
                    {catDropdownOpen && (
                      <div className="cat-list-wrapper">
                        <div className="cat-search-box">
                          <Search size={13} className="cat-search-icon" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={catSearch}
                            onChange={handleCatSearchInput}
                            autoFocus
                          />
                        </div>
                        <div className="cat-list" ref={catListRef} onScroll={handleCatScroll}>
                          {categories.length === 0 && !catLoadingMore && (
                            <div className="cat-empty">No categories found</div>
                          )}
                          {categories.map(cat => (
                            <div
                              key={cat._id}
                              className={`cat-option ${formData.categoryId === cat._id ? 'selected' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, categoryId: cat._id, categoryName: cat.categoryName });
                                setCatDropdownOpen(false);
                              }}
                            >
                              {cat.categoryName}
                            </div>
                          ))}
                          {catLoadingMore && (
                            <div className="cat-loading-more">
                              <Loader2 size={14} className="spinner" /> Loading...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
