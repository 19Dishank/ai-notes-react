import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2, Sparkles, Copy, Check, Calendar, X, Lock, Unlock, Wand2 } from 'lucide-react';
import { summarizeNote } from '../utils/aiService';
import PasswordModal from './PasswordModal';
import { hasPIN } from '../utils/storage';
import { NOTE_COLOR_MAP } from '../constants/noteColors';

const NoteCard = ({ note, onEdit, onDelete, onLock, onUnlock, onRewrite }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState('lock'); // 'lock' or 'unlock'
  const cardRef = useRef(null);
  const summaryButtonRef = useRef(null);

  const isLocked = note.locked === true;
  const noteColor = note?.color || 'default';
  const colorOption = NOTE_COLOR_MAP[noteColor] || NOTE_COLOR_MAP.default;
  const cardColorClass = colorOption?.cardClass || NOTE_COLOR_MAP.default.cardClass;

  // Close summary if note becomes locked
  useEffect(() => {
    if (isLocked && showSummary) {
      setShowSummary(false);
      setSummary('');
    }
  }, [isLocked, showSummary]);

  // Prevent background scrolling when summary is open
  useEffect(() => {
    if (showSummary) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showSummary]);

  const handleLock = () => {
    // Check if PIN exists - if not, show set PIN modal first
    if (hasPIN()) {
      setPasswordMode('lock');
    } else {
      setPasswordMode('setPin');
    }
    setShowPasswordModal(true);
  };

  const handleUnlock = () => {
    setPasswordMode('unlock');
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = () => {
    if (passwordMode === 'lock' || passwordMode === 'setPin') {
      onLock(note.id);
    } else if (passwordMode === 'unlock') {
      onUnlock(note.id);
    }
  };


  const handleSummarize = async () => {
    if (isLocked) return; // Disable if locked
    
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }

    setIsSummarizing(true);
    try {
      const aiSummary = await summarizeNote(note.content);
      setSummary(aiSummary);
      setShowSummary(true);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSummaryDisplay = (text) => {
    if (!text) return null;
    
    // Split by newlines to create paragraphs
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    const renderWithBold = (value) => {
      // Simple **bold** renderer without using dangerous HTML
      const parts = value.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, idx) => {
        const m = /^\*\*([^*]+)\*\*$/.exec(part);
        if (m) {
          return <strong key={idx}>{m[1]}</strong>;
        }
        return <span key={idx}>{part}</span>;
      });
    };
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();

      // Markdown headings
      if (/^#{1,3}\s+/.test(trimmedLine)) {
        const textOnly = trimmedLine.replace(/^#{1,3}\s+/, '').trim();
        return (
          <div key={index} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
            {renderWithBold(textOnly)}
          </div>
        );
      }
      
      // Check if it's a bullet point or numbered list
      const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./);
      if (isBullet) {
        // Extract the bullet/number prefix
        const bulletMatch = trimmedLine.match(/^([•\-\d+.]+)\s*(.+)$/);
        const content = bulletMatch && bulletMatch[2] ? bulletMatch[2] : trimmedLine.replace(/^[•\-\d+.\s]+/, '');
        const isNumbered = /^\d+\./.test(trimmedLine);
        const number = isNumbered ? trimmedLine.match(/^\d+\./)?.[0] : null;
        
        return (
          <div key={index} className="flex items-start gap-3 group">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300 mt-0.5">
              {isNumbered ? number?.replace('.', '') : '•'}
            </span>
            <span className="flex-1 text-gray-700 dark:text-gray-300">{renderWithBold(content)}</span>
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-gray-700 dark:text-gray-300">
          {renderWithBold(trimmedLine)}
        </p>
      );
    });
  };

  return (
    <div className="note-card-container" ref={cardRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`note-card ${cardColorClass} rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow flex flex-col w-full backdrop-blur-sm`}
      >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white break-words pr-2">
            {note.title}
          </h3>
          {/* {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-md">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Locked</span>
            </div>
          )} */}
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isLocked ? handleUnlock : handleLock}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
              isLocked
                ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/40'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label={isLocked ? 'Unlock note' : 'Lock note'}
            title={isLocked ? 'Unlock note' : 'Lock note'}
          >
            {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(note)}
            disabled={isLocked}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
              isLocked
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Edit note"
            title={isLocked ? 'Unlock note to edit' : 'Edit note'}
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(note.id)}
            disabled={isLocked}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors touch-manipulation ${
              isLocked
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Delete note"
            title={isLocked ? 'Unlock note to delete' : 'Delete note'}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="mb-4 flex-1 overflow-y-auto card-scrollbar">
        {isLocked ? (
          <div className="flex items-center justify-center py-8 px-4">
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                This note is locked
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Tap Lock button to Unlock note
              </p>
            </div>
          </div>
        ) : (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                    {note.content}
                  </p>
        )}
      </div>

      {!isLocked && note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(note.updatedAt || note.createdAt)}</span>
        </div>
      </div>

      <div className="flex-shrink-0 relative space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            ref={summaryButtonRef}
            onClick={handleSummarize}
            disabled={isSummarizing || isLocked}
            whileHover={!isLocked ? { scale: 1.02 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm touch-manipulation ${
              isLocked
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : showSummary
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 text-white hover:from-primary-600 hover:via-primary-700 hover:to-primary-600 shadow-md hover:shadow-lg'
            }`}
            title={isLocked ? 'Unlock note to summarize' : showSummary ? 'Hide Summary' : 'Summarize with AI'}
          >
            {isSummarizing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                <span className="text-sm">Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">{showSummary ? 'Hide' : 'Summarize'}</span>
              </>
            )}
          </motion.button>

          <motion.button
            onClick={() => onRewrite(note.id)}
            disabled={isLocked}
            whileHover={!isLocked ? { scale: 1.02 } : {}}
            whileTap={!isLocked ? { scale: 0.98 } : {}}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm touch-manipulation ${
              isLocked
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 text-white hover:from-purple-600 hover:via-purple-700 hover:to-purple-600 shadow-md hover:shadow-lg'
            }`}
            title={isLocked ? 'Unlock note to rewrite' : 'Rewrite with AI'}
          >
            <Wand2 className="w-4 h-4" />
            <span className="text-sm">Rewrite</span>
          </motion.button>
        </div>

        {/* Summary Modal - Simple and Clean */}
        {showSummary && summary && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
              onClick={() => setShowSummary(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden pointer-events-auto border border-purple-200/50 dark:border-purple-500/30"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-purple-200/50 dark:border-purple-500/30 bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-cyan-950/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-1">
                          AI Summary
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium" title={note.title}>
                          {note.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleCopySummary}
                        className="p-2 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 hover:scale-110"
                        title="Copy summary"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-500 dark:text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowSummary(false)}
                        className="p-2 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/30 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 hover:scale-110"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)] bg-gradient-to-b from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20">
                  <div className="text-gray-800 dark:text-gray-200 space-y-3 leading-relaxed">
                    {formatSummaryDisplay(summary)}
                  </div>
                </div>
              </motion.div>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        mode={passwordMode}
      />
      </motion.div>
    </div>
  );
};

export default NoteCard;

