import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

export async function saveFileWithNativePicker(
  data: Uint8Array | Blob | string,
  defaultFileName: string,
  filterName: string,
  filterExtension: string
): Promise<boolean> {
  // Normalize binary data
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Blob) {
    bytes = new Uint8Array(await data.arrayBuffer());
  } else {
    bytes = data;
  }

  // 1. Try Tauri Native Desktop OS File Dialog
  try {
    const filePath = await save({
      defaultPath: defaultFileName,
      filters: [
        {
          name: filterName,
          extensions: [filterExtension]
        }
      ]
    });

    if (filePath) {
      await writeFile(filePath, bytes);
      return true;
    } else {
      return false; // User explicitly cancelled location picker
    }
  } catch (e) {
    // Not running inside Tauri desktop shell or native dialog unavailable
  }

  // 2. Try HTML5 File System Access API (showSaveFilePicker)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          {
            description: filterName,
            accept: { 'application/octet-stream': ['.' + filterExtension] }
          }
        ]
      });
      const writable = await handle.createWritable();
      await writable.write(bytes);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false; // User cancelled location picker dialog
      }
    }
  }

  // 3. Fallback to classic browser download trigger
  const blob = new Blob([bytes.buffer as ArrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
