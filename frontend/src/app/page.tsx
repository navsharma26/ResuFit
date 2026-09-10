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
  ArrowRight
} from 'lucide-react';
import { GapAnalysisMatrix } from '../components/GapAnalysisMatrix';
import { GapAnalysisResult } from '../components/types';

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
      `Alex Rivera - Staff Software Engineer
Summary: Results-oriented Full-Stack Engineer with 6+ years specializing in TypeScript, Node.js, and React architecture. Passionate about performant cloud-native backend systems and intuitive web applications.`,
      `Work Experience:
Lead Backend Developer @ FinTech Velocity (2022 - Present)
- Architected and deployed 12+ RESTful microservices using Express and TypeScript, processing $40M+ in daily transaction volume.
- Redesigned core financial ledger using PostgreSQL, improving complex SQL query response times by 42% through indexing and connection pooling.
- Containerized entire microservice fleet using Docker and automated deployment workflows to AWS ECS and RDS with AWS S3 storage for compliance records.`,
      `Frontend & Architecture Projects:
- Spearheaded company-wide frontend redesign using React and TypeScript, implementing responsive component libraries and optimistic UI updates.
- Integrated Redis caching layers for rate-limiting and session synchronization across distributed worker instances.
- Mentored 5 junior engineers and instituted TypeScript strict-mode code review guidelines.`
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
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [jobDescription, setJobDescription] = useState<string>(PRESETS[0].jobDescription);
  const [resumeChunks, setResumeChunks] = useState<string[]>(PRESETS[0].resumeChunks);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GapAnalysisResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/gap-analysis');
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
  const handleRunAnalysis = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    const validChunks = resumeChunks.filter(c => c.trim().length > 0);
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

      // Smooth scroll to results
      setTimeout(() => {
        const target = document.getElementById('analysis-results-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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
    <main className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div>
          <div className="brand-badge">
            <Cpu className="w-3.5 h-3.5" />
            <span>ResuFit AI Engine • Express + TypeScript + Next.js</span>
          </div>
          <h1 className="main-title">Requirement Gap Analysis Matrix</h1>
          <p className="main-subtitle">
            Cross-examine job requirements against candidate resume chunks using OpenAI{' '}
            <code className="text-blue-400">gpt-4o-mini</code> with structured JSON output. View
            instant match scoring, mandatory deficits, and evidence verification.
          </p>
        </div>

        <div className="header-status-badge">
          <div className={`pulse-dot ${backendStatus === 'offline' ? 'bg-amber-500' : ''}`} />
          <span>
            Backend API:{' '}
            <strong className="text-white">
              {backendStatus === 'online'
                ? 'Online (Port 5001)'
                : backendStatus === 'offline'
                ? 'Connecting...'
                : 'Checking...'}
            </strong>
          </span>
        </div>
      </header>

      {/* Preset Scenarios */}
      <section className="presets-section">
        <div className="presets-header">
          <span className="presets-title">
            <Terminal className="w-4 h-4 text-blue-400" />
            Select Industry Test Scenario or Customize Below
          </span>
          <span className="text-xs text-neutral-400">Click any preset to auto-load</span>
        </div>

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
      </section>

      {/* Inputs: Split Layout */}
      <div className="input-grid">
        {/* Left: Job Description */}
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

        {/* Right: Resume Chunks */}
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
      <div className="action-bar">
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="analyze-btn"
          id="run-analysis-button"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 spin-icon" />
              <span>Analyzing Requirements with gpt-4o-mini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Run Requirement Gap Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
          <strong>Analysis Error:</strong> {error}
        </div>
      )}

      {/* Results Section */}
      <div id="analysis-results-section">
        {analysisResult && (
          <section className="results-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Analysis Results & Competency Breakdown</span>
              </h2>
              {analysisResult.analyzed_at && (
                <span className="text-xs text-neutral-400">
                  Last updated: {new Date(analysisResult.analyzed_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Core Component: Visual Matrix / Checklist directly alongside Match Score */}
            <GapAnalysisMatrix data={analysisResult} />
          </section>
        )}
      </div>
    </main>
  );
}
