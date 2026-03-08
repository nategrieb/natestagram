"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const MAX_SINGLE_FILE_MB = 18;
const MAX_TOTAL_UPLOAD_MB = 24;
const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "avif",
  "tif",
  "tiff",
]);

function bytesToMb(bytes: number) {
  return bytes / (1024 * 1024);
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

function getDominantColor(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        resolve(hex);
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function getExifDate(file: File): Promise<string | null> {
  try {
    const exifr = (await import('exifr')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (exifr as any).parse(file, { DateTimeOriginal: true, DateTimeDigitized: true, DateTime: true });
    const raw = data?.DateTimeOriginal ?? data?.DateTimeDigitized ?? data?.DateTime;
    if (!raw) return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function isLikelyImage(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(extension);
}

async function readErrorMessage(response: Response) {
  if (response.status === 413) {
    return "Upload payload is too large for the server. Try fewer photos or smaller files.";
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    if (payload?.message) {
      return payload.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text || "Upload failed.";
}

export function AdminUploadForm() {
  const router = useRouter();
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenAtValue, setTakenAtValue] = useState("");
  const takenAtRef = useRef<HTMLInputElement | null>(null);

  const helpText = useMemo(
    () =>
      `Max ${MAX_SINGLE_FILE_MB}MB per file. Images will be optimized for web if selected.`,
    []
  );

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || takenAtValue) return; // don't overwrite if user already set a date
    const date = await getExifDate(file);
    if (date) setTakenAtValue(date);
  }

  return (
    <form
      className="space-y-5 border border-zinc-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
      onSubmit={async (event) => {
        event.preventDefault();
        const target = event.currentTarget;
        const fileInput = target.elements.namedItem("photos") as HTMLInputElement | null;
        const files = fileInput?.files;
        const optimize = (target.elements.namedItem("optimize") as HTMLInputElement)?.checked ?? false;

        setClientError(null);

        if (!files || files.length === 0) {
          setClientError("Please choose at least one image.");
          return;
        }

        const originalFiles = Array.from(files);
        let processedFiles = originalFiles;

        if (optimize) {
          try {
            processedFiles = await Promise.all(
              originalFiles.map(async (file) => {
                const options = {
                  maxSizeMB: 2,
                  maxWidthOrHeight: 1920,
                  useWebWorker: true,
                };
                return await imageCompression(file, options);
              })
            );
          } catch (error) {
            setClientError("Failed to optimize images. Please try again.");
            return;
          }
        }

        for (const file of processedFiles) {
          if (!isLikelyImage(file)) {
            setClientError(`\"${file.name}\" is not recognized as an image.`);
            return;
          }

          const mb = bytesToMb(file.size);
          if (mb > MAX_SINGLE_FILE_MB) {
            setClientError(
              `\"${file.name}\" is ${mb.toFixed(1)}MB. Please keep each file under ${MAX_SINGLE_FILE_MB}MB.`
            );
            return;
          }
        }

        setIsSubmitting(true);

        try {
          // Step 1: Init post
          const initFormData = new FormData();
          initFormData.append("password", (target.elements.namedItem("password") as HTMLInputElement).value);
          initFormData.append("caption", (target.elements.namedItem("caption") as HTMLTextAreaElement).value);
          initFormData.append("takenAt", (target.elements.namedItem("takenAt") as HTMLInputElement).value);
          initFormData.append("isPublic", (target.elements.namedItem("isPublic") as HTMLInputElement).checked ? "on" : "");
const initResponse = await fetch("/api/admin/upload?step=init", {
            method: "POST",
            body: initFormData,
          });

          if (!initResponse.ok) {
            setClientError(await readErrorMessage(initResponse));
            return;
          }

          const initData = await initResponse.json();
          const postId = initData.postId;

          // Step 2-4: For each file
          for (let i = 0; i < processedFiles.length; i++) {
            const file = processedFiles[i];

            // Prepare asset
            const prepareFormData = new FormData();
            // include secret code on every request so server can authenticate
            prepareFormData.append("password", (target.elements.namedItem("password") as HTMLInputElement).value);
            prepareFormData.append("postId", postId);
            prepareFormData.append("position", i.toString());
            prepareFormData.append("fileName", file.name);
            prepareFormData.append("fileType", file.type);
            prepareFormData.append("fileSize", file.size.toString());

            const prepareResponse = await fetch("/api/admin/upload?step=prepare-asset", {
              method: "POST",
              body: prepareFormData,
            });

            if (!prepareResponse.ok) {
              setClientError(await readErrorMessage(prepareResponse));
              return;
            }

            const prepareData = await prepareResponse.json();
            const { bucket, path, token } = prepareData;

            // upload using Supabase client helper so we don't have to recreate
            // the exact headers/body format that the JS SDK uses internally
            const browserClient = createSupabaseBrowserClient();
            const { error: uploadError } = await browserClient
              .storage
              .from(bucket)
              .uploadToSignedUrl(path, token, file);

            if (uploadError) {
              console.error("storage upload failed", uploadError.message, uploadError);
              setClientError(`Failed to upload file to storage: ${uploadError.message}`);
              return;
            }

            // Measure dimensions and dominant color from the processed file
            const dims = await getImageDimensions(file);
            const dominantColor = await getDominantColor(file);

            // Register asset
            const registerFormData = new FormData();
            registerFormData.append("password", (target.elements.namedItem("password") as HTMLInputElement).value);
            registerFormData.append("postId", postId);
            registerFormData.append("position", i.toString());
            registerFormData.append("storagePath", path);
            if (dims.width > 0) registerFormData.append("width", dims.width.toString());
            if (dims.height > 0) registerFormData.append("height", dims.height.toString());
            if (dominantColor) registerFormData.append("dominantColor", dominantColor);

            const registerResponse = await fetch("/api/admin/upload?step=register-asset", {
              method: "POST",
              body: registerFormData,
            });

            if (!registerResponse.ok) {
              setClientError(await readErrorMessage(registerResponse));
              return;
            }
          }

          // Step 5: Complete
          const completeFormData = new FormData();
          completeFormData.append("password", (target.elements.namedItem("password") as HTMLInputElement).value);
          completeFormData.append("postId", postId);

          const completeResponse = await fetch("/api/admin/upload?step=complete", {
            method: "POST",
            body: completeFormData,
          });

          if (!completeResponse.ok) {
            setClientError(await readErrorMessage(completeResponse));
            return;
          }

          router.replace("/admin?status=uploaded");
          router.refresh();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
          setClientError(message);
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {clientError ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{clientError}</p>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm text-zinc-700" htmlFor="password">
          Secret code
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-zinc-700" htmlFor="photos">
          Images
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          required
          onChange={handleFilesChange}
          className="w-full border border-zinc-300 px-4 py-3"
        />
        <p className="text-xs text-zinc-500">Select one or more photos for a single carousel post.</p>
        <p className="text-xs text-zinc-400">{helpText}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-zinc-700" htmlFor="caption">
          Caption
        </label>
        <textarea
          id="caption"
          name="caption"
          rows={4}
          className="w-full border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
          placeholder="Write the full caption shown in fullscreen mode"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm text-zinc-700" htmlFor="takenAt">
            Taken at
          </label>
          <input
            id="takenAt"
            name="takenAt"
            type="date"
            ref={takenAtRef}
            value={takenAtValue}
            onChange={(e) => setTakenAtValue(e.target.value)}
            className="w-full border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
          />
        </div>


      </div>

      <label className="flex items-center gap-3 text-sm text-zinc-700" htmlFor="isPublic">
        <input id="isPublic" name="isPublic" type="checkbox" defaultChecked className="h-4 w-4" />
        Visible in public gallery
      </label>

      <label className="flex items-center gap-3 text-sm text-zinc-700" htmlFor="optimize">
        <input id="optimize" name="optimize" type="checkbox" defaultChecked className="h-4 w-4" />
        Optimize images for web (reduce file size)
      </label>

      <button
        type="submit"
        className="bg-stone-900 px-6 py-3 text-sm text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Uploading..." : "Upload post"}
      </button>
    </form>
  );
}
