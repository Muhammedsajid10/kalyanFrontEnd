import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Franchise from './pages/Franchise';
import Products from './pages/Products';
import SubProducts from './pages/SubProducts';
import StockManagement from './pages/StockManagement';
import StocksReport from './pages/StocksReport';
import ProductStock from './pages/ProductStock';
import LowStockProducts from './pages/LowStockProducts';

function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="franchise" element={<Franchise />} />
          <Route path="products" element={<Products />} />
          <Route path="sub-products" element={<SubProducts />} />
          <Route path="stocks" element={<ProductStock />} />
          <Route path="stock-management" element={<StockManagement />} />
          <Route path="stocks-report" element={<StocksReport />} />
          <Route path="low-stock" element={<LowStockProducts />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
