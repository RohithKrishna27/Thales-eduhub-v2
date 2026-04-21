import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import RoleSelection from './RoleSelection';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider, useLanguage } from './LanguageContext';
import StudentProfile from './Student/StudentProfile';
import TeacherProfile from './Teacher/TeacherProfile';
import StudentDashboard from './Student/StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
import StudentManagement from './Teacher/StudentManagment';
// Import your lab components
import OhmsLawExperiment from './Student/ohms-law-experiment'; // Ohm's Law Experiment
import AcidBaseTitration from './Student/acid-base-titration'; 
import Crystallization from './Student/crystallization-Process'; 
import Microscopyic from './Student/microscopy-techniques'; 
import Photosynthesis from './Student/photosynthesis-experiment'; 
import Statistics from './Student/statistics-data-analysis'; 
import MagneticHysteresisExperiment from './Student/magnetic-hysteresis-experiment'; // Import the Magnetic Hysteresis Experiment component
import ClippingClampingExperiment from './Student/clipping-clamping-experiment'; // NEW: Import ClippingClampingExperiment
import ThalesClassTeacherAI from './Student/ThalesClassTeacherAI'; // Thales Class Teacher AI
import { ThalesModeProvider } from './Thales/ThalesModeContext';
import ThalesTopBar from './Thales/ThalesTopBar';
import ThalesLabsHub from './Thales/ThalesLabsHub';
import ThalesCyberHub from './Thales/ThalesCyberHub';
import ThalesAerospaceHub from './Thales/ThalesAerospaceHub';
import CyberFirewallTuning from './Thales/cyber/CyberFirewallTuning';
import CyberEncryptionPerformance from './Thales/cyber/CyberEncryptionPerformance';
import CyberDdosMitigation from './Thales/cyber/CyberDdosMitigation';
import CyberPhishingRansomware from './Thales/cyber/CyberPhishingRansomware';
import CyberRedBlueBattle from './Thales/cyber/CyberRedBlueBattle';
import AerospaceWeightBalance from './Thales/aerospace/AerospaceWeightBalance';
import AerospaceWindGustControl from './Thales/aerospace/AerospaceWindGustControl';
import AerospaceThrustAltitude from './Thales/aerospace/AerospaceThrustAltitude';
import AerospaceStallRecovery from './Thales/aerospace/AerospaceStallRecovery';
import AerospaceAvionicsFailure from './Thales/aerospace/AerospaceAvionicsFailure';
import useOnlineStatus from './hooks/useOnlineStatus';
import OfflineModeBanner from './components/OfflineModeBanner';
import { OfflineAccessProvider, useOfflineAccess } from './OfflineAccessContext';
import OfflineStudentHome from './components/OfflineStudentHome';

// Debug component to see auth state (good for development, consider removing in production)
const DebugAuthState = () => {
  const { user, userRole, userProfile, loading } = useAuth();

  console.log('Debug Auth State:', {
    user: !!user,
    userRole,
    userProfile: !!userProfile,
    loading
  });
  return null; // This component renders nothing visually
};

// Protected Route Component: Centralized logic for authentication, role, and profile checks
const ProtectedRoute = ({ children, requiresAuth = true, requiresRole = null, requiresProfile = true }) => {
  const { user, userRole, userProfile, loading } = useAuth();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const { offlineStudentMode } = useOfflineAccess();

  console.log('ProtectedRoute check:', {
    user: !!user,
    userRole,
    userProfile: !!userProfile,
    loading,
    requiresAuth,
    requiresRole, // Can be true, false, "student", or "teacher"
    requiresProfile
  });

  // Show a loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('Loading...', 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...')}</p>
        </div>
      </div>
    );
  }

  if (offlineStudentMode) {
    if (requiresRole === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    }

    if (requiresRole === 'student' || requiresRole === true || requiresAuth) {
      return children;
    }
  }

  // 1. Check authentication: If authentication is required but user is not logged in
  if (requiresAuth && !user) {
    console.log('ProtectedRoute: Redirecting to login - user not authenticated.');
    return <Navigate to="/login" replace />;
  }

  // 2. Check role existence: If a role is required (either any role or a specific one) but no role is set
  // `requiresRole` can be `true` (any role needed), or a string ("student", "teacher")
  if ((requiresRole === true || typeof requiresRole === 'string') && !userRole) {
    console.log('ProtectedRoute: Redirecting to role selection - role required but not set.');
    return <Navigate to="/role-selection" replace />;
  }

  // 3. Check specific role match: If a specific role string is required but user's role doesn't match
  if (typeof requiresRole === 'string' && userRole !== requiresRole) {
    console.log(`ProtectedRoute: Redirecting to dashboard - required role "${requiresRole}" does not match user's role "${userRole}".`);
    // Redirect to the appropriate dashboard or a generic unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Check profile completion: If a profile is required but not completed
  if (requiresProfile && userRole && !userProfile) {
    console.log('ProtectedRoute: Redirecting to profile setup - profile required but not complete.');
    if (userRole === 'student') {
      return <Navigate to="/student-profile" replace />;
    } else if (userRole === 'teacher') {
      return <Navigate to="/teacher-profile" replace />;
    }
  }

  // If all checks pass, render the children components
  console.log('ProtectedRoute: All checks passed. Rendering children.');
  return children;
};

