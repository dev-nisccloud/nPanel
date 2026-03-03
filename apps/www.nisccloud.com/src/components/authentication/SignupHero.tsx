import SignupBgImage from '@public/images/ns-img-373.jpg';
import Image from 'next/image';
import RevealAnimation from '../animation/RevealAnimation';
import SocialAuth from './SocialAuth';

const SignupHero = () => {
  return (
    <section className="pt-[120px] pb-[70px] lg:pt-[180px] lg:pb-[100px]">
      <div className="main-container">
        <div className="mx-auto w-full max-w-[1120px]">
          <div className="flex items-stretch justify-center gap-16">
            <RevealAnimation delay={0.1}>
              <div className="bg-background-1 dark:bg-background-6 mx-auto w-full max-w-[400px] rounded-[20px] px-8 py-14">
                <form>
                  <fieldset className="mb-4 space-y-2">
                    <label
                      htmlFor="username"
                      className="text-tagline-2 text-secondary dark:text-accent block font-medium select-none">
                      Username
                    </label>
                    <input type="text" id="username" className="auth-form-input" placeholder="Your unique identifier" />
                  </fieldset>
                  <fieldset className="mb-4 space-y-2">
                    <label
                      htmlFor="email"
                      className="text-tagline-2 text-secondary dark:text-accent block font-medium select-none">
                      Your email
                    </label>
                    <input type="email" id="email" className="auth-form-input" placeholder="Email address" />
                  </fieldset>
                  <fieldset className="mb-4 space-y-2">
                    <label
                      htmlFor="password"
                      className="text-tagline-2 text-secondary dark:text-accent block font-medium select-none">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="auth-form-input"
                      placeholder="At least 8 characters"
                    />
                  </fieldset>
                  <fieldset className="mb-3 space-y-2">
                    <label
                      htmlFor="confirm-password"
                      className="text-tagline-2 text-secondary dark:text-accent block font-medium select-none">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="auth-form-input"
                      placeholder="Re-enter your password"
                    />
                  </fieldset>
                  <div className="mt-8">
                    <button
                      type="submit"
                      className="btn btn-md btn-primary hover:btn-secondary dark:hover:btn-accent w-full first-letter:uppercase before:content-none">
                      Sign up
                    </button>
                  </div>
                </form>
                <div className="py-8 text-center">
                  <p className="text-tagline-2 text-secondary dark:text-accent font-normal">Or</p>
                </div>
                <div>
                  <SocialAuth />
                </div>
              </div>
            </RevealAnimation>
            <RevealAnimation delay={0.2} direction="up">
              <div className="hidden lg:block">
                <figure className="h-full max-h-[864px] w-full max-w-[656px] overflow-hidden rounded-[20px]">
                  <Image src={SignupBgImage} alt="login-bg" className="size-full object-cover" />
                </figure>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </div>
    </section>
  );
};

SignupHero.displayName = 'SignupHero';
export default SignupHero;
