import { cn } from '@/utils/cn';
import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';

export interface UseCaseCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  href?: string;
  className?: string;
}

const UseCaseCard: FC<UseCaseCardProps> = ({
  title,
  description,
  imageSrc,
  imageAlt = 'Use Case img',
  href = '#',
  className,
}) => {
  return (
    <div className={cn('group w-full', className)}>
      <Link
        href={href}
        className="bg-background-8 group-hover:shadow-5 block rounded-2xl p-2 transition-all duration-500 ease-in-out"
      >
        <figure className="overflow-hidden rounded-xl">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={600}
            height={360}
            className="size-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
          />
        </figure>
        <div className="p-3">
          <h3 className="font-instrument-serif text-accent/80 md:text-is-heading-5 text-[26px]">
            {title}
          </h3>
          <p className="font-inter-tight text-tagline-2 text-accent/50">{description}</p>
        </div>
      </Link>
    </div>
  );
};

export { UseCaseCard };
