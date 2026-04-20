import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, Download, RotateCcw, Leaf, AlertCircle, Sun, Thermometer, Droplets, Play, Pause } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const App = () => {
  const { t } = useLanguage();
  // Experiment state
  const [lightIntensity, setLightIntensity] = useState(50);
  const [temperature, setTemperature] = useState(25);
  const [co2Level, setCo2Level] = useState(50);
  const [oxygenBubbles, setOxygenBubbles] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [dataPoints, setDataPoints] = useState([]);
  const [bubbleAnimation, setBubbleAnimation] = useState([]);
  
  // Component placement states
  const [placedComponents, setPlacedComponents] = useState({
    beaker: null,
    plant: null,
    funnel: null,
    testTube: null,
    lamp: null,
    thermometer: null
  });
  
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null);
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Firebase integration
  const [user, loading, error] = useAuthState(auth);
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const experimentId = "photosynthesis";
  
  // User profile
  const [userProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'Science Academy'
  });

  const timerRef = useRef(null);
  const bubbleIntervalRef = useRef(null);

  // Component slots for drag and drop
  const componentSlots = {
    beaker: { x: 150, y: 200, width: 140, height: 140, color: '#81c784' },
    plant: { x: 180, y: 230, width: 80, height: 100, color: '#66bb6a' },
    funnel: { x: 180, y: 200, width: 80, height: 60, color: '#a5d6a7' },
    testTube: { x: 200, y: 100, width: 40, height: 100, color: '#90caf9' },
    lamp: { x: 60, y: 80, width: 80, height: 80, color: '#fff59d' },
    thermometer: { x: 350, y: 200, width: 40, height: 120, color: '#ff8a65' }
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
          const photosynthesisExp = biologyExperiments.find(exp => exp.id === "photosynthesis");
          
          if (photosynthesisExp && photosynthesisExp.completed) {
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
      
      const existingExp = biologyExperiments.find(exp => exp.id === "photosynthesis");
      const isAlreadyEnrolled = enrolledBiologyExperiments.some(exp => exp.id === "photosynthesis" && exp.completed);
      
      if (existingExp?.completed) {
        setExperimentCompleted(true);
        return;
      }

      const updatedBiologyExperiments = biologyExperiments.map(exp => 
        exp.id === "photosynthesis" ? { ...exp, completed: true, status: "completed" } : exp
      );

      const updateData = {
        'LabExperiment.experiments.biology': updatedBiologyExperiments
      };

      if (!isAlreadyEnrolled) {
        updateData['Enrolled_labs.LabExperiment.experiments.biology'] = arrayUnion({
          completed: true,
          description: "Demonstrate oxygen evolution during photosynthesis.",
          difficulty: "Intermediate",
          duration: "60 minutes",
          id: "photosynthesis",
          route: "/photosynthesis-experiment",
          status: "completed",
          title: "Photosynthesis Experiment"
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

  // Timer for experiment
  useEffect(() => {
    if (isRunning && experimentStarted) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, experimentStarted]);

  // Calculate oxygen production rate
  const calculateOxygenRate = () => {
    // Rate depends on light intensity, temperature, and CO2
    const lightFactor = lightIntensity / 100;
    const tempFactor = temperature >= 20 && temperature <= 35 ? 1 : temperature < 20 ? 0.5 : 0.3;
    const co2Factor = co2Level / 100;
    
    return lightFactor * tempFactor * co2Factor * 10;
  };

  // Bubble generation
  useEffect(() => {
    if (isRunning && experimentStarted) {
      const rate = calculateOxygenRate();
      const interval = Math.max(200, 2000 - (rate * 150));
      
      bubbleIntervalRef.current = setInterval(() => {
        const newBubbles = Math.floor(rate);
        setOxygenBubbles(prev => prev + newBubbles);
        
        // Add bubble animation
        const newBubbleAnimations = Array.from({ length: newBubbles }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 40 + 200,
          delay: Math.random() * 500
        }));
        
        setBubbleAnimation(prev => [...prev, ...newBubbleAnimations]);
        
        // Remove old animations after 3 seconds
        setTimeout(() => {
          setBubbleAnimation(prev => prev.filter(b => !newBubbleAnimations.find(nb => nb.id === b.id)));
        }, 3000);
      }, interval);
    } else {
      if (bubbleIntervalRef.current) {
        clearInterval(bubbleIntervalRef.current);
      }
    }

    return () => {
      if (bubbleIntervalRef.current) {
        clearInterval(bubbleIntervalRef.current);
      }
    };
  }, [isRunning, experimentStarted, lightIntensity, temperature, co2Level]);

  // Record data point every 10 seconds
  useEffect(() => {
    if (isRunning && experimentStarted && elapsedTime > 0 && elapsedTime % 10 === 0) {
      const newDataPoint = {
        time: elapsedTime,
        oxygen: oxygenBubbles,
        rate: calculateOxygenRate().toFixed(2),
        light: lightIntensity,
        temp: temperature,
        co2: co2Level
      };
      
      setDataPoints(prev => [...prev, newDataPoint]);
      
      // Mark completed after 60 seconds
      if (elapsedTime >= 60 && !experimentCompleted) {
        markExperimentCompleted();
      }
    }
  }, [elapsedTime, isRunning, experimentStarted]);

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
      plant: null,
      funnel: null,
      testTube: null,
      lamp: null,
      thermometer: null
    });
    setExperimentStarted(false);
    setIsRunning(false);
    setElapsedTime(0);
    setOxygenBubbles(0);
    setDataPoints([]);
    setBubbleAnimation([]);
    setErrorMessage('');
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

  // Toggle experiment running
  const toggleExperiment = () => {
    if (!experimentStarted) {
      alert('Please start the experiment first!');
      return;
    }
    setIsRunning(!isRunning);
  };

  const clearData = () => {
    setDataPoints([]);
    setOxygenBubbles(0);
    setElapsedTime(0);
  };

  // Print report
  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Photosynthesis Lab Report</h1>
        <p><strong>Student:</strong> ${userProfile.name}</p>
        <p><strong>Class:</strong> ${userProfile.class}</p>
        <p><strong>School:</strong> ${userProfile.school}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Experiment Details</h2>
        <p><strong>Experiment:</strong> Oxygen Evolution During Photosynthesis</p>
        <p><strong>Duration:</strong> 60 minutes</p>
        
        <h2>Experimental Data</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Time (s)</th>
            <th>Total O₂ Bubbles</th>
            <th>O₂ Rate</th>
            <th>Light (%)</th>
            <th>Temp (°C)</th>
            <th>CO₂ (%)</th>
          </tr>
          ${dataPoints.map(data => `
            <tr>
              <td>${data.time}</td>
              <td>${data.oxygen}</td>
              <td>${data.rate}</td>
              <td>${data.light}</td>
              <td>${data.temp}</td>
              <td>${data.co2}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Conclusion</h2>
        <p>Total oxygen bubbles produced: ${oxygenBubbles}</p>
        <p>Average production rate: ${dataPoints.length > 0 ? (dataPoints.reduce((sum, d) => sum + parseFloat(d.rate), 0) / dataPoints.length).toFixed(2) : 0} bubbles/interval</p>
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
      ['Time (s)', 'Total O₂ Bubbles', 'O₂ Rate', 'Light Intensity (%)', 'Temperature (°C)', 'CO₂ Level (%)'],
      ...dataPoints.map(data => [
        data.time,
        data.oxygen,
        data.rate,
        data.light,
        data.temp,
        data.co2
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photosynthesis_data_${new Date().toISOString().split('T')[0]}.csv`;
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            {t('🌱 Interactive Photosynthesis Lab 💨', '🌱 ಸಂವಾದಾತ್ಮಕ ಪ್ರಕಾಶಸಂಶ್ಲೇಷಣಾ ಲ್ಯಾಬ್ 💨')}
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
              disabled={dataPoints.length === 0}
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
                  <Leaf className="text-green-600" size={24} />
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
            <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-200">
              <h2 className="text-2xl font-bold text-green-800 mb-4">{t('📋 Setup Instructions', '📋 ಸಿದ್ಧತಾ ಸೂಚನೆಗಳು')}</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 font-semibold">
                <li>Place the <strong>Beaker</strong> filled with water</li>
                <li>Add the <strong>Aquatic Plant</strong> (Hydrilla) into the beaker</li>
                <li>Position the <strong>Funnel</strong> over the plant</li>
                <li>Place the <strong>Test Tube</strong> filled with water over the funnel</li>
                <li>Add the <strong>Lamp</strong> as light source</li>
                <li>Insert the <strong>Thermometer</strong> to monitor temperature</li>
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
                
                {placedComponents.beaker === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'beaker')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="60" viewBox="0 0 50 60">
                        <path d="M 10 10 L 15 55 L 35 55 L 40 10 Z" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" />
                        <rect x="8" y="8" width="34" height="5" fill="#1976d2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Beaker</span>
                  </div>
                )}

                {placedComponents.plant === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'plant')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <Leaf size={40} className="text-green-600" />
                    </div>
                    <span className="text-xs mt-1">Plant</span>
                  </div>
                )}

                {placedComponents.funnel === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'funnel')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="40" viewBox="0 0 50 40">
                        <path d="M 10 35 L 25 10 L 40 35 Z" fill="none" stroke="#66bb6a" strokeWidth="2" />
                        <line x1="25" y1="35" x2="25" y2="40" stroke="#66bb6a" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Funnel</span>
                  </div>
                )}

                {placedComponents.testTube === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'testTube')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="30" height="60" viewBox="0 0 30 60">
                        <rect x="8" y="5" width="14" height="50" rx="7" fill="#e1f5fe" stroke="#0288d1" strokeWidth="2" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Test Tube</span>
                  </div>
                )}

                {placedComponents.lamp === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'lamp')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <Sun size={40} className="text-yellow-500" />
                    </div>
                    <span className="text-xs mt-1">Lamp</span>
                  </div>
                )}

                {placedComponents.thermometer === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'thermometer')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <Thermometer size={40} className="text-red-500" />
                    </div>
                    <span className="text-xs mt-1">Thermometer</span>
                  </div>
                )}
              </div>

              {/* Setup Diagram */}
              <div className="relative w-full max-w-lg mx-auto aspect-[5/4] bg-gradient-to-b from-sky-100 to-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Render slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, id, props.color)
                  ))}

                  {/* Render placed components */}
                  {placedComponents.beaker === 'beaker' && (
                    <g transform={`translate(${componentSlots.beaker.x}, ${componentSlots.beaker.y})`}>
                      <rect x="0" y="0" width="140" height="140" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <path d="M 20 30 L 30 120 L 110 120 L 120 30 Z" fill={experimentStarted ? '#b3e5fc' : '#e3f2fd'} stroke="#1976d2" strokeWidth="3" />
                      <rect x="15" y="25" width="110" height="8" fill="#1976d2" />
                      <text x="70" y="75" fontSize="12" textAnchor="middle" fill="#0288d1">Water</text>
                    </g>
                  )}

                  {placedComponents.plant === 'plant' && (
                    <g transform={`translate(${componentSlots.plant.x}, ${componentSlots.plant.y})`}>
                      <rect x="0" y="0" width="80" height="100" fill="transparent" />
                      <line x1="40" y1="100" x2="40" y2="30" stroke="#2e7d32" strokeWidth="3" />
                      <ellipse cx="25" cy="40" rx="8" ry="12" fill="#66bb6a" />
                      <ellipse cx="40" cy="35" rx="10" ry="15" fill="#4caf50" />
                      <ellipse cx="55" cy="40" rx="8" ry="12" fill="#66bb6a" />
                      <ellipse cx="30" cy="55" rx="7" ry="11" fill="#66bb6a" />
                      <ellipse cx="50" cy="55" rx="7" ry="11" fill="#66bb6a" />
                      {experimentStarted && <ellipse cx="40" cy="45" rx="6" ry="8" fill="#81c784" opacity="0.7" />}
                    </g>
                  )}

                  {placedComponents.funnel === 'funnel' && (
                    <g transform={`translate(${componentSlots.funnel.x}, ${componentSlots.funnel.y})`}>
                      <rect x="0" y="0" width="80" height="60" fill="transparent" />
                      <path d="M 15 50 L 40 15 L 65 50 Z" fill="none" stroke="#66bb6a" strokeWidth="3" />
                      <line x1="40" y1="50" x2="40" y2="60" stroke="#66bb6a" strokeWidth="3" />
                    </g>
                  )}

                  {placedComponents.testTube === 'testTube' && (
                    <g transform={`translate(${componentSlots.testTube.x}, ${componentSlots.testTube.y})`}>
                      <rect x="0" y="0" width="40" height="100" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="8" y="10" width="24" height={experimentStarted ? Math.max(10, 90 - (oxygenBubbles / 10)) : 80} rx="12" fill={experimentStarted ? '#fff9c4' : '#e1f5fe'} stroke="#0288d1" strokeWidth="2" />
                      <rect x="8" y={experimentStarted ? Math.max(20, 100 - (oxygenBubbles / 10)) : 90} width="24" height={experimentStarted ? Math.min(70, (oxygenBubbles / 10)) : 0} rx="12" fill="#ffeb3b" stroke="#f57f17" strokeWidth="1" opacity="0.7" />
                      
                      {/* Bubble animations */}
                      {bubbleAnimation.map(bubble => (
                        <circle
                          key={bubble.id}
                          cx={bubble.x - 200}
                          cy="85"
                          r="2"
                          fill="#ffeb3b"
                          opacity="0.8"
                        >
                          <animate
                            attributeName="cy"
                            from="85"
                            to="15"
                            dur="2.5s"
                            begin={`${bubble.delay}ms`}
                            repeatCount="1"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.8"
                            to="0"
                            dur="2.5s"
                            begin={`${bubble.delay}ms`}
                            repeatCount="1"
                          />
                        </circle>
                      ))}
                    </g>
                  )}

                  {placedComponents.lamp === 'lamp' && (
                    <g transform={`translate(${componentSlots.lamp.x}, ${componentSlots.lamp.y})`}>
                      <rect x="0" y="0" width="80" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <circle cx="40" cy="40" r="25" fill={experimentStarted ? '#ffeb3b' : '#fff59d'} stroke="#f57f17" strokeWidth="2" />
                      {experimentStarted && (
                        <>
                          <circle cx="40" cy="40" r="25" fill="#ffeb3b" opacity="0.5">
                            <animate attributeName="r" values="25;30;25" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <line x1="40" y1="10" x2="40" y2="5" stroke="#ff6f00" strokeWidth="2" />
                          <line x1="40" y1="70" x2="40" y2="75" stroke="#ff6f00" strokeWidth="2" />
                          <line x1="10" y1="40" x2="5" y2="40" stroke="#ff6f00" strokeWidth="2" />
                          <line x1="70" y1="40" x2="75" y2="40" stroke="#ff6f00" strokeWidth="2" />
                        </>
                      )}
                      <text x="40" y="45" fontSize="10" textAnchor="middle" fill="#f57f17">LAMP</text>
                    </g>
                  )}

                  {placedComponents.thermometer === 'thermometer' && (
                    <g transform={`translate(${componentSlots.thermometer.x}, ${componentSlots.thermometer.y})`}>
                      <rect x="0" y="0" width="40" height="120" fill="white" stroke="black" strokeWidth="2" rx="8" />
                      <rect x="15" y="15" width="10" height="90" fill="#ffccbc" stroke="#ff5722" strokeWidth="1" />
                      <rect x="15" y={105 - temperature} width="10" height={temperature} fill="#ff5722" />
                      <circle cx="20" cy="110" r="8" fill="#ff5722" />
                      <text x="20" y="25" fontSize="8" textAnchor="middle" fill="#d84315">{temperature}°C</text>
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
                    <Leaf size={24} />
                    Start Experiment
                  </button>
                  
                  {experimentStarted && (
                    <button
                      onClick={toggleExperiment}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                        isRunning 
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isRunning ? <Pause size={24} /> : <Play size={24} />}
                      {isRunning ? 'Pause' : 'Resume'}
                    </button>
                  )}
                </div>

                {experimentStarted && (
                  <div className="space-y-4">
                    {/* Timer Display */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <div className="text-center">
                        <p className="text-sm text-indigo-600 mb-1">Elapsed Time</p>
                        <p className="text-4xl font-bold text-indigo-800">{formatTime(elapsedTime)}</p>
                        <p className="text-sm text-indigo-600 mt-2">
                          Total O₂ Bubbles: <span className="font-bold text-lg">{oxygenBubbles}</span>
                        </p>
                      </div>
                    </div>

                    {/* Light Intensity Control */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                          <Sun size={20} />
                          Light Intensity
                        </h3>
                        <span className="text-yellow-600 font-semibold">{lightIntensity}%</span>
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
                        <span>Dark</span>
                        <span>Bright</span>
                      </div>
                    </div>

                    {/* Temperature Control */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                          <Thermometer size={20} />
                          Temperature
                        </h3>
                        <span className="text-red-600 font-semibold">{temperature}°C</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="45"
                        value={temperature}
                        onChange={(e) => setTemperature(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-red-600 mt-1">
                        <span>10°C</span>
                        <span>45°C</span>
                      </div>
                    </div>

                    {/* CO2 Level Control */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                          <Droplets size={20} />
                          CO₂ Level
                        </h3>
                        <span className="text-blue-600 font-semibold">{co2Level}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={co2Level}
                        onChange={(e) => setCo2Level(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Current Rate Display */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-800 mb-2">Current O₂ Production Rate</h3>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-700">
                          {calculateOxygenRate().toFixed(2)}
                        </p>
                        <p className="text-sm text-green-600">bubbles per interval</p>
                      </div>
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
                <h2 className="text-2xl font-bold text-gray-800">Experimental Data</h2>
                <button
                  onClick={clearData}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={dataPoints.length === 0}
                >
                  Clear Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Time (s)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">O₂ Bubbles</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Rate</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Light %</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Temp °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPoints.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">
                          No data collected yet. Start the experiment to collect data.
                        </td>
                      </tr>
                    ) : (
                      dataPoints.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.time}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.oxygen}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.rate}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.light}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.temp}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {experimentStarted && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> Data is automatically recorded every 10 seconds. Adjust variables to see their effect on oxygen production.
                  </p>
                </div>
              )}
            </div>

            {/* Oxygen Production Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Oxygen Production Over Time</h2>
              <div className="h-80 w-full">
                {dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataPoints}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -5 }} 
                      />
                      <YAxis 
                        label={{ value: "O₂ Bubbles", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="oxygen" 
                        stroke="#4caf50" 
                        name="Total O₂ Bubbles" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Start the experiment to see the graph.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rate vs Time Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Production Rate Over Time</h2>
              <div className="h-80 w-full">
                {dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dataPoints}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: "Time (seconds)", position: "insideBottomRight", offset: -5 }} 
                      />
                      <YAxis 
                        label={{ value: "Rate (bubbles/interval)", angle: -90, position: "insideLeft" }} 
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#2196f3" 
                        name="O₂ Production Rate" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Start the experiment to see the rate graph.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Observations */}
            <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-200">
              <h2 className="text-2xl font-bold text-purple-800 mb-4">{t('📝 Key Observations', '📝 ಮುಖ್ಯ ಅವಲೋಕನಗಳು')}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Photosynthesis produces oxygen gas (O₂) as a byproduct</li>
                <li>Light intensity directly affects the rate of photosynthesis</li>
                <li>Temperature affects enzyme activity (optimal: 20-35°C)</li>
                <li>CO₂ is a raw material needed for photosynthesis</li>
                <li>Oxygen bubbles collect in the inverted test tube</li>
                <li>The equation: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;