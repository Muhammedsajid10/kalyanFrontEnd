import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Package, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    description: '',
    price: '',
    categoryId: '',
    categoryName: '',
    rackNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/product/all'),
        api.get('/category/all')
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.category || []);
    } catch (error) {
      toast.error('Error fetching product data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCategoryChange = (e) => {
    const selectedCat = categories.find(c => c._id === e.target.value);
    setFormData({
      ...formData,
      categoryId: e.target.value,
      categoryName: selectedCat ? selectedCat.categoryName : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      name: formData.name,
      productCode: formData.productCode,
      description: formData.description,
      price: Number(formData.price),
      rackNumber: Number(formData.rackNumber),
      category: {
        categoryId: formData.categoryId,
        categoryName: formData.categoryName
      }
    };

    try {
      if (editingProduct) {
        await api.put(`/product/update/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/product/create', payload);
        toast.success('New product created successfully');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
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
        fetchData();
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
      categoryId: '',
      categoryName: '',
      rackNumber: ''
    });
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.productCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
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
                  <select value={formData.categoryId} onChange={handleCategoryChange} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
                    ))}
                  </select>
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
