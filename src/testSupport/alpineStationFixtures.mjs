/**
 * Fixtures for the Alpine station adapters, CUT FROM LIVE RESPONSES on
 * 2026-10-09 rather than invented.
 *
 * That distinction has already cost real time on this data: an invented
 * SwissMetNet fixture hid that the live STAC item publishes no `station_name`
 * and no elevation ordinate, and every test stayed green while every station
 * rendered as its bare code. Field names, casing, units, separators, the `-`
 * absent marker and the ISO-8859-1 accents below are all as the operators
 * publish them.
 *
 * The one thing arranged rather than captured is WHICH timestamp slot each
 * GeoSphere station reports in. The live response happened to have every
 * station at the newest slot that afternoon, so two real features were re-laid
 * at slots 2 and 0 of a three-slot response to exercise the union-of-timestamps
 * trap deliberately. Their readings, names, units and geometry are untouched.
 */

/** SLF IMIS `/stations`: a flat-field snow box, a wind mast, and a third station. */
export const SLF_STATIONS = [
  {
    code: 'DAV2',
    label: 'Bärentälli',
    lon: 9.8194108372,
    lat: 46.6988884749,
    elevation: 2558.0,
    country_code: 'CH',
    canton_code: 'GR',
    type: 'SNOW_FLAT',
  },
  {
    code: 'VSC1',
    label: 'Piz San Jon Dadaint',
    lon: 10.3391321077,
    lat: 46.7532597113,
    elevation: 3092.0,
    country_code: 'CH',
    canton_code: 'GR',
    type: 'WIND',
  },
  {
    code: 'MUT2',
    label: 'Mutten',
    lon: 9.0174835389,
    lat: 46.8587579889,
    elevation: 2481.0,
    country_code: 'CH',
    canton_code: 'GL',
    type: 'SNOW_FLAT',
  },
];

/**
 * SLF IMIS `/measurements`: the rolling window, newest last.
 *
 * DAV2 appears twice so the "newest row per station" reduction is exercised,
 * and MUT2 is absent from it entirely so a silent station is exercised too.
 */
export const SLF_MEASUREMENTS = [
  {
    station_code: 'DAV2',
    measure_date: '2026-10-08T22:30:00Z',
    HS: 4.95,
    TA_30MIN_MEAN: -0.672,
    RH_30MIN_MEAN: 95.9,
    TSS_30MIN_MEAN: -0.821,
    TS0_30MIN_MEAN: 4.428,
    TS25_30MIN_MEAN: -0.928,
    TS50_30MIN_MEAN: -0.964,
    TS100_30MIN_MEAN: -0.848,
    RSWR_30MIN_MEAN: 0.0,
    VW_30MIN_MEAN: null,
    VW_30MIN_MAX: null,
    DW_30MIN_MEAN: null,
    DW_30MIN_SD: null,
  },
  {
    station_code: 'DAV2',
    measure_date: '2026-10-08T23:00:00Z',
    HS: 10.7,
    TA_30MIN_MEAN: -0.704,
    RH_30MIN_MEAN: 95.9,
    TSS_30MIN_MEAN: -1.181,
    TS0_30MIN_MEAN: 4.382,
    TS25_30MIN_MEAN: -1.124,
    TS50_30MIN_MEAN: -1.138,
    TS100_30MIN_MEAN: -1.014,
    RSWR_30MIN_MEAN: 0.0,
    VW_30MIN_MEAN: null,
    VW_30MIN_MAX: null,
    DW_30MIN_MEAN: null,
    DW_30MIN_SD: null,
  },
  {
    station_code: 'VSC1',
    measure_date: '2026-10-08T23:00:00Z',
    HS: null,
    TA_30MIN_MEAN: -3.391,
    RH_30MIN_MEAN: 100.0,
    TSS_30MIN_MEAN: null,
    TS0_30MIN_MEAN: null,
    TS25_30MIN_MEAN: null,
    TS50_30MIN_MEAN: null,
    TS100_30MIN_MEAN: null,
    RSWR_30MIN_MEAN: null,
    VW_30MIN_MEAN: 2.419,
    VW_30MIN_MAX: 3.521,
    DW_30MIN_MEAN: 33.06,
    DW_30MIN_SD: 10.32,
  },
];

