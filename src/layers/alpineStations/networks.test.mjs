import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALPINE_NETWORKS,
  ALPINE_NETWORK_IDS,
  ECCC_NETWORK_ID,
  SLF_NETWORK_ID,
  SMN_NETWORK_ID,
  SNOTEL_NETWORK_ID,
  TAWES_NETWORK_ID,
  alpineAttribution,
  alpineNetwork,
  networksMeasuring,
} from './networks.js';
import { STATION_PARAMETER_IDS } from './parameters.js';

// Licences a network may carry. An allowlist, not a pattern: the test exists
// to stop a share-alike or non-commercial source being added by someone who
// read "open" loosely, so a new entry here should be a deliberate decision.
//
// The ECCC entry was one. Version 2.1.1 of the Environment and Climate Change
// Canada Data Services End-use Licence grants "a worldwide, royalty-free,
// perpetual, non-exclusive licence to use the Information, including for
// commercial purposes", with the freedom to "copy, modify, publish, translate,
// adapt, distribute or otherwise use the Information in any medium", on the
// condition that the source is acknowledged. No key, no share-alike, no
// non-commercial clause.
const REDISTRIBUTABLE = new Set([
  'CC BY 4.0',
  'Public domain',
  'ECCC End-use Licence',
]);

test('every network is keyless, openly licensed and names its own attribution', () => {
  // Eligibility for this layer IS the licence: a network that needs a token or
  // forbids redistribution belongs behind the key registry, not here.
  assert.ok(ALPINE_NETWORKS.length >= 3);
  for (const network of ALPINE_NETWORKS) {
    assert.match(network.id, /^[a-z]+(?:-[a-z0-9]+)+$/, network.id);
    assert.ok(REDISTRIBUTABLE.has(network.licence), network.licence);
    assert.match(network.licenceUrl, /^https:\/\//, network.id);
    // Public-domain data imposes no attribution condition, but the operators
    // are still named: the map should say where a reading came from whether
    // or not a licence compels it.
    assert.ok(network.attribution.length > 2, network.id);
    assert.match(network.homepage, /^https:\/\//);
    assert.match(network.country, /^[A-Z]{2}$/);
    assert.ok(Number.isInteger(network.cadenceMinutes));
    assert.ok(network.cadenceMinutes > 0 && network.cadenceMinutes <= 60);
  }
});

test('ids are unique and every declared parameter is a real view', () => {
  assert.equal(new Set(ALPINE_NETWORK_IDS).size, ALPINE_NETWORK_IDS.length);
  for (const network of ALPINE_NETWORKS) {
    assert.ok(network.parameters.length, `${network.id} measures nothing`);
    for (const id of network.parameters)
      assert.ok(
        STATION_PARAMETER_IDS.includes(id),
        `${network.id} declares unknown parameter ${id}`,
      );
  }
});

test('the parameters a network cannot publish honestly are withheld', () => {
  // Every exclusion is a measured finding, not an oversight, and each is
  // stated in the adapter that would otherwise read the column. A regression
  // here would put a map of altitude or an empty layer in front of a visitor.
  assert.ok(
    !alpineNetwork(SMN_NETWORK_ID).parameters.includes('snow'),
    'SwissMetNet publishes no snow depth in the whole-network current file',
  );
  assert.ok(
    !alpineNetwork(TAWES_NETWORK_ID).parameters.includes('pressure'),
    'GeoSphere reduces pressure to a local datum, not to sea level',
  );
  assert.ok(
    !alpineNetwork(SNOTEL_NETWORK_ID).parameters.includes('precipitation'),
    'SNOTEL publishes a season-to-date accumulation, not an interval depth',
  );
  assert.ok(
    !alpineNetwork(ECCC_NETWORK_ID).parameters.includes('pressure'),
    'SWOB publishes station-level pressure and no sea-level reduction',
  );
  assert.ok(alpineNetwork(SLF_NETWORK_ID).parameters.includes('snow'));
  assert.ok(alpineNetwork(SMN_NETWORK_ID).parameters.includes('pressure'));
  assert.ok(
    alpineNetwork(ECCC_NETWORK_ID).parameters.includes('precipitation'),
  );
});

test('only SwissMetNet is left to publish a sea-level pressure', () => {
  // Three of the five networks publish station-level pressure only, which is
  // a map of altitude rather than of weather. Losing the fourth would leave
  // the pressure view with an empty map and a full legend, which the next
  // test is the general guard against; this one names the reason.
  assert.deepEqual(
    networksMeasuring('pressure').map((network) => network.id),
    [SMN_NETWORK_ID],
  );
});

test('every parameter view is published by at least one network', () => {
  // A view no network feeds would render an empty map with a full legend.
  for (const id of STATION_PARAMETER_IDS)
    assert.ok(networksMeasuring(id).length > 0, `nothing publishes ${id}`);
});

test('an unknown network id resolves to null rather than throwing', () => {
  // Ids arrive inside payloads, so an unexpected one is ordinary input.
  assert.equal(alpineNetwork('not-a-network'), null);
  assert.equal(alpineNetwork(undefined), null);
  assert.equal(alpineNetwork(''), null);
});

test('attribution credits exactly the networks present, and nothing else', () => {
  const one = alpineAttribution([SLF_NETWORK_ID]);
  assert.match(one, /WSL Institute/);
  assert.ok(!one.includes('MeteoSwiss'), 'an absent network is not credited');
  assert.match(one, /CC BY 4\.0/);
  const all = alpineAttribution();
  for (const network of ALPINE_NETWORKS)
    assert.ok(all.includes(network.attribution), network.id);
  assert.equal(alpineAttribution([]), '');
  assert.equal(alpineAttribution(['nope']), '');
});

test('the attribution names each licence over the networks it covers', () => {
  // The networks do not share one licence. A single trailing "(CC BY 4.0)"
  // asserted a licence NRCS never granted, and implied a condition that
  // public-domain data does not carry.
  const all = alpineAttribution();
  assert.match(all, /SLF.*MeteoSwiss.*GeoSphere Austria \(CC BY 4\.0\)/);
  assert.match(all, /USDA NRCS \(Public domain\)/);
  assert.match(
    all,
    /Environment and Climate Change Canada \(ECCC End-use Licence\)/,
  );
  assert.equal(
    (all.match(/CC BY 4\.0/g) || []).length,
    1,
    'the shared licence is named once, not per operator',
  );
  // A payload without the US network must not mention public domain at all.
  const swissOnly = alpineAttribution([SLF_NETWORK_ID, SMN_NETWORK_ID]);
  assert.ok(!swissOnly.includes('Public domain'), swissOnly);
  assert.ok(!swissOnly.includes('NRCS'), swissOnly);
  assert.match(swissOnly, /\(CC BY 4\.0\)$/);
  // And one with only the US network must not claim CC BY.
  const usOnly = alpineAttribution([SNOTEL_NETWORK_ID]);
  assert.equal(usOnly, 'USDA NRCS (Public domain)');
  // Clause 3 of ECCC's licence requires the source to be acknowledged, so a
  // payload carrying Canadian readings must name it and link the licence.
  const canadaOnly = alpineAttribution([ECCC_NETWORK_ID]);
  assert.equal(
    canadaOnly,
    'Environment and Climate Change Canada (ECCC End-use Licence)',
  );
  assert.equal(alpineAttribution([]), '');
});
