
import React from 'react';
import { Button } from './Button';
import { EditableSection } from './EditableSection';
import { CourseConcept, SectionKey, Module } from '../types';
import { 
  DownloadIcon, ImageIcon, UploadIcon, SparklesIcon, 
  CheckCircleIcon, PlusIcon, UpIcon, DownIcon, TrashIcon 
} from './Icons';

interface ConceptViewProps {
  concept: CourseConcept;
  isStructureApproved: boolean;
  isGenerating: boolean;
  structureContextFiles: File[];
  imageInputRef: React.RefObject<HTMLInputElement>;
  structureFileInputRef: React.RefObject<HTMLInputElement>;
  
  onExport: (type: 'html' | 'md') => void;
  onManualImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateCover: () => void;
  onDownloadImage: () => void;
  onUpdateSection: (key: SectionKey, newVal: string) => void;
  onRegenerateSection: (key: SectionKey, feedback: string) => Promise<void>;
  onStructureFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApproveStructure: () => void;
  onGenerateAllCourseContent: () => void;
  
  // Structure Editor Handlers
  onAddModule: (index: number) => void;
  onMoveModule: (index: number, direction: 'up' | 'down') => void;
  onDeleteModule: (id: string) => void;
  onAddLessonAt: (mIndex: number, lIndex: number) => void;
  onMoveLesson: (mIdx: number, lIdx: number, direction: 'up' | 'down') => void;
  onDeleteLesson: (mId: string, lId: string) => void;
  onGenerateLessons: (mId: string) => void;
  onGenerateBlocks: (mId: string, lId: string) => void;
  onEditLesson: (mId: string, lId: string) => void;
}

