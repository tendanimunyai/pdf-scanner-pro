export type Identifier = string;
export type IsoDateTime = string;
export type OcrStatus = 'not_started' | 'queued' | 'running' | 'complete' | 'failed';
export type QualityBand = 'excellent' | 'usable' | 'retake';
export type PageFilter = 'original' | 'color' | 'grayscale' | 'black_and_white';

export type Document = Readonly<{
  id: Identifier;
  title: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  pageCount: number;
  thumbnailPath: string | null;
  pdfPath: string | null;
  ocrStatus: OcrStatus;
  qualitySummary: QualityBand | null;
  folderId: Identifier | null;
  tags: readonly string[];
}>;

export type Point = Readonly<{ x: number; y: number }>;
export type Corners = Readonly<{
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}>;

export type Page = Readonly<{
  id: Identifier;
  documentId: Identifier;
  position: number;
  sourceImagePath: string;
  processedImagePath: string | null;
  corners: Corners | null;
  rotation: 0 | 90 | 180 | 270;
  filter: PageFilter;
  ocrStatus: OcrStatus;
  qualityScore: number | null;
  qualityReasons: readonly string[];
  editVersion: number;
}>;
