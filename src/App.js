import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Download, Upload, FileText as FileTextIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { ThemeProvider } from './context/ThemeContext';
import NoteForm from './components/NoteForm';
import RewriteForm from './components/RewriteForm';
import NoteCard from './components/NoteCard';
import SearchBar from './components/SearchBar';
import TagFilter from './components/TagFilter';
import ThemeToggle from './components/ThemeToggle';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { getNotes, addNote, updateNote, deleteNote, saveNotes, ensureDefaultNotes } from './utils/storage';

if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const AppContent = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [rewritingNote, setRewritingNote] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showRewriteForm, setShowRewriteForm] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const exportMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const loadedNotes = ensureDefaultNotes();
    setNotes(loadedNotes);
    setFilteredNotes(loadedNotes);
  }, []);

  // Filter notes based on search query and selected tag
  useEffect(() => {
    let filtered = notes;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) => {
          // Always allow searching by title
          if (note.title.toLowerCase().includes(query)) {
            return true;
          }
          // For locked notes, don't search in content
          if (note.locked) {
            return false;
          }
          // For unlocked notes, search in content
          return note.content.toLowerCase().includes(query);
        }
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(
        (note) => note.tags && note.tags.includes(selectedTag)
      );
    }

    setFilteredNotes(filtered);
  }, [notes, searchQuery, selectedTag]);

  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    // For JSON export, preserve locked state but hide content for security
    const exportedNotes = notes.map(note => ({
      ...note,
      content: note.locked ? '[Content is locked]' : note.content
    }));
    const blob = new Blob([JSON.stringify(exportedNotes, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, 'notes_backup.json');
    showFeedback('Notes exported as JSON.');
  };

  const handleExportPDF = () => {
    if (!notes.length) {
      showFeedback('No notes available to export.', 'error');
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    notes.forEach((note, idx) => {
      const title = note.title || `Note ${idx + 1}`;
      const content = note.locked ? '[Content is locked]' : (note.content || '');
      const createdAt = note.createdAt ? new Date(note.createdAt).toLocaleString() : '';

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      y += 8;

      if (createdAt) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(createdAt, 14, y);
        y += 8;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content, pageWidth - 28);
      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 14, y);
        y += 7;
      });

      if (idx < notes.length - 1) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('notes_backup.pdf');
    showFeedback('Notes exported as PDF.');
  };

  const handleExportDocx = async () => {
    if (!notes.length) {
      showFeedback('No notes available to export.', 'error');
      return;
    }

    try {
      const doc = new Document({
        sections: notes.map((note, idx) => {
          const title = note.title || `Note ${idx + 1}`;
          const createdAt = note.createdAt ? new Date(note.createdAt).toLocaleString() : '';
          const noteContent = note.locked ? '[Content is locked]' : (note.content || '');
          const contentParagraphs = noteContent.split('\n').map((line) =>
            new Paragraph({ text: line })
          );

          return {
            properties: {},
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_2,
              }),
              createdAt
                ? new Paragraph({ text: createdAt })
                : new Paragraph({ text: '' }),
              ...contentParagraphs,
              new Paragraph({ text: '' }),
            ],
          };
        }),
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, 'notes_backup.docx');
      showFeedback('Notes exported as Word document.');
    } catch (error) {
      console.error(error);
      showFeedback('Failed to export notes as Word document.', 'error');
    }
  };

  const normalizeContentKey = (note) => {
    if (!note || (!note.title && !note.content)) return null;
    return `${note.title || ''}\n${note.content || ''}`
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  const parseTextToNoteData = (text) => {
    if (!text) return [];
    const blocks = text
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block, index) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const titleCandidate = lines[0] ? lines[0].slice(0, 120) : '';
      const body = lines.slice(1).join('\n').trim();
      const title = titleCandidate || `Imported Note ${index + 1}`;
      const content = body || titleCandidate || `Imported note ${index + 1}`;

      return {
        title,
        content,
      };
    });
  };

  const getNextImportedDocNumber = () => {
    const existing = getNotes();
    let max = 0;
    existing.forEach((n) => {
      const m = /^(Imported Doc)\s+(\d+)/i.exec(n.title || '');
      if (m) {
        const num = parseInt(m[2], 10);
        if (!Number.isNaN(num)) max = Math.max(max, num);
      }
    });
    return max + 1;
  };

  const buildNoteObjects = (noteDataArray) => {
    const timestamp = Date.now();
    return noteDataArray.map((data, idx) => ({
      id: `${timestamp}-${idx}`,
      title: data.title?.trim() || `Imported Note ${idx + 1}`,
      content: data.content?.trim() || '',
      tags: [],
      color: data.color || 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleImportJSON = (data) => {
    let notesArray = [];
    if (Array.isArray(data)) {
      notesArray = data;
    } else if (data && Array.isArray(data.notes)) {
      notesArray = data.notes;
    } else {
      throw new Error('Invalid JSON format. Expected an array of notes.');
    }

    const sanitized = notesArray
      .map((note, idx) => ({
        id: note.id || `${Date.now()}-${idx}`,
        title: note.title?.toString()?.trim() || `Imported Note ${idx + 1}`,
        content: note.content?.toString() || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        color: note.color ? note.color.toString() : 'default',
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || new Date().toISOString(),
      }))
      .filter((note) => note.content.trim().length > 0 || note.title.trim().length > 0);

    saveNotes(sanitized);
    setNotes(sanitized);
    setFilteredNotes(sanitized);
    showFeedback(`Imported ${sanitized.length} notes from JSON.`);
  };

  const handleImportFromText = (text, source = 'other') => {
    let newNotes = [];
    // For PDF/DOCX imports: create a single note, entire content -> description
    if (source === 'pdf' || source === 'docx') {
      const nextNum = getNextImportedDocNumber();
      newNotes = buildNoteObjects([
        { title: `Imported Doc ${nextNum}`, content: (text || '').trim() },
      ]);
    } else {
      // Fallback (not used for pdf/docx): split into multiple notes
      const noteData = parseTextToNoteData(text);
      if (!noteData.length) {
        throw new Error('Unable to extract notes from the file.');
      }
      newNotes = buildNoteObjects(noteData);
    }
    const existingNotes = getNotes();
    const existingContentKeys = new Set(existingNotes.map(normalizeContentKey).filter(Boolean));

    const uniqueNewNotes = newNotes.filter((note) => {
      const key = normalizeContentKey(note);
      if (!key || existingContentKeys.has(key)) {
        return false;
      }
      existingContentKeys.add(key);
      return true;
    });

    if (!uniqueNewNotes.length) {
      showFeedback('No new notes to import (duplicates were skipped).', 'error');
      return;
    }

    const mergedNotes = [...uniqueNewNotes, ...existingNotes];
    saveNotes(mergedNotes);
    setNotes(mergedNotes);
    setFilteredNotes(mergedNotes);
    showFeedback(`Imported ${uniqueNewNotes.length} new note${uniqueNewNotes.length === 1 ? '' : 's'}.`);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        handleImportJSON(data);
      } else if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(' ');
          text += `${pageText}\n\n`;
        }
        handleImportFromText(text, 'pdf');
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        handleImportFromText(value, 'docx');
      } else {
        throw new Error('Unsupported file type. Please upload a JSON, PDF, or DOCX file.');
      }
    } catch (error) {
      console.error(error);
      showFeedback(error.message || 'Failed to import notes.', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportOption = async (format) => {
    setIsExportMenuOpen(false);
    if (format === 'json') {
      handleExportJSON();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'docx') {
      await handleExportDocx();
    }
  };

  const handleSaveNote = (noteData) => {
    if (editingNote) {
      // Update existing note
      const updated = updateNote(editingNote.id, noteData);
      if (updated) {
        setNotes(getNotes());
        setEditingNote(null);
        setShowForm(false);
      }
    } else {
      // Create new note
      addNote(noteData);
      setNotes(getNotes());
      setShowForm(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
      setNotes(getNotes());
      if (editingNote && editingNote.id === id) {
        setEditingNote(null);
        setShowForm(false);
      }
    }
  };

  const handleLockNote = (id) => {
    updateNote(id, { locked: true });
    setNotes(getNotes());
    showFeedback('Note locked successfully.');
  };

  const handleUnlockNote = (id) => {
    updateNote(id, { locked: false });
    setNotes(getNotes());
    showFeedback('Note unlocked successfully.');
  };

  const handleRewriteNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setRewritingNote(note);
      setShowRewriteForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveRewrite = (rewrittenContent) => {
    if (rewritingNote) {
      updateNote(rewritingNote.id, { content: rewrittenContent });
      setNotes(getNotes());
      setRewritingNote(null);
      setShowRewriteForm(false);
      showFeedback('Note rewritten successfully.');
    }
  };

  const handleCancelRewrite = () => {
    setRewritingNote(null);
    setShowRewriteForm(false);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setShowForm(false);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                AI Notes App
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium shadow ${
              feedback.type === 'error'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                : 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-100'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Actions Toolbar */}
        {!showForm && !showRewriteForm && (
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNewNote}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>New Note</span>
            </motion.button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setIsExportMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs sm:text-sm md:text-base"
                >
                  {/* Per user request, use Upload icon for Export */}
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Export</span>
                </button>

                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 sm:w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-20"
                      style={{ left: '0', right: '0' }}
                    >
                      <button
                        onClick={() => handleExportOption('json')}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExportOption('pdf')}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExportOption('docx')}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FileText className="w-4 h-4" />
                        Export as Word
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <button
                  onClick={handleImportClick}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/30 transition-colors text-xs sm:text-sm md:text-base"
                >
                  {/* Per user request, use Download icon for Import */}
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Import Document</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Note Form */}
        <AnimatePresence>
          {showForm && (
            <NoteForm
              note={editingNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
            />
          )}
        </AnimatePresence>

        {/* Rewrite Form */}
        <AnimatePresence>
          {showRewriteForm && (
            <RewriteForm
              note={rewritingNote}
              onSave={handleSaveRewrite}
              onCancel={handleCancelRewrite}
            />
          )}
        </AnimatePresence>

        {/* Search and Filter */}
        {!showForm && !showRewriteForm && notes.length > 0 && (
          <>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <TagFilter
              notes={notes}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
            />
          </>
        )}

        {/* Notes Grid */}
        {!showForm && !showRewriteForm && (
          <div>
            {filteredNotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {searchQuery || selectedTag
                    ? 'No notes found'
                    : notes.length === 0
                    ? 'No notes yet'
                    : 'No matching notes'}
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  {searchQuery || selectedTag
                    ? 'Try adjusting your search or filter'
                    : 'Create your first note to get started'}
                </p>
                {notes.length === 0 && (
                  <motion.button
                    onClick={handleNewNote}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Create Note
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="note-card-grid">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                      onLock={handleLockNote}
                      onUnlock={handleUnlockNote}
                      onRewrite={handleRewriteNote}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {!showForm && !showRewriteForm && notes.length > 0 && (
          <motion.div
           // initial={{ opacity: 0 }}
           // animate={{ opacity: 1 }}
            className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            Showing {filteredNotes.length} of {notes.length} note
            {notes.length !== 1 ? 's' : ''}
          </motion.div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
      </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
