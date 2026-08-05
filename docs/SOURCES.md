# Sources

Primary sources should be preferred.

## FIFA World Cup

- FIFA tournament history and champions:
  - https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1930-1978-uruguay-italy-germany-brazil-england-argentina
  - https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain
- FIFA 2026 awards:
  - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/award-winners
- FIFA historical top scorers:
  - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fontaine-mbappe-ronaldo-and-more-every-world-cup-top-scorer
- Final match dates audit (2026-08-02): the calendar date of each edition's
  decisive final match, used for the "On this day in football history" widget
  on the home page. Verified via WebSearch against each edition's dedicated
  Wikipedia "{year} FIFA World Cup final" article, cross-checked against
  ESPN's match archive; no discrepancies found across any of the 23 dates
  (1930-2026). 1950 has no single-match final in the knockout sense - the
  tournament was decided by a final round-robin group, and the Uruguay v
  Brazil match (16 July 1950) is the universally recognized de facto final,
  including by FIFA.com itself. 2026's date (19 July) is the scheduled final
  per the tournament calendar:
  - https://en.wikipedia.org/wiki/1930_FIFA_World_Cup_final
  - https://en.wikipedia.org/wiki/1966_FIFA_World_Cup_final
  - https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final
  - https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final
- Third/fourth-place audit (2026-08-04): the winner and loser of every
  edition's third-place play-off (or, where no such match was played, the
  historical ranking source for those two places), i.e. the content table's
  "Third"/"Fourth / other semifinalist" columns, for all 21 completed
  editions (1930-2022; 2026 is the site's own forward-looking scheduled
  entry and out of scope for a factual audit). Verified via WebSearch across
  three parallel passes (1930-1962, 1966-1994, 1998-2022), each edition
  cross-checked against at least two independent sources (ESPN's match
  archive/box scores, FIFA.com's official match pages, and other outlets
  surfaced by search - Wikinews, France24, CBS News, Sky Sports, etc.).
  **No discrepancies found in any edition's third/fourth-place teams.**
  1930 (no third-place match was played; FIFA's 1986 technical-committee
  retrospective ranking placed the United States third and Yugoslavia
  fourth) and 1950 (no separate match; Sweden and Spain's 3rd/4th positions
  come from the four-team final round-robin group table) were already
  documented as format edge cases in `content/fifa-world-cup.md`'s
  "Editorial notes" and are unchanged by this audit - both edge cases were
  independently reconfirmed rather than merely trusted:
  - https://www.espn.com/soccer/ (match archive, all editions with a played
    third-place match: 1934, 1938, 1954, 1958, 1962, 1966, 1970, 1974, 1978,
    1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022)
  - https://plus.fifa.com/ (official match pages, cross-check for 1970,
    1974, 1978, 1982, 1986, 1990)
  - https://www.athlet.org/ (third place game summaries, cross-check for
    1934, 1938, 1954, 1958, 1962)
  - 1930: FIFA 1986 technical-committee retrospective ranking, corroborated
    via beIN Sports and Liquisearch summaries (no separate match played)
  - 1950: final round-robin group table (Uruguay 5pts, Brazil 4pts, Sweden
    2pts, Spain 1pt), corroborated via two independent table summaries