/**
 * `ogd-smn_meta_stations.csv`, header plus three rows.
 *
 * Semicolon separated. `Oberägeri` is here because the file is ISO-8859-1: the
 * proxy decodes the bytes explicitly, and reading it as UTF-8 mangles this row.
 */
export const SMN_METADATA_CSV = `station_abbr;station_name;station_canton;station_wigos_id;station_type_de;station_type_fr;station_type_it;station_type_en;station_dataowner;station_data_since;station_height_masl;station_height_barometer_masl;station_coordinates_lv95_east;station_coordinates_lv95_north;station_coordinates_wgs84_lat;station_coordinates_wgs84_lon;station_exposition_de;station_exposition_fr;station_exposition_it;station_exposition_en;station_url_de;station_url_fr;station_url_it;station_url_en
ZER;Zermatt;VS;0-20000-0-06748;Automatische Wetterstationen - Messwerte;Stations météorologiques automatiques - Valeurs mesurées;Stazioni meteorologiche automatiche - Valori misurati;Automatic weather stations - Measurement values;MeteoSchweiz, SLF;01.04.1892;1638.0;1640.0;2624298.0;1097574.0;46.029272;7.752433;Westhang;Versant ouest;Versante occidentale;western oriented slope;https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/messwerte-und-messnetze.html#param=messnetz-automatisch&station=ZER;https://www.meteosuisse.admin.ch/services-et-publications/applications/valeurs-mesurees-et-reseaux-de-mesure.html#param=messnetz-automatisch&station=ZER;https://www.meteosvizzera.admin.ch/servizi-e-pubblicazioni/applicazioni/valori-attuali-e-reti-di-misura.html#param=messnetz-automatisch&station=ZER;https://www.meteoswiss.admin.ch/services-and-publications/applications/measurement-values-and-measuring-networks.html#param=messnetz-automatisch&station=ZER
GOR;Gornergrat;VS;0-20000-0-06749;Automatische Wetterstationen - Messwerte;Stations météorologiques automatiques - Valeurs mesurées;Stazioni meteorologiche automatiche - Valori misurati;Automatic weather stations - Measurement values;MeteoSchweiz;28.07.1993;3129.0;3131.0;2626915.0;1092513.0;45.983644;7.785944;Gipfellage;Sommet;Vetta;crest;https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/messwerte-und-messnetze.html#param=messnetz-automatisch&station=GOR;https://www.meteosuisse.admin.ch/services-et-publications/applications/valeurs-mesurees-et-reseaux-de-mesure.html#param=messnetz-automatisch&station=GOR;https://www.meteosvizzera.admin.ch/servizi-e-pubblicazioni/applicazioni/valori-attuali-e-reti-di-misura.html#param=messnetz-automatisch&station=GOR;https://www.meteoswiss.admin.ch/services-and-publications/applications/measurement-values-and-measuring-networks.html#param=messnetz-automatisch&station=GOR
AEG;Oberägeri;ZG;0-20000-0-06676;Automatische Wetterstationen - Messwerte;Stations météorologiques automatiques - Valeurs mesurées;Stazioni meteorologiche automatiche - Valori misurati;Automatic weather stations - Measurement values;MeteoSchweiz;01.02.1993;724.0;;2688729.0;1220956.0;47.133636;8.608206;Ebene;Plaine;Pianura;plain;https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/messwerte-und-messnetze.html#param=messnetz-automatisch&station=AEG;https://www.meteosuisse.admin.ch/services-et-publications/applications/valeurs-mesurees-et-reseaux-de-mesure.html#param=messnetz-automatisch&station=AEG;https://www.meteosvizzera.admin.ch/servizi-e-pubblicazioni/applicazioni/valori-attuali-e-reti-di-misura.html#param=messnetz-automatisch&station=AEG;https://www.meteoswiss.admin.ch/services-and-publications/applications/measurement-values-and-measuring-networks.html#param=messnetz-automatisch&station=AEG
`;

