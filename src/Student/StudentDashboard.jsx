import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Adjust the path to your AuthContext file
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path to your firebase config
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useThalesMode } from '../Thales/ThalesModeContext';

const LabExperiments = () => {
  const { t } = useLanguage();
  const { userProfile } = useAuth(); // Get userProfile from AuthContext
  const navigate = useNavigate();
  const { setThalesMode } = useThalesMode();

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    completedExperiments: 0,
    totalExperiments: 0,
    pendingAssignments: 0,
  });
  const [userLabData, setUserLabData] = useState(null);

  const subjects = [
    { id: 'all', name: t('All Subjects', 'ಎಲ್ಲಾ ವಿಷಯಗಳು'), icon: '📚' },
    { id: 'physics', name: t('Physics', 'ಭೌತಶಾಸ್ತ್ರ'), icon: '⚡' },
    { id: 'chemistry', name: t('Chemistry', 'ರಸಾಯನಶಾಸ್ತ್ರ'), icon: '🧪' },
    { id: 'biology', name: t('Biology', 'ಜೀವಶಾಸ್ತ್ರ'), icon: '🔬' },
    { id: 'mathematics', name: t('Mathematics', 'ಗಣಿತ'), icon: '📊' },
  ];

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userProfile?.uid) return;

      try {
        const userDocRef = doc(db, 'users', userProfile.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserLabData(userData);
          
          // Calculate stats from the database
          const labExperiments = userData.LabExperiment?.experiments || {};
          let totalCompleted = 0;
          let totalExperiments = 0;
          
          Object.values(labExperiments).forEach(subjectExps => {
            if (Array.isArray(subjectExps)) {
              totalExperiments += subjectExps.length;
              totalCompleted += subjectExps.filter(exp => exp.completed).length;
            }
          });

          setUserStats({
            completedExperiments:  totalCompleted,
            totalExperiments: totalExperiments,
            pendingAssignments: userData.Pending_Assignments || 0,
          });
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userProfile]);

  const getFilteredExperiments = () => {
    if (!userLabData?.LabExperiment?.experiments) return [];

    const experiments = userLabData.LabExperiment.experiments;
    
    if (selectedSubject === 'all') {
      return Object.entries(experiments).flatMap(([subject, exps]) =>
        Array.isArray(exps) ? exps.map((exp) => ({ ...exp, subject })) : []
      );
    }
    
    const subjectExps = experiments[selectedSubject];
    return Array.isArray(subjectExps) ? subjectExps.map((exp) => ({ ...exp, subject: selectedSubject })) : [];
  };

  const handleExperimentClick = async (experiment) => {
    if (experiment.status === 'available' && experiment.route) {
      // Update enrolled labs in Firestore
      await updateEnrolledLabs(experiment);
      navigate(experiment.route, { state: { experiment } });
    } 
    else if (experiment.status === 'completed') {
      // Redirect to completed experiment details
     navigate(experiment.route, { state: { experiment } });

    }

    else {
      alert(`${experiment.title} ${t('is under development', 'ಅಭಿವೃದ್ಧಿಯಲ್ಲಿದೆ')}`);
    }
  };

