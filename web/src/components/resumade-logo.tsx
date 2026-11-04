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
        className="flex size-9 items-center justify-center rounded-[10px] bg-[#1d273b] pb-1 font-['EB_Garamond',Georgia,serif] text-[29px] leading-none font-bold text-white shadow-[0_4px_12px_#1d273b24] sm:size-10"
      >
        R<span className="text-[#aebeff]">.</span>
      </span>
      <span className="hidden text-base font-semibold tracking-[-0.04em] text-foreground min-[390px]:inline sm:text-xl">
        Resumade
      </span>
    </Link>
  );
}
