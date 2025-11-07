export const NOTE_COLORS = [
  {
    id: 'default',
    label: 'Classic',
    cardClass:
      'bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60',
    swatchClass:
      'bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 border border-gray-200/80 dark:border-gray-600/70',
    ringClass: 'ring-gray-400/60',
  },
  {
    id: 'sky',
    label: 'Sky',
    cardClass:
      'bg-sky-100/95 dark:bg-sky-800/40 border border-sky-200/80 dark:border-sky-700/60',
    swatchClass:
      'bg-gradient-to-br from-sky-300 via-sky-400 to-sky-500 dark:from-sky-400 dark:via-sky-500 dark:to-sky-600',
    ringClass: 'ring-sky-400/70',
  },
  {
    id: 'rose',
    label: 'Rose',
    cardClass:
      'bg-rose-100/95 dark:bg-rose-800/40 border border-rose-200/80 dark:border-rose-700/60',
    swatchClass:
      'bg-gradient-to-br from-rose-300 via-rose-400 to-rose-500 dark:from-rose-400 dark:via-rose-500 dark:to-rose-600',
    ringClass: 'ring-rose-400/70',
  },
  {
    id: 'amber',
    label: 'Amber',
    cardClass:
      'bg-amber-100/95 dark:bg-amber-800/40 border border-amber-200/80 dark:border-amber-700/60',
    swatchClass:
      'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 dark:from-amber-400 dark:via-amber-500 dark:to-amber-600',
    ringClass: 'ring-amber-400/70',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    cardClass:
      'bg-emerald-100/95 dark:bg-emerald-800/40 border border-emerald-200/80 dark:border-emerald-700/60',
    swatchClass:
      'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600',
    ringClass: 'ring-emerald-400/70',
  },
  {
    id: 'violet',
    label: 'Violet',
    cardClass:
      'bg-violet-100/95 dark:bg-violet-800/40 border border-violet-200/80 dark:border-violet-700/60',
    swatchClass:
      'bg-gradient-to-br from-violet-300 via-violet-400 to-violet-500 dark:from-violet-400 dark:via-violet-500 dark:to-violet-600',
    ringClass: 'ring-violet-400/70',
  },
  {
    id: 'slate',
    label: 'Slate',
    cardClass:
      'bg-slate-200/95 dark:bg-slate-800/50 border border-slate-300/80 dark:border-slate-700/60',
    swatchClass:
      'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 dark:from-slate-400 dark:via-slate-500 dark:to-slate-600',
    ringClass: 'ring-slate-400/70',
  },
];

export const NOTE_COLOR_MAP = NOTE_COLORS.reduce((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});
