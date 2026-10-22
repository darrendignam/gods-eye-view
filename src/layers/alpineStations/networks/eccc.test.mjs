import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ECCC_BACKFILL_MS,
  ECCC_DATA_PROVIDER,
  ECCC_OBSERVATION_FIELDS,
  ECCC_OBSERVATION_QUERY,
  ECCC_PROVINCES,
  ECCC_REGION_CODES,
  ECCC_STATION_QUERY,
  ecccObservationsByStation,
  ecccReadings,
  ecccRegionCode,
  joinEcccStations,
  kmhToMs,
  normalizeEcccStation,
} from './eccc.js';
import {
  ECCC_OBSERVATIONS,
  ECCC_STATIONS,
} from '../../../testSupport/alpineStationFixtures.mjs';
import { ECCC_NETWORK_ID, alpineNetwork } from '../networks.js';
import { READING_FIELDS, alpineStationRecord } from '../records.js';

/** The fixture's station features, by `msc_id`. */
const station = (mscId) =>
  ECCC_STATIONS.find((feature) => feature.properties.msc_id === mscId);

/** One joined record from the fixtures, by station code. */
function joined(code) {
  const records = joinEcccStations(ECCC_STATIONS, ECCC_OBSERVATIONS);
  return records.find((record) => record.code === code);
}

test('wind converts from km/h, and absent stays absent', () => {
  // The only conversion in this adapter: everything else MSC publishes is
  // already in the layer's own units. `msToKmh` in ../parameters.js is the
  // inverse, so a reading has to survive the round trip to the card.
  assert.equal(kmhToMs(43.3).toFixed(4), '12.0278');
  assert.equal(Math.round(kmhToMs(43.3) * 36) / 10, 43.3);
  assert.equal(kmhToMs(0), 0, 'a measured calm is zero, not absent');
  for (const absent of [null, undefined, '', '-', 'calm', {}])
    assert.equal(kmhToMs(absent), null, JSON.stringify(absent));
});

test('a province is matched by its full name, never by a code', () => {
  // `province_territory` holds "British Columbia", not "BC". Filtering on the
  // code matched nothing and reported an empty network rather than failing.
  assert.equal(ecccRegionCode('British Columbia'), 'BC');
  assert.equal(ecccRegionCode('Alberta'), 'AB');
  assert.equal(ecccRegionCode(' Alberta '), 'AB', 'whitespace is trimmed');
  assert.equal(ecccRegionCode('Yukon'), 'YT');
  assert.equal(ecccRegionCode('BC'), null);
  assert.equal(ecccRegionCode('Ontario'), null);
  for (const absent of [null, undefined, '', 7])
    assert.equal(ecccRegionCode(absent), null, JSON.stringify(absent));
  // Every region code is a code, because the card prints it beside the
  // elevation: "MSC SWOB · BC · 1398 m".
  for (const code of Object.values(ECCC_REGION_CODES))
    assert.match(code, /^[A-Z]{2}$/);
  assert.deepEqual(ECCC_PROVINCES, Object.keys(ECCC_REGION_CODES));
});

test('a station keeps its name, its code and the elevation ordinate', () => {
  const record = normalizeEcccStation(station('305MGFF'));
  assert.deepEqual(record, {
    networkId: ECCC_NETWORK_ID,
    code: '305MGFF',
    label: 'NAKISKA RIDGETOP',
    lat: 50.943843,
    lon: -115.191165,
    // Metres, straight from the third ordinate of the point. No conversion:
    // this is the highest site in the network and it is published in metres.
    elevationM: 2449.602,
    region: 'AB',
    country: 'CA',
  });
});

test('a station outside the scope is dropped, not drawn', () => {
  // Both filters are asked for upstream and applied again here, because this
  // is the one that decides what the layer draws.
  assert.equal(
    normalizeEcccStation(station('6150690')),
    null,
    'an MSC station in Ontario is outside the Cordillera',
  );
  assert.equal(
    normalizeEcccStation(station('1060815')),
    null,
    'a NAV CANADA aerodrome is not ECCC’s to license',
  );
  assert.equal(normalizeEcccStation({ properties: {} }), null);
  assert.equal(normalizeEcccStation(null), null);
  assert.equal(
    normalizeEcccStation({
      properties: { msc_id: 'X', province_territory: 'Alberta' },
    }),
    null,
    'a station with no provider is not assumed to be MSC',
  );
  // A code with no position is still a record: `alpineStationRecord` is the
  // gate that drops it, and it must get the chance to.
  const positionless = normalizeEcccStation({
    geometry: null,
    properties: {
      msc_id: '9999999',
      name: 'NOWHERE',
      province_territory: 'Yukon',
      data_provider: ECCC_DATA_PROVIDER,
    },
  });
  assert.equal(positionless.lat, null);
  assert.equal(alpineStationRecord(positionless), null);
});

