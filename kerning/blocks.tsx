/* eslint-disable @next/next/no-img-element -- Preview images need same-origin cookies, which image optimization does not forward. */
import "server-only";
import { Fragment, type ReactNode } from "react";
import {
  getKerningMediaURL,
  safeLink,
  type KerningBlock,
  type KerningImage,
} from "./content";

function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\))/g;
  const pieces: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index!,
      value = match[0];
    if (at > cursor) pieces.push(text.slice(cursor, at));
    if (value.startsWith("**"))
      pieces.push(<strong key={at}>{value.slice(2, -2)}</strong>);
    else if (value.startsWith("*"))
      pieces.push(<em key={at}>{value.slice(1, -1)}</em>);
    else {
      const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value)!;
      pieces.push(
        safeLink(parts[2]) ? (
          <a key={at} href={parts[2]}>
            {parts[1]}
          </a>
        ) : (
          parts[1]
        ),
      );
    }
    cursor = at + value.length;
  }
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return pieces;
}
function RichText({ body }: { body: string }) {
  return (
    <>
      {body.split(/\n\s*\n/).map((paragraph, index) => {
        if (/^## /.test(paragraph))
          return <h3 key={index}>{inline(paragraph.slice(3))}</h3>;
        if (paragraph.split("\n").every((line) => /^[-*] /.test(line)))
          return (
            <ul key={index}>
              {paragraph.split("\n").map((line, i) => (
                <li key={i}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        return (
          <p key={index}>
            {paragraph.split("\n").map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
function MediaFigure({ image }: { image: KerningImage }) {
  return (
    <figure>
      <img
        src={getKerningMediaURL(image.mediaId)}
        alt={image.alt}
        loading="lazy"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}
/** Semantic, unstyled server components. Apply your existing website's classes; HTML is always escaped. */
export function KerningBlocks({ blocks = [] }: { blocks?: KerningBlock[] }) {
  return (
    <div className="kerning-blocks">
      {blocks.map((block) => {
        if (block.type === "image")
          return <MediaFigure key={block.id} image={block} />;
        return (
          <section key={block.id} data-kerning-block={block.type}>
            {block.heading && <h2>{block.heading}</h2>}
            {block.type === "richText" && <RichText body={block.body} />}
            {block.type === "services" && (
              <div>
                {block.items.map((item, i) => (
                  <article key={i}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.link && safeLink(item.link) && (
                      <a href={item.link}>Learn more</a>
                    )}
                  </article>
                ))}
              </div>
            )}
            {block.type === "testimonials" && (
              <div>
                {block.items.map((item, i) => (
                  <figure key={i}>
                    <blockquote>{item.quote}</blockquote>
                    <figcaption>
                      {item.name}
                      {item.role && " · " + item.role}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {block.type === "faq" && (
              <div>
                {block.items.map((item, i) => (
                  <details key={i}>
                    <summary>{item.question}</summary>
                    <RichText body={item.answer} />
                  </details>
                ))}
              </div>
            )}
            {block.type === "gallery" && (
              <div>
                {block.images.map((image, i) => (
                  <MediaFigure key={i} image={image} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
export function KerningPreviewBanner() {
  return (
    <aside aria-label="Private preview">
      <p>Private preview — this saved snapshot is not published.</p>
      <form method="post" action="/api/kerning/preview-exit">
        <button type="submit">Exit preview</button>
      </form>
    </aside>
  );
}
