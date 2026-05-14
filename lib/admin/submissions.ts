import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface SubmissionListRow {
  id: string;
  template_id: string;
  template_name: string;
  template_slug: string;
  service: string;
  status: string;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_company: string | null;
  started_at: string;
  submitted_at: string | null;
  lead_id: string | null;
}

export async function listSubmissions(): Promise<SubmissionListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questionnaire_submissions")
    .select(
      "id, template_id, status, submitter_name, submitter_email, submitter_company, started_at, submitted_at, lead_id, template:questionnaire_templates(name, slug, service)",
    )
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    template_id: string;
    status: string;
    submitter_name: string | null;
    submitter_email: string | null;
    submitter_company: string | null;
    started_at: string;
    submitted_at: string | null;
    lead_id: string | null;
    template: { name: string; slug: string; service: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    template_id: r.template_id,
    template_name: r.template?.name ?? "Unknown",
    template_slug: r.template?.slug ?? "unknown",
    service: r.template?.service ?? "unknown",
    status: r.status,
    submitter_name: r.submitter_name,
    submitter_email: r.submitter_email,
    submitter_company: r.submitter_company,
    started_at: r.started_at,
    submitted_at: r.submitted_at,
    lead_id: r.lead_id,
  }));
}

export interface SubmissionDetail extends SubmissionListRow {
  template_version: number;
  submitter_role: string | null;
  raw_metadata: Record<string, unknown>;
  sections: SubmissionSection[];
}

export interface SubmissionSection {
  id: string;
  number: number;
  title: string;
  description: string | null;
  answers: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  question_id: string;
  question_label: string;
  question_kind: string;
  value: unknown;
  options: { value: string; label: string }[];
}

export async function getSubmissionDetail(
  submissionId: string,
): Promise<SubmissionDetail | null> {
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from("questionnaire_submissions")
    .select(
      "id, template_id, template_version, status, submitter_name, submitter_email, submitter_company, submitter_role, started_at, submitted_at, lead_id, raw_metadata, template:questionnaire_templates(name, slug, service)",
    )
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) return null;

  type Row = {
    id: string;
    template_id: string;
    template_version: number;
    status: string;
    submitter_name: string | null;
    submitter_email: string | null;
    submitter_company: string | null;
    submitter_role: string | null;
    started_at: string;
    submitted_at: string | null;
    lead_id: string | null;
    raw_metadata: Record<string, unknown>;
    template: { name: string; slug: string; service: string } | null;
  };
  const s = submission as unknown as Row;

  const [sectionsRes, questionsRes, optionsRes, answersRes] = await Promise.all([
    supabase
      .from("questionnaire_sections")
      .select("id, number, title, description, position")
      .eq("template_id", s.template_id)
      .order("position", { ascending: true }),
    supabase
      .from("questionnaire_questions")
      .select("id, section_id, slug, kind, label, position")
      .eq("template_id", s.template_id)
      .order("position", { ascending: true }),
    supabase
      .from("questionnaire_options")
      .select("question_id, value, label, position")
      .order("position", { ascending: true }),
    supabase
      .from("questionnaire_answers")
      .select("question_id, value")
      .eq("submission_id", submissionId),
  ]);

  type SectionR = {
    id: string;
    number: number;
    title: string;
    description: string | null;
    position: number;
  };
  type QuestionR = {
    id: string;
    section_id: string;
    slug: string;
    kind: string;
    label: string;
    position: number;
  };
  type OptionR = { question_id: string; value: string; label: string };
  type AnswerR = { question_id: string; value: unknown };

  const sectionRows = (sectionsRes.data ?? []) as SectionR[];
  const questionRows = (questionsRes.data ?? []) as QuestionR[];
  const optionRows = (optionsRes.data ?? []) as OptionR[];
  const answerRows = (answersRes.data ?? []) as AnswerR[];

  const optsByQ = new Map<string, { value: string; label: string }[]>();
  for (const o of optionRows) {
    const list = optsByQ.get(o.question_id) ?? [];
    list.push({ value: o.value, label: o.label });
    optsByQ.set(o.question_id, list);
  }
  const answerByQ = new Map<string, unknown>();
  for (const a of answerRows) answerByQ.set(a.question_id, a.value);

  const qBySection = new Map<string, SubmissionAnswer[]>();
  for (const q of questionRows) {
    const list = qBySection.get(q.section_id) ?? [];
    list.push({
      question_id: q.id,
      question_label: q.label,
      question_kind: q.kind,
      value: answerByQ.get(q.id) ?? null,
      options: optsByQ.get(q.id) ?? [],
    });
    qBySection.set(q.section_id, list);
  }

  return {
    id: s.id,
    template_id: s.template_id,
    template_version: s.template_version,
    template_name: s.template?.name ?? "Unknown",
    template_slug: s.template?.slug ?? "unknown",
    service: s.template?.service ?? "unknown",
    status: s.status,
    submitter_name: s.submitter_name,
    submitter_email: s.submitter_email,
    submitter_company: s.submitter_company,
    submitter_role: s.submitter_role,
    started_at: s.started_at,
    submitted_at: s.submitted_at,
    lead_id: s.lead_id,
    raw_metadata: s.raw_metadata,
    sections: sectionRows.map((sec) => ({
      id: sec.id,
      number: sec.number,
      title: sec.title,
      description: sec.description,
      answers: qBySection.get(sec.id) ?? [],
    })),
  };
}
