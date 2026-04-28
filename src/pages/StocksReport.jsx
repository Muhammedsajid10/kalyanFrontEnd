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
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 15;

  const fetchData = async (currentPage) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage,
        limit: LIMIT,
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
      setTotalCount(stockRes.data.totalCount || 0);
      setFranchises(franRes.data.franchise || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when filters/search change, then fetch
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, typeFilter, franchiseFilter]);

  // Fetch when page changes (filter changes already handle via above effect)
  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

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

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount} records
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={item}
                      className={`page-btn ${page === item ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  )
                )
              }
              <button
                className="page-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StocksReport;
