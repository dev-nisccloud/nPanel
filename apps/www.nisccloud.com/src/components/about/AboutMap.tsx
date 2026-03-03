import RevealAnimation from '../animation/RevealAnimation';
import Map from '../shared/Map';

const AboutMap = () => {
  return (
    <section className="pt-14 pb-14 md:pt-16 md:pb-16 lg:pt-[88px] lg:pb-[88px] xl:pt-[100px] xl:pb-[100px]">
      <div className="main-container">
        <RevealAnimation>
          <div className="dark:bg-background-8 rounded-[20px] bg-white p-2.5">
            <div className="h-[300px] w-full overflow-hidden rounded-xl lg:h-[566px]">
              <Map />
            </div>
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

AboutMap.displayName = 'AboutMap';
export default AboutMap;