- 2026 final result audit (2026-08-04, intensive run): the two prior FIFA
  World Cup audits above (final match dates, 2026-08-02; third/fourth-place,
  2026-08-04) both explicitly excluded the 2026 edition from their scope as
  "the scheduled/forward-looking final," reasoning that held when this
  routine's audit series began but had gone stale by the time either pass
  actually ran - the 2026 final was played 19 July 2026, over two weeks
  before the third/fourth-place audit's own 2026-08-04 run date, and the
  bronze match a day earlier. This run re-checked the full 2026 row in
  `content/fifa-world-cup.md` (host, teams, winner, runner-up, third,
  fourth, final score, final date) as a genuinely completed, independently
  verifiable tournament rather than skipping it again. Verified via
  WebSearch cross-checking FIFA.com's own final and bronze-match reports
  against ESPN's match archive, CBS News, Al Jazeera's live coverage, Fox
  News, and Yahoo Sports:
  - Winner/runner-up/final date (Spain, Argentina, 19 July 2026) and
    third/fourth (England beat France 6-4 in the bronze match, the highest-
    scoring third-place match in World Cup history) were already correct as
    authored.
  - **One discrepancy found and fixed:** the Final column read "Spain 1-0
    Argentina" with no extra-time marker; Ferran Torres actually settled it
    in the 106th minute of extra time (Argentina played the second half of
    extra time down a man after Enzo Fernández's second yellow card), the
    same shape as an extra-time final decided without penalties elsewhere in
    this table (e.g. 1966, 1978, 2010). Corrected to "Spain 1-0 Argentina
    (a.e.t.)" to match this table's own established notation.
  - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/spain-argentina-final-report-highlights
  - https://www.espn.com/soccer/match/_/gameId/760517/argentina-spain
  - https://www.cbsnews.com/news/2026-fifa-world-cup-final-spain-argentina-sunday/
  - https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/france-england-report-highlights-bronze-final
  - https://www.espn.com/soccer/match/_/gameId/760516/england-france
  - https://www.foxnews.com/sports/england-wins-thriller-ages-france-claim-third-2026-fifa-world-cup

  **Process note for future runs:** don't assume the current year's
  in-progress-looking edition is unplayed just because an earlier pass
  labeled it that way - check the actual current date against the edition's
  known calendar before excluding it from an audit's scope.
- Golden Boot (top-scorer) audit (2026-08-04, intensive run): the "FIFA
  World Cup top scorers" table in `content/golden-boot.md` - player name(s),
  team, and goal count for all 23 editions (1930-2026) - verified via three
  parallel WebSearch passes (1930-1966, 1970-2002, 2006-2026), each edition
  cross-checked against multiple independent outlets (ESPN, BBC, Sky Sports,
  Goal.com, FIFA.com, CBS Sports, Sports Illustrated). The 1962 six-way tie
  had every individual name and diacritic checked for completeness - all
  confirmed accurate. The 2026 row (Kylian Mbappé, France, 10 goals) got
  extra scrutiny as the newest, highest-risk entry on the page - confirmed
  by FIFA.com's own official award-winners page for the 2026 tournament
  (linked above) plus six further independent outlets, so it is not stale
  or fabricated data; Mbappé became the first player to win the World Cup
  Golden Boot twice (also 2022). **One discrepancy found and fixed:** the
  1950 row credited Ademir (Brazil) with 8 goals; the consensus figure
  across independent sources (Wikipedia, Goal.com, Sports Illustrated,
  OneFootball, worldcupranking.com) is **9 goals** - corrected in
  `content/golden-boot.md`. A minority of secondary listicles still show 7
  or 8, likely because Ademir's tally, like Oldřich Nejedlý's 1934 total and
  Leônidas's 1938 total (both already correct on this page per the same
  research), has been subject to historical recount/correction; 9 is the
  figure consistently used by modern independent sources. No other
  discrepancies found across the table's 23 rows.

## UEFA EURO

- UEFA history:
  - https://www.uefa.com/uefaeuro/history/
- UEFA winners:
  - https://www.uefa.com/uefaeuro/history/winners/
- UEFA finals:
  - https://www.uefa.com/uefaeuro/history/winners/finals/
- Final match dates audit (2026-08-02): the calendar date of each edition's
  final, for the same "On this day" widget. Verified via WebSearch, one
  Wikipedia final-match article per edition, cross-checked against UEFA.com/
  Transfermarkt match records where surfaced; no discrepancies found. 1968's
  final was drawn 1-1 on 8 June and decided by a replay on 10 June - the
  replay date is the one used. 2020's final was played in 2021 (postponed a
  year by the pandemic); the "Final date" column records the real 2021 date
  while the edition keeps its "2020" label, matching how the rest of the site
  already treats that edition:
  - https://en.wikipedia.org/wiki/1960_European_Nations%27_Cup_final
  - https://en.wikipedia.org/wiki/1964_European_Nations%27_Cup_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_1968_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_1980_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_1984_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_1988_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_1992_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2000_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2004_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2008_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2012_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2016_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2020_final
  - https://en.wikipedia.org/wiki/UEFA_Euro_2024_final
- Third-place play-off audit (2026-08-04): the winner, score, and date of the
  third-place match for each of the six editions (1960-1980) that played one
  under the old 4-team "final four" format, i.e. whether the content table's
  "Other semifinalist" (3rd) / "Other semifinalist / fourth" (4th) column
  order is correct. Verified via WebSearch, cross-checking UEFA.com's own
  match/history pages against a second source (eu-football.info, 11v11, or a
  contemporaneous match report) per edition; no discrepancies found across
  all six editions. 1980's play-off (Czechoslovakia beat host Italy) was
  drawn 1-1 after extra time and decided on penalties, 9-8:
  - https://www.uefa.com/uefaeuro/history/news/0253-0d7b30be097b-418a5f1636df-1000--third-place-consolation-for-czechoslovakia/
  - https://www.uefa.com/uefaeuro/match/3995--hungary-vs-denmark/
  - https://www.uefa.com/uefaeuro/history/news/0254-0d7b2e1adede-c896e22df928-1000--england-beat-soviet-union-to-win-euro-1968-third-place-pla/
  - https://www.uefa.com/uefaeuro/match/3837--hungary-vs-belgium/
  - https://www.uefa.com/uefaeuro/match/3692--netherlands-vs-yugoslavia/
  - https://www.uefa.com/uefaeuro/match/3584--czechoslovakia-vs-italy/
