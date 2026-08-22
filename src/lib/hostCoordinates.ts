// Approximate coordinates for FIFA World Cup host countries, used only to
// place a decorative marker on HostMap.astro's schematic locator map - not a
// claim of precise cartographic or administrative accuracy. Each point is the
// well-known capital (or, for the two multi-country editions, a rough
// midpoint among the co-hosts) of the host exactly as written in
// content/fifa-world-cup.md's "Host(s)" column, since that string is already
// the atomic key buildHostsSummary()/the host filter group co-hosted
// editions under (see its own doc comment for why a co-host cell is never
// split). West Germany (1974) and Germany (2006) deliberately get distinct
// points - Bonn was the actual West German capital, not present-day Berlin -
// so the two eras don't collapse onto one marker on the map the way their
// title totals already do (by editorial choice) elsewhere on this site.
export type HostCoordinate = {
  lat: number;
  lon: number;
  /** Plain-language region used to group the map's accessible text list. */
  region: string;
};

// This file now holds one such coordinate table per team competition that
// has a host locator map: World Cup first (below), then EURO, UEFA Nations
// League and Copa América further down - each keyed by its own
// content/*.md's exact host-column text, following the same rules the World
// Cup table's own header comment above documents.
export const WORLD_CUP_HOST_COORDINATES: Record<string, HostCoordinate> = {
  Uruguay: { lat: -34.9, lon: -56.2, region: 'South America' },
  Italy: { lat: 41.9, lon: 12.5, region: 'Europe' },
  France: { lat: 48.9, lon: 2.3, region: 'Europe' },
  Brazil: { lat: -15.8, lon: -47.9, region: 'South America' },
  Switzerland: { lat: 46.8, lon: 8.2, region: 'Europe' },
  Sweden: { lat: 59.3, lon: 18.1, region: 'Europe' },
  Chile: { lat: -33.4, lon: -70.6, region: 'South America' },
  England: { lat: 51.5, lon: -0.1, region: 'Europe' },
  Mexico: { lat: 19.4, lon: -99.1, region: 'North America' },
  'West Germany': { lat: 50.7, lon: 7.1, region: 'Europe' },
  Argentina: { lat: -34.6, lon: -58.4, region: 'South America' },
  Spain: { lat: 40.4, lon: -3.7, region: 'Europe' },
  'United States': { lat: 39.8, lon: -98.6, region: 'North America' },
  'South Korea and Japan': { lat: 36.6, lon: 133.3, region: 'Asia' },
  Germany: { lat: 51.0, lon: 10.4, region: 'Europe' },
  'South Africa': { lat: -26.2, lon: 28.0, region: 'Africa' },
  Russia: { lat: 55.8, lon: 37.6, region: 'Europe' },
  Qatar: { lat: 25.3, lon: 51.5, region: 'Asia' },
  'Canada, Mexico and United States': { lat: 32.0, lon: -97.0, region: 'North America' },
};

/**
 * Fixed region display order for HostMap.astro's grouped text list - roughly
 * the order the World Cup first reached each region (1930 Uruguay, 1934
 * Italy, 1970 Mexico, 2002 Japan/South Korea, 2010 South Africa), not
 * alphabetical or population-ranked, so it reads as a simple story rather
 * than an arbitrary sort.
 */
export const HOST_REGION_ORDER = ['South America', 'Europe', 'North America', 'Asia', 'Africa'];