/**
 * `VQHA80.csv`, header plus the same three stations.
 *
 * `Date` is `YYYYMMDDHHMM` in UTC, the wind columns are km/h, and `-` marks a
 * sensor the station does not carry.
 */
export const SMN_OBSERVATIONS_CSV = `Station/Location;Date;tre200s0;rre150z0;sre000z0;gre000z0;ure200s0;tde200s0;dkl010z0;fu3010z0;fu3010z1;prestas0;pp0qffs0;pp0qnhs0;ppz850s0;ppz700s0;dv1towz0;fu3towz0;fu3towz1;ta1tows0;uretows0;tdetows0
ZER;202610082310;5.00;0.00;0.00;3.00;90.90;3.60;229.00;0.40;1.80;836.90;-;1020.00;1512.70;-;-;-;-;-;-;-
GOR;202610082310;-3.10;-;0.00;0.00;100.00;-3.10;69.00;3.60;7.90;695.20;-;1021.10;-;3076.90;-;-;-;-;-;-
AEG;202610082310;-;-;-;-;-;-;68.00;7.20;21.20;-;-;-;-;-;-;-;-;-;-;-
`;

/**
 * GeoSphere `/metadata`: two active stations and one decommissioned one.
 *
 * The inactive station proves it is neither requested nor drawn.
 */
export const TAWES_METADATA = {
  title: 'TAWES',
  frequency: '10min',
  type: 'station',
  mode: 'current',
  parameters: [
    {
      name: 'DD',
      long_name: 'Windrichtung',
      desc: 'Windrichtung der letzten 10 Minuten',
      unit: '°',
    },
    {
      name: 'FF',
      long_name: 'Windgeschwindigkeit',
      desc: 'Windgeschwindigkeit über 10 Minuten',
      unit: 'm/s',
    },
    {
      name: 'FFX',
      long_name: 'Windspitze',
      desc: 'Windspitze der letzten 10 Minuten',
      unit: 'm/s',
    },
    {
      name: 'RF',
      long_name: 'Relative Feuchte',
      desc: 'Relative Feuchte 10 Minuten',
      unit: '%',
    },
    {
      name: 'RR',
      long_name: 'Niederschlag der letzten 10 Minuten',
      desc: 'Niederschlag der letzten 10 Minuten',
      unit: 'mm',
    },
    {
      name: 'SCHNEE',
      long_name: 'Schneehöhe',
      desc: 'Gesamtschneehöhe 10 Minuten aus Schneepegelmessung',
      unit: 'cm',
    },
    {
      name: 'TL',
      long_name: 'Lufttemperatur',
      desc: 'Lufttemperatur 10 Minuten',
      unit: '°C',
    },
  ],
  stations: [
    {
      type: 'INDIVIDUAL',
      id: '11069',
      name: 'SOELL',
      state: 'Tirol',
      lat: 47.503055555555555,
      lon: 12.200277777777776,
      altitude: 697.0,
      valid_from: '2015-04-30T00:00:00',
      valid_to: '2027-10-08T23:16:41',
      has_sunshine: false,
      has_global_radiation: false,
      is_active: true,
    },
    {
      type: 'INDIVIDUAL',
      id: '11001',
      name: 'WOLFSEGG',
      state: 'Oberösterreich',
      lat: 48.105555555555554,
      lon: 13.670833333333333,
      altitude: 635.0,
      valid_from: '1972-01-01T00:00:00',
      valid_to: '2027-10-08T23:16:41',
      has_sunshine: false,
      has_global_radiation: false,
      is_active: true,
    },
    {
      type: 'INDIVIDUAL',
      id: '11384',
      name: 'HIRSCHENKOGEL',
      state: 'Niederösterreich',
      lat: 47.623333333333335,
      lon: 15.833333333333334,
      altitude: 1318.0,
      valid_from: '1994-06-13T00:00:00',
      valid_to: '2025-05-21T00:00:00',
      has_sunshine: false,
      has_global_radiation: false,
      is_active: false,
    },
  ],
};

