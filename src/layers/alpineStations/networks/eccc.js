/**
 * ECCC SWOB adapter — the Canadian Cordillera.
 *
 * Environment and Climate Change Canada publishes surface weather
 * observations through MSC GeoMet's OGC API as two collections:
 * `swob-stations` is identity and `swob-realtime` is the readings. Keyless,
 * and licensed under the Environment and Climate Change Canada Data Services
 * End-use Licence (version 2.1.1), which grants a worldwide, royalty-free,
 * perpetual licence to copy, publish and distribute the Information,
 * commercial use included, on the condition that the source is acknowledged.
 *
 * Measures arrive METRIC, unlike SNOTEL: `air_temp` in °C, `snw_dpth` in cm,
 * `rel_hum` in %, precipitation in mm. Only wind converts, from km/h to m/s.
 *
 * **Scope: British Columbia, Alberta and Yukon, and MSC's own stations.**
 *
 * The province filter is what keeps this a mountain layer. SWOB is a national
 * network of 938 stations and most of them are prairie, Shield and Arctic
 * sites with no mountain anywhere near them; the three in scope are the
 * Cordillera, and every station the layer draws is in or beside a range. It is
 * the same shape as SNOTEL's thirteen western states.
 *
 * The provider filter is the licence. SWOB also relays 343 NAV CANADA and 9
 * DND stations, and clause 4 of the licence grants no right to use "third
 * party rights that the Information Provider ... is not authorized to
 * licence". ECCC does not say which third parties it may license, so the
 * network is restricted to the stations ECCC operates, where the grant is not
 * in question. The dropped stations are aerodrome AWOS sites: almost all are
 * below 1,000 m and none of them publishes snow depth.
 *
 * Names are relayed exactly as MSC publishes them, in capitals. Title-casing
 * them would sit better beside the mixed-case Alpine names, but MSC uses
 * suffixes as codes and every rule mangles them: CS, RCS, AUT and INT'L all
 * become words.
 *
 * Three things about this feed cost time, and all three are encoded below.
 *
 * **`swob-realtime` is an archive, not current state.** It holds 13.9 million
 * items, one per observation file over about thirty days, and paginating it is
 * hopeless. A `datetime=<iso>/..` filter is the way in, and something still
 * has to reduce the window to the newest observation per station, which is
 * what `latestEcccObservations` does.
 *
 * **The network publishes at two cadences.** About ninety stations publish
 * every minute and the rest once an hour, on the hour, so a window shorter
 * than an hour silently loses half the network. Measured live: a 15-minute
 * window returned 81 stations and a 65-minute window returned 143.
 *
 * **The hourly stations carry no snow depth and no interval precipitation.**
 * Measured live, `snw_dpth` was present at 61 of 71 minute-cadence stations
 * and at 0 of 72 hourly ones, and `pcpn_amt_pst10mts` at 67 and 0. Those
 * columns stay absent rather than becoming zero, which is the layer's own
 * rule: a station without a sensor leaves the column empty.
 *
 * `pcpn_amt_pst1hr` is read by nothing here even though it is published more
 * widely, because it is an HOUR's accumulation and the layer's precipitation
 * view is labelled `mm/10min` and scaled to it. Putting an hour of rain on
 * that scale is the SNOTEL `PREC` mistake in a milder form, so Canada
 * publishes the ten-minute depth or nothing.
 */

import { ECCC_NETWORK_ID } from '../networks.js';
import { finiteOrNull, textOrNull } from '../records.js';

/**
 * The regions in scope, and the code the card prints.
 *
 * `province_territory` holds the full name, not a code: filtering on 'BC'
 * matched nothing and reported an empty network rather than failing.
 */
export const ECCC_REGION_CODES = Object.freeze({
  'British Columbia': 'BC',
  Alberta: 'AB',
  Yukon: 'YT',
});

