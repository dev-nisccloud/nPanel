import { cn } from '@/utils/cn';
import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';

export interface TeamCardProps {
  name: string;
  role: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  className?: string;
}

const TeamCard: FC<TeamCardProps> = ({
  name,
  role,
  imageSrc,
  imageAlt,
  href = '/team-details',
  className,
}) => {
  return (
    <article
      className={cn(
        'group bg-background-5 relative col-span-12 mx-auto max-h-[395px] w-full max-w-[708px] overflow-hidden rounded-xl md:col-span-6 lg:col-span-4 lg:max-w-[409px]',
        className
      )}
      aria-label="Team member profile"
    >
      <figure className="h-full w-full overflow-hidden transition-transform duration-400 group-hover:scale-103">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={409}
          height={395}
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </figure>
      <div className="ease-team-ease-1 absolute bottom-5 left-1/2 w-[calc(100%-40px)] -translate-x-1/2 space-y-0.5 rounded-md bg-white/50 p-5 backdrop-blur-[15px] transition-all duration-400 lg:translate-y-[30%] lg:scale-[90%] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:scale-100 lg:group-hover:opacity-100">
        <Link href={href}>
          <h3 className="text-is-heading-6 font-medium text-black">{name}</h3>
        </Link>
        <p className="text-tagline-4 text-secondary/50 font-normal">{role}</p>
      </div>
    </article>
  );
};

export { TeamCard };
