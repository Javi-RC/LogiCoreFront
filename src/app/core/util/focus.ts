const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

// Mantiene el Tab dentro de un diálogo modal.
export function trapTab(event: KeyboardEvent, container: HTMLElement): void {
  const items = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
