import { File, Paths } from 'expo-file-system';
import { readJson, writeJson } from './storage';
import { probePdf, pdfRendererAvailable, purgePdfCache, type PdfProbeReason } from '../modules/pdf-renderer';

const LIBRARY_KEY = 'book-pdf-library-v2';
export type PdfEntry = { file: string; name: string; pages: number; size: number; savedAt: number };
export type PdfLibrary = Record<string, PdfEntry>;
export type PdfErrorCode = 'invalid-url' | 'network' | 'unsupported' | Exclude<PdfProbeReason, 'ok'>;
export class PdfError extends Error { code: PdfErrorCode; constructor(code: PdfErrorCode) { super(code); this.code = code; } }
const messages: Record<PdfErrorCode, string> = {
  'invalid-url': 'رابط الملزمة غير صالح. يجب أن يبدأ بـ https://', network: 'تعذر تنزيل الملف. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.', unsupported: 'قارئ PDF غير متاح في هذه النسخة. ثبّت النسخة الأحدث من التطبيق.', html: 'الرابط يعيد صفحة ويب وليس ملف PDF مباشرًا. اجعل مشاركة Google Drive: أي شخص لديه الرابط.', 'not-pdf': 'الملف الذي تم تنزيله ليس بصيغة PDF.', corrupt: 'ملف PDF تالف أو غير مكتمل. حاول التنزيل مرة أخرى.', empty: 'الملف الذي تم تنزيله فارغ.', missing: 'لم يتم العثور على الملف على الجهاز.', password: 'الملف محمي بكلمة مرور ولا يمكن عرضه داخل التطبيق.'
};
export const pdfErrorMessage = (error: unknown) => error instanceof PdfError ? messages[error.code] : 'حدث خطأ غير متوقع أثناء فتح الملف.';
export function normalizePdfUrl(raw: string): string {
  const url = raw.trim();
  let drive = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (!drive) drive = url.match(/^https?:\/\/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/i);
  if (drive) return `https://drive.usercontent.google.com/download?id=${drive[1]}&export=download&confirm=t`;
  if (/^https?:\/\/(www\.)?dropbox\.com\//i.test(url)) return /[?&]dl=\d/.test(url) ? url.replace(/([?&])dl=\d/, '$1dl=1') : url + (url.includes('?') ? '&' : '?') + 'dl=1';
  return url;
}
const fileNameFor = (id: string) => `book-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
const safeDelete = (file: File) => { try { if (file.exists) file.delete(); } catch {} };
export const getLibrary = () => readJson<PdfLibrary>(LIBRARY_KEY, {});
async function dropEntry(id: string) { const library = await getLibrary(); if (library[id]) { delete library[id]; await writeJson(LIBRARY_KEY, library); } }
export async function getLocalPdf(id: string): Promise<{ uri: string; pages: number } | null> {
  if (!pdfRendererAvailable) throw new PdfError('unsupported');
  const entry = (await getLibrary())[id]; if (!entry) return null;
  try {
    const file = new File(Paths.document, entry.file);
    if (!file.exists || file.size === 0) throw new PdfError('missing');
    const probe = await probePdf(file.uri);
    if (!probe.ok) throw new PdfError(probe.reason as Exclude<PdfProbeReason, 'ok'>);
    return { uri: file.uri, pages: probe.pages };
  } catch { await dropEntry(id); return null; }
}
export async function downloadPdf(item: { id: string; name: string; url: string }): Promise<{ uri: string; pages: number }> {
  if (!pdfRendererAvailable) throw new PdfError('unsupported');
  const url = normalizePdfUrl(item.url); if (!/^https?:\/\//i.test(url)) throw new PdfError('invalid-url');
  const target = new File(Paths.document, fileNameFor(item.id));
  let saved: File;
  try { saved = await File.downloadFileAsync(url, target, { idempotent: true }); } catch { safeDelete(target); throw new PdfError('network'); }
  const probe = await probePdf(saved.uri).catch(() => null);
  if (!probe || !probe.ok) { safeDelete(saved); throw new PdfError(probe ? probe.reason as Exclude<PdfProbeReason, 'ok'> : 'corrupt'); }
  const library = await getLibrary();
  library[item.id] = { file: fileNameFor(item.id), name: item.name, pages: probe.pages, size: probe.size, savedAt: Date.now() };
  await writeJson(LIBRARY_KEY, library);
  return { uri: saved.uri, pages: probe.pages };
}
export async function removePdf(id: string) { const entry = (await getLibrary())[id]; if (entry) { const file = new File(Paths.document, entry.file); await purgePdfCache(file.uri).catch(() => undefined); safeDelete(file); } await dropEntry(id); }
