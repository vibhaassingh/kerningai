"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion-springs";
import { PRIMARY_NAV } from "@/content/nav";
import { Logo } from "./Logo";
import { LiquidPill } from "@/components/primitives/LiquidPill";

/**
 * Family Dynamic-Island floating nav — synced with Hospitality / Arch.
 * Centre-pinned glass pill, sits 12-16px below the top edge. On
 * scroll past 24px it scales down to 0.94 and the backdrop-blur
 * intensifies — both driven by Framer Motion springs (no transition
 * timing).
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 md:top-4">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] items-start justify-center px-3 md:px-6">
        <motion.nav
          initial={false}
          animate={{
            scale: scrolled ? 0.94 : 1,
            backdropFilter: scrolled
              ? "blur(40px) saturate(180%)"
              : "blur(28px) saturate(160%)",
          }}
          transition={reduce ? { duration: 0 } : springs.apple}
          className={cn(
            "liquid-glass pill flex items-center gap-1 px-2 py-2 md:gap-2 will-change-transform",
          )}
          style={{ originY: 0 }}
        >
          <div className="ml-2 mr-3 flex items-center md:ml-3">
            <Logo />
          </div>

          <ul className="hidden items-center md:flex">
            {PRIMARY_NAV.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-[0.9rem] transition-[opacity,background-color] duration-300",
                      active
                        ? "opacity-100"
                        : "opacity-80 hover:opacity-100 hover:bg-[var(--color-text)]/10",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <span
            aria-hidden
            className="mx-1 hidden h-4 w-px bg-[var(--color-text)]/15 md:inline-block"
          />

          <Link
            href="/login"
            aria-label="Sign in to the workspace"
            className={cn(
              "hidden md:inline-flex items-center gap-1 rounded-full",
              "px-3 py-2 text-[0.85rem] opacity-65",
              "transition-[opacity,background-color] duration-300 hover:opacity-100 hover:bg-[var(--color-text)]/10",
            )}
          >
            <span>Sign in</span>
            <span aria-hidden className="text-[0.9em] leading-none">↗</span>
          </Link>

          <div className="ml-1 hidden md:block">
            <LiquidPill
              href="/contact"
              variant="accent"
              className="px-4 py-2 text-[0.9rem]"
            >
              Start a conversation
            </LiquidPill>
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden mx-1 flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full"
          >
            <span
              className={cn(
                "block h-px w-5 bg-current transition-transform",
                open && "translate-y-[3px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-px w-5 bg-current transition-transform",
                open && "-translate-y-[3px] -rotate-45",
              )}
            />
          </button>
        </motion.nav>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springs.apple}
          className="md:hidden mx-4 mt-3"
        >
          <ul className="liquid-glass-strong squircle flex flex-col gap-1 p-3">
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-[1.05rem] hover:bg-[var(--color-text)]/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-[var(--color-text)]/10 pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-[0.95rem] opacity-70 hover:bg-[var(--color-text)]/10 hover:opacity-100"
              >
                <span>Sign in</span>
                <span aria-hidden className="text-[0.9em] opacity-80">↗</span>
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-[1.05rem] text-[var(--color-accent)]"
              >
                Start a conversation →
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
    </header>
  );
}
