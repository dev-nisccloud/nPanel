import RevealAnimation from '@/components/animation/RevealAnimation';
import SubmitButton from '@/components/ui/button/SubmitButton';

const Content = () => {
  return (
    <div className="relative z-10 p-10 min-[475px]:p-14 sm:p-20 lg:p-[100px]">
      <div className="mb-10 space-y-5 text-center sm:mb-14">
        <RevealAnimation delay={0.1}>
          <span className="badge badge-cyan">Get started</span>
        </RevealAnimation>
        <div className="space-y-3">
          <RevealAnimation delay={0.2}>
            <h2 className="font-normal text-white">Get started with industry-leading cyber security</h2>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <p className="text-accent/60">
              No hidden fees. no steep learning curves. Just a platform built for your growth.
            </p>
          </RevealAnimation>
        </div>
      </div>

      <RevealAnimation delay={0.4}>
        <form className="flex flex-col items-center justify-center gap-y-5 md:flex-row md:gap-x-3 md:gap-y-0">
          <fieldset className="inline-block">
            <input
              type="text"
              placeholder="Enter your email"
              className="bg-accent/10 border-accent/20 shadow-1 ring-accent/20 focus:ring-primary-600 placeholder:text-accent/60 block h-13 w-[270px] rounded-2xl border px-[18px] py-3 font-normal text-white ring-[0.7px] outline-none placeholder:font-normal focus:ring-1 max-[376px]:w-[250px] md:w-[371px]"
            />
          </fieldset>
          <SubmitButton type="submit" ariaLabel="Get started" className="btn-v3-lg btn-v3-primary w-full sm:w-fit">
            Get started
          </SubmitButton>
        </form>
      </RevealAnimation>
    </div>
  );
};
Content.displayName = 'Content';
export default Content;
