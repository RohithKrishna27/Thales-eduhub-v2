import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, RotateCcw, Microscope, AlertCircle, ZoomIn, ZoomOut, Eye, Lightbulb, Focus } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import useTTS from '../hooks/useTTS';
import TTSButton from '../components/TTSButton';

const App = () => {
  const { t } = useLanguage();
  const { speak, stopSpeech, pauseSpeech, resumeSpeech, isSpeaking, isPaused } = useTTS();
  // Microscope state
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [magnification, setMagnification] = useState('4x');
  const [focusLevel, setFocusLevel] = useState(50);
  const [lightIntensity, setLightIntensity] = useState(50);
  const [viewField, setViewField] = useState(null);
  const [observations, setObservations] = useState([]);
  
  // Component placement states
  const [placedComponents, setPlacedComponents] = useState({
    microscope: null,
    slideBox: null,
    coverslips: null,
    lens4x: null,
    lens10x: null,
    lens40x: null
  });
  
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Firebase integration
  const [user, loading, error] = useAuthState(auth);
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const experimentId = "microscopy";
  
  // User profile
  const [userProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'Science Academy'
  });

  // Available specimens
  const specimens = [
    { 
      id: 'onion', 
      name: 'Onion Peel', 
      type: 'Plant Cell',
      description: 'Observe cell wall, nucleus, and cytoplasm',
      color: '#f3e5f5',
      structures: ['Cell Wall', 'Nucleus', 'Cytoplasm', 'Vacuole']
    },
    { 
      id: 'cheek', 
      name: 'Cheek Cell', 
      type: 'Animal Cell',
      description: 'Study nucleus and cell membrane',
      color: '#fce4ec',
      structures: ['Cell Membrane', 'Nucleus', 'Cytoplasm']
    },
    { 
      id: 'leaf', 
      name: 'Leaf Section', 
      type: 'Plant Tissue',
      description: 'Examine stomata and chloroplasts',
      color: '#e8f5e9',
      structures: ['Stomata', 'Chloroplasts', 'Epidermis', 'Guard Cells']
    },
    { 
      id: 'blood', 
      name: 'Blood Smear', 
      type: 'Animal Tissue',
      description: 'Identify RBCs and WBCs',
      color: '#ffebee',
      structures: ['Red Blood Cells', 'White Blood Cells', 'Platelets']
    }
  ];

  // Component slots for drag and drop
  const componentSlots = {
    microscope: { x: 180, y: 100, width: 140, height: 200, color: '#90caf9' },
    slideBox: { x: 50, y: 100, width: 100, height: 80, color: '#a5d6a7' },
    coverslips: { x: 50, y: 200, width: 100, height: 60, color: '#fff59d' },
    lens4x: { x: 360, y: 100, width: 70, height: 60, color: '#ce93d8' },
    lens10x: { x: 360, y: 170, width: 70, height: 60, color: '#ce93d8' },
    lens40x: { x: 360, y: 240, width: 70, height: 60, color: '#ce93d8' }
  };

  // Fetch experiment status on mount
  useEffect(() => {
    const fetchExperimentStatus = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const biologyExperiments = userData.LabExperiment?.experiments?.biology || [];
          const microscopyExp = biologyExperiments.find(exp => exp.id === "microscopy");
          
          if (microscopyExp && microscopyExp.completed) {
            setExperimentCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error fetching experiment status:', error);
      }
    };

    fetchExperimentStatus();
  }, [user]);

  // Mark experiment as completed
  const markExperimentCompleted = async () => {
    if (!user || experimentCompleted) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const biologyExperiments = userData.LabExperiment?.experiments?.biology || [];
      const enrolledBiologyExperiments = userData.Enrolled_labs?.LabExperiment?.experiments?.biology || [];
      
      const existingExp = biologyExperiments.find(exp => exp.id === "microscopy");
      const isAlreadyEnrolled = enrolledBiologyExperiments.some(exp => exp.id === "microscopy" && exp.completed);
      
      if (existingExp?.completed) {
        setExperimentCompleted(true);
        return;
      }

      const updatedBiologyExperiments = biologyExperiments.map(exp => 
        exp.id === "microscopy" ? { ...exp, completed: true, status: "completed" } : exp
      );

      const updateData = {
        'LabExperiment.experiments.biology': updatedBiologyExperiments
      };

      if (!isAlreadyEnrolled) {
        updateData['Enrolled_labs.LabExperiment.experiments.biology'] = arrayUnion({
          completed: true,
          description: "Learn to use compound microscope and observe cellular structures.",
          difficulty: "Beginner",
          duration: "50 minutes",
          id: "microscopy",
          route: "/microscopy-experiment",
          status: "completed",
          title: "Microscopy Techniques"
        });
        updateData.totalCompleted = increment(1);
      }
      
      await updateDoc(userDocRef, updateData);
      setExperimentCompleted(true);
      console.log('Experiment marked as completed!');
      
    } catch (error) {
      console.error('Error updating experiment status:', error);
    }
  };

  // Check if all components are placed
  useEffect(() => {
    const allComponentsPlaced = Object.keys(componentSlots).every(key => placedComponents[key] === key);
    setIsSetupComplete(allComponentsPlaced);
  }, [placedComponents]);

  // Update view field based on magnification and focus
  useEffect(() => {
    if (!selectedSlide || !experimentStarted) {
      setViewField(null);
      return;
    }

    const clarity = focusLevel > 40 && focusLevel < 60 ? 'clear' : focusLevel > 30 && focusLevel < 70 ? 'moderate' : 'blurry';
    const brightness = lightIntensity > 30 && lightIntensity < 70 ? 'optimal' : lightIntensity >= 70 ? 'bright' : 'dim';
    
    setViewField({
      specimen: selectedSlide,
      magnification,
      clarity,
      brightness,
      visibleStructures: getVisibleStructures(selectedSlide, magnification, clarity)
    });
  }, [selectedSlide, magnification, focusLevel, lightIntensity, experimentStarted]);

  // Get visible structures based on magnification and clarity
  const getVisibleStructures = (specimen, mag, clarity) => {
    const slide = specimens.find(s => s.id === specimen);
    if (!slide || clarity === 'blurry') return [];
    
    const magLevel = mag === '4x' ? 1 : mag === '10x' ? 2 : 3;
    return slide.structures.slice(0, magLevel);
  };

  // Drag and drop handlers
  const handleDragStart = (e, componentId) => {
    setDraggedComponent(componentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, slotId) => {
    e.preventDefault();
    setHighlightTargetSlot(null);
    if (draggedComponent && draggedComponent === slotId) {
      setPlacedComponents(prev => ({
        ...prev,
        [slotId]: draggedComponent
      }));
    }
    setDraggedComponent(null);
  };

  const handleDragOver = (e, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedComponent === slotId) {
      setHighlightTargetSlot(slotId);
    }
  };

  const handleDragLeave = () => {
    setHighlightTargetSlot(null);
  };

  // Reset setup
  const resetSetup = () => {
    setPlacedComponents({
      microscope: null,
      slideBox: null,
      coverslips: null,
      lens4x: null,
      lens10x: null,
      lens40x: null
    });
    setExperimentStarted(false);
    setSelectedSlide(null);
    setMagnification('4x');
    setFocusLevel(50);
    setLightIntensity(50);
    setErrorMessage('');
    setObservations([]);
  };

  // Start experiment
  const startExperiment = () => {
    if (!isSetupComplete) {
      alert('Please complete the setup first!');
      return;
    }
    setExperimentStarted(true);
    setErrorMessage('');
  };

  // Record observation
  const recordObservation = async () => {
    if (!experimentStarted || !selectedSlide) {
      alert('Please select a specimen first!');
      return;
    }

    if (!viewField) {
      alert('Adjust focus and light before recording!');
      return;
    }

    const slide = specimens.find(s => s.id === selectedSlide);
    const newObservation = {
      specimen: slide.name,
      type: slide.type,
      magnification,
      clarity: viewField.clarity,
      brightness: viewField.brightness,
      structures: viewField.visibleStructures.join(', '),
      timestamp: new Date().toLocaleTimeString()
    };

    setObservations(prev => [newObservation, ...prev]);

    // Mark completed after 3 observations
    if (observations.length + 1 >= 3 && !experimentCompleted) {
      await markExperimentCompleted();
    }
  };

  const clearObservations = () => {
    setObservations([]);
  };

  // Print report
  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Microscopy Lab Report</h1>
        <p><strong>Student:</strong> ${userProfile.name}</p>
        <p><strong>Class:</strong> ${userProfile.class}</p>
        <p><strong>School:</strong> ${userProfile.school}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Experiment Details</h2>
        <p><strong>Experiment:</strong> Microscopy Techniques</p>
        <p><strong>Duration:</strong> 50 minutes</p>
        
        <h2>Observations</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>No.</th>
            <th>Specimen</th>
            <th>Type</th>
            <th>Magnification</th>
            <th>Clarity</th>
            <th>Structures Observed</th>
          </tr>
          ${observations.map((obs, index) => `
            <tr>
              <td>${observations.length - index}</td>
              <td>${obs.specimen}</td>
              <td>${obs.type}</td>
              <td>${obs.magnification}</td>
              <td>${obs.clarity}</td>
              <td>${obs.structures || 'None visible'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export CSV
  const exportData = () => {
    const csvContent = [
      ['No.', 'Specimen', 'Type', 'Magnification', 'Clarity', 'Brightness', 'Structures Observed'],
      ...observations.map((obs, index) => [
        observations.length - index,
        obs.specimen,
        obs.type,
        obs.magnification,
        obs.clarity,
        obs.brightness,
        obs.structures || 'None visible'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microscopy_observations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render slot
  const renderSlot = (id, x, y, width, height, label, color) => {
    const isHighlighted = highlightTargetSlot === id;
    const isFilled = placedComponents[id] === id;
    const fillColor = isFilled ? 'transparent' : color;
    const strokeColor = isHighlighted ? 'lime' : (isFilled ? 'black' : 'gray');
    const strokeDasharray = isHighlighted ? '5,5' : '4,4';
    const opacity = isFilled ? 0 : 0.6;

    return (
      <g
        onDrop={(e) => handleDrop(e, id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        key={`slot-${id}`}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          fillOpacity={opacity}
          stroke={strokeColor}
          strokeWidth={isHighlighted ? "4" : "2"}
          strokeDasharray={strokeDasharray}
          rx="10"
          ry="10"
        />
        {!isFilled && (
          <text x={x + width / 2} y={y + height / 2 + 5} fontSize="10" textAnchor="middle" fill="white">
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-400 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            {t('🔬 Interactive Microscopy Lab 🧬', '🔬 ಸಂವಾದಾತ್ಮಕ ಮೈಕ್ರೋಸ್ಕೋಪಿ ಲ್ಯಾಬ್ 🧬')}
          </h1>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer size={20} />
              {t('Print Report', 'ವರದಿ ಮುದ್ರಿಸಿ')}
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={observations.length === 0}
            >
              <Download size={20} />
              {t('Export CSV', 'CSV ರಫ್ತು')}
            </button>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-gray-700">
            <strong>Student:</strong> {userProfile.name} | <strong>Class:</strong> {userProfile.class} | <strong>School:</strong> {userProfile.school}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Setup Status */}
            <div className={`p-4 rounded-lg border-2 ${isSetupComplete ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2">
                {isSetupComplete ? (
                  <Microscope className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <h3 className={`font-bold ${isSetupComplete ? 'text-green-800' : 'text-red-800'}`}>
                  Setup Status: {isSetupComplete ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}
                </h3>
              </div>
              {!isSetupComplete && (
                <p className="text-red-700 text-sm mt-2">
                  Drag and drop all equipment into their marked slots to complete the setup.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-purple-800">📋 Setup Instructions</h2>
                <TTSButton
                  text="1. Place the Compound Microscope on the table. 2. Position the Slide Box with specimens. 3. Add the Cover Slips. 4. Install the 4x Objective Lens. 5. Install the 10x Objective Lens. 6. Install the 40x Objective Lens."
                  speak={speak}
                  stopSpeech={stopSpeech}
                  pauseSpeech={pauseSpeech}
                  resumeSpeech={resumeSpeech}
                  isSpeaking={isSpeaking}
                  isPaused={isPaused}
                  buttonSize="md"
                />
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 font-semibold">
                <li>Place the <strong>Compound Microscope</strong> on the table</li>
                <li>Position the <strong>Slide Box</strong> with specimens</li>
                <li>Add the <strong>Cover Slips</strong></li>
                <li>Install the <strong>4x Objective Lens</strong></li>
                <li>Install the <strong>10x Objective Lens</strong></li>
                <li>Install the <strong>40x Objective Lens</strong></li>
              </ol>
            </div>

            {/* Equipment Setup */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Setup Your Equipment</h2>
                <button
                  onClick={resetSetup}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>

              {/* Component Palette */}
              <div className="flex flex-wrap gap-4 p-4 mb-6 bg-gray-100 rounded-lg border border-gray-300">
                <h3 className="w-full text-lg font-semibold text-gray-700 mb-2">Equipment:</h3>
                
                {placedComponents.microscope === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'microscope')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <Microscope size={40} className="text-blue-600" />
                    </div>
                    <span className="text-xs mt-1">Microscope</span>
                  </div>
                )}

                {placedComponents.slideBox === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'slideBox')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <rect x="5" y="10" width="30" height="20" fill="#a5d6a7" stroke="#388e3c" strokeWidth="2" rx="3" />
                        <rect x="10" y="5" width="20" height="5" fill="#66bb6a" stroke="#388e3c" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Slide Box</span>
                  </div>
                )}

                {placedComponents.coverslips === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'coverslips')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <rect x="8" y="12" width="24" height="16" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" rx="2" />
                        <line x1="12" y1="20" x2="28" y2="20" stroke="#f57f17" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Cover Slips</span>
                  </div>
                )}

                {placedComponents.lens4x === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'lens4x')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="15" fill="#ce93d8" stroke="#7b1fa2" strokeWidth="2" />
                        <text x="20" y="25" fontSize="12" textAnchor="middle" fill="white">4x</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">4x Lens</span>
                  </div>
                )}

                {placedComponents.lens10x === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'lens10x')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="15" fill="#ba68c8" stroke="#7b1fa2" strokeWidth="2" />
                        <text x="20" y="25" fontSize="11" textAnchor="middle" fill="white">10x</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">10x Lens</span>
                  </div>
                )}

                {placedComponents.lens40x === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'lens40x')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="15" fill="#ab47bc" stroke="#7b1fa2" strokeWidth="2" />
                        <text x="20" y="25" fontSize="11" textAnchor="middle" fill="white">40x</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">40x Lens</span>
                  </div>
                )}
              </div>

              {/* Setup Diagram */}
              <div className="relative w-full max-w-lg mx-auto aspect-[5/4] bg-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Render slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, id, props.color)
                  ))}

                  {/* Render placed components */}
                  {placedComponents.microscope === 'microscope' && (
                    <g transform={`translate(${componentSlots.microscope.x}, ${componentSlots.microscope.y})`}>
                      <rect x="0" y="0" width="140" height="200" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      {/* Base */}
                      <rect x="20" y="170" width="100" height="25" fill="#424242" rx="5" />
                      {/* Arm */}
                      <rect x="60" y="50" width="20" height="120" fill="#616161" rx="3" />
                      {/* Stage */}
                      <rect x="30" y="120" width="80" height="15" fill="#757575" rx="2" />
                      {/* Eyepiece */}
                      <circle cx="70" cy="40" r="15" fill="#90caf9" stroke="#1976d2" strokeWidth="2" />
                      {/* Objective lenses holder */}
                      <circle cx="70" cy="135" r="8" fill="#9e9e9e" />
                    </g>
                  )}

                  {placedComponents.slideBox === 'slideBox' && (
                    <g transform={`translate(${componentSlots.slideBox.x}, ${componentSlots.slideBox.y})`}>
                      <rect x="0" y="0" width="100" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="10" y="15" width="80" height="50" fill="#a5d6a7" stroke="#388e3c" strokeWidth="2" rx="3" />
                      <rect x="15" y="10" width="70" height="8" fill="#66bb6a" stroke="#388e3c" strokeWidth="1" />
                      <text x="50" y="45" fontSize="10" textAnchor="middle" fill="#1b5e20">Slides</text>
                    </g>
                  )}

                  {placedComponents.coverslips === 'coverslips' && (
                    <g transform={`translate(${componentSlots.coverslips.x}, ${componentSlots.coverslips.y})`}>
                      <rect x="0" y="0" width="100" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="15" width="70" height="30" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" rx="2" />
                      <line x1="20" y1="30" x2="80" y2="30" stroke="#f57f17" strokeWidth="1" />
                      <text x="50" y="35" fontSize="9" textAnchor="middle" fill="#f57f17">Cover Slips</text>
                    </g>
                  )}

                  {placedComponents.lens4x === 'lens4x' && (
                    <g transform={`translate(${componentSlots.lens4x.x}, ${componentSlots.lens4x.y})`}>
                      <rect x="0" y="0" width="70" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <circle cx="35" cy="30" r="20" fill="#ce93d8" stroke="#7b1fa2" strokeWidth="2" />
                      <text x="35" y="36" fontSize="14" textAnchor="middle" fill="white" fontWeight="bold">4x</text>
                    </g>
                  )}

                  {placedComponents.lens10x === 'lens10x' && (
                    <g transform={`translate(${componentSlots.lens10x.x}, ${componentSlots.lens10x.y})`}>
                      <rect x="0" y="0" width="70" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <circle cx="35" cy="30" r="20" fill="#ba68c8" stroke="#7b1fa2" strokeWidth="2" />
                      <text x="35" y="36" fontSize="13" textAnchor="middle" fill="white" fontWeight="bold">10x</text>
                    </g>
                  )}

                  {placedComponents.lens40x === 'lens40x' && (
                    <g transform={`translate(${componentSlots.lens40x.x}, ${componentSlots.lens40x.y})`}>
                      <rect x="0" y="0" width="70" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <circle cx="35" cy="30" r="20" fill="#ab47bc" stroke="#7b1fa2" strokeWidth="2" />
                      <text x="35" y="36" fontSize="13" textAnchor="middle" fill="white" fontWeight="bold">40x</text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Controls */}
              <div className="mt-6 space-y-4">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={startExperiment}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                    disabled={!isSetupComplete || experimentStarted}
                  >
                    <Microscope size={24} />
                    Start Observation
                  </button>
                </div>

                {experimentStarted && (
                  <div className="space-y-4">
                    {/* Specimen Selection */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-800 mb-3">Select Specimen</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {specimens.map(specimen => (
                          <button
                            key={specimen.id}
                            onClick={() => setSelectedSlide(specimen.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedSlide === specimen.id
                                ? 'border-green-600 bg-green-100'
                                : 'border-gray-300 bg-white hover:border-green-400'
                            }`}
                          >
                            <div 
                              className="w-full h-12 rounded mb-2" 
                              style={{ backgroundColor: specimen.color }}
                            />
                            <p className="font-semibold text-sm">{specimen.name}</p>
                            <p className="text-xs text-gray-600">{specimen.type}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Magnification Control */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Eye size={20} />
                        Magnification
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMagnification('4x')}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            magnification === '4x'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-purple-600 border-2 border-purple-300'
                          }`}
                        >
                          4x
                        </button>
                        <button
                          onClick={() => setMagnification('10x')}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            magnification === '10x'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-purple-600 border-2 border-purple-300'
                          }`}
                        >
                          10x
                        </button>
                        <button
                          onClick={() => setMagnification('40x')}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            magnification === '40x'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-purple-600 border-2 border-purple-300'
                          }`}
                        >
                          40x
                        </button>
                      </div>
                    </div>

                    {/* Focus Control */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                          <Focus size={20} />
                          Focus
                        </h3>
                        <span className="text-blue-600 font-semibold">{focusLevel}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={focusLevel}
                        onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>Coarse</span>
                        <span>Fine</span>
                      </div>
                    </div>

                    {/* Light Intensity Control */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                          <Lightbulb size={20} />
                          Light Intensity
                        </h3>
                        <span className="text-yellow-600 font-semibold">{lightIntensity}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={lightIntensity}
                        onChange={(e) => setLightIntensity(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-yellow-600 mt-1">
                        <span>Dim</span>
                        <span>Bright</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={recordObservation}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors"
                        disabled={!selectedSlide}
                      >
                        Record Observation
                      </button>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 p-3 rounded-md">
                    <AlertCircle size={20} />
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: View Field and Observations */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Microscope View */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('Microscope View', 'ಮೈಕ್ರೋಸ್ಕೋಪ್ ದೃಶ್ಯ')}</h2>
              <div className="relative w-full aspect-square bg-black rounded-full overflow-hidden border-8 border-gray-700 shadow-inner">
                {viewField && selectedSlide ? (
                  <div 
                    className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
                      viewField.clarity === 'blurry' ? 'blur-md' : viewField.clarity === 'moderate' ? 'blur-sm' : ''
                    }`}
                    style={{ 
                      backgroundColor: specimens.find(s => s.id === selectedSlide)?.color || '#f5f5f5',
                      filter: `brightness(${viewField.brightness === 'dim' ? '0.5' : viewField.brightness === 'bright' ? '1.5' : '1'})`
                    }}
                  >
                    {/* Cell visualization */}
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {selectedSlide === 'onion' && (
                        <>
                          {/* Onion cells */}
                          <rect x="40" y="40" width="120" height="60" fill="none" stroke="#7b1fa2" strokeWidth="2" rx="5" />
                          <rect x="40" y="100" width="120" height="60" fill="none" stroke="#7b1fa2" strokeWidth="2" rx="5" />
                          <rect x="80" y="60" width="40" height="80" fill="none" stroke="#7b1fa2" strokeWidth="1.5" />
                          {magnification !== '4x' && <circle cx="100" cy="80" r="8" fill="#4a148c" opacity="0.7" />}
                          {magnification !== '4x' && <circle cx="100" cy="140" r="8" fill="#4a148c" opacity="0.7" />}
                        </>
                      )}
                      {selectedSlide === 'cheek' && (
                        <>
                          {/* Cheek cells */}
                          <ellipse cx="100" cy="100" rx="40" ry="35" fill="none" stroke="#c2185b" strokeWidth="2" />
                          {magnification !== '4x' && <circle cx="100" cy="100" r="12" fill="#880e4f" opacity="0.7" />}
                          <ellipse cx="60" cy="70" rx="35" ry="30" fill="none" stroke="#c2185b" strokeWidth="1.5" opacity="0.6" />
                          <ellipse cx="140" cy="130" rx="38" ry="33" fill="none" stroke="#c2185b" strokeWidth="1.5" opacity="0.6" />
                        </>
                      )}
                      {selectedSlide === 'leaf' && (
                        <>
                          {/* Leaf cells with stomata */}
                          <rect x="50" y="60" width="30" height="40" fill="none" stroke="#388e3c" strokeWidth="2" />
                          <rect x="80" y="60" width="30" height="40" fill="none" stroke="#388e3c" strokeWidth="2" />
                          <rect x="110" y="60" width="30" height="40" fill="none" stroke="#388e3c" strokeWidth="2" />
                          {magnification !== '4x' && (
                            <>
                              <ellipse cx="95" cy="120" rx="8" ry="12" fill="none" stroke="#1b5e20" strokeWidth="2" />
                              <circle cx="65" cy="80" r="3" fill="#43a047" />
                              <circle cx="95" cy="75" r="3" fill="#43a047" />
                              <circle cx="125" cy="85" r="3" fill="#43a047" />
                            </>
                          )}
                        </>
                      )}
                      {selectedSlide === 'blood' && (
                        <>
                          {/* Blood cells */}
                          <circle cx="100" cy="100" r="15" fill="#ef5350" opacity="0.8" />
                          <circle cx="70" cy="80" r="14" fill="#ef5350" opacity="0.8" />
                          <circle cx="130" cy="120" r="15" fill="#ef5350" opacity="0.8" />
                          <circle cx="85" cy="130" r="14" fill="#ef5350" opacity="0.8" />
                          {magnification === '40x' && (
                            <>
                              <circle cx="140" cy="70" r="18" fill="#5c6bc0" opacity="0.7" />
                              <circle cx="145" cy="72" r="6" fill="#283593" opacity="0.8" />
                            </>
                          )}
                        </>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Eye size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Select a specimen to view</p>
                    </div>
                  </div>
                )}
              </div>
              
              {viewField && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Magnification:</span>
                    <span>{viewField.magnification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Clarity:</span>
                    <span className={`font-semibold ${
                      viewField.clarity === 'clear' ? 'text-green-600' :
                      viewField.clarity === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {viewField.clarity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Brightness:</span>
                    <span>{viewField.brightness}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-semibold mb-1">Visible Structures:</p>
                    <p className="text-sm text-gray-700">
                      {viewField.visibleStructures.length > 0 
                        ? viewField.visibleStructures.join(', ')
                        : 'None - adjust focus and magnification'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Observations Table */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('Observations', 'ಅವಲೋಕನಗಳು')}</h2>
                <button
                  onClick={clearObservations}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={observations.length === 0}
                >
                  Clear
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">No.</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Specimen</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Magnification</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Clarity</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Structures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">
                          No observations recorded yet. Adjust the microscope and record your findings.
                        </td>
                      </tr>
                    ) : (
                      observations.map((obs, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{observations.length - index}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{obs.specimen}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{obs.magnification}</td>
                          <td className="py-2 px-4 border-b text-sm">
                            <span className={`font-semibold ${
                              obs.clarity === 'clear' ? 'text-green-600' :
                              obs.clarity === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {obs.clarity}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">
                            {obs.structures || 'None visible'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {experimentStarted && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Try different magnifications and adjust focus for optimal viewing. Record at least 3 observations to complete the experiment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;