import RevealAnimation from '@/components/animation/RevealAnimation';
import { cn } from '@/utils/cn';
import asanaLogo from '@public/images/icons/asana.svg';
import discordLogo from '@public/images/icons/discord-logo.svg';
import dropboxLogo from '@public/images/icons/dropbox.svg';
import hotjarLogo from '@public/images/icons/hotjar-logo.svg';
import latticeLogo from '@public/images/icons/lattice-logo.svg';
import notionLogo from '@public/images/icons/notion.svg';
import outreachLogo from '@public/images/icons/outreach-logo.svg';
import scapicLogo from '@public/images/icons/scapic-logo.svg';
import spotifyLogo from '@public/images/icons/spotify-logo.svg';
import squarespaceLogo from '@public/images/icons/squarespace-logo.svg';
import stripeLogo from '@public/images/icons/stripe-logo.svg';
import Image, { StaticImageData } from 'next/image';
import Marquee from 'react-fast-marquee';

interface ClientLogo {
  id: string;
  src: StaticImageData;
  alt: string;
  width: number;
  height: number;
  figureClassName?: string;
  imageClassName?: string;
  isFirst?: boolean;
}

const clientLogos: ClientLogo[] = [
  {
    id: '1',
    src: scapicLogo,
    alt: 'Scapic company logo - trusted partner',
    width: 28,
    height: 34,
    figureClassName: 'ml-14 h-[34px] w-7',
    isFirst: true,
  },
  {
    id: '2',
    src: notionLogo,
    alt: 'Notion company logo - trusted partner',
    width: 34,
    height: 35,
    figureClassName: 'h-[35px] w-[34px]',
  },
  {
    id: '3',
    src: latticeLogo,
    alt: 'Lattice company logo - trusted partner',
    width: 48,
    height: 28,
    figureClassName: 'h-7 w-12',
  },
  {
    id: '4',
    src: hotjarLogo,
    alt: 'Hotjar company logo - trusted partner',
    width: 27,
    height: 30,
    figureClassName: 'h-[30px] w-[27px]',
  },
  {
    id: '5',
    src: discordLogo,
    alt: 'Discord company logo - trusted partner',
    width: 38,
    height: 30,
    figureClassName: 'h-[30px] w-[38px]',
  },
  {
    id: '6',
    src: dropboxLogo,
    alt: 'Dropbox company logo - trusted partner',
    width: 38,
    height: 32,
    figureClassName: 'h-8 w-[38px]',
  },
  {
    id: '7',
    src: stripeLogo,
    alt: 'Stripe company logo - trusted partner',
    width: 36,
    height: 36,
    figureClassName: 'size-9',
  },
  {
    id: '8',
    src: spotifyLogo,
    alt: 'Spotify company logo - trusted partner',
    width: 36,
    height: 36,
    figureClassName: 'size-9',
  },
  {
    id: '9',
    src: outreachLogo,
    alt: 'Outreach company logo - trusted partner',
    width: 34,
    height: 32,
    figureClassName: 'h-8 w-[34px]',
  },
  {
    id: '10',
    src: asanaLogo,
    alt: 'Asana company logo - trusted partner',
    width: 27,
    height: 25,
    figureClassName: 'h-[25px] w-[27px]',
    imageClassName: 'size-full',
  },
  {
    id: '11',
    src: squarespaceLogo,
    alt: 'Squarespace company logo - trusted partner',
    width: 32,
    height: 30,
    figureClassName: 'h-[30px] w-[32px]',
  },
];

const Clients = () => {
  return (
    <section
      className="py-12 sm:py-16 lg:py-20 xl:py-28"
      aria-label="Trusted clients and partners section "
      itemScope
      itemType="https://schema.org/ItemList">
      <div className="main-container relative overflow-hidden">
        <div className="space-y-10">
          <RevealAnimation delay={0.1}>
            <h2 className="text-heading-5 text-center text-white/80" itemProp="name">
              Trusted By
            </h2>
          </RevealAnimation>
          {/* clients logo  */}
          <RevealAnimation delay={0.2}>
            <div className="relative" aria-label="Client company logos">
              <Marquee autoFill speed={40}>
                <ul className="flex items-center justify-center gap-x-14">
                  {clientLogos.map((logo) => (
                    <li
                      key={logo.id}
                      className={cn('shrink-0', logo.figureClassName)}
                      itemScope
                      itemType="https://schema.org/Organization">
                      <figure className="size-full">
                        <Image
                          src={logo.src}
                          alt={logo.alt}
                          width={logo.width}
                          height={logo.height}
                          className={logo.imageClassName || 'size-full object-cover'}
                          loading="lazy"
                          itemProp="logo"
                        />
                      </figure>
                    </li>
                  ))}
                </ul>
              </Marquee>
            </div>
          </RevealAnimation>
        </div>
        {/* left gradient */}
        <div
          className="absolute bottom-[0%] left-0 h-[80px] w-[80px] bg-[linear-gradient(270deg,rgba(255,255,255,0)_0%,transparent_100%)] sm:h-[130px] md:w-[150px] xl:left-[-20%] 2xl:w-[455px]"
          aria-hidden="true"
        />
        {/* right gradient */}
        <div
          className="absolute right-0 bottom-[0%] h-[80px] w-[80px] rotate-180 bg-[linear-gradient(270deg,rgba(255,255,255,0)_0%,transparent_100%)] sm:h-[130px] md:w-[150px] xl:right-[-20%] 2xl:w-[455px]"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

Clients.displayName = 'Clients';
export default Clients;
