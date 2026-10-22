import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SNOTEL_ELEMENTS,
  SNOTEL_ELEMENT_QUERY,
  fahrenheitToCelsius,
  inchesToCm,
  joinSnotelStations,
  mphToMs,
  normalizeSnotelStation,
  snotelCode,
  snotelInstant,
  snotelReadings,
} from './snotel.js';
import {
  SNOTEL_DATA,
  SNOTEL_STATIONS,
} from '../../../testSupport/alpineStationFixtures.mjs';
import { SNOTEL_NETWORK_ID, alpineNetwork } from '../networks.js';
import { alpineStationRecord } from '../records.js';

// After the fixture's 2026-10-21 00:00 PST reading, so nothing is "ended".
const NOW = Date.UTC(2026, 9, 21, 12, 0);

test('a station code keeps its state and drops the colons', () => {
  // `1030` is a Colorado site and `1030:ID:SNTL` an Idaho one, so the state
  // has to stay. The triplet itself cannot be the code: a record id is
  // `<networkId>:<code>`, and two more colons inside it make that ambiguous.
  assert.equal(snotelCode('1030:CO:SNTL'), 'CO-1030');
  assert.equal(snotelCode('  335:CO:SNTL '), 'CO-335');
  assert.equal(snotelCode('1030:ID:SNTL'), 'ID-1030');
  assert.notEqual(snotelCode('1030:CO:SNTL'), snotelCode('1030:ID:SNTL'));
  assert.ok(!snotelCode('1030:CO:SNTL').includes(':'));
  for (const bad of [null, '', '1030', '1030:CO', '1030:Colorado:SNTL', 7])
    assert.equal(snotelCode(bad), null, JSON.stringify(bad));
});

test('imperial readings are converted, and absent stays absent', () => {
  // Every element SNOTEL publishes is imperial; this is the only adapter here
  // that converts, so a silent failure would show as plausible-but-wrong.
  assert.equal(inchesToCm(4), 10.16);
  assert.equal(fahrenheitToCelsius(32), 0);
  assert.equal(Math.round(fahrenheitToCelsius(36.9) * 100) / 100, 2.72);
  assert.equal(Math.round(mphToMs(10) * 1000) / 1000, 4.47);
  // A measured zero is a reading and must survive the conversion as zero.
  assert.equal(inchesToCm(0), 0);
  assert.equal(mphToMs(0), 0);
  assert.equal(fahrenheitToCelsius(0), -17.77777777777778);
  for (const absent of [null, undefined, '', '   ', 'n/a']) {
    assert.equal(inchesToCm(absent), null);
    assert.equal(fahrenheitToCelsius(absent), null);
    assert.equal(mphToMs(absent), null);
  }
});

test('a timestamp is read in the station standard time it was written in', () => {
  // AWDB writes `2026-10-21 00:00` with no offset, in the station's own
  // STANDARD time all year. The lower 48 sit at -8 and Alaska at -9.
  assert.equal(
    snotelInstant('2026-10-21 00:00', -8),
    '2026-10-21T08:00:00.000Z',
  );
  assert.equal(
    snotelInstant('2026-10-21 00:00', -9),
    '2026-10-21T09:00:00.000Z',
  );
  // An hour between the two is exactly the error that assuming one zone makes.
  assert.notEqual(
    snotelInstant('2026-10-21 00:00', -8),
    snotelInstant('2026-10-21 00:00', -9),
  );
  // It does not shift for daylight saving: a July reading takes the same -8.
  assert.equal(
    snotelInstant('2026-07-21 00:00', -8),
    '2026-07-21T08:00:00.000Z',
  );
  // Without the station's zone there is no instant, only a wall clock.
  assert.equal(snotelInstant('2026-10-21 00:00', null), null);
  assert.equal(snotelInstant('2026-10-21 00:00', undefined), null);
  assert.equal(snotelInstant(null, -8), null);
  assert.equal(snotelInstant('not a date', -8), null);
  // A day that does not exist is refused rather than rolled forward.
  assert.equal(snotelInstant('2026-02-31 00:00', -8), null);
  assert.equal(snotelInstant('2026-13-01 00:00', -8), null);
});

test('a decommissioned station is dropped, not drawn as permanently offline', () => {
  const [arapaho] = SNOTEL_STATIONS;
  assert.ok(normalizeSnotelStation(arapaho, { now: NOW }));
  const retired = { ...arapaho, endDate: '2019-06-30 00:00' };
  assert.equal(normalizeSnotelStation(retired, { now: NOW }), null);
  // The sentinel end date AWDB uses for an active station is far future.
  assert.ok(
    normalizeSnotelStation(
      { ...arapaho, endDate: '2100-01-01 00:00' },
      { now: NOW },
    ),
  );
});

test('only the snow-telemetry networks are taken from a shared endpoint', () => {
  // The AWDB `networkCodes` filter is NOT applied by the server: asking for
  // SNTL returned all twelve networks, 4398 stations, including USGS gauges
  // and manual snow courses. The filter has to happen here.
  const [arapaho] = SNOTEL_STATIONS;
  assert.ok(
    normalizeSnotelStation({ ...arapaho, networkCode: 'SNTL' }, { now: NOW }),
  );
  assert.ok(
    normalizeSnotelStation({ ...arapaho, networkCode: 'SNTLT' }, { now: NOW }),
  );
  for (const other of ['USGS', 'SNOW', 'COOP', 'SCAN', 'BOR'])
    assert.equal(
      normalizeSnotelStation({ ...arapaho, networkCode: other }, { now: NOW }),
      null,
      other,
    );
});

