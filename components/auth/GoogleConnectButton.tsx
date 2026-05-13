"use client";

import { cn } from "@/lib/cn";

interface GoogleConnectButtonProps {
  onClick: () => void | Promise<void>;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Google identity button — neutral surface, Google "G" mark, family
 * editorial rhythm. Used on /login and on Connected Accounts.
 */
export function GoogleConnectButton({
  onClick,
  label = "Continue with Google",
  className,
  disabled,
}: GoogleConnectButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick()}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center justify-center gap-3 rounded-full",
        "border border-hairline-strong bg-bg-elev/40 px-5 py-3",
        "text-[14px] text-text",
        "transition-colors duration-300",
        "hover:border-[var(--color-signal)] hover:bg-bg-elev/70",
        "disabled:opacity-50 disabled:hover:border-hairline-strong disabled:hover:bg-bg-elev/40",
        className,
      )}
    >
      <GoogleG />
      <span>{label}</span>
    </button>
  );
}

function GoogleG() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      className="shrink-0"
    >
      <path
        fill="#EA4335"
        d="M12 11v3.2h7.6c-.3 1.7-2.2 5-7.6 5-4.6 0-8.3-3.8-8.3-8.5S7.4 2.2 12 2.2c2.6 0 4.4 1.1 5.4 2.1l3.7-3.6C18.7-1.5 15.7-2.8 12-2.8 5.3-2.8.1 2.4.1 9.1S5.3 21 12 21c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"
      />
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 2.9-4.5 2.9-7.5z"
      />
      <path
        fill="#FBBC05"
        d="M6.6 14.3a5.9 5.9 0 0 1-.3-1.8c0-.6.1-1.2.3-1.8V8.1H3.1A9 9 0 0 0 2 12.5c0 1.5.4 2.9 1.1 4.1l3.5-2.3z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.9 0 5.4-1 7.2-2.6l-3.4-2.6c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7l-3.5 2.7C3.7 18.5 7.5 21 12 21z"
      />
      <path fill="none" d="M2 2h20v20H2z" />
    </svg>
  );
}
