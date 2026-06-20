import { Type, Schema } from "@google/genai";

// Schema for Course Concept
export const courseConceptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Название курса (Макс 64 символа, продающее)" },
    shortDescription: { type: Type.STRING, description: "Краткое описание для карточки курса" },
    level: { type: Type.STRING, description: "Начинающий / Продолжающий / Продвинутый" },
    workload: { type: Type.STRING, description: "Например: 4 часа в неделю" },
    learningOutcomes: { type: Type.STRING, description: "HTML список (<ul>). Чему научатся студенты." },
    aboutCourse: { type: Type.STRING, description: "HTML текст. Подробное описание." },
    targetAudience: { type: Type.STRING, description: "HTML текст. Опишите сегменты ЦА." },
    requirements: { type: Type.STRING, description: "HTML текст. Начальные требования." },
    process: { type: Type.STRING, description: "HTML текст. Как проходит обучение." },
    whatYouGet: { type: Type.STRING, description: "HTML список (<ul>). Что получает студент." },
    syllabus: { type: Type.STRING, description: "HTML текст с программой курса." }
  },
  required: ["title", "shortDescription", "level", "learningOutcomes", "aboutCourse", "syllabus"]
};

const blockSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["text", "video", "quiz_choice", "matching", "sorting", "open_answer"] },
    title: { type: Type.STRING },
    contentSummary: { type: Type.STRING }
  },
  required: ["type", "title", "contentSummary"]
};

// Schema for Detailed Structure (Modules -> Lessons -> Blocks)
export const courseStructureSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      lessons: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            blocks: {
              type: Type.ARRAY,
              items: blockSchema
            }
          },
          required: ["title", "blocks"]
        }
      }
    },
    required: ["title", "lessons"]
  }
};

// Schema for Lessons Array (Module generation)
export const lessonArraySchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      blocks: {
        type: Type.ARRAY,
        items: blockSchema
      }
    },
    required: ["title", "blocks"]
  }
};

// Schema for Blocks Array (Lesson generation)
export const lessonBlocksSchema: Schema = {
  type: Type.ARRAY,
  items: blockSchema
};

// Schema for Content Generation results
export const contentGenerationSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      fullContent: { type: Type.STRING }
    },
    required: ["fullContent"]
  }
};
