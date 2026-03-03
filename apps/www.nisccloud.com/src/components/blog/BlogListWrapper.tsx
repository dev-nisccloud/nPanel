import { IBlogPost } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import BlogList from './BlogList';

const BlogListWrapper = () => {
  const allBlogs = getMarkDownData<IBlogPost & { [key: string]: unknown }>('src/data/blogs')
    .filter((blog) => blog.title && blog.publishDate && blog.tag)

    .toSorted((a, b) => {
      const dateA = new Date(a.publishDate).getTime();
      const dateB = new Date(b.publishDate).getTime();
      return dateB - dateA;
    });

  return <BlogList blogs={allBlogs} />;
};
BlogListWrapper.displayName = 'BlogListWrapper';
export default BlogListWrapper;
