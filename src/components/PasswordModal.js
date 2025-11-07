import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, Key } from 'lucide-react';
import { savePIN, verifyPIN } from '../utils/storage';

const PasswordModal = ({ isOpen, onClose, onConfirm, mode = 'lock' }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (mode === 'setPin') {
      // Setting PIN for the first time
      if (!password.trim()) {
        setError('Please enter a PIN');
        return;
      }
      if (password.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (password !== confirmPassword) {
        setError('PINs do not match. Please try again.');
        setPassword('');
        setConfirmPassword('');
        return;
      }
      // Save PIN and lock the note
      if (savePIN(password)) {
        onConfirm();
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError('Failed to save PIN. Please try again.');
      }
    } else if (mode === 'lock') {
      // For locking, just confirm - PIN already exists
      onConfirm();
      setPassword('');
      setConfirmPassword('');
      onClose();
    } else if (mode === 'unlock') {
      if (!password.trim()) {
        setError('Please enter your PIN');
        return;
      }
      if (verifyPIN(password)) {
        onConfirm();
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPassword('');
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 pointer-events-auto border border-gray-200 dark:border-gray-700 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex-shrink-0">
                    {mode === 'setPin' ? (
                      <Key className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                    ) : mode === 'lock' ? (
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
                    {mode === 'setPin' 
                      ? 'Set PIN to Lock Note' 
                      : mode === 'lock' 
                      ? 'Lock Note' 
                      : 'Unlock Note'}
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Content */}
                     {mode === 'setPin' ? (
                       <form id="setPinForm" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                         <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                           Set a PIN to lock your notes. You'll use this PIN to unlock them later.
                         </p>
                         <div>
                           <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                             Enter PIN
                           </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter PIN (min 4 digits)"
                      maxLength={20}
                         className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Confirm PIN"
                      maxLength={20}
                         className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                      required
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
                </form>
                     ) : mode === 'lock' ? (
                       <div className="space-y-3 sm:space-y-4">
                         <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                           This note will be locked and its content will be hidden. You'll need to enter your PIN to unlock it.
                         </p>
                       </div>
                     ) : (
                       <form id="unlockForm" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                         <div>
                           <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                             Enter PIN
                           </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your PIN"
                         className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
                      autoFocus
                      required
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
                </form>
              )}

              {/* Actions */}
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={handleClose}
                  type="button"
                     className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  type={mode === 'setPin' ? 'submit' : mode === 'unlock' ? 'submit' : 'button'}
                  form={mode === 'setPin' ? 'setPinForm' : mode === 'unlock' ? 'unlockForm' : undefined}
                     className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                >
                  {mode === 'setPin' ? (
                    <>
                      <Key className="w-4 h-4" />
                      Set PIN & Lock
                    </>
                  ) : mode === 'lock' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock Note
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PasswordModal;

