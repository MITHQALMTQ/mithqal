"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

/**
 * DetailModal — reusable, accessible detail-modal wrapper.
 *
 * Built on top of the shadcn Dialog (Radix UI primitives) which gives us, for
 * free: Esc-to-close, focus trap, click-on-overlay-to-close, scroll lock, and
 * portal rendering. We layer framer-motion on top for a smooth entrance + exit
 * animation (Radix waits for the exit animation to finish before unmounting
 * the content via the data-state CSS transitions).
 *
 * Two usage modes:
 *
 * 1. Trigger mode (uncontrolled) — pass a `trigger` React node. The node must
 *    be a single element that forwards props (button, div with role=button,
 *    motion.div, etc.). DetailModal manages its own open state.
 *
 *    <DetailModal trigger={<button>Open</button>} title="...">
 *      <p>Body</p>
 *    </DetailModal>
 *
 * 2. Controlled mode — omit `trigger`, pass `open` + `onOpenChange`. Lets the
 *    parent (e.g. a clickable table row) drive the modal.
 *
 *    <DetailModal open={!!selected} onOpenChange={setSelected} title="...">
 *      <p>Body</p>
 *    </DetailModal>
 *
 * Backdrop blur is applied via the `backdrop-blur-sm` class on the overlay.
 */
export interface DetailModalProps {
  /** Trigger element (uncontrolled mode). Must accept ref + onClick. */
  trigger?: React.ReactNode;
  /** Controlled open state. When provided, onOpenChange must also be set. */
  open?: boolean;
  /** Controlled-mode open setter. */
  onOpenChange?: (open: boolean) => void;
  title: string;
  /** Optional sub-title / eyebrow text under the title. */
  description?: string;
  /** Optional eyebrow label rendered above the title (e.g. "§4 — Reserve Ratio"). */
  eyebrow?: string;
  children: React.ReactNode;
  /** Tailwind max-width class. Defaults to "sm:max-w-lg". */
  sizeClassName?: string;
}

export function DetailModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  children,
  sizeClassName = "sm:max-w-lg",
}: DetailModalProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? !!open : internalOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [isControlled, onOpenChange]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        showCloseButton={false}
        className={`${sizeClassName} gap-0 overflow-hidden border-line bg-ink-soft p-0 text-foreground backdrop-blur-xl`}
      >
        {/* Inner motion wrapper — framer-motion entrance/exit. Radix still
            handles the outer portal mount/unmount + Esc + focus trap. */}
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              key="detail-modal-body"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <DialogHeader className="gap-0 border-b border-line bg-ink-soft/95 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {eyebrow ? (
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                        {eyebrow}
                      </div>
                    ) : null}
                    <DialogTitle className="font-display text-lg leading-tight text-foreground sm:text-xl">
                      {title}
                    </DialogTitle>
                    {description ? (
                      <DialogDescription className="mt-1 text-xs text-fg-muted">
                        {description}
                      </DialogDescription>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close dialog"
                    title="Close (Esc)"
                    className="shrink-0 rounded-md border border-line p-1.5 text-fg-muted transition hover:border-gold/40 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ModalTriggerProps — the props DetailModal adds to its trigger via asChild
 * (Radix merges onClick, aria-haspopup, aria-expanded, etc.). Consumers do
 * NOT need to apply these manually; just pass any focusable element.
 *
 * For non-button triggers (e.g. a div), the consumer is responsible for
 * role="button" + tabIndex={0} + onKeyDown for Enter/Space — see the helper
 * `useTriggerKeyboard` below.
 */
export function useTriggerKeyboard(onActivate: () => void) {
  return React.useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onActivate();
      }
    },
    [onActivate]
  );
}