/**
 * GeoSphere observations across three timestamps.
 *
 * Three cases, which is the whole point of this fixture: one station reporting
 * at the newest slot, one reporting at the OLDEST slot, and one reporting
 * nothing at all. The third station is absent from metadata, so it also proves
 * the position falls back to the observation feature's own geometry.
 */
export const TAWES_OBSERVATIONS = {
  media_type: 'application/json',
  type: 'FeatureCollection',
  version: 'v1',
  timestamps: [
    '2026-10-05T10:30+00:00',
    '2026-10-08T23:20+00:00',
    '2026-10-08T23:30+00:00',
  ],
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [12.200277777777776, 47.503055555555555],
      },
      properties: {
        parameters: {
          TL: {
            name: 'Lufttemperatur',
            unit: '°C',
            data: [null, null, 8.9],
          },
          RF: {
            name: 'Relative Feuchte',
            unit: '%',
            data: [null, null, 82.0],
          },
          FF: {
            name: 'Windgeschwindigkeit',
            unit: 'm/s',
            data: [null, null, 3.9],
          },
          FFX: {
            name: 'Windspitze',
            unit: 'm/s',
            data: [null, null, 5.6],
          },
          DD: {
            name: 'Windrichtung',
            unit: '°',
            data: [null, null, 185.0],
          },
          RR: {
            name: 'Niederschlag der letzten 10 Minuten',
            unit: 'mm',
            data: [null, null, 0.0],
          },
          SCHNEE: {
            name: 'Schneehöhe',
            unit: 'cm',
            data: [null, null, 0.0],
          },
        },
        station: '11069',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [13.670833333333333, 48.105555555555554],
      },
      properties: {
        parameters: {
          TL: {
            name: 'Lufttemperatur',
            unit: '°C',
            data: [9.5, null, null],
          },
          RF: {
            name: 'Relative Feuchte',
            unit: '%',
            data: [89.0, null, null],
          },
          FF: {
            name: 'Windgeschwindigkeit',
            unit: 'm/s',
            data: [6.0, null, null],
          },
          FFX: {
            name: 'Windspitze',
            unit: 'm/s',
            data: [9.1, null, null],
          },
          DD: {
            name: 'Windrichtung',
            unit: '°',
            data: [283.0, null, null],
          },
          RR: {
            name: 'Niederschlag der letzten 10 Minuten',
            unit: 'mm',
            data: [0.0, null, null],
          },
          SCHNEE: {
            name: 'Schneehöhe',
            unit: 'cm',
            data: [null, null, null],
          },
        },
        station: '11001',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [12.200277777777776, 47.503055555555555],
      },
      properties: {
        parameters: {
          TL: {
            name: 'Lufttemperatur',
            unit: '°C',
            data: [null, null, null],
          },
          RF: {
            name: 'Relative Feuchte',
            unit: '%',
            data: [null, null, null],
          },
          FF: {
            name: 'Windgeschwindigkeit',
            unit: 'm/s',
            data: [null, null, null],
          },
          FFX: {
            name: 'Windspitze',
            unit: 'm/s',
            data: [null, null, null],
          },
          DD: {
            name: 'Windrichtung',
            unit: '°',
            data: [null, null, null],
          },
          RR: {
            name: 'Niederschlag der letzten 10 Minuten',
            unit: 'mm',
            data: [null, null, null],
          },
          SCHNEE: {
            name: 'Schneehöhe',
            unit: 'cm',
            data: [null, null, null],
          },
        },
        station: '11999',
      },
    },
  ],
};

