import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ReviewQueuePage from '../pages/admin/ReviewQueuePage';
import ApprovedItemsPage from '../pages/admin/ApprovedItemsPage';
import RejectedItemsPage from '../pages/admin/RejectedItemsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminMatchesPage from '../pages/admin/AdminMatchesPage';
import AdminItemDetailPage from '../pages/admin/AdminItemDetailPage';
import AdminLogin from './AdminLogin';

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<AdminLogin />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pending" element={<ReviewQueuePage />} />
              <Route path="approved" element={<ApprovedItemsPage />} />
              <Route path="rejected" element={<RejectedItemsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="matches" element={<AdminMatchesPage />} />
              <Route path="items/:id" element={<AdminItemDetailPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
