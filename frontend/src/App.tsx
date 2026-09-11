import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Layout } from './components/Layout.js';
import { ProblemListPage } from './pages/ProblemListPage.js';
import { ProblemDetailPage } from './pages/ProblemDetailPage.js';
import { AttemptPage } from './pages/AttemptPage.js';
import { HistoryPage } from './pages/HistoryPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProblemListPage />} />
          <Route path="/problems/:slug" element={<ProblemDetailPage />} />
          <Route path="/attempts/:id" element={<AttemptPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  );
}
