import * as FileSystem from 'expo-file-system/legacy';

import { buildPlainTextExport, type TextExportPage } from '../domain/textExport';
import { writeAtomically } from './atomicFiles';

export type { TextExportPage } from '../domain/textExport';

export async function exportPlainText(
  pages: readonly TextExportPage[],
  outputPath: string,
): Promise<string> {
  const content = buildPlainTextExport(pages);
  await writeAtomically(
    outputPath,
    async (temporaryPath) => {
      await FileSystem.writeAsStringAsync(temporaryPath, content);
    },
    async (temporaryPath) => {
      const info = await FileSystem.getInfoAsync(temporaryPath);
      return info.exists && 'size' in info && info.size > 0;
    },
  );
  return outputPath;
}
