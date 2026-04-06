/**
 * Upload Memory Component
 * Share a family memory — with photo/video/PDF or text-only.
 * Supports year-only date for older memories where exact date is unknown.
 *
 * PATH: echon/frontend/src/components/UploadMemory.tsx
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { postsApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface UploadMemoryProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type DateMode = 'none' | 'year' | 'full';

export default function UploadMemory({ onSuccess, onCancel }: UploadMemoryProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [textOnly, setTextOnly] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    content: '',
    event_date: '',
    event_year: '',
    location: '',
    tags: '',
  });
  const [dateMode, setDateMode] = useState<DateMode>('none');

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const fileArray = Array.from(selectedFiles).filter(f =>
      f.type.startsWith('image/') ||
      f.type.startsWith('video/') ||
      f.type === 'application/pdf'
    );
    setFiles(fileArray);
    setPreviews(fileArray.map(f =>
      f.type === 'application/pdf' ? 'PDF' : URL.createObjectURL(f)
    ));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const buildEventDate = (): string | undefined => {
    if (dateMode === 'year' && formData.event_year) return formData.event_year;
    if (dateMode === 'full' && formData.event_date) return formData.event_date;
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!textOnly && files.length === 0) return;
    if (textOnly && !formData.content.trim()) {
      setError('Please write something for your text memory.');
      return;
    }

    setUploading(true);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) throw new Error('No space selected');

      let mediaUrls: string[] | undefined;
      let mediaType: string | undefined;

      if (files.length > 0) {
        const uploads = await Promise.all(
          files.map(f => {
            const mt: 'photo' | 'video' | 'audio' | 'pdf' =
              f.type.startsWith('video/') ? 'video' :
              f.type === 'application/pdf' ? 'pdf' : 'photo';
            return postsApi.uploadMedia(f, mt);
          })
        );
        mediaUrls = uploads.map(r => r.file_url);
        mediaType = files[0].type.startsWith('video/') ? 'video' :
                    files[0].type === 'application/pdf' ? 'pdf' : 'photo';
      }

      await postsApi.createPost({
        space_id: spaceId,
        content: formData.content || undefined,
        media_urls: mediaUrls,
        media_type: mediaType,
        event_date: buildEventDate(),
        location: formData.location || undefined,
        privacy_level: 'space',
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
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
        <h2 className="text-2xl font-serif text-echon-cream mb-6">Share a Memory</h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── File zone or text-only toggle ── */}
          {!textOnly ? (
            files.length === 0 ? (
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                    dragActive ? 'border-echon-candle bg-echon-candle/10' : 'border-echon-wood hover:border-echon-gold'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-5xl mb-3">📸</div>
                  <p className="text-echon-cream text-lg mb-1">Drop photos, videos, or PDFs here</p>
                  <p className="text-echon-cream-dark text-sm mb-4">or click to browse</p>
                  <button type="button" className="echon-btn-secondary"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Choose Files
                  </button>
                  <input ref={fileInputRef} type="file" multiple
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden" />
                </div>
                <button
                  type="button"
                  onClick={() => setTextOnly(true)}
                  className="mt-3 w-full text-center text-echon-cream-dark hover:text-echon-gold text-sm transition-colors"
                >
                  📝 Write a text-only memory instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-echon-shadow border border-echon-wood">
                      {preview === 'PDF' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="text-5xl mb-2">📄</div>
                          <p className="text-echon-cream text-sm">{files[idx].name}</p>
                        </div>
                      ) : (
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== idx));
                          setPreviews(previews.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="echon-btn-secondary w-full text-sm">
                  + Add More
                </button>
                <input ref={fileInputRef} type="file" multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden" />
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-echon-cream-dark text-sm">
              <span>📝 Text memory</span>
              <button type="button" onClick={() => setTextOnly(false)}
                className="text-echon-gold underline text-xs">
                Add photo instead
              </button>
            </div>
          )}

          {/* ── Caption / Text ── */}
          <div>
            <label className="block text-echon-cream text-sm mb-1">
              {textOnly ? 'Memory *' : 'Caption (Optional)'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="echon-input min-h-[100px]"
              placeholder={textOnly
                ? 'Write the story, the moment, the memory…'
                : 'Tell the story behind this memory…'}
              required={textOnly}
            />
          </div>

          {/* ── When did this happen? ── */}
          <div>
            <label className="block text-echon-cream text-sm mb-2">When did this happen?</label>
            <div className="flex gap-2 mb-2">
              {(['none', 'year', 'full'] as DateMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDateMode(mode)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    dateMode === mode
                      ? 'bg-echon-gold text-echon-black'
                      : 'bg-echon-shadow border border-echon-wood text-echon-cream-dark hover:border-echon-gold'
                  }`}
                >
                  {mode === 'none' ? "Don't know" : mode === 'year' ? 'Year only' : 'Exact date'}
                </button>
              ))}
            </div>
            {dateMode === 'year' && (
              <input
                type="number"
                value={formData.event_year}
                onChange={(e) => setFormData({ ...formData, event_year: e.target.value })}
                className="echon-input"
                placeholder="e.g. 1965"
                min="1800"
                max={new Date().getFullYear()}
              />
            )}
            {dateMode === 'full' && (
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="echon-input"
                max={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          {/* ── Location & Tags ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-echon-cream text-sm mb-1">Where was this?</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="echon-input"
                placeholder="Shkodra, Albania"
              />
            </div>
            <div>
              <label className="block text-echon-cream text-sm mb-1">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="echon-input"
                placeholder="wedding, 1995"
              />
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onCancel} className="echon-btn-secondary flex-1" disabled={uploading}>
              Cancel
            </button>
            <button
              type="submit"
              className="echon-btn flex-1"
              disabled={(!textOnly && files.length === 0) || uploading}
            >
              {uploading ? 'Uploading…' : 'Share Memory'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
