import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useVoiceInput from '../../hooks/useVoiceInput';
import api from '../../services/api';

interface VoiceProfileInputProps {
  onProfileExtracted: (data: Record<string, any>) => void;
  onSwitchToForm: () => void;
}

const VoiceProfileInput: React.FC<VoiceProfileInputProps> = ({
  onProfileExtracted,
  onSwitchToForm,
}) => {
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);

  const {
    isListening,
    transcript,
    interimText,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: voiceError,
  } = useVoiceInput({
    language,
    continuous: true,
    interimResults: true,
  });

  // ── Parse voice text using AI ──
  const handleParseVoice = async () => {
    if (!transcript.trim()) {
      toast.error('Please speak something first');
      return;
    }

    setParsing(true);
    try {
      const { data } = await api.post('/voice/parse-profile', {
        voiceText: transcript,
        language: language === 'hi-IN' ? 'hi' : 'en',
      });

      if (data.success && data.extractedData) {
        setExtractedData(data.extractedData);
        toast.success(`Extracted ${data.totalFieldsExtracted} fields!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to parse voice');
    } finally {
      setParsing(false);
    }
  };

  // ── Confirm extracted data ──
  const handleConfirm = () => {
    if (extractedData) {
      onProfileExtracted(extractedData);
      toast.success('Profile data applied! Review and save.');
    }
  };

  // ── Not supported fallback ──
  if (!isSupported) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎤</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Voice input not supported
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Your browser doesn't support voice input. Please use Chrome or Edge.
        </p>
        <button
          onClick={onSwitchToForm}
          className="px-6 py-2 bg-green-600 text-white rounded-lg
                   hover:bg-green-700 transition-colors"
        >
          📝 Fill Form Instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Language Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setLanguage('hi-IN')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${language === 'hi-IN'
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
        >
          🇮🇳 हिंदी
        </button>
        <button
          onClick={() => setLanguage('en-IN')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${language === 'en-IN'
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
        >
          🇬🇧 English
        </button>
      </div>

      {/* Microphone Button */}
      <div className="flex flex-col items-center">
        <motion.button
          onClick={isListening ? stopListening : startListening}
          whileTap={{ scale: 0.95 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center
                    text-4xl transition-all duration-300 shadow-lg
                    ${isListening
                      ? 'bg-red-500 text-white shadow-red-200 animate-pulse'
                      : 'bg-green-500 text-white shadow-green-200 hover:bg-green-600'
                    }`}
        >
          {isListening ? '⏹️' : '🎤'}
        </motion.button>

        <p className="mt-3 text-sm text-gray-500">
          {isListening
            ? '🔴 Listening... Tap to stop'
            : '🎤 Tap to start speaking'}
        </p>

        {/* Hint */}
        {!transcript && !isListening && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 max-w-sm text-center">
            💡 {language === 'hi-IN'
              ? 'बोलें: "मेरा नाम रामेश है, मध्य प्रदेश के सागर से हूँ, 3 एकड़ ज़मीन है, गेहूँ उगाता हूँ, OBC कैटेगरी..."'
              : 'Say: "My name is Ramesh, from Sagar, Madhya Pradesh, I have 3 acres, I grow wheat, OBC category..."'}
          </div>
        )}
      </div>

      {/* Live Transcript */}
      <AnimatePresence>
        {(transcript || interimText) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                📝 What you said:
              </span>
              <button
                onClick={resetTranscript}
                className="text-xs text-red-500 hover:text-red-600"
              >
                🗑️ Clear
              </button>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              {transcript}
              {interimText && (
                <span className="text-gray-400 italic"> {interimText}...</span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Error */}
      {voiceError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ❌ {voiceError}
        </div>
      )}

      {/* Action Buttons */}
      {transcript && !extractedData && (
        <div className="flex gap-3">
          <button
            onClick={handleParseVoice}
            disabled={parsing}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium
                     hover:bg-green-700 transition-colors disabled:opacity-50
                     flex items-center justify-center gap-2"
          >
            {parsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
                Extracting...
              </>
            ) : (
              '🤖 Extract Profile Data'
            )}
          </button>
          <button
            onClick={() => { resetTranscript(); setExtractedData(null); }}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg
                     hover:bg-gray-200 transition-colors"
          >
            🔄 Redo
          </button>
        </div>
      )}

      {/* Extracted Data Preview */}
      <AnimatePresence>
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-xl p-5 border border-green-200"
          >
            <h4 className="text-sm font-semibold text-green-800 mb-3">
              ✅ Extracted Profile Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(extractedData).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                return (
                  <div key={key} className="text-xs">
                    <span className="text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="ml-1 font-medium text-gray-800">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm
                         font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Use This Data
              </button>
              <button
                onClick={() => { setExtractedData(null); resetTranscript(); }}
                className="px-4 py-2 bg-white text-gray-600 rounded-lg text-sm
                         border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                🔄 Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch to form */}
      <button
        onClick={onSwitchToForm}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700
                 transition-colors"
      >
        📝 Fill form manually instead
      </button>
    </div>
  );
};

export default VoiceProfileInput;