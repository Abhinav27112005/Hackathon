

//Custom hooks useVoiceInput
//Wraps the browser's web speech api (speech Recognition) into clean and reusable react hook.

import { useCallback, useEffect, useRef, useState } from "react";

interface useVoiceInputOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
}

interface useVoiceInputReturn {
    isListening: boolean;
    transcript: string;
    interimText: string;
    isSupported: boolean;
    startListening: () => void; //Start recording
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
}

const useVoiceInput = (options: useVoiceInputOptions = {}): useVoiceInputReturn => {
    const {
        language = 'hi-IN',
        continuous = true,
        interimResults = true,//show text as user speaks
        onResult,
        onError,
    } = options;

    //State
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [error, setError] = useState<string | null>(null);


    const recognitionRef = useRef<any>(null);

    const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    //Initialize speech Recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();

        recognition.lang = language;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let finalText = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;
                if (result.isFinal) {
                    finalText += text + ' ';
                } else {
                    interim += text;
                }
            }
            if (finalText) {
                setTranscript((prev) => (prev + finalText).trim());
                onResult?.(finalText.trim());
            }
            setInterimText(interim);
        };

        recognition.onerror = (event: any) => {
            let errorMessage = 'Voice recognition error';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow microphone permission.';
                    break;
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please connect a microphone';
                    break;
                case 'network':
                    errorMessage = "Network error. Please check your internet connection";
                    break;
                case 'aborted':
                    errorMessage = 'Voice input was cancelled';
                    break;
                default:
                    errorMessage = `Voice error: ${event.error}`;
                    break;
            }
            setError(errorMessage);
            setIsListening(false);
            onError?.(errorMessage);

        };
        //Event onEnd
        //Fired when recognition stops (manually or timeout)

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        //Save reference
        recognitionRef.current = recognition;

        //cleanup or unmount
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    //Already stopped
                }
            }
        };
    }, [language, continuous, interimResults, isSupported]);
    //Start Listening

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Voice input is not supported in this browser. Try chrome');
            return;
        }
        if (!recognitionRef.current) return;

        setError(null);
        setInterimText('');

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (error: any) {

            try {
                recognitionRef.current.stop();
                setTimeout(() => {
                    recognitionRef.current?.start();
                    setIsListening(true);
                }, 100);
            } catch {
                setError('Failed to start voice Input');
            }
        }
    }, [isSupported]);

    //Stop Listening

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                //Already stopped
            }
        }
        setIsListening(false);
        setInterimText('');
    }, []);

    //Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimText('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        interimText,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
    };
};

export default useVoiceInput;




