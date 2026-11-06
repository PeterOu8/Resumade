import Link from 'next/link';
import { ArrowUpRight, Coffee, Sparkles } from 'lucide-react';

import { deploymentOptions, landingFeatures } from './content';
import type { DeploymentOption, LandingFeature } from './content';
import { EditorIllustration } from './editor-illustration';
import { PrimaryAction, SectionKicker } from './landing-primitives';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.6.1-3.1 0 0 1-.3 3.2 1.2a11.1 11.1 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.5.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.8 5.4-5.5 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative bg-[radial-gradient(circle_at_87%_12%,#e9edff_0,transparent_34%)] px-7 pt-[108px] pb-28 dark:bg-[radial-gradient(circle_at_87%_12%,rgba(149,173,255,0.16)_0,transparent_34%)] max-[760px]:px-5 max-[760px]:pt-[70px] max-[760px]:pb-[76px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[length:88px_88px] [background-image:linear-gradient(#182c5710_1px,transparent_1px),linear-gradient(90deg,#182c5710_1px,transparent_1px)] [mask-image:linear-gradient(90deg,transparent_48%,#000_100%)]"
      />
      <div className="relative mx-auto grid max-w-[1330px] items-center gap-[50px] min-[1051px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[1051px]:gap-[clamp(36px,6vw,92px)]">
        <div className="max-w-[680px] pt-4 pb-[30px]">
          <SectionKicker className="tracking-[0.1em]">
            <Sparkles size={14} aria-hidden="true" />A better way to build your
            resume
          </SectionKicker>
          <h1 className="mt-[26px] mb-6 text-[clamp(48px,5.2vw,78px)] leading-[1.04] font-[650] tracking-[-0.055em] text-foreground max-[760px]:text-[clamp(43px,11vw,66px)]">
            Your experience,
            <br />
            <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-primary">
              beautifully told.
            </em>
          </h1>
          <p className="max-w-[520px] text-[17px] leading-[1.7] text-foreground-label">
            Build a resume that feels like you. Shape each section, watch the
            page come together, and move from a blank draft to a document you
            are proud to share.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryAction>Start building</PrimaryAction>
            <Link
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] border border-border-strong bg-surface/80 px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus motion-reduce:transition-none"
            >
              See how it works
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-[45px] flex items-center gap-[11px] text-[11px] tracking-[0.08em] text-foreground-subtle uppercase max-[760px]:mt-[30px]">
            <span className="h-px w-6 bg-border-strong" />
            Your words. Your layout. One clear page.
          </div>
        </div>
        <EditorIllustration />
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: LandingFeature }) {
  const { icon: Icon, number, title, description } = feature;

  return (
    <article className="border-border-subtle pt-[26px] pr-7 pb-1.5 max-[760px]:border-t max-[760px]:px-0 max-[760px]:pt-6 max-[760px]:pb-7 min-[761px]:not-first:border-l min-[761px]:not-first:pl-7">
      <div className="flex justify-between text-primary">
        <span className="font-mono text-xs text-foreground-subtle">{number}</span>
        <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h3 className="mt-[37px] text-[19px] font-[650] tracking-[-0.025em] max-[760px]:mt-4">
        {title}
      </h3>
      <p className="mt-[11px] text-sm leading-[1.7] text-foreground-muted">
        {description}
      </p>
    </article>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="features-heading"
      className="bg-surface px-7 pt-28 pb-[120px] max-[760px]:px-5 max-[760px]:py-[85px]"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 items-end gap-[30px] max-[760px]:grid-cols-1">
        <div>
          <SectionKicker>THE WORKSPACE</SectionKicker>
          <h2
            id="features-heading"
            className="mt-[13px] text-[clamp(40px,4vw,58px)] leading-[1.04] font-[650] tracking-[-0.055em]"
          >
            Everything in its place.
            <br />
            <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-primary">
              Nothing in your way.
            </em>
          </h2>
        </div>
        <p className="max-w-[435px] justify-self-end text-base leading-[1.7] text-foreground-muted max-[760px]:justify-self-start">
          Build and export without an account or AI key. AI tailoring is an
          optional enhancement that requires provider setup; you stay in
          control of every suggested change.
        </p>
      </div>
      <div className="mx-auto mt-[55px] grid max-w-[1180px] grid-cols-4 border-t border-border-subtle max-[900px]:grid-cols-2 max-[760px]:mt-[38px] max-[620px]:grid-cols-1">
        {landingFeatures.map((feature) => (
          <FeatureCard key={feature.number} feature={feature} />
        ))}
      </div>
    </section>
  );
}

