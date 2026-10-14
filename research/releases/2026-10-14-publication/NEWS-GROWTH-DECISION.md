# News product and editorial decision — 14 October 2026

The fixed daily five is cancelled by the owner's current request. A release contains all independently qualified useful stories; neither padding to a target nor deleting excess candidate files is allowed. Quality/source/licence/lifecycle/release gates remain mandatory. This package contains one NEW informational article, two NEW news, five substantive news revisions and eight review-date follow-ups. A revision does not count as NEW. Preparation is not publication.

## Selection that can be audited

`npm run news:attention` reads the public Google Trends Trending Now RSS for RU. It saves exact queries, observation time, trend beginning, the original traffic string and coverage links in a local run artifact. Successful feed retrieval does not mean zero demand for absent topics. Unavailable/stale/non-RU evidence is unknown. A match uses complete normalized tokens, so Goa does not match Iguazu. No monthly demand is invented from recent traffic. News inventory ranks important changes first, then verified recent interest, then editorial score; it preserves all files. Independent editorial scoring remains decisive.

The current signal is Шереметьево, observed14Oct10:53:32UTC with reported1000+ and beginning09:50UTC, corroborated by Aeroflot's own14Oct05:40MSK post. Restrictions are not asserted to remain in force all day. Banff has no established Russian surge; a useful primary-confirmed story does not require one. Aldabra was excluded as a duplicate of the live 8 October story. `news/selection/2026-10-14.json` records20distinct candidates and exact outcomes, including unavailable sources and incomplete primary qualification. It is not presented as20finished scientific investigations.

## Product and discovery

- The main news page prioritises significant stories published in the last7days. RSS and Dzen remain chronological. Old updates do not re-enter feeds by changing their original publication date.
- Three crawlable topic hubs connect entry/visa, transport/access and nature stories. Each page has at most30items, self canonical, visible links and pagination. Empty topics produce no thin page. All built topic/pagination pages are checked at402/768/1024/1280in CI.
- Related stories share the current story's country and favour its topic. The historical chronological fallback is labelled accordingly. No random story is called relevant or popular.
- A separate Google News sitemap includes only original added timestamps in the last48hours, at most1000URLs per shard. `checked` cannot recycle an old story into it. Empty XML remains valid. Root sitemap date uses the same selected front-page set.
- Existing large-image, NewsArticle identity and author patterns are preserved. These were already present; they are not claimed as newly invented features.

## Primary guidance

Read14Oct2026:

- [Google News sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap): recent publication window, original publication date and1000limit. The feature helps discovery; it does not guarantee indexing or news inclusion.
- [Google Discover](https://developers.google.com/search/docs/appearance/google-discover): timely helpful content and strong relevant images, no misleading curiosity gap; eligibility is not a traffic guarantee.
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article): clear article/author/date identity. Markup is not proof of rankings.
- [Google Trending Now](https://support.google.com/trends/answer/3076011?hl=en): recent regional query surges and export/RSS; coverage is a signal, not a substitute for the event primary.

## Evaluation and limits

Authenticated baseline was refreshed14Oct and saved locally with source/window/coverage. Compare complete7and28day cohorts at equal age, organic news section with and without its largest story, and onward visits to the relevant evergreen article. Keep Google and Yandex separate. Missing/suppressed rows are not assumed zero. Control for new publishing volume and external event demand; a before/after difference alone does not prove causality. No traffic/revenue uplift is claimed at release.

Before publication: early content/source checks and independent final review. Mixed code/data scope requires all26existing CI checks, followed by the exact production deploy and live checks of every affected route/type. No new paid runner, server, schedule or budget. Active routine prompts are synchronised with the same editorial decision; scheduling is unchanged.

The draft-only dated publication-preflight workflow was removed from the final diff. Exact committed-source checks run through the unchanged local publication hook; the existing26native CI gates remain mandatory. No duplicate source ZIP upload or branch-specific CI service is added.
