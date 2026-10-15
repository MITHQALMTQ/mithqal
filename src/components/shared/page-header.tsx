import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * PageHeader — institutional page header with breadcrumbs, title,
 * description, and an optional actions slot.
 *
 * Structure:
 *   <header>
 *     <div class="scroll-progress-bar" />       ← fixed-position bar
 *                                                 styled by globals.css;
 *                                                 width updated by JS
 *                                                 elsewhere (e.g. a
 *                                                 useScrollProgress hook)
 *     <nav aria-label="Breadcrumb">              ← optional, wraps on mobile
 *       <ol>…<li>…item…</li><li>/</li>…</ol>
 *     </nav>
 *     <div flex-col sm:flex-row>
 *       <div>
 *         <h1>title</h1>
 *         <p>description</p>
 *       </div>
 *       <div>actions</div>                       ← below title on mobile,
 *                                                 right on sm+
 *     </div>
 *   </header>
 *
 * Server component by default (no hooks). If a parent needs to control the
 * scroll-progress-bar width from React state, wrap it in a client component
 * or just use a `document.querySelector(".scroll-progress-bar")` lookup.
 *
 * Exports: named `PageHeader` + default.
 *
 * PHASE1A: enhanced from a 3-LOC h1+description stub to a full
 * breadcrumb + actions + scroll-progress surface.
 */

export interface PageHeaderBreadcrumb {
  /** Visible label of the crumb. */
  label: string;
  /** Optional internal route; if omitted the crumb renders as the current page. */
  href?: string;
}

export interface PageHeaderProps {
  /** Page H1 (rendered via font-display + .gold-text). */
  title: string;
  /** Optional supporting description shown below the title. */
  description?: React.ReactNode;
  /** Optional breadcrumb trail shown above the title. */
  breadcrumbs?: PageHeaderBreadcrumb[];
  /** Optional actions (buttons, filters, exports) shown right of (or below on mobile) the title. */
  actions?: React.ReactNode;
  /** Optional className for the wrapping <header>. */
  className?: string;
  /** Render the title with the .gold-text gradient. Default true. */
  goldTitle?: boolean;
  /** Render the title as <h1> (default) or override the heading level for a11y. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  goldTitle = true,
  headingLevel = 1,
}: PageHeaderProps) {
  const hasBreadcrumbs = Array.isArray(breadcrumbs) && breadcrumbs.length > 0;

  // Polymorphic heading element — keeps the a11y tree correct when a
  // PageHeader is nested inside a section that already has an <h1>.
  const Heading = (
    `h${headingLevel}` as keyof React.JSX.IntrinsicElements
  ) as React.ElementType;

  return (
    <header className={cn("relative", className)}>
      {/* Scroll-progress bar — styled by .scroll-progress-bar in globals.css.
          Width starts at 0; a client-side hook (e.g. on the page layout)
          can update it via `el.style.width = pct + "%"` as the user scrolls. */}
      <div
        className="scroll-progress-bar"
        aria-hidden="true"
        style={{ width: 0 }}
      />

      {/* Breadcrumb trail — wraps on mobile (BreadcrumbList uses flex-wrap). */}
      {hasBreadcrumbs ? (
        <Breadcrumb
          aria-label="Breadcrumb"
          className="mb-3"
        >
          <BreadcrumbList className="text-xs text-fg-muted">
            {breadcrumbs!.map((crumb, i) => {
              const isLast = i === breadcrumbs!.length - 1;
              const key = `${crumb.label}-${i}`;
              return (
                <React.Fragment key={key}>
                  <BreadcrumbItem>
                    {crumb.href && !isLast ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href}
                          className="transition-colors hover:text-foreground"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-fg-muted">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbSeparator className="text-fg-muted/50">
                      /
                    </BreadcrumbSeparator>
                  ) : null}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {/* Title + actions row — stacks on mobile, side-by-side on sm+. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Heading
            className={cn(
              "font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl",
              goldTitle ? "gold-text" : "text-foreground"
            )}
          >
            {title}
          </Heading>
          {description ? (
            <div className="mt-2 max-w-2xl text-sm text-fg-muted sm:text-base">
              {description}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default PageHeader;
