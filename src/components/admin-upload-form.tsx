"use client";

import { useMemo, useState } from "react";

import { uploadPhoto } from "@/app/admin/actions";

const MAX_SINGLE_FILE_MB = 18;
const MAX_TOTAL_UPLOAD_MB = 24;

function bytesToMb(bytes: number) {
  return bytes / (1024 * 1024);
}

export function AdminUploadForm() {
  const [clientError, setClientError] = useState<string | null>(null);

  const helpText = useMemo(
    () =>
      `Max ${MAX_SINGLE_FILE_MB}MB per file, ${MAX_TOTAL_UPLOAD_MB}MB total per upload. Large mobile photos can exceed this.`,
    []
  );

  return (
    <form
      action={uploadPhoto}
      className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
      onSubmit={(event) => {
        const target = event.currentTarget;
        const fileInput = target.elements.namedItem("photos") as HTMLInputElement | null;
        const files = fileInput?.files;

        setClientError(null);

        if (!files || files.length === 0) {
          return;
        }

        let totalBytes = 0;

        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) {
            event.preventDefault();
            setClientError(`\"${file.name}\" is not recognized as an image.`);
            return;
          }

          const mb = bytesToMb(file.size);
          if (mb > MAX_SINGLE_FILE_MB) {
            event.preventDefault();
            setClientError(
              `\"${file.name}\" is ${mb.toFixed(1)}MB. Please keep each file under ${MAX_SINGLE_FILE_MB}MB.`
            );
            return;
          }

          totalBytes += file.size;
        }

        const totalMb = bytesToMb(totalBytes);
        if (totalMb > MAX_TOTAL_UPLOAD_MB) {
          event.preventDefault();
          setClientError(`Total upload is ${totalMb.toFixed(1)}MB. Please keep it under ${MAX_TOTAL_UPLOAD_MB}MB.`);
        }
      }}
    >
      {clientError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">{clientError}</p>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm text-zinc-700" htmlFor="password">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
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
          className="w-full rounded-xl border border-zinc-300 px-4 py-3"
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
          className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
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
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-zinc-700" htmlFor="sortOrder">
            Sort order (optional)
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none ring-offset-2 focus:ring-2 focus:ring-zinc-300"
            placeholder="Lower appears first"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-zinc-700" htmlFor="isPublic">
        <input id="isPublic" name="isPublic" type="checkbox" defaultChecked className="h-4 w-4" />
        Visible in public gallery
      </label>

      <button
        type="submit"
        className="rounded-full bg-stone-900 px-6 py-3 text-sm text-white transition hover:bg-stone-700"
      >
        Upload post
      </button>
    </form>
  );
}