/**
 * NRCS AWDB `/stations`, CUT FROM A LIVE RESPONSE on 2026-10-21.
 *
 * Three Colorado SNOTEL sites chosen for what they are missing, not for being
 * typical: Arapaho Ridge carries every sensor, Alta Lakes has no wind mast,
 * and Berthoud Summit has no snow-depth sensor at all. `elevation` is FEET and
 * `dataTimeZone` is the station's own standard-time offset, which is -8 for
 * the lower 48 and -9 in Alaska.
 */
export const SNOTEL_STATIONS = [
  {
    stationTriplet: '1030:CO:SNTL',
    name: 'Arapaho Ridge',
    stateCode: 'CO',
    networkCode: 'SNTL',
    latitude: 40.35098,
    longitude: -106.38141,
    elevation: 10960.0,
    countyName: 'Grand',
    dataTimeZone: -8.0,
    beginDate: '2002-08-01 00:00',
    endDate: '2100-01-01 00:00',
  },
  {
    stationTriplet: '1344:CO:SNTL',
    name: 'Alta Lakes',
    stateCode: 'CO',
    networkCode: 'SNTL',
    latitude: 37.88929,
    longitude: -107.84484,
    elevation: 11290.0,
    countyName: 'San Miguel',
    dataTimeZone: -8.0,
    beginDate: '2025-09-25 00:00',
    endDate: '2100-01-01 00:00',
  },
  {
    stationTriplet: '335:CO:SNTL',
    name: 'Berthoud Summit',
    stateCode: 'CO',
    networkCode: 'SNTL',
    latitude: 39.80364,
    longitude: -105.77786,
    elevation: 11300.0,
    countyName: 'Grand',
    dataTimeZone: -8.0,
    beginDate: '1963-09-01 00:00',
    endDate: '2100-01-01 00:00',
  },
];

/**
 * NRCS AWDB `/data`, the same three stations, same live response.
 *
 * Units are the API's own `storedUnitCode`: inches, degrees Fahrenheit and
 * miles per hour. Arapaho Ridge is the case that matters most — a calm, bare
 * station reading exactly 0 for wind speed, wind direction AND snow depth,
 * where treating absent as zero would be invisible.
 */
export const SNOTEL_DATA = [
  {
    stationTriplet: '1030:CO:SNTL',
    data: [
      el('RHUM', 'pct', 2, 91.0),
      el('SNWD', 'in', 0, 0),
      el('TOBS', 'degF', 1, 31.5),
      el('WDIRV', 'degree', 0, 0),
      el('WSPDV', 'mph', 1, 0.0),
      el('WTEQ', 'in', 1, 0.2),
    ],
  },
  {
    stationTriplet: '1344:CO:SNTL',
    data: [
      el('SNWD', 'in', 0, 4),
      el('TOBS', 'degF', 1, 36.9),
      el('WTEQ', 'in', 1, 1.6),
    ],
  },
  {
    stationTriplet: '335:CO:SNTL',
    data: [
      el('RHUM', 'pct', 2, 70.0),
      el('TOBS', 'degF', 1, 31.5),
      el('WDIRV', 'degree', 0, 65),
      el('WSPDV', 'mph', 1, 1.1),
      el('WTEQ', 'in', 1, 0.1),
    ],
  },
];

/** One AWDB element block, in the envelope shape the API really returns. */
function el(elementCode, storedUnitCode, dataPrecision, value) {
  return {
    stationElement: {
      elementCode,
      ordinal: 1,
      durationName: 'HOURLY',
      dataPrecision,
      storedUnitCode,
      originalUnitCode: storedUnitCode,
      beginDate: '2002-08-14 06:00',
      endDate: '2100-01-01 00:00',
      derivedData: false,
    },
    // The API returns the window asked for; the adapter takes the newest.
    values: [{ date: '2026-10-21 00:00', value }],
  };
}

