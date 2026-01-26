/**
 * Upload Memory Component
 * Drag & drop photo upload with memory creation form
 * 
 * PATH: echon/frontend/src/components/UploadMemory.tsx
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface UploadMemoryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UploadMemory({ onSuccess, onCancel }: UploadMemoryProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    content: '',
    event_date: '',
    location: '',
    tags: '',
  });

  // Handle file selection
  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

    setFiles(validFiles);

    // Create previews
    const previewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  // Upload and create post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);

    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) throw new Error('No space selected');

      // Upload files
      const uploadPromises = files.map(file => 
        postsApi.uploadMedia(file, file.type.startsWith('image/') ? 'photo' : 'video')
      );
      const uploadResults = await Promise.all(uploadPromises);

      // Create post
      await postsApi.createPost({
        space_id: spaceId,
        content: formData.content || undefined,
        media_urls: uploadResults.map(r => r.file_url),
        media_type: files[0].type.startsWith('image/') ? 'photo' : 'video',
        event_date: formData.event_date || undefined,
        location: formData.location || undefined,
        privacy_level: 'space',
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      });

      // Success!
      onSuccess();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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
          Share a Memory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          {files.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-echon-candle bg-echon-candle/10'
                  : 'border-echon-wood hover:border-echon-gold'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-6xl mb-4">📸</div>
              <p className="text-echon-cream text-lg mb-2">
                Drop photos or videos here
              </p>
              <p className="text-echon-cream-dark text-sm mb-4">
                or click to browse
              </p>
              <button
                type="button"
                className="echon-btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview Grid */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFiles(files.filter((_, i) => i !== idx));
                        setPreviews(previews.filter((_, i) => i !== idx));
                      }}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="echon-btn-secondary w-full"
              >
                Add More Photos
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-echon-cream text-sm mb-2">
              Caption (Optional)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="echon-input min-h-[100px]"
              placeholder="Tell the story behind this memory..."
            />
          </div>

          {/* Event Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-echon-cream text-sm mb-2">
                When did this happen?
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="echon-input"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-echon-cream text-sm mb-2">
                Where was this?
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

          {/* Tags */}
          <div>
            <label className="block text-echon-cream text-sm mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="echon-input"
              placeholder="wedding, albania, 1995"
            />
          </div>

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
              disabled={files.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : 'Share Memory'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}