import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "../router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; scroll?: boolean; prefetch?: boolean };

export default function Link({ href, scroll = true, prefetch: _prefetch, onClick, ...rest }: Props) {
  const external = /^https?:/.test(href);
  return (
    <a
      {...rest}
      href={external ? href : `#${href}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (external || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || rest.target) return;
        e.preventDefault();
        navigate(href, { scroll });
      }}
    />
  );
}
