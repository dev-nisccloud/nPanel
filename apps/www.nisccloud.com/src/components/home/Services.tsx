import { IService } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import RevealAnimation from '../animation/RevealAnimation';
import LinkButton from '../ui/button/Button';

const Services = () => {
  const servicesData: IService[] = getMarkDownData<IService & { [key: string]: unknown }>('src/data/niscservices').slice(
    0,
    9,
  );

  return (
    <section className="pt-8 pb-4 sm:pt-8 md:pt-8 md:pb-5 lg:pb-5 xl:pt-8 xl:pb-6">
      <div className="main-container">
        <div className="mb-[70px] space-y-3 text-center">
          <RevealAnimation delay={0.2}>
            <span className="badge badge-green">Our services</span>
          </RevealAnimation>
          <RevealAnimation delay={0.3}>
            <h2 className="mx-auto max-w-[600px] xl:max-w-[878px]">
              Cloud hosting and digital marketing built for growing African businesses.
            </h2>
          </RevealAnimation>
          <RevealAnimation delay={0.4}>
            <p className="mx-auto max-w-[500px] xl:max-w-[700px]">
              From domains, fast website hosting, and business email to WordPress, VPS, dedicated servers, SEO, social
              media, and paid ads — Nisc Cloud gives you everything you need to get online and get customers.
            </p>
          </RevealAnimation>
        </div>
        <div className="grid grid-cols-12 gap-y-12 md:gap-14 lg:gap-[72px]">
          {servicesData.map((service, index) => (
            <RevealAnimation key={service.slug} delay={0.5 + index * 0.1}>
              <div className="col-span-12 md:col-span-6 lg:col-span-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-center md:items-start md:justify-start">
                    <span className={`${service.icon} text-secondary dark:text-accent text-[52px]`} />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-heading-5">{service.title}</h3>
                    <p className="line-clamp-3">{service.description}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <LinkButton
                      href={`/services/${service.slug}`}
                      className="btn-v3-lg btn-v3-secondary mx-auto w-[80%] sm:mx-0 sm:w-fit">
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

Services.displayName = 'Services';
export default Services;
