import express, { Request, Response } from 'express';
import multer from 'multer';
// @ts-ignore
import pdfParseModule from 'pdf-parse';

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // 1. pdf-parse v2 (Class-based API)
  if (typeof (pdfParseModule as any).PDFParse === 'function') {
    try {
      const parser = new (pdfParseModule as any).PDFParse({ data: buffer });
      const res = await parser.getText();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      if (res && typeof res.text === 'string' && res.text.trim().length > 0) {
        return res.text;
      }
    } catch (err) {
      console.warn('PDFParse class failed, falling back to function:', err);
    }
  }

  // 2. pdf-parse v1 (Function-based API)
  if (typeof (pdfParseModule as any) === 'function') {
    try {
      const res = await (pdfParseModule as any)(buffer);
      if (res && typeof res.text === 'string') {
        return res.text;
      }
    } catch (err) {
      console.warn('pdfParse function failed:', err);
    }
  }

  if (typeof (pdfParseModule as any).default === 'function') {
    try {
      const res = await (pdfParseModule as any).default(buffer);
      if (res && typeof res.text === 'string') {
        return res.text;
      }
    } catch (err) {
      console.warn('pdfParse default failed:', err);
    }
  }

  // 3. Fallback: extract printable stream text from buffer
  const raw = buffer.toString('utf-8');
  const matches = raw.match(/\(([^()]{2,})\)/g);
  if (matches && matches.length > 5) {
    return matches.map(m => m.slice(1, -1)).join(' ');
  }

  return raw;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export interface ResumeDiagnostic {
  to_improve: string[];
  to_discard: string[];
  strengths: string[];
  word_count: number;
  bullet_count: number;
  char_count: number;
  has_metrics: boolean;
}

export function analyzeResumeDiagnostics(text: string): ResumeDiagnostic {
  const to_improve: string[] = [];
  const to_discard: string[] = [];
  const strengths: string[] = [];

  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  // Detect bullets
  const bulletLines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'));
  const bulletCount = bulletLines.length;

  // Detect metrics (numbers, %, $, ms, etc.)
  const metricRegex = /(\d+%\b|\$\d+[\d,.]*[kmb]?\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:ms|sec|x|users|clients|tps|req\/s))/gi;
  const metricsFound = text.match(metricRegex) || [];
  const hasMetrics = metricsFound.length >= 3;

  if (hasMetrics) {
    strengths.push(`Strong quantitative evidence: Detected ${metricsFound.length} measurable metrics (e.g., ${metricsFound.slice(0, 3).join(', ')}).`);
  } else {
    to_improve.push('Add quantified metrics to your bullet points (e.g., % improvement, revenue generated, scale of users, latency reduction).');
  }

  // Detect Action Verbs
  const strongVerbs = ['architected', 'spearheaded', 'engineered', 'optimized', 'automated', 'streamlined', 'deployed', 'orchestrated', 'benchmarked'];
  const verbsFound = strongVerbs.filter(v => lower.includes(v));
  if (verbsFound.length >= 2) {
    strengths.push(`Active leadership phrasing: Uses impactful verbs like "${verbsFound.slice(0, 3).join(', ')}".`);
  } else {
    to_improve.push('Begin each bullet with high-impact action verbs (e.g., "Architected", "Engineered", "Optimized") instead of passive phrasing.');
  }

  // Fluff & Cliches to Discard
  const cliches = [
    { phrase: 'team player', reason: 'Overused subjective buzzword; replace with specific collaborative projects.' },
    { phrase: 'hard working', reason: 'Assumed baseline; show work ethic through shipped deliverables and scope.' },
    { phrase: 'hardworking', reason: 'Subjective claim; replace with tangible accomplishments.' },
    { phrase: 'self-starter', reason: 'Generic filler; demonstrate autonomy with self-directed features or optimizations.' },
    { phrase: 'references available upon request', reason: 'Outdated convention that takes up valuable resume real estate; modern recruiters request references separately.' },
    { phrase: 'duties included', reason: 'Passive job description copy; change to active accomplishment bullets.' },
    { phrase: 'responsible for', reason: 'Focus on outcomes and impact rather than mere responsibilities.' },
    { phrase: 'results-driven', reason: 'Show the actual numbers and results rather than stating you are results-driven.' }
  ];

  cliches.forEach(c => {
    if (lower.includes(c.phrase)) {
      to_discard.push(`Discard phrase "${c.phrase}": ${c.reason}`);
    }
  });

  // Outdated or non-ATS sections
  if (lower.includes('marital status') || lower.includes('date of birth') || lower.includes('nationality')) {
    to_discard.push('Discard personal demographic details (birth date, marital status, nationality) which violate modern hiring standards and ATS best practices.');
  }

  if (lower.includes('objective:') || lower.includes('career objective')) {
    to_discard.push('Replace generic "Career Objective" with a punchy "Professional Summary" or "Technical Highlights" section targeted at the role.');
  }

  // Length check
  if (wordCount > 900) {
    to_discard.push(`Resume length is high (${wordCount} words). Condense or discard older roles (>7-10 years ago) to keep the resume tightly focused on 1-2 pages.`);
  } else if (wordCount < 150) {
    to_improve.push('Resume is quite brief. Add more depth to recent work experience, technical stack details, and project accomplishments.');
  }

  // Structure suggestions
  if (!lower.includes('experience') && !lower.includes('employment') && !lower.includes('work history')) {
    to_improve.push('Clearly demarcate a "Professional Experience" or "Work History" section with company name, job title, and dates.');
  }

  if (!lower.includes('skills') && !lower.includes('technologies') && !lower.includes('tech stack')) {
    to_improve.push('Include a dedicated "Skills & Technologies" section categorized by Languages, Frameworks, Cloud, and Tools for faster ATS indexing.');
  }

  return {
    to_improve,
    to_discard,
    strengths,
    word_count: wordCount,
    bullet_count: bulletCount,
    char_count: charCount,
    has_metrics: hasMetrics
  };
}