function DeploymentRow({ option }: { option: DeploymentOption }) {
  const { icon: Icon, number, label, detail } = option;

  return (
    <div className="grid min-h-[77px] grid-cols-[34px_34px_1fr_auto_18px] items-center gap-[13px] border-t border-[#46546c] max-[520px]:grid-cols-[24px_24px_1fr_auto] max-[520px]:gap-2">
      <span className="font-mono text-[11px] text-[#8090ab]">{number}</span>
      <span className="grid place-items-center text-[#b5c5fa]">
        <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="text-[17px] font-[590]">{label}</span>
      <span className="text-xs text-[#a9b8d2]">{detail}</span>
      <ArrowUpRight
        size={17}
        className="text-[#8496b5] max-[520px]:hidden"
        aria-hidden="true"
      />
    </div>
  );
}

export function AiRulesSection() {
  return (
    <section
      aria-labelledby="ai-rules-heading"
      className="border-y border-transparent bg-[#1d273b] px-7 py-[108px] text-[#eff2fb] dark:border-border-subtle max-[1050px]:py-[90px] max-[760px]:px-5 max-[760px]:py-[85px]"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-[clamp(40px,7vw,100px)] max-[760px]:grid-cols-1 max-[760px]:gap-[50px]">
        <div>
          <SectionKicker className="text-[#a9baf4]">
            FLEXIBLE BY DESIGN
          </SectionKicker>
          <h2
            id="ai-rules-heading"
            className="mt-[21px] mb-[23px] text-[clamp(48px,4.9vw,72px)] leading-[1.04] font-[650] tracking-[-0.055em]"
          >
            Your AI,
            <br />
            <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-[#b8c7ff]">
              Your Rules
            </em>
          </h2>
          <p className="max-w-[480px] text-base leading-[1.75] text-[#b6c1d3]">
            Run Resumade locally, ship it in containers, or deploy it to Azure.
            Then choose the AI provider and model that match your workflow.
          </p>
        </div>
        <div className="border-t border-[#60708b]">
          <div className="flex justify-between py-3.5 text-[10px] tracking-[0.13em] text-[#8fa1be]">
            <span>CHOOSE YOUR SETUP</span>
            <span>YOUR WORKFLOW, YOUR CALL</span>
          </div>
          {deploymentOptions.map((option) => (
            <DeploymentRow key={option.number} option={option} />
          ))}
          <div className="mt-5 flex items-center gap-2.5 text-xs text-[#c9d2e0]">
            <span className="size-[7px] rounded-full bg-[#a6bbff] shadow-[0_0_0_4px_#a6bbff1c]" />
            Select the AI provider and model that fit your process.
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClosingSection() {
  return (
    <section className="mx-auto flex max-w-[1236px] items-center justify-between gap-[30px] px-7 pt-[100px] pb-28 max-[760px]:flex-wrap max-[760px]:px-5 max-[760px]:py-20">
      <div
        aria-hidden="true"
        className="font-['EB_Garamond',Georgia,serif] text-[90px] leading-none font-bold text-border-strong dark:text-foreground-subtle max-[760px]:text-[70px]"
      >
        R<span className="text-primary">.</span>
      </div>
      <div>
        <SectionKicker>READY WHEN YOU ARE</SectionKicker>
        <h2 className="mt-[11px] text-[clamp(38px,4vw,56px)] leading-[1.04] font-[650] tracking-[-0.055em]">
          Make space for
          <br />
          <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-primary">
            what comes next.
          </em>
        </h2>
      </div>
      <div className="ml-auto flex flex-col items-stretch gap-3 max-[760px]:ml-0 max-[760px]:w-full">
        <PrimaryAction className="whitespace-nowrap">Start building</PrimaryAction>
        <div className="flex flex-wrap gap-2 max-[480px]:flex-col">
          <Link
            href="https://buymeacoffee.com/peterou8"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-11 flex-1')}
          >
            <Coffee aria-hidden="true" /> Support me
          </Link>
          <Link
            href="https://github.com/PeterOu8/Resumade"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'min-h-11 flex-1')}
          >
            <GitHubIcon /> View on Github
          </Link>
        </div>
      </div>
    </section>
  );
}