/** The provinces to request, one station call each. */
export const ECCC_PROVINCES = Object.freeze(Object.keys(ECCC_REGION_CODES));

/** The only `data_provider` whose stations this network draws. */
export const ECCC_DATA_PROVIDER = 'MSC';

/**
 * The measures requested, and the canonical field each becomes.
 *
 * `10m` is the SENSOR HEIGHT and `pst10mts` is the INTERVAL, which is two
 * different tens in one key: `avg_wnd_spd_10m_pst10mts` is the ten-minute mean
 * wind at ten metres, the WMO reporting interval SwissMetNet and TAWES also
 * publish, so the three are directly comparable.
 */
export const ECCC_OBSERVATION_FIELDS = Object.freeze({
  air_temp: 'airTempC',
  snw_dpth: 'snowDepthCm',
  rel_hum: 'humidityPct',
  pcpn_amt_pst10mts: 'precipMm',
  avg_wnd_spd_10m_pst10mts: 'windSpeedMs',
  max_wnd_spd_10m_pst10mts: 'windGustMs',
  avg_wnd_dir_10m_pst10mts: 'windDirDeg',
});

/** The measures published in km/h, and nothing else in this feed is imperial. */
const ECCC_WIND_SPEED_KEYS = Object.freeze([
  'avg_wnd_spd_10m_pst10mts',
  'max_wnd_spd_10m_pst10mts',
]);

/** Identity properties the join needs beside the measures. */
export const ECCC_IDENTITY_PROPERTIES = Object.freeze([
  'msc_id-value',
  'date_tm-value',
]);

/**
 * The `properties=` value for the observation call.
 *
 * Asking for the columns actually read is not a micro-optimization: a SWOB
 * feature carries 226 properties, and the untrimmed window is 83 KB for ten
 * features against 1.9 MB for five thousand.
 */
export const ECCC_OBSERVATION_QUERY = [
  ...ECCC_IDENTITY_PROPERTIES,
  ...Object.keys(ECCC_OBSERVATION_FIELDS),
].join(',');

/** The `properties=` value for a station call. */
export const ECCC_STATION_QUERY = [
  'msc_id',
  'name',
  'province_territory',
  'data_provider',
].join(',');

const KMH_TO_MS = 1 / 3.6;

/** Kilometres per hour to metres per second, keeping a measured zero zero. */
export function kmhToMs(value) {
  const kmh = finiteOrNull(value);
  return kmh === null ? null : kmh * KMH_TO_MS;
}

/** The two-letter code for a province in scope, or null for one that is not. */
export function ecccRegionCode(province) {
  const name = textOrNull(province);
  return (name && ECCC_REGION_CODES[name]) || null;
}

/**
 * Normalize one `swob-stations` feature, or null when it is out of scope.
 *
 * The province and provider filters are asked for upstream and applied again
 * here: the query parameters are the fast path, and this is the one that
 * decides what the layer draws. Elevation arrives free, as the third ordinate
 * of the point.
 */
export function normalizeEcccStation(feature) {
  const properties = feature?.properties;
  const code = textOrNull(properties?.msc_id);
  if (!code) return null;
  if (textOrNull(properties?.data_provider) !== ECCC_DATA_PROVIDER) return null;
  const region = ecccRegionCode(properties?.province_territory);
  if (!region) return null;
  const coordinates = Array.isArray(feature?.geometry?.coordinates)
    ? feature.geometry.coordinates
    : [];
  return {
    networkId: ECCC_NETWORK_ID,
    code,
    label: textOrNull(properties?.name) || code,
    lat: finiteOrNull(coordinates[1]),
    lon: finiteOrNull(coordinates[0]),
    elevationM: finiteOrNull(coordinates[2]),
    region,
    country: 'CA',
  };
}