export function splitIntoChunks(fullText: string): string[] {
  const lines = fullText.split('\n');
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  const sectionHeaders = [
    /^(?:summary|profile|professional summary|about me)/i,
    /^(?:experience|work experience|employment history|professional experience)/i,
    /^(?:skills|technical skills|technologies|competencies)/i,
    /^(?:projects|key projects|architecture projects)/i,
    /^(?:education|certifications|credentials)/i
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = sectionHeaders.some(rx => rx.test(trimmed));

    if (isHeader && currentChunk.length > 5) {
      chunks.push(currentChunk.join('\n').trim());
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    const remaining = currentChunk.join('\n').trim();
    if (remaining) {
      chunks.push(remaining);
    }
  }

  // Fallback if no clean sections found
  if (chunks.length <= 1 && fullText.length > 800) {
    const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 2) {
      return paragraphs;
    }
  }

  return chunks.length > 0 ? chunks : [fullText];
}

const router = express.Router();

// POST /api/upload-resume
router.post('/', upload.single('resume_file'), async (req: Request, res: Response): Promise<void> => {
  try {
    let extractedText = '';
    let fileName = 'pasted_text';

    if (req.file) {
      fileName = req.file.originalname;
      const mimeType = req.file.mimetype;

      if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        extractedText = await parsePdfBuffer(req.file.buffer);
      } else {
        // Plain text, markdown, csv, json, rtf
        extractedText = req.file.buffer.toString('utf-8');
      }
    } else if (req.body.resume_text) {
      extractedText = req.body.resume_text;
      fileName = req.body.file_name || 'raw_text_input';
    } else {
      res.status(400).json({
        error: 'Missing file or text',
        message: 'Please provide either a multipart resume_file or JSON resume_text.'
      });
      return;
    }

    if (!extractedText.trim()) {
      res.status(400).json({
        error: 'Empty resume content',
        message: 'The uploaded file or text contained no readable text.'
      });
      return;
    }

    const diagnostics = analyzeResumeDiagnostics(extractedText);
    const chunks = splitIntoChunks(extractedText);

    res.status(200).json({
      success: true,
      file_name: fileName,
      character_count: extractedText.length,
      extracted_text: extractedText,
      chunks,
      diagnostics
    });
  } catch (error: any) {
    console.error('Error processing resume file upload:', error);
    res.status(500).json({
      error: 'Upload Error',
      message: error?.message || 'Failed to extract text from resume file'
    });
  }
});

// GET /api/upload-resume (Documentation endpoint)
router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    endpoint: '/api/upload-resume',
    method: 'POST',
    description: 'Upload a PDF, TXT, or Markdown resume file to extract text, divide into chunks, and receive immediate What-to-Improve vs What-to-Discard diagnostics.',
    supported_formats: ['PDF (.pdf)', 'Plain Text (.txt)', 'Markdown (.md)', 'Rich Text (.rtf)'],
    parameters: [
      { name: 'resume_file', type: 'multipart/form-data File', required: false, description: 'The binary PDF or text file' },
      { name: 'resume_text', type: 'string (JSON)', required: false, description: 'Raw resume text if not uploading a file' }
    ]
  });
});

export default router;
