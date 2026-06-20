import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface EditableSectionProps {
  title: string;
  content: string; // This contains HTML
  onUpdate: (newContent: string) => void;
  onRegenerate: (feedback: string) => Promise<void>;
  className?: string;
}

const CopyIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

// Simple Toolbar for WYSIWYG
const ToolbarButton: React.FC<{ cmd: string, arg?: string, icon: React.ReactNode, title: string }> = ({ cmd, arg, icon, title }) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault(); // Prevent focus loss
      document.execCommand(cmd, false, arg);
    }}
    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
    title={title}
  >
    {icon}
  </button>
);

const stripTags = (html: string) => {
   if (typeof document === 'undefined') return html;
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

export const EditableSection: React.FC<EditableSectionProps> = ({ title, content, onUpdate, onRegenerate, className = '' }) => {
  const [mode, setMode] = useState<'view' | 'manual' | 'ai'>('view');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    // Copy clean text
    const cleanText = stripTags(content);
    navigator.clipboard.writeText(cleanText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const startManualEdit = () => {
    setMode('manual');
    // We defer setting innerHTML to useEffect or ref callback to ensure the div exists
  };

  useEffect(() => {
    if (mode === 'manual' && editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [mode, content]);

  const startAiEdit = () => {
    setInputText('');
    setMode('ai');
  };

  const handleManualSave = () => {
    if (editorRef.current) {
      onUpdate(editorRef.current.innerHTML);
    }
    setMode('view');
  };

  const handleAiSave = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    await onRegenerate(inputText);
    setIsLoading(false);
    setMode('view');
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 transition-colors ${className}`}>
      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        
        {mode === 'view' && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 flex items-center"
              title="Копировать текст"
            >
              {isCopied ? <CheckIcon /> : <CopyIcon />}
              {isCopied ? 'Скопировано' : 'Копировать'}
            </button>
            <button 
              onClick={startManualEdit}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500 flex items-center"
            >
              <EditIcon />
              Редактор
            </button>
            <button 
              onClick={startAiEdit}
              className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors bg-orange-50 dark:bg-slate-700 px-3 py-1.5 rounded border border-orange-100 dark:border-slate-600 hover:border-orange-300 flex items-center"
            >
              <SparklesIcon />
              ИИ
            </button>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {mode === 'manual' && (
           <div className="animate-fade-in">
             <div className="flex items-center gap-1 mb-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 w-fit">
                <ToolbarButton cmd="bold" icon={<span className="font-bold text-serif">B</span>} title="Жирный" />
                <ToolbarButton cmd="italic" icon={<span className="italic text-serif">I</span>} title="Курсив" />
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                <ToolbarButton cmd="insertUnorderedList" icon={<span>• List</span>} title="Список" />
                <ToolbarButton cmd="insertOrderedList" icon={<span>1. List</span>} title="Нумерованный список" />
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                <ToolbarButton cmd="formatBlock" arg="H3" icon={<span className="font-bold text-xs">H3</span>} title="Заголовок" />
                <ToolbarButton cmd="formatBlock" arg="P" icon={<span className="text-xs">¶</span>} title="Параграф" />
             </div>
             
             <div
               ref={editorRef}
               contentEditable
               className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 text-base leading-relaxed mb-4 min-h-[200px] outline-none prose dark:prose-invert max-w-none"
             />
             
             <div className="flex justify-end space-x-3">
               <Button variant="ghost" onClick={() => setMode('view')}>Отмена</Button>
               <Button onClick={handleManualSave}>Сохранить</Button>
             </div>
           </div>
        )}

        {mode === 'ai' && (
           <div className="animate-fade-in">
             <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">Исходный контекст:</div>
                <div className="p-3 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                   {stripTags(content)}
                </div>
             </div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Что изменить ИИ?</label>
             <textarea
               className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 text-base mb-4 resize-y"
               rows={3} 
               placeholder="Например: Перепиши более просто, добавь пример, сделай список..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               autoFocus
             />
             <div className="flex justify-end space-x-3">
               <Button variant="ghost" onClick={() => setMode('view')} disabled={isLoading}>Отмена</Button>
               <Button onClick={handleAiSave} isLoading={isLoading}>Перегенерировать</Button>
             </div>
           </div>
        )}

        {mode === 'view' && (
          <div className="prose dark:prose-invert prose-orange max-w-none text-slate-800 dark:text-slate-300 leading-relaxed text-base">
             <div dangerouslySetInnerHTML={{ __html: content }} /> 
          </div>
        )}
      </div>
    </div>
  );
};