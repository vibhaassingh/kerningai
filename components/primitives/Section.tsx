import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type SectionProps = {
  as?: "section" | "div" | "article" | "main" | "aside";
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
  bleed?: boolean;
};

export function Section({
  as = "section",
  id,
  className,
  containerClassName,
  children,
  bleed = false,
}: SectionProps) {
  const Tag = as as "section";
  return (
    <Tag
      id={id}
      className={cn(
        "relative w-full px-6 py-24 md:px-10 md:py-32 lg:py-40",
        className,
      )}
    >
      {bleed ? (
        children
      ) : (
        <div
          className={cn(
            "mx-auto w-full max-w-[1440px]",
            containerClassName,
          )}
        >
          {children}
        </div>
      )}
    </Tag>
  );
}
