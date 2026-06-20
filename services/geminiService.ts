import { GoogleGenAI, Tool, Part } from "@google/genai";
import { CourseConcept, CourseGenerationParams, LessonBlock, Module, Lesson } from "../types";
import { 
  TONE_DESCRIPTIONS, 
  getConceptPrompt, 
  getStructurePrompt, 
  getModuleLessonsPrompt, 
  getLessonBlocksPrompt, 
  getRefinePrompt, 
  getFullContentPrompt, 
  getImagePrompt 
} from "./prompts";
import { 
  courseConceptSchema, 
  courseStructureSchema, 
  lessonArraySchema, 
  lessonBlocksSchema, 
  contentGenerationSchema 
} from "./schemas";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey });

// Helper: Upload file to Gemini Files API with robust MIME type handling
const uploadFileToGemini = async (file: File): Promise<{ uri: string, mimeType: string }> => {
  // Normalize MIME type
  let mimeType = file.type;
  
  // Force text/plain for Markdown to avoid "Unsupported MIME type" errors (400)
  if (
      mimeType === 'text/x-markdown' || 
      mimeType === 'text/markdown' || 
      file.name.toLowerCase().endsWith('.md') ||
      file.name.toLowerCase().endsWith('.mdx')
  ) {
      mimeType = 'text/plain';
  } 
  // Default to text/plain if type is missing (common for some code files)
  else if (!mimeType) {
      mimeType = 'text/plain';
  }

  try {
     const uploadResponse = await ai.files.upload({
        file: file,
        config: { 
           displayName: file.name,
           mimeType: mimeType 
        }
     });
     
     // Handle SDK response structure safely
     // Depending on SDK version, the file object might be nested under `file` or returned directly
     const response: any = uploadResponse;
     const uri = response.file?.uri || response.uri;
     
     if (!uri) throw new Error("Upload failed: No URI returned");

     return { uri, mimeType };
  } catch (e) {
     console.warn("File API upload failed", e);
     throw e;
  }
};

// Helper to extract JSON more robustly
const extractAndParseJSON = (text: string) => {
  try { return JSON.parse(text); } catch (e) {}

  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try { return JSON.parse(match[1]); } catch (e) {}
  }

  const firstOpen = text.indexOf('{');
  const firstArray = text.indexOf('[');
  
  const isArray = firstArray !== -1 && (firstOpen === -1 || firstArray < firstOpen);
  const startIdx = isArray ? firstArray : firstOpen;
  
  if (startIdx !== -1) {
    let balance = 0;
    let inString = false;
    let escape = false;
    const openChar = isArray ? '[' : '{';
    const closeChar = isArray ? ']' : '}';

    for (let i = startIdx; i < text.length; i++) {
      const char = text[i];
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      
      if (!inString) {
        if (char === openChar) balance++;
        else if (char === closeChar) {
          balance--;
          if (balance === 0) {
            try { return JSON.parse(text.substring(startIdx, i + 1)); } catch (e) {}
            break; 
          }
        }
      }
    }
  }

  const lastClose = text.lastIndexOf(isArray ? ']' : '}');
  if (startIdx !== -1 && lastClose !== -1 && lastClose > startIdx) {
      try { return JSON.parse(text.substring(startIdx, lastClose + 1)); } catch (e) { /* ignore */ }
  }

  throw new Error("Не удалось обработать ответ ИИ (JSON Parsing failed).");
};

interface GenConfig {
  temperature?: number;
  useSearch?: boolean;
}

const getTools = (useSearch?: boolean): Tool[] | undefined => {
  if (useSearch) {
    return [{ googleSearch: {} }];
  }
  return undefined;
};

