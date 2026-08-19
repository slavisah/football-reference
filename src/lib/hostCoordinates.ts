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
