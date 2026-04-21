import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import useTTS from '../hooks/useTTS';

const ThalesClassTeacherAI = () => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { speak, stopSpeech, isSpeaking } = useTTS();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('physics');
  const messagesEndRef = useRef(null);

  // Physics and Chemistry theory content
  const theoryContent = {
    physics: [
      {
        id: 'ohms-law',
        title: "Ohm's Law",
        theory: "Ohm's Law states that the current flowing through a conductor is directly proportional to the voltage applied across it and inversely proportional to its resistance. Formula: V = I × R, where V is voltage (volts), I is current (amperes), and R is resistance (ohms)."
      },
      {
        id: 'magnetic-hysteresis',
        title: 'Magnetic Hysteresis',
        theory: 'Magnetic hysteresis is the tendency of a ferromagnetic material to remain magnetized even after the applied magnetic field is removed. The hysteresis loop shows the relationship between magnetic field strength (H) and magnetic flux density (B). It demonstrates energy loss during magnetization cycles.'
      },
      {
        id: 'wind-gust-control',
        title: 'Wind Gust Control in Aircraft',
        theory: 'Wind gust control refers to the aircraft control surfaces and systems that manage sudden changes in wind direction and speed. Ailerons, elevators, and rudders work together to maintain aircraft stability during atmospheric disturbances. Modern aircraft use automated systems to compensate for wind gusts.'
      },
      {
        id: 'thrust-altitude',
        title: 'Thrust and Altitude Relations',
        theory: 'Thrust is the force produced by aircraft engines to propel the aircraft forward. As altitude increases, air density decreases, which reduces engine thrust. This relationship is critical for flight planning and performance calculations. Specific thrust decreases with increasing altitude in conventional piston and jet engines.'
      },
      {
        id: 'weight-balance',
        title: 'Weight and Balance in Aircraft',
        theory: 'Weight and balance refer to the aircraft\'s total mass and the distribution of that mass. The center of gravity must remain within specified limits for safe flight. Improper weight distribution can cause instability, difficulty in control, and potential structural failure.'
      },
      {
        id: 'stall-recovery',
        title: 'Stall and Recovery Techniques',
        theory: 'An aerodynamic stall occurs when airflow over the wings becomes separated, causing a sudden loss of lift. Stall recovery involves lowering the nose of the aircraft to increase airspeed, reduce the angle of attack below the stall angle, and regain control. Recovery must be done promptly.'
      },
      {
        id: 'avionics-failure',
        title: 'Avionics System Failures',
        theory: 'Avionics are electronic systems in aircraft used for navigation, communication, and flight control. Failures can range from simple instrument failures to critical autopilot malfunctions. Modern aircraft have redundant systems to ensure safety even when one system fails.'
      }
    ],
    chemistry: [
      {
        id: 'acid-base-titration',
        title: 'Acid-Base Titration',
        theory: 'Acid-base titration is an analytical technique used to determine the concentration of an unknown acid or base by reacting it with a known concentration of base or acid. The equivalence point is reached when moles of acid equal moles of base. Indicators like phenolphthalein are used to detect the endpoint.'
      },
      {
        id: 'crystallization',
        title: 'Crystallization Process',
        theory: 'Crystallization is a separation process where dissolved solute forms solid crystals. It occurs when a solution becomes supersaturated, meaning it contains more dissolved solute than it can normally hold. Temperature, concentration, and impurities affect crystal formation. Common applications include sugar purification and salt extraction.'
      },
      {
        id: 'photosynthesis',
        title: 'Photosynthesis and Energy Transfer',
        theory: 'Photosynthesis is the process by which plants convert light energy into chemical energy. The light-dependent reactions occur in the thylakoid membranes, while the light-independent reactions (Calvin cycle) occur in the stroma. The overall equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂.'
      }
    ]
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on load
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      sender: 'ai',
      text: `Welcome to Thales Class Teacher AI! 👋 I'm here to help you understand Physics and Chemistry concepts. Ask me anything about the experiments or theory!`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Process user input and generate AI response
    const response = generateAIResponse(inputValue.toLowerCase(), selectedSubject);
    
    // Add AI response after a short delay
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);

    setInputValue('');
  };

  const generateAIResponse = (userInput, subject) => {
    const content = theoryContent[subject] || theoryContent.physics;

    // Check for specific theory requests
    for (const theory of content) {
      if (userInput.includes(theory.id.replace('-', ' ')) || 
          userInput.includes(theory.title.toLowerCase())) {
        return `📚 **${theory.title}**\n\n${theory.theory}`;
      }
    }

    // Check for general help requests
    if (userInput.includes('help') || userInput.includes('what can you')) {
      const topicsList = content.map(t => `• ${t.title}`).join('\n');
      return `I can help you with the following topics in ${subject}:\n\n${topicsList}\n\nJust ask about any topic!`;
    }

    // Check for list all
    if (userInput.includes('list') || userInput.includes('all topics') || userInput.includes('show all')) {
      const topicsList = content.map(t => `• ${t.title}`).join('\n');
      return `Here are all ${subject} topics I can teach:\n\n${topicsList}`;
    }

    // Default response
    return `I'd be happy to help! Could you please specify which topic you'd like to learn about? Type "list" to see all available topics in ${subject}, or ask about specific experiments like "${content[0].title.toLowerCase()}".`;
  };

  const handleSpeakMessage = (text) => {
    // Remove markdown formatting for TTS
    const cleanText = text.replace(/\*\*/g, '').replace(/\*\*/g, '');
    speak(cleanText, 'en-US');
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    const content = theoryContent[subject];
    const topicsList = content.map(t => `• ${t.title}`).join('\n');
    const welcomeMsg = {
      id: Date.now(),
      sender: 'ai',
      text: `Switched to ${subject}! Here are the topics I can teach you:\n\n${topicsList}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, welcomeMsg]);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl">
                  🎓
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Thales Class Teacher AI
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">Your Personal Learning Assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Subject Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Subjects</h3>
              <div className="space-y-3">
                {['physics', 'chemistry'].map(subject => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectChange(subject)}
                    className={`w-full p-3 rounded-lg font-medium transition-all ${
                      selectedSubject === subject
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject === 'physics' ? '⚡ Physics' : '🧪 Chemistry'}
                  </button>
                ))}
              </div>

              {/* Quick Questions */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-800 mb-3">⚡ Quick Questions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickQuestion('List all topics')}
                    className="w-full text-left p-3 text-sm bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors"
                  >
                    List all topics
                  </button>
                  <button
                    onClick={() => handleQuickQuestion('Help')}
                    className="w-full text-left p-3 text-sm bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg transition-colors"
                  >
                    What can you help with?
                  </button>
                </div>
              </div>

              {/* Offline TTS Indicator */}
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔊</span>
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Offline TTS</p>
                    <p className="text-xs text-green-700">Click speaker icon to hear</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[70vh] sm:h-[75vh]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-lg whitespace-pre-wrap break-words ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm sm:text-base">{message.text}</p>
                      {message.sender === 'ai' && (
                        <button
                          onClick={() => handleSpeakMessage(message.text)}
                          className={`mt-2 text-xs font-medium py-1 px-2 rounded ${
                            isSpeaking
                              ? 'bg-red-500 text-white'
                              : 'bg-white/20 hover:bg-white/30 text-white'
                          }`}
                        >
                          {isSpeaking ? '⏹ Stop' : '🔊 Speak'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about physics or chemistry..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
                  >
                    📤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThalesClassTeacherAI;