- Golden Boot (top-scorer) audit (2026-08-04, intensive run): the "UEFA EURO
  top scorers" table in `content/golden-boot.md` - player name(s), team, and
  goal count for all 16 editions (1960-2024) - verified via two parallel
  WebSearch passes (1960-1992, 1996-2024), each edition cross-checked
  against multiple independent outlets (UEFA.com, ESPN, BBC, Sky Sports,
  Goal.com, Transfermarkt). Every multi-way tie (1960's five-way tie, 1964's
  three-way tie, 1992's four-way tie, 2012's and 2024's six-way ties) had
  every individual name and diacritic checked for completeness and correct
  spelling - all confirmed accurate. **No discrepancies found** across the
  table's 16 rows. 2012's row is shown as a six-way tie at 3 goals each
  rather than crediting Fernando Torres alone, even though sources note he
  won UEFA's own tie-breaker (fewest minutes, plus an assist) - this matches
  the page's own stated methodology of showing joint leading scorers as
  tied with no single official winner, not a discrepancy in the data.

## UEFA Nations League

- UEFA official competition:
  - https://www.uefa.com/uefanationsleague/
- 2025 champion:
  - https://www.uefa.com/uefanationsleague/news/0297-1d5ccb0b6747-d10a8fc4eb86-1000--portugal-meet-the-nations-league-winners/
- Final match dates audit (2026-08-03): the calendar date of each edition's
  final, for the "On this day in football history" widget on the home page.
  Verified via WebSearch, one Wikipedia final-match article per edition,
  cross-checked against a second source (ESPN or UEFA.com) where available;
  no discrepancies found across all four dates (2019-2025):
  - https://en.wikipedia.org/wiki/2019_UEFA_Nations_League_final
  - https://www.espn.com/soccer/match/_/gameId/540881/netherlands-portugal
  - https://en.wikipedia.org/wiki/2021_UEFA_Nations_League_final
  - https://www.espn.com/soccer/match/_/gameId/589985/france-spain
  - https://en.wikipedia.org/wiki/2023_UEFA_Nations_League_final
  - https://www.espn.com/soccer/match/_/gameId/654361/spain-croatia
  - https://en.wikipedia.org/wiki/2025_UEFA_Nations_League_final
- Third-place match audit (2026-08-04): the winner, score, and date of each
  edition's third-place play-off, i.e. the content table's "Third"/"Fourth"
  columns. Verified via WebSearch, cross-checked against UEFA.com's own match
  report plus ESPN's box score for each edition; no discrepancies found
  across all four editions (2019-2025):
  - https://www.uefa.com/uefanationsleague/news/0253-0d821b962b73-720b41ee3a40-1000--england-beat-switzerland-on-penalties-in-nations-league-m/
  - https://www.espn.com/soccer/match/_/gameId/540882/england-switzerland
  - https://www.uefa.com/uefanationsleague/news/026e-137218f01734-bf182cc6c45c-1000--italy-2-1-belgium-azzurri-secure-third-place-at-nations-lea/
  - https://www.espn.com/soccer/match/_/gameId/589984
  - https://www.uefa.com/uefanationsleague/news/0282-18494807115a-60db6abfda87-1000--netherlands-2-3-italy-azzurri-claim-third-place-with-thr/
  - https://www.espn.com/soccer/match/_/gameId/654362/italy-netherlands
  - https://www.uefa.com/uefanationsleague/news/029a-1df3af7eedc9-c3b6e51cf3f1-1000--germany-vs-france-highlights-and-report-kylian-mbappe-sco/
  - https://www.espn.com/soccer/match/_/gameId/723737/france-germany
- Champion/Runner-up/Final-score second-source audit (2026-08-05): a second,
  independent cross-check of the Finals table's Winner, Runner-up, and Final
  score for all four completed editions, using sources distinct from the
  2026-08-04 UEFA.com/ESPN pair above (each edition's dedicated Wikipedia
  final article, plus CBS Sports, Al Jazeera, or Euronews); no discrepancies
  found:
  - https://en.wikipedia.org/wiki/2019_UEFA_Nations_League_final
  - https://www.cbssports.com/soccer/news/2019-uefa-nations-league-schedule-dates-tv-live-stream-start-times-netherlands-vs-portugal-in-final/
  - https://en.wikipedia.org/wiki/2021_UEFA_Nations_League_final
  - https://www.aljazeera.com/sports/2021/10/11/france-beat-spain-to-lift-nations-league-title
  - https://en.wikipedia.org/wiki/2023_UEFA_Nations_League_final
  - https://www.skysports.com/football/news/12904237/croatia-0-0-spain-4-5-on-penalties-dani-carvajal-converts-winning-penalty-as-la-roja-clinch-nations-league-glory
  - https://en.wikipedia.org/wiki/2025_UEFA_Nations_League_final
  - https://www.euronews.com/2025/06/09/portugal-beats-spain-to-win-the-nations-league

## Copa América

- CONMEBOL 2024 tournament history:
  - https://cdn.conmebol.com/wp-content/uploads/2024/12/LIBRO-GET-CONMEBOL-INGLES-04-12-24.pdf
- Format audit (2026-08-02): which editions were decided by a round-robin
  league table outright, which needed an extra playoff decider, and the
  home-and-away/knockout-final/centenary-edition eras. Wikipedia's per-edition
  articles for the five confirmed playoff years, cross-checked against RSSSF's
  historical tables:
  - https://en.wikipedia.org/wiki/1919_South_American_Championship_play-off
  - https://en.wikipedia.org/wiki/1922_South_American_Championship_play-off
  - https://en.wikipedia.org/wiki/1937_South_American_Championship_play-off
  - https://en.wikipedia.org/wiki/1949_South_American_Championship_play-off
  - https://en.wikipedia.org/wiki/1953_South_American_Championship_play-off
  - https://www.rsssf.org/tables/59-2sa.html (1959 Ecuador: won outright on
    points, no playoff)
  - https://en.wikipedia.org/wiki/1967_South_American_Championship (won
    outright on points, no playoff)