test('the newest observation wins, whatever order the response arrives in', () => {
  // The live response is sorted newest first, and nothing here may depend on
  // that: the fixture lays Banff's three readings out of order on purpose.
  const byStation = ecccObservationsByStation(ECCC_OBSERVATIONS);
  const banff = byStation.get('3050519');
  assert.equal(banff.length, 3);
  assert.deepEqual(
    banff.map((row) => row['date_tm-value']),
    [
      '2026-10-22T10:19:00.000Z',
      '2026-10-22T10:18:00.000Z',
      '2026-10-22T09:16:00.000Z',
    ],
    'newest first',
  );
  assert.equal(joined('3050519').measuredAt, '2026-10-22T10:19:00.000Z');
  assert.equal(joined('3050519').windDirDeg, 198);
});

test('an observation with no station or no time is skipped', () => {
  const byStation = ecccObservationsByStation({
    features: [
      { properties: { 'date_tm-value': '2026-10-22T10:00:00.000Z' } },
      { properties: { 'msc_id-value': '3050519' } },
      { properties: { 'msc_id-value': '3050519', 'date_tm-value': 'soon' } },
      null,
    ],
  });
  assert.equal(byStation.size, 0);
  assert.equal(ecccObservationsByStation(null).size, 0);
  assert.equal(ecccObservationsByStation({ features: 'no' }).size, 0);
});

test('a column missing from the newest file is filled from one window back', () => {
  // `avg_wnd_dir_10m_pst10mts` drops out of individual observation files while
  // the speed in the same file is published. Vernon's newest file has a speed
  // and no direction, and the file six minutes earlier has both.
  const vernon = joined('1128582');
  assert.equal(vernon.measuredAt, '2026-10-22T10:25:00.000Z');
  assert.equal(vernon.windDirDeg, 107, 'filled from 10:19');
  assert.equal(Math.round(vernon.windSpeedMs * 36) / 10, 14.7, 'not filled');
  assert.ok(ECCC_BACKFILL_MS === 10 * 60 * 1000);
});

test('a column is not filled from outside the averaging window', () => {
  // Tsawwassen's newest file carries no wind at all and the nearest that does
  // is 25 minutes back. Beyond one averaging window it is a different
  // measurement, so the column stays absent rather than becoming current.
  const tsawwassen = joined('1108291');
  assert.equal(tsawwassen.measuredAt, '2026-10-22T10:25:00.000Z');
  for (const field of ['windSpeedMs', 'windGustMs', 'windDirDeg'])
    assert.equal(tsawwassen[field], null, field);
});

test('a station with no observation is returned silent, not dropped', () => {
  // A network's silent sites are part of the picture of the network, and the
  // layer draws them offline rather than hiding them.
  const saturna = joined('1017099');
  assert.equal(saturna.label, 'SATURNA CAPMON');
  assert.equal(saturna.measuredAt, null);
  for (const field of READING_FIELDS)
    assert.equal(saturna[field], null, field);
});

test('absent is not zero, in either direction', () => {
  // Nakiska is an hourly station: it publishes no snow depth and no
  // ten-minute precipitation at all, while Old Crow publishes 15 cm of snow
  // and a measured zero of rain.
  const nakiska = joined('305MGFF');
  assert.equal(nakiska.snowDepthCm, null, 'no sensor is absent, not bare');
  assert.equal(nakiska.precipMm, null, 'no column is absent, not dry');
  const oldCrow = joined('2100805');
  assert.equal(oldCrow.snowDepthCm, 15);
  assert.equal(oldCrow.precipMm, 0, 'a measured zero is a reading');
  assert.equal(oldCrow.airTempC, -4.8);
  assert.equal(oldCrow.humidityPct, 88);
});