/**
 * How far back a column may be filled from an earlier observation.
 *
 * One averaging window. Every measure read here is either instantaneous or an
 * average over the past ten minutes, so a value from inside the last ten
 * minutes describes the same interval the newest observation does; a value
 * from outside it is a different measurement and stays absent. See
 * `ecccReadings` for why anything needs filling at all.
 */
export const ECCC_BACKFILL_MS = 10 * 60 * 1000;

/**
 * Every observation in the window per station, newest first, by `msc_id`.
 *
 * The window holds each observation file published since its start, which is
 * about 5,300 features for 160 stations because the minute-cadence sites
 * publish sixty times an hour. They are kept rather than reduced to the newest
 * here, because a single file can be missing a column the one before it
 * carries.
 *
 * Partner-network observations (Parks Canada, Yukon, municipal) arrive in the
 * same bbox and are kept here, then dropped by the join: they have no entry in
 * the MSC station list to attach to.
 */
export function ecccObservationsByStation(payload) {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const byStation = new Map();
  for (const feature of features) {
    const properties = feature?.properties;
    const code = textOrNull(properties?.['msc_id-value']);
    const at = Date.parse(textOrNull(properties?.['date_tm-value']) ?? '');
    if (!code || !Number.isFinite(at)) continue;
    const held = byStation.get(code);
    if (held) held.push(properties);
    else byStation.set(code, [properties]);
  }
  for (const rows of byStation.values())
    rows.sort(
      (a, b) => Date.parse(b['date_tm-value']) - Date.parse(a['date_tm-value']),
    );
  return byStation;
}

/**
 * One station's canonical readings, or all-absent when it is silent.
 *
 * `rows` is that station's observations, newest first. The newest one decides
 * `measuredAt`, but a column it is MISSING is filled from an earlier
 * observation inside `ECCC_BACKFILL_MS`.
 *
 * That is not belt and braces. `avg_wnd_dir_10m_pst10mts` drops out of
 * individual observation files while the speed in the same file is published:
 * measured live, 278 of 5,274 features carried a ten-minute wind speed with no
 * direction beside it, and reading only the newest file left 108 of 147
 * stations with a wind arrow. Filling the column from one averaging window
 * back brings it to 147, exactly the number that published a speed. No other
 * column gains a single station, which is how narrow this is.
 *
 * Pressure is absent for every station in this network, not missing from this
 * one: `stn_pres` is station level, and a sea-level reduction is the only
 * comparable pressure. See the rule in ../records.js.
 */
export function ecccReadings(rows) {
  const observations = Array.isArray(rows) ? rows : [];
  const measuredAt = textOrNull(observations[0]?.['date_tm-value']);
  const newestAt = Date.parse(measuredAt ?? '');
  const readings = { measuredAt, pressureQffHpa: null };
  for (const [key, field] of Object.entries(ECCC_OBSERVATION_FIELDS)) {
    readings[field] = null;
    for (const observation of observations) {
      const at = Date.parse(observation?.['date_tm-value'] ?? '');
      if (!Number.isFinite(at) || newestAt - at > ECCC_BACKFILL_MS) break;
      const value = ECCC_WIND_SPEED_KEYS.includes(key)
        ? kmhToMs(observation[key])
        : finiteOrNull(observation[key]);
      if (value !== null) {
        readings[field] = value;
        break;
      }
    }
  }
  return readings;
}

/**
 * Join the station lists to their newest readings.
 *
 * A station with no observation in the window is still returned, as with SLF
 * and SNOTEL: a network's silent sites are part of the picture, and the layer
 * draws them offline rather than hiding them. Measured live, 17 of 160 were
 * silent.
 */
export function joinEcccStations(stationFeatures, observations) {
  const byStation = ecccObservationsByStation(observations);
  const joined = [];
  for (const feature of Array.isArray(stationFeatures) ? stationFeatures : []) {
    const station = normalizeEcccStation(feature);
    if (!station) continue;
    joined.push({ ...station, ...ecccReadings(byStation.get(station.code)) });
  }
  return joined;
}