- Third/fourth-place audit (2026-08-02): the winner and loser of every
  discrete third-place match in the knockout-final era (1987, then 1993
  onward, including the 2016 centenary edition). Official recaps where
  available, match reports otherwise:
  - https://www.rsssf.org/tables/87sa.html (1987)
  - https://www.rsssf.org/tables/93sa-full.html (1993)
  - https://www.thescore.com/mls/news/1049826 (1995)
  - https://www.rsssf.org/tables/97sa.html (1997)
  - https://www.rsssf.org/tables/99safull.html (1999)
  - https://www.espn.com/soccer/match/_/gameId/10744/uruguay-honduras (2001)
  - https://www.espn.com/soccer/match/_/gameId/151953/colombia-uruguay (2004)
  - https://www.espn.com/soccer/match/_/gameId/221082/mexico-uruguay (2007)
  - https://www.espn.com/soccer/match/_/gameId/317559/venezuela-peru (2011)
  - https://www.espn.com/soccer/match/_/gameId/424358/paraguay-peru (2015)
  - https://www.espn.com/soccer/report/_/gameId/444697 (2016 centenary)
  - https://copaamerica.com/en/news/argentina-defeated-chile-2-1-to-win-third-place
    (2019)
  - https://copaamerica.com/en/news/colombia-score-in-the-final-minute-to-finish-in-3rd-place
    (2021)
  - https://copaamerica.com/en/news/highlights-uruguay-canada-third-place-penalties-copa-america-2024
    (2024)
- Third/fourth-place audit (2026-08-02), 1989 and 1991: both editions used a
  closing final round-robin group of four teams rather than a single
  third-place fixture, so third/fourth are read directly off that group's
  final standings:
  - https://en.wikipedia.org/wiki/1989_Copa_Am%C3%A9rica (final group: Brazil
    6pts, Uruguay 4pts, Argentina 1pt/GD 0-4, Paraguay 1pt/GD 0-6 - Argentina
    ahead of Paraguay on goal difference)
  - https://en.wikipedia.org/wiki/1991_Copa_Am%C3%A9rica (final group:
    Argentina 2W-1D, Brazil 2W-1L, Chile 2D-1L, Colombia 1D-2L)
