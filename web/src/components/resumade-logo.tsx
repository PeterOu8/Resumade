import Link from 'next/link';

export function ResumadeLogo() {
  return (
    <Link
      href="/"
      aria-label="Resumade home"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus"
    >
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-control bg-logo pb-1 font-display text-[29px] leading-none font-bold text-logo-foreground shadow-logo sm:size-10"
      >
        R<span className="text-logo-accent">.</span>
      </span>
      <span className="hidden text-base font-semibold tracking-[-0.04em] text-foreground min-[390px]:inline sm:text-xl">
        Resumade
      </span>
    </Link>
  );
}
