/**
 * Every mountain-station upstream, as a fixed URL with its own read cap.
 *
 * Fixed because nothing a visitor sends reaches these: the route takes no
 * destination parameter, so the proxy cannot be pointed anywhere. The only
 * query value assembled at runtime is GeoSphere's `station_ids`, and that is
 * built from GeoSphere's own metadata response, not from a request.
 *
 * Caps are measured against the real payloads, with headroom:
 *
 *   SLF measurements    ~3.2 MB   (~9,500 rows, the whole rolling window)
 *   SLF stations        ~31 KB
 *   SwissMetNet meta    ~153 KB
 *   SwissMetNet VQHA80  ~16 KB
 *   TAWES metadata      ~87 KB
 *   TAWES observations  ~210 KB
 *   ECCC stations       ~39 KB    (three provinces, trimmed properties)
 *   ECCC observations   ~1.9 MB   (~5,300 features, a 65-minute window)
 */

const KIB = 1024;
const MIB = 1024 * KIB;

/** Upstream wait ceiling. The SLF measurement payload is the slow one. */
export const UPSTREAM_TIMEOUT_MS = 25_000;

/**
 * Networks that need longer than the ceiling above, and why.
 *
 * SNOTEL is not one payload but about seven, because AWDB caps a request at
 * 1000 station elements. Measured against the live API, the whole network
 * takes roughly 30 seconds whether the station lists are cached or not: the
 * data endpoint itself is slow, not the metadata. Raising the shared ceiling
 * to suit it would let a genuinely stuck European upstream hold a request for
 * twice as long as it should, so the budget is per network.
 *
 * Only the FIRST request after a cold start waits this long. After that the
 * cache answers, and a failure serves the last payload rather than blocking.
 */
export const UPSTREAM_TIMEOUT_OVERRIDES_MS = Object.freeze({
  'usda-snotel': 60_000,
});

/** The wait ceiling for one network. */
export function upstreamTimeoutMs(networkId) {
  return UPSTREAM_TIMEOUT_OVERRIDES_MS[networkId] ?? UPSTREAM_TIMEOUT_MS;
}

/**
 * Refresh windows.
 *
 * Station metadata is identity, not weather: names, cantons, altitudes and
 * positions change when a network is re-surveyed, so it is held for a day.
 */
export const OBSERVATION_CACHE_MS = 5 * 60 * 1000;
export const METADATA_CACHE_MS = 24 * 60 * 60 * 1000;

/**
 * One network's refresh window: half its publication cadence, at least the
 * floor above.
 *
 * A re-read inside a cadence cannot return a reading the network has not
 * published yet. SLF publishes every 30 minutes and its measurement payload is
 * ~3 MB, so the flat floor spent five of every six reads re-fetching bytes SLF
 * had not changed. Half a cadence stays well inside one publication, so no
 * reading waits a whole cycle, and it leaves the ten-minute networks on the
 * floor they already used.
 */
export function observationCacheMs(cadenceMinutes) {
  const half = (Number(cadenceMinutes) / 2) * 60 * 1000;
  return Number.isFinite(half) && half > OBSERVATION_CACHE_MS
    ? half
    : OBSERVATION_CACHE_MS;
}

/**
 * How stale a cached payload may be and still be worth serving.
 *
 * A mountain-station map a few hours old beats an empty one, and the response
 * says it is cached. Past this the layer is better off reporting nothing.
 */
export const MAX_SERVE_STALE_MS = 12 * 60 * 60 * 1000;

export const SLF_STATIONS_URL =
  'https://measurement-api.slf.ch/public/api/imis/stations';
export const SLF_MEASUREMENTS_URL =
  'https://measurement-api.slf.ch/public/api/imis/measurements';
export const SLF_STATIONS_MAX_BYTES = 2 * MIB;
export const SLF_MEASUREMENTS_MAX_BYTES = 24 * MIB;

export const SMN_METADATA_URL =
  'https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/ogd-smn_meta_stations.csv';
export const SMN_OBSERVATIONS_URL =
  'https://data.geo.admin.ch/ch.meteoschweiz.messwerte-aktuell/VQHA80.csv';
export const SMN_METADATA_MAX_BYTES = 4 * MIB;
export const SMN_OBSERVATIONS_MAX_BYTES = 2 * MIB;

