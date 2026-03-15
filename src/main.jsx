import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import AppRouter from './router/AppRouter.jsx';
import { installGaPageTracking } from './analytics.js';
import './styles.css';


function AnalyticsTracker() {
  useEffect(() => installGaPageTracking(), []);
  return null;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <AnalyticsTracker />
      <AppRouter />
    </HelmetProvider>
  </React.StrictMode>
);