// AppContent handles all routes within the AuthProvider context
const AppContent = () => {
  const { user, userRole, userProfile, loading } = useAuth();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const { offlineStudentMode } = useOfflineAccess();

  // Add debug logging
  console.log('AppContent render:', { user: !!user, userRole, userProfile: !!userProfile, loading });

  return (
    <>
      <OfflineModeBanner isOnline={isOnline} />
      {/* Debug component - remove in production */}
      <DebugAuthState />
      {user && userProfile && !loading && <ThalesTopBar />}

      <div className={isOnline ? '' : 'pt-12 sm:pt-11'}>
      <Routes>
        {/* Public Routes */}
        {/* If user is logged in, redirect from login to dashboard */}
        <Route
          path="/login"
          element={
            !user || offlineStudentMode ? <LoginScreen /> : <Navigate to="/dashboard" replace />
          }
        />

        <Route path="/offline-student" element={<OfflineStudentHome />} />

        {/* Role Selection Route */}
        {/* Requires authentication, but no specific role or profile completion yet */}
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={false} requiresProfile={false}>
              {/* If userRole is already set, redirect to profile or dashboard */}
              {!userRole ? (
                <RoleSelection />
              ) : !userProfile ? (
                userRole === 'student' ? (
                  <Navigate to="/student-profile" replace />
                ) : (
                  <Navigate to="/teacher-profile" replace />
                )
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Profile Setup Routes */}
        {/* These routes allow profile setup if role is chosen but profile isn't complete */}
        <Route
          path="/student-profile"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={false}>
              {/* Only render StudentProfile if user is a student and profile is not complete */}
              {userRole === 'student' && !userProfile ? (
                <StudentProfile />
              ) : ( // If conditions not met (e.g., wrong role or profile already exists), redirect
                userProfile ? <Navigate to="/student-dashboard" replace /> : <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-profile"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={false}>
              {/* Only render TeacherProfile if user is a teacher and profile is not complete */}
              {userRole === 'teacher' && !userProfile ? (
                <TeacherProfile />
              ) : ( // If conditions not met, redirect
                userProfile ? <Navigate to="/teacher-dashboard" replace /> : <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes - Redirects to specific dashboard based on userRole */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              {offlineStudentMode ? (
                <OfflineStudentHome />
              ) : userRole === 'student' ? (
                <StudentDashboard /> // ProtectedRoute ensures userRole is "student"
              ) : userRole === 'teacher' ? (
                <TeacherDashboard /> // ProtectedRoute ensures userRole is "teacher"
              ) : (
                // Fallback for unexpected role state, though ProtectedRoute should handle most cases
                <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4">
                  <div className="text-center text-white">
                    <h2 className="text-xl mb-4">Invalid Role or Role Not Set</h2>
                    <p>{t('Current Role:', 'ಪ್ರಸ್ತುತ ಪಾತ್ರ:')} {userRole || 'N/A'}</p>
                    <button
                      onClick={() => window.location.href = '/role-selection'}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      {t('Select Role Again', 'ಮತ್ತೆ ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ')}
                    </button>
                  </div>
                </div>
              )}
            </ProtectedRoute>
          }
        />

        {/* Specific Dashboard Routes - Protected by role */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              {offlineStudentMode ? <OfflineStudentHome /> : <StudentDashboard />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={true}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher Specific Routes */}
        {/* Requires Teacher role */}
        <Route
          path="/StudentManagement"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={true}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />


     

        {/* Ohm's Law Experiment Route */}
       
       
        
       

        <Route 
          path="/StudentManagement" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <StudentManagement/>
            </ProtectedRoute>
          } 
        />
        
        
        <Route
          path="/ohms-law-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <OhmsLawExperiment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/acid-base-titration-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <AcidBaseTitration />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crystallization-process"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <Crystallization />
            </ProtectedRoute>
          }
        />

        <Route
          path="/microscopy-techniques"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <Microscopyic />
            </ProtectedRoute>
          }
        />

        <Route
          path="/photosynthesis-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <Photosynthesis />
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistics-data-analysis"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <Statistics />
            </ProtectedRoute>
          }
        />

        {/* Magnetic Hysteresis Experiment Route */}
        <Route
          path="/magnetic-hysteresis-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <MagneticHysteresisExperiment />
            </ProtectedRoute>
          }
        />

        {/* Clipping and Clamping Experiment Route */}
        <Route
          path="/clipping-clamping-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <ClippingClampingExperiment />
            </ProtectedRoute>
          }
        />

        {/* Thales Class Teacher AI Route */}
        <Route
          path="/thales-teacher-ai"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <ThalesClassTeacherAI />
            </ProtectedRoute>
          }
        />

        {/* Thales-style mission labs (students + teachers with completed profile) */}
        <Route
          path="/thales-labs"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <ThalesLabsHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <ThalesCyberHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber/firewall-tuning"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <CyberFirewallTuning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber/encryption-performance"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <CyberEncryptionPerformance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber/ddos-mitigation"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <CyberDdosMitigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber/phishing-ransomware"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <CyberPhishingRansomware />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/cyber/red-blue-battle"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <CyberRedBlueBattle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <ThalesAerospaceHub />
            </ProtectedRoute>
          }
        />
        {/* Aliases: Simulation experiment #1 → Avionics Failure (same page as /avionics-failure) */}
        <Route
          path="/thales-labs/aerospace/simulation-1"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <Navigate to="/thales-labs/aerospace/avionics-failure" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/simulation-exp-1"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <Navigate to="/thales-labs/aerospace/avionics-failure" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/avionics-failure"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <AerospaceAvionicsFailure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/weight-balance"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <AerospaceWeightBalance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/wind-gust-control"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <AerospaceWindGustControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/thrust-altitude"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <AerospaceThrustAltitude />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thales-labs/aerospace/stall-recovery"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              <AerospaceStallRecovery />
            </ProtectedRoute>
          }
        />

        {/* Default Route: Handles initial load and redirects based on auth/role/profile status */}
        <Route
          path="/"
          element={
            loading ? (
              <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t('Loading...', 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...')}</p>
                </div>
              </div>
            ) : offlineStudentMode ? (
              <Navigate to="/dashboard" replace />
            ) : !user ? (
              <Navigate to="/login" replace />
            ) : !userRole ? (
              <Navigate to="/role-selection" replace />
            ) : !userProfile ? (
              userRole === 'student' ? (
                <Navigate to="/student-profile" replace />
              ) : (
                <Navigate to="/teacher-profile" replace />
              )
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Catch-all Route: For any undefined paths (404 Not Found) */}
        <Route
          path="*"
          element={
            <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4">
              <div className="text-center text-white">
                <h2 className="text-xl mb-4">Page Not Found</h2>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {t('Go Home', 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ')}
                </button>
              </div>
            </div>
          }
        />
      </Routes>
      </div>
    </>
  );
};

// Main App component wraps the routing with AuthProvider
function App() {
  return (
    <LanguageProvider>
      <OfflineAccessProvider>
        <AuthProvider>
          <ThalesModeProvider>
            <Router>
              <AppContent />
            </Router>
          </ThalesModeProvider>
        </AuthProvider>
      </OfflineAccessProvider>
    </LanguageProvider>
  );
}

export default App;