test('a station carries metres and its own state, from feet and a triplet', () => {
  const station = normalizeSnotelStation(SNOTEL_STATIONS[0], { now: NOW });
  assert.equal(station.networkId, SNOTEL_NETWORK_ID);
  assert.equal(station.label, 'Arapaho Ridge');
  assert.equal(station.country, 'US');
  assert.equal(station.region, 'CO');
  // 10,960 ft is 3,340 m: a metre figure near 10,960 would mean feet leaked.
  assert.equal(Math.round(station.elevationM), 3341);
  assert.equal(station.lat, 40.35098);
  assert.equal(station.lon, -106.38141);
});

test('every requested element maps to a canonical field', () => {
  assert.equal(SNOTEL_ELEMENT_QUERY, 'SNWD,TOBS,WSPDV,WDIRV,RHUM');
  // PREC and WTEQ are read from the feed and deliberately not mapped.
  for (const dropped of ['PREC', 'WTEQ'])
    assert.ok(!(dropped in SNOTEL_ELEMENTS), dropped);
});

test('a calm bare station reads as zero, not as absent', () => {
  // Arapaho Ridge published 0 in of snow, 0.0 mph and 0 degrees in one
  // response. Treating a measured zero as absent would hide a working sensor.
  const [arapaho] = joinSnotelStations([SNOTEL_STATIONS[0]], [SNOTEL_DATA[0]], {
    now: NOW,
  });
  assert.equal(arapaho.snowDepthCm, 0);
  assert.equal(arapaho.windSpeedMs, 0);
  assert.equal(arapaho.windDirDeg, 0);
  assert.equal(arapaho.humidityPct, 91);
  assert.equal(Math.round(arapaho.airTempC * 100) / 100, -0.28);
  assert.equal(arapaho.measuredAt, '2026-10-21T08:00:00.000Z');
});

test('a sensor the station does not carry stays null', () => {
  const joined = joinSnotelStations(SNOTEL_STATIONS, SNOTEL_DATA, { now: NOW });
  const by = Object.fromEntries(joined.map((s) => [s.label, s]));
  // Alta Lakes has no wind mast at all.
  assert.equal(by['Alta Lakes'].windSpeedMs, null);
  assert.equal(by['Alta Lakes'].windDirDeg, null);
  assert.equal(by['Alta Lakes'].humidityPct, null);
  assert.equal(by['Alta Lakes'].snowDepthCm, 10.16, '4 in of snow');
  // Berthoud Summit has wind and humidity but no snow-depth sensor.
  assert.equal(by['Berthoud Summit'].snowDepthCm, null);
  assert.equal(Math.round(by['Berthoud Summit'].windSpeedMs * 100) / 100, 0.49);
  assert.equal(by['Berthoud Summit'].windDirDeg, 65);
  // No network-wide fields: SNOTEL publishes neither, by declaration.
  for (const station of joined) {
    assert.equal(station.precipMm, null, station.label);
    assert.equal(station.pressureQffHpa, null, station.label);
    assert.equal(station.windGustMs, null, station.label);
  }
});

test('a station with no readings at all is still part of the network', () => {
  const joined = joinSnotelStations(SNOTEL_STATIONS, [], { now: NOW });
  assert.equal(joined.length, 3);
  for (const station of joined) {
    assert.equal(station.measuredAt, null);
    assert.equal(station.airTempC, null);
  }
});

test('junk in the payload is skipped rather than thrown over', () => {
  assert.deepEqual(joinSnotelStations(null, null), []);
  assert.deepEqual(joinSnotelStations(undefined, undefined), []);
  const joined = joinSnotelStations(
    [null, {}, 'nonsense', SNOTEL_STATIONS[0]],
    [null, {}, 'nonsense', SNOTEL_DATA[0]],
    { now: NOW },
  );
  assert.equal(joined.length, 1);
  assert.equal(joined[0].label, 'Arapaho Ridge');
  assert.deepEqual(snotelReadings(null, -8), { measuredAt: null });
  assert.deepEqual(snotelReadings({ data: 'nope' }, -8), { measuredAt: null });
});

test('every joined station survives the canonical record validator', () => {
  // The adapter is only useful if what it emits is drawable: the proxy and the
  // browser both run this same validator over it.
  const joined = joinSnotelStations(SNOTEL_STATIONS, SNOTEL_DATA, { now: NOW });
  assert.equal(joined.length, 3);
  for (const station of joined) {
    const record = alpineStationRecord(station);
    assert.ok(record, station.label);
    assert.equal(record.id, `${SNOTEL_NETWORK_ID}:${station.code}`);
    assert.match(record.id, /^[a-z-]+:[^:]+$/, record.id);
    assert.equal(record.country, 'US');
  }
});

test('the registry declares only what the adapter can actually supply', () => {
  const network = alpineNetwork(SNOTEL_NETWORK_ID);
  assert.deepEqual([...network.parameters].sort(), [
    'snow',
    'temperature',
    'wind',
  ]);
  assert.equal(network.cadenceMinutes, 60);
  assert.equal(network.licence, 'Public domain');
  assert.equal(network.country, 'US');
});
