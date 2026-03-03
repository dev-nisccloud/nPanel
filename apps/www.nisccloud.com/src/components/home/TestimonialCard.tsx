import avatar28 from '@public/images/ns-avatar-28.png';
import Image from 'next/image';
import TestimonialCardStar from './TestimonialCardStar';

interface TestimonialCardProps {
  title: string;
  description: string;
  name: string;
  designation: string;
  avatar: typeof avatar28;
}

const TestimonialCard = ({ title, description, name, designation, avatar }: TestimonialCardProps) => {
  return (
    <div className="flex h-[534px] flex-col items-start justify-between rounded-[20px] bg-white px-8 py-[42px] md:rounded-[28px] lg:max-w-[317px]">
      <div className="space-y-4 xl:space-y-8">
        {/* star  */}
        <TestimonialCardStar />

        <div className="space-y-3">
          <h3 className="text-heading-5 font-normal" itemProp="name">
            {title}
          </h3>
          <p className="text-secondary/80 text-lg leading-[150%] font-normal" itemProp="description">
            {description}
          </p>
        </div>
      </div>

      {/* avatar  */}
      <div className="flex w-full max-w-[254px] items-center justify-start gap-x-3 rounded-full bg-[#EDF2FF] py-1.5 pr-6 pl-1.5">
        <figure className="size-12 overflow-hidden rounded-full">
          <Image
            src={avatar}
            alt={`${name}'s avatar`}
            width={48}
            height={48}
            className="size-full object-cover"
            loading="lazy"
          />
        </figure>
        <div>
          <h4 className="text-tagline-1 text-secondary font-semibold" itemProp="author">
            {name}
          </h4>
          <p className="text-tagline-2 text-secondary/60 font-normal" itemProp="jobTitle">
            {designation}
          </p>
        </div>
      </div>
    </div>
  );
};

TestimonialCard.displayName = 'TestimonialCard';
export default TestimonialCard;
