// Координаты для отображения стран на карте /countries/.
// Используются для Leaflet pins. Брать центр страны или ключевой город/регион
// (Москва vs Россия → берём столицу; Австралия-восток → Сидней).
// Источник: Wikipedia article coordinates / Google Maps centroids.

export const COORDS = {
  // Океания
  'australia-east':       { lat: -33.87, lng: 151.21 },  // Sydney
  'australia-north':      { lat: -12.46, lng: 130.84 },  // Darwin
  'new-zealand':          { lat: -41.29, lng: 174.78 },  // Wellington

  // Юго-Восточная Азия
  'bali':                 { lat: -8.34,  lng: 115.09 },  // Denpasar
  'sumatra-kalimantan':   { lat:  0.79,  lng: 113.92 },
  'raja-ampat':           { lat: -0.95,  lng: 130.51 },
  'thailand':             { lat: 13.76,  lng: 100.50 },  // Bangkok
  'vietnam':              { lat: 16.05,  lng: 108.21 },  // Da Nang
  'cambodia':             { lat: 13.41,  lng: 103.86 },  // Siem Reap
  'malaysia':             { lat:  3.14,  lng: 101.69 },  // Kuala Lumpur
  'singapore':            { lat:  1.35,  lng: 103.82 },
  'philippines':          { lat: 14.60,  lng: 120.98 },  // Manila

  // Восточная Азия
  'japan':                { lat: 35.68,  lng: 139.69 },  // Tokyo
  'china':                { lat: 39.90,  lng: 116.40 },  // Beijing
  'hainan':               { lat: 18.25,  lng: 109.50 },  // Sanya
  'south-korea':          { lat: 37.57,  lng: 126.98 },  // Seoul
  'mongolia':             { lat: 47.92,  lng: 106.92 },  // Ulaanbaatar

  // Южная Азия
  'india':                { lat: 28.61,  lng: 77.21 },   // Delhi
  'sri-lanka':            { lat:  7.29,  lng: 80.63 },   // Kandy
  'maldives':             { lat:  4.18,  lng: 73.51 },   // Male
  'nepal':                { lat: 27.71,  lng: 85.32 },   // Kathmandu

  // Африка и Ближний Восток
  'kenya':                { lat: -1.29,  lng: 36.82 },   // Nairobi
  'south-africa':         { lat: -33.92, lng: 18.42 },   // Cape Town
  'uganda':               { lat:  0.31,  lng: 32.58 },   // Kampala
  'tanzania':             { lat: -6.79,  lng: 39.21 },   // Dar es Salaam
  'morocco':              { lat: 31.63,  lng: -7.99 },   // Marrakech
  'egypt':                { lat: 27.18,  lng: 31.18 },   // Center / Luxor area
  'tunisia':              { lat: 36.81,  lng: 10.18 },   // Tunis
  'uae':                  { lat: 25.20,  lng: 55.27 },   // Dubai
  'jordan':               { lat: 30.32,  lng: 35.45 },   // Petra
  'turkey':               { lat: 41.01,  lng: 28.97 },   // Istanbul
  'israel':               { lat: 31.78,  lng: 35.21 },   // Jerusalem
  'iran':                 { lat: 32.65,  lng: 51.67 },   // Isfahan
  'madagascar':           { lat: -18.88, lng: 47.51 },   // Antananarivo
  'mauritius':            { lat: -20.34, lng: 57.55 },
  'seychelles':           { lat: -4.68,  lng: 55.49 },

  // Европа
  'georgia':              { lat: 41.72,  lng: 44.79 },   // Tbilisi
  'armenia':              { lat: 40.18,  lng: 44.51 },   // Yerevan
  'azerbaijan':           { lat: 40.41,  lng: 49.87 },   // Baku
  'serbia':               { lat: 44.79,  lng: 20.45 },   // Belgrade
  'croatia':              { lat: 43.51,  lng: 16.44 },   // Split
  'iceland':              { lat: 64.13,  lng: -21.82 },  // Reykjavik
  'norway':               { lat: 69.65,  lng: 18.96 },   // Tromsø
  'finland':              { lat: 60.17,  lng: 24.94 },   // Helsinki

  // Латам и Карибы
  'peru':                 { lat: -13.52, lng: -71.97 },  // Cusco
  'chile':                { lat: -33.45, lng: -70.66 },  // Santiago
  'chile-patagonia':      { lat: -50.95, lng: -73.41 },  // Torres del Paine
  'chile-fjords':         { lat: -45.40, lng: -72.69 },  // Aysén
  'bolivia':              { lat: -20.14, lng: -67.49 },  // Uyuni
  'ecuador':              { lat: -0.18,  lng: -78.47 },  // Quito
  'argentina':            { lat: -34.61, lng: -58.38 },  // Buenos Aires
  'brazil':               { lat: -22.91, lng: -43.17 },  // Rio
  'galapagos':            { lat: -0.74,  lng: -90.31 },
  'mexico':               { lat: 21.16,  lng: -86.85 },  // Cancun
  'cuba':                 { lat: 23.13,  lng: -82.38 },  // Havana
  'dominican-republic':   { lat: 18.50,  lng: -69.99 },  // Santo Domingo
  'costa-rica-panama':    { lat:  9.93,  lng: -84.08 },

  // Северная Америка
  'canada-east':          { lat: 45.42,  lng: -75.69 },  // Ottawa/Quebec area
  'canada-rockies':       { lat: 51.18,  lng: -115.57 }, // Banff

  // Полярные регионы
  'antarctica':           { lat: -64.85, lng: -63.10 },  // Antarctic Peninsula
  'greenland':            { lat: 64.18,  lng: -51.74 },  // Nuuk

  // СНГ
  'kazakhstan':           { lat: 43.22,  lng: 76.85 },   // Almaty
  'uzbekistan':           { lat: 39.65,  lng: 66.96 },   // Samarkand
  'kyrgyzstan':           { lat: 42.87,  lng: 74.59 },   // Bishkek
  'tajikistan':           { lat: 38.58,  lng: 68.79 },   // Dushanbe

  // Доп. Европа
  'switzerland':          { lat: 46.95,  lng: 7.45 },    // Bern
  'italy-north':          { lat: 45.46,  lng: 9.19 },    // Milan
  'italy-south':          { lat: 40.85,  lng: 14.27 },   // Naples
  'spain':                { lat: 41.39,  lng: 2.17 },    // Barcelona
  'greece':               { lat: 37.98,  lng: 23.73 },   // Athens

  // Доп. Азия
  'india-goa':            { lat: 15.30,  lng: 74.12 },
  'japan-hokkaido':       { lat: 43.07,  lng: 141.35 },  // Sapporo

  // Доп. Северная Америка
  'usa':                  { lat: 36.17,  lng: -115.14 }, // Las Vegas / Vegas region
  'guatemala-belize':     { lat: 17.25,  lng: -89.61 },  // Tikal
};
