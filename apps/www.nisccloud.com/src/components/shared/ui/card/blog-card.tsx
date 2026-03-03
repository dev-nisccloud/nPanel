import { cn } from '@/utils/cn';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';

export interface BlogCardProps {
  title: string;
  href: string;
  imageSrc: string | StaticImageData;
  imageAlt?: string;
  date: string;
  readTime: string;
  tags: readonly string[];
  className?: string;
}

const formatDisplayDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const BlogCard: FC<BlogCardProps> = ({
  title,
  href,
  imageSrc,
  imageAlt = 'blog-post-img',
  date,
  readTime,
  tags,
  className,
}) => {
  return (
    <article className={cn('group', className)}>
      <Link href={href}>
        <div className="underline-hover-effect-black space-y-4">
          <figure className="relative h-[320px] w-full overflow-hidden rounded-lg">
            <Image
              fill
              src={imageSrc}
              alt={imageAlt}
              className="scale-100 object-cover transition-all duration-500 ease-in-out will-change-transform group-hover:scale-105 group-hover:rotate-1"
            />
          </figure>
          <div className="px-3">
            <time
              dateTime={date}
              className="text-tagline-4 text-secondary/80 flex items-center gap-x-2 font-normal"
            >
              {formatDisplayDate(date)}
              <span className="text-tagline-4 text-secondary/80 font-normal">{readTime}</span>
            </time>
            <div className="space-x-2 pt-2 pb-1 sm:pt-4 sm:pb-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-background-9 mb-4 inline-flex items-center justify-center gap-x-1.5 rounded-[4px] px-2 py-0.5"
                >
                  <span className="font-inter-tight text-tagline-4 text-accent/80 font-normal first-letter:uppercase">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
            <div className="blog-title-black block">
              <h3 className="text-is-heading-5 sm:text-is-heading-6 text-secondary/80 line-clamp-2 font-normal tracking-[-0.6px]">
                {title}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export { BlogCard };
