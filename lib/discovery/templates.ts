import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type QuestionKind =
  | "short_text"
  | "long_text"
  | "single_select"
  | "multi_select"
  | "boolean"
  | "number"
  | "currency"
  | "date";
// Remaining kinds (file, integration_selector, …) ship in Phase 3b.

export interface QuestionnaireOption {
  value: string;
  label: string;
  description: string | null;
}

export interface QuestionnaireQuestion {
  id: string;
  slug: string;
  kind: QuestionKind;
  label: string;
  help: string | null;
  placeholder: string | null;
  required: boolean;
  config: Record<string, unknown>;
  options: QuestionnaireOption[];
}

export interface QuestionnaireSection {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string | null;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireTemplate {
  id: string;
  slug: string;
  service: string;
  name: string;
  description: string | null;
  version: number;
  status: "draft" | "published" | "archived";
  estimated_minutes: number | null;
  intro_eyebrow: string | null;
  intro_heading: string | null;
  intro_body: string | null;
  sections: QuestionnaireSection[];
}

export async function listPublishedTemplates(): Promise<QuestionnaireTemplate[]> {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("questionnaire_templates")
    .select(
      "id, slug, service, name, description, version, status, estimated_minutes, intro_eyebrow, intro_heading, intro_body",
    )
    .eq("status", "published")
    .order("name", { ascending: true });

  // For listing we don't need the full structure — just metadata.
  return ((templates ?? []) as QuestionnaireTemplate[]).map((t) => ({ ...t, sections: [] }));
}

export async function getPublishedTemplateBySlug(
  slug: string,
): Promise<QuestionnaireTemplate | null> {
  // Use service role — anonymous prospects must be able to read template
  // structure even when RLS rules tighten later.
  const service = createServiceClient();

  const { data: template } = await service
    .from("questionnaire_templates")
    .select(
      "id, slug, service, name, description, version, status, estimated_minutes, intro_eyebrow, intro_heading, intro_body",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!template) return null;

  const [{ data: sections }, { data: questions }, { data: options }] = await Promise.all([
    service
      .from("questionnaire_sections")
      .select("id, number, slug, title, description, position")
      .eq("template_id", template.id)
      .order("position", { ascending: true }),
    service
      .from("questionnaire_questions")
      .select(
        "id, section_id, position, slug, kind, label, help, placeholder, required, config",
      )
      .eq("template_id", template.id)
      .order("position", { ascending: true }),
    service
      .from("questionnaire_options")
      .select("question_id, value, label, description, position")
      .order("position", { ascending: true }),
  ]);

  type SectionRow = {
    id: string;
    number: number;
    slug: string;
    title: string;
    description: string | null;
    position: number;
  };
  type QuestionRow = {
    id: string;
    section_id: string;
    position: number;
    slug: string;
    kind: QuestionKind;
    label: string;
    help: string | null;
    placeholder: string | null;
    required: boolean;
    config: Record<string, unknown>;
  };
  type OptionRow = {
    question_id: string;
    value: string;
    label: string;
    description: string | null;
    position: number;
  };

  const sectionRows = (sections ?? []) as SectionRow[];
  const questionRows = (questions ?? []) as QuestionRow[];
  const optionRows = (options ?? []) as OptionRow[];

  const optionsByQuestion = new Map<string, QuestionnaireOption[]>();
  for (const o of optionRows) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({ value: o.value, label: o.label, description: o.description });
    optionsByQuestion.set(o.question_id, list);
  }

  const questionsBySection = new Map<string, QuestionnaireQuestion[]>();
  for (const q of questionRows) {
    const list = questionsBySection.get(q.section_id) ?? [];
    list.push({
      id: q.id,
      slug: q.slug,
      kind: q.kind,
      label: q.label,
      help: q.help,
      placeholder: q.placeholder,
      required: q.required,
      config: q.config,
      options: optionsByQuestion.get(q.id) ?? [],
    });
    questionsBySection.set(q.section_id, list);
  }

  return {
    id: template.id,
    slug: template.slug,
    service: template.service,
    name: template.name,
    description: template.description,
    version: template.version,
    status: template.status,
    estimated_minutes: template.estimated_minutes,
    intro_eyebrow: template.intro_eyebrow,
    intro_heading: template.intro_heading,
    intro_body: template.intro_body,
    sections: sectionRows.map((s) => ({
      id: s.id,
      number: s.number,
      slug: s.slug,
      title: s.title,
      description: s.description,
      questions: questionsBySection.get(s.id) ?? [],
    })),
  };
}
