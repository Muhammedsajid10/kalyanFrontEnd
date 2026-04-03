import { useState, useEffect } from 'react';
import { Search, Loader2, Calendar, ArrowUpCircle, ArrowDownCircle, Filter, Download } from 'lucide-react';
import api from '../api/axios';
import './StocksReport.css';

const StocksReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [franchiseFilter, setFranchiseFilter] = useState('');
  const [franchises, setFranchises] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 15,
        search: searchTerm,
        type: typeFilter,
        franchise: franchiseFilter
      }).toString();
      
      const [stockRes, franRes] = await Promise.all([
        api.get(`/stock/all?${query}`),
        api.get('/franchise/all')
      ]);
      
      setReports(stockRes.data.results || []);
      setTotalPages(stockRes.data.totalPages || 1);
      setFranchises(franRes.data.franchise || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, typeFilter, franchiseFilter, page]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-info">
          <h1>Stock Reports</h1>
          <p>Complete transaction history and movement logs</p>
        </div>
        <button className="add-button secondary">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="content-card glass">
        <div className="report-controls">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="add">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
            
            <select value={franchiseFilter} onChange={(e) => setFranchiseFilter(e.target.value)}>
              <option value="">All Franchises</option>
              {franchises.map(f => (
                <option key={f._id} value={f._id}>{f.franchiseName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Product</th>
                <th>Franchise</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Stock After</th>
              </tr>
            </thead>
            <tbody>
              {loading && reports.length === 0 ? (
                <tr><td colSpan="6" className="loading-row"><Loader2 className="spinner" /></td></tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <div>
                          <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                          <p className="text-small">{new Date(report.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{report.product?.productName}</p>
                        <p className="text-small">{report.product?.productCode}</p>
                      </div>
                    </td>
                    <td>{report.franchise?.franchiseName}</td>
                    <td>
                      <span className={`type-tag ${report.type}`}>
                        {report.type === 'add' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        {report.type === 'add' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="font-medium">{report.quantity}</td>
                    <td>{report.totalQuantity}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="empty-state">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="pager-btn"
          >Previous</button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            className="pager-btn"
          >Next</button>
        </div>
      </div>
    </div>
  );
};

export default StocksReport;
