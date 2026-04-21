import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';

const RoleSelection = () => {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const { setUserRole } = useAuth();

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setIsAnimating(true);
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      setUserRole(role);
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-3 sm:p-4 relative overflow-x-hidden overflow-y-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Academic Elements */}
        <div className="absolute top-20 left-16 animate-bounce" style={{animationDelay: '0s', animationDuration: '4s'}}>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">📚</span>
          </div>
        </div>
        <div className="absolute top-40 right-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '3s'}}>
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🎓</span>
          </div>
        </div>
        <div className="absolute bottom-32 left-24 animate-bounce" style={{animationDelay: '1s', animationDuration: '3.5s'}}>
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🏫</span>
          </div>
        </div>
        <div className="absolute bottom-20 right-32 animate-bounce" style={{animationDelay: '3s', animationDuration: '4s'}}>
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white">✏️</span>
          </div>
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-32 left-1/3 w-16 h-16 border-4 border-white border-opacity-20 rounded-full animate-spin" style={{animationDuration: '12s'}}></div>
        <div className="absolute bottom-40 right-1/4 w-12 h-12 bg-yellow-300 bg-opacity-20 transform rotate-45 animate-pulse"></div>
        
        {/* Mathematical Symbols */}
        <div className="absolute top-60 left-32 text-white text-3xl animate-pulse opacity-30" style={{animationDelay: '1s'}}>
          ∫
        </div>
        <div className="absolute bottom-60 right-16 text-white text-2xl animate-pulse opacity-30" style={{animationDelay: '2s'}}>
          Σ
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 w-full max-w-4xl max-h-[94dvh] overflow-y-auto overscroll-contain relative z-10 my-4 md:hover:scale-[1.01] transition-all duration-500">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
            {t('Choose Your Journey', 'ನಿಮ್ಮ ಪ್ರಯಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ')}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed px-1">{t('Shape your learning experience by selecting your role', 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಕಲಿಕಾ ಅನುಭವವನ್ನು ರೂಪಿಸಿ')}</p>
          
          {/* Progress Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            <div className="w-8 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mb-8">
          {/* Student Card */}
          <div
            onClick={() => handleRoleSelection('student')}
            className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-500 sm:transform sm:hover:-translate-y-2 sm:hover:shadow-2xl touch-manipulation active:scale-[0.99] min-h-[12rem] ${
              selectedRole === 'student'
                ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white scale-105 shadow-2xl'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-400'
            }`}
          >
            {/* Card Background Pattern */}
            <div className="absolute inset-0 rounded-3xl opacity-10">
              <div className="absolute top-4 right-4 text-6xl">📖</div>
              <div className="absolute bottom-4 left-4 text-4xl">🎒</div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                selectedRole === 'student'
                  ? 'bg-white bg-opacity-20 scale-110'
                  : 'bg-blue-500 group-hover:bg-blue-600'
              }`}>
                <svg className={`w-10 h-10 transition-colors duration-300 ${
                  selectedRole === 'student' ? 'text-white' : 'text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedRole === 'student' ? 'text-white' : 'text-gray-800'
              }`}>
                {t('🎓 Student', '🎓 ವಿದ್ಯಾರ್ಥಿ')}
              </h3>
              <p className={`text-lg leading-relaxed ${
                selectedRole === 'student' ? 'text-white text-opacity-90' : 'text-gray-600'
              }`}>
                {t('Embark on your learning adventure! Access interactive courses, complete assignments, and track your academic growth.', 'ನಿಮ್ಮ ಕಲಿಕಾ ಸಾಹಸವನ್ನು ಆರಂಭಿಸಿ! ಸಂವಾದಾತ್ಮಕ ಪಠ್ಯಕ್ರಮಗಳಿಗೆ ಪ್ರವೇಶಿಸಿ, ಕಾರ್ಯಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಗಮನಿಸಿ.')}
              </p>
              
              {/* Student Features */}
              <div className="mt-6 space-y-2">
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedRole === 'student' ? 'text-white text-opacity-80' : 'text-blue-600'
                }`}>
                  <span>✨</span>
                  <span>{t('Interactive Learning', 'ಸಂವಾದಾತ್ಮಕ ಕಲಿಕೆ')}</span>
                </div>
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedRole === 'student' ? 'text-white text-opacity-80' : 'text-blue-600'
                }`}>
                  <span>📊</span>
                  <span>{t('Progress Tracking', 'ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್')}</span>
                </div>
              </div>
            </div>
            
            {selectedRole === 'student' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-lg">✓</span>
              </div>
            )}
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => handleRoleSelection('teacher')}
            className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-500 sm:transform sm:hover:-translate-y-2 sm:hover:shadow-2xl touch-manipulation active:scale-[0.99] min-h-[12rem] ${
              selectedRole === 'teacher'
                ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-white scale-105 shadow-2xl'
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            {/* Card Background Pattern */}
            <div className="absolute inset-0 rounded-3xl opacity-10">
              <div className="absolute top-4 right-4 text-6xl">🍎</div>
              <div className="absolute bottom-4 left-4 text-4xl">📐</div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                selectedRole === 'teacher'
                  ? 'bg-white bg-opacity-20 scale-110'
                  : 'bg-emerald-500 group-hover:bg-emerald-600'
              }`}>
                <svg className={`w-10 h-10 transition-colors duration-300 ${
                  selectedRole === 'teacher' ? 'text-white' : 'text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedRole === 'teacher' ? 'text-white' : 'text-gray-800'
              }`}>
                {t('👨‍🏫 Teacher', '👨‍🏫 ಶಿಕ್ಷಕ')}
              </h3>
              <p className={`text-lg leading-relaxed ${
                selectedRole === 'teacher' ? 'text-white text-opacity-90' : 'text-gray-600'
              }`}>
                {t('Shape minds and inspire futures! Create engaging courses, manage your classroom, and guide student success.', 'ಮನಸ್ಸುಗಳನ್ನು ರೂಪಿಸಿ ಮತ್ತು ಭವಿಷ್ಯಕ್ಕೆ ಪ್ರೇರಣೆ ನೀಡಿ! ಆಕರ್ಷಕ ಪಾಠಗಳನ್ನು ರಚಿಸಿ, ತರಗತಿಯನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳ ಯಶಸ್ಸಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ.')}
              </p>
              
              {/* Teacher Features */}
              <div className="mt-6 space-y-2">
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedRole === 'teacher' ? 'text-white text-opacity-80' : 'text-emerald-600'
                }`}>
                  <span>🎯</span>
                  <span>{t('Course Creation', 'ಪಠ್ಯ ರಚನೆ')}</span>
                </div>
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedRole === 'teacher' ? 'text-white text-opacity-80' : 'text-emerald-600'
                }`}>
                  <span>📈</span>
                  <span>{t('Analytics Dashboard', 'ವಿಶ್ಲೇಷಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}</span>
                </div>
              </div>
            </div>
            
            {selectedRole === 'teacher' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-lg">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Selection Confirmation */}
        {selectedRole && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-100 to-pink-100 px-8 py-4 rounded-2xl border border-purple-200">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-gray-700 font-medium">
                {t("Perfect! You're joining as a", 'ಅತ್ಯುತ್ತಮ! ನೀವು ಈ ರೀತಿಯಾಗಿ ಸೇರುತ್ತಿದ್ದೀರಿ')} <span className="font-bold text-purple-600 capitalize">{selectedRole === 'student' ? t('student', 'ವಿದ್ಯಾರ್ಥಿ') : t('teacher', 'ಶಿಕ್ಷಕ')}</span>
              </p>
            </div>
            
            {isAnimating && (
              <div className="mt-6 flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-purple-600 font-medium">{t('Setting up your personalized experience...', 'ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಅನುಭವವನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <div className="absolute bottom-8 right-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 text-white hover:bg-opacity-30 transition-all duration-300 cursor-pointer group">
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
};

export default RoleSelection;