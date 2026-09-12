import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gapAnalysisRouter from './routes/gapAnalysis.js';
import coverLetterRouter from './routes/coverLetter.js';
import recalculateScoreRouter from './routes/recalculateScore.js';
import resumeVersionsRouter from './routes/resumeVersions.js';
import uploadResumeRouter from './routes/uploadResume.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ResuFit AI Engine Backend',
    routes: ['/api/gap-analysis', '/api/cover-letter', '/api/recalculate-score', '/api/resume-versions', '/api/upload-resume'],
    openai_configured: Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key'))
  });
});

// Mount routes
app.use('/api/gap-analysis', gapAnalysisRouter);
app.use('/api/cover-letter', coverLetterRouter);
app.use('/api/recalculate-score', recalculateScoreRouter);
app.use('/api/resume-versions', resumeVersionsRouter);
app.use('/api/upload-resume', uploadResumeRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'Unknown error occurred'
  });
});

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 ResuFit Express Backend running on http://localhost:${PORT}`);
    console.log(`📡 Gap Analysis Route active at: http://localhost:${PORT}/api/gap-analysis`);
    console.log(`📝 Cover Letter Route active at: http://localhost:${PORT}/api/cover-letter`);
    console.log(`⚡ Score Recalculate Route active at: http://localhost:${PORT}/api/recalculate-score`);
    console.log(`💾 Resume Versions Route active at: http://localhost:${PORT}/api/resume-versions`);
    console.log(`🔑 OpenAI Key status: ${process.env.OPENAI_API_KEY ? 'Present (gpt-4o-mini active)' : 'Not detected (running in intelligent fallback mode)'}`);
  });
}

export default app;
