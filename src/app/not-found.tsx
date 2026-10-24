import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-3xl place-items-center px-4 py-32 text-center">
      <p className="display text-[8rem] leading-none text-paper">404</p>
      <p className="mt-4 text-mute">That machine isn&apos;t on the floor.</p>
      <Link href="/catalogue" className="mt-8 border border-paper px-5 py-3 font-mono text-xs uppercase tracking-wider hover:bg-paper hover:text-ink">
        Back to catalogue
      </Link>
    </div>
  );
}
