'use client';

import React, { useState } from 'react';
import {
  Building2,
  Rocket,
  Zap,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  Download,
  Sliders,
  Award,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { CoverLetterPersona, CoverLetterResult, PersonaOption } from './types';

interface CoverLetterGeneratorProps {
  jobDescription: string;
  resumeChunks: string[];
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'strict_enterprise',
    name: 'Strict Enterprise',
    badge: 'Enterprise & Fortune 500',
    iconName: 'Building',
    shortDesc: 'Formal, authoritative executive decorum emphasizing governance, architectural scale, stability, and risk mitigation.',
    voice: 'Authoritative, polished, and deliberate',
    formality: 'High Formality',
    pacing: 'Structured & Comprehensive'
  },
  {
    id: 'startup_tech_lead',
    name: 'Startup Tech Lead',
    badge: 'High-Growth & Builder',
    iconName: 'Rocket',
    shortDesc: 'Dynamic, pragmatic builder tone focusing on rapid 0-to-1 shipping, technical ownership, and product velocity.',
    voice: 'Energetic, confident, and action-oriented',
    formality: 'Balanced / Conversational',
    pacing: 'Agile & High-Velocity'
  },
  {
    id: 'concise_direct',
    name: 'Concise & Direct',
    badge: 'High-Signal / Zero Fluff',
    iconName: 'Zap',
    shortDesc: 'Punchy, metric-driven executive brief using bullet points to directly map verified qualifications in 30 seconds.',
    voice: 'Direct, metric-first, and crisp',
    formality: 'Direct & Concise',
    pacing: 'Rapid & Scannable'
  }
];

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  jobDescription,
  resumeChunks
}) => {
  const [selectedPersona, setSelectedPersona] = useState<CoverLetterPersona>('strict_enterprise');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activePersonaConfig = PERSONA_OPTIONS.find(p => p.id === selectedPersona) || PERSONA_OPTIONS[0];

  const getPersonaIcon = (iconName: 'Building' | 'Rocket' | 'Zap', className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Building':
        return <Building2 className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Zap':
        return <Zap className={className} />;
    }
  };

  const handleGenerate = async (overridePersona?: CoverLetterPersona) => {
    const personaToUse = overridePersona || selectedPersona;

    if (!jobDescription.trim()) {
      setError('Please provide a target job description above before generating.');
      return;
    }

    const validChunks = resumeChunks.filter(c => c.trim().length > 0);
    if (validChunks.length === 0) {
      setError('Please provide at least one resume chunk with verified background context.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_chunks: validChunks,
          persona: personaToUse
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server responded with status ${res.status}`);
      }

      const data: CoverLetterResult = await res.json();
      setResult(data);

      // Scroll smoothly to output
      setTimeout(() => {
        const el = document.getElementById('cover-letter-result-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Cover letter generation failed:', err);
      setError(err.message || 'Failed to generate cover letter. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.cover_letter) return;
    try {
      await navigator.clipboard.writeText(result.cover_letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownload = () => {
    if (!result?.cover_letter) return;
    const blob = new Blob([result.cover_letter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cover_Letter_${result.persona}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="cover-letter-section" id="cover-letter-generator">
      {/* Section Header */}
      <div className="cover-letter-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="cover-letter-badge">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Cover Letter Generator</span>
          </div>
          <div className="grounding-pill">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Grounded in Pinecone Resume Context</span>
          </div>
        </div>

        <h2 className="cover-letter-title">Tone & Persona Customization</h2>
        <p className="cover-letter-subtitle">
          Generate an ATS-optimized, high-impact cover letter tailored to your preferred communication style.
          All claims, metrics, and achievements are strictly grounded in your retrieved resume chunks without hallucination.
        </p>
      </div>

      {/* Persona Customization Control Card */}
      <div className="cover-letter-controls-card">
        <div className="controls-grid">
          {/* Tone Selector Dropdown Control */}
          <div className="control-group">
            <label htmlFor="persona-dropdown-trigger" className="control-label">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Select Tone / Persona:</span>
            </label>

            {/* Custom Interactive Dropdown */}
            <div className="persona-dropdown-container">
              <button
                id="persona-dropdown-trigger"
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className={`persona-dropdown-btn ${dropdownOpen ? 'open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="persona-btn-icon-wrapper">
                    {getPersonaIcon(activePersonaConfig.iconName, 'w-4 h-4 text-blue-400')}
                  </div>
                  <div className="text-left">
                    <div className="persona-btn-title">{activePersonaConfig.name}</div>
                    <div className="persona-btn-badge">{activePersonaConfig.badge}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Accessible Native Select for Screen Readers / Quick Select */}
              <select
                id="persona-native-select"
                className="sr-only"
                value={selectedPersona}
                onChange={e => {
                  setSelectedPersona(e.target.value as CoverLetterPersona);
                  setDropdownOpen(false);
                }}
                aria-label="Preferred Cover Letter Persona"
              >
                {PERSONA_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.badge})
                  </option>
                ))}
              </select>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="persona-dropdown-menu" role="listbox">
                  {PERSONA_OPTIONS.map(option => {
                    const isSelected = option.id === selectedPersona;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedPersona(option.id);
                          setDropdownOpen(false);
                        }}
                        className={`persona-option-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="persona-option-header">
                          <div className="flex items-center gap-2">
                            {getPersonaIcon(option.iconName, `w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-neutral-400'}`)}
                            <span className="persona-option-name">{option.name}</span>
                          </div>
                          <span className="persona-option-tag">{option.badge}</span>
                        </div>
                        <p className="persona-option-desc">{option.shortDesc}</p>
                        <div className="persona-option-meta">
                          <span>{option.formality}</span>
                          <span>•</span>
                          <span>{option.pacing}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Tone Profile Summary Card */}
          <div className="active-tone-summary">
            <div className="summary-title flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Active Tone Directives:</span>
            </div>
            <div className="summary-specs">
              <div className="spec-row">
                <span className="spec-label">Voice:</span>
                <span className="spec-value">{activePersonaConfig.voice}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Pacing:</span>
                <span className="spec-value">{activePersonaConfig.pacing}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Grounding:</span>
                <span className="spec-value text-emerald-400">Strict Pinecone Facts Only (0% Hallucination)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="controls-action-row">
          <button
            id="generate-cover-letter-btn"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="generate-cl-btn"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 spin-icon" />
                <span>Crafting Grounded Cover Letter ({activePersonaConfig.name})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Cover Letter in {activePersonaConfig.name} Tone</span>
              </>
            )}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Generated Cover Letter Result Section */}
      {result && (
        <div className="cover-letter-result-card" id="cover-letter-result-card">
          {/* Result Card Header */}
          <div className="result-header">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="result-persona-pill">
                {getPersonaIcon(
                  result.persona === 'startup_tech_lead'
                    ? 'Rocket'
                    : result.persona === 'concise_direct'
                    ? 'Zap'
                    : 'Building',
                  'w-3.5 h-3.5 text-blue-400'
                )}
                <span>Persona: <strong>{result.persona_label}</strong></span>
              </div>

              <div className="result-grounding-pill">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Grounding Fidelity: {result.grounding_score}% Verified</span>
              </div>

              {result.model_used && (
                <span className="text-xs text-neutral-400">
                  Engine: <code className="text-neutral-300">{result.model_used}</code>
                </span>
              )}
            </div>

            {/* Actions: Copy and Download */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`cl-action-btn ${copied ? 'copied' : ''}`}
                title="Copy cover letter to clipboard"
                id="copy-cover-letter-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Letter</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="cl-action-btn"
                title="Download cover letter as text file"
              >
                <Download className="w-4 h-4" />
                <span>Download .txt</span>
              </button>
            </div>
          </div>

          {/* Quick Tone Switcher Pills */}
          <div className="quick-switch-bar">
            <span className="text-xs text-neutral-400 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-neutral-400" />
              Quick switch tone:
            </span>
            <div className="quick-switch-pills">
              {PERSONA_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  disabled={loading}
                  onClick={() => {
                    setSelectedPersona(opt.id);
                    handleGenerate(opt.id);
                  }}
                  className={`quick-pill ${result.persona === opt.id ? 'active' : ''}`}
                >
                  {getPersonaIcon(opt.iconName, 'w-3 h-3')}
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cover Letter Body Content */}
          <div className="letter-body-wrapper">
            <div className="letter-content-box">
              <pre className="letter-text">{result.cover_letter}</pre>
            </div>
          </div>

          {/* Grounded Evidence Breakdown */}
          {result.grounded_claims && result.grounded_claims.length > 0 && (
            <div className="grounded-claims-drawer">
              <div className="drawer-header">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Claims Grounded in Retrieved Resume Chunks ({result.grounded_claims.length})</span>
              </div>
              <ul className="drawer-claims-list">
                {result.grounded_claims.map((claim, idx) => (
                  <li key={idx} className="drawer-claim-item">
                    <span className="claim-bullet">•</span>
                    <span>{claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
