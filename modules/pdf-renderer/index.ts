import { requireNativeModule } from 'expo';

export type PdfProbeReason = 'ok' | 'missing' | 'empty' | 'html' | 'not-pdf' | 'password' | 'corrupt';
export type PdfProbe = { ok: boolean; reason: PdfProbeReason; size: number; pages: number };
export type PdfPage = { uri: string; width: number; height: number };

type NativePdfRenderer = {
  probe(uri: string): Promise<PdfProbe>;
  renderPage(uri: string, pageIndex: number, targetWidth: number): Promise<PdfPage>;
  purge(uri: string): Promise<void>;
  saveToDownloads(uri: string, fileName: string): Promise<string>;
  deleteFromDownloads(uri: string): Promise<boolean>;
};

let native: NativePdfRenderer | null = null;
try { native = requireNativeModule<NativePdfRenderer>('PdfRenderer'); } catch { native = null; }

export const pdfRendererAvailable = native !== null;
const unavailable = () => Promise.reject(new Error('PdfRenderer native module is not available'));
export const probePdf = (uri: string): Promise<PdfProbe> => (native ? native.probe(uri) : unavailable());
export const renderPdfPage = (uri: string, pageIndex: number, targetWidth: number): Promise<PdfPage> => native ? native.renderPage(uri, pageIndex, targetWidth) : unavailable();
export const purgePdfCache = (uri: string): Promise<void> => native ? native.purge(uri) : Promise.resolve();
export const savePdfToDownloads = (uri: string, fileName: string): Promise<string> => native ? native.saveToDownloads(uri, fileName) : unavailable();
export const deletePdfFromDownloads = (uri: string): Promise<boolean> => native ? native.deleteFromDownloads(uri) : Promise.resolve(false);
