"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { withAudit } from "@/lib/audit/with-audit";
import type { ActionResult } from "@/lib/auth/actions";
import { createServiceClient } from "@/lib/supabase/service";

const DISCOVERY_COOKIE = "kai_discovery";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

interface DiscoveryCookieValue {
  submissionId: string;
  token: string;
}

function setDiscoveryCookie(
  store: Awaited<ReturnType<typeof cookies>>,
  value: DiscoveryCookieValue,
) {
  store.set(DISCOVERY_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_S,
    path: "/",
  });
}

function readDiscoveryCookie(
  store: Awaited<ReturnType<typeof cookies>>,
): DiscoveryCookieValue | null {
  const raw = store.get(DISCOVERY_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DiscoveryCookieValue;
    if (!parsed.submissionId || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Form-driven Server Action: starts (or reuses) a draft submission and
 * redirects to the questionnaire page. Cookie writes only happen inside
 * Server Actions or Route Handlers, so this is the single entry point
 * for issuing a session.
 */
export async function beginSubmission(formData: FormData): Promise<void> {
  const slug = String(formData.get("templateSlug") ?? "");
  if (!slug) throw new Error("templateSlug missing");
  await startSubmission(slug);
  redirect(`/discovery/${slug}`);
}

/**
 * Reads the current submission cookie and returns the matching
 * submission id if it's a valid draft for the given template. Read-only —
 * safe to call from Server Components.
 */
export async function findActiveSubmission(
  templateSlug: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  if (!session) return null;

  const service = createServiceClient();
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select(
      "id, status, resume_token_hash, template:questionnaire_templates(slug)",
    )
    .eq("id", session.submissionId)
    .maybeSingle();
  if (!submission) return null;

  type Row = {
    id: string;
    status: string;
    resume_token_hash: string;
    template: { slug: string } | null;
  };
  const s = submission as unknown as Row;
  if (s.status !== "draft") return null;
  if (s.resume_token_hash !== hashToken(session.token)) return null;
  if (s.template?.slug !== templateSlug) return null;
  return s.id;
}

/**
 * Starts a new draft submission for the given template. Sets a cookie
 * containing the submission id + a resume token; the hash of the token
 * is stored in the DB so a leaked DB row alone can't replay the session.
 *
 * Must be called from a Server Action or Route Handler (cookie write).
 */
export async function startSubmission(
  templateSlug: string,
): Promise<{ submissionId: string }> {
  const service = createServiceClient();
  const { data: template } = await service
    .from("questionnaire_templates")
    .select("id, version, status")
    .eq("slug", templateSlug)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) throw new Error(`Template not found: ${templateSlug}`);

  const cookieStore = await cookies();
  const existing = readDiscoveryCookie(cookieStore);

  // If we already have a submission cookie for this same template version,
  // reuse it (resume case). Otherwise start fresh.
  if (existing) {
    const { data: priorSubmission } = await service
      .from("questionnaire_submissions")
      .select("id, status, template_id, resume_token_hash")
      .eq("id", existing.submissionId)
      .eq("template_id", template.id)
      .maybeSingle();
    if (
      priorSubmission &&
      priorSubmission.status === "draft" &&
      priorSubmission.resume_token_hash === hashToken(existing.token)
    ) {
      return { submissionId: existing.submissionId };
    }
  }

  const token = randomBytes(32).toString("base64url");
  const h = await headers();

  const { data: submission, error } = await service
    .from("questionnaire_submissions")
    .insert({
      template_id: template.id,
      template_version: template.version,
      status: "draft",
      resume_token_hash: hashToken(token),
      raw_metadata: {
        ip:
          h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          h.get("x-real-ip") ??
          null,
        user_agent: h.get("user-agent") ?? null,
      },
    })
    .select("id")
    .single();

  if (error || !submission) {
    throw new Error(error?.message ?? "Could not start submission");
  }

  setDiscoveryCookie(cookieStore, {
    submissionId: submission.id,
    token,
  });

  return { submissionId: submission.id };
}

const saveAnswerSchema = z.object({
  questionId: z.string().uuid(),
  // Accept JSON-stringified value so we can support arrays + primitives
  // uniformly. The client serializes before sending.
  valueJson: z.string(),
});

/**
 * Persists a single answer. Returns silently on success — autosave UI
 * uses optimistic state and only highlights failures.
 */
export async function saveAnswer(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = saveAnswerSchema.safeParse({
    questionId: formData.get("questionId"),
    valueJson: formData.get("valueJson"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  if (!session) {
    return { ok: false, error: "Your session expired. Refresh the page to resume." };
  }

  let value: unknown;
  try {
    value = JSON.parse(parsed.data.valueJson);
  } catch {
    return { ok: false, error: "Could not parse the answer value." };
  }

  const service = createServiceClient();

  // Verify the cookie belongs to this submission.
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select("id, status, resume_token_hash")
    .eq("id", session.submissionId)
    .maybeSingle();
  if (
    !submission ||
    submission.status !== "draft" ||
    submission.resume_token_hash !== hashToken(session.token)
  ) {
    return { ok: false, error: "Session not recognised." };
  }

  const { error } = await service
    .from("questionnaire_answers")
    .upsert(
      {
        submission_id: session.submissionId,
        question_id: parsed.data.questionId,
        value,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "submission_id,question_id" },
    );

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// File upload — real bytes to the `questionnaire-uploads` Storage bucket.
// Anonymous prospects route through this service-role action (the bucket
// RLS comment in 0004 documents exactly this path). The action both
// uploads the object AND upserts the answer value as a metadata record:
//   { name, size, path, bucket, uploaded_at }
// ---------------------------------------------------------------------------
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // matches bucket file_size_limit

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(-120) || "file"
  );
}

export interface UploadedFileMeta {
  name: string;
  size: number;
  path: string;
  bucket: string;
  uploaded_at: string;
}

export async function uploadQuestionnaireFile(
  _prev: ActionResult<{ file: UploadedFileMeta }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ file: UploadedFileMeta }>> {
  const questionId = formData.get("questionId");
  const file = formData.get("file");
  if (typeof questionId !== "string" || !questionId) {
    return { ok: false, error: "Missing question." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File exceeds the 50 MB limit." };
  }

  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  if (!session) {
    return { ok: false, error: "Your session expired. Refresh to resume." };
  }

  const service = createServiceClient();
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select("id, status, resume_token_hash")
    .eq("id", session.submissionId)
    .maybeSingle();
  if (
    !submission ||
    submission.status !== "draft" ||
    submission.resume_token_hash !== hashToken(session.token)
  ) {
    return { ok: false, error: "Session not recognised." };
  }

  const safeName = sanitizeFilename(file.name);
  const path = `submissions/${session.submissionId}/${questionId}-${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await service.storage
    .from("questionnaire-uploads")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (upErr) {
    return { ok: false, error: `Upload failed: ${upErr.message}` };
  }

  const meta: UploadedFileMeta = {
    name: file.name,
    size: file.size,
    path,
    bucket: "questionnaire-uploads",
    uploaded_at: new Date().toISOString(),
  };

  const { error: ansErr } = await service
    .from("questionnaire_answers")
    .upsert(
      {
        submission_id: session.submissionId,
        question_id: questionId,
        value: meta,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "submission_id,question_id" },
    );
  if (ansErr) return { ok: false, error: ansErr.message };

  return { ok: true, data: { file: meta } };
}

const submitSchema = z.object({
  submitterName: z.string().min(2),
  submitterEmail: z.string().email(),
  submitterCompany: z.string().optional(),
  submitterRole: z.string().optional(),
});

/**
 * Finalises the submission, captures submitter identity, and creates an
 * attached lead so the sales team picks it up automatically.
 */
export async function submitSubmission(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = submitSchema.safeParse({
    submitterName: formData.get("submitterName"),
    submitterEmail: formData.get("submitterEmail"),
    submitterCompany: formData.get("submitterCompany") || undefined,
    submitterRole: formData.get("submitterRole") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }

  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  if (!session) {
    return { ok: false, error: "Your session expired. Refresh the page to resume." };
  }

  const service = createServiceClient();
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select(
      "id, template_id, status, resume_token_hash, lead_id, template:questionnaire_templates(name, service)",
    )
    .eq("id", session.submissionId)
    .maybeSingle();
  if (
    !submission ||
    submission.resume_token_hash !== hashToken(session.token) ||
    submission.status !== "draft"
  ) {
    return { ok: false, error: "Session not recognised." };
  }

  // Create or find a lead tied to this submission.
  let leadId = submission.lead_id;
  if (!leadId) {
    const { data: lead, error: leadError } = await service
      .from("leads")
      .insert({
        source: "discovery_questionnaire",
        status: "qualified",
        company_name: parsed.data.submitterCompany ?? null,
        contact_name: parsed.data.submitterName,
        contact_email: parsed.data.submitterEmail,
        contact_role: parsed.data.submitterRole ?? null,
        intent_summary: `Submitted "${(submission as { template?: { name?: string } }).template?.name ?? "questionnaire"}".`,
        submission_id: submission.id,
        raw_payload: { submission_id: submission.id },
      })
      .select("id")
      .single();
    if (!leadError && lead) {
      leadId = lead.id;
    }
  }

  const { error: updateErr } = await service
    .from("questionnaire_submissions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitter_name: parsed.data.submitterName,
      submitter_email: parsed.data.submitterEmail,
      submitter_company: parsed.data.submitterCompany ?? null,
      submitter_role: parsed.data.submitterRole ?? null,
      lead_id: leadId,
    })
    .eq("id", submission.id);
  if (updateErr) return { ok: false, error: updateErr.message };

  if (leadId) {
    await service.from("lead_activities").insert({
      lead_id: leadId,
      kind: "note",
      body: `Discovery submission completed by ${parsed.data.submitterName}.`,
      payload: { submission_id: submission.id },
    });
  }

  await withAudit(
    {
      action: "submission.submitted",
      resourceType: "questionnaire_submission",
      resourceId: submission.id,
      after: {
        template_id: submission.template_id,
        email: parsed.data.submitterEmail,
        lead_id: leadId,
      },
    },
    async () => null,
  );

  // Clear the cookie so a refresh starts fresh next time.
  cookieStore.delete(DISCOVERY_COOKIE);
  redirect(`/discovery/complete?ref=${submission.id}`);
}

export async function getCurrentSubmissionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  return session?.submissionId ?? null;
}

/** Map of question id → stored value, for hydrating the stepper. */
export async function getCurrentAnswers(): Promise<Record<string, unknown>> {
  const cookieStore = await cookies();
  const session = readDiscoveryCookie(cookieStore);
  if (!session) return {};

  const service = createServiceClient();
  const { data: submission } = await service
    .from("questionnaire_submissions")
    .select("id, status, resume_token_hash")
    .eq("id", session.submissionId)
    .maybeSingle();
  if (
    !submission ||
    submission.status !== "draft" ||
    submission.resume_token_hash !== hashToken(session.token)
  ) {
    return {};
  }

  const { data: answers } = await service
    .from("questionnaire_answers")
    .select("question_id, value")
    .eq("submission_id", session.submissionId);

  const map: Record<string, unknown> = {};
  for (const a of (answers ?? []) as { question_id: string; value: unknown }[]) {
    map[a.question_id] = a.value;
  }
  return map;
}
