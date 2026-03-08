"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase";

const MAX_SINGLE_FILE_BYTES = 18 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 24 * 1024 * 1024;

function redirectWithError(message: string): never {
  redirect(`/admin?status=error&message=${encodeURIComponent(message)}`);
}

export async function uploadPhoto(formData: FormData) {
  const password = formData.get("password");
  const expectedPassword = process.env.ADMIN_SECRET_CODE ?? process.env.ADMIN_UPLOAD_PASSWORD;

  if (!expectedPassword) {
    redirectWithError(
      "ADMIN_SECRET_CODE (or legacy ADMIN_UPLOAD_PASSWORD) is missing in environment variables."
    );
  }

  if (typeof password !== "string" || password !== expectedPassword) {
    redirectWithError("Incorrect secret code.");
  }

  const fileEntries = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (fileEntries.length === 0) {
    redirectWithError("Please choose one or more image files.");
  }

  const totalBytes = fileEntries.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
    redirectWithError("Total upload is too large. Please upload fewer or smaller photos.");
  }

  for (const file of fileEntries) {
    if (!file.type.startsWith("image/")) {
      redirectWithError(`Unsupported file type for ${file.name}.`);
    }

    if (file.size > MAX_SINGLE_FILE_BYTES) {
      redirectWithError(`${file.name} is too large. Keep each photo under 18MB.`);
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
    redirectWithError(postInsertError?.message || "Failed to create post.");
  }

  const postAssets: Array<{
    post_id: string;
    storage_path: string;
    position: number;
  }> = [];
  for (let index = 0; index < fileEntries.length; index += 1) {
    const file = fileEntries[index];
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const storagePath = `${postData.id}/${index}-${Date.now()}-${sanitizedName.replace(/\.+/g, ".")}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
      contentType: file.type || `image/${extension}`,
      upsert: false,
    });

    if (uploadError) {
      redirectWithError(uploadError.message);
    }

    postAssets.push({
      post_id: postData.id,
      storage_path: storagePath,
      position: index,
    });
  }

  const { error: insertError } = await supabase.from("post_assets").insert(postAssets);

  if (insertError) {
    redirectWithError(insertError.message);
  }

  revalidatePath("/");
  revalidatePath(`/photo/${postData.id}`);
  redirect("/admin?status=uploaded");
}

export async function uploadSinglePhoto(formData: FormData) {
  const singlePhoto = formData.get("photo");

  if (!(singlePhoto instanceof File) || singlePhoto.size === 0) {
    redirectWithError("Choose an image file.");
  }

  const adapted = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key !== "photo") {
      adapted.append(key, value);
    }
  }
  adapted.append("photos", singlePhoto);

  return uploadPhoto(adapted);
}