// Same "approximate marker, not a cartographic claim" policy as
// WORLD_CUP_HOST_COORDINATES above, keyed by content/uefa-euro.md's exact
// "Host(s)" cell text (14 distinct values, 1960-2024). Multi-country
// editions get the same "rough midpoint among the co-hosts" treatment
// (Belgium and Netherlands, Austria and Switzerland, Poland and Ukraine) as
// the World Cup table's own co-host entries. West Germany (pre-1990) reuses
// the exact Bonn point WORLD_CUP_HOST_COORDINATES already uses, for the same
// "distinct era, distinct marker" reasoning. The 2020 edition ("Eleven
// European cities" - Amsterdam, Baku, Bilbao, Bucharest, Budapest,
// Copenhagen, Glasgow, London, Munich, Rome, Saint Petersburg, no single
// host country at all) gets one symbolic marker at a rough geographic
// centroid of those eleven cities, rather than being excluded from the map -
// it is a real, single-row edition like any other, just spread across a
// continent instead of one country.
export const EURO_HOST_COORDINATES: Record<string, HostCoordinate> = {
  France: { lat: 48.9, lon: 2.3, region: 'Europe' },
  Spain: { lat: 40.4, lon: -3.7, region: 'Europe' },
  Italy: { lat: 41.9, lon: 12.5, region: 'Europe' },
  Belgium: { lat: 50.8, lon: 4.4, region: 'Europe' },
  Yugoslavia: { lat: 44.8, lon: 20.5, region: 'Europe' },
  'West Germany': { lat: 50.7, lon: 7.1, region: 'Europe' },
  Sweden: { lat: 59.3, lon: 18.1, region: 'Europe' },
  England: { lat: 51.5, lon: -0.1, region: 'Europe' },
  'Belgium and Netherlands': { lat: 51.6, lon: 4.65, region: 'Europe' },
  Portugal: { lat: 38.7, lon: -9.1, region: 'Europe' },
  'Austria and Switzerland': { lat: 47.55, lon: 11.9, region: 'Europe' },
  'Poland and Ukraine': { lat: 51.3, lon: 25.75, region: 'Europe' },
  'Eleven European cities': { lat: 48.0, lon: 15.0, region: 'Europe' },
  Germany: { lat: 51.0, lon: 10.4, region: 'Europe' },
};

// Keyed by content/uefa-nations-league.md's exact "Finals host" cell text (4
// distinct values so far, one per completed season) - every edition to date
// has had a single-country Finals host, so no co-host/multi-city case exists
// here yet. Reuses the exact same points as WORLD_CUP_HOST_COORDINATES/
// EURO_HOST_COORDINATES for the two countries that already appear there
// (Germany, Italy), for the same "one real-world place, one marker" reason
// those two tables reuse Spain/Sweden/etc. verbatim.
export const NATIONS_LEAGUE_HOST_COORDINATES: Record<string, HostCoordinate> = {
  Portugal: { lat: 38.7, lon: -9.1, region: 'Europe' },
  Italy: { lat: 41.9, lon: 12.5, region: 'Europe' },
  Netherlands: { lat: 52.4, lon: 4.9, region: 'Europe' },
  Germany: { lat: 51.0, lon: 10.4, region: 'Europe' },
};

// Keyed by content/copa-america.md's exact "Host / format" cell text (11
// distinct country values, 1916-2024). The three "Home-and-away" editions
// (1975, 1979, 1983) need no entry here at all - NOT_A_HOST already excludes
// them from buildHostsSummary()/buildHostMapPoints() before this table is
// ever consulted, the same exclusion the host filter and quiz host question
// already rely on. Reuses the exact same points as
// WORLD_CUP_HOST_COORDINATES for the countries that already appear there
// (Argentina, Brazil, Chile, United States, Uruguay).
export const COPA_AMERICA_HOST_COORDINATES: Record<string, HostCoordinate> = {
  Argentina: { lat: -34.6, lon: -58.4, region: 'South America' },
  Uruguay: { lat: -34.9, lon: -56.2, region: 'South America' },
  Brazil: { lat: -15.8, lon: -47.9, region: 'South America' },
  Chile: { lat: -33.4, lon: -70.6, region: 'South America' },
  Paraguay: { lat: -25.3, lon: -57.6, region: 'South America' },
  Peru: { lat: -12.0, lon: -77.0, region: 'South America' },
  Bolivia: { lat: -16.5, lon: -68.15, region: 'South America' },
  Ecuador: { lat: -0.2, lon: -78.5, region: 'South America' },
  Colombia: { lat: 4.7, lon: -74.1, region: 'South America' },
  'United States': { lat: 39.8, lon: -98.6, region: 'North America' },
  Venezuela: { lat: 10.5, lon: -66.9, region: 'South America' },
};

/** Region order for Copa América's map: South America dominates, United States (2016, 2024) is the one outlier. */
export const COPA_AMERICA_REGION_ORDER = ['South America', 'North America'];