/**
 * ECCC `swob-stations`, CUT FROM LIVE RESPONSES on 2026-10-22.
 *
 * Seven stations chosen for what they exercise rather than for being typical:
 *
 *   BANFF CS                minute cadence, three observations in the window
 *   NAKISKA RIDGETOP        the highest site at 2,450 m, hourly, so no snow
 *                           depth and no ten-minute precipitation
 *   CALGARY INT'L CS        publishes -1 cm of snow, which the record floors
 *   OLD CROW RCS            15 cm of snow in Yukon
 *   VERNON AUTO             newest file has no wind direction and the one six
 *                           minutes back does, so the column is filled
 *   TSAWWASSEN FERRY AUTO   newest file has no wind at all and the nearest
 *                           that does is 25 minutes back, so it stays absent
 *   SATURNA CAPMON          in the station list with no observation at all
 *
 * The last two entries come from the UNFILTERED station response, which the
 * fetcher never asks for, so the province and provider guards are exercised
 * against real rows: a NAV CANADA aerodrome inside the Cordillera, and an MSC
 * station in Ontario.
 */
export const ECCC_STATIONS = [
  stationFeature(
    '3050519',
    'BANFF CS',
    'Alberta',
    'MSC',
    [-115.55249, 51.193404, 1397.747],
  ),
  stationFeature(
    '305MGFF',
    'NAKISKA RIDGETOP',
    'Alberta',
    'MSC',
    [-115.191165, 50.943843, 2449.602],
  ),
  stationFeature(
    '3031094',
    "CALGARY INT'L CS",
    'Alberta',
    'MSC',
    [-114.000258, 51.109308, 1082.87],
  ),
  stationFeature(
    '2100805',
    'OLD CROW RCS',
    'Yukon',
    'MSC',
    [-139.844928, 67.567923, 250.662],
  ),
  stationFeature(
    '1128582',
    'VERNON AUTO',
    'British Columbia',
    'MSC',
    [-119.1936, 50.2233, 484.0],
  ),
  stationFeature(
    '1108291',
    'TSAWWASSEN FERRY AUTO',
    'British Columbia',
    'MSC',
    [-123.1333, 49.0039, 8.3],
  ),
  stationFeature(
    '1017099',
    'SATURNA CAPMON',
    'British Columbia',
    'MSC',
    [-123.128286, 48.775203, 179.5],
  ),
  stationFeature(
    '1060815',
    'Bella Bella Campbell Island',
    'British Columbia',
    'NAV CANADA',
    [-128.157, 52.1851, 43.0],
  ),
  stationFeature(
    '6150690',
    'BELLEVILLE QUINTE',
    'Ontario',
    'MSC',
    [-77.439842, 44.159363, 95.7],
  ),
];

/**
 * ECCC `swob-realtime`, the same live window, trimmed to the properties the
 * fetcher asks for and with `sortby=-date_tm-value` deliberately UNDONE.
 *
 * The live response arrives newest first. These rows are laid out of order on
 * purpose, because nothing may depend on that ordering: the adapter sorts per
 * station, and a reader that trusted the response order would take Banff's
 * 09:16 reading as current.
 *
 * The Parks Canada feature is in the same bbox and has no entry in the MSC
 * station list, which is how a partner network leaves the layer.
 */
