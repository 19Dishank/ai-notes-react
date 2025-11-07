import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Tag, Palette } from 'lucide-react';
import { NOTE_COLORS } from '../constants/noteColors';

const NoteForm = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('default');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags ? note.tags.join(', ') : '');
      setColor(note.color || 'default');
    } else {
      setColor('default');
    }
  }, [note]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return;
    }

    const tagsArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSave({
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
      color,
    });

    // Reset form if creating new note
    if (!note) {
      setTitle('');
      setContent('');
      setTags('');
      setColor('default');
    }
  };

  const predefinedTags = ['Work', 'Personal', 'Study', 'Ideas', 'Shopping', 'Reminders'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none text-sm sm:text-base"
            required
          />
        </div>

        <div className="mb-4">
          <textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="8"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none resize-none text-sm sm:text-base"
            required
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags (comma-separated)
            </label>
          </div>
          <input
            type="text"
            placeholder="Work, Personal, Study..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none text-sm sm:text-base"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {predefinedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentTags = tags ? tags.split(',').map((t) => t.trim()) : [];
                  if (!currentTags.includes(tag)) {
                    setTags([...currentTags, tag].join(', '));
                  }
                }}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Note color
            </label>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Choose a color that stands out in both themes
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {NOTE_COLORS.map((option) => {
              const isActive = color === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setColor(option.id)}
                  className="group flex flex-col items-center gap-2 focus:outline-none"
                  aria-pressed={isActive}
                  aria-label={`${option.label} note color`}
                >
                  <span
                    className={`w-10 h-10 rounded-full transition-all duration-200 shadow-sm ${
                      option.swatchClass
                    } ${
                      isActive
                        ? `ring-4 ${option.ringClass} scale-105`
                        : 'ring-0 hover:scale-105'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-gray-800 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium touch-manipulation"
          >
            <Save className="w-4 h-4" />
            {note ? 'Update Note' : 'Save Note'}
          </motion.button>
          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm sm:text-base bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium touch-manipulation"
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

export default NoteForm;