- Third/fourth-place audit (2026-08-02), full pre-1975 league-table/
  final-playoff era (1916-1967, 29 editions): read off each edition's final
  standings table (points, then goal difference/average where points were
  level). Each year cross-checked against RSSSF's per-edition table page
  (`rsssf.org/tables/<yy>sa.html`) and that edition's Wikipedia article, plus
  an internal points-arithmetic consistency check:
  - https://www.rsssf.org/tables/16sa.html ; https://en.wikipedia.org/wiki/1916_South_American_Championship
  - https://en.wikipedia.org/wiki/1917_South_American_Championship
  - https://en.wikipedia.org/wiki/1919_South_American_Championship ; https://en.wikipedia.org/wiki/1919_South_American_Championship_play-off
  - https://en.wikipedia.org/wiki/1920_South_American_Championship
  - https://www.rsssf.org/tables/21sa.html ; https://en.wikipedia.org/wiki/1921_South_American_Championship
  - https://www.rsssf.org/tables/22sa.html ; https://en.wikipedia.org/wiki/1922_South_American_Championship ;
    https://en.wikipedia.org/wiki/1922_South_American_Championship_play-off
    (Uruguay tied on points and goal difference with Brazil/Paraguay but
    withdrew from the title playoff in protest at refereeing decisions,
    finishing third by elimination; Argentina, not level with the top
    three, finished fourth)
  - https://en.wikipedia.org/wiki/1923_South_American_Championship
  - https://en.wikipedia.org/wiki/1924_South_American_Championship
  - https://en.wikipedia.org/wiki/1925_South_American_Championship (only
    three entrants - Argentina, Brazil, Paraguay - so no fourth-place team
    ever existed)
  - https://en.wikipedia.org/wiki/1926_South_American_Championship
  - https://www.rsssf.org/tables/27sa.html ; https://en.wikipedia.org/wiki/1927_South_American_Championship
  - https://www.rsssf.org/tables/29sa.html ; https://en.wikipedia.org/wiki/1929_South_American_Championship
  - https://www.rsssf.org/tables/35sa.html ; https://en.wikipedia.org/wiki/1935_South_American_Championship
  - https://www.rsssf.org/tables/37sa.html ; https://en.wikipedia.org/wiki/1937_South_American_Championship
  - https://www.rsssf.org/tables/39sa.html ; https://en.wikipedia.org/wiki/1939_South_American_Championship
  - https://www.rsssf.org/tables/41sa.html ; https://en.wikipedia.org/wiki/1941_South_American_Championship
  - https://www.rsssf.org/tables/42sa.html ; https://en.wikipedia.org/wiki/1942_South_American_Championship
  - https://en.wikipedia.org/wiki/1945_South_American_Championship
  - https://www.rsssf.org/tables/46sa.html ; https://en.wikipedia.org/wiki/1946_South_American_Championship
  - https://www.rsssf.org/tables/47sa.html ; https://en.wikipedia.org/wiki/1947_South_American_Championship
  - https://www.rsssf.org/tabless/sachampfull.html ; https://en.wikipedia.org/wiki/1949_South_American_Championship
  - https://www.rsssf.org/tables/53sa.html ; https://en.wikipedia.org/wiki/1953_South_American_Championship
  - https://www.rsssf.org/tables/55sa.html ; https://en.wikipedia.org/wiki/1955_South_American_Championship
  - https://www.rsssf.org/tables/56sa.html ; https://en.wikipedia.org/wiki/1956_South_American_Championship
  - https://www.rsssf.org/tables/57sa.html ; https://en.wikipedia.org/wiki/1957_South_American_Championship
  - https://www.rsssf.org/tables/59-1sa.html ; https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina)
  - https://www.rsssf.org/tables/59-2sa.html ; https://en.wikipedia.org/wiki/1959_South_American_Championship_(Ecuador)
  - https://www.rsssf.org/tables/63sa.html ; https://en.wikipedia.org/wiki/1963_South_American_Championship
  - https://www.rsssf.org/tables/67sa.html ; https://en.wikipedia.org/wiki/1967_South_American_Championship
  - Note: this session's outbound network policy returned HTTP 403 on direct
    fetches of both rsssf.org and en.wikipedia.org pages, so every citation
    above was verified through search-result snippets of those exact pages
    (which quote the underlying tables/infoboxes directly) rather than a
    direct page load, with each edition checked against at least two
    independent queries; a small number (1917, 1920, 1926, 1945) had a
    clearly stated final ranking but no full numeric points table
    recoverable this way.
