import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase";

type DeletePayload = {
  password?: string;
  postIds?: string[];
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function validatePassword(password: string | undefined) {
  const expectedPassword = process.env.ADMIN_UPLOAD_PASSWORD;

  if (!expectedPassword) {
    return { ok: false as const, response: jsonError("ADMIN_UPLOAD_PASSWORD is missing in environment variables.", 500) };
  }

  if (!password || password !== expectedPassword) {
    return { ok: false as const, response: jsonError("Incorrect admin password.", 401) };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as DeletePayload | null;
    const passwordValidation = validatePassword(payload?.password);

    if (!passwordValidation.ok) {
      return passwordValidation.response;
    }

    const postIds = (payload?.postIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    if (postIds.length === 0) {
      return jsonError("Choose at least one post to delete.");
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "photos";
    const supabase = createSupabaseAdminClient();

    const { data: assets, error: assetFetchError } = await supabase
      .from("post_assets")
      .select("storage_path")
      .in("post_id", postIds);

    if (assetFetchError) {
      return jsonError(assetFetchError.message, 500);
    }

    const storagePaths = (assets ?? [])
      .map((asset) => asset.storage_path)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    if (storagePaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage.from(bucket).remove(storagePaths);
      if (storageDeleteError) {
        return jsonError(storageDeleteError.message, 500);
      }
    }

    const { error: deleteAssetsError } = await supabase
      .from("post_assets")
      .delete()
      .in("post_id", postIds);

    if (deleteAssetsError) {
      return jsonError(deleteAssetsError.message, 500);
    }

    const { error: deletePostsError } = await supabase
      .from("posts")
      .delete()
      .in("id", postIds);

    if (deletePostsError) {
      return jsonError(deletePostsError.message, 500);
    }

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/admin");
    for (const postId of postIds) {
      revalidatePath(`/photo/${postId}`);
    }

    return NextResponse.json({ ok: true, deleted: postIds.length });
  } catch {
    return jsonError("Delete failed unexpectedly. Please try again.", 500);
  }
}