test('no station in this network publishes a sea-level pressure', () => {
  // `stn_pres` is station level (QFE), which is a map of altitude rather than
  // of weather, and the SWOB payload reduces it to nothing else. The registry
  // declares no pressure, and the adapter must agree with the registry.
  assert.ok(!alpineNetwork(ECCC_NETWORK_ID).parameters.includes('pressure'));
  assert.ok(!Object.keys(ECCC_OBSERVATION_FIELDS).includes('stn_pres'));
  for (const record of joinEcccStations(ECCC_STATIONS, ECCC_OBSERVATIONS))
    assert.equal(record.pressureQffHpa, null, record.code);
});

test('an hour of rain is never read as the ten minutes the layer scales to', () => {
  // `pcpn_amt_pst1hr` is published more widely than `pcpn_amt_pst10mts`, and
  // reading it would put an hour's accumulation on a scale labelled mm/10min.
  // That is the SNOTEL `PREC` mistake in a milder form.
  assert.ok(!Object.keys(ECCC_OBSERVATION_FIELDS).includes('pcpn_amt_pst1hr'));
  assert.ok(!ECCC_OBSERVATION_QUERY.includes('pcpn_amt_pst1hr'));
  assert.equal(ECCC_OBSERVATION_FIELDS.pcpn_amt_pst10mts, 'precipMm');
  const readings = ecccReadings([
    {
      'date_tm-value': '2026-10-22T10:19:00.000Z',
      pcpn_amt_pst1hr: 11.4,
    },
  ]);
  assert.equal(readings.precipMm, null);
});

test('a partner network leaves the layer at the join', () => {
  // Parks Canada, Yukon and municipal stations publish into the same bbox and
  // carry their own licensing. They reach the adapter and stop here, because
  // they have no entry in the MSC station list to attach to.
  const byStation = ecccObservationsByStation(ECCC_OBSERVATIONS);
  assert.ok(byStation.has('PC-NRMB_CBA1F1D0'), 'it does reach the adapter');
  const records = joinEcccStations(ECCC_STATIONS, ECCC_OBSERVATIONS);
  assert.ok(!records.some((record) => record.code.startsWith('PC-')));
  // Seven MSC stations in scope out of the nine features in the fixture.
  assert.equal(records.length, 7);
});

test('every joined record is a drawable canonical record', () => {
  const records = joinEcccStations(ECCC_STATIONS, ECCC_OBSERVATIONS);
  for (const record of records) {
    const canonical = alpineStationRecord(record);
    assert.ok(canonical, record.code);
    assert.equal(canonical.networkId, ECCC_NETWORK_ID);
    assert.equal(canonical.country, 'CA');
    assert.match(canonical.region, /^(BC|AB|YT)$/);
    assert.equal(canonical.id, `${ECCC_NETWORK_ID}:${record.code}`);
    // Snow depth below zero is a bare ultrasonic head reading its own
    // baseline. Calgary published -1 cm live.
    if (canonical.snowDepthCm !== null) assert.ok(canonical.snowDepthCm >= 0);
  }
  assert.equal(joined('3031094').snowDepthCm, -1, 'the adapter relays it');
  assert.equal(
    alpineStationRecord(joined('3031094')).snowDepthCm,
    0,
    'the record floors it',
  );
});

test('the query asks for exactly the columns the adapter reads', () => {
  // A property left out of the query arrives absent and reads as a station
  // without a sensor, which is invisible: every gate stays green.
  for (const key of Object.keys(ECCC_OBSERVATION_FIELDS))
    assert.ok(ECCC_OBSERVATION_QUERY.split(',').includes(key), key);
  assert.ok(ECCC_OBSERVATION_QUERY.split(',').includes('msc_id-value'));
  assert.ok(ECCC_OBSERVATION_QUERY.split(',').includes('date_tm-value'));
  for (const key of ['msc_id', 'name', 'province_territory', 'data_provider'])
    assert.ok(ECCC_STATION_QUERY.split(',').includes(key), key);
  // Every canonical field this network claims to publish is mapped, and
  // nothing it cannot publish is.
  const mapped = new Set(Object.values(ECCC_OBSERVATION_FIELDS));
  for (const field of READING_FIELDS)
    assert.equal(
      mapped.has(field),
      field !== 'pressureQffHpa',
      `${field} mapping`,
    );
});
