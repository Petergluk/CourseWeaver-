
import React from 'react';
import { MenuIcon, BookOpenIcon, HomeIcon, ChevronRightIcon } from './Icons';
import { CourseConcept } from '../types';

interface SidebarProps {
  concept: CourseConcept;
  activePage: 'concept' | { moduleId: string, lessonId: string };
  setActivePage: (page: 'concept' | { moduleId: string, lessonId: string }) => void;
  onOpenMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ concept, activePage, setActivePage, onOpenMenu }) => {
  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col fixed left-0 top-0 overflow-hidden z-20 shadow-xl transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
         {/* Hamburger inside sidebar (opens right drawer) */}
         <button onClick={onOpenMenu} className="text-slate-400 hover:text-slate-800 dark:hover:text-white mr-2">
           <MenuIcon />
         </button>
        <div className="flex items-center font-bold text-lg truncate text-orange-600 dark:text-orange-500 flex-1">
          <BookOpenIcon />
          <span className="truncate text-slate-800 dark:text-white">{concept.title}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-slate-700 dark:text-slate-100">
        <button onClick={() => setActivePage('concept')} className={`w-full text-left px-3 py-2.5 rounded-md text-[15px] font-medium transition-colors flex items-center ${activePage === 'concept' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
           <HomeIcon /> Обзор курса
        </button>
        {concept.modules.map((module, i) => (
          <div key={module.id}>
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 px-3 mt-4 tracking-wider truncate" title={module.title}>
              {i + 1}. {module.title}
            </h4>
            <div className="space-y-0.5">
              {module.lessons.map(lesson => {
                const isActive = typeof activePage !== 'string' && activePage.lessonId === lesson.id;
                // Correct logic: must have blocks, and ALL blocks must have content and NO errors
                const hasBlocks = lesson.blocks && lesson.blocks.length > 0;
                const hasFullContent = hasBlocks && lesson.blocks!.every(b => !!b.fullContent && !b.isError);
                
                return (
                  <button key={lesson.id} onClick={() => setActivePage({ moduleId: module.id, lessonId: lesson.id })} className={`w-full text-left px-3 py-2 rounded-md text-[14px] transition-all flex items-center ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-white font-medium border-l-2 border-orange-500' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent'}`}>
                    <div className={`w-2 h-2 rounded-full mr-3 shrink-0 transition-colors ${hasFullContent ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <span className="truncate flex-1">{lesson.title}</span>
                    {isActive && <ChevronRightIcon />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
