'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

interface DiagnosticResult {
  to_improve: string[];
  to_discard: string[];
  strengths: string[];
  word_count: number;
  bullet_count: number;
  char_count: number;
  has_metrics: boolean;
}

interface UploadResponse {
  success: boolean;
  file_name: string;
  character_count: number;
  extracted_text: string;
  chunks: string[];
  diagnostics: DiagnosticResult;
}

interface Props {
  onApplyResume: (extractedText: string, chunks: string[]) => void;
}

export const ResumeFileUploader: React.FC<Props> = ({ onApplyResume }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [applied, setApplied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setApplied(false);

    try {
      const formData = new FormData();
      formData.append('resume_file', file);

      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Upload failed with status ${res.status}`);
      }

      const data: UploadResponse = await res.json();
      setResult(data);
      // Automatically apply parsed resume to Workspace & Analyzer
      onApplyResume(data.extracted_text, data.chunks);
      setApplied(true);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload and parse resume file.');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyResume(result.extracted_text, result.chunks);
      setApplied(true);
      setTimeout(() => {
        const target = document.getElementById('analysis-results-section') || document.getElementById('interactive-resume-workspace');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div className="resume-uploader-card">
      {/* Header */}
      <div className="uploader-header">
        <div className="uploader-header-info">
          <div className="uploader-icon-wrap">
            <UploadCloud size={20} />
          </div>
          <div className="uploader-title-group">
            <div className="uploader-title-row">
              <span className="uploader-title">Upload Your Resume (PDF, TXT, or Markdown)</span>
              <span className="uploader-badge">Instant Diagnostics</span>
            </div>
            <p className="uploader-subtitle">
              Upload your existing resume to discover exactly <strong>what to improve</strong> and <strong>what to discard</strong> before applying.
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={handleApply}
            className={`uploader-apply-btn ${applied ? 'applied' : ''}`}
          >
            {applied ? (
              <>
                <CheckCircle2 size={16} />
                <span>Loaded into Workspace & Analyzer!</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Load Resume into Workspace & Analyzer</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.rtf,.json"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Custom Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`uploader-dropzone ${dragActive ? 'drag-active' : ''}`}
      >
        {uploading ? (
          <div className="uploader-dropzone-content">
            <RefreshCw size={28} className="spin-icon uploader-dropzone-icon" />
            <span className="uploader-dropzone-title">
              Extracting text and running diagnostics...
            </span>
            <span className="uploader-dropzone-subtitle">
              Reading document and analyzing ATS compliance...
            </span>
          </div>
        ) : (
          <div className="uploader-dropzone-content">
            <FileText size={32} className="uploader-dropzone-icon" />
            <span className="uploader-dropzone-title">
              Drag & drop your resume file here, or <span style={{ color: 'var(--blue-main)', textDecoration: 'underline' }}>browse files</span>
            </span>
            <span className="uploader-dropzone-subtitle">
              Supports PDF (.pdf), Plain Text (.txt), Markdown (.md), and Rich Text (.rtf) up to 10MB
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="uploader-error">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Diagnostic Results Card */}
      {result && (
        <div className="uploader-results">
          <div className="uploader-results-meta">
            <div className="uploader-filename-tag">
              <span>Parsed File:</span>
              <span className="uploader-filename-code">{result.file_name}</span>
            </div>
            <div className="uploader-stats-row">
              <span><strong>{result.diagnostics.word_count}</strong> words</span>
              <span>•</span>
              <span><strong>{result.diagnostics.bullet_count}</strong> bullets</span>
              <span>•</span>
              <span><strong>{result.chunks.length}</strong> sections detected</span>
            </div>
          </div>

          <div className="uploader-diag-grid">
            {/* What to Discard / Remove */}
            <div className="uploader-diag-card uploader-diag-discard">
              <div className="uploader-diag-title">
                <XCircle size={18} />
                <span>What Needs to be Discarded / Removed ({result.diagnostics.to_discard.length})</span>
              </div>
              {result.diagnostics.to_discard.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No obvious cliches or outdated demographic sections detected!
                </p>
              ) : (
                <ul className="uploader-diag-list">
                  {result.diagnostics.to_discard.map((item, idx) => (
                    <li key={idx} className="uploader-diag-item">
                      <span className="diag-item-bullet">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* What to Improve / Add */}
            <div className="uploader-diag-card uploader-diag-improve">
              <div className="uploader-diag-title">
                <Sparkles size={18} />
                <span>What Needs to be Improved / Added ({result.diagnostics.to_improve.length})</span>
              </div>
              {result.diagnostics.to_improve.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Your resume structure and quantitative metrics look well-balanced!
                </p>
              ) : (
                <ul className="uploader-diag-list">
                  {result.diagnostics.to_improve.map((item, idx) => (
                    <li key={idx} className="uploader-diag-item">
                      <span className="diag-item-bullet">↑</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Strengths */}
          {result.diagnostics.strengths.length > 0 && (
            <div className="uploader-strengths-card">
              <div className="uploader-strengths-title">
                <CheckCircle2 size={15} />
                <span>Current Resume Strengths</span>
              </div>
              <ul className="uploader-strengths-list">
                {result.diagnostics.strengths.map((str, idx) => (
                  <li key={idx} className="uploader-strengths-item">
                    <span>✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom Action Strip */}
          <div className="uploader-action-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} style={{ color: 'var(--blue-main)', flexShrink: 0 }} />
              <span>
                Click the button to load this parsed text into the <strong>Requirement Gap Analysis Matrix</strong> and <strong>Interactive Live Optimizer</strong> below.
              </span>
            </div>
            <button
              onClick={handleApply}
              className={`uploader-apply-btn ${applied ? 'applied' : ''}`}
            >
              {applied ? 'Loaded into Workspace!' : 'Load Resume into Workspace'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
