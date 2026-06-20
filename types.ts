
export type BlockType = 
  | 'text' 
  | 'video' 
  | 'quiz_choice' 
  | 'sorting'
  | 'matching'
  | 'open_answer';

export interface LessonBlock {
  id: string;
  type: BlockType;
  title: string;
  contentSummary: string; // Brief description of what should be in this block
  fullContent?: string; // The generated full HTML content (initially undefined)
  isError?: boolean; // Flag to track generation failures
}

export interface Lesson {
  id: string;
  title: string;
  description: string; 
  blocks?: LessonBlock[]; 
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface CourseConcept {
  // Stepik Fields
  title: string; // Название (Max 64)
  shortDescription: string; // Краткое описание (100-512)
  level: string; // Уровень
  workload: string; // Нагрузка
  learningOutcomes: string; // Чему вы научитесь
  aboutCourse: string; // О курсе (Detailed)
  targetAudience: string; // Для кого этот курс
  requirements: string; // Начальные требования
  process: string; // Как проходит обучение
  whatYouGet: string; // Что вы получаете
  
  // Internal
  syllabus: string; 
  modules: Module[]; 
  coverImage?: string; 
}

export interface CourseGenerationParams {
  topic: string;
  audience: string;
  tone: string; 
  customTone?: string;
  additionalInfo?: string;
  files: File[]; // Store actual File objects for API upload
}

export enum AppStep {
  INPUT = 'INPUT',
  EDITOR = 'EDITOR', 
}

export type SectionKey = keyof Pick<CourseConcept, 'shortDescription' | 'level' | 'workload' | 'learningOutcomes' | 'aboutCourse' | 'targetAudience' | 'requirements' | 'process' | 'whatYouGet' | 'syllabus'>;