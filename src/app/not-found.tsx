import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grain-bg flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <Logo className="h-20 w-20" />
      <p className="font-display mt-8 text-7xl text-gold sm:text-8xl">404</p>
      <h1 className="font-display mt-4 text-2xl text-foreground sm:text-3xl">
        This page could not be found
      </h1>
      <p className="mt-3 max-w-md text-sm text-fg-muted sm:text-base">
        The path you sought does not exist within the Institution. Like the
        Constitution itself, the routes here are defined — and this one is not
        among them.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
        >
          Return to the Institution
        </Link>
        <Link
          href="/?view=constitution"
          className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
        >
          Read the Constitution
        </Link>
      </div>
    </div>
  );
}