// 1. Generate Course Concept
export const generateCourseConcept = async (params: CourseGenerationParams, modelName: string, config?: GenConfig): Promise<CourseConcept> => {
  const toneInstruction = params.tone === 'custom' 
    ? params.customTone 
    : (TONE_DESCRIPTIONS[params.tone] || params.tone);
  
  const prompt = getConceptPrompt(params, toneInstruction || "");

  // Prepare content parts
  const contents: any[] = [{ text: prompt }];

  // Upload files if present
  if (params.files && params.files.length > 0) {
    // Process files sequentially to get URIs
    for (const file of params.files) {
        try {
            const { uri, mimeType } = await uploadFileToGemini(file);
            contents.push({
                fileData: { mimeType: mimeType, fileUri: uri }
            });
        } catch (e) {
            console.error(`Failed to upload ${file.name}`, e);
            // If upload fails, try to read as text fallback if small enough? 
            // For now, simply skip to prevent blocking the whole generation.
        }
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents, // Pass array of Parts
      config: { 
        responseMimeType: "application/json", 
        responseSchema: courseConceptSchema,
        maxOutputTokens: 65536,
        temperature: config?.temperature,
        tools: getTools(config?.useSearch)
      }
    });

    if (!response.text) throw new Error("No response");
    const raw = extractAndParseJSON(response.text);

    return {
      title: raw.title || "Новый курс",
      shortDescription: raw.shortDescription || "",
      level: raw.level || "Начинающий",
      workload: raw.workload || "2-3 часа в неделю",
      learningOutcomes: raw.learningOutcomes || "",
      aboutCourse: raw.aboutCourse || "",
      targetAudience: raw.targetAudience || "",
      requirements: raw.requirements || "",
      process: raw.process || "",
      whatYouGet: raw.whatYouGet || "",
      syllabus: raw.syllabus || "",
      modules: [] 
    };
  } catch (e: any) {
    throw new Error("Ошибка создания концепции: " + e.message);
  }
};

// 2. Generate Detailed Structure
export const generateDetailedCourseStructure = async (syllabusText: string, context: string, modelName: string, config?: GenConfig): Promise<Module[]> => {
  const prompt = getStructurePrompt(syllabusText, context);

  try {
     const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: courseStructureSchema,
        maxOutputTokens: 65536,
        temperature: config?.temperature
      }
    });
    
    const raw = extractAndParseJSON(response.text || "[]");
    if (!Array.isArray(raw)) throw new Error("Invalid structure (not an array)");

    return raw.map((m: any, i: number) => ({
      id: `m-${i}`,
      title: m.title || `Модуль ${i+1}`,
      description: m.description || "",
      lessons: (m.lessons || []).map((l: any, j: number) => ({
        id: `m-${i}-l-${j}`,
        title: l.title || `Урок ${j+1}`,
        description: l.description || "",
        blocks: (l.blocks || []).map((b: any, k: number) => ({
           id: `m-${i}-l-${j}-b-${k}`,
           type: b.type || 'text',
           title: b.title || 'Блок',
           contentSummary: b.contentSummary || "Описание отсутствует",
           fullContent: undefined 
        }))
      }))
    }));
  } catch (e: any) {
    throw new Error("Не удалось создать структуру блоков: " + e.message);
  }
};

// 2.1 Generate Lessons for a specific Module (Granular)
export const generateLessonsForModule = async (moduleTitle: string, courseContext: string, modelName: string, config?: GenConfig): Promise<Lesson[]> => {
  const prompt = getModuleLessonsPrompt(moduleTitle, courseContext);

   try {
     const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: lessonArraySchema,
        maxOutputTokens: 65536,
        temperature: config?.temperature
      }
    });
    
    const raw = extractAndParseJSON(response.text || "[]");
    if (!Array.isArray(raw)) throw new Error("Not an array");

    return raw.map((l: any, j: number) => ({
        id: `gen-l-${Date.now()}-${j}`,
        title: l.title || `Урок ${j+1}`,
        description: l.description || "",
        blocks: (l.blocks || []).map((b: any, k: number) => ({
           id: `gen-b-${Date.now()}-${k}`,
           type: b.type || 'text',
           title: b.title || 'Блок',
           contentSummary: b.contentSummary || "Описание отсутствует",
           fullContent: undefined 
        }))
    }));
  } catch (e: any) {
    throw new Error("Не удалось сгенерировать уроки: " + e.message);
  }
};