export const ConceptView: React.FC<ConceptViewProps> = ({
  concept, isStructureApproved, isGenerating, structureContextFiles,
  imageInputRef, structureFileInputRef,
  onExport, onManualImageUpload, onGenerateCover, onDownloadImage,
  onUpdateSection, onRegenerateSection, onStructureFileUpload, onApproveStructure, onGenerateAllCourseContent,
  onAddModule, onMoveModule, onDeleteModule, onAddLessonAt, onMoveLesson,
  onDeleteLesson, onGenerateLessons, onGenerateBlocks, onEditLesson
}) => {

  const renderStructureEditor = () => (
    <div className="space-y-6">
       {/* Top Insertion for Module */}
       <div className="h-4 -my-2 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => onAddModule(0)}>
          <div className="w-full h-px bg-transparent group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors"></div>
          <div className="absolute bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-75 group-hover:scale-100">
            <PlusIcon />
          </div>
       </div>

       {concept.modules.map((module, mIdx) => (
         <React.Fragment key={module.id}>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
               <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                     <span className="text-orange-500">Модуль {mIdx + 1}:</span> 
                     {module.title}
                  </div>
                  <div className="flex items-center gap-1">
                     <button onClick={() => onMoveModule(mIdx, 'up')} disabled={mIdx === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"><UpIcon /></button>
                     <button onClick={() => onMoveModule(mIdx, 'down')} disabled={mIdx === concept.modules.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20"><DownIcon /></button>
                     <button onClick={() => onDeleteModule(module.id)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon /></button>
                  </div>
               </div>
               
               <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
                  {module.lessons.length === 0 ? (
                     <div className="text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <p className="text-slate-400 text-sm mb-3">В этом модуле нет уроков</p>
                        <div className="flex gap-2 justify-center">
                           <Button variant="secondary" onClick={() => onAddLessonAt(mIdx, 0)} className="text-xs py-1.5"><PlusIcon /> Добавить урок</Button>
                           <Button onClick={() => onGenerateLessons(module.id)} className="text-xs py-1.5" isLoading={isGenerating}><SparklesIcon /> Сгенерировать уроки</Button>
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className="h-2 -my-1 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => onAddLessonAt(mIdx, 0)}>
                          <div className="w-full h-px bg-transparent group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors"></div>
                           <div className="absolute bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-75 group-hover:scale-90">
                            <PlusIcon />
                          </div>
                        </div>
                        
                        {module.lessons.map((lesson, lIdx) => (
                           <React.Fragment key={lesson.id}>
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center group">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${lesson.blocks && lesson.blocks.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                    <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{lesson.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditLesson(module.id, lesson.id)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300">Редактор</button>
                                    
                                    {(!lesson.blocks || lesson.blocks.length === 0) && (
                                        <button onClick={() => onGenerateBlocks(module.id, lesson.id)} title="Сгенерировать структуру блоков" className="p-1 text-orange-500 hover:text-orange-600"><SparklesIcon /></button>
                                    )}
                                    
                                    <button onClick={() => onMoveLesson(mIdx, lIdx, 'up')} disabled={lIdx === 0} className="p-1 text-slate-300 hover:text-slate-500 disabled:opacity-20"><UpIcon /></button>
                                    <button onClick={() => onMoveLesson(mIdx, lIdx, 'down')} disabled={lIdx === module.lessons.length - 1} className="p-1 text-slate-300 hover:text-slate-500 disabled:opacity-20"><DownIcon /></button>
                                    <button onClick={() => onDeleteLesson(module.id, lesson.id)} className="p-1 text-slate-300 hover:text-red-500"><TrashIcon /></button>
                                 </div>
                              </div>
                              {/* Insert Between Lessons */}
                              <div className="h-2 -my-1 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => onAddLessonAt(mIdx, lIdx + 1)}>
                                <div className="w-full h-px bg-transparent group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors"></div>
                                 <div className="absolute bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-75 group-hover:scale-90">
                                  <PlusIcon />
                                </div>
                              </div>
                           </React.Fragment>
                        ))}
                     </>
                  )}
               </div>
            </div>
            {/* Insert Between Modules */}
            <div className="h-4 -my-2 group flex items-center justify-center cursor-pointer z-10 relative" onClick={() => onAddModule(mIdx + 1)}>
              <div className="w-full h-px bg-transparent group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors"></div>
              <div className="absolute bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm transform scale-75 group-hover:scale-100">
                <PlusIcon />
              </div>
           </div>
         </React.Fragment>
       ))}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
           {/* Removed redundant subtitle and Stepik mention */}
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Общая концепция курса</h1>
        </div>
        <div className="flex space-x-2 shrink-0">
           <Button variant="secondary" onClick={() => onExport('html')} className="text-sm py-2"><DownloadIcon /> HTML</Button>
           <Button variant="secondary" onClick={() => onExport('md')} className="text-sm py-2"><DownloadIcon /> MD</Button>
           {isStructureApproved && (
             <Button 
                onClick={onGenerateAllCourseContent} 
                className="text-sm py-2 bg-gradient-to-r from-orange-600 to-amber-600 border-none shadow-lg shadow-orange-500/30"
                isLoading={isGenerating}
              >
                <SparklesIcon /> Сгенерировать ВЕСЬ курс
              </Button>
           )}
        </div>
      </div>

      {/* Hero Section - Fixed Image Fit */}
      <div className="mb-10 w-full max-w-4xl mx-auto h-64 md:h-96 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg relative group border border-slate-200 dark:border-slate-700">
         {concept.coverImage ? (
           <img src={concept.coverImage} alt="Cover" className="w-full h-full object-cover object-center" />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400">
              <ImageIcon />
           </div>
         )}
         
         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={onManualImageUpload} />
            <Button onClick={() => imageInputRef.current?.click()} variant="secondary" className="bg-white/90 dark:bg-slate-800/90 text-sm py-2 px-3 shadow-sm backdrop-blur-sm"><UploadIcon /> Загрузить</Button>
            <Button onClick={onGenerateCover} isLoading={isGenerating} className="text-sm py-2 px-3 shadow-sm"><SparklesIcon /> AI Обложка</Button>
            {concept.coverImage && (
               <Button onClick={onDownloadImage} variant="secondary" className="bg-white/90 dark:bg-slate-800/90 text-sm py-2 px-3 shadow-sm backdrop-blur-sm"><DownloadIcon /> Скачать</Button>
            )}
         </div>

         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 pt-20">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2 leading-tight shadow-black drop-shadow-md">{concept.title}</h1>
         </div>
      </div>
      
      <div className="space-y-8 max-w-4xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Уровень</label>
                <input className="w-full bg-transparent font-bold text-lg text-slate-800 dark:text-white outline-none" value={concept.level} onChange={(e) => onUpdateSection('level', e.target.value)} />
             </div>
             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Нагрузка</label>
                <input className="w-full bg-transparent font-bold text-lg text-slate-800 dark:text-white outline-none" value={concept.workload} onChange={(e) => onUpdateSection('workload', e.target.value)} />
             </div>
         </div>

         <EditableSection title="Краткое описание" content={concept.shortDescription} onUpdate={(val) => onUpdateSection('shortDescription', val)} onRegenerate={(fb) => onRegenerateSection('shortDescription', fb)} />
         <EditableSection title="О курсе (Подробно)" content={concept.aboutCourse} onUpdate={(val) => onUpdateSection('aboutCourse', val)} onRegenerate={(fb) => onRegenerateSection('aboutCourse', fb)} />
         <EditableSection title="Чему вы научитесь" content={concept.learningOutcomes} onUpdate={(val) => onUpdateSection('learningOutcomes', val)} onRegenerate={(fb) => onRegenerateSection('learningOutcomes', fb)} />
         <EditableSection title="Для кого этот курс" content={concept.targetAudience} onUpdate={(val) => onUpdateSection('targetAudience', val)} onRegenerate={(fb) => onRegenerateSection('targetAudience', fb)} />
         <EditableSection title="Начальные требования" content={concept.requirements} onUpdate={(val) => onUpdateSection('requirements', val)} onRegenerate={(fb) => onRegenerateSection('requirements', fb)} />
         <EditableSection title="Как проходит обучение" content={concept.process} onUpdate={(val) => onUpdateSection('process', val)} onRegenerate={(fb) => onRegenerateSection('process', fb)} />
         <EditableSection title="Что вы получаете" content={concept.whatYouGet} onUpdate={(val) => onUpdateSection('whatYouGet', val)} onRegenerate={(fb) => onRegenerateSection('whatYouGet', fb)} />
      </div>

      <div className="mt-16 pt-10 border-t-2 border-slate-200 dark:border-slate-700 max-w-4xl mx-auto">
         <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Программа курса</h2>
         
         {isStructureApproved ? (
           renderStructureEditor()
         ) : (
            <EditableSection title="Структура (Предварительная)" content={concept.syllabus} onUpdate={(val) => onUpdateSection('syllabus', val)} onRegenerate={(fb) => onRegenerateSection('syllabus', fb)} className="border-orange-200 dark:border-slate-700 shadow-xl shadow-orange-50 dark:shadow-none" />
         )}
          
          {!isStructureApproved && (
            <div className="mt-10 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
               <h3 className="font-bold text-slate-800 dark:text-white mb-3">Готовы перейти к деталям?</h3>
               <p className="text-sm text-slate-500 mb-6 max-w-lg mx-auto">Вы можете загрузить дополнительные материалы (методички, книги) сейчас, чтобы структура уроков была максимально точной.</p>
               
               <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 mb-6 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  onClick={() => structureFileInputRef.current?.click()}
               >
                   <div className="flex flex-col items-center">
                      <UploadIcon />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">Загрузить файлы для структуры</span>
                      {structureContextFiles.length > 0 && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-bold">
                           Выбрано файлов: {structureContextFiles.length}
                        </div>
                      )}
                   </div>
                   <input type="file" ref={structureFileInputRef} className="hidden" multiple accept=".txt,.md,.pdf,.docx" onChange={onStructureFileUpload} />
               </div>

               <div className="flex justify-center">
                 <Button onClick={onApproveStructure} isLoading={isGenerating} className="text-lg px-8 py-3 w-full md:w-auto"><CheckCircleIcon /> Утвердить структуру и начать создание уроков</Button>
               </div>
            </div>
          )}
      </div>
   </div>
  );
};
