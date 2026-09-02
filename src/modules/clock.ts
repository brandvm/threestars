/** UTC clock. Renders into #utc where the page has one. */
export function initClock(): void {
  const el = document.getElementById('utc');
  if (!el) return;

  const tick = () => {
    el.textContent = `${new Date().toUTCString().split(' ')[4]} UTC`;
  };

  tick();
  setInterval(tick, 1000);
}
