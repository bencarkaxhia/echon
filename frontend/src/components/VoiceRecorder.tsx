/**
 * Voice Recorder Component
 * Record audio directly in browser using MediaRecorder API
 * 
 * PATH: echon/frontend/src/components/VoiceRecorder.tsx
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { storiesApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface VoiceRecorderProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSuccess, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    story_date: '',
    location: '',
    tags: '',
  });

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file');
      return;
    }

    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBlob) return;

    setUploading(true);

    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) throw new Error('No space selected');

      // Convert blob to file
      const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

      // Upload audio
      const uploadResult = await storiesApi.uploadAudio(audioFile);

      // Create story
      await storiesApi.createStory({
        space_id: spaceId,
        title: formData.title,
        description: formData.description || undefined,
        audio_url: uploadResult.file_url,
        duration: duration > 0 ? duration : undefined,
        story_date: formData.story_date || undefined,
        location: formData.location || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.detail || 'Failed to save story');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="echon-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-serif text-echon-cream mb-6">
          🎙️ Record a Story
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recorder */}
          {!audioUrl ? (
            <div className="text-center space-y-6">
              {/* Recording Button */}
              <div className="flex flex-col items-center gap-4">
                {recording ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-32 h-32 rounded-full bg-echon-candle flex items-center justify-center cursor-pointer"
                      onClick={stopRecording}
                    >
                      <div className="w-12 h-12 bg-white rounded"></div>
                    </motion.div>
                    <p className="text-echon-cream text-2xl font-mono">
                      {formatTime(duration)}
                    </p>
                    <p className="text-echon-cream-dark">
                      Click to stop recording
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      className="w-32 h-32 rounded-full bg-echon-candle hover:bg-echon-gold flex items-center justify-center cursor-pointer transition-colors"
                      onClick={startRecording}
                    >
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <p className="text-echon-cream">
                      Click to start recording
                    </p>
                  </>
                )}
              </div>

              {/* OR Upload */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-echon-wood"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-echon-black text-echon-cream-dark">or</span>
                </div>
              </div>

              <div>
                <label className="echon-btn-secondary cursor-pointer inline-block">
                  📎 Upload Audio File
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-echon-cream-dark text-sm mt-2">
                  MP3, WAV, OGG, M4A
                </p>
              </div>
            </div>
          ) : (
            /* Audio Preview */
            <div className="space-y-4">
              <audio
                src={audioUrl}
                controls
                className="w-full"
              />
              <button
                type="button"
                onClick={() => {
                  setAudioUrl(null);
                  setAudioBlob(null);
                  setDuration(0);
                }}
                className="echon-btn-secondary w-full"
              >
                🔄 Record Again
              </button>
            </div>
          )}

          {/* Form (only show if audio is ready) */}
          {audioUrl && (
            <>
              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Story Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="echon-input"
                  placeholder="Grandma's Wedding Day"
                />
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="echon-input min-h-[100px]"
                  placeholder="What is this story about?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-echon-cream text-sm mb-2">
                    When did this happen?
                  </label>
                  <input
                    type="date"
                    value={formData.story_date}
                    onChange={(e) => setFormData({ ...formData, story_date: e.target.value })}
                    className="echon-input"
                  />
                </div>

                <div>
                  <label className="block text-echon-cream text-sm mb-2">
                    Where?
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="echon-input"
                    placeholder="Shkodra, Albania"
                  />
                </div>
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="echon-input"
                  placeholder="wedding, 1950s, grandma"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="echon-btn-secondary flex-1"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="echon-btn flex-1"
              disabled={!audioUrl || uploading}
            >
              {uploading ? 'Saving...' : 'Save Story'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}