// The existing full-browser ratchet, also applied before publication CI.
// This preserves its global allowance, independently of per-article SOFT limits.
export function articleQualityRatchet({ posts, baseline }) {
  const noJournal=[],stopWords=[];
  for(const {file,raw} of posts) {
    const match=raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if(!match) continue;
    const [,frontmatter,body]=match;
    if(!/^checks:/m.test(frontmatter)) noJournal.push(file);
    if(/(^|[^а-яёА-ЯЁ])(просто|очень|достаточно|уже|ведь)([^а-яё]|$)/i.test(body)) stopWords.push(file);
  }
  const problems=[];
  if(noJournal.length>baseline.withoutJournal) problems.push(`без журнала сверок: ${noJournal.length} против ${baseline.withoutJournal} в замере ${baseline.measuredAt}`);
  if(stopWords.length>baseline.withStopWords) problems.push(`со словами-паразитами: ${stopWords.length} против ${baseline.withStopWords} в замере ${baseline.measuredAt}`);
  return {noJournal,stopWords,problems};
}
