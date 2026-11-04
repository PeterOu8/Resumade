export function StartVisual() {
  return (
    <aside className="relative order-2 min-h-[500px] overflow-hidden rounded-[28px] bg-[#1d273b] p-8 text-white shadow-[0_24px_60px_#1d273b20] sm:p-10 lg:order-1 lg:min-h-[660px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_65%,#5e76ca55,transparent_45%)]"
      />
      <div className="relative z-10 max-w-[330px]">
        <span className="text-[11px] font-bold tracking-[0.15em] text-[#b7c6f8] uppercase">
          A CLEAR BEGINNING
        </span>
        <h2 className="mt-5 text-[clamp(34px,3.4vw,50px)] leading-[1.07] font-[650] tracking-[-0.05em]">
          Your next chapter,
          <br />
          <em className="font-['EB_Garamond',Georgia,serif] font-normal text-[#b9c8ff]">
            on one page.
          </em>
        </h2>
        <p className="mt-4 max-w-[280px] text-sm leading-6 text-[#c3cee0]">
          Begin with what you have. Make it distinctly yours.
        </p>
      </div>

      <div aria-hidden="true" className="absolute right-[-16px] bottom-[-160px] w-[275px] -rotate-6 rounded-xl bg-[#cdd8f1] p-6 shadow-[0_24px_55px_#0d142740] sm:right-8 sm:bottom-[-76px] sm:w-[350px] lg:right-12 lg:bottom-[-90px] lg:w-[420px]">
        <div className="h-[330px] rounded-md border border-white/50" />
      </div>
      <div aria-hidden="true" className="absolute right-4 bottom-[-160px] w-[275px] rotate-3 rounded-lg bg-white px-7 pt-8 pb-12 text-[#253047] shadow-[0_30px_65px_#0d142755] sm:right-16 sm:bottom-[-80px] sm:w-[350px] lg:right-20 lg:bottom-[-88px] lg:w-[420px]">
        <div className="font-['EB_Garamond',Georgia,serif] text-2xl font-bold">Alex Morgan</div>
        <div className="mt-1 text-[9px] tracking-wide text-[#5670c6]">
          DESIGNER · MAKER · PROBLEM SOLVER
        </div>
        <div className="mt-7 border-b border-[#4b5972] pb-1 text-[9px] font-bold tracking-[0.12em]">
          PROFILE
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#e7ebf2]" />
        <div className="mt-2 h-1.5 w-5/6 rounded-full bg-[#e7ebf2]" />
        <div className="mt-6 border-b border-[#4b5972] pb-1 text-[9px] font-bold tracking-[0.12em]">
          EXPERIENCE
        </div>
        <div className="mt-3 h-2 w-2/3 rounded-full bg-[#cbd5e8]" />
        <div className="mt-3 h-1.5 w-full rounded-full bg-[#e7ebf2]" />
        <div className="mt-2 h-1.5 w-11/12 rounded-full bg-[#e7ebf2]" />
        <div className="mt-2 h-1.5 w-4/5 rounded-full bg-[#e7ebf2]" />
      </div>
    </aside>
  );
}
