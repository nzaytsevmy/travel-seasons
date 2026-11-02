// Native fragment navigation creates a new history entry with null state.
// Copy the current private draft into that entry without putting it in the URL.
export function openCalculatorSources(event, env = window) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
  const link = event.target.closest?.('.tc-source-date a[href="#sources-title"]');
  const heading = link && env.document.getElementById('sources-title');
  if (!heading) return false;
  event.preventDefault();
  try { env.history.pushState(env.history.state, '', link.href); }
  catch { /* Scrolling without a new history entry still preserves the draft. */ }
  heading.scrollIntoView({ block:'start' });
  heading.focus({ preventScroll:true });
  return true;
}
