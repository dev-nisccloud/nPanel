import { IWhitePaper } from '@/interface';
import Image from 'next/image';
import Link from 'next/link';
import LinkButton from '../ui/button/Button';

const ResearchCard = ({ item }: { item: IWhitePaper }) => {
  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
      <div className="dark:bg-background-6 group flex h-full flex-col rounded-[20px] bg-white p-2">
        <Link href={`/whitepaper/${item.slug}`} aria-label={item.title}>
          <figure className="aspect-[4/3] flex-shrink-0 overflow-hidden rounded-xl">
            <Image
              src={item.img}
              alt={item.title}
              width={400}
              height={300}
              className="h-full w-full rounded-xl object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            />
          </figure>
        </Link>
        <div className="flex flex-grow flex-col space-y-10 px-5 pt-7 pb-6">
          <Link href={`/whitepaper/${item.slug}`} aria-label={item.title}>
            <div className="flex-grow space-y-2">
              <h2 className="text-heading-6 font-normal">{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </Link>
          <div>
            <LinkButton
              href={`/whitepaper/${item.slug}`}
              className="btn-v3-lg btn-v3-secondary"
              ariaLabel={`Read more about ${item.title}`}>
              Read More
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchCard;
