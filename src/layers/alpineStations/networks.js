/**
 * The mountain automatic weather networks this layer can draw, one entry per
 * operator.
 *
 * Every network here is keyless and openly licensed, which is what makes them
 * eligible: the layer must work on a fresh clone with no credentials, like USGS
 * earthquakes and CelesTrak rather than like TomTom. A network that needs a
 * token belongs behind the key registry, not here.
 *
 * `parameters` is the honest list of what an operator publishes, not what its
 * stations happen to be reporting today. A parameter absent here is one the
 * network does not carry at all, so the layer can say "this network does not
 * measure that" instead of showing a silent gap.
 *
 * Adding a network means: an entry here, a pure adapter in `./networks/`, and
 * a fetch step in `server/providers/alpine-stations/`. Nothing else in the
 * layer is network-aware.
 */

/** Canonical ids, used as record prefixes and in the proxy's route segment. */
export const SLF_NETWORK_ID = 'slf-imis';
export const SMN_NETWORK_ID = 'meteoswiss-smn';
export const TAWES_NETWORK_ID = 'geosphere-tawes';
export const SNOTEL_NETWORK_ID = 'usda-snotel';
export const ECCC_NETWORK_ID = 'eccc-swob';

export const ALPINE_NETWORKS = Object.freeze([
  Object.freeze({
    id: SLF_NETWORK_ID,
    // i18n-ignore: the operator's own name for the network
    label: 'SLF IMIS',
    name: 'WSL Institute for Snow and Avalanche Research SLF',
    country: 'CH',
    homepage: 'https://www.slf.ch/',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'WSL Institute for Snow and Avalanche Research SLF',
    // IMIS boxes sit above the tree line to watch the snowpack, so they carry
    // snow, wind and temperature and nothing else.
    parameters: Object.freeze(['snow', 'wind', 'temperature']),
    cadenceMinutes: 30,
  }),
  Object.freeze({
    id: SMN_NETWORK_ID,
    // i18n-ignore: the operator's own name for the network
    label: 'SwissMetNet',
    name: 'MeteoSwiss (Federal Office of Meteorology and Climatology)',
    country: 'CH',
    homepage: 'https://www.meteoswiss.admin.ch/',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'MeteoSwiss',
    // No snow: the whole-network current-values file VQHA80 has no snow
    // column, and the per-station alternative costs ~160 requests a refresh.
    // See the header of ./networks/smn.js. Swiss snow depth comes from SLF.
    parameters: Object.freeze([
      'wind',
      'temperature',
      'precipitation',
      'pressure',
    ]),
    cadenceMinutes: 10,
  }),
  Object.freeze({
    id: TAWES_NETWORK_ID,
    // i18n-ignore: the operator's own name for the network
    label: 'TAWES',
    name: 'GeoSphere Austria',
    country: 'AT',
    homepage: 'https://data.hub.geosphere.at/',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'GeoSphere Austria',
    // No pressure. `PRED` ("reduzierter Luftdruck") is only reduced to sea
    // level for low stations: Wien/Hohe Warte at 198 m reads P 991.7 against
    // PRED 1016.4, but Sonnblick at 3109 m reads P 696.7 against PRED 707.7,
    // an 11 hPa correction over three kilometres. Nothing in the payload says
    // which regime a station is in, so including it would draw a map of
    // Austrian altitude. See the pressure rule in ../records.js.
    parameters: Object.freeze(['snow', 'wind', 'temperature', 'precipitation']),
    cadenceMinutes: 10,
  }),
  Object.freeze({
    id: SNOTEL_NETWORK_ID,
    // i18n-ignore: the operator's own name for the network
    label: 'SNOTEL',
    name: 'USDA Natural Resources Conservation Service',
    country: 'US',
    homepage: 'https://www.nrcs.usda.gov/wps/portal/wcc/home/',
    licence: 'Public domain',
    licenceUrl: 'https://www.usa.gov/government-works',
    attribution: 'USDA NRCS',
    // No precipitation. `PREC` is a season-to-date ACCUMULATION, flat across
    // the hours of a dry day, where every other network here publishes the
    // depth that fell in one reporting interval. Presenting the two under one
    // parameter would put a season total on the same scale as ten minutes of
    // rain. Snow water equivalent (`WTEQ`), which is what SNOTEL exists to
    // measure, has no canonical field yet either. See ./networks/snotel.js.
    parameters: Object.freeze(['snow', 'wind', 'temperature']),
    cadenceMinutes: 60,
  }),
  Object.freeze({
    id: ECCC_NETWORK_ID,
    // i18n-ignore: the operator's own name for the network
    label: 'MSC SWOB',
    name: 'Environment and Climate Change Canada (Meteorological Service of Canada)',
    country: 'CA',
    homepage: 'https://eccc-msc.github.io/open-data/',
    licence: 'ECCC End-use Licence',
    licenceUrl: 'https://eccc-msc.github.io/open-data/licence/readme_en/',
    attribution: 'Environment and Climate Change Canada',
    // No pressure. `stn_pres` is station level (QFE) and nothing in the SWOB
    // payload reduces it to sea level, which is the third network to publish
    // only QFE. See the pressure rule in ../records.js.
    parameters: Object.freeze(['snow', 'wind', 'temperature', 'precipitation']),
    // Two cadences in one network: about 90 of the stations publish every
    // minute and the rest once an hour, on the hour. The registry carries the
    // SLOWER one because this figure sets the staleness window, and an hourly
    // station measured against a ten-minute window would report as late for
    // fifty minutes of every hour. See ./networks/eccc.js.
    cadenceMinutes: 60,
  }),
]);

export const ALPINE_NETWORK_IDS = Object.freeze(
  ALPINE_NETWORKS.map((network) => network.id),
);

const BY_ID = new Map(ALPINE_NETWORKS.map((network) => [network.id, network]));

/** The network with this id, or null. Never throws: ids arrive from payloads. */
export function alpineNetwork(id) {
  return BY_ID.get(id) ?? null;
}

/** Networks that publish a given parameter, in registry order. */
export function networksMeasuring(parameterId) {
  return ALPINE_NETWORKS.filter((network) =>
    network.parameters.includes(parameterId),
  );
}

/**
 * One attribution line covering the networks actually present in a payload.
 *
 * CC BY is a condition rather than a courtesy, so this credits the operators
 * whose data is on screen and stays silent about the rest.
 *
 * The licence is named per GROUP, not once for the line. The networks do not
 * share one: SNOTEL is US public domain and SWOB carries ECCC's own end-use
 * licence, so a single trailing "(CC BY 4.0)" would assert a licence neither
 * operator granted while implying conditions their data does not carry.
 */
export function alpineAttribution(networkIds = ALPINE_NETWORK_IDS) {
  const present = ALPINE_NETWORKS.filter((network) =>
    networkIds.includes(network.id),
  );
  const byLicence = new Map();
  for (const network of present) {
    const held = byLicence.get(network.licence) ?? [];
    held.push(network.attribution);
    byLicence.set(network.licence, held);
  }
  return [...byLicence]
    .map(([licence, names]) => `${names.join(' · ')} (${licence})`)
    .join(' · ');
}
