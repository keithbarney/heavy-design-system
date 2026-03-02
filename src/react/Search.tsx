import { forwardRef, type InputHTMLAttributes } from 'react';

type SearchSize = 'xs' | 'sm' | 'lg';

interface SearchProps extends InputHTMLAttributes<HTMLInputElement> {
  searchSize?: SearchSize;
}

const Search = forwardRef<HTMLInputElement, SearchProps>(
  ({ searchSize, className, ...props }, ref) => {
    const cls = [
      'hds-search',
      searchSize && `hds-search--${searchSize}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} type="search" className={cls} {...props} />;
  },
);
Search.displayName = 'Search';

export { Search };
export type { SearchProps };
