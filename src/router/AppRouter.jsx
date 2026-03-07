import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ChangelogPage from '../pages/ChangelogPage.jsx';
import FaqPage from '../pages/FaqPage.jsx';
import FreeBackgammonPage from '../pages/FreeBackgammonPage.jsx';
import GlossaryPage from '../pages/GlossaryPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import PrivacyPage from '../pages/PrivacyPage.jsx';
import RulesPage from '../pages/RulesPage.jsx';
import SinglePlayerPage from '../pages/SinglePlayerPage.jsx';
import StrategyPage from '../pages/StrategyPage.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/single-player-backgammon" element={<SinglePlayerPage />} />
          <Route path="/free-backgammon-online" element={<FreeBackgammonPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
