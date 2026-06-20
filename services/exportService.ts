import { CourseConcept, Module, Lesson, LessonBlock } from "../types";

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Advanced HTML to Text/Markdown converter
const htmlToText = (html: string) => {
  if (!html) return "";
  
  let text = html
    // 1. Line Breaks
    .replace(/<br\s*\/?>/gi, '\n')
    
    // 2. Paragraphs: End with double newline
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '') // Remove start p tag
    
    // 3. Lists: The main fix for double dashes
    // We only add the dash at the START of the LI. We ignore the closing LI.
    .replace(/<li[^>]*>/gi, '\n- ') 
    .replace(/<\/li>/gi, '') 
    
    // Remove ul/ol wrappers (they just add noise in simple md)
    .replace(/<\/?ul[^>]*>/gi, '')
    .replace(/<\/?ol[^>]*>/gi, '')
    
    // 4. Headers to Markdown
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    
    // 5. Bold/Italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // 6. Strip remaining tags
    .replace(/<[^>]+>/g, '')
    
    // 7. Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  // 8. Cleanup Whitespace
  // Replace multiple newlines (3 or more) with just 2 (standard paragraph break)
  // This fixes the "three spaces" issue
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
};

export const generateMarkdown = (course: CourseConcept): string => {
  // Obsidian hierarchy fix:
  // # Course Title (H1)
  // ## Module (H2)
  // ### Lesson (H3)
  // #### Block/Step (H4)

  let md = `# ${course.title}\n\n`;
  
  if (course.coverImage) {
    md += `![Course Cover](cover.png)\n\n*(Обложка сохранена как base64 в данных, при экспорте в файл здесь может потребоваться ссылка)*\n\n`;
  }
  
  md += `**Краткое описание:** ${course.shortDescription}\n\n`;
  md += `**Уровень:** ${course.level} | **Нагрузка:** ${course.workload}\n\n`;

  md += `## О курсе\n${htmlToText(course.aboutCourse)}\n\n`;
  md += `## Чему вы научитесь\n${htmlToText(course.learningOutcomes)}\n\n`;
  md += `## Для кого этот курс\n${htmlToText(course.targetAudience)}\n\n`;
  md += `## Начальные требования\n${htmlToText(course.requirements)}\n\n`;
  md += `## Как проходит обучение\n${htmlToText(course.process)}\n\n`;
  md += `## Что вы получаете\n${htmlToText(course.whatYouGet)}\n\n`;
  
  md += `## Программа курса (Syllabus)\n${htmlToText(course.syllabus)}\n\n`;

  md += `---\n\n## ДЕТАЛЬНЫЙ КОНТЕНТ КУРСА\n\n`;

  course.modules.forEach((mod, i) => {
    md += `## ${i + 1}. ${mod.title}\n\n`; // H2 for Modules
    mod.lessons.forEach(lesson => {
      md += `### ${lesson.title}\n`; // H3 for Lessons
      md += `> ${lesson.description}\n\n`;
      
      if (lesson.blocks && lesson.blocks.length > 0) {
        lesson.blocks.forEach((block, idx) => {
          md += `#### Шаг ${idx + 1}: ${block.title} (${block.type.toUpperCase()})\n\n`; // H4 for Blocks
          if (block.fullContent) {
             md += `${htmlToText(block.fullContent)}\n\n`;
          } else {
             md += `*Сценарий:* ${htmlToText(block.contentSummary)}\n\n`;
          }
          md += `---\n\n`;
        });
      } else {
        md += `*(Контент еще не сгенерирован)*\n\n`;
      }
    });
  });

  return md;
};

export const generateHTML = (course: CourseConcept): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${course.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        h1 { color: #4338ca; }
        h2 { color: #1e1b4b; border-bottom: 2px solid #e0e7ff; padding-bottom: 0.5rem; margin-top: 2rem; }
        .meta { background: #eff6ff; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
        .module { background: #f8fafc; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
        .lesson { margin-left: 1rem; }
        .tag { background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .cover { width: 100%; height: auto; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      </style>
    </head>
    <body>
      <h1>${course.title}</h1>
      ${course.coverImage ? `<img src="${course.coverImage}" class="cover" alt="Course Cover" />` : ''}
      
      <div class="meta">
         <p><strong>Краткое описание:</strong> ${course.shortDescription}</p>
         <p><strong>Уровень:</strong> ${course.level} | <strong>Нагрузка:</strong> ${course.workload}</p>
      </div>

      <h2>О курсе</h2>
      <div>${course.aboutCourse}</div>
      
      <h2>Чему вы научитесь</h2>
      <div>${course.learningOutcomes}</div>
      
      <h2>Для кого</h2>
      <div>${course.targetAudience}</div>
      
      <h2>Требования</h2>
      <div>${course.requirements}</div>

      <h2>Процесс</h2>
      <div>${course.process}</div>
      
      <h2>Что вы получаете</h2>
      <div>${course.whatYouGet}</div>
      
      <h2>Программа</h2>
      <div>${course.syllabus}</div>
      
      <hr style="margin: 3rem 0; border: 0; border-top: 1px solid #eee;">
      
      <h2>Детальный контент</h2>
      ${course.modules.map(mod => `
        <div class="module">
          <h3>${mod.title}</h3>
          ${mod.lessons.map(lesson => `
             <div class="lesson">
                <h4>${lesson.title}</h4>
                <p><em>${lesson.description}</em></p>
                ${lesson.blocks?.map(block => `
                   <div style="margin-bottom: 1.5rem; border-left: 3px solid #4338ca; padding-left: 1rem;">
                      <span class="tag">${block.type}</span> <strong>${block.title}</strong>
                      <div style="margin-top: 0.5rem">
                         ${block.fullContent || `<em>${block.contentSummary}</em>`}
                      </div>
                   </div>
                `).join('')}
             </div>
          `).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;
};