
import React, { useState, useRef, useEffect } from 'react';
import { 
  generateCourseConcept, 
  refineSection, 
  generateDetailedCourseStructure,
  generateFullLessonContent,
  generateCourseCoverImage,
  generateLessonsForModule,
  generateBlocksForLesson
} from './services/geminiService';
import { generateMarkdown, generateHTML, downloadFile } from './services/exportService';
import { TONE_DESCRIPTIONS } from './services/prompts';
import { 
  CourseConcept, 
  CourseGenerationParams, 
  AppStep, 
  SectionKey,
  LessonBlock,
  BlockType
} from './types';
import { MODELS } from './services/constants';
import { MenuIcon, SunIcon, MoonIcon } from './components/Icons';

// Sub-components
import { InputForm } from './components/InputForm';
import { MenuDrawer } from './components/MenuDrawer';
import { Sidebar } from './components/Sidebar';
import { ConceptView } from './components/ConceptView';
import { LessonView } from './components/LessonView';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [params, setParams] = useState<CourseGenerationParams>({
    topic: '', audience: '', tone: 'hybrid', customTone: '', additionalInfo: '', files: []
  });
  
  // App State
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id); // Default to 3.0 Pro
  const [temperature, setTemperature] = useState<number>(1.0); // Default for 3.0 Pro
  const [useSearch, setUseSearch] = useState<boolean>(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [concept, setConcept] = useState<CourseConcept | null>(null);
  const [isStructureApproved, setIsStructureApproved] = useState(false);
  const [activePage, setActivePage] = useState<'concept' | { moduleId: string, lessonId: string }>('concept');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persistence & History State
  const [history, setHistory] = useState<CourseConcept[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const structureFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [structureContextFiles, setStructureContextFiles] = useState<File[]>([]);

  // Init Effects
  useEffect(() => {
    const savedTheme = localStorage.getItem('cw_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    else setTheme('dark');

    const saved = localStorage.getItem('cw_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
    const savedModel = localStorage.getItem('cw_model');
    if (savedModel) {
      setSelectedModel(savedModel);
      if (savedModel === 'gemini-3-pro-preview') setTemperature(1.0);
      else setTemperature(0.9);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cw_theme', theme);
  }, [theme]);

  // Helpers
  const saveToHistory = (newConcept: CourseConcept) => {
    const existingIdx = history.findIndex(c => c.title === newConcept.title);
    let newHistory;
    if (existingIdx >= 0) {
      newHistory = [...history];
      newHistory[existingIdx] = newConcept;
    } else {
      newHistory = [newConcept, ...history];
    }
    setHistory(newHistory);
    localStorage.setItem('cw_history', JSON.stringify(newHistory));
  };

  const updateCurrentConcept = (newConcept: CourseConcept) => {
    setConcept(newConcept);
    saveToHistory(newConcept);
  };

  const handleModelChange = (id: string) => {
     setSelectedModel(id);
     localStorage.setItem('cw_model', id);
     if (id === 'gemini-3-pro-preview') {
       setTemperature(1.0);
     } else {
       setTemperature(0.9);
     }
  };

  const handleDeleteHistoryItem = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить этот курс из истории?")) return;
    const newHistory = history.filter(h => h.title !== title);
    setHistory(newHistory);
    localStorage.setItem('cw_history', JSON.stringify(newHistory));
    if (concept?.title === title) {
      setConcept(null);
      setStep(AppStep.INPUT);
    }
  };

  const loadFromHistory = (c: CourseConcept) => {
    setConcept(c);
    setIsStructureApproved(c.modules.some(m => m.lessons.some(l => l.blocks && l.blocks.length > 0)));
    setStep(AppStep.EDITOR);
    setActivePage('concept');
    setIsMenuOpen(false);
  };

  // --- Handlers (passed down to components) ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const fileNames = files.map(f => f.name);
      setUploadedFileNames(prev => [...prev, ...fileNames]);
      setParams(prev => ({ ...prev, files: [...(prev.files || []), ...files] }));
    }
  };

  const handleStructureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       setStructureContextFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0 && concept) {
       const file = e.target.files[0];
       const reader = new FileReader();
       reader.onloadend = () => {
         updateCurrentConcept({ ...concept, coverImage: reader.result as string });
       };
       reader.readAsDataURL(file);
     }
  };

  const handleDownloadImage = () => {
    if (concept?.coverImage) {
      const a = document.createElement('a');
      a.href = concept.coverImage;
      a.download = `cover-${concept.title.slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleGenerateConcept = async () => {
    if (!params.topic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateCourseConcept(params, selectedModel, { temperature, useSearch });
      setConcept(result);
      saveToHistory(result);
      setStep(AppStep.EDITOR);
      setActivePage('concept');
      setIsStructureApproved(false);
      setStructureContextFiles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveStructure = async () => {
    if (!concept) return;
    setIsGenerating(true);
    try {
      let context = `Курс: ${concept.title}. ${concept.aboutCourse}`;
      if (structureContextFiles.length > 0) {
         context += `\n\nДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ ДЛЯ СТРУКТУРЫ:\n`;
         for (const file of structureContextFiles) {
            const text = await file.text();
            context += `\n--- FILE: ${file.name} ---\n${text.slice(0, 50000)}`; 
         }
      }
      const modules = await generateDetailedCourseStructure(concept.syllabus, context, selectedModel, { temperature });
      const updated = { ...concept, modules };
      updateCurrentConcept(updated);
      setIsStructureApproved(true);
    } catch (err: any) {
      alert("Ошибка создания структуры: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!concept) return;
    setIsGenerating(true);
    try {
       const image = await generateCourseCoverImage(concept.title, params.tone === 'custom' ? params.customTone : params.tone);
       if (image) updateCurrentConcept({ ...concept, coverImage: image });
    } catch (e: any) {
      alert("Не удалось создать обложку: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (type: 'html' | 'md') => {
    if (!concept) return;
    if (type === 'html') {
      const content = generateHTML(concept);
      downloadFile(content, `concept-${concept.title.slice(0, 10)}.html`, 'text/html');
    } else if (type === 'md') {
       const content = generateMarkdown(concept); 
       downloadFile(content, `course-${concept.title.slice(0, 10)}.md`, 'text/markdown');
    }
  };

  // Helper for tone instruction
  const getCurrentToneInstruction = () => params.tone === 'custom' ? params.customTone || "" : (TONE_DESCRIPTIONS[params.tone] || params.tone);

  // --- Concept Update Handlers ---
  const updateConceptSection = (key: SectionKey, newVal: string) => {
    if (!concept) return;
    updateCurrentConcept({ ...concept, [key]: newVal });
  };
  const regenerateConceptSection = async (key: SectionKey, feedback: string) => {
    if (!concept) return;
    const refined = await refineSection(concept[key] as string, feedback, `Курс: ${concept.title}`, selectedModel, getCurrentToneInstruction(), { temperature, useSearch });
    updateConceptSection(key, refined);
  };

  // --- Structure & Lesson Handlers ---
  const handleAddModule = (index: number) => {
    if (!concept) return;
    const title = prompt("Название нового модуля:");
    if (!title) return;
    const newModules = [...concept.modules];
    newModules.splice(index, 0, { id: `manual-m-${Date.now()}`, title, description: "Новый модуль", lessons: [] });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    if (!concept) return;
    const newModules = [...concept.modules];
    if (direction === 'up' && index > 0) [newModules[index], newModules[index-1]] = [newModules[index-1], newModules[index]];
    else if (direction === 'down' && index < newModules.length - 1) [newModules[index], newModules[index+1]] = [newModules[index+1], newModules[index]];
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleDeleteModule = (moduleId: string) => {
    if (!concept || !confirm("Удалить модуль целиком?")) return;
    updateCurrentConcept({ ...concept, modules: concept.modules.filter(m => m.id !== moduleId) });
  };

  const handleAddLessonAt = (moduleIndex: number, lessonIndex: number) => {
    if (!concept) return;
    const title = prompt("Название нового урока:");
    if (!title) return;
    const newModules = [...concept.modules];
    newModules[moduleIndex].lessons.splice(lessonIndex, 0, { id: `manual-l-${Date.now()}`, title, description: "Новый урок", blocks: [] });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleMoveLesson = (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    if (!concept) return;
    const newModules = [...concept.modules];
    const lessons = newModules[moduleIndex].lessons;
    if (direction === 'up' && lessonIndex > 0) [lessons[lessonIndex], lessons[lessonIndex-1]] = [lessons[lessonIndex-1], lessons[lessonIndex]];
    else if (direction === 'down' && lessonIndex < lessons.length - 1) [lessons[lessonIndex], lessons[lessonIndex+1]] = [lessons[lessonIndex+1], lessons[lessonIndex]];
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (!concept || !confirm("Удалить урок?")) return;
    const newModules = concept.modules.map(m => m.id !== moduleId ? m : { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleGenerateLessons = async (moduleId: string) => {
    if (!concept) return;
    const mod = concept.modules.find(m => m.id === moduleId);
    if (!mod) return;
    setIsGenerating(true);
    try {
       const lessons = await generateLessonsForModule(mod.title, `Курс: ${concept.title}. ${concept.aboutCourse}`, selectedModel, { temperature, useSearch });
       updateCurrentConcept({ ...concept, modules: concept.modules.map(m => m.id === moduleId ? { ...m, lessons } : m) });
    } catch(e: any) { alert(e.message); } finally { setIsGenerating(false); }
  };

  const handleGenerateBlocks = async (moduleId: string, lessonId: string) => {
    if (!concept) return;
    const mod = concept.modules.find(m => m.id === moduleId);
    const lesson = mod?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    setIsGenerating(true);
    try {
      const blocks = await generateBlocksForLesson(lesson.title, `Курс: ${concept.title}. Урок в модуле ${mod?.title}`, selectedModel, { temperature, useSearch });
      const newModules = concept.modules.map(m => m.id !== moduleId ? m : { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks } : l) });
      updateCurrentConcept({ ...concept, modules: newModules });
    } catch(e: any) { alert(e.message); } finally { setIsGenerating(false); }
  };

  const handleGenerateFullContent = async (moduleId: string, lessonId: string) => {
     if (!concept) return;
     const lesson = concept.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
     if (!lesson || !lesson.blocks) return;
     setIsGenerating(true);
     try {
       const updatedBlocks = await generateFullLessonContent(concept, lesson.title, lesson.blocks, selectedModel, getCurrentToneInstruction(), { temperature, useSearch });
       const newModules = concept.modules.map(m => m.id !== moduleId ? m : { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks: updatedBlocks } : l) });
       updateCurrentConcept({ ...concept, modules: newModules });
     } catch (e: any) { alert(e.message); } finally { setIsGenerating(false); }
  };

  // Block Updates
  const updateBlockProp = (moduleId: string, lessonId: string, blockId: string, key: 'contentSummary' | 'fullContent' | 'isError', val: any) => {
      if (!concept) return;
      const newModules = concept.modules.map(m => m.id !== moduleId ? m : { ...m, lessons: m.lessons.map(l => l.id !== lessonId ? l : { ...l, blocks: l.blocks?.map(b => b.id === blockId ? { ...b, [key]: val } : b) }) });
      updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleRegenerateBlockSummary = async (moduleId: string, lessonId: string, blockId: string, feedback: string) => {
     if (!concept) return;
     const lesson = concept.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
     const block = lesson?.blocks?.find(b => b.id === blockId);
     if (!block) return;
     const refined = await refineSection(block.contentSummary, feedback, `Урок: ${lesson.title}`, selectedModel, getCurrentToneInstruction(), { temperature });
     updateBlockProp(moduleId, lessonId, blockId, 'contentSummary', refined);
  };

  const handleRegenerateBlockContent = async (moduleId: string, lessonId: string, blockId: string, feedback: string) => {
    if (!concept) return;
    const lesson = concept.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
    const block = lesson?.blocks?.find(b => b.id === blockId);
    const context = `Course: ${concept.title}. Lesson: ${lesson?.title}. Block: ${block?.title}. Summary: ${block?.contentSummary}`;
    const refined = await refineSection(block?.fullContent || "", feedback, context, selectedModel, getCurrentToneInstruction(), { temperature, useSearch });
    // Also reset error if it was error state
    const newModules = concept.modules.map(m => m.id !== moduleId ? m : { ...m, lessons: m.lessons.map(l => l.id !== lessonId ? l : { ...l, blocks: l.blocks?.map(b => b.id === blockId ? { ...b, fullContent: refined, isError: false } : b) }) });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleRegenerateSpecificBlock = async (moduleId: string, lessonId: string, blockId: string) => {
     if (!concept) return;
     const lesson = concept.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
     const block = lesson?.blocks?.find(b => b.id === blockId);
     if (!block) return;
     setIsGenerating(true);
     try {
       const updatedBlocks = await generateFullLessonContent(concept, lesson.title, [block], selectedModel, getCurrentToneInstruction(), { temperature, useSearch });
       if (updatedBlocks[0]) {
         updateBlockProp(moduleId, lessonId, blockId, 'fullContent', updatedBlocks[0].fullContent);
         updateBlockProp(moduleId, lessonId, blockId, 'isError', updatedBlocks[0].isError);
       }
     } catch (e: any) { alert(e.message); } finally { setIsGenerating(false); }
  };

  const handleMoveBlock = (moduleId: string, lessonId: string, index: number, direction: 'up' | 'down') => {
    if (!concept) return;
    const newModules = concept.modules.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: m.lessons.map(l => {
          if (l.id !== lessonId) return l;
          const blocks = [...(l.blocks || [])];
          if (direction === 'up' && index > 0) [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
          else if (direction === 'down' && index < blocks.length - 1) [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
          return { ...l, blocks };
        })
      };
    });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleDeleteBlock = (moduleId: string, lessonId: string, blockId: string) => {
    if (!concept || !confirm("Удалить этот блок?")) return;
    const newModules = concept.modules.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: m.lessons.map(l => l.id !== lessonId ? l : { ...l, blocks: l.blocks?.filter(b => b.id !== blockId) }) };
    });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleAddBlock = (moduleId: string, lessonId: string, index: number, blockData: {type: BlockType, title: string, summary: string}) => {
    if (!concept) return;
    const newBlock: LessonBlock = {
      id: `manual-${Date.now()}`,
      type: blockData.type,
      title: blockData.title,
      contentSummary: blockData.summary || "Описание отсутствует",
      fullContent: undefined
    };
    const newModules = concept.modules.map(m => {
       if (m.id !== moduleId) return m;
       return { ...m, lessons: m.lessons.map(l => {
           if (l.id !== lessonId) return l;
           const currentBlocks = l.blocks || [];
           const updatedBlocks = [...currentBlocks];
           updatedBlocks.splice(index, 0, newBlock);
           return { ...l, blocks: updatedBlocks };
         })
       };
    });
    updateCurrentConcept({ ...concept, modules: newModules });
  };

  const handleGenerateAllCourseContent = async () => {
    if (!concept || !confirm("Это может занять много времени. Сгенерировать контент для ВСЕХ уроков?")) return;
    setIsGenerating(true);
    let totalLessons = 0;
    let processedCount = 0;
    let generatedCount = 0;
    concept.modules.forEach(m => totalLessons += m.lessons.length);
    try {
      for (const mod of concept.modules) {
        for (const lesson of mod.lessons) {
           processedCount++;
           const hasBlocks = lesson.blocks && lesson.blocks.length > 0;
           const isDone = hasBlocks && lesson.blocks!.every(b => !!b.fullContent && !b.isError);
           
           if (hasBlocks && !isDone) {
              setGenerationStatus(`Генерация: ${lesson.title} (${processedCount}/${totalLessons})`);
              const updatedBlocks = await generateFullLessonContent(concept, lesson.title, lesson.blocks!, selectedModel, getCurrentToneInstruction(), { temperature, useSearch });
              setConcept(prev => {
                if (!prev) return null;
                const newModules = prev.modules.map(m => m.id !== mod.id ? m : { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, blocks: updatedBlocks } : l) });
                const newConcept = { ...prev, modules: newModules };
                const existingHistory = JSON.parse(localStorage.getItem('cw_history') || '[]');
                const historyWithoutCurrent = existingHistory.filter((h: any) => h.title !== prev.title);
                localStorage.setItem('cw_history', JSON.stringify([newConcept, ...historyWithoutCurrent])); 
                return newConcept;
              });
              generatedCount++;
           }
        }
      }
      if (generatedCount === 0) alert("Все уроки уже содержат контент.");
    } catch (e: any) { alert("Генерация прервана: " + e.message); } finally { setIsGenerating(false); setGenerationStatus(null); }
  };

  // --- Render ---

  if (step === AppStep.INPUT) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative">
         <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white">
              <MenuIcon />
            </button>
         </div>

         <MenuDrawer 
            isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
            theme={theme} setTheme={setTheme}
            selectedModel={selectedModel} onModelChange={handleModelChange}
            params={params} setParams={setParams}
            temperature={temperature} setTemperature={setTemperature}
            useSearch={useSearch} setUseSearch={setUseSearch}
            history={history} currentConcept={concept}
            onLoadHistory={loadFromHistory} onDeleteHistory={handleDeleteHistoryItem}
            isStructureApproved={false} isGenerating={isGenerating} generationStatus={generationStatus}
            onGenerateAll={() => {}} onNewCourse={() => {}}
         />
         
         <InputForm 
            params={params} setParams={setParams}
            selectedModel={selectedModel} isGenerating={isGenerating}
            error={error} onGenerate={handleGenerateConcept}
            uploadedFileNames={uploadedFileNames} onFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
         />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative">
      <MenuDrawer 
        isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
        theme={theme} setTheme={setTheme}
        selectedModel={selectedModel} onModelChange={handleModelChange}
        params={params} setParams={setParams}
        temperature={temperature} setTemperature={setTemperature}
        useSearch={useSearch} setUseSearch={setUseSearch}
        history={history} currentConcept={concept}
        onLoadHistory={loadFromHistory} onDeleteHistory={handleDeleteHistoryItem}
        isStructureApproved={isStructureApproved} isGenerating={isGenerating} generationStatus={generationStatus}
        onGenerateAll={handleGenerateAllCourseContent} 
        onNewCourse={() => { setConcept(null); setStep(AppStep.INPUT); setIsMenuOpen(false); }}
      />
      
      {/* Sidebar: Only render when structure is approved */}
      <div className={`hidden md:block transition-all duration-300 flex-shrink-0 ${isStructureApproved ? 'w-80' : 'w-0'}`}>
         {concept && isStructureApproved && <Sidebar concept={concept} activePage={activePage} setActivePage={setActivePage} onOpenMenu={() => setIsMenuOpen(true)} />}
      </div>
      
      <main className={`flex-1 flex flex-col items-center transition-all duration-300 w-full relative`}>
         {/* Top controls for Concept Phase (when Sidebar is hidden) */}
         {!isStructureApproved && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                 {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
               </button>
               <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                 <MenuIcon />
               </button>
            </div>
         )}

         {/* Mobile Header (Visible only when structure is approved and on mobile) */}
         {isStructureApproved && (
           <div className="md:hidden w-full p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
              <span className="font-bold truncate px-2">{concept?.title}</span>
              <button onClick={() => setIsMenuOpen(true)}><MenuIcon /></button>
           </div>
         )}
         
         {activePage === 'concept' && concept ? (
            <ConceptView 
               concept={concept}
               isStructureApproved={isStructureApproved}
               isGenerating={isGenerating}
               structureContextFiles={structureContextFiles}
               imageInputRef={imageInputRef}
               structureFileInputRef={structureFileInputRef}
               onExport={handleExport}
               onManualImageUpload={handleManualImageUpload}
               onGenerateCover={handleGenerateCover}
               onDownloadImage={handleDownloadImage}
               onUpdateSection={updateConceptSection}
               onRegenerateSection={regenerateConceptSection}
               onStructureFileUpload={handleStructureFileUpload}
               onApproveStructure={handleApproveStructure}
               onGenerateAllCourseContent={handleGenerateAllCourseContent}
               onAddModule={handleAddModule}
               onMoveModule={handleMoveModule}
               onDeleteModule={handleDeleteModule}
               onAddLessonAt={handleAddLessonAt}
               onMoveLesson={handleMoveLesson}
               onDeleteLesson={handleDeleteLesson}
               onGenerateLessons={handleGenerateLessons}
               onGenerateBlocks={handleGenerateBlocks}
               onEditLesson={(mId, lId) => setActivePage({ moduleId: mId, lessonId: lId })}
            />
         ) : null}

         {typeof activePage !== 'string' && concept && (
            (() => {
                const module = concept.modules.find(m => m.id === activePage.moduleId);
                const lesson = module?.lessons.find(l => l.id === activePage.lessonId);
                if (module && lesson) {
                    return (
                        <LessonView 
                            module={module}
                            lesson={lesson}
                            isGenerating={isGenerating}
                            onGenerateFullContent={() => handleGenerateFullContent(module.id, lesson.id)}
                            onRegenerateBlock={(blockId) => handleRegenerateSpecificBlock(module.id, lesson.id, blockId)}
                            onMoveBlock={(idx, dir) => handleMoveBlock(module.id, lesson.id, idx, dir)}
                            onDeleteBlock={(blockId) => handleDeleteBlock(module.id, lesson.id, blockId)}
                            onUpdateBlockContent={(blockId, val) => updateBlockProp(module.id, lesson.id, blockId, 'fullContent', val)}
                            onUpdateBlockSummary={(blockId, val) => updateBlockProp(module.id, lesson.id, blockId, 'contentSummary', val)}
                            onRegenerateBlockContentAI={(blockId, fb) => handleRegenerateBlockContent(module.id, lesson.id, blockId, fb)}
                            onRegenerateBlockSummaryAI={(blockId, fb) => handleRegenerateBlockSummary(module.id, lesson.id, blockId, fb)}
                            onAddBlock={(idx, data) => handleAddBlock(module.id, lesson.id, idx, data)}
                        />
                    );
                }
                return null;
            })()
         )}
      </main>

      {isGenerating && generationStatus && (
         <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-fade-in-up max-w-sm">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent shrink-0"></div>
            <div className="flex-1 min-w-0">
               <div className="text-sm font-bold text-orange-400 mb-0.5">AI работает...</div>
               <div className="text-xs text-slate-300 truncate">{generationStatus || "Генерация..."}</div>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