export const ECCC_OBSERVATIONS = {
  type: 'FeatureCollection',
  numberMatched: 5274,
  features: [
    observationFeature({
      'msc_id-value': '3050519',
      'date_tm-value': '2026-10-22T09:16:00.000Z',
      air_temp: 2.8,
      snw_dpth: 0,
      rel_hum: 61,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 9.8,
      max_wnd_spd_10m_pst10mts: 15.5,
      avg_wnd_dir_10m_pst10mts: 195,
    }),
    observationFeature({
      'msc_id-value': '3050519',
      'date_tm-value': '2026-10-22T10:19:00.000Z',
      air_temp: 2.3,
      snw_dpth: 0,
      rel_hum: 64,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 8.2,
      max_wnd_spd_10m_pst10mts: 13.8,
      avg_wnd_dir_10m_pst10mts: 198,
    }),
    observationFeature({
      'msc_id-value': '3050519',
      'date_tm-value': '2026-10-22T10:18:00.000Z',
      air_temp: 2.3,
      snw_dpth: 0,
      rel_hum: 64,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 8.3,
      max_wnd_spd_10m_pst10mts: 13.8,
      avg_wnd_dir_10m_pst10mts: 197,
    }),
    observationFeature({
      'msc_id-value': '305MGFF',
      'date_tm-value': '2026-10-22T10:00:00.000Z',
      air_temp: 3.2,
      rel_hum: 50,
      avg_wnd_spd_10m_pst10mts: 43.3,
      max_wnd_spd_10m_pst10mts: 66.9,
      avg_wnd_dir_10m_pst10mts: 237,
    }),
    observationFeature({
      'msc_id-value': '3031094',
      'date_tm-value': '2026-10-22T10:19:00.000Z',
      air_temp: 2.5,
      snw_dpth: -1,
      rel_hum: 59,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 5.8,
      max_wnd_spd_10m_pst10mts: 9.9,
      avg_wnd_dir_10m_pst10mts: 292,
    }),
    observationFeature({
      'msc_id-value': '2100805',
      'date_tm-value': '2026-10-22T10:19:00.000Z',
      air_temp: -4.8,
      snw_dpth: 15,
      rel_hum: 88,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 8.8,
      max_wnd_spd_10m_pst10mts: 13.3,
      avg_wnd_dir_10m_pst10mts: 244,
    }),
    observationFeature({
      'msc_id-value': '1128582',
      'date_tm-value': '2026-10-22T10:19:00.000Z',
      air_temp: 5.1,
      rel_hum: 76,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 13.6,
      max_wnd_spd_10m_pst10mts: 20.7,
      avg_wnd_dir_10m_pst10mts: 107,
    }),
    observationFeature({
      'msc_id-value': '1128582',
      'date_tm-value': '2026-10-22T10:25:00.000Z',
      air_temp: 4.9,
      rel_hum: 77,
      pcpn_amt_pst10mts: 0,
      avg_wnd_spd_10m_pst10mts: 14.7,
      max_wnd_spd_10m_pst10mts: 21.2,
      avg_wnd_dir_10m_pst10mts: null,
    }),
    observationFeature({
      'msc_id-value': '1108291',
      'date_tm-value': '2026-10-22T10:00:00.000Z',
      avg_wnd_spd_10m_pst10mts: 2,
      max_wnd_spd_10m_pst10mts: 3.7,
      avg_wnd_dir_10m_pst10mts: 222,
    }),
    observationFeature({
      'msc_id-value': '1108291',
      'date_tm-value': '2026-10-22T10:25:00.000Z',
      avg_wnd_spd_10m_pst10mts: null,
      max_wnd_spd_10m_pst10mts: null,
      avg_wnd_dir_10m_pst10mts: null,
    }),
    observationFeature({
      'msc_id-value': 'PC-NRMB_CBA1F1D0',
      'date_tm-value': '2026-10-22T10:00:00.000Z',
      air_temp: 4.6,
      rel_hum: 70,
    }),
  ],
};

/** One `swob-stations` feature, in the envelope MSC GeoMet really returns. */
function stationFeature(mscId, name, province, provider, coordinates) {
  return {
    type: 'Feature',
    id: mscId,
    geometry: { type: 'Point', coordinates },
    properties: {
      msc_id: mscId,
      name,
      province_territory: province,
      data_provider: provider,
    },
  };
}

/**
 * One `swob-realtime` feature.
 *
 * `geometry` is null because the fetcher asks for `skipGeometry=true`: the
 * position is identity and comes from the station call, and the observation
 * window is five thousand features wide.
 */
function observationFeature(properties) {
  return {
    type: 'Feature',
    id: `${properties['date_tm-value']}-${properties['msc_id-value']}`,
    geometry: null,
    properties,
  };
}
