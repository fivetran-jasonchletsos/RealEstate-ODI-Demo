import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ArchitecturePage from './pages/ArchitecturePage';
import PipelinePage from './pages/PipelinePage';
import LeasingPage from './pages/LeasingPage';
import TenantCreditPage from './pages/TenantCreditPage';
import ESGPage from './pages/ESGPage';
import PolicyPage from './pages/PolicyPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/leasing" element={<LeasingPage />} />
          <Route path="/tenant-credit" element={<TenantCreditPage />} />
          <Route path="/esg" element={<ESGPage />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
