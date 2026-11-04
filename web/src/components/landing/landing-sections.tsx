import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

import { deploymentOptions, landingFeatures } from './content';
import type { DeploymentOption, LandingFeature } from './content';
import { EditorIllustration } from './editor-illustration';
import { PrimaryAction, SectionKicker } from './landing-primitives';

export function HeroSection() {
  return (
    <section className="relative bg-[radial-gradient(circle_at_87%_12%,#e9edff_0,transparent_34%)] px-7 pt-[108px] pb-28 max-[760px]:px-5 max-[760px]:pt-[70px] max-[760px]:pb-[76px]">
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
          <h1 className="mt-[26px] mb-6 text-[clamp(48px,5.2vw,78px)] leading-[1.04] font-[650] tracking-[-0.055em] text-[#1e2636] max-[760px]:text-[clamp(43px,11vw,66px)]">
            Your experience,
            <br />
            <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-[#3558c8]">
              beautifully told.
            </em>
          </h1>
          <p className="max-w-[520px] text-[17px] leading-[1.7] text-[#566173]">
            Build a resume that feels like you. Shape each section, watch the
            page come together, and move from a blank draft to a document you
            are proud to share.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryAction>Start building</PrimaryAction>
            <Link
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-[9px] border border-[#ccd3dd] bg-[#ffffffc9] px-5 text-sm font-semibold text-[#1e2636] transition-colors duration-200 hover:bg-[#eef1fa] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#95a9f0] motion-reduce:transition-none"
            >
              See how it works
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-[45px] flex items-center gap-[11px] text-[11px] tracking-[0.08em] text-[#858d9b] uppercase max-[760px]:mt-[30px]">
            <span className="h-px w-6 bg-[#a6afbd]" />
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
    <article className="border-[#e4e7ec] pt-[26px] pr-7 pb-1.5 max-[760px]:border-t max-[760px]:px-0 max-[760px]:pt-6 max-[760px]:pb-7 min-[761px]:not-first:border-l min-[761px]:not-first:pl-7">
      <div className="flex justify-between text-[#5c76c6]">
        <span className="font-mono text-xs text-[#a7afbd]">{number}</span>
        <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h3 className="mt-[37px] text-[19px] font-[650] tracking-[-0.025em] max-[760px]:mt-4">
        {title}
      </h3>
      <p className="mt-[11px] text-sm leading-[1.7] text-[#687282]">
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
      className="bg-white px-7 pt-28 pb-[120px] max-[760px]:px-5 max-[760px]:py-[85px]"
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
            <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-[#3558c8]">
              Nothing in your way.
            </em>
          </h2>
        </div>
        <p className="max-w-[435px] justify-self-end text-base leading-[1.7] text-[#687282] max-[760px]:justify-self-start">
          A focused editor and a live paper preview keep the writing and the
          finished page in view together.
        </p>
      </div>
      <div className="mx-auto mt-[55px] grid max-w-[1180px] grid-cols-3 border-t border-[#d9dee6] max-[760px]:mt-[38px] max-[760px]:grid-cols-1">
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
      className="bg-[#1d273b] px-7 py-[108px] text-[#eff2fb] max-[1050px]:py-[90px] max-[760px]:px-5 max-[760px]:py-[85px]"
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
        className="font-['EB_Garamond',Georgia,serif] text-[90px] leading-none font-bold text-[#d9dfe9] max-[760px]:text-[70px]"
      >
        R<span className="text-[#3558c8]">.</span>
      </div>
      <div>
        <SectionKicker>READY WHEN YOU ARE</SectionKicker>
        <h2 className="mt-[11px] text-[clamp(38px,4vw,56px)] leading-[1.04] font-[650] tracking-[-0.055em]">
          Make space for
          <br />
          <em className="font-['EB_Garamond',Georgia,serif] font-normal tracking-[-0.042em] text-[#3558c8]">
            what comes next.
          </em>
        </h2>
      </div>
      <PrimaryAction className="ml-auto whitespace-nowrap max-[760px]:ml-0 max-[760px]:w-full">
        Start building
      </PrimaryAction>
    </section>
  );
}
