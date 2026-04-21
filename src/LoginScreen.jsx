import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { useLanguage } from './LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import useOnlineStatus from './hooks/useOnlineStatus';
import { useNavigate } from 'react-router-dom';
import { useOfflineAccess } from './OfflineAccessContext';

const LoginScreen = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { offlineStudentMode, enableOfflineStudentMode, disableOfflineStudentMode } = useOfflineAccess();
  const [selectedMode, setSelectedMode] = useState(offlineStudentMode ? 'offline' : 'online');

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      setError(t('Offline mode is active. Connect to internet to sign in.', 'ಆಫ್ಲೈನ್ ಮೋಡ್ ಸಕ್ರಿಯವಾಗಿದೆ. ಸೈನ್ ಇನ್ ಮಾಡಲು ಇಂಟರ್ನೆಟ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ.'));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError(t('Failed to sign in with Google. Please try again.', 'Google ಮೂಲಕ ಸೈನ್ ಇನ್ ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'));
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseOnline = () => {
    setSelectedMode('online');
    disableOfflineStudentMode();
    setError('');
  };

  const handleChooseOffline = () => {
    setSelectedMode('offline');
    enableOfflineStudentMode();
    setError('');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center p-3 sm:p-4 relative overflow-x-hidden overflow-y-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>
          <div className="w-8 h-10 bg-blue-500 rounded-sm shadow-lg transform rotate-12"></div>
        </div>
        <div className="absolute top-32 right-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}>
          <div className="w-6 h-8 bg-green-500 rounded-sm shadow-lg transform -rotate-12"></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '3.5s'}}>
          <div className="w-7 h-9 bg-red-500 rounded-sm shadow-lg transform rotate-6"></div>
        </div>
        <div className="absolute top-40 right-40 text-white text-2xl animate-pulse">∑</div>
        <div className="absolute bottom-60 right-10 text-white text-xl animate-pulse">π</div>
        <div className="absolute top-60 left-40 text-white text-lg animate-pulse">√</div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain relative z-10 my-4 md:hover:scale-[1.02] transition-all duration-300">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
          </div>

          {/* HIGHLIGHTED HEADING */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 drop-shadow-sm">
              Thales EduHub
            </span>
          </h1>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
            {t('Unlock Your Learning Journey', 'ನಿಮ್ಮ ಕಲಿಕಾ ಪ್ರಯಾಣವನ್ನು ಆರಂಭಿಸಿ')}
          </p>
          
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
            {t('Choose mode to continue', 'ಮುಂದುವರಿಸಲು ಮೋಡ್ ಆಯ್ಕೆಮಾಡಿ')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleChooseOnline}
              className={`rounded-lg min-h-11 px-3 py-2.5 text-sm font-bold transition-all ${
                selectedMode === 'online'
                  ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {t('Online Mode', 'ಆನ್‌ಲೈನ್ ಮೋಡ್')}
            </button>
            <button
              type="button"
              onClick={handleChooseOffline}
              className={`rounded-lg min-h-11 px-3 py-2.5 text-sm font-bold transition-all ${
                selectedMode === 'offline'
                  ? 'bg-amber-600 text-white shadow-md scale-[1.02]'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {t('Offline Mode', 'ಆಫ್ಲೈನ್ ಮೋಡ್')}
            </button>
          </div>
        </div>

        {!isOnline && selectedMode === 'online' && (
          <div className="mb-5 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold text-center">
            {t('Internet is not available. Choose Offline Mode to continue now.', 'ಇಂಟರ್ನೆಟ್ ಲಭ್ಯವಿಲ್ಲ. ಈಗ ಮುಂದುವರಿಸಲು ಆಫ್ಲೈನ್ ಮೋಡ್ ಆಯ್ಕೆಮಾಡಿ.')}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || !isOnline || selectedMode !== 'online'}
          className="w-full min-h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-bold text-lg">{t('Continue with Google', 'Google ಮೂಲಕ ಮುಂದುವರಿಸಿ')}</span>
            </>
          )}
        </button>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-blue-50 rounded-xl">
            <div className="text-xl font-bold text-blue-600">1M+</div>
            <div className="text-[10px] uppercase tracking-wide text-blue-500 font-bold">{t('Students', 'ವಿದ್ಯಾರ್ಥಿಗಳು')}</div>
          </div>
          <div className="p-2 bg-purple-50 rounded-xl">
            <div className="text-xl font-bold text-purple-600">500+</div>
            <div className="text-[10px] uppercase tracking-wide text-purple-500 font-bold">{t('Courses', 'ಪಠ್ಯಕ್ರಮಗಳು')}</div>
          </div>
          <div className="p-2 bg-pink-50 rounded-xl">
            <div className="text-xl font-bold text-pink-600">24/7</div>
            <div className="text-[10px] uppercase tracking-wide text-pink-500 font-bold">{t('Support', 'ಸಹಾಯ')}</div>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            {t('🎓 Join thousands of learners worldwide', '🎓 ವಿಶ್ವದ ಸಾವಿರಾರು ಕಲಿಯುವವರೊಂದಿಗೆ ಸೇರಿ')}
          </p>
          <p className="text-[10px] text-gray-400">
            {t('By continuing, you agree to our Terms & Privacy Policy', 'ಮುಂದುವರಿಸುವ ಮೂಲಕ, ನಮ್ಮ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಗೆ ನೀವು ಒಪ್ಪುತ್ತೀರಿ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;