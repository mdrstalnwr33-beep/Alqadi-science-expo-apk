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
  network: 'تعذر تنزيل الملف. تأكد من اتصال الإنترنت وأن رابط الملف متاح، ثم حاول مرة أخرى.',
  unsupported: 'قارئ PDF غير متاح في هذه النسخة. ثبّت النسخة الأحدث من التطبيق.',
  storage: 'تم تنزيل الملف، لكن تعذر حفظه في مجلد التنزيلات/المقرر الدراسي. تحقق من مساحة التخزين ثم حاول مرة أخرى.',
  html: 'رابط الملف أعاد صفحة ويب بدل ملف PDF. استخدم رابط MediaFire للملف أو رابط PDF مباشر.',
  'not-pdf': 'الملف الذي تم تنزيله ليس بصيغة PDF.',
  corrupt: 'ملف PDF تالف أو غير مكتمل. حاول التنزيل مرة أخرى.',
  empty: 'الملف الذي تم تنزيله فارغ.',
  missing: 'لم يتم العثور على الملف على الجهاز.',
  password: 'الملف محمي بكلمة مرور ولا يمكن عرضه داخل التطبيق.'
};
export const pdfErrorMessage = (error: unknown) => error instanceof PdfError ? messages[error.code] : 'حدث خطأ غير متوقع أثناء فتح الملف.';

function mediaFireUrl(raw: string): boolean {
  return /^https?:\/\/(?:www\.)?mediafire\.com\/file\//i.test(raw.trim());
}

function absoluteUrl(value: string, base: string): string {
  const decoded = value
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .trim();
  if (/^https?:\/\//i.test(decoded)) return decoded;
  if (decoded.startsWith('//')) return `https:${decoded}`;
  try { return new URL(decoded, base).toString(); } catch { return decoded; }
}

function extractMediaFireDownloadUrl(html: string, base: string): string | null {
  const patterns = [
    /href=["']([^"']+)["'][^>]*(?:id|class)=["'][^"']*(?:download|download_link)[^"']*["']/i,
    /(?:id|class)=["'][^"']*(?:download|download_link)[^"']*["'][^>]*href=["']([^"']+)["']/i,
    /["'](https?:\\?\/\\?\/download[^"']*mediafire\\.[^"']+)["']/i,
    /["'](https?:\\?\/\\?\/[^"']*\.mediafire\.com\\?\/[^"']*download[^"']*)["']/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return absoluteUrl(match[1], base);
  }

  // MediaFire can embed the download URL inside a JavaScript string.
  const scriptMatches = html.match(/https?:\\?\/\\?\/[^"'\\s]+mediafire\\.[^"'\\s]+/gi) || [];
  for (const candidate of scriptMatches) {
    const clean = candidate.replace(/\\\\\//g, '/');
    if (/download/i.test(clean)) return clean;
  }
  return null;
}

async function resolveMediaFireDownloadUrl(raw: string): Promise<string> {
  const response = await fetch(raw, { redirect: 'follow' as RequestRedirect });
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/pdf') || type.includes('application/octet-stream')) return response.url || raw;
  const html = await response.text();
  const direct = extractMediaFireDownloadUrl(html, response.url || raw);
  if (!direct) throw new PdfError('html');
  return direct;
}

export function normalizePdfUrl(raw: string): string {
  const url = raw.trim();
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
    if (mediaFireUrl(url)) url = await resolveMediaFireDownloadUrl(url);
    else url = normalizePdfUrl(url);
  } catch (error) {
    if (error instanceof PdfError) throw error;
    throw new PdfError('network');
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
