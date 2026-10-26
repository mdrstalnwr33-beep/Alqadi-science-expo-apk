package expo.modules.pdfrenderer

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class PdfRendererModule : Module() {
  private val lock = Any()
  override fun definition() = ModuleDefinition {
    Name("PdfRenderer")
    AsyncFunction("probe") { uri: String -> probe(toPath(uri)) }
    AsyncFunction("renderPage") { uri: String, pageIndex: Int, targetWidth: Int -> renderPage(toPath(uri), pageIndex, targetWidth) }
    AsyncFunction("purge") { uri: String -> purge(toPath(uri)) }
  }
  private fun toPath(uri: String) = if (uri.startsWith("file://")) Uri.parse(uri).path ?: uri.removePrefix("file://") else uri
  private fun result(ok: Boolean, reason: String, size: Double, pages: Int) = mapOf("ok" to ok, "reason" to reason, "size" to size, "pages" to pages)
  private fun openRenderer(file: File): PdfRenderer {
    val descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
    return try { PdfRenderer(descriptor) } catch (e: Exception) { try { descriptor.close() } catch (_: Exception) {}; throw e }
  }
  private fun readHead(file: File): String = file.inputStream().use { input ->
    val buffer = ByteArray(1024); val count = input.read(buffer)
    if (count <= 0) "" else String(buffer, 0, count, Charsets.ISO_8859_1)
  }
  private fun probe(path: String): Map<String, Any> {
    val file = File(path)
    if (!file.exists() || !file.isFile) return result(false, "missing", 0.0, 0)
    val size = file.length().toDouble()
    if (size == 0.0) return result(false, "empty", size, 0)
    val head = readHead(file)
    if (!head.contains("%PDF-")) return result(false, if (head.lowercase().contains("<html") || head.lowercase().contains("<!doctype")) "html" else "not-pdf", size, 0)
    return try { synchronized(lock) { openRenderer(file).use { result(true, "ok", size, it.pageCount) } } }
    catch (_: SecurityException) { result(false, "password", size, 0) }
    catch (_: Exception) { result(false, "corrupt", size, 0) }
  }
  private fun pageResult(file: File, width: Int, height: Int) = mapOf("uri" to Uri.fromFile(file).toString(), "width" to width, "height" to height)
  private fun cachePrefix(path: String) = Integer.toHexString(path.hashCode()) + "_"
  private fun renderPage(path: String, pageIndex: Int, requestedWidth: Int): Map<String, Any> {
    val context = appContext.reactContext ?: throw IllegalStateException("React context is not available")
    val file = File(path); if (!file.exists()) throw IOException("PDF file not found")
    val targetWidth = requestedWidth.coerceIn(200, 2400)
    val dir = File(context.cacheDir, "pdf-pages"); dir.mkdirs()
    val key = "${cachePrefix(path)}${file.length()}_${file.lastModified()}_${pageIndex}_${targetWidth}.jpg"
    val out = File(dir, key)
    if (out.exists() && out.length() > 0) {
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(out.absolutePath, bounds)
      if (bounds.outWidth > 0 && bounds.outHeight > 0) return pageResult(out, bounds.outWidth, bounds.outHeight)
    }
    return synchronized(lock) { openRenderer(file).use { renderer ->
      if (pageIndex < 0 || pageIndex >= renderer.pageCount) throw IndexOutOfBoundsException("Page $pageIndex is out of range")
      val pdfPage = renderer.openPage(pageIndex)
      var bitmap: Bitmap? = null
      try {
        val scale = targetWidth.toFloat() / pdfPage.width.toFloat()
        val height = (pdfPage.height * scale).toInt().coerceIn(1, 4800)
        val bmp = Bitmap.createBitmap(targetWidth, height, Bitmap.Config.ARGB_8888); bitmap = bmp
        bmp.eraseColor(Color.WHITE); pdfPage.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        val tmp = File(dir, "$key.tmp")
        FileOutputStream(tmp).use { bmp.compress(Bitmap.CompressFormat.JPEG, 92, it) }
        if (!tmp.renameTo(out)) { tmp.copyTo(out, overwrite = true); tmp.delete() }
        pageResult(out, targetWidth, height)
      } finally { bitmap?.recycle(); pdfPage.close() }
    } }
  }
  private fun purge(path: String) {
    val context = appContext.reactContext ?: return
    val dir = File(context.cacheDir, "pdf-pages"); val prefix = cachePrefix(path)
    dir.listFiles()?.forEach { if (it.name.startsWith(prefix)) it.delete() }
  }
}
