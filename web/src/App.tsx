import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchPage />} />
          <Route path="item/:id" element={<DetailPage />} />
          <Route path="device/:id" element={<DeviceDetailPage />} />
          
          {/* Admin page - dev only */}
          {import.meta.env.DEV && <Route path="admin" element={<AdminPage />} />}
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
