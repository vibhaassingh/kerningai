import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  KERNING_SITE_ID,
  PREVIEW_COOKIE,
  boundedBytes,
  getKerningPublishedRelease,
  getKerningPreview,
  isID,
  isPreviewToken,
  mediaIDs,
  portalURL,
  previewToken,
} from "./content";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: privateHeaders });
const unavailable = () =>
  json(
    {
      error: {
        code: "KERNING_UNAVAILABLE",
        message:
          "Content is unavailable. Try again or open a fresh preview from Kerning.",
      },
    },
    503,
  );
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 1800,
};

/** Exact raw-body HMAC shared with the portal; timestamps are milliseconds, with a five-minute tolerance. */
export function validSignature(
  body: string,
  secret: string,
  timestamp: string,
  signature: string,
  now = Date.now(),
): boolean {
  if (
    !/^\d{10,13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 300000 ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + body)
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
}
export async function kerningRevalidatePOST(
  request: Request,
): Promise<Response> {
  const secret = process.env.KERNING_WEBHOOK_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/.test(secret)) return unavailable();
  let body: string;
  try {
    body = new TextDecoder("utf-8", { fatal: true }).decode(
      await boundedBytes(new Response(request.body), 4096),
    );
  } catch {
    return json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  if (
    !validSignature(
      body,
      secret,
      request.headers.get("x-kerning-timestamp") || "",
      request.headers.get("x-kerning-signature") || "",
    )
  )
    return json({ error: { code: "INVALID_SIGNATURE" } }, 401);
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
    if (!event || Array.isArray(event) || typeof event !== "object")
      throw new Error();
  } catch {
    return json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  if (
    event.siteId !== KERNING_SITE_ID ||
    event.event !== "content.published" ||
    !isID(event.releaseId)
  )
    return json({ error: { code: "INVALID_EVENT" } }, 422);
  try {
    const published = await getKerningPublishedRelease();
    if (published.release?.id !== event.releaseId)
      return json({ error: { code: "RELEASE_MISMATCH" } }, 409);
    revalidatePath("/", "layout");
    // This confirms invalidation only. The portal also checks status and the rendered homepage marker.
    return json({
      accepted: true,
      siteId: KERNING_SITE_ID,
      releaseId: published.release.id,
    });
  } catch {
    return unavailable();
  }
}
export async function kerningStatusGET(): Promise<Response> {
  try {
    // Deliberately ignores preview cookies. A status response is never proof that a page mapped its content.
    const published = await getKerningPublishedRelease();
    return json({
      siteId: KERNING_SITE_ID,
      releaseId: published.release!.id,
      releaseNumber: published.release!.number,
      connectorVersion: 2,
    });
  } catch {
    return unavailable();
  }
}
export async function kerningPreviewGET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isPreviewToken(token))
    return json({ error: { code: "PREVIEW_UNAVAILABLE" } }, 404);
  try {
    await getKerningPreview(token); // Fetch, check expiry, and bind the snapshot to this configured site before issuing a cookie.
    (await cookies()).set(PREVIEW_COOKIE, token, cookieOptions);
    return new Response(null, {
      status: 303,
      headers: { ...privateHeaders, Location: "/" },
    });
  } catch {
    return json(
      {
        error: {
          code: "PREVIEW_UNAVAILABLE",
          message:
            "This preview is unavailable or expired. Open a new preview from Kerning.",
        },
      },
      404,
    );
  }
}
export async function kerningPreviewExitPOST(
  request: Request,
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: { code: "INVALID_ORIGIN" } }, 403);
  (await cookies()).set(PREVIEW_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return new Response(null, {
    status: 303,
    headers: { ...privateHeaders, Location: "/" },
  });
}
export async function kerningMediaGET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!isID(id)) return json({ error: { code: "MEDIA_UNAVAILABLE" } }, 404);
  try {
    const token = await previewToken();
    const release = token
      ? await getKerningPreview(token)
      : await getKerningPublishedRelease();
    if (!mediaIDs(release).includes(id))
      return json({ error: { code: "MEDIA_UNAVAILABLE" } }, 404);
    const response = await fetch(
      portalURL(
        "/api/media/file?id=" + id + (token ? "&preview=" + token : ""),
      ),
      {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
    const type = response.headers.get("content-type")?.split(";")[0];
    if (
      !response.ok ||
      !["image/webp", "image/png", "image/jpeg"].includes(type || "")
    )
      return json({ error: { code: "MEDIA_UNAVAILABLE" } }, 404);
    const bytes = await boundedBytes(response, 4 * 1024 * 1024);
    return new Response(Buffer.from(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": type!,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return unavailable();
  }
}
