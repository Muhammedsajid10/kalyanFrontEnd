import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Warehouse } from 'lucide-react';
import api from '../api/axios';
import './Franchise.css';

const Franchise = () => {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState(null);
  const [formData, setFormData] = useState({ franchiseName: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchFranchises = async () => {
    try {
      const response = await api.get('/franchise/all');
      setFranchises(response.data.franchise || []);
    } catch (error) {
      console.error('Error fetching franchises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFranchises(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingFranchise) {
        await api.put(`/franchise/update/${editingFranchise._id}`, formData);
      } else {
        await api.post('/franchise/add', formData);
      }
      fetchFranchises();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving franchise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this franchise?')) {
      try {
        await api.delete(`/franchise/delete/${id}`);
        fetchFranchises();
      } catch (error) {
        console.error('Error deleting franchise:', error);
      }
    }
  };

  const handleEdit = (franchise) => {
    setEditingFranchise(franchise);
    setFormData({ franchiseName: franchise.franchiseName });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFranchise(null);
    setFormData({ franchiseName: '' });
  };

  const filteredFranchises = franchises.filter(f => 
    f.franchiseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Franchise Management</h1>
          <p>Control access and manage branch locations</p>
        </div>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Franchise
        </button>
      </div>

      <div className="content-card glass">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search franchises..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Franchise Name</th>
                <th>Created At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="loading-row"><Loader2 className="spinner" /></td>
                </tr>
              ) : filteredFranchises.length > 0 ? (
                filteredFranchises.map((f) => (
                  <tr key={f._id}>
                    <td className="font-medium">
                      <div className="name-cell">
                        <Warehouse size={16} className="table-icon" />
                        {f.franchiseName}
                      </div>
                    </td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="icon-btn edit" onClick={() => handleEdit(f)}><Edit2 size={16} /></button>
                        <button className="icon-btn delete" onClick={() => handleDelete(f._id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="empty-state">No franchises found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingFranchise ? 'Edit Franchise' : 'Add New Franchise'}</h3>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Franchise Name</label>
                <input 
                  type="text" 
                  value={formData.franchiseName}
                  onChange={(e) => setFormData({ ...formData, franchiseName: e.target.value })}
                  placeholder="e.g. Mumbai Main Branch"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : editingFranchise ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Franchise;
