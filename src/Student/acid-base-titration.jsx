import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, Download, RotateCcw, Beaker, AlertCircle, Droplet } from 'lucide-react';
import { db, auth } from '../firebase'; // Adjust path as needed
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import useTTS from '../hooks/useTTS';
import TTSButton from '../components/TTSButton';

const App = () => {
  const { t } = useLanguage();
  const { speak, stopSpeech, pauseSpeech, resumeSpeech, isSpeaking, isPaused } = useTTS();
  // Titration state
  const [acidConcentration, setAcidConcentration] = useState(0.1); // mol/L (unknown to student initially)
  const [baseConcentration, setBaseConcentration] = useState(0.1); // mol/L (known)
  const [acidVolume, setAcidVolume] = useState(25); // mL
  const [addedBaseVolume, setAddedBaseVolume] = useState(0); // mL
  const [pH, setPH] = useState(1.0);
  const [indicatorColor, setIndicatorColor] = useState('#ff6b6b'); // Red for acidic
  const [isTitrating, setIsTitrating] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Component placement states
  const [placedComponents, setPlacedComponents] = useState({
    burette: null,
    flask: null,
    stand: null,
    indicator: null,
    baseBottle: null,
    acidBottle: null
  });
  
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null);
  const [experimentStarted, setExperimentStarted] = useState(false);
  
  // Firebase integration
  const [user, loading, error] = useAuthState(auth);
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const experimentId = "acid-base-titration";
  
  // User profile
  const [userProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'Science Academy'
  });

  // Component slots for drag and drop
  const componentSlots = {
    stand: { x: 180, y: 250, width: 100, height: 120, color: '#9e9e9e' },
    burette: { x: 200, y: 40, width: 60, height: 180, color: '#64b5f6' },
    flask: { x: 180, y: 280, width: 100, height: 90, color: '#81c784' },
    indicator: { x: 50, y: 40, width: 80, height: 80, color: '#ffb74d' },
    acidBottle: { x: 350, y: 280, width: 70, height: 90, color: '#ff6b6b' },
    baseBottle: { x: 50, y: 150, width: 70, height: 90, color: '#64b5f6' }
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
          const chemistryExperiments = userData.LabExperiment?.experiments?.chemistry || [];
          const titrationExp = chemistryExperiments.find(exp => exp.id === "acid-base-titration");
          
          if (titrationExp && titrationExp.completed) {
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
      
      // Check if already completed
      const existingExp = chemistryExperiments.find(exp => exp.id === "acid-base-titration");
      const isAlreadyEnrolled = enrolledChemistryExperiments.some(exp => exp.id === "acid-base-titration" && exp.completed);
      
      if (existingExp?.completed) {
        setExperimentCompleted(true);
        return;
      }

      // Update main LabExperiment chemistry array
      const updatedChemistryExperiments = chemistryExperiments.map(exp => 
        exp.id === "acid-base-titration" ? { ...exp, completed: true, status: "completed" } : exp
      );

      const updateData = {
        'LabExperiment.experiments.chemistry': updatedChemistryExperiments
      };

      // Only add to enrolled labs and increment count if not already enrolled as completed
      if (!isAlreadyEnrolled) {
        updateData['Enrolled_labs.LabExperiment.experiments.chemistry'] = arrayUnion({
          completed: true,
          description: "Determine the concentration of an unknown acid or base solution.",
          difficulty: "Beginner",
          duration: "45 minutes",
          id: "acid-base-titration",
          route: "/acid-base-titration-experiment",
          status: "completed",
          title: "Acid-Base Titration"
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

  // Calculate pH based on volumes
  useEffect(() => {
    if (!experimentStarted || !isSetupComplete) {
      setPH(1.0);
      setIndicatorColor('#ff6b6b');
      return;
    }

    // Calculate moles
    const molesAcid = (acidConcentration * acidVolume) / 1000;
    const molesBase = (baseConcentration * addedBaseVolume) / 1000;
    const totalVolume = acidVolume + addedBaseVolume;

    let calculatedPH;
    
    if (molesBase < molesAcid) {
      // Excess acid
      const excessAcid = molesAcid - molesBase;
      const concentration = (excessAcid / totalVolume) * 1000;
      calculatedPH = -Math.log10(concentration);
    } else if (molesBase > molesAcid) {
      // Excess base
      const excessBase = molesBase - molesAcid;
      const concentration = (excessBase / totalVolume) * 1000;
      const pOH = -Math.log10(concentration);
      calculatedPH = 14 - pOH;
    } else {
      // Equivalence point
      calculatedPH = 7.0;
    }

    // Ensure pH is within reasonable bounds
    calculatedPH = Math.max(0, Math.min(14, calculatedPH));
    setPH(calculatedPH);

    // Set indicator color based on pH (phenolphthalein)
    if (calculatedPH < 4) {
      setIndicatorColor('#ff6b6b'); // Red
    } else if (calculatedPH < 6) {
      setIndicatorColor('#ff9966'); // Orange
    } else if (calculatedPH < 8) {
      setIndicatorColor('#ffeb3b'); // Yellow
    } else if (calculatedPH < 10) {
      setIndicatorColor('#8bc34a'); // Light green
    } else {
      setIndicatorColor('#4caf50'); // Green
    }
  }, [addedBaseVolume, acidVolume, acidConcentration, baseConcentration, experimentStarted, isSetupComplete]);

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
      burette: null,
      flask: null,
      stand: null,
      indicator: null,
      baseBottle: null,
      acidBottle: null
    });
    setExperimentStarted(false);
    setAddedBaseVolume(0);
    setErrorMessage('');
    setTableData([]);
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

  // Add base (titration)
  const addBase = (amount) => {
    if (!experimentStarted) {
      alert('Please start the experiment first!');
      return;
    }
    setIsTitrating(true);
    setTimeout(() => setIsTitrating(false), 300);
    setAddedBaseVolume(prev => Math.max(0, prev + amount));
  };

  // Record reading
  const recordReading = async () => {
    if (!experimentStarted) {
      alert('Please start the experiment first!');
      return;
    }

    const newDataPoint = {
      volume: parseFloat(addedBaseVolume).toFixed(2),
      pH: parseFloat(pH).toFixed(2),
      color: indicatorColor
    };

    setTableData(prevData => [newDataPoint, ...prevData]);

    // Mark completed after 5 readings
    if (tableData.length + 1 >= 5 && !experimentCompleted) {
      await markExperimentCompleted();
    }
  };

  const clearTable = () => {
    setTableData([]);
  };

  // Calculate equivalence point
  const calculateEquivalencePoint = () => {
    const equivalenceVolume = (acidConcentration * acidVolume) / baseConcentration;
    return equivalenceVolume.toFixed(2);
  };

  // Print report
  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Acid-Base Titration Lab Report</h1>
        <p><strong>Student:</strong> ${userProfile.name}</p>
        <p><strong>Class:</strong> ${userProfile.class}</p>
        <p><strong>School:</strong> ${userProfile.school}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Experimental Setup</h2>
        <p><strong>Acid Volume:</strong> ${acidVolume} mL</p>
        <p><strong>Base Concentration:</strong> ${baseConcentration} M</p>
        <p><strong>Indicator:</strong> Phenolphthalein</p>
        
        <h2>Titration Data</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Reading No.</th>
            <th>Volume of Base Added (mL)</th>
            <th>pH</th>
          </tr>
          ${tableData.map((data, index) => `
            <tr>
              <td>${tableData.length - index}</td>
              <td>${data.volume}</td>
              <td>${data.pH}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Calculations</h2>
        <p><strong>Equivalence Point:</strong> ${calculateEquivalencePoint()} mL</p>
        <p><strong>Calculated Acid Concentration:</strong> ${acidConcentration} M</p>
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
      ['Reading No.', 'Volume of Base (mL)', 'pH'],
      ...tableData.map((data, index) => [
        tableData.length - index,
        data.volume,
        data.pH
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titration_data_${new Date().toISOString().split('T')[0]}.csv`;
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
          <text x={x + width / 2} y={y + height / 2 + 5} fontSize="12" textAnchor="middle" fill="white" className="pointer-events-none">
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-pink-400 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            {t('🧪 Interactive Acid-Base Titration Lab 🔬', '🧪 ಸಂವಾದಾತ್ಮಕ ಆಮ್ಲ-ಕ್ಷಾರ ಟೈಟ್ರೇಶನ್ ಲ್ಯಾಬ್ 🔬')}
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
                  <Beaker className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <h3 className={`font-bold ${isSetupComplete ? 'text-green-800' : 'text-red-800'}`}>
                  Setup Status: {isSetupComplete ? 'COMPLETE ✅' : 'INCOMPLETE ❌'}
                </h3>
              </div>
              {!isSetupComplete && (
                <p className="text-red-700 text-sm mt-2">
                  Drag and drop all apparatus into their marked slots to complete the setup.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-purple-800">📋 Setup Instructions</h2>
                <TTSButton
                  text="1. Drag the Retort Stand to its position. 2. Place the Burette on the stand. 3. Position the Conical Flask below the burette. 4. Add the Indicator Bottle. 5. Place the Acid Bottle containing unknown concentration. 6. Place the Base Bottle containing 0.1 M NaOH"
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
                <li>Drag the <strong>Retort Stand</strong> to its position</li>
                <li>Place the <strong>Burette</strong> on the stand</li>
                <li>Position the <strong>Conical Flask</strong> below the burette</li>
                <li>Add the <strong>Indicator Bottle</strong></li>
                <li>Place the <strong>Acid Bottle</strong> (containing unknown concentration)</li>
                <li>Place the <strong>Base Bottle</strong> (0.1 M NaOH)</li>
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
                
                {placedComponents.stand === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'stand')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="60" viewBox="0 0 50 60">
                        <rect x="20" y="0" width="10" height="60" fill="#666" />
                        <rect x="0" y="5" width="50" height="8" fill="#666" />
                        <rect x="15" y="55" width="20" height="5" fill="#666" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Stand</span>
                  </div>
                )}

                {placedComponents.burette === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'burette')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="30" height="60" viewBox="0 0 30 60">
                        <rect x="10" y="0" width="10" height="50" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" />
                        <polygon points="10,50 20,50 18,60 12,60" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Burette</span>
                  </div>
                )}

                {placedComponents.flask === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'flask')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="50" viewBox="0 0 50 50">
                        <polygon points="15,10 35,10 40,45 10,45" fill="#f1f8e9" stroke="#558b2f" strokeWidth="2" />
                        <rect x="20" y="5" width="10" height="5" fill="#f1f8e9" stroke="#558b2f" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Flask</span>
                  </div>
                )}

                {placedComponents.indicator === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'indicator')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="10" y="10" width="20" height="30" fill="#fff3e0" stroke="#e65100" strokeWidth="2" rx="3" />
                        <circle cx="20" cy="5" r="3" fill="#e65100" />
                        <text x="20" y="28" fontSize="10" textAnchor="middle">Ind</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Indicator</span>
                  </div>
                )}

                {placedComponents.acidBottle === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'acidBottle')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="10" y="10" width="20" height="35" fill="#ffebee" stroke="#c62828" strokeWidth="2" rx="3" />
                        <circle cx="20" cy="5" r="3" fill="#c62828" />
                        <text x="20" y="30" fontSize="12" textAnchor="middle" fill="#c62828">HCl</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Acid</span>
                  </div>
                )}

                {placedComponents.baseBottle === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'baseBottle')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="50" viewBox="0 0 40 50">
                        <rect x="10" y="10" width="20" height="35" fill="#e3f2fd" stroke="#1565c0" strokeWidth="2" rx="3" />
                        <circle cx="20" cy="5" r="3" fill="#1565c0" />
                        <text x="20" y="30" fontSize="10" textAnchor="middle" fill="#1565c0">NaOH</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Base</span>
                  </div>
                )}
              </div>

              {/* Setup Diagram */}
              <div className="relative w-full max-w-lg mx-auto aspect-[5/4] bg-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Render slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, id.charAt(0).toUpperCase() + id.slice(1), props.color)
                  ))}

                  {/* Render placed components */}
                  {placedComponents.stand === 'stand' && (
                    <g transform={`translate(${componentSlots.stand.x}, ${componentSlots.stand.y})`}>
                      <rect x="0" y="0" width="100" height="120" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="40" y="10" width="20" height="100" fill="#666" />
                      <rect x="10" y="15" width="80" height="15" fill="#666" />
                      <rect x="30" y="100" width="40" height="10" fill="#666" />
                    </g>
                  )}

                  {placedComponents.burette === 'burette' && (
                    <g transform={`translate(${componentSlots.burette.x}, ${componentSlots.burette.y})`}>
                      <rect x="0" y="0" width="60" height="180" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="20" width="30" height="140" fill={experimentStarted ? indicatorColor : '#e3f2fd'} stroke="#1976d2" strokeWidth="2" />
                      <polygon points="15,160 45,160 40,175 20,175" fill={experimentStarted ? indicatorColor : '#e3f2fd'} stroke="#1976d2" strokeWidth="2" />
                      {experimentStarted && (
                        <text x="30" y="100" fontSize="10" textAnchor="middle" fill="white">
                          {addedBaseVolume.toFixed(1)} mL
                        </text>
                      )}
                      {isTitrating && (
                        <circle cx="30" cy="175" r="3" fill="#1976d2">
                          <animate attributeName="cy" from="175" to="200" dur="0.3s" repeatCount="1" />
                        </circle>
                      )}
                    </g>
                  )}

                  {placedComponents.flask === 'flask' && (
                    <g transform={`translate(${componentSlots.flask.x}, ${componentSlots.flask.y})`}>
                      <rect x="0" y="0" width="100" height="90" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <polygon points="25,20 75,20 85,80 15,80" fill={experimentStarted ? indicatorColor : '#f1f8e9'} stroke="#558b2f" strokeWidth="2" />
                      <rect x="40" y="10" width="20" height="10" fill="#f1f8e9" stroke="#558b2f" strokeWidth="2" />
                      {experimentStarted && (
                        <text x="50" y="55" fontSize="10" textAnchor="middle" fill="white">
                          pH: {pH.toFixed(2)}
                        </text>
                      )}
                    </g>
                  )}

                  {placedComponents.indicator === 'indicator' && (
                    <g transform={`translate(${componentSlots.indicator.x}, ${componentSlots.indicator.y})`}>
                      <rect x="0" y="0" width="80" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="20" y="20" width="40" height="50" fill="#fff3e0" stroke="#e65100" strokeWidth="2" rx="3" />
                      <circle cx="40" cy="10" r="5" fill="#e65100" />
                      <text x="40" y="48" fontSize="12" textAnchor="middle" fill="#e65100">Indicator</text>
                    </g>
                  )}

                  {placedComponents.acidBottle === 'acidBottle' && (
                    <g transform={`translate(${componentSlots.acidBottle.x}, ${componentSlots.acidBottle.y})`}>
                      <rect x="0" y="0" width="70" height="90" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="20" width="40" height="60" fill="#ffebee" stroke="#c62828" strokeWidth="2" rx="3" />
                      <circle cx="35" cy="10" r="5" fill="#c62828" />
                      <text x="35" y="53" fontSize="14" textAnchor="middle" fill="#c62828">HCl</text>
                      <text x="35" y="70" fontSize="8" textAnchor="middle">? M</text>
                    </g>
                  )}

                  {placedComponents.baseBottle === 'baseBottle' && (
                    <g transform={`translate(${componentSlots.baseBottle.x}, ${componentSlots.baseBottle.y})`}>
                      <rect x="0" y="0" width="70" height="90" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="20" width="40" height="60" fill="#e3f2fd" stroke="#1565c0" strokeWidth="2" rx="3" />
                      <circle cx="35" cy="10" r="5" fill="#1565c0" />
                      <text x="35" y="53" fontSize="12" textAnchor="middle" fill="#1565c0">NaOH</text>
                      <text x="35" y="70" fontSize="8" textAnchor="middle">{baseConcentration} M</text>
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
                    <Beaker size={24} />
                    Start Titration
                  </button>
                </div>

                {experimentStarted && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2">Titration Controls</h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => addBase(0.5)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Droplet size={16} className="inline mr-1" />
                          +0.5 mL
                        </button>
                        <button
                          onClick={() => addBase(1)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Droplet size={16} className="inline mr-1" />
                          +1.0 mL
                        </button>
                        <button
                          onClick={() => addBase(5)}
                          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          <Droplet size={16} className="inline mr-1" />
                          +5.0 mL
                        </button>
                        <button
                          onClick={() => addBase(-0.5)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          disabled={addedBaseVolume === 0}
                        >
                          -0.5 mL
                        </button>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Base Added</p>
                          <p className="text-2xl font-bold text-purple-700">{addedBaseVolume.toFixed(2)} mL</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current pH</p>
                          <p className="text-2xl font-bold text-purple-700">{pH.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={recordReading}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors"
                      >
                        Record Reading
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
                <h2 className="text-2xl font-bold text-gray-800">{t('Titration Data', 'ಟೈಟ್ರೇಶನ್ ಡೇಟಾ')}</h2>
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
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Reading No.</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Volume of Base (mL)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">pH</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">No data collected yet. Start the titration and record readings.</td>
                      </tr>
                    ) : (
                      tableData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{tableData.length - index}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.volume}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.pH}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: data.color }}></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {experimentStarted && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Calculated Equivalence Point:</strong> {calculateEquivalencePoint()} mL
                  </p>
                </div>
              )}
            </div>

            {/* pH vs Volume Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Titration Curve (pH vs Volume)</h2>
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
                        dataKey="volume" 
                        type="number" 
                        domain={['auto', 'auto']} 
                        label={{ value: "Volume of Base (mL)", position: "insideBottomRight", offset: 0 }} 
                      />
                      <YAxis 
                        dataKey="pH" 
                        type="number" 
                        domain={[0, 14]} 
                        label={{ value: "pH", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip formatter={(value, name) => [`${value} ${name === 'volume' ? 'mL' : ''}`]} />
                      <Legend />
                      <Line type="monotone" dataKey="pH" stroke="#8b5cf6" name="pH" dot={true} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Record readings to see the titration curve.</p>
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

export default App