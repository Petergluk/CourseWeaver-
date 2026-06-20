
import React from 'react';
import { Button } from './Button';
import { 
  SunIcon, MoonIcon, CloseIcon, SettingsIcon, BookOpenIcon, 
  TrashIcon, SparklesIcon, PlusIcon 
} from './Icons';
import { MODELS } from '../services/constants';
import { CourseGenerationParams, CourseConcept, AppStep } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  selectedModel: string;
  onModelChange: (id: string) => void;
  params: CourseGenerationParams;
  setParams: (params: CourseGenerationParams) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  useSearch: boolean;
  setUseSearch: (use: boolean) => void;
  history: CourseConcept[];
  currentConcept: CourseConcept | null;
  onLoadHistory: (c: CourseConcept) => void;
  onDeleteHistory: (title: string, e: React.MouseEvent) => void;
  isStructureApproved: boolean;
  isGenerating: boolean;
  generationStatus: string | null;
  onGenerateAll: () => void;
  onNewCourse: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen, onClose, theme, setTheme, selectedModel, onModelChange,
  params, setParams, temperature, setTemperature, useSearch, setUseSearch,
  history, currentConcept, onLoadHistory, onDeleteHistory,
  isStructureApproved, isGenerating, generationStatus, onGenerateAll, onNewCourse
}) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Меню</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <CloseIcon />
              </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* Model Settings Collapsible */}
            <details className="group" open>
               <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 group-open:text-orange-500">
                  <span className="flex items-center"><SettingsIcon /> Настройки генерации</span>
                  <span className="transition-transform group-open:rotate-180"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></span>
               </summary>
               <div className="space-y-4 mt-3 pl-2 animate-fade-in">
                  
                  {/* Model Selector */}
                  <div className="space-y-2">
                    {MODELS.map(m => (
                      <label key={m.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedModel === m.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                         <input 
                           type="radio" 
                           name="model" 
                           className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                           checked={selectedModel === m.id}
                           onChange={() => onModelChange(m.id)}
                         />
                         <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">{m.name}</span>
                      </label>
                    ))}
                  </div>

                  {/* Tone Selector in Menu */}
                   <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Тональность / Личность</label>
                      <select 
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
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
                      
                      {params.tone === 'custom' && (
                        <textarea 
                          className="w-full mt-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-y"
                          placeholder="Опишите тон..."
                          value={params.customTone}
                          rows={2}
                          onChange={(e) => setParams({...params, customTone: e.target.value})}
                        />
                      )}
                  </div>


                  {/* Temperature Control */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Температура</label>
                       <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{temperature}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Точно</span>
                      <span>Креативно</span>
                    </div>
                  </div>

                  {/* Search Control */}
                  <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                     <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center">
                       <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       Google Поиск
                     </span>
                     <div className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} />
                       <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                     </div>
                  </label>
               </div>
            </details>

            {/* History */}
            <div>
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider flex items-center"><BookOpenIcon /> История курсов</h3>
               {history.length === 0 ? (
                 <p className="text-sm text-slate-400 dark:text-slate-600 italic">Здесь будут ваши курсы...</p>
               ) : (
                 <div className="space-y-2">
                    {history.map((c, i) => (
                      <div key={i} className="group relative">
                        <button 
                          onClick={() => onLoadHistory(c)}
                          className={`w-full text-left p-3 pr-8 rounded-lg border transition-all ${currentConcept?.title === c.title ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                          <div className="font-semibold text-sm truncate">{c.title || "Без названия"}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{c.modules.length} модулей</div>
                        </button>
                        <button 
                          onClick={(e) => onDeleteHistory(c.title, e)}
                          className="absolute right-2 top-3 p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                {isStructureApproved && (
                  <button 
                    onClick={onGenerateAll}
                    disabled={isGenerating}
                    className="w-full mb-3 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium text-sm flex items-center justify-center shadow-lg shadow-orange-900/20 disabled:opacity-50"
                  >
                     <SparklesIcon /> {isGenerating ? (generationStatus || "Генерация...") : "Сгенерировать ВЕСЬ курс"}
                  </button>
                )}
                
                <button 
                  onClick={onNewCourse}
                  className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all font-medium text-sm flex items-center justify-center"
                >
                   <PlusIcon /> Создать новый курс
                </button>
            </div>
         </div>
         <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
            CourseWeaver AI v1.2
         </div>
      </div>
    </>
  );
};
