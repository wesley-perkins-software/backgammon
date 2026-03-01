import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import PlayPage from '../App.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ChangelogPage from '../pages/ChangelogPage.jsx';
import FaqPage from '../pages/FaqPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PrivacyPage from '../pages/PrivacyPage.jsx';
import RulesPage from '../pages/RulesPage.jsx';
import StrategyPage from '../pages/StrategyPage.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
