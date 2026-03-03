import RevealAnimation from '@/components/animation/RevealAnimation';
import LinkButton from '@/components/ui/button/Button';
import { CalendarIcon, StopwatchIcon } from '@/icons';
import { IBlogPost } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import Image from 'next/image';
import Link from 'next/link';

const Blog = () => {
  const featuredBlogs = getMarkDownData<IBlogPost & { [key: string]: unknown }>('src/data/blogs').filter(
    (blog) => blog.showHomePage === true,
  );

  return (
    <RevealAnimation delay={0.1}>
      <section
        className="mx-5 rounded-2xl bg-gradient-to-b from-[#142e6e] to-[#edf2ff] py-18 md:rounded-3xl md:py-20 lg:rounded-4xl lg:py-24 xl:rounded-[56px] xl:py-39"
        aria-labelledby="blog-heading"
        aria-describedby="blog-description">
        <div className="main-container">
          <div className="space-y-14">
            {/* text content  */}
            <div className="space-y-4 text-center sm:space-y-3">
              <RevealAnimation delay={0.1} start="top 95%">
                <span
                  className="badge bg-accent/20 text-tagline-3 font-normal text-white uppercase"
                  aria-label="Section category">
                  Blog
                </span>
              </RevealAnimation>
              <RevealAnimation delay={0.2} start="top 95%">
                <h2 id="blog-heading" className="mx-auto max-w-[814px] text-white">
                  Insights & resources for smarter financial decisions
                </h2>
              </RevealAnimation>
              <RevealAnimation delay={0.3} start="top 95%">
                <p
                  id="blog-description"
                  className="mx-auto max-w-[550px] text-lg leading-[150%] font-normal text-white/80">
                  Explore expert guides, tips, and industry updates to help you grow, scale, and manage your finances
                  with confidence.
                </p>
              </RevealAnimation>
            </div>

            {/* blogs  */}
            <div className="grid grid-cols-12 items-start gap-y-2 lg:gap-x-1 lg:gap-y-0" aria-label="Blog posts">
              {/* card one  */}
              <RevealAnimation delay={0.1} start="top 95%">
                <div className="group col-span-12 lg:col-span-5 xl:col-span-6">
                  <article className="mx-auto max-w-[627px] overflow-hidden rounded-3xl bg-white p-1 md:rounded-4xl lg:mx-0 lg:max-w-full">
                    <Link href={`/blog/${featuredBlogs[0].slug}`}>
                      <figure className="h-[260px] w-full max-w-full overflow-hidden rounded-[20px] md:rounded-[28px]">
                        <Image
                          src={featuredBlogs[0].thumbnail}
                          alt={featuredBlogs[0].title}
                          className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                          loading="lazy"
                          width={627}
                          height={260}
                        />
                      </figure>
                    </Link>

                    {/* text   */}
                    <div className="flex h-[218px] flex-col justify-between p-4 sm:h-[270px] md:p-8 xl:h-[292px]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <CalendarIcon className="fill-black" />
                            </span>
                            <time
                              className="text-tagline-2 text-secondary/60 font-medium"
                              dateTime={featuredBlogs[0].publishDate}
                              aria-label={`Published date: ${featuredBlogs[0].publishDate}`}>
                              {featuredBlogs[0].publishDate}
                            </time>
                          </div>
                          <div className="bg-stroke-2 h-[22px] w-px" aria-hidden="true"></div>
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <StopwatchIcon className="fill-black" />
                            </span>
                            <span
                              className="text-tagline-2 text-secondary/60 font-medium"
                              aria-label={`Reading time: ${featuredBlogs[0].readTime}`}>
                              {featuredBlogs[0].readTime}
                            </span>
                          </div>
                        </div>

                        <Link href={`/blog/${featuredBlogs[0].slug}`} className="block">
                          <h3 className="text-heading-6 md:text-heading-5 line-clamp-2">{featuredBlogs[0].title}</h3>
                        </Link>
                        <p className="text-heading-6 line-clamp-2 hidden w-full max-w-[563px] overflow-hidden sm:block lg:hidden xl:block">
                          <span className="line-clamp-2">{featuredBlogs[0].description}</span>
                        </p>
                      </div>

                      <div>
                        <LinkButton
                          href={`/blog/${featuredBlogs[0].slug}`}
                          className="border-secondary/10 btn-v3-white btn-v3-lg border"
                          ariaLabel={`Read more about ${featuredBlogs[0].title}`}>
                          Read more
                        </LinkButton>
                      </div>
                    </div>
                  </article>
                </div>
              </RevealAnimation>

              <div className="col-span-12 space-y-2 lg:col-span-7 lg:space-y-1 xl:col-span-6">
                {/* card two  */}
                <RevealAnimation delay={0.2} start="top 95%">
                  <div className="group">
                    <article className="mx-auto flex max-w-[627px] flex-col gap-0 overflow-hidden rounded-3xl bg-white p-1 sm:flex-row sm:gap-8 md:gap-0 md:rounded-4xl lg:mx-0 lg:max-w-full">
                      <Link href={`/blog/${featuredBlogs[1].slug}`}>
                        <figure className="h-[260px] w-full shrink-0 overflow-hidden rounded-[20px] sm:h-auto sm:w-[298px] md:rounded-[28px] xl:h-[270px]">
                          <Image
                            src={featuredBlogs[1].thumbnail}
                            alt={featuredBlogs[1].title}
                            className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                            loading="lazy"
                            width={298}
                            height={270}
                          />
                        </figure>
                      </Link>
                      <div className="space-y-4 p-4 sm:p-0 sm:py-8 sm:pr-8 md:p-8 lg:pl-4 xl:pl-8">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <CalendarIcon className="fill-black" />
                            </span>
                            <time
                              className="text-tagline-2 text-secondary/60 font-medium"
                              dateTime={featuredBlogs[1].publishDate}
                              aria-label={`Published date: ${featuredBlogs[1].publishDate}`}>
                              {featuredBlogs[1].publishDate}
                            </time>
                          </div>
                          <div className="bg-stroke-2 h-[22px] w-px" aria-hidden="true"></div>
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <StopwatchIcon className="fill-black" />
                            </span>
                            <span
                              className="text-tagline-2 text-secondary/60 shrink-0 font-medium"
                              aria-label={`Reading time: ${featuredBlogs[1].readTime}`}>
                              {featuredBlogs[1].readTime}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Link href={`/blog/${featuredBlogs[1].slug}`} className="block">
                            <h3 className="text-heading-6 md:text-heading-5 line-clamp-2">{featuredBlogs[1].title}</h3>
                          </Link>
                        </div>
                        <div className="mt-6 w-full md:w-auto">
                          <LinkButton
                            href={`/blog/${featuredBlogs[1].slug}`}
                            className="border-secondary/10 btn-v3-white btn-v3-lg border"
                            ariaLabel={`Read more about ${featuredBlogs[1].title}`}>
                            Read more
                          </LinkButton>
                        </div>
                      </div>
                    </article>
                  </div>
                </RevealAnimation>

                {/* card three  */}
                <RevealAnimation delay={0.2} start="top 95%">
                  <div className="group">
                    <article className="mx-auto flex max-w-[627px] flex-col gap-0 overflow-hidden rounded-3xl bg-white p-1 sm:flex-row sm:gap-8 md:gap-0 md:rounded-4xl lg:mx-0 lg:max-w-full">
                      <Link href={`/blog/${featuredBlogs[2].slug}`}>
                        <figure className="h-[260px] w-full shrink-0 overflow-hidden rounded-[20px] sm:h-auto sm:w-[298px] md:rounded-[28px] xl:h-[270px]">
                          <Image
                            src={featuredBlogs[2].thumbnail}
                            alt={featuredBlogs[2].title}
                            className="h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                            loading="lazy"
                            width={298}
                            height={270}
                          />
                        </figure>
                      </Link>
                      <div className="space-y-4 p-4 sm:p-0 sm:py-8 sm:pr-8 md:p-8 lg:pl-4 xl:pl-8">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <CalendarIcon className="fill-black" />
                            </span>
                            <time
                              className="text-tagline-2 text-secondary/60 font-medium"
                              dateTime={featuredBlogs[2].publishDate}
                              aria-label={`Published date: ${featuredBlogs[2].publishDate}`}>
                              {featuredBlogs[2].publishDate}
                            </time>
                          </div>
                          <div className="bg-stroke-2 h-[22px] w-px" aria-hidden="true"></div>
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">
                              <StopwatchIcon className="fill-black" />
                            </span>
                            <span
                              className="text-tagline-2 text-secondary/60 shrink-0 font-medium"
                              aria-label={`Reading time: ${featuredBlogs[2].readTime}`}>
                              {featuredBlogs[2].readTime}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Link href={`/blog/${featuredBlogs[2].slug}`} className="block">
                            <h3 className="text-heading-6 md:text-heading-5 line-clamp-2">{featuredBlogs[2].title}</h3>
                          </Link>
                        </div>
                        <div className="mt-6 w-full md:w-auto">
                          <LinkButton
                            href={`/blog/${featuredBlogs[2].slug}`}
                            className="border-secondary/10 btn-v3-white btn-v3-lg border"
                            ariaLabel={`Read more about ${featuredBlogs[2].title}`}>
                            Read more
                          </LinkButton>
                        </div>
                      </div>
                    </article>
                  </div>
                </RevealAnimation>
              </div>
            </div>

            {/* btn   */}
            <RevealAnimation delay={0.3} start="top 95%">
              <div className="mx-auto w-[80%] text-center sm:w-full md:mx-0 md:w-auto">
                <LinkButton
                  href="/blog"
                  className="btn-v3-lg btn-v3-white mx-auto w-full sm:w-fit"
                  ariaLabel="Visit our blog">
                  Visit our blog
                </LinkButton>
              </div>
            </RevealAnimation>
          </div>
        </div>
      </section>
    </RevealAnimation>
  );
};

Blog.displayName = 'Blog';
export default Blog;
