'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  CheckCircle2,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { ResumeVersionItem, ResumeVersionHistoryData } from './types';

interface ResumeVersionHistoryProps {
  currentText: string;
  currentScore: number;
  jobId?: string;
  userId?: string;
  onRestoreVersion: (content: string) => void;
}

export const ResumeVersionHistory: React.FC<ResumeVersionHistoryProps> = ({
  currentText,
  currentScore,
  jobId = 'default_job',
  userId = 'default_user',
  onRestoreVersion
}) => {
  const [historyData, setHistoryData] = useState<ResumeVersionHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch history from Express backend API
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resume-versions?userId=${encodeURIComponent(userId)}&jobId=${encodeURIComponent(jobId)}`);
      if (res.ok) {
        const data: ResumeVersionHistoryData = await res.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error('Failed to fetch resume version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, jobId]);

  // Save current version
  const handleSaveCurrentVersion = async () => {
    if (!currentText.trim()) return;

    setSaving(true);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/resume-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobId,
          content: currentText,
          matchScore: currentScore
        })
      });

      if (res.ok) {
        const saved: ResumeVersionItem = await res.json();
        setSaveSuccess(`Saved Iteration #${(historyData?.total ?? 0) + 1} with Score ${saved.matchScore}%!`);
        setTimeout(() => setSaveSuccess(null), 3500);
        await fetchHistory();
      }
    } catch (err) {
      console.error('Failed to save resume version:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete version
  const handleDeleteVersion = async (id: string) => {
    try {
      const res = await fetch(`/api/resume-versions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchHistory();
      }
    } catch (err) {
      console.error('Failed to delete version:', err);
    }
  };

  const stats = historyData?.stats;
  const versions = historyData?.versions || [];
  const scoreEvolution = historyData?.scoreEvolution || [];

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <section className="version-history-section" id="resume-version-history">
      {/* Header */}
      <div className="version-history-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="version-badge">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Prisma + PostgreSQL Versioning</span>
          </div>
          <div className="total-iterations-pill">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{versions.length} Iterations Tracked</span>
          </div>
        </div>

        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h2 className="version-title">Resume Score Evolution & Iteration History</h2>
            <p className="version-subtitle">
              Persist your resume drafts using PostgreSQL ORM (Prisma). Track how your keyword overlap and ATS match score evolved across consecutive revisions.
            </p>
          </div>

          <button
            onClick={handleSaveCurrentVersion}
            disabled={saving || !currentText.trim()}
            className="save-iteration-btn"
            id="save-current-version-btn"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>{saving ? 'Saving to Database...' : `Save Iteration (${currentScore}%)`}</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="mt-3 p-2.5 rounded-md bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* Score Evolution Progression Tracker */}
      {scoreEvolution.length > 0 && stats && (
        <div className="score-evolution-card">
          <div className="evolution-card-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-sm">Score Evolution Trajectory</span>
            </div>

            <div className="evolution-stats-pills">
              <div className="stat-pill">
                <span className="stat-label">Initial:</span>
                <span className="stat-val">{stats.initialScore}%</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Current:</span>
                <span className="stat-val font-bold text-white">{stats.currentScore}%</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Peak:</span>
                <span className="stat-val text-emerald-400">{stats.highestScore}%</span>
              </div>
              <div className={`delta-summary-pill ${stats.scoreDelta >= 0 ? 'pos' : 'neg'}`}>
                {stats.scoreDelta >= 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{stats.scoreDelta} pts gain</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{stats.scoreDelta} pts</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Progression Timeline */}
          <div className="evolution-stepper-container">
            <div className="evolution-stepper">
              {scoreEvolution.map((point, idx) => {
                const color = getScoreColor(point.score);
                const isLatest = idx === scoreEvolution.length - 1;
                return (
                  <React.Fragment key={point.versionId}>
                    <div className="stepper-node">
                      <div
                        className="stepper-circle"
                        style={{
                          borderColor: color,
                          background: isLatest ? `${color}30` : 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <span className="stepper-num" style={{ color }}>
                          {point.score}
                        </span>
                      </div>
                      <div className="stepper-meta">
                        <span className="stepper-label">Iter #{point.iteration}</span>
                        <span className="stepper-date">
                          {new Date(point.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {idx < scoreEvolution.length - 1 && (
                      <div className="stepper-line">
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Version Cards List */}
      <div className="version-list-container">
        {versions.length === 0 ? (
          <div className="empty-history-state">
            <Clock className="w-8 h-8 text-neutral-500 mb-2" />
            <h3 className="text-white font-semibold text-sm">No Resume Iterations Saved Yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mt-1">
              Edit your resume in the editor above and click <strong>&quot;Save Iteration&quot;</strong> to record revisions in PostgreSQL and view your score trajectory.
            </p>
          </div>
        ) : (
          <div className="version-grid">
            {versions.map((version, idx) => {
              const isExpanded = expandedId === version.id;
              const iterationNumber = versions.length - idx;
              const words = version.content.trim() ? version.content.trim().split(/\s+/).length : 0;
              const chars = version.content.length;
              const color = getScoreColor(version.matchScore);

              return (
                <div key={version.id} className="version-card">
                  <div className="version-card-main">
                    <div className="flex items-center gap-3">
                      <div
                        className="version-score-badge"
                        style={{ borderColor: color, color, background: `${color}18` }}
                      >
                        <span className="score-val">{version.matchScore}</span>
                        <span className="score-unit">/100</span>
                      </div>

                      <div>
                        <div className="version-card-title flex items-center gap-2">
                          <span>Iteration #{iterationNumber}</span>
                          {idx === 0 && <span className="latest-tag">Latest</span>}
                        </div>
                        <div className="version-card-timestamp flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{words} words</span>
                          <span>•</span>
                          <span>{chars} chars</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestoreVersion(version.content)}
                        className="version-action-btn restore"
                        title="Restore this past draft to the interactive editor"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Restore to Editor</span>
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : version.id)}
                        className="version-action-btn"
                        title="Preview content"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="version-action-btn delete"
                        title="Delete iteration"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Content Preview */}
                  {isExpanded && (
                    <div className="version-preview-drawer">
                      <div className="drawer-sub-header">
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Draft Content Snippet:</span>
                      </div>
                      <pre className="version-preview-text">{version.content}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
