export type Destination = {
  name: string;
  detail: string;
  kind: "City" | "Country";
};

const cityRows = [
  "Auckland|New Zealand",
  "Amsterdam|Netherlands",
  "Annapolis|United States",
  "Antibes|France",
  "Athens|Greece",
  "Barcelona|Spain",
  "Bath|United Kingdom",
  "Bergen|Norway",
  "Brighton|United Kingdom",
  "Brisbane|Australia",
  "Cagliari|Italy",
  "Cape Town|South Africa",
  "Cartagena|Colombia",
  "Charleston|United States",
  "Chichester|United Kingdom",
  "Copenhagen|Denmark",
  "Corfu|Greece",
  "Cowes|United Kingdom",
  "Dubrovnik|Croatia",
  "Falmouth|United Kingdom",
  "Fort Lauderdale|United States",
  "Funchal|Portugal",
  "Genoa|Italy",
  "Gibraltar|Gibraltar",
  "Göteborg|Sweden",
  "Hamilton|Bermuda",
  "Helsinki|Finland",
  "Honolulu|United States",
  "Ibiza|Spain",
  "Istanbul|Türkiye",
  "Key West|United States",
  "La Rochelle|France",
  "Las Palmas|Spain",
  "Lefkada|Greece",
  "Lisbon|Portugal",
  "Liverpool|United Kingdom",
  "Los Angeles|United States",
  "Marseille|France",
  "Melbourne|Australia",
  "Miami|United States",
  "Monaco|Monaco",
  "Naples|Italy",
  "Nassau|Bahamas",
  "Newport|United States",
  "Nice|France",
  "Oslo|Norway",
  "Palma|Spain",
  "Panama City|Panama",
  "Plymouth|United Kingdom",
  "Porto|Portugal",
  "Portsmouth|United Kingdom",
  "Reykjavík|Iceland",
  "Sausalito|United States",
  "Seattle|United States",
  "Singapore|Singapore",
  "Split|Croatia",
  "St. George’s|Grenada",
  "Stockholm|Sweden",
  "Sydney|Australia",
  "Tallinn|Estonia",
  "Tampa|United States",
  "Tokyo|Japan",
  "Trogir|Croatia",
  "Valencia|Spain",
  "Valletta|Malta",
  "Vancouver|Canada",
  "Venice|Italy",
  "Victoria|Canada",
  "Wellington|New Zealand",
];

const countryNames =
  "Albania,Algeria,Andorra,Angola,Antigua and Barbuda,Argentina,Armenia,Australia,Austria,Azerbaijan,Bahamas,Bahrain,Bangladesh,Barbados,Belarus,Belgium,Belize,Benin,Bhutan,Bolivia,Bosnia and Herzegovina,Botswana,Brazil,Brunei,Bulgaria,Burkina Faso,Burundi,Cabo Verde,Cambodia,Cameroon,Canada,Central African Republic,Chad,Chile,China,Colombia,Comoros,Costa Rica,Croatia,Cuba,Cyprus,Czechia,Denmark,Dominica,Dominican Republic,Ecuador,Egypt,El Salvador,Equatorial Guinea,Eritrea,Estonia,Eswatini,Ethiopia,Fiji,Finland,France,Gabon,Gambia,Georgia,Germany,Ghana,Greece,Grenada,Guatemala,Guinea,Guinea-Bissau,Guyana,Haiti,Honduras,Hungary,Iceland,India,Indonesia,Ireland,Israel,Italy,Ivory Coast,Jamaica,Japan,Jordan,Kazakhstan,Kenya,Kiribati,Kuwait,Kyrgyzstan,Laos,Latvia,Lebanon,Lesotho,Liberia,Libya,Liechtenstein,Lithuania,Luxembourg,Madagascar,Malawi,Malaysia,Maldives,Mali,Malta,Marshall Islands,Mauritania,Mauritius,Mexico,Micronesia,Moldova,Monaco,Mongolia,Montenegro,Morocco,Mozambique,Myanmar,Namibia,Nauru,Nepal,Netherlands,New Zealand,Nicaragua,Niger,Nigeria,North Korea,North Macedonia,Norway,Oman,Pakistan,Palau,Panama,Papua New Guinea,Paraguay,Peru,Philippines,Poland,Portugal,Qatar,Romania,Russia,Rwanda,Saint Kitts and Nevis,Saint Lucia,Saint Vincent and the Grenadines,Samoa,San Marino,São Tomé and Príncipe,Saudi Arabia,Senegal,Serbia,Seychelles,Sierra Leone,Singapore,Slovakia,Slovenia,Solomon Islands,Somalia,South Africa,South Korea,South Sudan,Spain,Sri Lanka,Sudan,Suriname,Sweden,Switzerland,Syria,Taiwan,Tajikistan,Tanzania,Thailand,Timor-Leste,Togo,Tonga,Trinidad and Tobago,Tunisia,Türkiye,Turkmenistan,Tuvalu,Uganda,Ukraine,United Arab Emirates,United Kingdom,United States,Uruguay,Uzbekistan,Vanuatu,Vatican City,Venezuela,Vietnam,Yemen,Zambia,Zimbabwe";

export const destinations: Destination[] = [
  ...cityRows.map((row) => {
    const [name, detail] = row.split("|");
    return { name, detail, kind: "City" as const };
  }),
  ...countryNames.split(",").map((name) => ({
    name,
    detail: "Country",
    kind: "Country" as const,
  })),
];
