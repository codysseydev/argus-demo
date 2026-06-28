import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { SearchScreen } from './screens/SearchScreen';
import { JobHistoryScreen } from './screens/JobHistoryScreen';
import { FailuresScreen } from './screens/FailuresScreen';
import { SavedSearchesScreen } from './screens/SavedSearchesScreen';
import { SavedSearchScreen } from './screens/SavedSearchScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';

/** Route table. The Router itself lives in main.tsx (tests supply their own). */
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="search" element={<SearchScreen />} />
        <Route path="jobs/:jobUuid" element={<JobHistoryScreen />} />
        <Route path="failures" element={<FailuresScreen />} />
        <Route path="saved-searches" element={<SavedSearchesScreen />} />
        <Route path="saved-searches/:id" element={<SavedSearchScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}
