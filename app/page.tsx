'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles,
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SideBySideDiff } from '../components/SideBySideDiff';
import { ScoreCard } from '../components/ScoreCard';
import { GapAnalysis } from '../components/GapAnalysis';
import { PDFExportButton } from '../components/PDFExportButton';
import { CleanResumeExportButton } from '../components/CleanResumeExportButton';
import { ResumeInput } from '../components/ResumeInput';
import { JDInput } from '../components/JDInput';
import { ResumeProfile, TailoredResume, MatchScore, ResumeGap, TailoringRun, JobDescriptionProfile } from '../lib/types';

// Mock Data Sets for Phase 1 Interactive Experience
const MOCK_ORIGINAL_RESUME: ResumeProfile = {
  contact: {
    fullName: "Aditya Rane",
    email: "aditya@example.com",
    phone: "+91 99999 99999",
    location: "Mumbai, MH",
    websiteUrls: []
  },
  summary: "",
  skills: ["React", "JavaScript", "HTML", "CSS", "SQL"],
  experience: [
    {
      id: "exp-1",
      company: "TechSolutions Corp",
      title: "Junior Software Engineer",
      startDate: "2024-01",
      endDate: "Present",
      bullets: [
        "Built front-end user forms and page layouts using React and styled CSS stylesheets.",
        "Assisted senior team members in designing database integrations and custom API connections.",
        "Wrote standard SQL queries to pull backend database user logs and usage counts.",
        "Supported manual QA checks and testing scripts to ensure web interface responsiveness."
      ]
    }
  ],
  projects: [],
  education: [
    {
      institution: "Mumbai University",
      degree: "Bachelor of Science in Computer Science",
      graduationDate: "2023-06"
    }
  ],
  certifications: []
};

const MOCK_TAILORED_RESUME: TailoredResume = {
  tailoredSummary: "",
  tailoredSkills: ["React", "TypeScript", "Tailwind CSS", "JavaScript", "SQL", "RESTful API"],
  tailoredExperience: [
    {
      company: "TechSolutions Corp",
      title: "Junior Software Engineer",
      bullets: [
        {
          original: "Built front-end user forms and page layouts using React and styled CSS stylesheets.",
          tailored: "Developed responsive front-end user interfaces and modern layouts leveraging React components and styled CSS systems.",
          changeReason: "Replaced generic 'built front-end' with 'developed responsive front-end user interfaces' to align with targeted UI/UX expectations in the JD.",
          keywordsAddressed: ["React", "UI development"],
          confidence: "high",
          riskFlag: null
        },
        {
          original: "Assisted senior team members in designing database integrations and custom API connections.",
          tailored: "Collaborated with senior engineers to implement database integrations and design custom RESTful API architectures.",
          changeReason: "Upgraded 'custom API connections' to 'RESTful API architectures' based on evidence in required JD qualifications, maintaining truth bounds.",
          keywordsAddressed: ["API architectures"],
          confidence: "high",
          riskFlag: null
        },
        {
          original: "Wrote standard SQL queries to pull backend database user logs and usage counts.",
          tailored: "Authored and optimized standard SQL queries for backend database usage counts and performance monitoring.",
          changeReason: "Swapped 'wrote SQL queries' with 'authored and optimized standard SQL queries' to better emphasize database engagement without exaggerating responsibilities.",
          keywordsAddressed: ["SQL", "Database performance"],
          confidence: "medium",
          riskFlag: null
        },
        {
          original: "Supported manual QA checks and testing scripts to ensure web interface responsiveness.",
          tailored: "Supported manual quality checks and visual testing scripts to maintain front-end web responsiveness.",
          changeReason: "Audited the bullet to make text match JD specifications while highlighting manual testing roots instead of fabricating automatic pipeline experience.",
          keywordsAddressed: ["front-end responsive", "testing"],
          confidence: "medium",
          riskFlag: "Note: Keep manual context since auto testing was not mentioned."
        }
      ]
    }
  ]
};

const SAMPLE_RESUME = `ADITYA RANE
Software Developer | Mumbai, MH | aditya@example.com

SUMMARY:
Results-oriented Software Developer with 2 years of experience building web applications. Proficient in HTML, CSS, JavaScript, React, and basic Node.js databases.

EXPERIENCE:
Junior Software Engineer | TechSolutions Corp (2024 - Present)
• Built front-end user forms and page layouts using React and styled CSS stylesheets.
• Assisted senior team members in designing database integrations and custom API connections.
• Wrote standard SQL queries to pull backend database user logs and usage counts.
• Supported manual QA QA checks and testing scripts to ensure web interface responsiveness.

EDUCATION:
Bachelor of Science in Computer Science | Mumbai University (Graduation: 2023)`;

