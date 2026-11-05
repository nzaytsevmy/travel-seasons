// Google web search directives. Ignore Googlebot-News and other scoped headers.
export function hasNoindex(value) {
  return /(?:^|[\s,])(?:noindex|none)(?=$|[\s,])/i.test(value || '');
}

export function hasHeaderNoindex(headers) {
  return headers.some(({ name, value }) => {
    if (name.toLowerCase() !== 'x-robots-tag') return false;
    let applies = true;
    for (const part of value.split(',')) {
      const directive = part.trim();
      const scope = directive.match(/^([\w-]+):\s*(.*)$/);
      if (scope && !/^(?:max-snippet|max-image-preview|max-video-preview|unavailable_after)$/i.test(scope[1])) {
        applies = scope[1].toLowerCase() === 'googlebot';
        if (applies && hasNoindex(scope[2])) return true;
      } else if (!scope && applies && /^(?:noindex|none)$/i.test(directive)) return true;
    }
    return false;
  });
}

// Match the most specific user-agent group, then the longest matching rule.
// Equal Allow and Disallow rules resolve in favor of Allow.
export function googlebotAllowed(robots) {
  const groups = [];
  let group;
  for (const line of robots.split(/\r?\n/)) {
    const field = line.split('#', 1)[0].trim().match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
    if (!field) continue;
    const key = field[1].toLowerCase();
    const value = field[2].trim();
    if (key === 'user-agent') {
      if (!group || group.hasRules) {
        group = { agents: [], rules: [], hasRules: false };
        groups.push(group);
      }
      group.agents.push(value.toLowerCase().match(/^(?:\*(?=\s|$)|[a-z_-]+)/)?.[0]);
    } else if (group) {
      group.hasRules = true;
      if (!value) continue;
      const pattern = normalizePath(value);
      const anchored = pattern.endsWith('$');
      const path = anchored ? pattern.slice(0, -1) : pattern;
      const expression = path.split('*').map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      group.rules.push({
        allow: key === 'allow', length: pattern.length,
        matches: new RegExp('^' + expression + (anchored ? '$' : '')),
      });
    }
  }
  const specific = groups.filter(group => group.agents.includes('googlebot'));
  const selected = specific.length ? specific : groups.filter(group => group.agents.includes('*'));
  const rules = selected.flatMap(group => group.rules)
    .sort((a, b) => b.length - a.length || Number(b.allow) - Number(a.allow));
  return url => {
    const { pathname, search } = new URL(url);
    return rules.find(rule => rule.matches.test(normalizePath(pathname + search)))?.allow ?? true;
  };
}

function normalizePath(path) {
  return path.replace(/[^\x00-\x7f]+/gu, encodeURI).replace(/%([\da-f]{2})/gi, (_, hex) => {
    const char = String.fromCharCode(parseInt(hex, 16));
    return /[\w.~-]/.test(char) ? char : '%' + hex.toUpperCase();
  });
}
