import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

const InsightFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  readTime: z.number().optional(),
});

export type InsightFrontmatter = z.infer<typeof InsightFrontmatterSchema>;

export type InsightMeta = InsightFrontmatter & {
  slug: string;
};

export type InsightDoc = InsightMeta & {
  content: string;
};

const INSIGHTS_DIR = path.join(process.cwd(), "content/insights");

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };

  const yaml = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  yaml.split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value: unknown = line.slice(idx + 1).trim();
    if (typeof value === "string") {
      const v = value as string;
      if (v.startsWith("[") && v.endsWith("]")) {
        value = v
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (v === "true") value = true;
      else if (v === "false") value = false;
      else if (/^-?\d+(\.\d+)?$/.test(v)) value = Number(v);
      else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        value = v.slice(1, -1);
      }
    }
    data[key] = value;
  });

  return { data, content: body };
}

export async function getAllInsights(): Promise<InsightMeta[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(INSIGHTS_DIR);
  } catch {
    return [];
  }
  const docs: InsightMeta[] = [];
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.mdx$/, "");
    const raw = await fs.readFile(path.join(INSIGHTS_DIR, file), "utf8");
    const { data } = parseFrontmatter(raw);
    const fm = InsightFrontmatterSchema.parse(data);
    docs.push({ ...fm, slug });
  }
  docs.sort((a, b) => b.date.getTime() - a.date.getTime());
  return docs;
}

export async function getInsight(slug: string): Promise<InsightDoc | null> {
  const file = path.join(INSIGHTS_DIR, `${slug}.mdx`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const { data, content } = parseFrontmatter(raw);
    const fm = InsightFrontmatterSchema.parse(data);
    return { ...fm, slug, content };
  } catch {
    return null;
  }
}