const SAMPLE_JD = `Role: Full-Stack React & Node Developer (L2)
Company: FinTech ScaleUp
Location: Remote / Mumbai

We are looking for an Associate Full-Stack Engineer who can help scale our consumer portals.

REQUIRED SKILLS:
- Advanced UI development using React, TypeScript, and modern CSS frameworks (Tailwind CSS)
- Experience designing secure RESTful API architectures using Node.js and Express
- Database performance optimization using PostgreSQL queries and index structures
- Familiarity with continuous integration (CI/CD) pipelines and automated testing frameworks (Jest/Playwright)

WHAT WE WANT:
- You should take ownership of front-end components while matching UI/UX design specifications.
- Drive database query speed optimizations.
- Help construct clean, performant, and ATS-optimized logic.`;

export default function WorkspaceDashboard() {
  // Input State Boundaries
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // File Parsing States
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // App Stage States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Live Analysis States
  const [originalResume, setOriginalResume] = useState<ResumeProfile | null>(null);
  const [targetJobDescription, setTargetJobDescription] = useState<JobDescriptionProfile | null>(null);
  const [originalScore, setOriginalScore] = useState<MatchScore | null>(null);
  const [tailoredScore, setTailoredScore] = useState<MatchScore | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [identifiedGaps, setIdentifiedGaps] = useState<ResumeGap[]>([]);
  const [runData, setRunData] = useState<TailoringRun | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // Loading Screen Steps
  const steps = [
    'Ingesting binary file formats and normalizing buffers...',
    'Performing semantic keyword parsing and JD entity extraction...',
    'Mapping experience records and calculating initial match score...',
    'Surgically editing experience bullets without fabrication...',
    'Identifying skill gaps and compiling final side-by-side comparison proof...'
  ];

  // 1. Advance steps smoothly every 1200ms.
  // Once runData arrives (API completes), speed up the transition to 250ms so the user isn't kept waiting.
  useEffect(() => {
    if (!isAnalyzing) return;

    const stepDuration = runData ? 250 : 1200;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isAnalyzing, runData]);

  // 2. Handle final loading screen completion transition to results.
  useEffect(() => {
    if (isAnalyzing && runData && activeStep === steps.length - 1) {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalyzed(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing, runData, activeStep]);

  // Load sample content for immediate demonstration
  const handleLoadSample = () => {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JD);
    setParsedFileName(null);
    setParseError(null);
  };

  const handleReset = () => {
    setResumeText('');
    setJobDescription('');
    setParsedFileName(null);
    setParseError(null);
    setAnalyzed(false);
    setIsAnalyzing(false);
    setOriginalResume(null);
    setTargetJobDescription(null);
    setOriginalScore(null);
    setTailoredScore(null);
    setTailoredResume(null);
    setIdentifiedGaps([]);
    setRunData(null);
    setAnalysisError(null);
  };

  const handleBackToInputs = () => {
    setAnalyzed(false);
    setIsAnalyzing(false);
    setOriginalResume(null);
    setTargetJobDescription(null);
    setOriginalScore(null);
    setTailoredScore(null);
    setTailoredResume(null);
    setIdentifiedGaps([]);
    setRunData(null);
    setAnalysisError(null);
  };

  const handleTriggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzed(false);
    setRunData(null);
    setActiveStep(0);

    try {
      // Step 1: Run Document Parse & Keyword & Match Analysis
      const analyzeRes = await fetch('/api/tailor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription })
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || 'Failed to analyze files.');
      }
      
      const analyzeData = await analyzeRes.json();

      // Step 2: Run Surgical Bullet Rewriting and Scoring update
      const rewriteRes = await fetch('/api/tailor/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalResume: analyzeData.originalResume,
          targetJobDescription: analyzeData.targetJobDescription,
          originalScore: analyzeData.originalScore,
          identifiedGaps: analyzeData.identifiedGaps
        })
      });

      if (!rewriteRes.ok) {
        const errData = await rewriteRes.json();
        throw new Error(errData.error || 'Failed to execute surgical tailoring.');
      }

      const rewriteData = await rewriteRes.json();

      // Save live outputs
      setOriginalResume(analyzeData.originalResume);
      setTargetJobDescription(analyzeData.targetJobDescription);
      setOriginalScore(analyzeData.originalScore);
      setIdentifiedGaps(analyzeData.identifiedGaps);
      
      setTailoredResume(rewriteData.tailoredResume);
      setTailoredScore(rewriteData.tailoredScore);
      setRunData(rewriteData);

    } catch (err) {
      console.error(err);
      setAnalysisError((err as Error).message || 'An unexpected failure occurred.');
      setIsAnalyzing(false);
    }
  };




  // --- Document Ingestion Handlers ---

  const processUploadedFile = async (file: File) => {
    setIsParsingFile(true);
    setParseError(null);
    setParsedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file.');
      }

      setResumeText(data.text);
    } catch (err) {
      console.error(err);
      setParseError((err as Error).message || 'Failed to parse the file. Please paste your text manually.');
      setParsedFileName(null);
      setResumeText('');
    } finally {
      setIsParsingFile(false);
    }
  };

  const removeParsedFile = () => {
    setResumeText('');
    setParsedFileName(null);
    setParseError(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Visual Workspace Headers */}
      <div className="text-center md:text-left mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Resume Tailoring Workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Match your resume to specific target jobs, evaluate skill deficiencies, and generate side-by-side visual proofs.
        </p>
      </div>

      {/* STAGE 1: Form Inputs View */}
      {!isAnalyzing && !analyzed && (
        <div className="space-y-6">
          {analysisError && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-bold">Tailoring Engine Error</strong>
                <span className="leading-relaxed mt-0.5 block">{analysisError}</span>
              </div>
            </div>
          )}
          <form onSubmit={handleTriggerAnalysis} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Resume Input — file upload, drag-drop, parse spinner, textarea */}
            <ResumeInput
              value={resumeText}
              onChange={setResumeText}
              onFileUpload={processUploadedFile}
              onRemoveFile={removeParsedFile}
              onLoadSample={handleLoadSample}
              parsedFileName={parsedFileName}
              isParsingFile={isParsingFile}
              parseError={parseError}
              onDismissError={() => setParseError(null)}
            />

            {/* JD Input — controlled textarea */}
            <JDInput
              value={jobDescription}
              onChange={setJobDescription}
            />
          </div>

          {/* Trigger Button */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={!resumeText.trim() || !jobDescription.trim() || isParsingFile}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Analyze & Tailor Resume
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          </form>
        </div>
      )}

      {/* STAGE 2: Interactive Loading Progression */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center min-h-[450px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="relative flex items-center justify-center mb-6">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600"></div>
            <Sparkles className="absolute h-6 w-6 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 animate-pulse">Running Tailoring Engine</h2>
          <p className="mt-1.5 text-sm text-slate-500 text-center max-w-md">
            Surgically editing experience points and mapping keyword alignments without credentials fabrication.
          </p>

          {/* Progress Sequence Items */}
          <div className="mt-8 max-w-md w-full space-y-3 bg-slate-50 border border-slate-200/50 rounded-xl p-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                {idx < activeStep ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : idx === activeStep ? (
                  <RefreshCw className="h-4 w-4 text-indigo-600 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[9px] font-semibold text-slate-400 mt-0.5">
                    {idx + 1}
                  </div>
                )}
                <span className={`leading-relaxed ${idx === activeStep ? 'text-indigo-950 font-bold' : idx < activeStep ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 3: Final Analysis Results (Dashboard & Review Viewport) */}
      {analyzed && !isAnalyzing && (
        <div className="space-y-8">
          {/* Header Controls Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900">
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Analysis Session Done</div>
              <h2 className="text-xl font-extrabold mt-1">{targetJobDescription?.jobTitle || "Tailored Position"}</h2>
              <div className="text-xs text-indigo-200 mt-1">{targetJobDescription?.company || "Target Company"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBackToInputs}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-100 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg transition-all animate-pulse"
                title="Keep your uploaded resume and go back to paste or compare a new Job Description"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Compare Another JD
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Workspace
              </button>
              <PDFExportButton runData={runData} />
              <CleanResumeExportButton runData={runData} />
            </div>
          </div>

          {/* Core Matching Scores — ScoreCard Component */}
          {originalScore && tailoredScore && (
            <ScoreCard original={originalScore} tailored={tailoredScore} />
          )}

          {/* GAP ANALYSIS MATRIX — GapAnalysis Component */}
          {identifiedGaps.length > 0 && (
            <GapAnalysis gaps={identifiedGaps} />
          )}

          {/* BULLET SURGEON COMPARATIVE VIEWPORT */}
          {originalResume && tailoredResume && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Bullet Surgeon Side-by-Side Proof
                </h3>
                <span className="text-xs text-slate-400">Click green bullets to inspect changes</span>
              </div>
              <SideBySideDiff original={originalResume} tailored={tailoredResume} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
