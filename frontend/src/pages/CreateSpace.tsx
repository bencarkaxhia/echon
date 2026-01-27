/**
 * Echon Create Family Space Page
 * User creates their family space after registration
 * 
 * PATH: echon/frontend/src/pages/CreateSpace.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { spaceApi } from '../lib/api';
import { setCurrentSpace } from '../lib/auth';

export default function CreateSpace() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    secondary_name: '',
    origin_location: '',
    origin_cities: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await spaceApi.createSpace({
        name: formData.name,
        secondary_name: formData.secondary_name || undefined,
        origin_location: formData.origin_location || undefined,
        origin_cities: formData.origin_cities || undefined,
      });

      // Save current space
      setCurrentSpace(response.id);

      // Redirect to space entrance
      navigate('/space');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create space. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.name) {
      setError('Please enter your family name');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-echon-black flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-echon-root-light opacity-10 rounded-full blur-3xl animate-glow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="echon-card">
          {/* Close/Cancel Button */}
          <button
            onClick={() => navigate('/select-space')}
            className="absolute top-4 right-4 text-echon-cream-dark hover:text-echon-cream transition-colors text-2xl"
            title="Cancel"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-echon-shadow border-2 border-echon-gold flex items-center justify-center">
                <span className="text-3xl">🏠</span>
              </div>
            </motion.div>
            
            <h1 className="text-3xl font-serif text-echon-cream mb-2">
              Create Your Family Space
            </h1>
            <p className="text-echon-cream-dark text-sm">
              Step {step} of 2
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Family Name */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-echon-cream text-lg mb-3 font-semibold">
                    What is your family name? *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="echon-input text-xl"
                    placeholder="Çarkaxhia"
                    autoFocus
                  />
                  <p className="text-echon-cream-dark text-sm mt-2">
                    This creates "The {formData.name || '[Your Name]'} Space"
                  </p>
                </div>

                <div>
                  <label className="block text-echon-cream text-sm mb-2">
                    Do you also use another surname? (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_name}
                    onChange={(e) => setFormData({ ...formData, secondary_name: e.target.value })}
                    className="echon-input"
                    placeholder="Through marriage or maternal line (e.g., Çulaj)"
                  />
                  <p className="text-echon-cream-dark text-xs mt-2">
                    💡 Both family lines will be honored equally in your space
                  </p>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => navigate('/select-space')}
                    className="echon-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="echon-btn flex-1"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Origin */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-echon-cream text-lg mb-3 font-semibold">
                    Where does your family come from? (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.origin_location}
                    onChange={(e) => setFormData({ ...formData, origin_location: e.target.value })}
                    className="echon-input"
                    placeholder="Albania, Kosovo"
                  />
                  <p className="text-echon-cream-dark text-sm mt-2">
                    Countries or regions
                  </p>
                </div>

                <div>
                  <label className="block text-echon-cream text-sm mb-2">
                    Specific cities or villages? (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.origin_cities}
                    onChange={(e) => setFormData({ ...formData, origin_cities: e.target.value })}
                    className="echon-input"
                    placeholder="Shkodra, Gjakova, Prishtina"
                  />
                  <p className="text-echon-cream-dark text-xs mt-2">
                    💡 You can add more details later
                  </p>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="echon-btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="echon-btn flex-1"
                  >
                    {loading ? 'Creating Space...' : 'Create Space'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-echon-candle' : 'bg-echon-wood'}`} />
            <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-echon-candle' : 'bg-echon-wood'}`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}