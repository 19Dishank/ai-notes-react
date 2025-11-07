import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, X, Loader2 } from 'lucide-react';
import { rewriteNote } from '../utils/aiService';

const PREDEFINED_OPTIONS = [
  'Make it more formal',
  'Make it more casual',
  'Simplify the language',
  'Expand with more details',
  'Format as bullet points',
  'Convert to paragraphs',
  'Fix grammar and spelling',
  'Make it more concise',
  'Add professional tone',
  'Make it more engaging',
];

const RewriteForm = ({ note, onSave, onCancel }) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [instructionInput, setInstructionInput] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (note) {
      setSelectedSuggestions([]);
      setInstructionInput('');
      setError('');
    }
  }, [note]);

  const handleSelectOption = (option) => {
    let updatedSuggestions;
    
    if (selectedSuggestions.includes(option)) {
      // Remove if already selected
      updatedSuggestions = selectedSuggestions.filter(s => s !== option);
    } else {
      // Add if not selected
      updatedSuggestions = [...selectedSuggestions, option];
    }
    
    setSelectedSuggestions(updatedSuggestions);
    // Update input field with comma-separated suggestions
    setInstructionInput(updatedSuggestions.join(', '));
    setError('');
  };

  const handleManualInput = (value) => {
    setInstructionInput(value);
    // Parse comma-separated values from manual input to update selected suggestions
    const parsed = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    // Only update selectedSuggestions if the parsed values match predefined options
    const matchingSuggestions = parsed.filter(p => PREDEFINED_OPTIONS.includes(p));
    setSelectedSuggestions(matchingSuggestions);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get final instruction from input (which contains selected suggestions)
    const finalInstruction = instructionInput.trim();
    
    if (!finalInstruction.trim()) {
      setError('Please enter or select at least one rewrite suggestion');
      return;
    }

    setIsRewriting(true);
    setError('');

    try {
      // Combine all selected suggestions into a single instruction
      // If user has selected suggestions, use them; otherwise use manual input
      const combinedInstruction = selectedSuggestions.length > 0
        ? `Apply the following rewrite instructions: ${selectedSuggestions.join(', ')}`
        : finalInstruction;
      
      const rewrittenContent = await rewriteNote(note.content, combinedInstruction);
      onSave(rewrittenContent);
    } catch (err) {
      setError(err.message || 'Failed to rewrite note. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Rewrite with AI
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {note?.title}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Instruction Input */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rewrite instructions (comma-separated)
            </label>
          </div>
          <input
            type="text"
            value={instructionInput}
            onChange={(e) => handleManualInput(e.target.value)}
            placeholder="e.g., Make it more professional, Add more details, Simplify..."
            disabled={isRewriting}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            autoFocus
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Predefined Options */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mt-2">
            {PREDEFINED_OPTIONS.map((option) => {
              const isSelected = selectedSuggestions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isRewriting}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  + {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Original Note Content Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Original Note Content:
          </label>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {note?.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            type="submit"
            disabled={isRewriting || (!instructionInput.trim() && selectedSuggestions.length === 0)}
            whileHover={!isRewriting ? { scale: 1.02 } : {}}
            whileTap={!isRewriting ? { scale: 0.98 } : {}}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {isRewriting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Rewrite Note
              </>
            )}
          </motion.button>
          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isRewriting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <X className="w-4 h-4" />
              Cancel
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default RewriteForm;