// 2.2 Generate Blocks for a specific Lesson (Granular)
export const generateBlocksForLesson = async (lessonTitle: string, courseContext: string, modelName: string, config?: GenConfig): Promise<LessonBlock[]> => {
  const prompt = getLessonBlocksPrompt(lessonTitle, courseContext);

   try {
     const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: lessonBlocksSchema,
        maxOutputTokens: 65536,
        temperature: config?.temperature
      }
    });
    
    const raw = extractAndParseJSON(response.text || "[]");
    if (!Array.isArray(raw)) throw new Error("Not an array");

    return raw.map((b: any, k: number) => ({
           id: `gen-b-${Date.now()}-${k}`,
           type: b.type || 'text',
           title: b.title || 'Блок',
           contentSummary: b.contentSummary || "Описание отсутствует",
           fullContent: undefined 
    }));
  } catch (e: any) {
    throw new Error("Не удалось сгенерировать блоки: " + e.message);
  }
};

// 3. Refine text
export const refineSection = async (current: string, feedback: string, context: string, modelName: string, toneInstruction: string = "", config?: GenConfig): Promise<string> => {
  const prompt = getRefinePrompt(current, feedback, context, toneInstruction);
  const res = await ai.models.generateContent({ 
    model: modelName, 
    contents: prompt,
    config: {
      temperature: config?.temperature,
      tools: getTools(config?.useSearch)
    }
  });
  return res.text || current;
};

// Process content to replace <IMAGE_PROMPT> tags with actual images
const processContentImages = async (html: string): Promise<string> => {
    const regex = /<IMAGE_PROMPT>(.*?)<\/IMAGE_PROMPT>/g;
    let match;
    let newHtml = html;
    const replacements: {original: string, replacement: string}[] = [];

    while ((match = regex.exec(html)) !== null) {
        const fullTag = match[0];
        const prompt = match[1];
        
        try {
            const imageUrl = await generateCourseCoverImage(prompt, "infographic, detailed, clean vector art", "16:9"); 
            if (imageUrl) {
                replacements.push({
                    original: fullTag,
                    replacement: `<img src="${imageUrl}" alt="${prompt}" class="my-4 rounded-lg shadow-md w-full border border-slate-200 dark:border-slate-700" />`
                });
            } else {
                 replacements.push({ original: fullTag, replacement: `<!-- Image gen failed for: ${prompt} -->` });
            }
        } catch (e) {
             console.error("Failed inline image gen", e);
             replacements.push({ original: fullTag, replacement: `<!-- Image Error: ${prompt} -->` });
        }
    }

    for (const rep of replacements) {
        newHtml = newHtml.replace(rep.original, rep.replacement);
    }
    
    return newHtml;
}


// 4. Generate Full Content
export const generateFullLessonContent = async (course: CourseConcept, lessonTitle: string, blocks: LessonBlock[], modelName: string, toneInstruction: string = "", config?: GenConfig): Promise<LessonBlock[]> => {
  const blocksJson = JSON.stringify(blocks.map(b => ({ type: b.type, title: b.title, summary: b.contentSummary })));
  const prompt = getFullContentPrompt(course, lessonTitle, blocksJson, toneInstruction);

  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: contentGenerationSchema,
        maxOutputTokens: 65536,
        temperature: config?.temperature,
        tools: getTools(config?.useSearch)
      }
    });
    
    const rawResults = extractAndParseJSON(res.text || "[]");
    
    if (!Array.isArray(rawResults)) throw new Error("Not an array");

    const processedBlocks = await Promise.all(blocks.map(async (block, idx) => {
      const generated = rawResults[idx];
      let content = generated?.fullContent;
      let isError = false;

      if (!content || content.trim().length < 10) {
         content = ""; 
         isError = true;
      } else {
         content = await processContentImages(content);
      }

      return {
        ...block,
        fullContent: content,
        isError: isError
      };
    }));

    return processedBlocks;

  } catch (e: any) {
    console.error(e);
    throw new Error("Не удалось сгенерировать материалы урока: " + e.message);
  }
};

// 5. Generate Course Cover Image
export const generateCourseCoverImage = async (topic: string, styleDescription: string = "modern, minimalist, educational", ratio: string = "16:9"): Promise<string | undefined> => {
  try {
    const prompt = getImagePrompt(topic, styleDescription);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: ratio === "16:9" ? "16:9" : "4:3", 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (e: any) {
    console.error("Image gen error:", e);
    return undefined;
  }
};