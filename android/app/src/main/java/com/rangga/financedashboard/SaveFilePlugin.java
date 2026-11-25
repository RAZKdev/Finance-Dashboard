package com.rangga.financedashboard;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Saves a cached export file to a user-visible Downloads folder through
 * MediaStore. This is the supported path for non-media files on Android 10+;
 * direct File writes to public folders are blocked by scoped storage.
 */
@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {

    private static final String RELATIVE_FOLDER =
            Environment.DIRECTORY_DOWNLOADS + File.separator + "Finance Dashboard";

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String sourceUri = call.getString("sourceUri");
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (sourceUri == null || sourceUri.trim().isEmpty()) {
            call.reject("sourceUri wajib diisi.");
            return;
        }
        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("fileName wajib diisi.");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Penyimpanan ke Downloads memerlukan Android 10 atau lebih baru.");
            return;
        }

        final File sourceFile = resolveLocalFile(sourceUri);
        if (sourceFile == null || !sourceFile.isFile()) {
            call.reject("File sementara tidak ditemukan.");
            return;
        }

        final String safeMimeType = (mimeType == null || mimeType.trim().isEmpty())
                ? "application/octet-stream"
                : mimeType;

        // File copying must stay off the WebView/main thread.
        getBridge().execute(() -> {
            ContentResolver resolver = getContext().getContentResolver();
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
            values.put(MediaStore.MediaColumns.MIME_TYPE, safeMimeType);
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, RELATIVE_FOLDER);
            values.put(MediaStore.MediaColumns.IS_PENDING, 1);

            Uri itemUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (itemUri == null) {
                call.reject("Gagal membuat file di folder Downloads.");
                return;
            }

            try (InputStream in = new FileInputStream(sourceFile);
                 OutputStream out = resolver.openOutputStream(itemUri, "w")) {
                if (out == null) {
                    throw new IllegalStateException("Tidak bisa membuka tujuan penyimpanan.");
                }
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                out.flush();
            } catch (Exception error) {
                resolver.delete(itemUri, null, null);
                call.reject("Gagal menyalin file ke Downloads: " + error.getMessage(), error);
                return;
            }

            ContentValues publish = new ContentValues();
            publish.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(itemUri, publish, null, null);

            String savedName = queryDisplayName(resolver, itemUri, fileName);
            JSObject result = new JSObject();
            result.put("uri", itemUri.toString());
            result.put("location", "Downloads/Finance Dashboard/" + savedName);
            call.resolve(result);
        });
    }

    private File resolveLocalFile(String sourceUri) {
        Uri uri = Uri.parse(sourceUri);
        if (!"file".equalsIgnoreCase(uri.getScheme())) {
            return null;
        }
        String path = uri.getPath();
        return (path == null || path.isEmpty()) ? null : new File(path);
    }

    private String queryDisplayName(ContentResolver resolver, Uri itemUri, String fallback) {
        try (Cursor cursor = resolver.query(
                itemUri,
                new String[]{MediaStore.MediaColumns.DISPLAY_NAME},
                null,
                null,
                null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String name = cursor.getString(index);
                    if (name != null && !name.isEmpty()) {
                        return name;
                    }
                }
            }
        } catch (Exception ignored) {
            // The file is already saved; the requested name is a safe fallback.
        }
        return fallback;
    }
}
