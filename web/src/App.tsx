import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchPage />} />
          <Route path="item/:id" element={<DetailPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
