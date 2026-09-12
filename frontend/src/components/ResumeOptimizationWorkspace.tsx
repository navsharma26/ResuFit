'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RotateCcw,
  FileText,
  Clock,
  Lightbulb,
  ShieldCheck,
  Flame,
  Layers,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { RecalculateScoreResult } from './types';
import { ResumeVersionHistory } from './ResumeVersionHistory';

interface ResumeOptimizationWorkspaceProps {
  jobDescription: string;
  initialResumeText?: string;
  defaultChunks?: string[];
}

export const ResumeOptimizationWorkspace: React.FC<ResumeOptimizationWorkspaceProps> = ({
  jobDescription,
  initialResumeText = '',
  defaultChunks = []
}) => {
  // Combine defaultChunks into initial text if not explicitly provided
  const getInitialText = () => {
    if (initialResumeText.trim()) return initialResumeText;
    if (defaultChunks.length > 0) return defaultChunks.join('\n\n');
    return `- Architected scalable backend microservices using Express and TypeScript.\n- Redesigned core financial database using PostgreSQL, improving SQL query latency by 42% (sub-45ms).\n- Containerized applications using Docker and deployed to AWS ECS.`;
  };

  const [resumeText, setResumeText] = useState<string>(getInitialText);
  const [scoreResult, setScoreResult] = useState<RecalculateScoreResult | null>(null);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deltaAnimation, setDeltaAnimation] = useState<'positive' | 'negative' | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastScoreRef = useRef<number | undefined>(undefined);
  const animFrameRef = useRef<number | null>(null);

  // Sync if default chunks change (e.g. user selected a new preset)
  useEffect(() => {
    if (defaultChunks.length > 0) {
      const combined = defaultChunks.join('\n\n');
      setResumeText(combined);
      triggerScoreCalculation(combined, undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultChunks]);

  // Initial calculation
  useEffect(() => {
    triggerScoreCalculation(resumeText, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smooth number tweening for displayScore
  useEffect(() => {
    if (!scoreResult) return;

    const target = scoreResult.match_score;
    const start = displayScore;
    if (start === target) return;

    const duration = 400; // ms
    const startTime = performance.now();

    const updateScoreTween = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * ease);

      setDisplayScore(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateScoreTween);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateScoreTween);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scoreResult?.match_score]);

  // Fast In-Memory Recalculation API Call
  const triggerScoreCalculation = async (textToScore: string, prevScore?: number) => {
    if (!jobDescription.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/recalculate-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: textToScore,
          job_description: jobDescription,
          previous_score: prevScore ?? lastScoreRef.current
        })
      });

      if (res.ok) {
        const data: RecalculateScoreResult = await res.json();
        setScoreResult(data);

        // Track delta animation
        if (data.score_delta > 0) {
          setDeltaAnimation('positive');
          setTimeout(() => setDeltaAnimation(null), 2500);
        } else if (data.score_delta < 0) {
          setDeltaAnimation('negative');
          setTimeout(() => setDeltaAnimation(null), 2500);
        }

        lastScoreRef.current = data.match_score;
      }
    } catch (err) {
      console.error('Real-time score recalculation error:', err);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  // Handle live textarea change with 250ms debounce
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setResumeText(val);
    setIsTyping(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerScoreCalculation(val, lastScoreRef.current);
    }, 250);
  };

  // Helper actions
  const handleInsertBullet = () => {
    const template = `\n• Architected high-throughput microservices in Node.js, reducing processing latency by 35% under peak load.`;
    const updated = resumeText + template;
    setResumeText(updated);
    triggerScoreCalculation(updated, lastScoreRef.current);
  };

  const handleInsertKeyword = (keyword: string) => {
    const template = `\n• Implemented production workflows utilizing ${keyword} to ensure high availability and scalability.`;
    const updated = resumeText + template;
    setResumeText(updated);
    triggerScoreCalculation(updated, lastScoreRef.current);
  };

  const handleResetToPresets = () => {
    const original = defaultChunks.join('\n\n');
    setResumeText(original);
    triggerScoreCalculation(original, lastScoreRef.current);
  };

  // Text metrics
  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
  const charCount = resumeText.length;
  const bulletCount = resumeText.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*')).length;

  // Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981'; // Emerald
    if (score >= 50) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  const getTierLabel = (score: number) => {
    if (score >= 80) return 'Top Tier Match';
    if (score >= 65) return 'Strong Contender';
    if (score >= 50) return 'Moderate Alignment';
    return 'Critical Skill Deficits';
  };

  const scoreColor = getScoreColor(displayScore);

  return (
    <section className="resume-workspace-section" id="interactive-resume-workspace">
      {/* Workspace Header */}
      <div className="workspace-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="workspace-badge">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Optimization Workspace</span>
          </div>
          <div className="sync-latency-pill">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>
              {isTyping ? 'Syncing...' : scoreResult?.latency_ms ? `In-Memory Calc: ${scoreResult.latency_ms}ms` : 'Sub-10ms Live Engine'}
            </span>
          </div>
        </div>

        <h2 className="workspace-title">Real-Time Resume Scorecard & Live Editor</h2>
        <p className="workspace-subtitle">
          Fine-tune your resume bullets in the live editor on the left. The hybrid scoring engine recalculates keyword overlap, mandatory coverage, and metric density instantly on every keystroke.
        </p>
      </div>

      {/* Split-Screen Interface */}
      <div className="split-workspace-grid">
        {/* Left Panel: Editable Resume Text Panel */}
        <div className="editor-card">
          <div className="editor-card-header">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" />
              <span className="editor-title">Resume Bullets & Experience Editor</span>
            </div>

            {/* Live Typing Indicator */}
            <div className="flex items-center gap-2">
              <div className={`live-pulse-dot ${isTyping ? 'active' : ''}`} />
              <span className="text-xs text-neutral-400">
                {isTyping ? 'Recalculating score...' : 'Score synced'}
              </span>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="editor-toolbar">
            <button
              onClick={handleInsertBullet}
              className="toolbar-btn"
              title="Add a high-impact quantified bullet template"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Impact Bullet Template</span>
            </button>

            {defaultChunks.length > 0 && (
              <button
                onClick={handleResetToPresets}
                className="toolbar-btn"
                title="Reset editor text to selected preset chunks"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reset to Preset</span>
              </button>
            )}

            <a
              href="#resume-version-history"
              className="toolbar-btn text-purple-300 hover:text-purple-200 ml-auto"
              title="View saved iterations and score evolution"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>Version History</span>
            </a>
          </div>

          {/* Editable Textarea */}
          <div className="editor-textarea-wrapper">
            <textarea
              id="interactive-resume-editor"
              className="editor-textarea"
              value={resumeText}
              onChange={handleTextChange}
              placeholder="Paste or write your resume experience bullets here... (e.g. '• Architected microservices with TypeScript and Docker, reducing latency by 42%')"
              rows={14}
            />
          </div>

          {/* Editor Footer Metrics */}
          <div className="editor-footer">
            <div className="editor-stats">
              <span><strong>{bulletCount}</strong> bullets</span>
              <span>•</span>
              <span><strong>{wordCount}</strong> words</span>
              <span>•</span>
              <span><strong>{charCount}</strong> chars</span>
            </div>
            <span className="editor-hint">
              💡 Type missing skills below to watch your match score jump!
            </span>
          </div>
        </div>

        {/* Right Panel: Live Dynamic Scorecard */}
        <div className="scorecard-panel">
          {/* Panel Top Header */}
          <div className="scorecard-panel-header">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Live Match Scorecard</span>
            </div>

            {/* Score Delta Pill */}
            {scoreResult && scoreResult.score_delta !== 0 && (
              <div
                className={`delta-badge ${scoreResult.score_delta > 0 ? 'delta-positive' : 'delta-negative'} ${deltaAnimation ? 'delta-pulse' : ''}`}
                id="live-score-delta-badge"
              >
                {scoreResult.score_delta > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{scoreResult.score_delta} pts</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{scoreResult.score_delta} pts</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center Radial SVG Gauge */}
          <div className="live-gauge-container">
            <svg className="radial-svg" width="160" height="160" viewBox="0 0 160 160">
              <circle
                className="radial-bg"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="12"
              />
              <circle
                className="radial-progress-animated"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                stroke={scoreColor}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="live-gauge-content">
              <span className="live-gauge-number" style={{ color: scoreColor }}>
                {displayScore}
              </span>
              <span className="live-gauge-unit">/ 100</span>
              <span className="live-gauge-tier" style={{ color: scoreColor }}>
                {getTierLabel(displayScore)}
              </span>
            </div>
          </div>

          {/* Breakdown Progress Bars */}
          <div className="live-metrics-bars">
            {/* Mandatory Coverage */}
            <div className="live-metric-row">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Mandatory Skills Coverage
                </span>
                <span className="font-bold text-white">
                  {scoreResult?.mandatory_coverage_pct ?? 0}%
                </span>
              </div>
              <div className="metric-bar-track">
                <div
                  className="metric-bar-fill bg-emerald-500"
                  style={{ width: `${scoreResult?.mandatory_coverage_pct ?? 0}%` }}
                />
              </div>
            </div>

            {/* Keyword Overlap */}
            <div className="live-metric-row">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Keyword Overlap Rate
                </span>
                <span className="font-bold text-white">
                  {scoreResult?.keyword_overlap_pct ?? 0}%
                </span>
              </div>
              <div className="metric-bar-track">
                <div
                  className="metric-bar-fill bg-blue-500"
                  style={{ width: `${scoreResult?.keyword_overlap_pct ?? 0}%` }}
                />
              </div>
            </div>

            {/* Metric & Impact Density */}
            <div className="live-metric-row">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 flex items-center gap-1.5 font-medium">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Quantified Impact Density
                </span>
                <span className="font-bold text-white">
                  {scoreResult?.impact_density_score ?? 0}%
                </span>
              </div>
              <div className="metric-bar-track">
                <div
                  className="metric-bar-fill bg-purple-500"
                  style={{ width: `${scoreResult?.impact_density_score ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Keyword Chips Section */}
          <div className="chips-section">
            {/* Matched Keywords */}
            {scoreResult && scoreResult.matched_keywords.length > 0 && (
              <div className="mb-3">
                <div className="chips-label text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Matched in Resume ({scoreResult.matched_keywords.length}):</span>
                </div>
                <div className="chips-wrap">
                  {scoreResult.matched_keywords.map((kw, idx) => (
                    <span key={idx} className="matched-chip">
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords with Quick-Add Click */}
            {scoreResult && scoreResult.missing_keywords.length > 0 && (
              <div>
                <div className="chips-label text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>Missing High-Impact Skills (Click to inject):</span>
                </div>
                <div className="chips-wrap">
                  {scoreResult.missing_keywords.slice(0, 8).map((kw, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInsertKeyword(kw)}
                      className="missing-chip"
                      title={`Click to insert a bullet featuring ${kw}`}
                    >
                      + {kw}
                      <ArrowUpRight className="w-2.5 h-2.5 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real-Time Detected Impact & Verbs */}
          {scoreResult && (scoreResult.metrics_detected.length > 0 || scoreResult.action_verbs_detected.length > 0) && (
            <div className="detected-impact-box">
              <span className="text-xs font-semibold text-neutral-300 block mb-1">
                Verified Quantitative Proof:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scoreResult.metrics_detected.map((m, idx) => (
                  <span key={idx} className="metric-tag">
                    📈 {m}
                  </span>
                ))}
                {scoreResult.action_verbs_detected.map((v, idx) => (
                  <span key={idx} className="verb-tag">
                    ⚡ {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Dynamic Suggestions */}
          {scoreResult?.suggestions && scoreResult.suggestions.length > 0 && (
            <div className="live-suggestions-box">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Real-Time Optimization Tips:</span>
              </div>
              <ul className="suggestions-list">
                {scoreResult.suggestions.slice(0, 3).map((s, idx) => (
                  <li key={idx} className="suggestion-item">
                    <span>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Resume Versioning & Score Evolution History Section */}
      <ResumeVersionHistory
        currentText={resumeText}
        currentScore={displayScore}
        jobId="active_job"
        userId="candidate_1"
        onRestoreVersion={(restoredContent) => {
          setResumeText(restoredContent);
          triggerScoreCalculation(restoredContent, lastScoreRef.current);
          const editor = document.getElementById('interactive-resume-editor');
          if (editor) {
            editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
            editor.focus();
          }
        }}
      />
    </section>
  );
};
