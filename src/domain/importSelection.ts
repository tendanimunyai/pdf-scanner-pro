export type SelectedImport = Readonly<{
  uri: string;
  name: string;
  mimeType: string | null;
}>;

function extension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export function partitionImports(files: readonly SelectedImport[]): Readonly<{
  images: readonly SelectedImport[];
  pdfs: readonly SelectedImport[];
}> {
  const images: SelectedImport[] = [];
  const pdfs: SelectedImport[] = [];
  for (const file of files) {
    const suffix = extension(file.name);
    if (file.mimeType === 'application/pdf' || suffix === '.pdf') {
      pdfs.push(file);
    } else if (
      file.mimeType?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'].includes(suffix)
    ) {
      images.push(file);
    } else {
      throw new Error('unsupported_file_type');
    }
  }
  return { images, pdfs };
}
