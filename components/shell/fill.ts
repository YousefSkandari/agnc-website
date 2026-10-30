// Writes a progress fill straight to the element (no re-render). Going backwards (a loop, a new
// post) jumps with no transition; going forwards keeps the CSS transition (D 1526–1533).
const last = new WeakMap<HTMLElement, number>();

export function setFill(el: HTMLElement | null, p: number) {
  if (!el) return;
  const v = Math.max(0, Math.min(1, p));
  const prev = last.get(el) ?? 0;
  el.style.transition = v < prev ? "none" : "";
  el.style.transform = `scaleX(${v.toFixed(4)})`;
  last.set(el, v);
}
