- Mountain Stations: added Environment and Climate Change Canada's SWOB
  network, the 160 automatic stations MSC operates in British Columbia, Alberta
  and Yukon, as a fifth network beside the Alpine three and SNOTEL. Keyless
  under ECCC's Data Services End-use Licence, already metric, joined through the
  same `/api/alpine-stations` proxy and drawn by the same markers and WEATHER
  rail card. Scoped to the Cordillera, and to the stations ECCC operates: the
  national feed also relays NAV CANADA and DND sites, whose rights the licence
  does not purport to grant. Canada declares no pressure, because `stn_pres` is
  station level and the payload reduces it to nothing else, and it publishes the
  ten-minute precipitation depth rather than the hourly accumulation the layer's
  scale would misread. Builds on #1311 and #0000 (darrendignam, #0001).
