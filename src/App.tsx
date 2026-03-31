/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import EditItem from './pages/EditItem';
import Browse from './pages/Browse';
import ItemDetails from './pages/ItemDetails';
import UserPanel from './pages/UserPanel';
import NotificationsPage from './pages/NotificationsPage';
import MatchDetailPage from './pages/MatchDetailPage';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReviewQueuePage from './pages/admin/ReviewQueuePage';
import ApprovedItemsPage from './pages/admin/ApprovedItemsPage';
import RejectedItemsPage from './pages/admin/RejectedItemsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminItemDetailPage from './pages/admin/AdminItemDetailPage';

import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import FAQ from './pages/FAQ';
import AboutUs from './pages/AboutUs';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="pending" element={<ReviewQueuePage />} />
              <Route path="approved" element={<ApprovedItemsPage />} />
              <Route path="rejected" element={<RejectedItemsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="items/:id" element={<AdminItemDetailPage />} />
            </Route>

            <Route
              path="/*"
              element={
                <div className="min-h-screen bg-gray-50 flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/report-lost" element={<ReportLost />} />
                      <Route path="/report-found" element={<ReportFound />} />
                      <Route path="/edit-item/:id" element={<EditItem />} />
                      <Route path="/item/:id" element={<ItemDetails />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/user" element={<UserPanel />} />
                      <Route path="/profile" element={<Navigate to="/user" replace />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/matches/:id" element={<MatchDetailPage />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/cookies" element={<CookiePolicy />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/about" element={<AboutUs />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

