export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="hazard h-2 opacity-80" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-mute md:grid-cols-3">
        <div>
          <p className="display text-2xl text-paper">Atlas</p>
          <p className="mt-2">An independent index of commercial strength machines.</p>
        </div>
        <p>
          Specs are approximate and the scores are editorial estimates. Always check a machine on the
          manufacturer&apos;s page before you buy. Brand names belong to their owners.
        </p>
        <p className="label leading-relaxed">
          Community votes are stored in your browser for now. Starting tallies are seeded.
        </p>
      </div>
    </footer>
  );
}