/**
 * The metadata file is ISO-8859-1, not UTF-8.
 *
 * `response.text()` assumes UTF-8 and mangles Oberägeri, Bière, Lötschental
 * and Château-d'Oex, so these bytes are read as bytes and decoded explicitly.
 */
export const SMN_METADATA_ENCODING = 'iso-8859-1';

export const TAWES_DATASET =
  'https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min';
export const TAWES_METADATA_URL = `${TAWES_DATASET}/metadata`;
export const TAWES_METADATA_MAX_BYTES = 4 * MIB;
export const TAWES_OBSERVATIONS_MAX_BYTES = 8 * MIB;

export const SNOTEL_BASE =
  'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1';
export const SNOTEL_STATIONS_MAX_BYTES = 4 * MIB;
export const SNOTEL_DATA_MAX_BYTES = 8 * MIB;

/**
 * The states SNOTEL covers.
 *
 * The station lists are read one state at a time, because that is what the
 * API's wildcard triplet understands and it keeps each list small enough to
 * cache. READINGS are not read this way: see `snotelDataUrl`.
 *
 * Fixed rather than discovered, like every other URL here: a state list is
 * identity, it changes when a state joins the network, and discovering it
 * would mean an extra round trip to learn something that has not changed in
 * years.
 */
/**
 * Stations per data request.
 *
 * AWDB refuses a request over 1000 station ELEMENTS, returned as a plain 400.
 * Five elements per station puts the ceiling at 200, and 150 leaves room for a
 * sixth element without re-tuning this.
 */
export const SNOTEL_STATIONS_PER_REQUEST = 150;

export const SNOTEL_STATES = Object.freeze([
  'AK',
  'AZ',
  'CA',
  'CO',
  'ID',
  'MT',
  'NM',
  'NV',
  'OR',
  'SD',
  'UT',
  'WA',
  'WY',
]);

/**
 * Stations per observation request.
 *
 * GeoSphere requires an explicit id list and the whole active network is about
 * 286 ids, roughly 1.8 KB of query string. Chunking keeps the URL well inside
 * any proxy's line limit and bounds the damage if the network grows.
 */
export const TAWES_STATIONS_PER_REQUEST = 150;

export const ECCC_COLLECTIONS = 'https://api.weather.gc.ca/collections';
export const ECCC_STATIONS_MAX_BYTES = 4 * MIB;
export const ECCC_OBSERVATIONS_MAX_BYTES = 8 * MIB;

/**
 * How far back the observation window reaches.
 *
 * `swob-realtime` is a thirty-day archive of 13.9 million observation files,
 * so the window is the only thing standing between this and an unbounded read.
 * It has to clear an hour: about ninety of the stations publish every minute
 * but the rest publish once an hour, on the hour, and a shorter window drops
 * them. Measured live, 15 minutes returned 81 stations and 65 minutes
 * returned 143 of the 160 in scope.
 */
export const ECCC_OBSERVATION_WINDOW_MS = 65 * 60 * 1000;

/**
 * Features per observation request, with the newest first.
 *
 * The window is about 5,300 features because the minute-cadence sites publish
 * sixty times an hour, and the cap is set above that rather than at it. The
 * request sorts by `-date_tm-value` so that if the network ever outgrows the
 * cap the response loses its OLDEST features, which are duplicate readings
 * from stations already in hand, instead of the newest ones the layer draws.
 */
export const ECCC_OBSERVATION_LIMIT = 10_000;

/**
 * Stations per station request.
 *
 * One request per province returns 92, 54 and 14 rows, so this is headroom
 * rather than a working limit. A province list cannot be paginated silently:
 * the fetcher compares `numberMatched` against what arrived.
 */
export const ECCC_STATION_LIMIT = 1000;

/**
 * The observation bounding box: the Canadian Cordillera.
 *
 * `swob-realtime` publishes no province on an MSC observation — `prov-value`
 * exists, but only partner networks populate it — so the readings cannot be
 * filtered the way the station lists are. This box covers British Columbia,
 * Alberta and Yukon, whose stations span 140.85 W to 110.21 W and 48.30 N to
 * 69.16 N. Readings it catches outside those three provinces have no station
 * to join to and are dropped.
 */
export const ECCC_BBOX = Object.freeze([-141, 48, -110, 70]);
