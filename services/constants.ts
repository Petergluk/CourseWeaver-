import React from 'react';
import { BlockType } from '../types';

export const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Recommended)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Fast)' },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.5 Pro (Balanced)' },
];

export const BLOCK_TYPES: { type: BlockType; label: string; iconPath: React.ReactNode; color: string }[] = [
  { type: 'text', label: 'Текст', iconPath: 'M4 6h16M4 12h16M4 18h7', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' },
  { type: 'video', label: 'Видео', iconPath: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  { type: 'quiz_choice', label: 'Тест', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { type: 'sorting', label: 'Сортировка', iconPath: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12', color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { type: 'matching', label: 'Сопоставление', iconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  { type: 'open_answer', label: 'Свободный ответ', iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
];
