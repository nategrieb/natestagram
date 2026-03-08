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

function isLikelyImageFromNameType(fileName: string, fileType: string) {
  if (fileType.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function validatePassword(formData: FormData) {
  const password = formData.get("password");
  // prefer new variable name but fall back for compatibility
  const expectedPassword = process.env.ADMIN_SECRET_CODE ?? process.env.ADMIN_UPLOAD_PASSWORD;

  if (!expectedPassword) {
    return {
      ok: false as const,
      response: jsonError(
        "ADMIN_SECRET_CODE (or legacy ADMIN_UPLOAD_PASSWORD) is missing in environment variables.",
        500
      ),
    };
  }

  if (typeof password !== "string" || password !== expectedPassword) {
    return { ok: false as const, response: jsonError("Incorrect secret code.", 401) };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  // debug: ensure environment variables are loaded
  console.log("DEBUG env NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("DEBUG env ADMIN_SECRET_CODE", process.env.ADMIN_SECRET_CODE,
    "legacy", process.env.ADMIN_UPLOAD_PASSWORD);

  try {
    const step = new URL(request.url).searchParams.get("step") ?? "legacy";
    const formData = await request.formData();

    const passwordValidation = validatePassword(formData);
    if (!passwordValidation.ok) {
      return passwordValidation.response;
    }

    const caption = formData.get("caption");
    const takenAt = formData.get("takenAt");
    const isPublic = formData.get("isPublic") === "on";
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";

    const supabase = createSupabaseAdminClient();

    if (step === "init") {
      const sortOrder = null; // default ordering handled elsewhere

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

      return NextResponse.json({ ok: true, postId: postData.id });
    }

    if (step === "prepare-asset") {
      const postId = formData.get("postId");
      const positionRaw = formData.get("position");
      const fileNameRaw = formData.get("fileName");
      const fileTypeRaw = formData.get("fileType");
      const fileSizeRaw = formData.get("fileSize");

      if (typeof postId !== "string" || postId.length === 0) {
        return jsonError("Missing post identifier.");
      }

      const position = typeof positionRaw === "string" ? Number(positionRaw) : Number.NaN;
      if (!Number.isFinite(position) || position < 0) {
        return jsonError("Missing photo position.");
      }

      const fileName = typeof fileNameRaw === "string" ? fileNameRaw : "";
      const fileType = typeof fileTypeRaw === "string" ? fileTypeRaw : "";
      const fileSize = typeof fileSizeRaw === "string" ? Number(fileSizeRaw) : Number.NaN;

      if (!fileName) {
        return jsonError("Missing file name.");
      }

      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return jsonError("Missing file size.");
      }

      if (!isLikelyImageFromNameType(fileName, fileType)) {
        return jsonError(`Unsupported file type for ${fileName}.`);
      }

      if (fileSize > MAX_SINGLE_FILE_BYTES) {
        return jsonError(`${fileName} is too large. Keep each photo under 18MB.`);
      }

      const extension = getFileExtension(fileName) || "jpg";
      const sanitizedName = fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const storagePath = `${postId}/${position}-${Date.now()}-${sanitizedName.replace(/\.+/g, ".")}`;

      const signed = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath, { upsert: false });

      if (signed.error || !signed.data) {
        return jsonError(signed.error?.message || "Failed to prepare upload URL.", 500);
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return jsonError("Supabase URL not configured.", 500);
      }

      const hostname = new URL(supabaseUrl).hostname;
      const uploadUrl = `https://${hostname}/storage/v1/object/upload/sign/${signed.data.path}?token=${signed.data.token}`;

      return NextResponse.json({
        ok: true,
        bucket,
        path: signed.data.path,
        token: signed.data.token,
        contentType: fileType || `image/${extension}`,
      });
    }

    if (step === "register-asset") {
      const postId = formData.get("postId");
      const positionRaw = formData.get("position");
      const storagePathRaw = formData.get("storagePath");

      if (typeof postId !== "string" || postId.length === 0) {
        return jsonError("Missing post identifier.");
      }

      const position = typeof positionRaw === "string" ? Number(positionRaw) : Number.NaN;
      if (!Number.isFinite(position) || position < 0) {
        return jsonError("Missing photo position.");
      }

      const storagePath = typeof storagePathRaw === "string" ? storagePathRaw : "";
      if (!storagePath) {
        return jsonError("Missing uploaded file path.");
      }

      const widthRaw = formData.get("width");
      const heightRaw = formData.get("height");
      const dominantColorRaw = formData.get("dominantColor");
      const width = typeof widthRaw === "string" && widthRaw ? Number(widthRaw) : null;
      const height = typeof heightRaw === "string" && heightRaw ? Number(heightRaw) : null;
      const dominantColor = typeof dominantColorRaw === "string" && dominantColorRaw ? dominantColorRaw : null;

      const str = (key: string) => { const v = formData.get(key); return typeof v === "string" && v ? v : null; };
      const cameraMake = str("cameraMake");
      const cameraModel = str("cameraModel");
      const focalLength = str("focalLength");
      const aperture = str("aperture");
      const shutterSpeed = str("shutterSpeed");
      const isoRaw = str("iso");
      const iso = isoRaw ? Number(isoRaw) : null;

      const { error: insertError } = await supabase.from("post_assets").insert({
        post_id: postId,
        storage_path: storagePath,
        position,
        width: Number.isFinite(width) && width && width > 0 ? width : null,
        height: Number.isFinite(height) && height && height > 0 ? height : null,
        dominant_color: dominantColor,
        camera_make: cameraMake,
        camera_model: cameraModel,
        focal_length: focalLength,
        aperture,
        shutter_speed: shutterSpeed,
        iso: Number.isFinite(iso) && iso ? iso : null,
      });

      if (insertError) {
        return jsonError(insertError.message, 500);
      }

      return NextResponse.json({ ok: true });
    }

    if (step === "complete") {
      const postId = formData.get("postId");
      if (typeof postId !== "string" || postId.length === 0) {
        return jsonError("Missing post identifier.");
      }

      revalidatePath("/");
      revalidatePath(`/photo/${postId}`);

      return NextResponse.json({ ok: true });
    }

    // Backward-compatible legacy path (single request containing all files).
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

    const sortOrder = null; // legacy path no longer supports custom order

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
