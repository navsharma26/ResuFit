'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Terminal,
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
  HelpCircle,
  LayoutDashboard,
  UploadCloud,
  CheckCircle2,
  Sliders,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { GapAnalysisMatrix } from '../components/GapAnalysisMatrix';
import { GapAnalysisResult } from '../components/types';
import { CoverLetterGenerator } from '../components/CoverLetterGenerator';
import { ResumeOptimizationWorkspace } from '../components/ResumeOptimizationWorkspace';
import { ResumeFileUploader } from '../components/ResumeFileUploader';
import { MatchScoreCard } from '../components/MatchScoreCard';

type ActiveView = 'all' | 'matrix' | 'optimizer' | 'cover-letter' | 'ingestion';

interface Preset {
  id: string;
  name: string;
  role: string;
  desc: string;
  jobDescription: string;
  resumeChunks: string[];
}

const PRESETS: Preset[] = [
  {
    id: 'fullstack-ts',
    name: 'Senior Full-Stack Engineer',
    role: 'TypeScript, React & Node.js',
    desc: 'Demonstrates strong language & framework match with cloud gap',
    jobDescription: `Job Title: Senior Full-Stack Engineer (TypeScript/Node.js/React)

Minimum Qualifications & Mandatory Technical Skills:
- 5+ years of experience with TypeScript and modern JavaScript (ES6+).
- Strong proficiency in Node.js and Express for scalable REST API microservices.
- Proven expertise in React and modern state management.
- Production experience with relational databases (PostgreSQL or MySQL), query optimization, and schema migrations.
- Hands-on experience containerizing applications using Docker.
- Required: Working experience with AWS cloud services (ECS, S3, RDS).

Preferred & Nice-to-Haves:
- Experience with Next.js App Router and server-side rendering.
- Hands-on cluster management with Kubernetes (k8s) and Helm.
- Familiarity with Redis caching and message queues (RabbitMQ / Kafka).
- Experience setting up automated CI/CD pipelines with GitHub Actions.`,
    resumeChunks: [
      `Navneet Sharma - Staff Software Engineer
Summary: Results-oriented Full-Stack Engineer with 6+ years specializing in TypeScript, Node.js, and React architecture. Passionate about performant cloud-native backend systems and intuitive web applications.`,
      `Work Experience:
Lead Backend Developer @ FinTech Velocity (2022 - Present)
- Architected and deployed 12+ RESTful microservices using Express and TypeScript, processing $40M+ in daily transaction volume.
- Redesigned core financial ledger using PostgreSQL, improving complex SQL query response times by 42% through indexing and connection pooling.
- Containerized entire microservice fleet using Docker and automated deployment workflows to AWS ECS and RDS with AWS S3 storage for compliance records.`,
      `Frontend & Architecture Projects:
ResuFit – AI Career Readiness & Requirement Gap Engine | Live: https://frontend-drab-five-38.vercel.app | GitHub: https://github.com/navsharma26/ResuFit
- Architected an end-to-end AI career readiness engine using Next.js 14, TypeScript, Express, PostgreSQL, Prisma, and Docker.
- Implemented LLM-powered evidence gap verification and practical skill action plans with ATS scoring alignment.
- Containerized microservices and configured cloud deployment across Render and Vercel with reverse proxy API routing.
- Integrated Redis caching layers for rate-limiting and session synchronization across distributed worker instances.`
    ]
  },
  {
    id: 'ai-engineer',
    name: 'AI / LLM Systems Engineer',
    role: 'Python, RAG & Vector DBs',
    desc: 'Highlights AI pipeline competencies and specialized gaps',
    jobDescription: `Job Title: Senior AI / LLM Systems Engineer

Core Mandatory Skills:
- 4+ years of Python engineering in production environments.
- Deep hands-on experience orchestrating Large Language Models (OpenAI API, Anthropic, open weights).
- Proven track record implementing RAG (Retrieval-Augmented Generation) architectures and vector embeddings.
- Experience with Vector Databases such as Pinecone, Qdrant, or pgvector.
- Strong knowledge of FastAPI or Express for serving low-latency inference endpoints.
- Required: Docker containerization for AI model runtime environments.

Bonus / Nice-to-Have:
- Experience fine-tuning open-source models (Llama 3, Mistral) using LoRA / QLoRA.
- Orchestration frameworks like LangChain or LlamaIndex.
- Kubernetes deployment for distributed GPU worker pools.`,
    resumeChunks: [
      `Priya Patel - Machine Learning Engineer
Profile: AI Systems builder with 4 years building LLM-powered applications, semantic search pipelines, and scalable APIs in Python.`,
      `Experience @ Cognition Labs (2023 - Present)
- Built enterprise RAG pipeline utilizing OpenAI API (gpt-4o and text-embedding-3-large) for enterprise document Q&A across 500,000+ internal documents.
- Benchmarked and deployed pgvector and Pinecone vector databases, achieving sub-45ms cosine similarity lookup speeds.
- Packaged multi-tenant inference services into Docker containers and served via FastAPI and Node.js microservices.`,
      `Skills & Frameworks:
Languages: Python, JavaScript, TypeScript, SQL
AI Tools: OpenAI Node/Python SDK, LangChain, Vector Embeddings, HuggingFace
Infrastructure: Docker, PostgreSQL, Redis, Git, Linux`
    ]
  },
  {
    id: 'devops-cloud',
    name: 'DevOps & Cloud Architect',
    role: 'AWS, Terraform & Kubernetes',
    desc: 'Simulates cloud infrastructure evaluation and missing tooling',
    jobDescription: `Job Title: Lead DevOps & Cloud Infrastructure Engineer

Required Mandatory Skills:
- 5+ years managing AWS cloud infrastructure at enterprise scale.
- Advanced Infrastructure as Code (IaC) with Terraform and AWS CloudFormation.
- Production management of Kubernetes (EKS) clusters, ingress controllers, and service meshes.
- Strong scripting skills in Python or Bash.
- CI/CD automation expertise using GitLab CI or GitHub Actions.
- Required: Deep understanding of Docker and container security scanning.

Nice-to-Haves:
- Experience with Prometheus, Grafana, and Datadog observability stacks.
- HashiCorp Vault for secrets management.
- Experience with Golang for custom Kubernetes operators.`,
    resumeChunks: [
      `Jordan Hayes - Cloud Operations Engineer
Profile: Cloud and infrastructure specialist with 5 years managing AWS environments, automating deployments, and maintaining 99.99% uptime.`,
      `Experience @ CloudScale Systems (2021 - Present)
- Architected enterprise AWS VPC networks across multi-region configurations, managing EC2, S3, Route53, and IAM security policies.
- Automated CI/CD pipelines via GitHub Actions, decreasing release cycle from 3 days to 25 minutes.
- Containerized legacy applications using Docker with integrated vulnerability scans in pipeline.
- Authored automation scripts in Python and Bash for automated failover and database backups.`,
      `Tooling & Certifications:
AWS Certified Solutions Architect - Associate
Monitoring: Prometheus & Grafana alerting dashboards
Tools: Docker, AWS CLI, Linux Administration, Python, Bash, Git`
    ]
  }
];

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [jobDescription, setJobDescription] = useState<string>(PRESETS[0].jobDescription);
  const [resumeChunks, setResumeChunks] = useState<string[]>(PRESETS[0].resumeChunks);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GapAnalysisResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isCloud, setIsCloud] = useState<boolean>(false);

  // Check backend health on mount
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    ) {
      setIsCloud(true);
    }

    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    }
    checkHealth();
  }, []);

  // Preset switch
  const handleSelectPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setJobDescription(preset.jobDescription);
    setResumeChunks([...preset.resumeChunks]);
    setAnalysisResult(null);
    setError(null);
  };

  // Apply uploaded resume to state
  const handleApplyUploadedResume = async (_extractedText: string, chunks: string[]) => {
    const validChunks = chunks.length > 0 ? chunks : [_extractedText];
    setResumeChunks(validChunks);
    setSelectedPresetId('custom-uploaded');
    setError(null);

    // Automatically run gap analysis with the newly uploaded chunks
    await handleRunAnalysis(validChunks);
  };

  // Add a new empty chunk
  const handleAddChunk = () => {
    setResumeChunks(prev => [...prev, '']);
  };

  // Remove chunk
  const handleRemoveChunk = (index: number) => {
    setResumeChunks(prev => prev.filter((_, i) => i !== index));
  };

  // Update chunk text
  const handleUpdateChunk = (index: number, val: string) => {
    setResumeChunks(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Execute Gap Analysis via Express Backend API
  const handleRunAnalysis = async (overrideChunks?: string[] | unknown) => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    const chunksToUse = Array.isArray(overrideChunks) && overrideChunks.length > 0 ? overrideChunks : resumeChunks;
    const validChunks = chunksToUse.filter(c => c.trim().length > 0);
    if (validChunks.length === 0) {
      setError('Please provide at least one non-empty resume chunk.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_chunks: validChunks
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${res.status}`);
      }

      const data: GapAnalysisResult = await res.json();
      setAnalysisResult(data);

      // Smooth scroll to results if on all view
      if (activeView === 'all') {
        setTimeout(() => {
          const target = document.getElementById('analysis-results-section');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Gap analysis request failed:', err);
      setError(err.message || 'Failed to analyze requirements. Ensure Express backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial analysis automatically so user sees instant preview
  useEffect(() => {
    handleRunAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      {/* ====================================================================
          PERSISTENT OBSIDIAN LEFT SIDEBAR (CoverCraft style)
          ==================================================================== */}
      <aside className="app-sidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="sidebar-brand-icon">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">ResuFit</span>
              <span className="sidebar-brand-subtitle">AI REQ ENGINE</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="sidebar-section-label">WORKSPACE MODULES</div>
        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveView('all')}
            className={`sidebar-nav-item ${activeView === 'all' ? 'active' : ''}`}
            title="Complete End-to-End Command Center"
          >
            <LayoutDashboard className="w-4 h-4 nav-icon" />
            <span>Dashboard</span>
            <span className="sidebar-badge">ALL</span>
          </button>

          <button
            onClick={() => setActiveView('matrix')}
            className={`sidebar-nav-item ${activeView === 'matrix' ? 'active' : ''}`}
            title="Requirement Gap Analysis Matrix"
          >
            <Activity className="w-4 h-4 nav-icon" />
            <span>Gap Analysis</span>
            {analysisResult && (
              <span className="sidebar-badge">{analysisResult.match_score}%</span>
            )}
          </button>

          <button
            onClick={() => setActiveView('optimizer')}
            className={`sidebar-nav-item ${activeView === 'optimizer' ? 'active' : ''}`}
            title="Live Bullet Optimizer & Score Calibration"
          >
            <Zap className="w-4 h-4 nav-icon" />
            <span>Live Optimizer</span>
          </button>

          <button
            onClick={() => setActiveView('cover-letter')}
            className={`sidebar-nav-item ${activeView === 'cover-letter' ? 'active' : ''}`}
            title="AI Tailored Cover Letter Studio"
          >
            <FileText className="w-4 h-4 nav-icon" />
            <span>Cover Letter</span>
          </button>

          <button
            onClick={() => setActiveView('ingestion')}
            className={`sidebar-nav-item ${activeView === 'ingestion' ? 'active' : ''}`}
            title="Resume Upload & Parsing Diagnostics"
          >
            <UploadCloud className="w-4 h-4 nav-icon" />
            <span>Resume Ingestion</span>
          </button>
        </nav>

        {/* Sidebar Footer with Profile */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar-circle">NS</div>
            <div className="user-info-text">
              <span className="user-name">Navneet Sharma</span>
              <span className="user-plan">PRO CANDIDATE</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          MAIN APP CANVAS (Obsidian Canvas + Modern Header)
          ==================================================================== */}
      <div className="app-main">
        {/* Sticky Top Header Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <div className="top-nav-breadcrumb">
              <span className="crumb-brand">ResuFit Engine</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">
                {activeView === 'all' && 'All-in-One Dashboard'}
                {activeView === 'matrix' && 'Requirement Gap Analysis Matrix'}
                {activeView === 'optimizer' && 'Live Bullet Optimizer & Score Calibration'}
                {activeView === 'cover-letter' && 'Tailored Cover Letter Studio'}
                {activeView === 'ingestion' && 'Resume Ingestion & Parsing Diagnostics'}
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            {/* Backend Status indicator */}
            <div className="header-status-badge" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              <div className={`pulse-dot ${backendStatus === 'offline' ? 'bg-amber-500' : ''}`} />
              <span>
                Backend:{' '}
                <strong className="text-white">
                  {backendStatus === 'online'
                    ? isCloud
                      ? 'Online (Render Cloud)'
                      : 'Online (Port 5001)'
                    : backendStatus === 'offline'
                    ? 'Connecting...'
                    : 'Checking...'}
                </strong>
              </span>
            </div>

            {/* Signature Crisp Solid White CTA */}
            <button
              onClick={() => handleRunAnalysis()}
              disabled={loading}
              className="btn-covercraft-white"
              id="top-run-analysis-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 spin-icon" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Analysis</span>
                </>
              )}
            </button>

            {/* Profile Avatar */}
            <div className="user-avatar-circle" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
              NS
            </div>
          </div>
        </header>

        {/* View Switching Tab Strip */}
        <div className="view-tabs-strip">
          <button
            onClick={() => setActiveView('all')}
            className={`view-tab-btn ${activeView === 'all' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>All-in-One View</span>
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`view-tab-btn ${activeView === 'matrix' ? 'active' : ''}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Requirement Gap Matrix</span>
          </button>
          <button
            onClick={() => setActiveView('optimizer')}
            className={`view-tab-btn ${activeView === 'optimizer' ? 'active' : ''}`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Live Optimizer</span>
          </button>
          <button
            onClick={() => setActiveView('cover-letter')}
            className={`view-tab-btn ${activeView === 'cover-letter' ? 'active' : ''}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cover Letter Studio</span>
          </button>
          <button
            onClick={() => setActiveView('ingestion')}
            className={`view-tab-btn ${activeView === 'ingestion' ? 'active' : ''}`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Resume Ingestion</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="main-content-scroll">
          {/* ================================================================
              VIEW: MATRIX OR ALL (Job Description, Chunks, Presets, Results)
              ================================================================ */}
          {(activeView === 'all' || activeView === 'matrix') && (
            <section id="gap-analysis-section" className="mb-10">
              {/* Presets Scenario Selector */}
              <div className="macos-window-card">
                <div className="macos-window-header">
                  <div className="macos-dots">
                    <span className="macos-dot red" />
                    <span className="macos-dot yellow" />
                    <span className="macos-dot green" />
                    <span className="macos-tag ml-2">resufit.engine/presets/calibrated-scenarios</span>
                  </div>
                  <span className="text-xs text-neutral-400">Select Test Scenario or Customize Below</span>
                </div>

                <div className="p-4 bg-[#11141d]">
                  <div className="preset-buttons-grid">
                    {PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`preset-btn ${selectedPresetId === preset.id ? 'active' : ''}`}
                      >
                        <div className="preset-btn-icon">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="preset-btn-name">{preset.name}</div>
                          <div className="preset-btn-desc">{preset.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Split Layout: Target Job Description & Chunked Resume */}
              <div className="input-grid mb-6">
                {/* Left Card: Target Job Description */}
                <div className="input-card">
                  <div className="input-card-header">
                    <div className="input-card-title">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Target Job Description</span>
                    </div>
                    <span className="input-badge">{jobDescription.length} chars</span>
                  </div>
                  <textarea
                    className="textarea-field"
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste target job description including mandatory requirements and nice-to-haves..."
                  />
                </div>

                {/* Right Card: Resume Chunks */}
                <div className="input-card">
                  <div className="input-card-header">
                    <div className="input-card-title">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Resume Chunks ({resumeChunks.length})</span>
                    </div>
                    <span className="input-badge">Chunked Ingestion</span>
                  </div>

                  <div className="chunks-list">
                    {resumeChunks.map((chunk, idx) => (
                      <div key={idx} className="chunk-card">
                        <div className="chunk-card-header">
                          <span>Resume Chunk #{idx + 1}</span>
                          {resumeChunks.length > 1 && (
                            <button
                              onClick={() => handleRemoveChunk(idx)}
                              className="text-neutral-400 hover:text-rose-400 p-0.5"
                              title="Delete chunk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          className="chunk-textarea"
                          value={chunk}
                          onChange={e => handleUpdateChunk(idx, e.target.value)}
                          placeholder={`Enter text content for Resume Chunk #${idx + 1}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleAddChunk} className="add-chunk-btn">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Resume Chunk</span>
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="action-bar gap-4 flex-wrap mb-8">
                <button
                  onClick={() => handleRunAnalysis()}
                  disabled={loading}
                  className="btn-covercraft-white text-sm px-6 py-3"
                  id="run-analysis-button"
                  style={{ fontSize: '0.95rem' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 spin-icon" />
                      <span>Analyzing Requirements with gpt-4o-mini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Requirement Gap Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveView('optimizer')}
                  className="btn-covercraft-secondary text-sm px-4 py-3"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Open Live Optimizer</span>
                </button>

                <button
                  onClick={() => setActiveView('cover-letter')}
                  className="btn-covercraft-secondary text-sm px-4 py-3"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Open Cover Letter Studio</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              {/* Gap Analysis Results & Score Card */}
              {analysisResult && (
                <div id="analysis-results-section" className="space-y-6">
                  <div className="macos-window-card">
                    <div className="macos-window-header">
                      <div className="macos-dots">
                        <span className="macos-dot red" />
                        <span className="macos-dot yellow" />
                        <span className="macos-dot green" />
                        <span className="macos-tag ml-2">resufit.engine/matches/score-calibration</span>
                      </div>
                      <span className="text-xs text-neutral-400">Evaluated with OpenAI gpt-4o-mini</span>
                    </div>
                    <div className="p-4 bg-[#11141d]">
                      <MatchScoreCard data={analysisResult} />
                    </div>
                  </div>

                  <div className="macos-window-card">
                    <div className="macos-window-header">
                      <div className="macos-dots">
                        <span className="macos-dot red" />
                        <span className="macos-dot yellow" />
                        <span className="macos-dot green" />
                        <span className="macos-tag ml-2">resufit.engine/matches/gap-matrix</span>
                      </div>
                      <span className="text-xs text-neutral-400">Clause Alignment & Evidence Verification</span>
                    </div>
                    <div className="p-4 bg-[#11141d]">
                      <GapAnalysisMatrix data={analysisResult} />
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================================================================
              VIEW: LIVE OPTIMIZER OR ALL (Workspace, Real-time Scoring, Versioning)
              ================================================================ */}
          {(activeView === 'all' || activeView === 'optimizer') && (
            <section id="interactive-resume-workspace" className="mb-10">
              <div className="macos-window-card">
                <div className="macos-window-header">
                  <div className="macos-dots">
                    <span className="macos-dot red" />
                    <span className="macos-dot yellow" />
                    <span className="macos-dot green" />
                    <span className="macos-tag ml-2">resufit.engine/workspace/live-optimizer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="macos-tag">Prisma + PostgreSQL Audit Trail</span>
                  </div>
                </div>
                <div className="p-4 bg-[#11141d]">
                  <ResumeOptimizationWorkspace
                    jobDescription={jobDescription}
                    defaultChunks={resumeChunks}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              VIEW: COVER LETTER STUDIO OR ALL (Multi-Persona Generation)
              ================================================================ */}
          {(activeView === 'all' || activeView === 'cover-letter') && (
            <section id="cover-letter-generator" className="mb-10">
              <div className="macos-window-card">
                <div className="macos-window-header">
                  <div className="macos-dots">
                    <span className="macos-dot red" />
                    <span className="macos-dot yellow" />
                    <span className="macos-dot green" />
                    <span className="macos-tag ml-2">resufit.engine/cover-letter/studio</span>
                  </div>
                  <span className="text-xs text-neutral-400">Role-Tailored Synthesis</span>
                </div>
                <div className="p-4 bg-[#11141d]">
                  <CoverLetterGenerator
                    jobDescription={jobDescription}
                    resumeChunks={resumeChunks}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              VIEW: RESUME INGESTION OR ALL (PDF / Docx Upload & Diagnostics)
              ================================================================ */}
          {(activeView === 'all' || activeView === 'ingestion') && (
            <section id="resume-uploader-section" className="mb-10">
              <div className="macos-window-card">
                <div className="macos-window-header">
                  <div className="macos-dots">
                    <span className="macos-dot red" />
                    <span className="macos-dot yellow" />
                    <span className="macos-dot green" />
                    <span className="macos-tag ml-2">resufit.engine/ingestion/parser-diagnostics</span>
                  </div>
                  <span className="text-xs text-neutral-400">PDF & Word Ingestion + Discard vs Improve</span>
                </div>
                <div className="p-4 bg-[#11141d]">
                  <ResumeFileUploader onApplyResume={handleApplyUploadedResume} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
