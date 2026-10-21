/**
 * USDA NRCS SNOTEL adapter — the US mountain snowpack network.
 *
 * Roughly 980 active sites across 13 western states and Alaska, median site
 * elevation about 2,280 m, publishing hourly through the AWDB REST API.
 * Keyless, and a work of the US federal government, so public domain.
 *
 * Two upstream calls joined here rather than in the browser, as with SLF: the
 * station call carries names, positions and elevations that the data call does
 * not return, and the data call is keyed by station triplet.
 *
 * Units are the API's own `storedUnitCode` and are NOT guessed. Every one of
 * them is imperial, which is why this is the only adapter that converts:
 *   SNWD   snow depth, INCHES
 *   TOBS   observed air temperature, DEGREES FAHRENHEIT
 *   WSPDV  wind speed, vector mean, MILES PER HOUR
 *   WDIRV  wind direction, degrees
 *   RHUM   relative humidity, %
 *   elevation (station call) FEET
 *
 * Two elements are read from the feed and deliberately dropped:
 *
 * `PREC` is a season-to-date ACCUMULATION. Measured live, Alta Lakes sat flat
 * at 2.9 in across every hour of a dry day, where SwissMetNet and TAWES both
 * publish the depth that fell in one reporting interval. Mapping it onto
 * `precipMm` would put a winter's total on the same colour scale as ten
 * minutes of rain, so the registry declares no precipitation for SNOTEL.
 *
 * `WTEQ` is snow water equivalent, which is the measurement SNOTEL exists to
 * make and the one a hydrologist would come for. There is no canonical field
 * for it: adding one means a new parameter view, its own bands and a legend,
 * and every other network declaring it absent. It is read and discarded here
 * so the shape of the data is on the record, and it is the obvious next step.
 */

import { SNOTEL_NETWORK_ID } from '../networks.js';
import { finiteOrNull, textOrNull } from '../records.js';

/** The elements requested, and the canonical field each becomes. */
export const SNOTEL_ELEMENTS = Object.freeze({
  SNWD: 'snowDepthCm',
  TOBS: 'airTempC',
  WSPDV: 'windSpeedMs',
  WDIRV: 'windDirDeg',
  RHUM: 'humidityPct',
});

/** The `elements` query value, fixed by the table above. */
export const SNOTEL_ELEMENT_QUERY = Object.keys(SNOTEL_ELEMENTS).join(',');

const INCHES_TO_CM = 2.54;
const FEET_TO_M = 0.3048;
const MPH_TO_MS = 0.44704;

/** Inches to centimetres, keeping absent absent and a measured zero zero. */
export function inchesToCm(value) {
  const inches = finiteOrNull(value);
  return inches === null ? null : inches * INCHES_TO_CM;
}

/** Degrees Fahrenheit to Celsius. */
export function fahrenheitToCelsius(value) {
  const f = finiteOrNull(value);
  return f === null ? null : ((f - 32) * 5) / 9;
}

/** Miles per hour to metres per second. */
export function mphToMs(value) {
  const mph = finiteOrNull(value);
  return mph === null ? null : mph * MPH_TO_MS;
}

/**
 * The station code, from AWDB's `<id>:<state>:<network>` triplet.
 *
 * `STATE-id`, not the triplet itself. The numeric id alone collides across
 * states, so the state has to stay; the triplet cannot be used verbatim
 * because a canonical record id is `<networkId>:<code>` and a code carrying
 * two more colons makes that unparseable. The network segment is dropped
 * because every station here is already SNTL or SNTLT by the time this runs.
 */
export function snotelCode(triplet) {
  const match = /^([0-9A-Za-z_]+):([A-Z]{2}):([A-Z]+)$/.exec(
    textOrNull(triplet) ?? '',
  );
  return match ? `${match[2]}-${match[1]}` : null;
}

/**
 * Normalize one entry from `/stations`.
 *
 * `activeOnly=true` is asked for upstream, but the flag is not trusted: a
 * station whose `endDate` is in the past is dropped here too, because a
 * decommissioned box with a stale last reading would draw as an offline marker
 * for ever rather than not being on the map at all.
 */
