import type { ReactNode } from 'react';

interface LandingScreenProps {
  children: ReactNode;
}

export default function LandingScreen({ children }: LandingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-text-secondary p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">DICOMAI</h1>
          <p className="text-lg text-text-secondary">AI-Powered Medical Image Analysis</p>
          <p className="text-sm text-text-tertiary mt-2">
            Smart slice selection meets multimodal AI analysis.
            <br />
            Load your DICOM files to get started.
          </p>
        </div>

        {/* Drop zone (rendered by DicomDropZone) */}
        <div className="h-[22rem] mb-10">
          {children}
        </div>

        {/* How it works */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
            How it works
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-blue-400 font-mono mr-2">1.</span>
              <strong className="text-zinc-200">Load</strong>
              <span className="text-text-secondary"> — Drop your DICOM files or folder</span>
            </div>
            <div>
              <span className="text-blue-400 font-mono mr-2">2.</span>
              <strong className="text-zinc-200">Analyze</strong>
              <span className="text-text-secondary"> — Describe what to evaluate</span>
            </div>
            <div>
              <span className="text-blue-400 font-mono mr-2">3.</span>
              <strong className="text-zinc-200">Plan</strong>
              <span className="text-text-secondary"> — AI selects optimal series and slices</span>
            </div>
            <div>
              <span className="text-blue-400 font-mono mr-2">4.</span>
              <strong className="text-zinc-200">Review</strong>
              <span className="text-text-secondary"> — Get findings with interactive slice references</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Features
          </h3>
          <ul className="text-sm text-text-secondary space-y-1.5">
            <li><strong>Multi-series support with automatic scout detection</strong></li>
            <li><strong>Smart slice filtering</strong> — AI picks what matters</li>
            <li><strong>Interactive results</strong> — Findings include clickable slice references that jump the viewer directly to the referenced image.</li>
            <li><strong>Privacy-first</strong> — DICOM files are processed entirely in your browser; no image data is uploaded to any server unless you explicitly send text to your configured LLM provider.</li>
            <li><strong>Multiple layouts</strong> — Choose 1×1, 1×2, 2×1, 2×2 grids or MPR axial/sagittal/coronal views for flexible review.</li>
            <li><strong>Standard tools</strong> — Window/level, zoom, pan, length measurement, rotate, flip, invert, and cine playback are all available.</li>
            <li><strong>Provider-agnostic</strong> — Works with Claude API (recommended) Open Router or local models via Ollama.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 space-x-3">
          <span>Developed by</span>
          <span>&middot;</span>
          <a
            href="https://kathmandu.codes"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Kathmandu Codes
          </a>
          <span>&middot;</span>
          <span>Educational and research purpose only</span>
        </div>
      </div>
    </div>
  );
}
