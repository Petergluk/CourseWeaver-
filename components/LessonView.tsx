
import React, { useState } from 'react';
import { Button } from './Button';
import { EditableSection } from './EditableSection';
import { Lesson, Module, BlockType, LessonBlock } from '../types';
import { BLOCK_TYPES } from '../services/constants';
import { 
  PlusIcon, SparklesIcon, RefreshIcon, UpIcon, DownIcon, TrashIcon, CheckCircleIcon 
} from './Icons';

interface LessonViewProps {
  module: Module;
  lesson: Lesson;
  isGenerating: boolean;
  onGenerateFullContent: () => void;
  onRegenerateBlock: (blockId: string) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateBlockContent: (blockId: string, content: string) => void;
  onUpdateBlockSummary: (blockId: string, summary: string) => void;
  onRegenerateBlockContentAI: (blockId: string, feedback: string) => Promise<void>;
  onRegenerateBlockSummaryAI: (blockId: string, feedback: string) => Promise<void>;
  onAddBlock: (index: number, blockData: {type: BlockType, title: string, summary: string}) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  module, lesson, isGenerating, onGenerateFullContent, onRegenerateBlock,
  onMoveBlock, onDeleteBlock, onUpdateBlockContent, onUpdateBlockSummary,
  onRegenerateBlockContentAI, onRegenerateBlockSummaryAI, onAddBlock
}) => {
  const blocks = lesson.blocks || [];
  const isFullyGenerated = blocks.length > 0 && blocks.every(b => !!b.fullContent);
  const [isAddingBlock, setIsAddingBlock] = useState<{index: number} | null>(null);
  const [newBlockData, setNewBlockData] = useState<{type: BlockType, title: string, summary: string}>({
    type: 'text', title: '', summary: ''
  });
  
  // Local state to track which specific block is regenerating for UI feedback
  const [regeneratingBlockId, setRegeneratingBlockId] = useState<string | null>(null);

  const handleSaveBlock = () => {
    if (!newBlockData.title || isAddingBlock === null) return;
    onAddBlock(isAddingBlock.index, newBlockData);
    setIsAddingBlock(null);
    setNewBlockData({ type: 'text', title: '', summary: '' });
  };

  const handleRegenerateClick = (blockId: string) => {
      setRegeneratingBlockId(blockId);
      onRegenerateBlock(blockId);
      // Reset local state after a delay or effect when isGenerating becomes false?
      // Since isGenerating is global, we can rely on that to disable all, 
      // but use local ID to show specific spinner.
  };
  
  // Effect to clear regenerating ID when global generation stops
  React.useEffect(() => {
      if (!isGenerating) {
          setRegeneratingBlockId(null);
      }
  }, [isGenerating]);

  const renderAddBlockModal = () => {
    if (isAddingBlock === null) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-850 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white">Добавить блок</h3>
             <button onClick={() => setIsAddingBlock(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="p-6 space-y-6">
             {/* Types Grid */}
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Тип контента</label>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {BLOCK_TYPES.map(bt => (
                   <button 
                    key={bt.type}
                    onClick={() => setNewBlockData({...newBlockData, type: bt.type})}
                    className={`flex items-center p-3 rounded-lg border text-left transition-all
                      ${newBlockData.type === bt.type 
                        ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                   >
                      <div className={`p-2 rounded-md mr-3 ${bt.color}`}>{/* Icon would go here if extracted properly, assume simple render for now */}{/* Simplified icon placeholder */}<span className="text-lg">📄</span></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{bt.label}</span>
                   </button>
                 ))}
               </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Заголовок блока</label>
                <input 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  placeholder="Например: Введение в тему"
                  value={newBlockData.title}
                  onChange={e => setNewBlockData({...newBlockData, title: e.target.value})}
                  autoFocus
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Описание (Промпт для ИИ)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  rows={2}
                  placeholder="Опишите, что должно быть в этом блоке..."
                  value={newBlockData.summary}
                  onChange={e => setNewBlockData({...newBlockData, summary: e.target.value})}
                />
             </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
             <Button variant="ghost" onClick={() => setIsAddingBlock(null)}>Отмена</Button>
             <Button onClick={handleSaveBlock} disabled={!newBlockData.title}>Добавить</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-8">
       <div className="mb-8 text-center md:text-left">
          <span className="text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wide">{module?.title}</span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{lesson.title}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{lesson.description}</p>
       </div>

       {!blocks.length ? (
          <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <p className="text-slate-500 dark:text-slate-400 mb-4">Блоков пока нет.</p>
             <Button onClick={() => setIsAddingBlock({ index: 0 })} variant="secondary">
                <PlusIcon /> Добавить первый блок
             </Button>
          </div>
       ) : (
          <div className="space-y-6">
             {!isFullyGenerated && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-orange-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                   <div>
                      <h3 className="font-bold text-orange-900 dark:text-orange-400 text-lg">Конструктор урока</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Добавьте блоки и нажмите "Создать контент".</p>
                   </div>
                   <Button onClick={onGenerateFullContent} isLoading={isGenerating} className="px-6 py-3 text-base shrink-0">
                       <SparklesIcon /> Создать контент урока
                    </Button>
                </div>
             )}

             <div className="relative">
               {/* Top Insert Zone */}
               <div className="h-4 -my-2 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => setIsAddingBlock({ index: 0 })}>
                  <div className="w-full h-px bg-transparent group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors"></div>
                  <div className="absolute bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-75 group-hover:scale-100">
                    <PlusIcon />
                  </div>
               </div>

               {blocks.map((block, idx) => {
                 const isGenerated = !!block.fullContent;
                 const blockTypeConfig = BLOCK_TYPES.find(bt => bt.type === block.type) || BLOCK_TYPES[0];
                 const isThisBlockRegenerating = isGenerating && regeneratingBlockId === block.id;
                 
                 return (
                    <div key={block.id}>
                      <div className="relative group/block bg-white dark:bg-slate-900 rounded-xl">
                         <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${blockTypeConfig.color} border-black/5 dark:border-white/10`}>
                                 {blockTypeConfig.label}
                              </span>
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{block.title}</h3>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/block:opacity-100 transition-opacity">
                              <button onClick={() => handleRegenerateClick(block.id)} disabled={isGenerating} className="p-1.5 text-slate-400 hover:text-orange-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30" title="Перегенерировать блок">
                                <RefreshIcon />
                              </button>
                              <button onClick={() => onMoveBlock(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                <UpIcon />
                              </button>
                              <button onClick={() => onMoveBlock(idx, 'down')} disabled={idx === blocks.length - 1} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                <DownIcon />
                              </button>
                              <button onClick={() => onDeleteBlock(block.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                <TrashIcon />
                              </button>
                            </div>
                         </div>
                         
                         {block.isError ? (
                           <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                             <p className="text-red-600 dark:text-red-300 mb-2">Ошибка генерации контента для этого блока.</p>
                             <Button 
                                variant="secondary" 
                                onClick={() => handleRegenerateClick(block.id)} 
                                className="text-sm"
                                isLoading={isThisBlockRegenerating}
                                disabled={isGenerating && !isThisBlockRegenerating}
                             >
                               <RefreshIcon /> Повторить генерацию
                             </Button>
                           </div>
                         ) : isGenerated ? (
                            <EditableSection title="Полный контент" content={block.fullContent || ""} onUpdate={(val) => onUpdateBlockContent(block.id, val)} onRegenerate={(fb) => onRegenerateBlockContentAI(block.id, fb)} className="border-green-200 dark:border-green-900/50 shadow-green-50/50" />
                         ) : (
                            <EditableSection title="Сценарий (Summary)" content={block.contentSummary} onUpdate={(val) => onUpdateBlockSummary(block.id, val)} onRegenerate={(fb) => onRegenerateBlockSummaryAI(block.id, fb)} className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50" />
                         )}
                      </div>

                      {/* Insert Zone Between Blocks */}
                      <div className="h-10 -my-2 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => setIsAddingBlock({ index: idx + 1 })}>
                          <div className="w-full h-px bg-transparent group-hover:bg-orange-300 dark:group-hover:bg-orange-800/50 transition-colors"></div>
                           <div className="absolute bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-full px-3 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-sm transform translate-y-2 group-hover:translate-y-0 flex items-center">
                            <PlusIcon /> Добавить блок сюда
                          </div>
                      </div>
                    </div>
                 );
               })}
             </div>

             <div className="pt-8 flex justify-center">
                <Button variant="secondary" onClick={() => setIsAddingBlock({ index: blocks.length })}>
                  <PlusIcon /> Добавить блок в конец
                </Button>
             </div>

             {isFullyGenerated && (
                <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/50 text-center">
                   <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 mb-3"><CheckCircleIcon /></div>
                   <h3 className="text-xl font-bold text-green-900 dark:text-green-300">Урок полностью готов!</h3>
                </div>
             )}
          </div>
       )}
       {renderAddBlockModal()}
    </div>
  );
};
