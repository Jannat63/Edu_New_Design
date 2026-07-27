// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { ToastContainer }         from './lib/toast';
import { ScrollToTop }            from './lib/ScrollToTop';
import MaintenanceGate            from './lib/MaintenanceGate';
import { DarkModeProvider }       from './lib/darkMode';
import { I18nProvider }           from './lib/i18n/index.jsx';

import Home               from './pages/Home';
import Courses            from './pages/Courses';
import Course             from './pages/Course';
import Bundles            from './pages/Bundles';
import BundleDetail       from './pages/BundleDetail';
import Learn              from './pages/Learn';
import Quiz                from './pages/Quiz';
import Login              from './pages/Login';
import Dashboard          from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Admin              from './pages/Admin';
import Instructor         from './pages/Instructor';
import Instructors        from './pages/Instructors';
import Blog               from './pages/Blog';
import BlogIndex          from './pages/BlogIndex';
import Verify             from './pages/Verify';
import PaymentResult      from './pages/PaymentResult';
import ForgotPassword     from './pages/ForgotPassword';
import ResetPassword      from './pages/ResetPassword';
import About              from './pages/About';
import Mission            from './pages/Mission';
import BecomeInstructor   from './pages/BecomeInstructor';
import Press              from './pages/Press';
import Contact            from './pages/Contact';
import HowItWorks         from './pages/HowItWorks';
import Terms              from './pages/Terms';
import Privacy            from './pages/Privacy';
import NotFound           from './pages/NotFound';

// ── LOADING SPINNER ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FBF6EE' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #E8E9F1', borderTopColor:'#28305E', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── PROTECTED ROUTE ───────────────────────────────────────────────────────────
function ProtectedRoute({ element, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role === 'admin'      && !user.is_admin)                        return <Navigate to="/dashboard" replace />;
  if (role === 'instructor' && !user.is_instructor && !user.is_admin) return <Navigate to="/dashboard" replace />;
  return element;
}

// ── GUEST ONLY ROUTE ──────────────────────────────────────────────────────────
function GuestRoute({ element }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    const dest = user.is_admin ? '/admin' : user.is_instructor ? '/instructor-dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }
  return element;
}

// ── APP ───────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DarkModeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <MaintenanceGate>
              <ScrollToTop />
              <Routes>
                {/* Public */}
                <Route path="/"                   element={<Home />} />
                <Route path="/courses"            element={<Courses />} />
                <Route path="/course/:slug"       element={<Course />} />
                <Route path="/bundles"            element={<Bundles />} />
                <Route path="/bundle/:id"         element={<BundleDetail />} />
                <Route path="/instructors"        element={<Instructors />} />
                <Route path="/instructors/:id"    element={<Instructor />} />
                <Route path="/blog"               element={<BlogIndex />} />
                <Route path="/blog/:slug"         element={<Blog />} />
                <Route path="/about"              element={<About />} />
                <Route path="/mission"            element={<Mission />} />
                <Route path="/become-instructor"  element={<BecomeInstructor />} />
                <Route path="/press"              element={<Press />} />
                <Route path="/contact"            element={<Contact />} />
                <Route path="/how-it-works"       element={<HowItWorks />} />
                <Route path="/terms"              element={<Terms />} />
                <Route path="/privacy"            element={<Privacy />} />
                <Route path="/verify/:code"       element={<Verify />} />
                <Route path="/forgot-password"    element={<ForgotPassword />} />
                <Route path="/reset-password"     element={<ResetPassword />} />

                {/* Guest only */}
                <Route path="/login" element={<GuestRoute element={<Login />} />} />

                {/* Protected — any authenticated user */}
                <Route path="/learn/:slug"        element={<ProtectedRoute element={<Learn />} />} />
                <Route path="/quiz/:id"           element={<ProtectedRoute element={<Quiz />} />} />
                <Route path="/payment-result"     element={<ProtectedRoute element={<PaymentResult />} />} />
                <Route path="/dashboard"          element={<ProtectedRoute element={<Dashboard />} />} />

                {/* Protected — instructor or admin */}
                <Route path="/instructor-dashboard" element={<ProtectedRoute element={<InstructorDashboard />} role="instructor" />} />

                {/* Protected — admin only */}
                <Route path="/admin"              element={<ProtectedRoute element={<Admin />} role="admin" />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              <ToastContainer />
            </MaintenanceGate>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </DarkModeProvider>
  </React.StrictMode>
);
