import { File, Paths } from 'expo-file-system';
import { readJson, writeJson } from './storage';
import { deletePdfFromDownloads, pdfRendererAvailable, probePdf, purgePdfCache, savePdfToDownloads, type PdfProbeReason } from '../modules/pdf-renderer';

const LIBRARY_KEY = 'book-pdf-library-v2';
export type PdfEntry = { file: string; name: string; pages: number; size: number; savedAt: number; downloadsUri?: string };
export type PdfLibrary = Record<string, PdfEntry>;
export type PdfErrorCode = 'invalid-url' | 'network' | 'unsupported' | 'storage' | Exclude<PdfProbeReason, 'ok'>;
export class PdfError extends Error { code: PdfErrorCode; constructor(code: PdfErrorCode) { super(code); this.code = code; } }
const messages: Record<PdfErrorCode, string> = {
  'invalid-url': 'رابط الملزمة غير صالح. يجب أن يبدأ بـ https://',
  network: 'تعذر تنزيل الملف. تأكد من اتصال الإنترنت وأن ملف Google Drive متاح لأي شخص لديه الرابط، ثم حاول مرة أخرى.',
  unsupported: 'قارئ PDF غير متاح في هذه النسخة. ثبّت النسخة الأحدث من التطبيق.',
  storage: 'تم تنزيل الملف، لكن تعذر حفظه في مجلد التنزيلات/المقرر الدراسي. تحقق من مساحة التخزين ثم حاول مرة أخرى.',
  html: 'رابط Google Drive أعاد صفحة ويب بدل ملف PDF. سيحاول التطبيق تحويل رابط Drive تلقائيًا؛ إذا استمر الخطأ اجعل المشاركة: أي شخص لديه الرابط.',
  'not-pdf': 'الملف الذي تم تنزيله ليس بصيغة PDF.',
  corrupt: 'ملف PDF تالف أو غير مكتمل. حاول التنزيل مرة أخرى.',
  empty: 'الملف الذي تم تنزيله فارغ.',
  missing: 'لم يتم العثور على الملف على الجهاز.',
  password: 'الملف محمي بكلمة مرور ولا يمكن عرضه داخل التطبيق.'
};
export const pdfErrorMessage = (error: unknown) => error instanceof PdfError ? messages[error.code] : 'حدث خطأ غير متوقع أثناء فتح الملف.';

function driveFileId(raw: string): string | null {
  const url = raw.trim();
  const patterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/([\w-]+)/i,
    /https?:\/\/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/i
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function driveDownloadCandidates(id: string): string[] {
  return [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${id}`,
    `https://drive.google.com/uc?id=${id}&export=download`
  ];
}

function htmlFormDownloadUrl(html: string, fallback: string): string | null {
  const form = html.match(/<form[^>]+action=["']([^"']+)["'][^>]*>/i);
  if (!form?.[1]) return null;
  let action = form[1].replace(/&amp;/g, '&');
  if (!/^https?:\/\//i.test(action)) action = `https://drive.usercontent.google.com${action.startsWith('/') ? '' : '/'}${action}`;
  const fields: string[] = [];
  const inputRe = /<input[^>]+(?:name|id)=["']([^"']+)["'][^>]+value=["']([^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = inputRe.exec(html))) {
    const name = match[1];
    const value = match[2];
    if (name && value != null) fields.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }
  if (!fields.length) return action || fallback;
  return `${action}${action.includes('?') ? '&' : '?'}${fields.join('&')}`;
}

async function resolveDriveDownloadUrl(raw: string): Promise<string> {
  const id = driveFileId(raw);
  if (!id) return raw;
  const candidates = driveDownloadCandidates(id);
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      const type = (response.headers.get('content-type') || '').toLowerCase();
      if (type.includes('application/pdf') || type.includes('application/octet-stream')) return candidate;
      if (type.includes('text/html')) {
        const html = await response.text();
        const confirmed = htmlFormDownloadUrl(html, candidate);
        if (confirmed) return confirmed;
      }
    } catch {
      // File.downloadFileAsync below will make the final attempt.
    }
  }
  return candidates[0];
}

export function normalizePdfUrl(raw: string): string {
  const url = raw.trim();
  const id = driveFileId(url);
  if (id) return driveDownloadCandidates(id)[0];
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
  let url = item.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new PdfError('invalid-url');
  try {
    if (driveFileId(url)) url = await resolveDriveDownloadUrl(url);
    else url = normalizePdfUrl(url);
  } catch {
    url = normalizePdfUrl(url);
  }

  const target = new File(Paths.document, fileNameFor(item.id));
  let saved: File;
  try { saved = await File.downloadFileAsync(url, target, { idempotent: true }); } catch { safeDelete(target); throw new PdfError('network'); }
  const probe = await probePdf(saved.uri).catch(() => null);
  if (!probe || !probe.ok) { safeDelete(saved); throw new PdfError(probe ? probe.reason as Exclude<PdfProbeReason, 'ok'> : 'corrupt'); }

  let downloadsUri: string;
  try {
    downloadsUri = await savePdfToDownloads(saved.uri, item.name);
  } catch {
    safeDelete(saved);
    throw new PdfError('storage');
  }

  const library = await getLibrary();
  const oldEntry = library[item.id];
  if (oldEntry?.downloadsUri && oldEntry.downloadsUri !== downloadsUri) await deletePdfFromDownloads(oldEntry.downloadsUri).catch(() => false);
  library[item.id] = { file: fileNameFor(item.id), name: item.name, pages: probe.pages, size: probe.size, savedAt: Date.now(), downloadsUri };
  await writeJson(LIBRARY_KEY, library);
  return { uri: saved.uri, pages: probe.pages };
}

export async function removePdf(id: string) {
  const entry = (await getLibrary())[id];
  if (entry) {
    const file = new File(Paths.document, entry.file);
    await purgePdfCache(file.uri).catch(() => undefined);
    safeDelete(file);
    if (entry.downloadsUri) await deletePdfFromDownloads(entry.downloadsUri).catch(() => false);
  }
  await dropEntry(id);
}