const updateEnrolledLabs = async (experiment) => {
  if (!userProfile?.uid) return;

  try {
    const userDocRef = doc(db, 'users', userProfile.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      let currentEnrolledLabs = userData.Enrolled_labs || [];
      
      // Convert to array if it's an object/map
      if (!Array.isArray(currentEnrolledLabs) && typeof currentEnrolledLabs === 'object') {
        currentEnrolledLabs = Object.values(currentEnrolledLabs);
      }
      
      // Ensure it's an array
      if (!Array.isArray(currentEnrolledLabs)) {
        currentEnrolledLabs = [];
      }
      
      // Check if experiment is already enrolled
      const isAlreadyEnrolled = currentEnrolledLabs.some(lab => 
        lab.id === experiment.id && lab.subject === experiment.subject
      );
      
      if (!isAlreadyEnrolled) {
        const enrollmentData = {
          id: experiment.id,
          title: experiment.title,
          subject: experiment.subject,
          enrolledAt: new Date(),
          status: 'enrolled'
        };
        
        const updatedEnrolledLabs = [...currentEnrolledLabs, enrollmentData];
        
        await updateDoc(userDocRef, {
          Enrolled_labs: updatedEnrolledLabs
        });
        
        console.log('Successfully enrolled in lab:', experiment.title);
      }
    }
  } catch (error) {
    console.error('Error updating enrolled labs:', error);
  }
};

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject) => {
    switch (subject) {
      case 'physics':
        return 'from-blue-500 to-blue-600';
      case 'chemistry':
        return 'from-green-500 to-green-600';
      case 'biology':
        return 'from-purple-500 to-purple-600';
      case 'mathematics':
        return 'from-orange-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

const getExperimentStatus = (experiment) => {
  // Check if experiment is completed
  if (experiment.completed) {
    return { status: 'completed', text: '✅ Completed', color: 'bg-green-100 text-green-800' };
  }
  
  // Check if experiment is enrolled
  // Handle both array and object formats for Enrolled_labs
  let isEnrolled = false;
  
  if (userLabData?.Enrolled_labs) {
    // If Enrolled_labs is an array
    if (Array.isArray(userLabData.Enrolled_labs)) {
      isEnrolled = userLabData.Enrolled_labs.some(lab => 
        lab.id === experiment.id && lab.subject === experiment.subject
      );
    } 
    // If Enrolled_labs is an object/map
    else if (typeof userLabData.Enrolled_labs === 'object') {
      isEnrolled = Object.values(userLabData.Enrolled_labs).some(lab => 
        lab.id === experiment.id && lab.subject === experiment.subject
      );
    }
  }
  
  if (isEnrolled) {
    return { status: 'enrolled', text: '📚 Enrolled', color: 'bg-blue-100 text-blue-800' };
  }
  
  // Check if experiment is available or under development
  if (experiment.status === 'available') {
    return { status: 'available', text: '🟢 Available', color: 'bg-green-100 text-green-800' };
  } else {
    return { status: 'under-development', text: '🚧 Under Development', color: 'bg-yellow-100 text-yellow-800' };
  }
};

  const ChatbotWindow = () => (
    <div
      className={`fixed z-50 transition-all duration-300 touch-manipulation ${
        isChatbotOpen
          ? 'inset-x-0 bottom-0 sm:inset-auto sm:bottom-4 sm:right-4 w-full sm:w-80 h-[min(88dvh,36rem)] sm:h-96 sm:rounded-2xl rounded-t-2xl'
          : 'bottom-4 right-4 left-auto w-14 h-14 sm:w-16 sm:h-16'
      }`}
    >
      {isChatbotOpen ? (
        <div className="bg-white shadow-2xl border border-gray-200 h-full flex flex-col sm:rounded-2xl rounded-t-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-t-2xl sm:rounded-t-2xl shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  🤖
                </div>
                <span className="font-medium truncate">{t('Lab Assistant', 'ಲ್ಯಾಬ್ ಸಹಾಯಕ')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatbotOpen(false)}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 active:bg-white/20"
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 sm:p-4 min-h-0">
            <iframe
              src="https://dulcet-raindrop-c74e76.netlify.app/"
              className="w-full h-full min-h-[12rem] border-none rounded-lg"
              title="Lab Assistant Chatbot"
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsChatbotOpen(true)}
          className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg sm:hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl sm:hover:scale-105 active:scale-95"
          aria-label={t('Open lab assistant', 'ಲ್ಯಾಬ್ ಸಹಾಯಕ ತೆರೆಯಿರಿ')}
        >
          🤖
        </button>
      )}
    </div>
  );

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('Loading experiments...', 'ಪ್ರಯೋಗಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:h-16">
            <div className="flex items-center gap-2 sm:space-x-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate('/student-dashboard')}
                className="min-w-11 min-h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-white/60 active:bg-white/80 transition-colors touch-manipulation"
                aria-label={t('Back', 'ಹಿಂದೆ')}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {t('Lab Experiments', 'ಲ್ಯಾಬ್ ಪ್ರಯೋಗಗಳು')}
              </h1>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:space-x-4 flex-wrap">
              <LanguageSwitcher className="flex-1 sm:flex-initial min-w-0 justify-end sm:justify-start" />
              <div className="hidden sm:block text-sm text-gray-600 max-w-[10rem] truncate md:max-w-[14rem]">
                {t('Welcome,', 'ಸ್ವಾಗತ,')} {userProfile?.name || t('Student', 'ವಿದ್ಯಾರ್ಥಿ')}
              </div>
              <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {userProfile?.name?.charAt(0) || 'S'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-6 lg:px-8 pb-24 sm:pb-20">
        <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Thales</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {t('Mission lab mode', 'ಮಿಷನ್ ಲ್ಯಾಬ್ ಮೋಡ್')}
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                {t(
                  'Cyber defence network dashboard and flight dynamics missions — sliders, live graphs, and guided steps.',
                  'ಸೈಬರ್ ರಕ್ಷಣೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ಫ್ಲೈಟ್ ಡೈನಾಮಿಕ್ಸ್ ಮಿಷನ್‌ಗಳು — ಸ್ಲೈಡರ್‌ಗಳು, ಲೈವ್ ಗ್ರಾಫ್‌ಗಳು ಮತ್ತು ಮಾರ್ಗದರ್ಶನ ಹಂತಗಳು.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setThalesMode(true);
                navigate('/thales-labs');
              }}
              className="w-full sm:w-auto shrink-0 min-h-12 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-900 font-semibold text-sm shadow-lg transition-colors touch-manipulation"
            >
              {t('Open Thales labs', 'ಥೇಲ್ಸ್ ಲ್ಯಾಬ್‌ಗಳನ್ನು ತೆರೆಯಿರಿ')}
            </button>
          </div>
        </div>

        {/* User Dashboard */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl border border-white/30">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 leading-tight">
                    🧪 Virtual Lab Dashboard
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Welcome back, {userProfile?.name || 'Student'}! Ready to explore science?
                  </p>
                </div>
                <div className="flex md:hidden items-center gap-3 mt-2">
                  <div className="text-right text-xs flex-1">
                    <div className="text-gray-500">Class</div>
                    <div className="font-semibold text-gray-800">{userProfile?.class || userLabData?.class || 'N/A'}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {userProfile?.name?.charAt(0) || 'S'}
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Class</div>
                    <div className="font-semibold text-gray-800">{userProfile?.class || userLabData?.class || 'N/A'}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                    {userProfile?.name?.charAt(0) || 'S'}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{userStats.completedExperiments}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{userStats.totalExperiments}</div>
                  <div className="text-sm text-gray-600">Total Available</div>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{userStats.pendingAssignments}</div>
                  <div className="text-sm text-gray-600">Pending Tasks</div>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.totalExperiments > 0 ? Math.round((userStats.completedExperiments / userStats.totalExperiments) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>

              {/* User Info */}
              <div className="mt-6 p-4 bg-white/40 backdrop-blur rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium text-gray-800">{userProfile?.email || userLabData?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium text-gray-800">{userProfile?.phoneNumber || userLabData?.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">USN:</span>
                    <span className="ml-2 font-medium text-gray-800">{userLabData?.usn || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Enrolled Labs Summary */}
              {userLabData?.Enrolled_labs && (
  (() => {
    // Convert to array for display
    let enrolledLabsArray = [];
    if (Array.isArray(userLabData.Enrolled_labs)) {
      enrolledLabsArray = userLabData.Enrolled_labs;
    } else if (typeof userLabData.Enrolled_labs === 'object') {
      enrolledLabsArray = Object.values(userLabData.Enrolled_labs);
    }
    
    return enrolledLabsArray.length > 0 ? (
      <div className="mt-6 p-4 bg-white/40 backdrop-blur rounded-xl">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recently Enrolled Labs</h4>
        <div className="flex flex-wrap gap-2">
          {enrolledLabsArray.slice(-5).map((lab, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {lab.title || lab.id}
            </span>
          ))}
        </div>
      </div>
    ) : null;
  })()
)}
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('Filter by Subject', 'ವಿಷಯ ಆಧಾರಿತ ಫಿಲ್ಟರ್')}</h3>
            <div className="flex gap-2 overflow-x-auto overflow-touch overscroll-x-contain pb-2 -mx-1 px-1 snap-x snap-mandatory touch-pan-x">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`shrink-0 snap-start min-h-11 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation ${
                    selectedSubject === subject.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  {subject.icon} {subject.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Experiments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredExperiments().map((experiment) => {
            const experimentStatus = getExperimentStatus(experiment);
            return (
              <div
                key={experiment.id}
                className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => handleExperimentClick(experiment)}
              >
                <div className={`h-2 bg-gradient-to-r ${getSubjectColor(experiment.subject)}`}></div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getSubjectColor(experiment.subject)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${experimentStatus.color}`}>
                      {experimentStatus.text}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">{experiment.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{experiment.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {experiment.duration}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(experiment.difficulty)}`}>
                      {experiment.difficulty}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-full min-h-11 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 sm:transform sm:hover:-translate-y-0.5 touch-manipulation ${
                      experiment.completed
                        ? 'bg-green-500 text-white cursor-default'
                        : experiment.status === 'available'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={experiment.status!=="available" }
                  >
                    {experiment.completed
                      ? t('Completed ✅', 'ಪೂರ್ಣಗೊಂಡಿದೆ ✅')
                      : experiment.status === 'available'
                      ? experimentStatus.status === 'enrolled'
                        ? t('Continue Experiment →', 'ಪ್ರಯೋಗ ಮುಂದುವರಿಸಿ →')
                        : t('Start Experiment →', 'ಪ್ರಯೋಗ ಪ್ರಾರಂಭಿಸಿ →')
                      : t('Coming Soon', 'ಶೀಘ್ರದಲ್ಲೇ')
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {getFilteredExperiments().length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.291m0 0A7.962 7.962 0 004 12.5c0-2.034.785-3.9 2.291-5.291m0 0A7.962 7.962 0 0112 5c2.034 0 3.9.785 5.291 2.291" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t('No experiments found', 'ಯಾವುದೇ ಪ್ರಯೋಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ')}</h3>
            <p className="text-gray-600">{t('Try selecting a different subject filter.', 'ಬೇರೆ ವಿಷಯ ಫಿಲ್ಟರ್ ಆಯ್ಕೆಮಾಡಿ.')}</p>
          </div>
        )}
      </main>

      {/* Chatbot */}
      <ChatbotWindow />
    </div>
  );
};

export default LabExperiments;