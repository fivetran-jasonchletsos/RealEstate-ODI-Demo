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
import ComparablesPage from './pages/ComparablesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import ScenarioPage from './pages/ScenarioPage';
import WizardLivePage from './pages/WizardLivePage';
import OutcomePage from './pages/OutcomePage';
import ActivationLivePage from './pages/ActivationLivePage';

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
          <Route path="/comparables" element={<ComparablesPage />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/scenario" element={<ScenarioPage />} />
          <Route path="/wizard-live" element={<WizardLivePage />} />
          <Route path="/outcome" element={<OutcomePage />} />
          <Route path="/activations-live" element={<ActivationLivePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
