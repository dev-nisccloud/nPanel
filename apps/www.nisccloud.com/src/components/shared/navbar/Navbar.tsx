'use client';
import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import { MobileMenuProvider } from '@/context/MobileMenuContext';
import { mobileMenuData } from '@/data/navbar-data';
import { useNavbarScroll } from '@/hooks/useScrollHeader';
import { cn } from '@/utils/cn';
import logoDark from '@public/nisclogowhite.png';
import logo from '@public/nisclogooriginal.png';
import mainLogo from '@public/nisclogooriginal.png';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import MobileMenu from '../mobile-menu/MobileMenu';
import EngageMenu from './EngageMenu';
import ExploreMenu from './ExploreMenu';
import InsightsMenu from './InsightsMenu';
import MobileMenuButton from './MobileMenuButton';

const Navbar = () => {
  const { isScrolled } = useNavbarScroll(150);

  const [menuDropdownId, setMenuDropdownId] = useState<string | null>(null);

  const handleMenuHover = (dropdownId?: string | null) => {
    setMenuDropdownId(dropdownId || null);
  };
  return (
    <MobileMenuProvider>
      <header
        onMouseLeave={() => handleMenuHover(null)}
        className={cn(
          'lp:max-w-[1290px]! fixed top-5 left-1/2 z-50 mx-auto w-full max-w-[350px] -translate-x-1/2 rounded-[20px] transition-all duration-500 ease-in-out min-[425px]:max-w-[375px] min-[500px]:max-w-[450px] sm:max-w-[540px] md:max-w-[720px] lg:max-w-[960px] xl:max-w-[1140px]',
          isScrolled && 'top-2!',
        )}>
        <RevealAnimation direction="up" offset={100} delay={0.1} instant>
          <div>
            <div
              className={cn(
                'flex items-center justify-between rounded-[20px] bg-white px-1.5 py-2.5 backdrop-blur-[25px] xl:py-0',
              )}>
              <div>
                <Link href="/">
                  <span className="sr-only">Home</span>
                  <figure className="hidden lg:block lg:max-w-[150px]">
                    <Image src={mainLogo} alt="Nisc Cloud" className="dark:invert" priority />
                  </figure>
                  <figure className="block max-w-[110px] lg:hidden">
                    <Image src={logo} alt="Nisc Cloud" className="block w-full dark:hidden" priority />
                    <Image src={logoDark} alt="Nisc Cloud" className="hidden w-full dark:block" priority />
                  </figure>
                </Link>
              </div>
              <nav className="hidden items-center xl:flex">
                <ul className="flex items-center">
                  <li className="py-2.5">
                    <Link
                      href="/pricing"
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      Pricing
                    </Link>
                  </li>
                  <li
                    onMouseEnter={() => handleMenuHover('explore-mega-menu')}
                    data-menu="explore-mega-menu"
                    className="group/nav-item relative cursor-pointer py-2.5">
                    <Link
                      href="#"
                      onClick={(event) => event.preventDefault()}
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      <span>Services</span>
                      <span className="block origin-center translate-y-px transition-all duration-300 group-hover/nav-item:rotate-180">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </Link>
                    <ExploreMenu menuDropdownId={menuDropdownId} setMenuDropdownId={setMenuDropdownId} />
                  </li>
                  <li
                    onMouseEnter={() => handleMenuHover('engage-mega-menu')}
                    data-menu="engage-mega-menu"
                    className="group/nav-item relative cursor-pointer py-2.5">
                    <Link
                      href="#"
                      onClick={(event) => event.preventDefault()}
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      <span>Engage</span>
                      <span className="block origin-center translate-y-px transition-all duration-300 group-hover/nav-item:rotate-180">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </Link>
                    <EngageMenu menuDropdownId={menuDropdownId} setMenuDropdownId={setMenuDropdownId} />
                  </li>
                  {/* <li
                    onMouseEnter={() => handleMenuHover('insights-mega-menu')}
                    data-menu="insights-mega-menu"
                    className="group/nav-item relative cursor-pointer py-2.5">
                    <Link
                      href="#"
                      onClick={(event) => event.preventDefault()}
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      <span>Insights</span>
                      <span className="block origin-center translate-y-px transition-all duration-300 group-hover/nav-item:rotate-180">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </Link>
                    <InsightsMenu menuDropdownId={menuDropdownId} setMenuDropdownId={setMenuDropdownId} />
                  </li> */}
                  <li className="py-2.5">
                    <Link
                      href="/blog"
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      Blog
                    </Link>
                  </li>
                  <li className="py-2.5">
                    <Link
                      href="/contact-us"
                      className="text-tagline-1 text-secondary/60 hover:text-secondary flex items-center gap-1 rounded-full border border-transparent px-4 py-2 font-normal transition-all duration-200">
                      Contact us
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="hidden items-center justify-center xl:flex">
                <LinkButton href="/signup" className="btn-v3-lg btn-v3-secondary">
                  Get started
                </LinkButton>
              </div>
              <MobileMenuButton />
            </div>
          </div>
        </RevealAnimation>
      </header>
      <MobileMenu menuData={mobileMenuData} />
    </MobileMenuProvider>
  );
};

Navbar.displayName = 'Navbar';
export default Navbar;
