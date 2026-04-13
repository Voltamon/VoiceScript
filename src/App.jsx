import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Download } from 'lucide-react';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const lastProcessedIndexRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setStatus('Listening...');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setStatus('Ready');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsRecording(false);
      setStatus('Error');
    };

    recognition.onresult = (event) => {
      let newFinalText = '';
      for (let i = lastProcessedIndexRef.current; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalText += event.results[i][0].transcript;
          lastProcessedIndexRef.current = i + 1;
        }
      }

      if (newFinalText) {
        setTranscript((prev) => {
          const current = prev.trim();
          return (current ? current + ' ' : '') + newFinalText.trim();
        });
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      lastProcessedIndexRef.current = 0;
      recognitionRef.current?.start();
    }
  };

  const clearTranscript = () => {
    if (window.confirm('Clear transcript?')) {
      setTranscript('');
    }
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-script-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <header>
        <h1>VoiceScript</h1>
        <p className="subtitle">Convert your spoken English to text instantly.</p>
      </header>

      <main className="glass-card">
        <div className="control-panel">
          <div className="status-indicator">
            <div className={`status-dot ${isRecording ? 'active' : ''}`} 
                 style={{ backgroundColor: error ? 'var(--danger)' : (isRecording ? 'var(--accent)' : 'var(--text-muted)') }}></div>
            <span>{error || status}</span>
          </div>

          <div className="main-controls">
            <button onClick={clearTranscript} className="btn-secondary" title="Clear">
              <Trash2 size={20} /> Clear
            </button>
            <button 
              onClick={toggleRecording} 
              className={`btn-primary ${isRecording ? 'recording' : ''}`}
              disabled={!!error && !isRecording}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button onClick={downloadTranscript} className="btn-download btn-primary" disabled={!transcript}>
              <Download size={20} /> Download .txt
            </button>
          </div>
        </div>

        <div className="textarea-container">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcription will appear here..."
          />
        </div>
      </main>

      <footer>
        <p>&copy; 2026 VoiceScript. Built with React & Vite. Only local components.</p>
      </footer>
    </div>
  );
};

export default App;
