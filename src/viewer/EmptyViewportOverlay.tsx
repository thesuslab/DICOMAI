import type { SeriesMetadata } from '../dicom/types';

interface EmptyViewportOverlayProps {
  availableSeries: SeriesMetadata[];
  onSelect: (seriesUID: string) => void;
  onClose?: () => void;
}

export default function EmptyViewportOverlay({ availableSeries, onSelect, onClose }: EmptyViewportOverlayProps) {
  // Filter out scouts
  const clinical = availableSeries.filter((s) => !s.isScout);

  if (clinical.length === 0) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-secondary/90">
        <span className="text-xs text-text-tertiary">No series available</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-secondary/90">
      <div className="w-56 max-h-[80%] overflow-y-auto rounded-lg bg-bg-tertiary border border-border-strong shadow-xl">
        <div className="px-3 py-2 border-b border-border-strong flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-300">
            {onClose ? 'Switch series' : 'Load series'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-neutral-300 text-xs leading-none"
            >
              &times;
            </button>
          )}
        </div>
        <div className="py-1">
          {clinical.map((s) => {
            const plane = s.anatomicalPlane.charAt(0).toUpperCase() + s.anatomicalPlane.slice(1);
            return (
              <button
                key={s.seriesInstanceUID}
                onClick={() => onSelect(s.seriesInstanceUID)}
                className="w-full px-3 py-1.5 text-left hover:bg-border-strong transition-colors"
              >
                <div className="text-xs text-neutral-200 truncate">
                  #{s.seriesNumber} {s.seriesDescription || 'Unnamed'}
                </div>
                <div className="text-[10px] text-text-tertiary">
                  {plane} &middot; {s.slices.length} slices
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
