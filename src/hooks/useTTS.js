import { useState, useCallback, useRef, useEffect } from 'react';

const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synth = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // Stop current speech
  const stopSpeech = useCallback(() => {
    synth.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Speak text
  const speak = useCallback((text, lang = 'en-US') => {
    // Stop any ongoing speech
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    synth.current.speak(utterance);
  }, []);

  // Pause speech
  const pauseSpeech = useCallback(() => {
    if (isSpeaking && !isPaused) {
      synth.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  // Resume speech
  const resumeSpeech = useCallback(() => {
    if (isPaused) {
      synth.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      synth.current.cancel();
    };
  }, []);

  return {
    speak,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    isSpeaking,
    isPaused,
  };
};

export default useTTS;
