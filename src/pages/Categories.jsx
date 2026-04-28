import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './Categories.css';

const ITEMS_PER_PAGE = 10;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ categoryName: '' });
  const [submitting, setSubmitting] = useState(false);

  // Debounce search — wait 400ms after user stops typing
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

  // Fetch paginated categories from server
  const fetchCategories = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (search.trim()) params.append('search', search.trim());
      const res = await api.get(`/category/all?${params.toString()}`);
      setCategories(res.data.category || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Error fetching categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever page or search changes
  useEffect(() => {
    fetchCategories(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/category/update/${editingCategory._id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/category/add', formData);
        toast.success('Category added successfully');
      }
      fetchCategories(currentPage, debouncedSearch);
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving category');
      console.error('Error saving category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/category/delete/${id}`);
        toast.success('Category deleted successfully');
        // If deleting last item on this page, go back one page
        const newPage = categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        fetchCategories(newPage, debouncedSearch);
      } catch (error) {
        toast.error('Error deleting category');
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ categoryName: category.categoryName });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ categoryName: '' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Categories</h1>
          <p>Manage product categories and classifications</p>
        </div>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="content-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Created At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="loading-row">
                    <Loader2 className="spinner" />
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td className="font-medium">{category.categoryName}</td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => handleEdit(category)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(category._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="empty-state">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} categories
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
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  placeholder="e.g. Electrical Tools"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