- Final match dates audit (2026-08-03): the calendar date of the decisive
  match for the 19 editions with a single one-off decider, for the "On this
  day in football history" widget on the home page (same feature already
  covering the FIFA World Cup and UEFA EURO). The League-table era (no
  single title match) and the three Home-and-away finals (two dated legs,
  no single date to pick) are left as "—" in the content file rather than
  guessed at; see the "Final date" note in `content/copa-america.md`'s
  "Important editorial warning" section for why. Verified via WebSearch,
  each edition's dedicated Wikipedia final/play-off article cross-checked
  against a second source (RSSSF, ESPN's match archive, Transfermarkt,
  11v11, or copaamerica.com's official recap) where available:
  - https://en.wikipedia.org/wiki/1919_South_American_Championship_play-off
    (29 May 1919)
  - https://en.wikipedia.org/wiki/1922_South_American_Championship_play-off
    (6 November 1922 - confirmed only by this single Wikipedia article; a
    second independent source giving the day-level date was not found, only
    RSSSF's tournament-range snippet, which is consistent but not
    conclusive on its own)
  - https://en.wikipedia.org/wiki/1937_South_American_Championship_play-off
    (1 February 1937)
  - https://en.wikipedia.org/wiki/1949_South_American_Championship_play-off
    (11 May 1949)
  - https://en.wikipedia.org/wiki/1953_South_American_Championship_play-off
    (1 April 1953; RSSSF: "PLAYOFF FOR THE COPA AMERICA Lima, April 1,
    1953. Paraguay 3-2 Brazil")
  - https://en.wikipedia.org/wiki/1987_Copa_Am%C3%A9rica_final (12 July 1987)
  - https://en.wikipedia.org/wiki/1993_Copa_Am%C3%A9rica_final (4 July 1993)
  - https://en.wikipedia.org/wiki/1995_Copa_Am%C3%A9rica_final (23 July 1995)
  - https://en.wikipedia.org/wiki/1997_Copa_Am%C3%A9rica_final (29 June 1997)
  - https://en.wikipedia.org/wiki/1999_Copa_Am%C3%A9rica_final (18 July
    1999; footballdatabase.eu gives an outlier 17 July, against three
    independent sources agreeing on 18 July)
  - https://en.wikipedia.org/wiki/2001_Copa_Am%C3%A9rica_final (29 July 2001)
  - https://en.wikipedia.org/wiki/2004_Copa_Am%C3%A9rica_final (25 July 2004)
  - https://en.wikipedia.org/wiki/2007_Copa_Am%C3%A9rica_final (15 July 2007)
  - https://en.wikipedia.org/wiki/2011_Copa_Am%C3%A9rica_final (24 July 2011)
  - https://en.wikipedia.org/wiki/2015_Copa_Am%C3%A9rica_final (4 July 2015)
  - https://en.wikipedia.org/wiki/Copa_Am%C3%A9rica_Centenario_final (26 June
    2016)
  - https://en.wikipedia.org/wiki/2019_Copa_Am%C3%A9rica_final (7 July 2019)
  - https://en.wikipedia.org/wiki/2021_Copa_Am%C3%A9rica_final (10 July 2021;
    some regional ESPN pages show 11 July due to timezone display - the US
    ESPN page and copaamerica.com's own recap agree on 10 July)
  - https://en.wikipedia.org/wiki/2024_Copa_Am%C3%A9rica_final (14 July 2024)
