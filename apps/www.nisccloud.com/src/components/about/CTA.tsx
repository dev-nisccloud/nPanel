import gradientImg from '@public/images/ns-img-499.png';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import Content from './CTAContent';

const CTA = () => {
  return (
    <section className="mx-auto max-w-[320px] py-[80px] min-[425px]:max-w-[350px] min-[475px]:max-w-[450px] sm:max-w-[600px] md:max-w-[700px] md:py-[100px] lg:max-w-[980px] xl:max-w-[1240px] 2xl:max-w-[1440px]">
      <RevealAnimation delay={0.1}>
        <div className="bg-secondary dark:bg-background-6 relative overflow-hidden rounded-[20px] sm:rounded-[32px]">
          {/* bg gradient  */}
          <RevealAnimation delay={0.1} offset={200} direction="left">
            <figure className="pointer-events-none absolute -top-[100%] -left-[7%] size-[850px] rotate-[275deg] select-none sm:-top-[35%]">
              <Image src={gradientImg} alt="cta-bg" className="w-[50%] sm:w-full" />
            </figure>
          </RevealAnimation>
          <RevealAnimation delay={0.1}>
            <Content />
          </RevealAnimation>
        </div>
      </RevealAnimation>
    </section>
  );
};

CTA.displayName = 'CTA';
export default CTA;
