import React from 'react';
import { Volume2, Square, Pause, Play } from 'lucide-react';

const TTSButton = ({ 
  text, 
  speak, 
  stopSpeech, 
  pauseSpeech, 
  resumeSpeech,
  isSpeaking, 
  isPaused,
  className = '',
  buttonSize = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = () => {
    if (!isSpeaking) {
      speak(text);
    } else if (isPaused) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  };

  const handleStop = (e) => {
    e.stopPropagation();
    stopSpeech();
  };

  return (
    <div className={`flex gap-1 items-center ${className}`}>
      <button
        onClick={handleClick}
        title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read Instructions'}
        className={`${sizeClasses[buttonSize]} p-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center`}
      >
        {!isSpeaking ? (
          <Volume2 size={iconSize[buttonSize]} />
        ) : isPaused ? (
          <Play size={iconSize[buttonSize]} />
        ) : (
          <Pause size={iconSize[buttonSize]} />
        )}
      </button>
      
      {isSpeaking && (
        <button
          onClick={handleStop}
          title="Stop"
          className={`${sizeClasses[buttonSize]} p-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center`}
        >
          <Square size={iconSize[buttonSize]} fill="white" />
        </button>
      )}
    </div>
  );
};

export default TTSButton;
