import { cn } from '@/utils/cn';
import type { FC } from 'react';

interface IconProps {
  className?: string;
}

const ArrowIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    aria-hidden
    className={cn('stroke-background-14 size-[18px]', className)}
  >
    <path d="M6.75 13.5L11.25 9L6.75 4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatRoiIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    className={cn('size-[28px] shrink-0', className)}
    aria-hidden
  >
    <g clipPath="url(#stat-roi-clip)">
      <path
        d="M12.1645 4.05607L23.1413 8.72084L24.3568 15.6145L15.6374 23.7522L4.66066 19.0875L3.44512 12.1938L12.1645 4.05607Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.6365 23.7485L14.5078 17.3472"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.1415 8.71803L14.5089 17.3482L3.44531 12.191"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66085 19.0846L13.2934 10.4545L24.357 15.6117"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.1641 4.05037L13.2928 10.4516"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="stat-roi-clip">
        <rect width={24} height={24} fill="white" transform="translate(0 4.16756) rotate(-10)" />
      </clipPath>
    </defs>
  </svg>
);

const StatChartIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 27 27"
    className={cn('size-[27px] shrink-0', className)}
    aria-hidden
  >
    <g clipPath="url(#stat-chart-clip)">
      <path
        d="M17.2227 14.8516L16.2477 22.7919"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.28125 13.875L8.3063 21.8154"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.0078 16.3516L12.0329 24.2919"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.7546 18.897C21.8541 18.5681 22.807 17.8711 23.4534 16.9227C24.0998 15.9744 24.4002 14.8326 24.3044 13.689C24.2085 12.5453 23.7221 11.4695 22.9269 10.642C22.1316 9.81458 21.0759 9.28588 19.937 9.14468L18.6864 8.99112C18.5214 7.73416 18.06 6.53442 17.3403 5.49078C16.6205 4.44714 15.6631 3.58949 14.5469 2.98852C13.4306 2.38754 12.1875 2.06046 10.92 2.03423C9.65256 2.00799 8.39699 2.28336 7.25683 2.83762C6.11667 3.39189 5.12455 4.20919 4.36226 5.22215C3.59997 6.23511 3.08933 7.41474 2.87243 8.66379C2.65554 9.91285 2.73859 11.1956 3.11475 12.4062C3.4909 13.6169 4.1494 14.7208 5.03595 15.627"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="stat-chart-clip">
        <rect width={24} height={24} fill="white" transform="translate(2.92578) rotate(7)" />
      </clipPath>
    </defs>
  </svg>
);

const StatSparkleIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 28"
    className={cn('size-[28px] shrink-0', className)}
    aria-hidden
  >
    <g clipPath="url(#stat-sparkle-clip)">
      <path
        d="M21.3737 6.08129C20.5901 5.94312 19.7838 6.12189 19.132 6.57825C18.4802 7.03462 18.0365 7.7312 17.8983 8.51476L15.8145 20.3325C15.6764 21.116 15.8551 21.9224 16.3115 22.5741C16.7679 23.2259 17.4645 23.6697 18.248 23.8078C19.0316 23.946 19.8379 23.7672 20.4897 23.3109C21.1414 22.8545 21.5852 22.1579 21.7234 21.3743C21.8615 20.5908 21.6828 19.7844 21.2264 19.1327C20.77 18.4809 20.0735 18.0371 19.2899 17.899L7.47221 15.8152C6.68865 15.677 5.88229 15.8558 5.23053 16.3122C4.57878 16.7685 4.135 17.4651 3.99684 18.2487C3.85868 19.0322 4.03744 19.8386 4.49381 20.4904C4.95017 21.1421 5.64676 21.5859 6.43032 21.724C7.21388 21.8622 8.02023 21.6834 8.67199 21.2271C9.32375 20.7707 9.76752 20.0741 9.90569 19.2906L11.9895 7.47287C12.1276 6.68931 11.9489 5.88296 11.4925 5.2312C11.0361 4.57944 10.3395 4.13567 9.55599 3.99751C8.77242 3.85934 7.96607 4.03811 7.31431 4.49447C6.66255 4.95084 6.21878 5.64742 6.08062 6.43099C5.94245 7.21455 6.12122 8.0209 6.57759 8.67266C7.03395 9.32442 7.73054 9.76819 8.5141 9.90635L20.3318 11.9901C21.1154 12.1283 21.9217 11.9495 22.5735 11.4932C23.2252 11.0368 23.669 10.3402 23.8072 9.55665C23.9453 8.77309 23.7666 7.96674 23.3102 7.31498C22.8538 6.66322 22.1572 6.21945 21.3737 6.08129Z"
        stroke="#12161F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="stat-sparkle-clip">
        <rect width={24} height={24} fill="white" transform="translate(4.16797) rotate(10)" />
      </clipPath>
    </defs>
  </svg>
);

const StatCustomersIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 27 27"
    className={cn('size-[27px] shrink-0', className)}
    aria-hidden
  >
    <g clipPath="url(#stat-customers-clip)">
      <path
        d="M19.0831 10.6592L17.8325 10.8128C17.2845 9.42015 16.357 8.20915 15.1552 7.31737C13.9534 6.4256 12.5256 5.88879 11.0339 5.76796C9.54228 5.64713 8.04665 5.94712 6.71699 6.63383C5.38733 7.32055 4.27694 8.36646 3.51201 9.65271C2.74708 10.939 2.35826 12.414 2.38976 13.9102C2.42125 15.4064 2.87178 16.8637 3.69016 18.1167C4.50854 19.3696 5.66195 20.3679 7.01933 20.998C8.37671 21.6282 9.88363 21.865 11.3689 21.6815L20.3018 20.5847C21.618 20.423 22.8161 19.7452 23.6325 18.7002C24.4489 17.6553 24.8168 16.3288 24.6552 15.0126C24.4936 13.6964 23.8157 12.4983 22.7707 11.6819C21.7258 10.8655 20.3993 10.4976 19.0831 10.6592Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="stat-customers-clip">
        <rect width={24} height={24} fill="white" transform="translate(0 2.92486) rotate(-7)" />
      </clipPath>
    </defs>
  </svg>
);

const SendMessageIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    className={cn('size-5 fill-none stroke-white', className)}
    aria-hidden
  >
    <path d="M6.5 10L5 4L17 10L5 16L6.5 10ZM6.5 10H9.5" strokeLinecap="square" />
  </svg>
);

const CheckIcon: FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 12 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={cn('shrink-0', className)}
  >
    <path d="M11.5 0.5L4.5 7.49969L1 4" />
  </svg>
);

const FacebookIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    aria-hidden
    className={cn('size-5 fill-none stroke-[#F8F9FA]', className)}
  >
    <path
      d="M10 19C14.9706 19 19 14.9706 19 10C19 5.02944 14.9706 1 10 1C5.02944 1 1 5.02944 1 10C1 14.9706 5.02944 19 10 19Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.75 6.25H12.25C11.6533 6.25 11.081 6.48705 10.659 6.90901C10.2371 7.33097 10 7.90326 10 8.5V19"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 11.5H13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InstagramIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    aria-hidden
    className={cn('size-5 fill-none stroke-[#CED7DE]', className)}
  >
    <path
      d="M10 13.75C12.0711 13.75 13.75 12.0711 13.75 10C13.75 7.92893 12.0711 6.25 10 6.25C7.92893 6.25 6.25 7.92893 6.25 10C6.25 12.0711 7.92893 13.75 10 13.75Z"
      strokeMiterlimit="10"
    />
    <path
      d="M14.125 1.375H5.875C3.38972 1.375 1.375 3.38972 1.375 5.875V14.125C1.375 16.6103 3.38972 18.625 5.875 18.625H14.125C16.6103 18.625 18.625 16.6103 18.625 14.125V5.875C18.625 3.38972 16.6103 1.375 14.125 1.375Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.875 6.25C15.4963 6.25 16 5.74632 16 5.125C16 4.50368 15.4963 4 14.875 4C14.2537 4 13.75 4.50368 13.75 5.125C13.75 5.74632 14.2537 6.25 14.875 6.25Z"
      fill="currentColor"
    />
  </svg>
);

const XIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 17 17"
    aria-hidden
    className={cn('size-[17px] fill-none stroke-[#CED7DE]', className)}
  >
    <path
      d="M15.2955 1L9.19287 7.29329M7.11364 9.4375L0.75 16M0.75 1L12.1136 16H15.75L4.38636 1H0.75Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkedInIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    aria-hidden
    className={cn('size-[18px] fill-none stroke-[#CED7DE]', className)}
  >
    <path
      d="M16.5 0.75H1.5C1.08579 0.75 0.75 1.08579 0.75 1.5V16.5C0.75 16.9142 1.08579 17.25 1.5 17.25H16.5C16.9142 17.25 17.25 16.9142 17.25 16.5V1.5C17.25 1.08579 16.9142 0.75 16.5 0.75Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8.25 7.5V13.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.25 7.5V13.5" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M8.25 10.125C8.25 9.42881 8.52656 8.76113 9.01884 8.26884C9.51113 7.77656 10.1788 7.5 10.875 7.5C11.5712 7.5 12.2389 7.77656 12.7312 8.26884C13.2234 8.76113 13.5 9.42881 13.5 10.125V13.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5.25 5.625C5.87132 5.625 6.375 5.12132 6.375 4.5C6.375 3.87868 5.87132 3.375 5.25 3.375C4.62868 3.375 4.125 3.87868 4.125 4.5C4.125 5.12132 4.62868 5.625 5.25 5.625Z" />
  </svg>
);

const YouTubeIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden
    className={cn('size-[24px] fill-none stroke-[#CED7DE]', className)}
  >
    <path
      d="M22.5406 6.42C22.4218 5.94541 22.1799 5.51057 21.8392 5.15941C21.4986 4.80824 21.0713 4.55318 20.6006 4.42C18.8806 4 12.0006 4 12.0006 4C12.0006 4 5.12057 4 3.40057 4.46C2.92982 4.59318 2.50255 4.84824 2.16192 5.19941C1.82129 5.55057 1.57936 5.98541 1.46057 6.46C1.14579 8.20556 0.991808 9.97631 1.00057 11.75C0.989351 13.537 1.14334 15.3213 1.46057 17.08C1.59153 17.5398 1.83888 17.9581 2.17872 18.2945C2.51855 18.6308 2.93939 18.8738 3.40057 19C5.12057 19.46 12.0006 19.46 12.0006 19.46C12.0006 19.46 18.8806 19.46 20.6006 19C21.0713 18.8668 21.4986 18.6118 21.8392 18.2606C22.1799 17.9094 22.4218 17.4746 22.5406 17C22.8529 15.2676 23.0069 13.5103 23.0006 11.75C23.0118 9.96295 22.8578 8.1787 22.5406 6.42V6.42Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.75 15.0166L15.5 11.7466L9.75 8.47656V15.0166Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 10 5"
    className={cn(
      'h-[5px] w-2.5 fill-none stroke-white/60 transition-colors duration-500 group-hover/item:stroke-white dark:stroke-white/60 dark:group-hover/item:stroke-white',
      className
    )}
  >
    <path d="M1.19922 0.5L5.19922 4.5L9.19922 0.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LocationIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={cn('size-6 shrink-0 fill-white', className)}
    aria-hidden
  >
    <path
      d="M12 6C11.2583 6 10.5333 6.21993 9.91661 6.63199C9.29993 7.04404 8.81928 7.62971 8.53545 8.31494C8.25162 9.00016 8.17736 9.75416 8.32205 10.4816C8.46675 11.209 8.8239 11.8772 9.34835 12.4017C9.8728 12.9261 10.541 13.2833 11.2684 13.4279C11.9958 13.5726 12.7498 13.4984 13.4351 13.2145C14.1203 12.9307 14.706 12.4501 15.118 11.8334C15.5301 11.2167 15.75 10.4917 15.75 9.75C15.75 8.75544 15.3549 7.80161 14.6517 7.09835C13.9484 6.39509 12.9946 6 12 6ZM12 12C11.555 12 11.12 11.868 10.75 11.6208C10.38 11.3736 10.0916 11.0222 9.92127 10.611C9.75097 10.1999 9.70642 9.7475 9.79323 9.31105C9.88005 8.87459 10.0943 8.47368 10.409 8.15901C10.7237 7.84434 11.1246 7.63005 11.561 7.54323C11.9975 7.45642 12.4499 7.50097 12.861 7.67127C13.2722 7.84157 13.6236 8.12996 13.8708 8.49997C14.118 8.86998 14.25 9.30499 14.25 9.75C14.25 10.3467 14.0129 10.919 13.591 11.341C13.169 11.7629 12.5967 12 12 12ZM12 1.5C9.81273 1.50248 7.71575 2.37247 6.16911 3.91911C4.62247 5.46575 3.75248 7.56273 3.75 9.75C3.75 12.6937 5.11031 15.8138 7.6875 18.7734C8.84552 20.1108 10.1489 21.3151 11.5734 22.3641C11.6995 22.4524 11.8498 22.4998 12.0037 22.4998C12.1577 22.4998 12.308 22.4524 12.4341 22.3641C13.856 21.3147 15.1568 20.1104 16.3125 18.7734C18.8859 15.8138 20.25 12.6937 20.25 9.75C20.2475 7.56273 19.3775 5.46575 17.8309 3.91911C16.2843 2.37247 14.1873 1.50248 12 1.5ZM12 20.8125C10.4503 19.5938 5.25 15.1172 5.25 9.75C5.25 7.95979 5.96116 6.2429 7.22703 4.97703C8.4929 3.71116 10.2098 3 12 3C13.7902 3 15.5071 3.71116 16.773 4.97703C18.0388 6.2429 18.75 7.95979 18.75 9.75C18.75 15.1153 13.5497 19.5938 12 20.8125Z"
      fillOpacity="0.9"
    />
  </svg>
);

const GoogleIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={cn('size-6 shrink-0 fill-none', className)}
    aria-hidden
  >
    <path
      d="M21.7541 12.2199C21.7541 11.4182 21.6878 10.8332 21.5441 10.2266H12.2031V13.8449H17.6861C17.5756 14.744 16.9786 16.0982 15.6521 17.0082L15.6335 17.1293L18.5869 19.3715L18.7915 19.3916C20.6708 17.6907 21.7541 15.1882 21.7541 12.2199Z"
      fill="#4285F4"
    />
    <path
      d="M12.2002 21.7514C14.8864 21.7514 17.1415 20.8847 18.7886 19.3897L15.6492 17.0063C14.8091 17.5805 13.6815 17.9813 12.2002 17.9813C9.56932 17.9813 7.33635 16.2805 6.54036 13.9297L6.42369 13.9394L3.35266 16.2686L3.3125 16.378C4.94853 19.563 8.30907 21.7514 12.2002 21.7514Z"
      fill="#34A853"
    />
    <path
      d="M6.53907 13.9306C6.32904 13.3239 6.20749 12.6739 6.20749 12.0023C6.20749 11.3305 6.32904 10.6806 6.52802 10.0739L6.52246 9.94471L3.41294 7.57812L3.3112 7.62555C2.63691 8.94723 2.25 10.4314 2.25 12.0023C2.25 13.5731 2.63691 15.0572 3.3112 16.3789L6.53907 13.9306Z"
      fill="#FBBC05"
    />
    <path
      d="M12.2003 6.01997C14.0685 6.01997 15.3286 6.8108 16.0472 7.47168L18.855 4.785C17.1306 3.21417 14.8865 2.25 12.2003 2.25C8.3091 2.25 4.94854 4.43832 3.3125 7.62329L6.52933 10.0717C7.33638 7.72083 9.56936 6.01997 12.2003 6.01997Z"
      fill="#EB4335"
    />
  </svg>
);

const FacebookBrandIcon: FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={cn('size-6 shrink-0 fill-none', className)}
    aria-hidden
  >
    <path
      d="M22.5 12.0642C22.5 6.22974 17.799 1.5 12 1.5C6.20101 1.5 1.5 6.22974 1.5 12.0642C1.5 17.337 5.33968 21.7075 10.3594 22.5V15.1179H7.69336V12.0642H10.3594V9.73675C10.3594 7.08911 11.927 5.62663 14.3254 5.62663C15.4738 5.62663 16.6758 5.83296 16.6758 5.83296V8.43274H15.3518C14.0475 8.43274 13.6406 9.24713 13.6406 10.0834V12.0642H16.5527L16.0872 15.1179H13.6406V22.5C18.6603 21.7075 22.5 17.337 22.5 12.0642Z"
      fill="#0C63D4"
    />
  </svg>
);

export {
  ArrowIcon,
  CheckIcon,
  ChevronIcon,
  FacebookBrandIcon,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  LinkedInIcon,
  LocationIcon,
  SendMessageIcon,
  StatChartIcon,
  StatCustomersIcon,
  StatRoiIcon,
  StatSparkleIcon,
  XIcon,
  YouTubeIcon,
};
