import JSZip from 'jszip';

const SAMPLE_DATA_URL = '/sample-data/sample-knee-mri.zip';

export interface SampleDataProgress {
  phase: 'downloading' | 'extracting' | 'loading';
  percent: number;
}

export async function loadSampleData(
  onProgress?: (progress: SampleDataProgress) => void,
): Promise<File[]> {
  // Phase 1: Download zip with streaming progress
  onProgress?.({ phase: 'downloading', percent: 0 });

  const response = await fetch(SAMPLE_DATA_URL);
  if (!response.ok) throw new Error('Failed to download sample data');

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (total > 0) {
      onProgress?.({ phase: 'downloading', percent: Math.round((loaded / total) * 100) });
    }
  }

  const blob = new Blob(chunks);

  // Phase 2: Extract zip
  onProgress?.({ phase: 'extracting', percent: 0 });
  const zip = await JSZip.loadAsync(blob);

  const files: File[] = [];
  const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);
  let extracted = 0;

  for (const [path, zipEntry] of entries) {
    const data = await zipEntry.async('arraybuffer');
    const fileName = path.split('/').pop() || path;

    // Include .dcm files, files without extension, or files starting with I/IM (common DICOM naming)
    if (
      fileName.endsWith('.dcm') ||
      !fileName.includes('.') ||
      fileName.startsWith('I') ||
      fileName.startsWith('IM')
    ) {
      const file = new File([data], fileName, { type: 'application/dicom' });
      files.push(file);
    }

    extracted++;
    onProgress?.({ phase: 'extracting', percent: Math.round((extracted / entries.length) * 100) });
  }

  // Phase 3: Ready to load
  onProgress?.({ phase: 'loading', percent: 100 });

  return files;
}
