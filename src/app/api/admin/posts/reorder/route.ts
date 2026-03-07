import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase";

type ReorderPayload = {
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
    const payload = (await request.json().catch(() => null)) as ReorderPayload | null;
    const passwordValidation = validatePassword(payload?.password);

    if (!passwordValidation.ok) {
      return passwordValidation.response;
    }

    const postIds = (payload?.postIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    if (postIds.length === 0) {
      return jsonError("Provide at least one post id.");
    }

    const supabase = createSupabaseAdminClient();

    for (let index = 0; index < postIds.length; index += 1) {
      const postId = postIds[index];
      const { error } = await supabase
        .from("posts")
        .update({ sort_order: index })
        .eq("id", postId);

      if (error) {
        return jsonError(error.message, 500);
      }
    }

    revalidatePath("/");
    revalidatePath("/timeline");
    revalidatePath("/admin");

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Reorder failed unexpectedly. Please try again.", 500);
  }
}
