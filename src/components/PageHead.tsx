export function PageHead({ kicker, title, sub, children }: { kicker: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="grid-bg border-b border-line">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="label rise">{kicker}</p>
        <h1 className="display rise mt-3 text-[clamp(2.5rem,6vw,4.5rem)] text-paper" style={{ animationDelay: "60ms" }}>
          {title}
        </h1>
        {sub && (
          <p className="rise mt-4 max-w-2xl text-mute" style={{ animationDelay: "120ms" }}>
            {sub}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
