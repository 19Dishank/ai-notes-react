import React from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';

const TagFilter = ({ selectedTag, onTagSelect, notes }) => {
  // Get all unique tags from notes
  const allTags = React.useMemo(() => {
    const tagSet = new Set();
    notes.forEach((note) => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  if (allTags.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Tag
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTagSelect(null)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors touch-manipulation ${
            selectedTag === null
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All
        </motion.button>
        {allTags.map((tag) => (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTagSelect(tag)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors touch-manipulation ${
              selectedTag === tag
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tag}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default TagFilter;