- Champion/Runner-up audit (2026-08-05): every edition's Champion and
  Runner-up, 1916 through 2024 (49 editions), cross-checked against each
  edition's dedicated Wikipedia article and at least one of RSSSF, CONMEBOL's
  own recap articles, or another independent outlet (ESPN, Bleacher Report,
  Fox Sports). No discrepancies found - every value already matched. Per the
  network-access note above, verified through WebSearch result snippets
  rather than direct page loads:
  - https://en.wikipedia.org/wiki/1916_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1917_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1919_South_American_Championship_play-off (Brazil/Uruguay)
  - https://en.wikipedia.org/wiki/1920_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1921_South_American_Championship (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1922_South_American_Championship_play-off (Brazil/Paraguay)
  - https://en.wikipedia.org/wiki/1923_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1924_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1925_South_American_Championship (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1926_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1927_South_American_Championship (Argentina/Uruguay)
  - https://en.wikipedia.org/wiki/1929_South_American_Championship (Argentina/Paraguay)
  - https://www.rsssf.org/tables/35sa.html ; https://en.wikipedia.org/wiki/1935_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1937_South_American_Championship_play-off (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1939_South_American_Championship (Peru/Uruguay)
  - https://www.rsssf.org/tables/41sa.html ; https://en.wikipedia.org/wiki/1941_South_American_Championship (Argentina/Uruguay)
  - https://en.wikipedia.org/wiki/1942_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1945_South_American_Championship (Argentina/Brazil)
  - https://www.rsssf.org/tables/46sa.html ; https://en.wikipedia.org/wiki/1946_South_American_Championship (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1947_South_American_Championship (Argentina/Paraguay)
  - https://en.wikipedia.org/wiki/1949_South_American_Championship_play-off (Brazil/Paraguay)
  - https://en.wikipedia.org/wiki/1953_South_American_Championship_play-off (Paraguay/Brazil)
  - https://en.wikipedia.org/wiki/1955_South_American_Championship (Argentina/Chile)
  - https://en.wikipedia.org/wiki/1957_South_American_Championship (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1959_South_American_Championship_(Argentina) (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1959_South_American_Championship_(Ecuador) (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1963_South_American_Championship (Bolivia/Paraguay)
  - https://en.wikipedia.org/wiki/1967_South_American_Championship (Uruguay/Argentina)
  - https://en.wikipedia.org/wiki/1975_Copa_Am%C3%A9rica_final (Peru/Colombia)
  - https://en.wikipedia.org/wiki/1979_Copa_Am%C3%A9rica_final (Paraguay/Chile)
  - https://en.wikipedia.org/wiki/1983_Copa_Am%C3%A9rica_final (Uruguay/Brazil)
  - https://en.wikipedia.org/wiki/1987_Copa_Am%C3%A9rica_final (Uruguay/Chile)
  - https://en.wikipedia.org/wiki/1989_Copa_Am%C3%A9rica (Brazil/Uruguay)
  - https://en.wikipedia.org/wiki/1991_Copa_Am%C3%A9rica (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/1993_Copa_Am%C3%A9rica_final (Argentina/Mexico)
  - https://en.wikipedia.org/wiki/1995_Copa_Am%C3%A9rica_final (Uruguay/Brazil, penalties)
  - https://en.wikipedia.org/wiki/1997_Copa_Am%C3%A9rica_final (Brazil/Bolivia)
  - https://en.wikipedia.org/wiki/1999_Copa_Am%C3%A9rica_final (Brazil/Uruguay)
  - https://en.wikipedia.org/wiki/2001_Copa_Am%C3%A9rica (Colombia/Mexico)
  - https://en.wikipedia.org/wiki/2004_Copa_Am%C3%A9rica_final (Brazil/Argentina, penalties)
  - https://en.wikipedia.org/wiki/2007_Copa_Am%C3%A9rica_final (Brazil/Argentina)
  - https://en.wikipedia.org/wiki/2011_Copa_Am%C3%A9rica_final (Uruguay/Paraguay)
  - https://en.wikipedia.org/wiki/2015_Copa_Am%C3%A9rica_final (Chile/Argentina, penalties)
  - https://en.wikipedia.org/wiki/Copa_Am%C3%A9rica_Centenario_final (Chile/Argentina, penalties)
  - https://en.wikipedia.org/wiki/2019_Copa_Am%C3%A9rica_final (Brazil/Peru)
  - https://en.wikipedia.org/wiki/2021_Copa_Am%C3%A9rica_final (Argentina/Brazil)
  - https://en.wikipedia.org/wiki/2024_Copa_Am%C3%A9rica_final (Argentina/Colombia)

## Ballon d'Or

- Official winners and rankings:
  - https://ballondor.com/all-rankings
- Official homepage:
  - https://ballondor.com/
- Ceremony dates audit (2026-08-03, intensive run): the calendar date each
  year's winner was announced/awarded, for the "On this day in football
  history" widget on the home page (same feature already covering the four
  team competitions). Researched via three parallel WebSearch passes
  (1956-1991, 1992-2009, 2010-2025) cross-checking each year's dedicated
  Wikipedia "{year} Ballon d'Or"/"{year} FIFA Ballon d'Or" article against a
  second independent source per year where one could be found (France
  Football magazine issue numbers/cover-date listings, contemporaneous news
  archives - France24, CNN, TIME, NPR, UEFA.com - and, for the pre-1992
  years, a check that every date falls on a Tuesday, France Football's known
  weekly publication day in that era). Direct WebFetch access to Wikipedia
  and similar hosts was blocked by this environment's egress policy for
  every year, so all findings come from WebSearch-summarized results rather
  than a directly-fetched primary source - noted here for a future pass with
  different network access to re-verify against. Two years have a genuine
  source conflict, resolved in favor of the date consistent with the
  Tuesday-publication check: **1965** (28 December, vs. 27 December implied
  by one club retrospective) and **1973** (25 December, vs. 31 December from
  one other source). Six further years rest on a single corroborating source
  rather than two independent ones despite a real search effort for a
  second: 1976, 1978, 1984, 1986 (each Wikipedia-only) and 2005 (the year
  the ceremony first moved from December to late November, confirmed by
  Wikipedia and secondary retrospectives but no same-day news archive
  found). The 2010-2015 "FIFA Ballon d'Or" era ceremonies were each held in
  January of the year after the award-year label (e.g. the "2010" award was
  presented 10 January 2011 in Zurich) - the content file's Year column
  keeps the award-year label throughout, matching every other column, while
  the Ceremony date cell records the real calendar date, the same treatment
  already given to UEFA EURO 2020's postponed final. See
  `content/ballon-dor.md`'s "Important editorial note" section for the full
  explanation. 2020 has no ceremony date (the award was not held that year)
  - a permanent "—", not a research gap.
