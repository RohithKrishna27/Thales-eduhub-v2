import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Area, AreaChart, Cell } from 'recharts';
import { Printer, Download, RotateCcw, TrendingUp, AlertCircle, Calculator, Activity, BarChart3, Upload, FileSpreadsheet, Zap } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const App = () => {
  const { t } = useLanguage();
  // State for data management
  const [dataPoints, setDataPoints] = useState([]);
  const [currentValue, setCurrentValue] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [selectedVisualization, setSelectedVisualization] = useState('all');
  const [animationEnabled, setAnimationEnabled] = useState(true);
  
  // Statistical results
  const [statistics, setStatistics] = useState({
    mean: 0,
    median: 0,
    mode: [],
    range: 0,
    variance: 0,
    stdDev: 0,
    q1: 0,
    q3: 0,
    iqr: 0,
    min: 0,
    max: 0,
    count: 0,
    skewness: 0,
    kurtosis: 0,
    cv: 0
  });

  const [outliers, setOutliers] = useState([]);
  const [normalityTest, setNormalityTest] = useState({ isNormal: false, confidence: 0 });

  // Firebase states
  const [user, loading, error] = useAuthState(auth);
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const experimentId = "statistics-analysis";

  // User profile
  const [userProfile, setUserProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'PU college'
  });

  // Real-world datasets with context
  const sampleDatasets = {
    'Student Test Scores (%)': {
      data: [45, 52, 68, 72, 75, 78, 82, 85, 88, 90, 92, 95, 98, 100, 88, 76, 81, 79, 84, 91],
      description: 'Test scores from a class of 20 students',
      context: 'Educational Assessment',
      unit: '%'
    },
    'Daily Temperature (°C)': {
      data: [18, 20, 22, 25, 28, 30, 32, 31, 29, 26, 24, 22, 21, 19, 23, 27, 29, 28, 25, 23, 20, 18],
      description: 'Temperature readings over 22 days',
      context: 'Weather Analysis',
      unit: '°C'
    },
    'Monthly Sales (₹1000s)': {
      data: [120, 135, 142, 128, 156, 148, 162, 138, 145, 152, 140, 158, 165, 172, 155, 149, 161, 168],
      description: 'Monthly sales revenue over 18 months',
      context: 'Business Analytics',
      unit: '₹1000s'
    },
    'Plant Growth (cm)': {
      data: [2.5, 3.2, 4.1, 4.8, 5.5, 6.2, 7.1, 7.8, 8.5, 9.2, 10.1, 10.8, 11.5, 12.2, 12.8, 13.5],
      description: 'Plant height measured weekly',
      context: 'Biological Study',
      unit: 'cm'
    },
    'Reaction Time (ms)': {
      data: [245, 238, 252, 241, 235, 248, 255, 242, 239, 251, 244, 237, 246, 253, 240, 249, 243, 236, 250, 247],
      description: 'Response times in a cognitive test',
      context: 'Psychology Experiment',
      unit: 'ms'
    },
    'Stock Prices (₹)': {
      data: [1250, 1275, 1290, 1265, 1310, 1295, 1325, 1340, 1315, 1355, 1370, 1345, 1380, 1395, 1420, 1405, 1435, 1450],
      description: 'Daily closing stock prices',
      context: 'Financial Market',
      unit: '₹'
    }
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
          const mathExperiments = userData.LabExperiment?.experiments?.mathematics || [];
          const statsExp = mathExperiments.find(exp => exp.id === experimentId);
          
          if (statsExp && statsExp.completed) {
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
      const mathExperiments = userData.LabExperiment?.experiments?.mathematics || [];
      const enrolledMathExperiments = userData.Enrolled_labs?.LabExperiment?.experiments?.mathematics || [];
      
      const existingExp = mathExperiments.find(exp => exp.id === experimentId);
      const isAlreadyEnrolled = enrolledMathExperiments.some(exp => exp.id === experimentId && exp.completed);
      
      if (existingExp?.completed) {
        setExperimentCompleted(true);
        return;
      }

      const updatedMathExperiments = mathExperiments.map(exp => 
        exp.id === experimentId ? { ...exp, completed: true, status: "completed" } : exp
      );

      const updateData = {
        'LabExperiment.experiments.mathematics': updatedMathExperiments
      };

      if (!isAlreadyEnrolled) {
        updateData['Enrolled_labs.LabExperiment.experiments.mathematics'] = arrayUnion({
          completed: true,
          description: "Analyze real-world data using statistical methods.",
          difficulty: "Intermediate",
          duration: "45 minutes",
          id: experimentId,
          route: "/statistics-analysis-experiment",
          status: "completed",
          title: "Statistical Data Analysis"
        });
        updateData.totalCompleted = increment(1);
      }
      
      await updateDoc(userDocRef, updateData);
      setExperimentCompleted(true);
      
    } catch (error) {
      console.error('Error updating experiment status:', error);
    }
  };

  // Advanced statistical calculations
  useEffect(() => {
    if (dataPoints.length === 0) {
      setStatistics({
        mean: 0, median: 0, mode: [], range: 0, variance: 0,
        stdDev: 0, q1: 0, q3: 0, iqr: 0, min: 0, max: 0, count: 0,
        skewness: 0, kurtosis: 0, cv: 0
      });
      setOutliers([]);
      setNormalityTest({ isNormal: false, confidence: 0 });
      return;
    }

    const values = dataPoints.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Mean
    const mean = values.reduce((sum, val) => sum + val, 0) / n;

    // Median
    const median = n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)];

    // Mode
    const frequency = {};
    values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = maxFreq > 1 ? Object.keys(frequency)
      .filter(key => frequency[key] === maxFreq)
      .map(Number) : [];

    // Range
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // Variance and Standard Deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Coefficient of Variation
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // Outlier detection using IQR method
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const detectedOutliers = values.filter(val => val < lowerBound || val > upperBound);
    setOutliers(detectedOutliers);

    // Skewness (Pearson's moment coefficient)
    const skewness = values.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 3), 0) / n;

    // Kurtosis
    const kurtosis = values.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;

    // Simple normality test (based on skewness and kurtosis)
    const isNormalSkew = Math.abs(skewness) < 0.5;
    const isNormalKurt = Math.abs(kurtosis) < 1;
    const confidence = ((isNormalSkew ? 50 : 0) + (isNormalKurt ? 50 : 0));

    setNormalityTest({
      isNormal: isNormalSkew && isNormalKurt,
      confidence: confidence
    });

    setStatistics({
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      mode: mode,
      range: parseFloat(range.toFixed(2)),
      variance: parseFloat(variance.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      q1: parseFloat(q1.toFixed(2)),
      q3: parseFloat(q3.toFixed(2)),
      iqr: parseFloat(iqr.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      count: n,
      skewness: parseFloat(skewness.toFixed(3)),
      kurtosis: parseFloat(kurtosis.toFixed(3)),
      cv: parseFloat(cv.toFixed(2))
    });

    // Mark as completed after analyzing any complete dataset
    if (dataPoints.length >= 10 && !experimentCompleted) {
      markExperimentCompleted();
    }
  }, [dataPoints]);

  // Add data point
  const addDataPoint = () => {
    const value = parseFloat(currentValue);
    if (isNaN(value)) {
      alert('Please enter a valid number');
      return;
    }

    const newPoint = {
      id: Date.now(),
      value: value,
      index: dataPoints.length + 1,
      timestamp: new Date().toLocaleTimeString()
    };

    setDataPoints(prev => [...prev, newPoint]);
    setCurrentValue('');
  };

  // Load sample dataset
  const loadSampleDataset = (datasetKey) => {
    const dataset = sampleDatasets[datasetKey];
    const points = dataset.data.map((value, index) => ({
      id: Date.now() + index,
      value: value,
      index: index + 1,
      timestamp: `Point ${index + 1}`
    }));

    setDataPoints(points);
    setDatasetName(datasetKey);
  };

  // Clear all data
  const clearData = () => {
    setDataPoints([]);
    setCurrentValue('');
    setDatasetName('');
  };

  // Remove data point
  const removeDataPoint = (id) => {
    setDataPoints(prev => prev.filter(point => point.id !== id).map((point, index) => ({
      ...point,
      index: index + 1
    })));
  };

  // Print functionality
  const handlePrint = () => {
    const dataset = datasetName ? sampleDatasets[datasetName] : null;
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">Statistical Data Analysis Lab Report</h1>
          <p style="color: #666; margin: 10px 0;">Comprehensive Statistical Analysis</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Student:</strong> ${userProfile.name}</p>
          <p style="margin: 5px 0;"><strong>Class:</strong> ${userProfile.class}</p>
          <p style="margin: 5px 0;"><strong>School:</strong> ${userProfile.school}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          ${datasetName ? `<p style="margin: 5px 0;"><strong>Dataset:</strong> ${datasetName}</p>` : ''}
          ${dataset ? `<p style="margin: 5px 0;"><strong>Context:</strong> ${dataset.context}</p>` : ''}
        </div>
        
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Descriptive Statistics</h2>
        <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
          <thead style="background: #4f46e5; color: white;">
            <tr>
              <th style="padding: 12px; text-align: left;">Measure</th>
              <th style="padding: 12px; text-align: right;">Value</th>
              <th style="padding: 12px; text-align: left;">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Sample Size (n)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.count}</td>
              <td style="padding: 10px;">Number of observations</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Mean (μ)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.mean}</td>
              <td style="padding: 10px;">Average value</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Median</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.median}</td>
              <td style="padding: 10px;">Middle value (50th percentile)</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Mode</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.mode.length > 0 ? statistics.mode.join(', ') : 'No mode'}</td>
              <td style="padding: 10px;">Most frequent value(s)</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Standard Deviation (σ)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.stdDev}</td>
              <td style="padding: 10px;">Measure of spread</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Variance (σ²)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.variance}</td>
              <td style="padding: 10px;">Squared standard deviation</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Range</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.range}</td>
              <td style="padding: 10px;">Max - Min</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>IQR</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.iqr}</td>
              <td style="padding: 10px;">Interquartile Range (Q3 - Q1)</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Minimum</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.min}</td>
              <td style="padding: 10px;">Smallest value</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Maximum</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.max}</td>
              <td style="padding: 10px;">Largest value</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Q1 (25th percentile)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.q1}</td>
              <td style="padding: 10px;">First quartile</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Q3 (75th percentile)</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.q3}</td>
              <td style="padding: 10px;">Third quartile</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Skewness</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.skewness}</td>
              <td style="padding: 10px;">Asymmetry of distribution</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Kurtosis</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.kurtosis}</td>
              <td style="padding: 10px;">Tailedness of distribution</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px;"><strong>Coefficient of Variation</strong></td>
              <td style="padding: 10px; text-align: right;">${statistics.cv}%</td>
              <td style="padding: 10px;">Relative variability</td>
            </tr>
          </tbody>
        </table>
        
        ${outliers.length > 0 ? `
          <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Outlier Analysis</h2>
          <p><strong>Detected Outliers:</strong> ${outliers.join(', ')}</p>
          <p style="margin-bottom: 30px;"><strong>Number of Outliers:</strong> ${outliers.length} (${((outliers.length / statistics.count) * 100).toFixed(1)}% of data)</p>
        ` : ''}
        
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Raw Data</h2>
        <p style="line-height: 1.8;">${dataPoints.map(d => d.value).join(', ')}</p>
        
        <div style="margin-top: 40px; padding: 20px; background: #eff6ff; border-left: 4px solid #4f46e5; border-radius: 4px;">
          <h3 style="color: #4f46e5; margin-top: 0;">Interpretation Guide</h3>
          <ul style="line-height: 1.8;">
            <li><strong>Mean vs Median:</strong> If they differ significantly, the distribution may be skewed.</li>
            <li><strong>Standard Deviation:</strong> Lower values indicate data points cluster around the mean.</li>
            <li><strong>Skewness:</strong> Positive = right-skewed, Negative = left-skewed, ~0 = symmetric.</li>
            <li><strong>CV < 25%:</strong> Low variability; CV > 50%: High variability</li>
          </ul>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ['Statistical Data Analysis Report'],
      ['Generated on:', new Date().toLocaleString()],
      ['Student:', userProfile.name],
      ['Dataset:', datasetName || 'Custom'],
      [''],
      ['DESCRIPTIVE STATISTICS'],
      ['Measure', 'Value'],
      ['Sample Size', statistics.count],
      ['Mean', statistics.mean],
      ['Median', statistics.median],
      ['Mode', statistics.mode.join('; ') || 'None'],
      ['Standard Deviation', statistics.stdDev],
      ['Variance', statistics.variance],
      ['Range', statistics.range],
      ['Minimum', statistics.min],
      ['Maximum', statistics.max],
      ['Q1', statistics.q1],
      ['Q3', statistics.q3],
      ['IQR', statistics.iqr],
      ['Skewness', statistics.skewness],
      ['Kurtosis', statistics.kurtosis],
      ['Coefficient of Variation', `${statistics.cv}%`],
      [''],
      ['RAW DATA'],
      ['Index', 'Value', 'Timestamp'],
      ...dataPoints.map((data, index) => [index + 1, data.value, data.timestamp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prepare histogram data with better binning
  const getHistogramData = () => {
    if (dataPoints.length === 0) return [];
    
    const values = dataPoints.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(12, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binWidth = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0).map((_, i) => {
      const rangeStart = min + i * binWidth;
      const rangeEnd = min + (i + 1) * binWidth;
      return {
        range: `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}`,
        rangeStart: rangeStart,
        rangeEnd: rangeEnd,
        count: 0,
        midpoint: rangeStart + binWidth / 2,
        percentage: 0
      };
    });
    
    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });

    bins.forEach(bin => {
      bin.percentage = ((bin.count / values.length) * 100).toFixed(1);
    });
    
    return bins;
  };

  // Get color for bars based on frequency
  const getBarColor = (count, maxCount) => {
    const intensity = count / maxCount;
    if (intensity > 0.8) return '#4f46e5'; // Indigo
    if (intensity > 0.6) return '#6366f1'; // Blue
    if (intensity > 0.4) return '#8b5cf6'; // Purple
    if (intensity > 0.2) return '#a78bfa'; // Light purple
    return '#c4b5fd'; // Very light purple
  };

  // Get distribution shape description
  const getDistributionShape = () => {
    if (statistics.skewness > 0.5) return { shape: 'Positively Skewed (Right-tailed)', color: 'text-orange-600', description: 'Most values cluster on the left with a long tail on the right' };
    if (statistics.skewness < -0.5) return { shape: 'Negatively Skewed (Left-tailed)', color: 'text-blue-600', description: 'Most values cluster on the right with a long tail on the left' };
    return { shape: 'Approximately Symmetric', color: 'text-green-600', description: 'Data is evenly distributed around the mean' };
  };

  const distributionInfo = getDistributionShape();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-start p-4 py-8">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-[1800px] w-full border-2 border-white border-opacity-40">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm mb-2">
              {t('📊 Statistical Data Analysis Laboratory', '📊 ಸಾಂಖ್ಯಿಕ ಡೇಟಾ ವಿಶ್ಲೇಷಣಾ ಪ್ರಯೋಗಾಲಯ')}
            </h1>
            <p className="text-gray-600 text-lg font-medium">{t('Interactive Real-World Data Analysis & Visualization', 'ಸಂವಾದಾತ್ಮಕ ನೈಜ ಜಗತ್ತಿನ ಡೇಟಾ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ದೃಶ್ಯೀಕರಣ')}</p>
          </div>
          <div className="flex gap-3">
            <LanguageSwitcher />
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Printer size={20} />
              {t('Print Report', 'ವರದಿ ಮುದ್ರಿಸಿ')}
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
              disabled={dataPoints.length === 0}
            >
              <Download size={20} />
              {t('Export CSV', 'CSV ರಫ್ತು')}
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl mb-8 border-2 border-indigo-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <p className="text-gray-700 font-semibold">
                <span className="text-indigo-600">👤 Student:</span> {userProfile.name}
              </p>
              <p className="text-gray-700 font-semibold">
                <span className="text-indigo-600">🎓 Class:</span> {userProfile.class}
              </p>
              <p className="text-gray-700 font-semibold">
                <span className="text-indigo-600">🏫 School:</span> {userProfile.school}
              </p>
            </div>
            {experimentCompleted && (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold border-2 border-green-300">
                ✅ Experiment Completed
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Instructions & Data Entry */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Activity className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-blue-900">📚 Experiment Guide</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <p className="text-gray-700 font-medium">Choose a real-world dataset or create your own custom data</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <p className="text-gray-700 font-medium">Add data points and observe live statistical calculations</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <p className="text-gray-700 font-medium">Analyze patterns using multiple visualization methods</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <p className="text-gray-700 font-medium">Interpret results and understand data distribution</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                  <p className="text-gray-700 font-medium">Export your analysis for reports and presentations</p>
                </div>
              </div>
            </div>

            {/* Real-World Datasets */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <FileSpreadsheet className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-purple-900">🌍 Real-World Datasets</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(sampleDatasets).map(([key, dataset]) => (
                  <button
                    key={key}
                    onClick={() => loadSampleDataset(key)}
                    className={`w-full text-left p-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
                      datasetName === key
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-700'
                        : 'bg-white text-gray-700 border-2 border-purple-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{key}</div>
                    <div className={`text-sm ${datasetName === key ? 'text-purple-100' : 'text-gray-500'}`}>
                      {dataset.description}
                    </div>
                    <div className={`text-xs mt-1 font-semibold ${datasetName === key ? 'text-purple-200' : 'text-purple-600'}`}>
                      📌 {dataset.context} • n={dataset.data.length}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Data Entry */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-lg border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-600 rounded-xl">
                  <Calculator className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-emerald-900">➕ Add Custom Data</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDataPoint()}
                    placeholder="Enter a number..."
                    className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-xl focus:border-emerald-500 focus:outline-none text-lg font-semibold"
                  />
                  <button
                    onClick={addDataPoint}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearData}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-md"
                  >
                    <RotateCcw size={18} />
                    Clear All
                  </button>
                  <div className="flex-1 flex items-center justify-end">
                    <div className="bg-white px-5 py-2 rounded-xl border-2 border-emerald-300 font-bold text-emerald-700 shadow-sm">
                      📊 {dataPoints.length} Data Points
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Data Display */}
              <div className="mt-4 max-h-64 overflow-y-auto bg-white rounded-xl p-4 border-2 border-emerald-200">
                <h3 className="font-bold text-gray-700 mb-3 sticky top-0 bg-white pb-2">Current Data:</h3>
                {dataPoints.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 italic">No data points yet. Add values above or load a sample dataset.</p>
                ) : (
                  <div className="space-y-2">
                    {dataPoints.map((point, index) => (
                      <div key={point.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-all">
                        <span className="font-mono text-lg font-semibold">
                          <span className="text-emerald-600">#{point.index}</span>{' '}
                          <span className="text-gray-800">{point.value}</span>
                        </span>
                        <button
                          onClick={() => removeDataPoint(point.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-bold transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE & RIGHT COLUMNS: Statistics & Visualizations */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Key Statistics Dashboard */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-lg border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-xl">
                    <TrendingUp className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-indigo-900">📈 Statistical Summary</h2>
                </div>
                {dataPoints.length > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Dataset: <span className="font-bold text-indigo-600">{datasetName || 'Custom'}</span></div>
                    {datasetName && sampleDatasets[datasetName] && (
                      <div className="text-xs text-gray-500">{sampleDatasets[datasetName].context}</div>
                    )}
                  </div>
                )}
              </div>

              {dataPoints.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-500 text-lg font-medium">Load a dataset or add data points to begin analysis</p>
                </div>
              ) : (
                <>
                  {/* Central Tendency */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      Measures of Central Tendency
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-indigo-100 hover:border-indigo-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Mean (μ)</div>
                        <div className="text-3xl font-black text-indigo-600 mb-1">{statistics.mean}</div>
                        <div className="text-xs text-gray-500">Average value</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-blue-100 hover:border-blue-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Median</div>
                        <div className="text-3xl font-black text-blue-600 mb-1">{statistics.median}</div>
                        <div className="text-xs text-gray-500">Middle value</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-purple-100 hover:border-purple-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Mode</div>
                        <div className="text-3xl font-black text-purple-600 mb-1">
                          {statistics.mode.length > 0 ? (statistics.mode.length > 3 ? `${statistics.mode.length} vals` : statistics.mode.join(', ')) : 'None'}
                        </div>
                        <div className="text-xs text-gray-500">Most frequent</div>
                      </div>
                    </div>
                  </div>

                  {/* Dispersion */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-pink-600 rounded-full"></span>
                      Measures of Dispersion
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-pink-100 hover:border-pink-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Std Dev (σ)</div>
                        <div className="text-3xl font-black text-pink-600 mb-1">{statistics.stdDev}</div>
                        <div className="text-xs text-gray-500">Spread measure</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-rose-100 hover:border-rose-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Variance (σ²)</div>
                        <div className="text-3xl font-black text-rose-600 mb-1">{statistics.variance}</div>
                        <div className="text-xs text-gray-500">Squared spread</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-orange-100 hover:border-orange-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">Range</div>
                        <div className="text-3xl font-black text-orange-600 mb-1">{statistics.range}</div>
                        <div className="text-xs text-gray-500">Max - Min</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-md border-2 border-amber-100 hover:border-amber-300 transition-all">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">IQR</div>
                        <div className="text-3xl font-black text-amber-600 mb-1">{statistics.iqr}</div>
                        <div className="text-xs text-gray-500">Q3 - Q1</div>
                      </div>
                    </div>
                  </div>

                  {/* Five Number Summary & Advanced */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                        Five-Number Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-teal-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Minimum</div>
                          <div className="text-2xl font-black text-teal-600">{statistics.min}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-teal-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Q1 (25%)</div>
                          <div className="text-2xl font-black text-teal-600">{statistics.q1}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-cyan-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Median (50%)</div>
                          <div className="text-2xl font-black text-cyan-600">{statistics.median}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-sky-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Q3 (75%)</div>
                          <div className="text-2xl font-black text-sky-600">{statistics.q3}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-100 col-span-2">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Maximum</div>
                          <div className="text-2xl font-black text-blue-600">{statistics.max}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-violet-600 rounded-full"></span>
                        Advanced Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-violet-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs text-gray-600 font-semibold">Skewness</div>
                              <div className="text-2xl font-black text-violet-600">{statistics.skewness}</div>
                            </div>
                            <div className="text-right text-xs">
                              <div className={`font-bold ${distributionInfo.color}`}>{distributionInfo.shape}</div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-fuchsia-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Kurtosis</div>
                          <div className="text-2xl font-black text-fuchsia-600">{statistics.kurtosis}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {statistics.kurtosis > 0 ? 'Heavy tails' : statistics.kurtosis < 0 ? 'Light tails' : 'Normal tails'}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-100">
                          <div className="text-xs text-gray-600 mb-1 font-semibold">Coefficient of Variation</div>
                          <div className="text-2xl font-black text-purple-600">{statistics.cv}%</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {statistics.cv < 25 ? 'Low variability' : statistics.cv > 50 ? 'High variability' : 'Moderate variability'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outlier Detection */}
                  {outliers.length > 0 && (
                    <div className="mt-6 bg-red-50 border-2 border-red-200 p-5 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="text-red-600" size={24} />
                        <h3 className="text-lg font-bold text-red-900">⚠️ Outliers Detected</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-red-700 font-semibold">
                            Found {outliers.length} outlier{outliers.length > 1 ? 's' : ''} ({((outliers.length / statistics.count) * 100).toFixed(1)}% of data)
                          </p>
                          <p className="text-red-600 text-sm mt-1">Values: {outliers.join(', ')}</p>
                        </div>
                        <div className="text-xs text-red-600 bg-white p-3 rounded-lg border border-red-200">
                          <div className="font-bold mb-1">IQR Method</div>
                          <div>Outside [Q1-1.5×IQR, Q3+1.5×IQR]</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Distribution Shape Info */}
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-600 mb-1">Distribution Shape:</h3>
                        <p className={`text-xl font-black ${distributionInfo.color}`}>{distributionInfo.shape}</p>
                        <p className="text-sm text-gray-600 mt-2">{distributionInfo.description}</p>
                      </div>
                      <div className="text-right bg-white p-4 rounded-xl border-2 border-blue-200">
                        <div className="text-xs text-gray-600 font-semibold mb-1">Normality Confidence</div>
                        <div className="text-3xl font-black text-blue-600">{normalityTest.confidence}%</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {normalityTest.isNormal ? '✓ Likely Normal' : '✗ Non-normal'}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Histogram */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-indigo-600 rounded-xl">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">📊 Frequency Distribution (Histogram)</h2>
                  <p className="text-sm text-gray-600">Visualize how data is distributed across value ranges</p>
                </div>
              </div>
              <div className="h-96 w-full">
                {dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getHistogramData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="range" 
                        label={{ value: "Value Range" + (datasetName && sampleDatasets[datasetName] ? ` (${sampleDatasets[datasetName].unit})` : ''), position: "insideBottom", offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: "Frequency (Count)", angle: -90, position: "insideLeft", style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#f9fafb', border: '2px solid #4f46e5', borderRadius: '12px', padding: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#4f46e5' }}
                        formatter={(value, name, props) => [`Count: ${value} (${props.payload.percentage}%)`, '']}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {getHistogramData().map((entry, index) => {
                          const maxCount = Math.max(...getHistogramData().map(d => d.count));
                          return <Cell key={`cell-${index}`} fill={getBarColor(entry.count, maxCount)} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <BarChart3 size={64} className="mb-4 opacity-30" />
                    <p className="text-lg font-medium">Add data to see frequency distribution</p>
                  </div>
                )}
              </div>
            </div>

            {/* Data Trend Line Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-purple-600 rounded-xl">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">📈 Data Trend Analysis</h2>
                  <p className="text-sm text-gray-600">Track how values change across the dataset sequence</p>
                </div>
              </div>
              <div className="h-96 w-full">
                {dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataPoints.map((d, i) => ({ ...d, index: d.index, value: d.value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="index" 
                        label={{ value: "Data Point Index", position: "insideBottom", offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: "Value" + (datasetName && sampleDatasets[datasetName] ? ` (${sampleDatasets[datasetName].unit})` : ''), angle: -90, position: "insideLeft", style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#f9fafb', border: '2px solid #8b5cf6', borderRadius: '12px', padding: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#8b5cf6' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 'bold' }} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }} 
                        activeDot={{ r: 8 }}
                        name="Data Value" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => statistics.mean} 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        strokeDasharray="8 4" 
                        dot={false}
                        name={`Mean (${statistics.mean})`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => statistics.median} 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="4 4" 
                        dot={false}
                        name={`Median (${statistics.median})`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <TrendingUp size={64} className="mb-4 opacity-30" />
                    <p className="text-lg font-medium">Add data to see trend analysis</p>
                  </div>
                )}
              </div>
            </div>

            {/* Box Plot with Enhanced Visualization */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-teal-600 rounded-xl">
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">📦 Box Plot (Five-Number Summary)</h2>
                  <p className="text-sm text-gray-600">Visual representation of data quartiles and spread</p>
                </div>
              </div>
              {dataPoints.length >= 5 ? (
                <div className="p-8">
                  <div className="relative h-48">
                    <div className="absolute w-full h-32 top-8">
                      {/* Whiskers and Box */}
                      <div className="relative h-full flex items-center">
                        {/* Left whisker line (Min to Q1) */}
                        <div 
                          className="absolute h-0.5 bg-gray-700"
                          style={{
                            left: `${((statistics.min - statistics.min) / (statistics.max - statistics.min)) * 100}%`,
                            width: `${((statistics.q1 - statistics.min) / (statistics.max - statistics.min)) * 100}%`
                          }}
                        />
                        
                        {/* Min marker */}
                        <div 
                          className="absolute w-1 h-16 bg-gray-700"
                          style={{
                            left: `${((statistics.min - statistics.min) / (statistics.max - statistics.min)) * 100}%`
                          }}
                        />
                        
                        {/* Box (Q1 to Q3) */}
                        <div 
                          className="absolute h-full bg-gradient-to-r from-teal-300 to-cyan-300 border-4 border-teal-600 rounded-xl shadow-lg"
                          style={{
                            left: `${((statistics.q1 - statistics.min) / (statistics.max - statistics.min)) * 100}%`,
                            width: `${((statistics.q3 - statistics.q1) / (statistics.max - statistics.min)) * 100}%`
                          }}
                        >
                          {/* Median line */}
                          <div 
                            className="absolute h-full w-1 bg-red-600 shadow-md"
                            style={{
                              left: `${((statistics.median - statistics.q1) / (statistics.q3 - statistics.q1)) * 100}%`
                            }}
                          />
                        </div>
                        
                        {/* Right whisker line (Q3 to Max) */}
                        <div 
                          className="absolute h-0.5 bg-gray-700"
                          style={{
                            left: `${((statistics.q3 - statistics.min) / (statistics.max - statistics.min)) * 100}%`,
                            width: `${((statistics.max - statistics.q3) / (statistics.max - statistics.min)) * 100}%`
                          }}
                        />
                        
                        {/* Max marker */}
                        <div 
                          className="absolute w-1 h-16 bg-gray-700"
                          style={{
                            left: `${((statistics.max - statistics.min) / (statistics.max - statistics.min)) * 100}%`
                          }}
                        />
                        
                        {/* Outliers */}
                        {outliers.map((outlier, idx) => (
                          <div 
                            key={idx}
                            className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"
                            style={{
                              left: `${((outlier - statistics.min) / (statistics.max - statistics.min)) * 100}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute w-full h-full">
                      <div className="absolute text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border-2 border-gray-300 shadow" style={{ left: '0%', top: '100%', transform: 'translate(-50%, 10px)' }}>
                        Min<br/><span className="text-blue-600 text-sm">{statistics.min}</span>
                      </div>
                      <div className="absolute text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border-2 border-teal-300 shadow" style={{ left: `${((statistics.q1 - statistics.min) / (statistics.max - statistics.min)) * 100}%`, top: '100%', transform: 'translate(-50%, 10px)' }}>
                        Q1<br/><span className="text-teal-600 text-sm">{statistics.q1}</span>
                      </div>
                      <div className="absolute text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border-2 border-red-300 shadow" style={{ left: `${((statistics.median - statistics.min) / (statistics.max - statistics.min)) * 100}%`, top: '-15%', transform: 'translate(-50%, -10px)' }}>
                        Median<br/><span className="text-red-600 text-sm">{statistics.median}</span>
                      </div>
                      <div className="absolute text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border-2 border-cyan-300 shadow" style={{ left: `${((statistics.q3 - statistics.min) / (statistics.max - statistics.min)) * 100}%`, top: '100%', transform: 'translate(-50%, 10px)' }}>
                        Q3<br/><span className="text-cyan-600 text-sm">{statistics.q3}</span>
                      </div>
                      <div className="absolute text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border-2 border-gray-300 shadow" style={{ left: '100%', top: '100%', transform: 'translate(-50%, 10px)' }}>
                        Max<br/><span className="text-blue-600 text-sm">{statistics.max}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-20 flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-teal-300 to-cyan-300 border-2 border-teal-600 rounded"></div>
                      <span className="font-semibold text-gray-700">IQR (Q1-Q3): Contains 50% of data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-600 rounded"></div>
                      <span className="font-semibold text-gray-700">Median Line</span>
                    </div>
                    {outliers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
                        <span className="font-semibold text-red-700">Outliers</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Activity size={64} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">Add at least 5 data points to see box plot</p>
                </div>
              )}
            </div>

            {/* Scatter Plot with Mean/Median Lines */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 bg-pink-600 rounded-xl">
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">🔵 Scatter Plot Distribution</h2>
                  <p className="text-sm text-gray-600">Individual data points with statistical references</p>
                </div>
              </div>
              <div className="h-96 w-full">
                {dataPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="index" 
                        type="number"
                        label={{ value: "Data Point Index", position: "insideBottom", offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        dataKey="value" 
                        type="number"
                        label={{ value: "Value" + (datasetName && sampleDatasets[datasetName] ? ` (${sampleDatasets[datasetName].unit})` : ''), angle: -90, position: "insideLeft", style: { fontSize: 14, fontWeight: 'bold' } }}
                        tick={{ fontSize: 12 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#f9fafb', border: '2px solid #ec4899', borderRadius: '12px', padding: '12px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#ec4899' }}
                        formatter={(value, name) => [value, name === 'value' ? 'Value' : name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 'bold' }} />
                      <Scatter 
                        data={dataPoints} 
                        fill="#ec4899" 
                        name="Data Points"
                        shape="circle"
                      >
                        {dataPoints.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={outliers.includes(entry.value) ? '#dc2626' : '#ec4899'} 
                          />
                        ))}
                      </Scatter>
                      {/* Mean reference line */}
                      <Scatter 
                        data={[{ index: 1, value: statistics.mean }, { index: dataPoints.length, value: statistics.mean }]} 
                        fill="#ef4444" 
                        line={{ stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '8 4' }}
                        shape="none"
                        name={`Mean (${statistics.mean})`}
                      />
                      {/* Median reference line */}
                      <Scatter 
                        data={[{ index: 1, value: statistics.median }, { index: dataPoints.length, value: statistics.median }]} 
                        fill="#10b981" 
                        line={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
                        shape="none"
                        name={`Median (${statistics.median})`}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="text-6xl mb-4">⚫</div>
                    <p className="text-lg font-medium">Add data to see scatter plot</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistical Interpretation Guide */}
            {dataPoints.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-lg border-2 border-amber-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-amber-600 rounded-xl">
                    <Zap className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-900">💡 Key Insights & Interpretation</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-amber-600">📌</span> Data Distribution:
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Your dataset shows a <strong className={distributionInfo.color}>{distributionInfo.shape.toLowerCase()}</strong> distribution.
                      {Math.abs(statistics.mean - statistics.median) < statistics.stdDev * 0.1 
                        ? ' The mean and median are very close, suggesting a symmetric distribution.'
                        : ` The mean (${statistics.mean}) ${statistics.mean > statistics.median ? 'exceeds' : 'is less than'} the median (${statistics.median}), indicating ${statistics.mean > statistics.median ? 'positive (right)' : 'negative (left)'} skewness.`
                      }
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-amber-600">📊</span> Variability:
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      The standard deviation of <strong>{statistics.stdDev}</strong> indicates{' '}
                      {statistics.cv < 15 ? 'very low variability - data points cluster tightly around the mean.' :
                       statistics.cv < 25 ? 'low variability - data is relatively consistent.' :
                       statistics.cv < 50 ? 'moderate variability - expect some spread in the data.' :
                       'high variability - data points are widely dispersed.'}
                      {' '}The coefficient of variation is <strong>{statistics.cv}%</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-amber-600">🎯</span> Central Tendency:
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {statistics.mode.length === 0 
                        ? 'No mode detected - each value appears with equal frequency (uniform distribution).'
                        : statistics.mode.length === 1
                        ? `The mode is ${statistics.mode[0]}, appearing most frequently in the dataset (unimodal distribution).`
                        : `Multiple modes detected (${statistics.mode.join(', ')}), indicating a multimodal distribution with several peaks.`
                      }
                    </p>
                  </div>

                  {outliers.length > 0 && (
                    <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200 shadow">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span className="text-red-600">⚠️</span> Outlier Impact:
                      </h3>
                      <p className="text-red-700 leading-relaxed">
                        {outliers.length} outlier{outliers.length > 1 ? 's' : ''} detected ({outliers.join(', ')}). 
                        These extreme values may significantly affect the mean and standard deviation. 
                        Consider investigating these data points - they could represent measurement errors, 
                        special cases, or genuinely exceptional observations.
                      </p>
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-xl border-2 border-amber-200 shadow">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="text-amber-600">📈</span> Practical Application:
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {datasetName && sampleDatasets[datasetName] && (
                        <>In the context of <strong>{sampleDatasets[datasetName].context}</strong>: {sampleDatasets[datasetName].description}. </>
                      )}
                      Understanding these statistics helps make informed decisions, identify trends, detect anomalies, 
                      and communicate data insights effectively. The five-number summary (Min, Q1, Median, Q3, Max) 
                      provides a robust description of the data's spread and center.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;