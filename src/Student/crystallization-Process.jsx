import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, Download, RotateCcw, Flame, AlertCircle, Thermometer } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';import useTTS from '../hooks/useTTS';
import TTSButton from '../components/TTSButton';
const App = () => {
  const { t } = useLanguage();
  const { speak, stopSpeech, pauseSpeech, resumeSpeech, isSpeaking, isPaused } = useTTS();
  // Crystallization state
  const [temperature, setTemperature] = useState(25); // Celsius
  const [heatingActive, setHeatingActive] = useState(false);
  const [coolingActive, setCoolingActive] = useState(false);
  const [dissolutionProgress, setDissolutionProgress] = useState(0); // 0-100%
  const [crystallizationProgress, setCrystallizationProgress] = useState(0); // 0-100%
  const [solutionConcentration, setSolutionConcentration] = useState(0); // g/100mL
  const [crystalSize, setCrystalSize] = useState(0); // Visual representation
  const [solutionColor, setSolutionColor] = useState('#e3f2fd');
  const [tableData, setTableData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStage, setCurrentStage] = useState('setup'); // setup, heating, dissolving, cooling, crystallizing, complete
  
  // Component placement states
  const [placedComponents, setPlacedComponents] = useState({
    beaker: null,
    burner: null,
    tripodStand: null,
    wireGauze: null,
    saltBottle: null,
    stirringRod: null,
    filterPaper: null,
    funnel: null
  });
  
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null);
  const [experimentStarted, setExperimentStarted] = useState(false);
  
  // Firebase integration
  const [user, loading, error] = useAuthState(auth);
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const experimentId = "crystallization";
  
  // User profile
  const [userProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'Science Academy'
  });

  // Salt properties
  const saltData = {
    name: 'Copper Sulfate (CuSO₄)',
    solubility25C: 32, // g/100mL at 25°C
    solubility100C: 75, // g/100mL at 100°C
    color: '#4fc3f7'
  };

  // Component slots
  const componentSlots = {
    tripodStand: { x: 180, y: 220, width: 120, height: 100, color: '#9e9e9e' },
    wireGauze: { x: 195, y: 200, width: 90, height: 30, color: '#bdbdbd' },
    beaker: { x: 200, y: 120, width: 80, height: 100, color: '#81c784' },
    burner: { x: 210, y: 290, width: 60, height: 70, color: '#ff6b6b' },
    stirringRod: { x: 50, y: 40, width: 70, height: 80, color: '#9e9e9e' },
    saltBottle: { x: 350, y: 40, width: 70, height: 90, color: '#4fc3f7' },
    funnel: { x: 50, y: 150, width: 70, height: 80, color: '#ffd54f' },
    filterPaper: { x: 350, y: 150, width: 70, height: 70, color: '#ffffff' }
  };

  // Fetch experiment status
  useEffect(() => {
    const fetchExperimentStatus = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const chemistryExperiments = userData.LabExperiment?.experiments?.chemistry || [];
          const crystallizationExp = chemistryExperiments.find(exp => exp.id === "crystallization");
          
          if (crystallizationExp && crystallizationExp.completed) {
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
      const chemistryExperiments = userData.LabExperiment?.experiments?.chemistry || [];
      const enrolledChemistryExperiments = userData.Enrolled_labs?.LabExperiment?.experiments?.chemistry || [];
      
      const existingExp = chemistryExperiments.find(exp => exp.id === "crystallization");
      const isAlreadyEnrolled = enrolledChemistryExperiments.some(exp => exp.id === "crystallization" && exp.completed);
      
      if (existingExp?.completed) {
        setExperimentCompleted(true);
        return;
      }

      const updatedChemistryExperiments = chemistryExperiments.map(exp => 
        exp.id === "crystallization" ? { ...exp, completed: true, status: "completed" } : exp
      );

      const updateData = {
        'LabExperiment.experiments.chemistry': updatedChemistryExperiments
      };

      if (!isAlreadyEnrolled) {
        updateData['Enrolled_labs.LabExperiment.experiments.chemistry'] = arrayUnion({
          completed: true,
          description: "Study the crystallization of salts from aqueous solutions.",
          difficulty: "Beginner",
          duration: "40 minutes",
          id: "crystallization",
          route: "/crystallization-experiment",
          status: "completed",
          title: "Crystallization Process"
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
    const essentialComponents = ['beaker', 'burner', 'tripodStand', 'wireGauze', 'saltBottle', 'stirringRod'];
    const allEssentialPlaced = essentialComponents.every(key => placedComponents[key] === key);
    setIsSetupComplete(allEssentialPlaced);
  }, [placedComponents]);

  // Temperature and dissolution simulation
  useEffect(() => {
    if (!experimentStarted) return;

    const interval = setInterval(() => {
      if (heatingActive && temperature < 100) {
        setTemperature(prev => Math.min(100, prev + 2));
      } else if (coolingActive && temperature > 25) {
        setTemperature(prev => Math.max(25, prev - 1));
      }

      // Update dissolution progress when heating
      if (heatingActive && temperature > 60 && dissolutionProgress < 100) {
        setDissolutionProgress(prev => Math.min(100, prev + 3));
        const maxSolubility = saltData.solubility25C + ((saltData.solubility100C - saltData.solubility25C) * (temperature - 25) / 75);
        setSolutionConcentration(maxSolubility * (dissolutionProgress / 100));
      }

      // Update crystallization when cooling
      if (coolingActive && temperature < 50 && dissolutionProgress === 100) {
        setCrystallizationProgress(prev => Math.min(100, prev + 2));
        setCrystalSize(prev => Math.min(100, prev + 1.5));
      }

      // Update solution color based on concentration
      if (dissolutionProgress > 0) {
        const opacity = Math.min(1, dissolutionProgress / 100);
        setSolutionColor(`rgba(79, 195, 247, ${opacity})`);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [heatingActive, coolingActive, temperature, dissolutionProgress, experimentStarted]);

  // Stage management
  useEffect(() => {
    if (temperature > 80 && dissolutionProgress < 100) {
      setCurrentStage('dissolving');
    } else if (dissolutionProgress === 100 && temperature > 50) {
      setCurrentStage('cooling');
    } else if (coolingActive && temperature < 50) {
      setCurrentStage('crystallizing');
    } else if (crystallizationProgress === 100) {
      setCurrentStage('complete');
    }
  }, [temperature, dissolutionProgress, crystallizationProgress, coolingActive]);

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
      beaker: null,
      burner: null,
      tripodStand: null,
      wireGauze: null,
      saltBottle: null,
      stirringRod: null,
      filterPaper: null,
      funnel: null
    });
    setExperimentStarted(false);
    setTemperature(25);
    setHeatingActive(false);
    setCoolingActive(false);
    setDissolutionProgress(0);
    setCrystallizationProgress(0);
    setSolutionConcentration(0);
    setCrystalSize(0);
    setCurrentStage('setup');
    setErrorMessage('');
  };

  // Start experiment
  const startExperiment = () => {
    if (!isSetupComplete) {
      alert('Please complete the setup first!');
      return;
    }
    setExperimentStarted(true);
    setCurrentStage('heating');
    setErrorMessage('');
  };

  // Toggle heating
  const toggleHeating = () => {
    if (!experimentStarted) {
      alert('Please start the experiment first!');
      return;
    }
    setHeatingActive(prev => !prev);
    if (heatingActive) {
      setCoolingActive(false);
    }
  };

  // Start cooling
  const startCooling = () => {
    if (!experimentStarted || dissolutionProgress < 100) {
      alert('Please wait for complete dissolution before cooling!');
      return;
    }
    setHeatingActive(false);
    setCoolingActive(true);
  };

  // Record observation
  const recordObservation = async () => {
    if (!experimentStarted) {
      alert('Please start the experiment first!');
      return;
    }

    const newDataPoint = {
      temperature: parseFloat(temperature).toFixed(1),
      dissolutionProgress: parseFloat(dissolutionProgress).toFixed(1),
      crystallizationProgress: parseFloat(crystallizationProgress).toFixed(1),
      stage: currentStage
    };

    setTableData(prevData => [newDataPoint, ...prevData]);

    // Mark completed after 5 observations
    if (tableData.length + 1 >= 5 && !experimentCompleted) {
      await markExperimentCompleted();
    }
  };

  const clearTable = () => {
    setTableData([]);
  };

  // Print report
  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Crystallization Process Lab Report</h1>
        <p><strong>Student:</strong> ${userProfile.name}</p>
        <p><strong>Class:</strong> ${userProfile.class}</p>
        <p><strong>School:</strong> ${userProfile.school}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Experimental Setup</h2>
        <p><strong>Salt Used:</strong> ${saltData.name}</p>
        <p><strong>Solubility at 25°C:</strong> ${saltData.solubility25C} g/100mL</p>
        <p><strong>Solubility at 100°C:</strong> ${saltData.solubility100C} g/100mL</p>
        
        <h2>Observations</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Obs. No.</th>
            <th>Temperature (°C)</th>
            <th>Dissolution (%)</th>
            <th>Crystallization (%)</th>
            <th>Stage</th>
          </tr>
          ${tableData.map((data, index) => `
            <tr>
              <td>${tableData.length - index}</td>
              <td>${data.temperature}</td>
              <td>${data.dissolutionProgress}</td>
              <td>${data.crystallizationProgress}</td>
              <td>${data.stage}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Conclusion</h2>
        <p>Crystallization is a process where a solid forms from a solution when the solution becomes supersaturated. 
        By heating the solution, we increase solubility and dissolve more salt. Upon cooling, the solubility decreases, 
        and the excess salt crystallizes out of the solution.</p>
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
      ['Obs. No.', 'Temperature (°C)', 'Dissolution (%)', 'Crystallization (%)', 'Stage'],
      ...tableData.map((data, index) => [
        tableData.length - index,
        data.temperature,
        data.dissolutionProgress,
        data.crystallizationProgress,
        data.stage
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crystallization_data_${new Date().toISOString().split('T')[0]}.csv`;
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
          className="transition-all duration-100"
        />
        {!isFilled && (
          <text x={x + width / 2} y={y + height / 2 + 5} fontSize="11" textAnchor="middle" fill="white" className="pointer-events-none">
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            {t('💎 Interactive Crystallization Process Lab 🔬', '💎 ಸಂವಾದಾತ್ಮಕ ಸ್ಫಟಿಕೀಕರಣ ಪ್ರಕ್ರಿಯೆ ಲ್ಯಾಬ್ 🔬')}
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
              disabled={tableData.length === 0}
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
                  <Flame className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <h3 className={`font-bold ${isSetupComplete ? 'text-green-800' : 'text-red-800'}`}>
                  Setup Status: {isSetupComplete ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}
                </h3>
              </div>
              {!isSetupComplete && (
                <p className="text-red-700 text-sm mt-2">
                  Drag and drop all essential apparatus into their marked slots.
                </p>
              )}
            </div>

            {/* Current Stage Indicator */}
            {experimentStarted && (
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="text-blue-600" size={24} />
                  <h3 className="font-bold text-blue-800">Current Stage: {currentStage.toUpperCase()}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Temperature:</p>
                    <p className="text-xl font-bold text-blue-700">{temperature.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dissolution:</p>
                    <p className="text-xl font-bold text-blue-700">{dissolutionProgress.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Crystallization:</p>
                    <p className="text-xl font-bold text-blue-700">{crystallizationProgress.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Crystal Size:</p>
                    <p className="text-xl font-bold text-blue-700">{crystalSize.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-cyan-50 p-6 rounded-xl shadow-md border border-cyan-200">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-cyan-800">📋 Procedure</h2>
                <TTSButton
                  text="1. Place the Tripod Stand and Wire Gauze. 2. Position the Beaker on the wire gauze. 3. Place the Bunsen Burner below. 4. Add Salt and Stirring Rod. 5. Heat the solution until salt dissolves completely. 6. Cool the solution slowly to observe crystallization. 7. Record observations at different stages."
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
                <li>Place the <strong>Tripod Stand</strong> and <strong>Wire Gauze</strong></li>
                <li>Position the <strong>Beaker</strong> on the wire gauze</li>
                <li>Place the <strong>Bunsen Burner</strong> below</li>
                <li>Add <strong>Salt</strong> and <strong>Stirring Rod</strong></li>
                <li>Heat the solution until salt dissolves completely</li>
                <li>Cool the solution slowly to observe crystallization</li>
                <li>Record observations at different stages</li>
              </ol>
            </div>

            {/* Apparatus Setup */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Setup Your Apparatus</h2>
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
                <h3 className="w-full text-lg font-semibold text-gray-700 mb-2">Apparatus:</h3>
                
                {placedComponents.tripodStand === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'tripodStand')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="50" viewBox="0 0 50 50">
                        <line x1="25" y1="10" x2="10" y2="45" stroke="#666" strokeWidth="3" />
                        <line x1="25" y1="10" x2="40" y2="45" stroke="#666" strokeWidth="3" />
                        <line x1="25" y1="10" x2="25" y2="45" stroke="#666" strokeWidth="3" />
                        <circle cx="25" cy="20" r="15" fill="none" stroke="#666" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Tripod</span>
                  </div>
                )}

                {placedComponents.wireGauze === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'wireGauze')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="30" viewBox="0 0 50 30">
                        <rect x="5" y="10" width="40" height="10" fill="#bdbdbd" stroke="#757575" strokeWidth="2" />
                        <line x1="10" y1="10" x2="10" y2="20" stroke="#424242" strokeWidth="1" />
                        <line x1="20" y1="10" x2="20" y2="20" stroke="#424242" strokeWidth="1" />
                        <line x1="30" y1="10" x2="30" y2="20" stroke="#424242" strokeWidth="1" />
                        <line x1="40" y1="10" x2="40" y2="20" stroke="#424242" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Wire Gauze</span>
                  </div>
                )}

                {placedComponents.beaker === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'beaker')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="8" y="10" width="24" height="35" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" rx="2" />
                        <line x1="8" y1="15" x2="32" y2="15" stroke="#1976d2" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Beaker</span>
                  </div>
                )}

                {placedComponents.burner === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'burner')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="10" y="30" width="20" height="15" fill="#666" stroke="#333" strokeWidth="2" rx="2" />
                        <circle cx="20" cy="20" r="8" fill="#ff6b6b" opacity="0.7" />
                        <rect x="18" y="5" width="4" height="10" fill="#666" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Burner</span>
                  </div>
                )}

                {placedComponents.stirringRod === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'stirringRod')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="17" y="5" width="6" height="40" fill="#9e9e9e" stroke="#616161" strokeWidth="2" rx="3" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Stirring Rod</span>
                  </div>
                )}

                {placedComponents.saltBottle === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'saltBottle')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="10" y="15" width="20" height="30" fill="#b3e5fc" stroke="#0277bd" strokeWidth="2" rx="3" />
                        <circle cx="20" cy="8" r="5" fill="#0277bd" />
                        <text x="20" y="32" fontSize="10" textAnchor="middle" fill="#01579b">CuSO₄</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Salt</span>
                  </div>
                )}

                {placedComponents.funnel === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'funnel')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <polygon points="10,10 30,10 22,35 18,35" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" />
                        <rect x="18" y="35" width="4" height="8" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Funnel</span>
                  </div>
                )}

                {placedComponents.filterPaper === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'filterPaper')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="15" fill="white" stroke="#9e9e9e" strokeWidth="2" />
                        <line x1="8" y1="8" x2="32" y2="32" stroke="#bdbdbd" strokeWidth="1" />
                        <line x1="32" y1="8" x2="8" y2="32" stroke="#bdbdbd" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Filter Paper</span>
                  </div>
                )}
              </div>

              {/* Setup Diagram */}
              <div className="relative w-full max-w-lg mx-auto aspect-[5/4] bg-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Render slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1'), props.color)
                  ))}

                  {/* Render placed components */}
                  {placedComponents.tripodStand === 'tripodStand' && (
                    <g transform={`translate(${componentSlots.tripodStand.x}, ${componentSlots.tripodStand.y})`}>
                      <rect x="0" y="0" width="120" height="100" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <line x1="60" y1="20" x2="20" y2="90" stroke="#666" strokeWidth="4" />
                      <line x1="60" y1="20" x2="100" y2="90" stroke="#666" strokeWidth="4" />
                      <line x1="60" y1="20" x2="60" y2="90" stroke="#666" strokeWidth="4" />
                      <circle cx="60" cy="35" r="25" fill="none" stroke="#666" strokeWidth="3" />
                    </g>
                  )}

                  {placedComponents.wireGauze === 'wireGauze' && (
                    <g transform={`translate(${componentSlots.wireGauze.x}, ${componentSlots.wireGauze.y})`}>
                      <rect x="0" y="0" width="90" height="30" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="10" y="8" width="70" height="14" fill="#bdbdbd" stroke="#757575" strokeWidth="2" />
                      <line x1="20" y1="8" x2="20" y2="22" stroke="#424242" strokeWidth="1" />
                      <line x1="30" y1="8" x2="30" y2="22" stroke="#424242" strokeWidth="1" />
                      <line x1="40" y1="8" x2="40" y2="22" stroke="#424242" strokeWidth="1" />
                      <line x1="50" y1="8" x2="50" y2="22" stroke="#424242" strokeWidth="1" />
                      <line x1="60" y1="8" x2="60" y2="22" stroke="#424242" strokeWidth="1" />
                      <line x1="70" y1="8" x2="70" y2="22" stroke="#424242" strokeWidth="1" />
                    </g>
                  )}

                  {placedComponents.beaker === 'beaker' && (
                    <g transform={`translate(${componentSlots.beaker.x}, ${componentSlots.beaker.y})`}>
                      <rect x="0" y="0" width="80" height="100" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="10" y="20" width="60" height="70" fill={experimentStarted ? solutionColor : '#e3f2fd'} stroke="#1976d2" strokeWidth="2" rx="3" />
                      <line x1="10" y1="30" x2="70" y2="30" stroke="#1976d2" strokeWidth="1" opacity="0.5" />
                      {experimentStarted && dissolutionProgress > 0 && (
                        <text x="40" y="60" fontSize="10" textAnchor="middle" fill="white">
                          {temperature.toFixed(0)}°C
                        </text>
                      )}
                      {/* Crystal visualization at bottom when crystallizing */}
                      {crystallizationProgress > 0 && (
                        <>
                          <rect x="15" y={85 - (crystalSize * 0.3)} width="8" height={crystalSize * 0.3} fill="#0277bd" opacity="0.8" />
                          <rect x="25" y={85 - (crystalSize * 0.25)} width="8" height={crystalSize * 0.25} fill="#0277bd" opacity="0.8" />
                          <rect x="35" y={85 - (crystalSize * 0.35)} width="8" height={crystalSize * 0.35} fill="#0277bd" opacity="0.8" />
                          <rect x="45" y={85 - (crystalSize * 0.28)} width="8" height={crystalSize * 0.28} fill="#0277bd" opacity="0.8" />
                          <rect x="55" y={85 - (crystalSize * 0.32)} width="8" height={crystalSize * 0.32} fill="#0277bd" opacity="0.8" />
                        </>
                      )}
                    </g>
                  )}

                  {placedComponents.burner === 'burner' && (
                    <g transform={`translate(${componentSlots.burner.x}, ${componentSlots.burner.y})`}>
                      <rect x="0" y="0" width="60" height="70" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="10" y="40" width="40" height="25" fill="#666" stroke="#333" strokeWidth="2" rx="3" />
                      {heatingActive && (
                        <>
                          <ellipse cx="30" cy="30" rx="12" ry="15" fill="#ff6b6b" opacity="0.7">
                            <animate attributeName="ry" values="15;18;15" dur="0.5s" repeatCount="indefinite" />
                          </ellipse>
                          <ellipse cx="30" cy="25" rx="8" ry="10" fill="#ffeb3b" opacity="0.8">
                            <animate attributeName="ry" values="10;13;10" dur="0.4s" repeatCount="indefinite" />
                          </ellipse>
                        </>
                      )}
                      <rect x="27" y="10" width="6" height="15" fill="#666" />
                    </g>
                  )}

                  {placedComponents.stirringRod === 'stirringRod' && (
                    <g transform={`translate(${componentSlots.stirringRod.x}, ${componentSlots.stirringRod.y})`}>
                      <rect x="0" y="0" width="70" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="27" y="15" width="16" height="50" fill="#9e9e9e" stroke="#616161" strokeWidth="2" rx="8" />
                      <ellipse cx="35" cy="15" rx="8" ry="4" fill="#bdbdbd" stroke="#616161" strokeWidth="2" />
                    </g>
                  )}

                  {placedComponents.saltBottle === 'saltBottle' && (
                    <g transform={`translate(${componentSlots.saltBottle.x}, ${componentSlots.saltBottle.y})`}>
                      <rect x="0" y="0" width="70" height="90" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="25" width="40" height="55" fill="#b3e5fc" stroke="#0277bd" strokeWidth="2" rx="4" />
                      <circle cx="35" cy="15" r="8" fill="#0277bd" />
                      <text x="35" y="56" fontSize="12" textAnchor="middle" fill="#01579b" fontWeight="bold">CuSO₄</text>
                    </g>
                  )}

                  {placedComponents.funnel === 'funnel' && (
                    <g transform={`translate(${componentSlots.funnel.x}, ${componentSlots.funnel.y})`}>
                      <rect x="0" y="0" width="70" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <polygon points="15,20 55,20 40,50 30,50" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" />
                      <rect x="32" y="50" width="6" height="15" fill="#fff9c4" stroke="#f57f17" strokeWidth="2" />
                    </g>
                  )}

                  {placedComponents.filterPaper === 'filterPaper' && (
                    <g transform={`translate(${componentSlots.filterPaper.x}, ${componentSlots.filterPaper.y})`}>
                      <rect x="0" y="0" width="70" height="70" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <circle cx="35" cy="35" r="25" fill="white" stroke="#9e9e9e" strokeWidth="2" />
                      <line x1="15" y1="15" x2="55" y2="55" stroke="#bdbdbd" strokeWidth="1" />
                      <line x1="55" y1="15" x2="15" y2="55" stroke="#bdbdbd" strokeWidth="1" />
                      <circle cx="35" cy="35" r="15" fill="none" stroke="#bdbdbd" strokeWidth="1" />
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
                    <Flame size={24} />
                    Start Experiment
                  </button>
                </div>

                {experimentStarted && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-orange-800 mb-2">Heating Controls</h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={toggleHeating}
                          className={`flex items-center gap-2 px-4 py-2 ${heatingActive ? 'bg-red-600' : 'bg-orange-500'} text-white rounded-lg hover:opacity-90 transition-colors`}
                        >
                          <Flame size={16} />
                          {heatingActive ? 'Stop Heating' : 'Start Heating'}
                        </button>
                        <button
                          onClick={startCooling}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          disabled={dissolutionProgress < 100}
                        >
                          <Thermometer size={16} />
                          Start Cooling
                        </button>
                      </div>
                    </div>

                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                      <h3 className="font-bold text-cyan-800 mb-3">Progress Indicators</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Dissolution Progress</span>
                            <span>{dissolutionProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                              style={{ width: `${dissolutionProgress}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Crystallization Progress</span>
                            <span>{crystallizationProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className="bg-cyan-500 h-4 rounded-full transition-all duration-300"
                              style={{ width: `${crystallizationProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={recordObservation}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors"
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

          {/* Right Column: Data Table and Graph */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('Observations', 'ಅವಲೋಕನಗಳು')}</h2>
                <button
                  onClick={clearTable}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={tableData.length === 0}
                >
                  Clear Table
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Obs. No.</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Temperature (°C)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Dissolution (%)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Crystallization (%)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">No observations recorded yet. Start the experiment and record observations.</td>
                      </tr>
                    ) : (
                      tableData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{tableData.length - index}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.temperature}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.dissolutionProgress}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.crystallizationProgress}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800 capitalize">{data.stage}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Temperature vs Time Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Temperature vs Observation</h2>
              <div className="h-80 w-full">
                {tableData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tableData.slice().reverse()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={(item, index) => index + 1}
                        label={{ value: "Observation Number", position: "insideBottomRight", offset: 0 }} 
                      />
                      <YAxis 
                        label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="temperature" stroke="#ff6b6b" name="Temperature (°C)" dot={true} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Record observations to see the graph.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dissolution vs Crystallization</h2>
              <div className="h-80 w-full">
                {tableData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tableData.slice().reverse()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={(item, index) => index + 1}
                        label={{ value: "Observation Number", position: "insideBottomRight", offset: 0 }} 
                      />
                      <YAxis 
                        label={{ value: "Progress (%)", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="dissolutionProgress" stroke="#2196f3" name="Dissolution (%)" dot={true} strokeWidth={2} />
                      <Line type="monotone" dataKey="crystallizationProgress" stroke="#00bcd4" name="Crystallization (%)" dot={true} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Record observations to see the progress.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;