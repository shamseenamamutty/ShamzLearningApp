import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  title: ReactNode;
  onClose(): void;
  children: ReactNode;
}

/**
 * Pop-up window over the current screen (dimmed backdrop, centred card). Closes on the ✕ button,
 * a tap on the backdrop, or Escape. Focus moves to the first field when it opens.
 */
export function Modal({ open, title, onClose, children }: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Runs only when the dialog opens, so typing (re-renders) never steals focus back to the first field.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    cardRef.current?.querySelector<HTMLElement>('input, button[type="submit"]')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4" onClick={onClose}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className="w-full max-w-sm rounded-3xl bg-white p-5 text-ink shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <h2 className="flex-1 text-xl font-extrabold">{title}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-grape-50 text-lg font-bold text-grape-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