export function normalizeSnotelStation(raw, { now = Date.now() } = {}) {
  const code = snotelCode(raw?.stationTriplet);
  if (!code) return null;
  if (raw?.networkCode !== 'SNTL' && raw?.networkCode !== 'SNTLT') return null;
  const ended = snotelInstant(raw?.endDate, raw?.dataTimeZone);
  if (ended && Date.parse(ended) < now) return null;
  const elevationFt = finiteOrNull(raw?.elevation);
  return {
    networkId: SNOTEL_NETWORK_ID,
    code,
    label: textOrNull(raw?.name) || code,
    lat: finiteOrNull(raw?.latitude),
    lon: finiteOrNull(raw?.longitude),
    elevationM: elevationFt === null ? null : elevationFt * FEET_TO_M,
    region: textOrNull(raw?.stateCode),
    country: 'US',
  };
}

/**
 * An AWDB timestamp as an ISO 8601 UTC instant, or null.
 *
 * AWDB publishes `2026-10-21 00:00` with NO offset, in the station's own
 * STANDARD time all year — `dataTimeZone` is -8 for the lower 48 and -9 for
 * the 86 Alaskan sites, and it does not shift for daylight saving. Reading
 * these naively puts every Alaskan reading an hour away from every other, and
 * puts the whole network up to nine hours out on a UTC host, which against the
 * staleness floor would report a healthy network as offline. `isoOrNull`
 * refuses an offsetless datetime for exactly this reason, so the offset is
 * applied here where the station that owns it is in hand.
 */
export function snotelInstant(stamp, dataTimeZone) {
  const text = textOrNull(stamp);
  const offsetHours = finiteOrNull(dataTimeZone);
  if (!text || offsetHours === null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  // Reject a day that does not exist BEFORE the offset moves it: `Date.UTC`
  // rolls 2026-02-31 forward to 3 March rather than failing, and a rolled
  // date would read as a plausible reading time.
  const local = Date.UTC(y, mo - 1, d, h, mi);
  const check = new Date(local);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d
  )
    return null;
  return new Date(local - offsetHours * 3_600_000).toISOString();
}

/**
 * The newest value of each element for one station, as canonical fields.
 *
 * The data call returns a window, and each element carries its own `values`
 * array; only the last entry of each is presented. An element the station does
 * not carry is simply absent from `data`, which is how a missing sensor stays
 * `null` rather than becoming a zero.
 */
export function snotelReadings(entry, dataTimeZone) {
  const readings = { measuredAt: null };
  let newest = '';
  for (const block of Array.isArray(entry?.data) ? entry.data : []) {
    const code = textOrNull(block?.stationElement?.elementCode);
    const field = code && SNOTEL_ELEMENTS[code];
    if (!field) continue;
    const values = Array.isArray(block.values) ? block.values : [];
    const last = values[values.length - 1];
    if (!last) continue;
    readings[field] = convertSnotel(code, last.value);
    const at = snotelInstant(last.date, dataTimeZone);
    if (at && at > newest) newest = at;
  }
  readings.measuredAt = newest || null;
  return readings;
}

function convertSnotel(elementCode, value) {
  if (elementCode === 'SNWD') return inchesToCm(value);
  if (elementCode === 'TOBS') return fahrenheitToCelsius(value);
  if (elementCode === 'WSPDV') return mphToMs(value);
  return finiteOrNull(value);
}

/**
 * Join stations to their newest readings.
 *
 * A station with no readings is still returned, as with SLF: a network's
 * silent boxes are part of the picture, and the layer draws them offline.
 */
export function joinSnotelStations(stations, data, { now = Date.now() } = {}) {
  const byCode = new Map();
  for (const entry of Array.isArray(data) ? data : []) {
    const code = snotelCode(entry?.stationTriplet);
    if (code) byCode.set(code, entry);
  }
  const joined = [];
  for (const raw of Array.isArray(stations) ? stations : []) {
    const station = normalizeSnotelStation(raw, { now });
    if (!station) continue;
    const readings = snotelReadings(
      byCode.get(station.code),
      raw?.dataTimeZone,
    );
    joined.push({
      ...station,
      measuredAt: readings.measuredAt,
      airTempC: readings.airTempC ?? null,
      snowDepthCm: readings.snowDepthCm ?? null,
      humidityPct: readings.humidityPct ?? null,
      windSpeedMs: readings.windSpeedMs ?? null,
      // SNOTEL publishes no gust element beside the vector mean.
      windGustMs: null,
      windDirDeg: readings.windDirDeg ?? null,
      precipMm: null,
      pressureQffHpa: null,
    });
  }
  return joined;
}
