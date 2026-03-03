import { IService } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const UseCases = () => {
  const useCasesData = getMarkDownData<IService & { [key: string]: unknown }>('src/data/niscservices').slice(0, 3);
  return (
    <section className="bg-background-2 dark:bg-background-5 pt-[100px] pb-[100px] xl:pb-[200px]">
      <div className="main-container">
        <div className="mb-[70px] flex flex-col items-center justify-between gap-4 lg:flex-row lg:items-end lg:gap-0">
          <div className="flex-1 text-center lg:text-left">
            <div className="space-y-3">
              <RevealAnimation delay={0.1}>
                <span className="badge badge-green">Use cases</span>
              </RevealAnimation>
              <RevealAnimation delay={0.2}>
                <h2 className="max-w-[518px]">How We Connect with Customers</h2>
              </RevealAnimation>
            </div>
          </div>
          <div className="flex-1 text-center lg:text-left">
            <div>
              <RevealAnimation delay={0.3}>
                <p className="mx-auto max-w-[518px] lg:mx-0">
                  Explore the ways our innovative solutions improve communication and boost efficiency in your
                  organization. From streamlined workflows to enhanced collaboration tools, we provide everything you
                  need to succeed.
                </p>
              </RevealAnimation>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-y-14 lg:gap-8">
          {useCasesData.map((useCase, index) => (
            <RevealAnimation key={useCase.id + 'use-case-' + index} delay={0.4 + index * 0.1}>
              <div className="col-span-12 lg:col-span-4">
                <div className="space-y-6">
                  <div className="max-lg:text-center">
                    <span className={`${useCase.icon} text-secondary dark:text-accent text-[52px]`} />
                  </div>
                  <div className="space-y-1 text-center lg:text-left">
                    <h3 className="text-heading-5">{useCase.title}</h3>
                    <p className="mx-auto line-clamp-3 max-w-[337px] lg:mx-0">{useCase.description}</p>
                  </div>
                  <div className="text-center lg:text-left">
                    <LinkButton
                      href={`/services/${useCase.slug}`}
                      className="btn-v3-lg btn-v3-secondary mx-auto w-[80%] sm:w-fit lg:mx-0">
                      Read more
                    </LinkButton>
                  </div>
                </div>
              </div>
            </RevealAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

UseCases.displayName = 'UseCases';
export default UseCases;
