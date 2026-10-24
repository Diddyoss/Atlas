import { useMemo } from "react";
import { navigate, useRoute } from "../router";

export function usePathname() {
  return useRoute().path;
}

export function useSearchParams() {
  const { search } = useRoute();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useRouter() {
  return {
    push: (href: string, opts?: { scroll?: boolean }) => navigate(href, { scroll: opts?.scroll ?? true }),
    replace: (href: string, opts?: { scroll?: boolean }) => navigate(href, { replace: true, scroll: opts?.scroll ?? true }),
    back: () => history.back(),
    forward: () => history.forward(),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function notFound(): never {
  throw new Error("Not found");
}
