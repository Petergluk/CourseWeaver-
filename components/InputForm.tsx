
import React from 'react';
import { Button } from './Button';
import { UploadIcon, FileIcon } from './Icons';
import { CourseGenerationParams, CourseConcept } from '../types';
import { MODELS } from '../services/constants';

interface InputFormProps {
  params: CourseGenerationParams;
  setParams: (p: CourseGenerationParams) => void;
  selectedModel: string;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  uploadedFileNames: string[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const InputForm: React.FC<InputFormProps> = ({
  params, setParams, selectedModel, isGenerating, error, onGenerate, 
  uploadedFileNames, onFileUpload, fileInputRef
}) => {
  return (
    <div className="max-w-3xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-200 dark:border-slate-700 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-6 shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 4.168 6.253v13C4.168 19.977 5.754 19.5 7.5 19.5S10.832 19.977 12 20.5m0-6.247C13.168 14.523 14.754 14 16.5 14c1.746 0 3.332.477 4.5 1.253v-13C21 1.477 19.246 1 17.5 1 15.754 1 14.168 1.477 13 2.253m-1 12V20.5" /></svg>
           </div>
           <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
             CourseWeaver <span className="text-orange-600 dark:text-orange-500">AI</span>
           </h1>
           <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
             Создайте профессиональный онлайн-курс за считанные минуты с помощью Gemini 3.0 Pro.
           </p>
        </div>

        <div className="space-y-6">
           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Тема курса</label>
              <input 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="Например: Основы Python для анализа данных"
                value={params.topic}
                onChange={(e) => setParams({...params, topic: e.target.value})}
                autoFocus
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Целевая аудитория</label>
                <input 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                  placeholder="Например: Маркетологи, новички..."
                  value={params.audience}
                  onChange={(e) => setParams({...params, audience: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Тональность</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white appearance-none cursor-pointer"
                  value={params.tone}
                  onChange={(e) => setParams({...params, tone: e.target.value})}
                >
                   <option value="hybrid">Оптимальный (Гибрид)</option>
                   <option value="friendly_mentor">Дружелюбный наставник</option>
                   <option value="professional">Строгий профессионал</option>
                   <option value="interactive">Интерактивный / Игровой</option>
                   <option value="minimalist">Минимализм (Только суть)</option>
                   <option value="historical">С примерами из истории</option>
                   <option value="custom">Свой вариант...</option>
                </select>
              </div>
           </div>

           {params.tone === 'custom' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Опишите желаемый тон</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
                  rows={2}
                  placeholder="Например: Саркастичный, как доктор Хаус..."
                  value={params.customTone}
                  onChange={(e) => setParams({...params, customTone: e.target.value})}
                />
              </div>
           )}

           <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Дополнительные пожелания</label>
              <textarea 
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-y"
                rows={2}
                placeholder="Укажите, если нужно сделать акцент на практике..."
                value={params.additionalInfo}
                onChange={(e) => setParams({...params, additionalInfo: e.target.value})}
              />
           </div>

           <div 
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              onClick={() => fileInputRef.current?.click()}
           >
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={onFileUpload} accept=".txt,.md,.pdf,.docx" />
              <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                 <UploadIcon />
                 <span className="font-medium mt-2">Загрузить контекст (Книги, Методички)</span>
                 <span className="text-xs mt-1 text-slate-400">TXT, MD, PDF</span>
              </div>
              {uploadedFileNames.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {uploadedFileNames.map((f, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <FileIcon /> {f}
                    </span>
                  ))}
                </div>
              )}
           </div>

           {error && (
             <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm">
               {error}
             </div>
           )}

           <Button 
             onClick={onGenerate} 
             isLoading={isGenerating} 
             disabled={!params.topic || !params.audience}
             className="w-full py-4 text-lg font-bold shadow-orange-500/25 shadow-xl mt-4"
           >
             {isGenerating ? 'Создаю концепцию...' : 'Создать курс 🚀'}
           </Button>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Используется модель {MODELS.find(m => m.id === selectedModel)?.name}
        </div>
      </div>
   </div>
  );
}
