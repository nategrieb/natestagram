import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminForApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

const MAX_SINGLE_FILE_BYTES = 18 * 1024 * 1024;

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

function isLikelyImageFromNameType(fileName: string, fileType: string) {
  if (fileType.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminForApi();
    if (!admin.ok) {
      return admin.response;
    }

    const step = new URL(request.url).searchParams.get("step");
    const formData = await request.formData();


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

    return jsonError("Unknown upload step.");
  } catch {
    return jsonError("Upload failed unexpectedly. Please try again.", 500);
  }
}
