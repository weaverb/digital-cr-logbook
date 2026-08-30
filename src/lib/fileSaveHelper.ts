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

  // 2. Fallback for the web build: classic browser download trigger.
  //
  // We deliberately don't use the HTML5 File System Access API
  // (`showSaveFilePicker`) here. Feature-detecting it only confirms it
  // exists, not that a real picker UI is available to service it: in a
  // headless/automated browser (or an unusual embedding/policy context)
  // with a transient user activation present but no display backend to
  // show native UI on, the underlying browser call can block the
  // renderer's event loop entirely rather than resolving or rejecting —
  // even a `Promise.race`/timeout around it can't rescue that, since the
  // JS engine itself stalls. It's also Chromium-only (no Firefox/Safari
  // support), so it bought little over the classic download below anyway.
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