- Winners and national-team audit (2026-08-04, intensive run): every one of
  the 69 awarded editions' Winner and National team cells (1956-2025,
  excluding the cancelled 2020 award), verified via four parallel WebSearch
  passes split by era (1956-1973, 1974-1991, 1992-2009, 2010-2025), each
  cross-checking multiple independent sources per year (ESPN, Sky Sports,
  BBC, Goal.com, UEFA.com, France Football retrospectives, and Wikipedia
  search snippets - no direct WebFetch, same network-policy constraint as
  the ceremony-dates audit above). Specifically re-checked the two
  nationality-naturalization cases most likely to hide an error - 1960 Luis
  Suárez (Spanish-born, correctly attributed to Spain) and 1961 Omar Sívori
  (Argentine-born, naturalized Italian and playing for Italy by 1961,
  correctly attributed to Italy, not Argentina) - and the 2020 "Not
  awarded" placeholder (confirmed cancelled by France Football due to
  COVID-19 disrupting the football calendar, not a data-entry gap). Also
  spot-checked the "Multiple winners through 2025" summary table's two
  largest totals (Messi 8, Cristiano Ronaldo 5) against the same sources.
  **No discrepancies found** across any of the 69 rows or either total.
- Second-source follow-up for single-sourced ceremony dates (2026-08-04,
  intensive run): the 2026-08-03 ceremony-dates audit above left five years
  (1976, 1978, 1984, 1986, 2005) resting on a single corroborating source
  despite a real search effort for a second. This run specifically targeted
  a second independent source for each via WebSearch:
  - 1976 (28 December, Beckenbauer): corroborated by RSSSF
    (`rsssf.org/miscellaneous/europa-poy76.html`), independent of Wikipedia.
    Falls on a Tuesday, consistent with France Football's known weekly
    publication day that era.
  - 1978 (27 December, Keegan): corroborated by the official Ballon d'Or
    social accounts and contemporaneous retrospectives (Yorkshire Post).
    Falls on a **Wednesday**, not the usual Tuesday - a genuine exception to
    the Tuesday-publication heuristic this audit series has otherwise relied
    on, but every independent source agrees on the date regardless, so it is
    correct as authored. Flagged so a future conflict resolution does not
    treat the Tuesday pattern as decisive on its own.
  - 1984 (25 December, Platini): corroborated by RSSSF
    (`rsssf.org/miscellaneous/europa-poy84.html`). Falls on a Tuesday
    (Christmas Day that year).
  - 1986 (30 December, Belanov): corroborated by RSSSF
    (`rsssf.org/miscellaneous/europa-poy86.html`) and France Football's own
    Facebook announcement. **Resolved a genuine conflict** found during this
    same search: Dynamo Kyiv's own site (dynamo.kiev.ua) states Belanov won
    on 29 December 1986. 30 December 1986 was a Tuesday; 29 December 1986
    was a Monday - the Tuesday-publication pattern, plus RSSSF and France
    Football's own account, favor 30 December as already authored.
  - 2005 (28 November, Ronaldinho): corroborated by Sky Sports
    (`skysports.com/football/news/2355861/ronaldinho-scoops-ballon-dor`) and
    multiple further independent outlets, all agreeing on 28 November in
    Paris.
  **No date changes needed** - every one of the five years is confirmed as
  already authored, now each with a genuine second independent source. Same
  network-policy constraint as the other Ballon d'Or audits (WebSearch only,
  no direct WebFetch to Wikipedia/RSSSF).

## Review policy

1. Check primary sources first.
2. Use reputable secondary sources only to fill gaps.
3. Record ambiguous historical decisions in editorial notes.
4. Update `lastReviewed`.
5. Do not silently rewrite past team names.
