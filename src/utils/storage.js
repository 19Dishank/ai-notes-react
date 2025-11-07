// LocalStorage utilities for notes
const STORAGE_KEY = 'ai-notes-app-notes';
const PIN_STORAGE_KEY = 'ai-notes-app-pin';

export const getNotes = () => {
  try {
    const notes = localStorage.getItem(STORAGE_KEY);
    if (!notes) return [];

    const parsed = JSON.parse(notes);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((note) => ({
      ...note,
      color: (note && note.color && typeof note.color === 'string') ? note.color : 'default',
    }));
  } catch (error) {
    console.error('Error loading notes from localStorage:', error);
    return [];
  }
};

export const saveNotes = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('Error saving notes to localStorage:', error);
    return false;
  }
};

export const addNote = (note) => {
  const notes = getNotes();
  const newNote = {
    ...note,
    color: note && note.color ? note.color : 'default',
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(newNote);
  saveNotes(notes);
  return newNote;
};

export const updateNote = (id, updatedNote) => {
  const notes = getNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index !== -1) {
    notes[index] = {
      ...notes[index],
      ...updatedNote,
      id,
      color:
        updatedNote && Object.prototype.hasOwnProperty.call(updatedNote, 'color')
          ? updatedNote.color || 'default'
          : notes[index].color || 'default',
      updatedAt: new Date().toISOString(),
    };
    saveNotes(notes);
    return notes[index];
  }
  return null;
};

export const deleteNote = (id) => {
  const notes = getNotes();
  const filteredNotes = notes.filter((note) => note.id !== id);
  saveNotes(filteredNotes);
  return filteredNotes;
};

// Default notes for first-time users
const getDefaultNotes = () => {
  const now = Date.now();
  return [
    {
      id: `${now}-d1`,
      title: 'Welcome to AI Notes',
      content:
        'Create, organize, and summarize your notes with AI. Click “New Note” to get started, or try “Summarize with AI” inside any note.\nRewrite note to improve clarity and accuracy',
      tags: ['Info'],
      color: 'sky',
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: `${now}-d2`,
      title: 'Tips for Better Notes',
      content:
        '- Keep notes concise\n- Use tags like Work/Study/Personal\n- Use AI summary for quick overviews\n- Use Lock button to protect your notes\n- Use different colors for different notes',
      tags: ['Tips'],
      color: 'emerald',
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: `${now}-d3`,
      title: 'Try Import & Export',
      content:
        'Use the toolbar to import JSON/PDF/DOCX or export your entire notebook as JSON, PDF, or Word.',
      tags: ['Tools'],
      color: 'amber',
      createdAt: new Date(now - 3 * 86400000).toISOString(),
      updatedAt: new Date(now - 3 * 86400000).toISOString(),
    },
  ];
};

export const ensureDefaultNotes = () => {
  const existing = getNotes();
  if (!existing || existing.length === 0) {
    const defaults = getDefaultNotes();
    saveNotes(defaults);
    return defaults;
  }
  return existing;
};

// PIN/Password storage utilities
export const getStoredPIN = () => {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || null;
  } catch (error) {
    console.error('Error loading PIN from localStorage:', error);
    return null;
  }
};

export const savePIN = (pin) => {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
    return true;
  } catch (error) {
    console.error('Error saving PIN to localStorage:', error);
    return false;
  }
};

export const hasPIN = () => {
  return getStoredPIN() !== null;
};

export const verifyPIN = (pin) => {
  const storedPIN = getStoredPIN();
  return storedPIN !== null && storedPIN === pin;
};

