import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase";

const MAX_SINGLE_FILE_BYTES = 18 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 24 * 1024 * 1024;

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

function getFileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isLikelyImage(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(getFileExtension(file.name));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const password = formData.get("password");
    const expectedPassword = process.env.ADMIN_UPLOAD_PASSWORD;

    if (!expectedPassword) {
      return jsonError("ADMIN_UPLOAD_PASSWORD is missing in environment variables.", 500);
    }

    if (typeof password !== "string" || password !== expectedPassword) {
      return jsonError("Incorrect admin password.", 401);
    }

    const fileEntries = formData
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (fileEntries.length === 0) {
      return jsonError("Please choose one or more image files.");
    }

    const totalBytes = fileEntries.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      return jsonError("Total upload is too large. Please upload fewer or smaller photos.");
    }

    for (const file of fileEntries) {
      if (!isLikelyImage(file)) {
        return jsonError(`Unsupported file type for ${file.name}.`);
      }

      if (file.size > MAX_SINGLE_FILE_BYTES) {
        return jsonError(`${file.name} is too large. Keep each photo under 18MB.`);
      }
    }

    const caption = formData.get("caption");
    const takenAt = formData.get("takenAt");
    const isPublic = formData.get("isPublic") === "on";
    const sortOrderRaw = formData.get("sortOrder");

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

    const supabase = createSupabaseAdminClient();

    const sortOrder =
      typeof sortOrderRaw === "string" && sortOrderRaw.trim().length > 0
        ? Number(sortOrderRaw)
        : null;

    const { data: postData, error: postInsertError } = await supabase
      .from("posts")
      .insert({
        caption: typeof caption === "string" ? caption.trim() : null,
        taken_at: typeof takenAt === "string" && takenAt ? takenAt : null,
        is_public: isPublic,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : null,
      })
      .select("id")
      .single();

    if (postInsertError || !postData) {
      return jsonError(postInsertError?.message || "Failed to create post.", 500);
    }

    const postAssets: Array<{
      post_id: string;
      storage_path: string;
      position: number;
    }> = [];

    for (let index = 0; index < fileEntries.length; index += 1) {
      const file = fileEntries[index];
      const extension = getFileExtension(file.name) || "jpg";
      const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const storagePath = `${postData.id}/${index}-${Date.now()}-${sanitizedName.replace(/\.+/g, ".")}`;
      const fileBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
        contentType: file.type || `image/${extension}`,
        upsert: false,
      });

      if (uploadError) {
        return jsonError(uploadError.message, 500);
      }

      postAssets.push({
        post_id: postData.id,
        storage_path: storagePath,
        position: index,
      });
    }

    const { error: insertError } = await supabase.from("post_assets").insert(postAssets);

    if (insertError) {
      return jsonError(insertError.message, 500);
    }

    revalidatePath("/");
    revalidatePath(`/photo/${postData.id}`);

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Upload failed unexpectedly. Please try again.", 500);
  }
}
