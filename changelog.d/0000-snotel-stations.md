- Mountain Stations: added USDA NRCS SNOTEL, about 980 automatic snow-telemetry
  sites across thirteen western US states and Alaska, as a fourth network
  beside the three Alpine ones. Keyless and US public domain, hourly, joined
  through the same `/api/alpine-stations` proxy and drawn by the same markers
  and WEATHER rail card. The layer is renamed from Alpine Stations, since it no
  longer covers only the Alps. SNOTEL declares no precipitation: its `PREC`
  element is a season-to-date accumulation rather than the interval depth every
  other network publishes. Snow water equivalent, which SNOTEL exists to
  measure, is read from the feed and left for its own change. Builds on #1311
  (darrendignam, #0000).
