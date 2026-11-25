import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface SaveExportResult {
  savedTo?: string;
  usedShareFallback?: boolean;
  usedBrowserDownload?: boolean;
}

interface SaveFilePlugin {
  saveToDownloads(options: {
    sourceUri: string;
    fileName: string;
    mimeType: string;
  }): Promise<{ uri: string; location: string }>;
}

const SaveFile = registerPlugin<SaveFilePlugin>('SaveFile');

/**
 * Saves a text export (JSON/CSV) to a user-visible location.
 * - Browser: normal anchor download.
 * - Android 10+: MediaStore.Downloads via the native SaveFile plugin.
 * - Android 9 or OEM restriction: system share sheet fallback.
 */
export async function saveExportFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): Promise<SaveExportResult> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {};
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { usedBrowserDownload: true };
  }

  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  });

  if (Capacitor.getPlatform() === 'android') {
    try {
      const saved = await SaveFile.saveToDownloads({
        sourceUri: uri,
        fileName: filename,
        mimeType: mimeType.split(';')[0],
      });
      return { savedTo: saved.location };
    } catch {
      // Android 9 or lower, or an OEM restriction: use the share sheet below.
    }
  }

  await Share.share({
    title: filename,
    files: [uri],
    dialogTitle: 'Simpan atau bagikan file',
  });

  return { usedShareFallback: true };
}
