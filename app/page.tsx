export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 p-6 sm:p-12">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Bootstrap scaffold
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Startup State Atlas
      </h1>
      <p className="text-base text-muted-foreground sm:text-lg">
        Utah&rsquo;s agent-readable startup ecosystem. Founder/investor product
        on top, agent-native API/CLI/MCP underneath.
      </p>
      <p className="text-sm text-muted-foreground">
        This page is a placeholder. Agents 2&ndash;6 will replace it with the
        Founder Navigator, ecosystem map, profiles, claim flow, and admin UI.
      </p>
    </main>
  );
}
