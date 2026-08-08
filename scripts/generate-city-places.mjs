/**
 * Generates large curated place catalogs for NYC extras + major US cities.
 * Run: node scripts/generate-city-places.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "src", "lib", "places", "data");

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function score(slug, base) {
  const h = hash(slug);
  const wobble = (n, spread) =>
    Math.max(55, Math.min(99, Math.round(n + ((h >> (spread % 16)) % 17) - 8)));
  return {
    travellerSatisfaction: wobble(base.sat ?? 88, 1),
    popularity: wobble(base.pop ?? 85, 2),
    value: wobble(base.val ?? 82, 3),
    uniqueness: wobble(base.uni ?? 84, 4),
    convenience: wobble(base.con ?? 80, 5),
    familyAppeal: wobble(base.fam ?? 78, 6),
    firstTimerValue: wobble(base.first ?? 86, 7),
    walkingDemand: wobble(base.walk ?? 55, 8),
  };
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emitPlace(p, cityKey) {
  const slug = p.slug || slugify(p.name);
  const tags = JSON.stringify(p.tags);
  const bestFor = JSON.stringify(p.bestFor);
  const factors = score(`${cityKey}:${slug}`, p.base || {});
  const factorLines = Object.entries(factors)
    .map(([k, v]) => `      ${k}: ${v},`)
    .join("\n");
  return `  place({
    slug: "${slug}",
    name: ${JSON.stringify(p.name)},
    summary: ${JSON.stringify(p.summary)},
    neighborhood: ${JSON.stringify(p.neighborhood)},
    cost: "${p.cost}",
    typicalCostLabel: ${JSON.stringify(p.costLabel)},
    durationLabel: ${JSON.stringify(p.duration)},
    bestFor: ${bestFor},
    tags: ${tags},
    factors: {
${factorLines}
    },
    viatorQuery: ${JSON.stringify(p.viator || p.name)},
  })`;
}

function writeCityFile(fileName, exportName, cityKey, places, headerNote) {
  const body = places.map((p) => emitPlace(p, cityKey)).join(",\n");
  const content = `import { place, type CityPlace } from "@/lib/places/types";

/** ${headerNote} */
export const ${exportName}: CityPlace[] = [
${body}
];
`;
  fs.writeFileSync(path.join(outDir, fileName), content, "utf8");
  console.log(`Wrote ${fileName} (${places.length} places)`);
}

fs.mkdirSync(outDir, { recursive: true });

const nycExtra = [
  ["The Cloisters", "Upper Manhattan", "Medieval art in a castle overlooking the Hudson — a quiet, otherworldly Met branch.", "paid", "Museum ticket", "2–3 hours", ["Culture", "Couples"], ["culture", "history", "first-time", "photography"], { sat: 93, pop: 78, uni: 95, walk: 60 }],
  ["New York Botanical Garden", "Bronx", "Seasonal blooms and Conservatory spectacle — worth the trip uptown.", "paid", "From ~$35", "3–4 hours", ["Families", "Nature"], ["family", "walking", "photography"], { fam: 92, val: 80, walk: 70 }],
  ["Bronx Zoo", "Bronx", "One of the world’s great zoos — plan a full day with kids.", "paid", "From ~$40", "4–6 hours", ["Families"], ["family", "first-time"], { fam: 95, pop: 88, walk: 75 }],
  ["Coney Island Boardwalk", "Brooklyn", "Classic boardwalk energy — rides, hot dogs, and Atlantic air.", "under_50", "Boardwalk free; rides extra", "3–5 hours", ["Families", "Groups"], ["family", "food", "walking", "evening"], { pop: 86, val: 90, walk: 65 }],
  ["Smorgasburg", "Brooklyn", "Weekend outdoor food market — arrive hungry and early.", "under_50", "Pay per stall", "2–3 hours", ["Food lovers", "Groups"], ["food", "family"], { sat: 91, pop: 89, fam: 85 }],
  ["Domino Park", "Williamsburg", "Waterfront lawns with Manhattan skyline — sunset favorite.", "free", "Free", "1–2 hours", ["Couples", "Families"], ["free", "views", "couples", "family", "photography"], { val: 96, walk: 40 }],
  ["Brooklyn Museum", "Brooklyn", "Major collection without Midtown crowds — strong special exhibitions.", "paid", "From ~$20", "2–3 hours", ["Culture"], ["culture", "rainy-day", "history"], { uni: 88, con: 82 }],
  ["DUMBO Waterfront", "Brooklyn", "Bridge views, cobblestones, and photo ops — combine with Brooklyn Bridge.", "free", "Free", "1–2 hours", ["Photography", "Couples"], ["free", "views", "photography", "couples", "walking"], { pop: 92, first: 90 }],
  ["Green-Wood Cemetery", "Brooklyn", "Hilltop historic cemetery with skyline views — surprisingly peaceful.", "free", "Free", "2–3 hours", ["Walking", "History"], ["free", "history", "walking", "photography"], { uni: 91, walk: 70 }],
  ["Industry City", "Brooklyn", "Food halls, makers, and waterfront — good half-day outside tourist core.", "under_50", "Free to wander", "2–4 hours", ["Food lovers", "Groups"], ["food", "shopping", "walking"], { val: 88, con: 78 }],
  ["Governors Island", "Harbor", "Car-free harbor island with skyline views — ferries weekends/seasonal.", "under_50", "Ferry fare", "3–5 hours", ["Families", "Couples"], ["family", "views", "walking", "photography"], { uni: 90, fam: 88, walk: 75 }],
  ["Staten Island Ferry", "Harbor", "Free Statue glimpses and harbor breeze — no ticket stress.", "free", "Free", "1–2 hours", ["First-time visitors", "Free"], ["free", "first-time", "views", "family"], { val: 99, first: 93, pop: 90 }],
  ["Ellis Island Immigration Museum", "Harbor", "Immigration story next to Liberty — often paired on ferry tickets.", "paid", "Ferry package", "2–3 hours", ["History", "Families"], ["history", "first-time", "family", "culture"], { uni: 94, first: 92 }],
  ["The Battery", "Battery Park", "Harbor park, Castle Clinton, and ferry queues — orientation zone.", "free", "Free", "1 hour", ["First-time visitors"], ["free", "first-time", "walking", "views"], { con: 90, val: 95 }],
  ["Stone Street", "Financial District", "Cobblestone dining street — easy evening after Downtown sights.", "paid", "Meal cost", "1–2 hours", ["Food lovers", "Couples"], ["food", "evening", "couples", "nightlife"], { sat: 87, pop: 84 }],
  ["Seaport District", "South Street Seaport", "Waterfront piers, shops, and skyline — lighter Downtown stop.", "under_50", "Free to wander", "1–2 hours", ["Families", "Couples"], ["family", "shopping", "views", "walking"], { con: 88, fam: 84 }],
  ["Oculus / World Trade Center", "Financial District", "Calatrava transit hall and mall — rainy-day Downtown hub.", "free", "Free to enter", "45–90 min", ["Rainy day", "Shopping"], ["free", "shopping", "rainy-day", "architecture"], { pop: 88, con: 90 }],
  ["Trinity Church", "Wall Street", "Historic church and graveyard in the financial canyon.", "free", "Free", "30–60 min", ["History"], ["free", "history", "culture"], { uni: 82, walk: 25 }],
  ["Federal Hall", "Wall Street", "Where Washington took the oath — quick history hit.", "free", "Free", "30–60 min", ["History"], ["free", "history", "first-time"], { first: 85 }],
  ["New York Stock Exchange exterior", "Wall Street", "Iconic facade photos — trading floor not public.", "free", "Free (exterior)", "20–40 min", ["First-time visitors"], ["free", "first-time", "photography"], { pop: 86, first: 88 }],
  ["Chinatown walking & dumplings", "Chinatown", "Streets, bakeries, and cheap plates — go hungry.", "under_50", "Meals under $20", "2–3 hours", ["Food lovers"], ["food", "walking", "culture"], { sat: 92, val: 94, pop: 90 }],
  ["Little Italy stroll", "Little Italy", "Touristy but festive — gelato and evening lights.", "under_50", "Treats vary", "1–2 hours", ["Couples", "Families"], ["food", "evening", "family", "couples"], { pop: 80, fam: 82 }],
  ["Essex Market", "Lower East Side", "Indoor market stalls — easy food crawl any weather.", "under_50", "Pay per stall", "1–2 hours", ["Food lovers"], ["food", "rainy-day", "family"], { val: 90, con: 88 }],
  ["The Shed", "Hudson Yards", "Contemporary culture venue — check what’s on.", "paid", "Show/exhibit pricing", "2–3 hours", ["Culture"], ["culture", "evening", "rainy-day"], { uni: 86 }],
  ["Vessel (exterior & area)", "Hudson Yards", "Landmark honeycomb — climb rules vary; plaza still worth a look.", "under_50", "Plaza free; climb may ticket", "45–90 min", ["Photography", "First-time visitors"], ["photography", "first-time", "views"], { pop: 85, first: 84 }],
  ["Intrepid Museum", "Pier 86", "Aircraft carrier museum on the Hudson — strong with kids.", "paid", "From ~$36", "2–4 hours", ["Families"], ["family", "history", "rainy-day"], { fam: 93, pop: 87 }],
  ["USS Growler Submarine", "Pier 86", "Cold War sub tour beside Intrepid — tight, memorable.", "paid", "Often with Intrepid", "45–75 min", ["Families", "History"], ["family", "history"], { uni: 89, fam: 80 }],
  ["Museum of Broadway", "Theater District", "Broadway history deep-dive before a show.", "paid", "From ~$40", "1–2 hours", ["Culture", "First-time visitors"], ["culture", "history", "rainy-day", "evening"], { first: 88, uni: 85 }],
  ["TKTS Booth", "Times Square", "Same-day discount tickets — line strategy required.", "paid", "Discounted show tickets", "30–90 min wait", ["First-time visitors"], ["evening", "first-time", "culture"], { val: 90, con: 70 }],
  ["Diamond District stroll", "Midtown", "47th Street sparkle — window shopping spectacle.", "free", "Free to browse", "30–60 min", ["Shopping"], ["free", "shopping", "walking"], { pop: 78 }],
  ["Paley Center for Media", "Midtown", "TV and radio archives — niche rainy-day gem.", "paid", "Admission fee", "1–2 hours", ["Culture", "Rainy day"], ["culture", "rainy-day"], { uni: 84 }],
  ["Museum of the City of New York", "UES", "City story museum on Museum Mile — underrated.", "paid", "From ~$20", "2 hours", ["History", "Families"], ["history", "culture", "family", "rainy-day"], { uni: 87, fam: 84 }],
  ["Jewish Museum", "UES", "Art and Jewish culture on Fifth Avenue.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture"], ["culture", "history", "rainy-day"], { uni: 86 }],
  ["Cooper Hewitt", "UES", "Design museum in a Carnegie mansion — interactive and stylish.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture", "Couples"], ["culture", "rainy-day", "couples"], { uni: 88, sat: 90 }],
  ["Frick Madison / Frick Collection", "UES", "Old Masters in an intimate setting — check current venue.", "paid", "Timed tickets", "1.5–2 hours", ["Culture", "Couples"], ["culture", "rainy-day", "couples"], { uni: 92, sat: 93 }],
  ["Rubin Museum area / Chelsea", "Chelsea", "Himalayan art heritage and Chelsea galleries nearby.", "paid", "Varies", "1–2 hours", ["Culture"], ["culture", "rainy-day"], { uni: 85 }],
  ["Chelsea Galleries crawl", "Chelsea", "Warehouse gallery circuit — free entry many spaces.", "free", "Usually free", "2–3 hours", ["Culture", "Couples"], ["free", "culture", "walking", "couples"], { val: 95, uni: 86, walk: 60 }],
  ["Meatpacking District evening", "Meatpacking", "Dinner, cobbles, and High Line access — nightlife-adjacent.", "paid", "Dinner pricing", "2–3 hours", ["Couples", "Nightlife"], ["evening", "nightlife", "couples", "food"], { pop: 88, sat: 86 }],
  ["Abrazo / West Village jazz night", "West Village", "Small-club jazz energy — book ahead when possible.", "paid", "Cover + drinks", "2–3 hours", ["Couples", "Nightlife"], ["nightlife", "evening", "couples", "culture"], { uni: 90, sat: 91 }],
  ["Washington Square Park", "Greenwich Village", "Arch, performers, and NYU buzz — classic Village pause.", "free", "Free", "45–90 min", ["Everyone"], ["free", "family", "walking", "first-time"], { pop: 90, val: 97, fam: 88 }],
  ["Strand Bookstore", "East Village / Union Sq", "Miles of books — rainy-day treasure hunt.", "free", "Free to browse", "1–2 hours", ["Rainy day", "Solo travellers"], ["free", "rainy-day", "shopping", "culture"], { uni: 89, val: 92 }],
  ["Union Square Greenmarket", "Union Square", "Farmers market days — seasonal produce and snacks.", "under_50", "Pay per vendor", "1–2 hours", ["Food lovers", "Families"], ["food", "family", "walking"], { val: 90, fam: 86 }],
  ["Flatiron Building exterior", "Flatiron", "Iconic wedge building — quick photo stop.", "free", "Free (exterior)", "15–30 min", ["First-time visitors", "Photography"], ["free", "first-time", "photography", "history"], { first: 90, pop: 88 }],
  ["Madison Square Park", "Flatiron", "Shake Shack origin park — lawn and public art.", "free", "Free", "45–90 min", ["Families", "Food lovers"], ["free", "family", "food", "walking"], { fam: 88, val: 94 }],
  ["Korean BBQ in Koreatown", "Koreatown", "32nd Street grill tables — group-friendly feast.", "paid", "Shared meals", "1.5–2.5 hours", ["Food lovers", "Groups"], ["food", "nightlife", "evening"], { sat: 92, pop: 89 }],
  ["Spa Castle day or Midtown spa reset", "Queens / Midtown", "Soft-reset spa day when the city intensity peaks.", "paid", "Day pass pricing", "3–5 hours", ["Couples", "Relax"], ["couples", "rainy-day"], { sat: 88, walk: 20, fam: 60 }],
  ["Queens Night Market", "Queens", "Seasonal night market — global street food.", "under_50", "Pay per stall", "2–3 hours", ["Food lovers", "Groups"], ["food", "evening", "family", "nightlife"], { sat: 91, val: 93, pop: 86 }],
  ["Flushing food crawl", "Queens", "One of America’s great Chinese food destinations.", "under_50", "Meals under $25", "2–4 hours", ["Food lovers"], ["food", "culture", "walking"], { sat: 95, val: 96, uni: 92 }],
  ["MoMA PS1", "Long Island City", "Contemporary art in LIC — combine with waterfront views.", "paid", "Admission fee", "1.5–3 hours", ["Culture"], ["culture", "rainy-day"], { uni: 90 }],
  ["Gantry Plaza State Park", "Long Island City", "Manhattan skyline across the East River — sunset gold.", "free", "Free", "1–2 hours", ["Couples", "Photography"], ["free", "views", "couples", "photography", "walking"], { val: 97, uni: 88, walk: 40 }],
  ["Roosevelt Island Tram", "East River", "Cable car over the river — views without a helicopter.", "under_50", "MetroCard/OMNY fare", "1–2 hours", ["Families", "First-time visitors"], ["family", "views", "first-time", "photography"], { first: 91, fam: 90, uni: 89 }],
  ["Socrates Sculpture Park", "Queens", "Outdoor sculpture with skyline backdrop — free.", "free", "Free", "1–2 hours", ["Families", "Culture"], ["free", "family", "culture", "views", "walking"], { val: 95, fam: 86 }],
  ["Arthur Avenue Little Italy", "Bronx", "Real-deal Italian markets and bakeries — less touristy.", "under_50", "Meals vary", "2–3 hours", ["Food lovers"], ["food", "culture", "walking"], { sat: 93, uni: 90, val: 91 }],
  ["Yankee Stadium tour or game", "Bronx", "Baseball cathedral — tour days or catch a game.", "paid", "Tour/game pricing", "2–4 hours", ["Families", "Groups"], ["family", "first-time", "evening"], { pop: 90, fam: 88, first: 87 }],
  ["Wave Hill", "Bronx", "Gardens and Hudson views — serene Bronx escape.", "paid", "Admission fee", "2–3 hours", ["Couples", "Families"], ["family", "couples", "walking", "photography"], { uni: 91, sat: 92, walk: 55 }],
  ["Dyckman Farmhouse Museum", "Inwood", "Colonial farmhouse remnant — quick history stop uptown.", "under_50", "Small fee / free days", "45–90 min", ["History"], ["history", "family"], { uni: 84 }],
  ["Inwood Hill Park", "Inwood", "Old-growth forest feel at Manhattan’s tip — local favorite.", "free", "Free", "2–3 hours", ["Walking", "Families"], ["free", "family", "walking", "photography"], { val: 96, walk: 75, uni: 88 }],
  ["Columbia University campus walk", "Morningside Heights", "Classic campus and Low Library steps.", "free", "Free", "45–90 min", ["Walking", "History"], ["free", "walking", "history", "photography"], { walk: 45, val: 94 }],
  ["Cathedral of St. John the Divine", "Morningside Heights", "Vast unfinished cathedral — awe without Midtown prices.", "under_50", "Suggested donation", "1–1.5 hours", ["History", "Culture"], ["history", "culture", "rainy-day"], { uni: 93, sat: 90 }],
  ["Riverside Park walk", "UWS", "Hudson-side path from Midtown toward UWS — golden hour.", "free", "Free", "1–3 hours", ["Walking", "Couples"], ["free", "walking", "couples", "views"], { val: 95, walk: 70 }],
  ["Lincoln Center plaza & fountain", "Lincoln Center", "Performing arts campus — free plaza, ticketed shows.", "free", "Plaza free", "30–90 min", ["Culture", "Evening"], ["free", "culture", "evening", "photography"], { pop: 86, con: 88 }],
  ["American Folk Art Museum", "Lincoln Center area", "Compact folk art — easy add-on near Lincoln Center.", "free", "Often free/pay-what-you-wish", "1 hour", ["Culture"], ["culture", "rainy-day", "free"], { uni: 85, val: 93 }],
  ["Time Out Market New York", "DUMBO / Brooklyn", "Food hall with skyline adjacency — flexible grazing.", "under_50", "Pay per stall", "1–2 hours", ["Food lovers", "Groups"], ["food", "family"], { con: 90, val: 86 }],
  ["Brookfield Place Winter Garden", "Battery Park City", "Palm atrium and waterfront — rainy-day Downtown.", "free", "Free", "45–90 min", ["Rainy day", "Families"], ["free", "rainy-day", "family", "shopping"], { con: 92, fam: 85 }],
  ["Hudson River Park bike stretch", "West Side", "Citi Bike the west side greenway — skyline on your left.", "under_50", "Bike share", "1–3 hours", ["Couples", "Groups"], ["walking", "views", "couples"], { sat: 90, walk: 40, val: 88 }],
  ["Levain Bakery cookie run", "UWS / multiple", "Giant cookies — touristy and still delicious.", "under_50", "A few dollars", "20–40 min", ["Food lovers", "Families"], ["food", "family"], { sat: 89, pop: 91, val: 85 }],
  ["Magnolia Bakery classic", "West Village", "Cupcake icon — short stop on a Village loop.", "under_50", "Treat pricing", "20–40 min", ["Families", "Couples"], ["food", "family", "couples"], { pop: 88 }],
  ["Joe’s Pizza slice", "Multiple", "Classic NY slice benchmark — cheap and fast.", "under_50", "A few dollars", "15–30 min", ["Food lovers", "Everyone"], ["food", "first-time"], { val: 96, sat: 90, first: 88 }],
  ["Russ & Daughters appetizing", "LES / multiple", "Bagels and smoked fish counter culture.", "under_50", "Counter prices", "30–60 min", ["Food lovers"], ["food", "culture", "history"], { uni: 90, sat: 92 }],
  ["Katz’s Delicatessen", "Lower East Side", "Pastrami institution — share a sandwich.", "paid", "Hearty sandwich pricing", "45–90 min", ["Food lovers", "First-time visitors"], ["food", "first-time", "history"], { pop: 94, first: 92, sat: 90 }],
  ["Peter Luger (Brooklyn classic)", "Williamsburg", "Old-school steakhouse pilgrimage — cash culture lore.", "paid", "Steakhouse pricing", "1.5–2.5 hours", ["Food lovers", "Groups"], ["food", "evening"], { pop: 90, sat: 88, uni: 86 }],
  ["Comedy cellar / Village comedy", "Greenwich Village", "Tight rooms, big names — book ahead.", "paid", "Ticket + minimums", "1.5–2.5 hours", ["Nightlife", "Couples"], ["nightlife", "evening", "couples"], { sat: 91, uni: 87 }],
  ["House of Yes or Brooklyn nightlife", "Brooklyn", "Creative club nights — check calendar.", "paid", "Cover varies", "3–5 hours", ["Nightlife"], ["nightlife", "evening"], { uni: 88, sat: 86 }],
  ["Silent disco / rooftop seasonal", "Various", "Seasonal rooftop parties — skyline soundtrack.", "paid", "Ticketed", "2–4 hours", ["Nightlife", "Groups"], ["nightlife", "evening", "views"], { pop: 84, uni: 85 }],
  ["Ice skating Bryant Park or Rink", "Midtown / seasonal", "Seasonal rink energy under Midtown lights.", "paid", "Skate rental", "1–2 hours", ["Families", "Couples"], ["family", "couples", "evening"], { fam: 90, pop: 88 }],
  ["Holiday windows & Midtown lights", "Fifth Avenue", "Seasonal window displays — free spectacle.", "free", "Free", "1–2 hours", ["Families", "First-time visitors"], ["free", "family", "first-time", "evening", "shopping"], { first: 92, fam: 91, pop: 90 }],
  ["New Year’s Eve Times Square (viewing)", "Times Square", "Bucket-list chaos — only if you love crowds.", "free", "Free (hard)", "Many hours", ["First-time visitors", "Groups"], ["free", "first-time", "evening", "nightlife"], { pop: 95, con: 40, first: 85 }],
  ["Brooklyn Heights Promenade", "Brooklyn Heights", "Skyline bench views — classic quiet overlook.", "free", "Free", "45–90 min", ["Couples", "Photography"], ["free", "views", "couples", "photography", "walking"], { val: 97, sat: 93 }],
  ["Red Hook waterfront", "Red Hook", "Warehouses, harbor, and distilleries — off-path Brooklyn.", "under_50", "Free to wander", "2–3 hours", ["Walking", "Food lovers"], ["walking", "food", "photography"], { uni: 89, walk: 65 }],
  ["Jane’s Carousel", "DUMBO", "Glass pavilion carousel with bridge views — family photo magnet.", "under_50", "Ride tickets", "30–60 min", ["Families"], ["family", "photography", "views"], { fam: 92, pop: 86 }],
  ["New Museum", "Lower East Side", "Contemporary tower on the Bowery — bold shows.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture"], ["culture", "rainy-day"], { uni: 90, sat: 88 }],
  ["International Center of Photography", "LES", "Photography-focused museum — strong temp exhibits.", "paid", "Admission fee", "1–2 hours", ["Culture", "Photography"], ["culture", "photography", "rainy-day"], { uni: 87 }],
  ["Poster House", "Chelsea", "Poster design museum — niche and delightful.", "paid", "Admission fee", "1–1.5 hours", ["Culture"], ["culture", "rainy-day"], { uni: 88, val: 85 }],
  ["Museum of Arts and Design", "Columbus Circle", "Craft and design overlooking the Circle.", "paid", "Admission fee", "1.5–2 hours", ["Culture"], ["culture", "rainy-day", "shopping"], { uni: 86, con: 88 }],
  ["Columbus Circle & Time Warner shops", "Columbus Circle", "Plaza, shops, and Central Park gate — orientation hub.", "free", "Free to wander", "45–90 min", ["Shopping", "First-time visitors"], ["free", "shopping", "first-time"], { con: 92, pop: 87 }],
  ["Hearst Tower exterior", "Midtown West", "Modern green tower — architecture glance.", "free", "Free (exterior)", "15–30 min", ["Photography"], ["free", "photography"], { uni: 80 }],
  ["Museum of Illusions", "Multiple", "Selfie-heavy illusion rooms — fun with teens.", "paid", "Ticketed", "1–1.5 hours", ["Families", "Groups"], ["family", "photography", "rainy-day"], { fam: 88, pop: 85 }],
  ["Spyscape", "Midtown", "Interactive spy museum — competitive fun.", "paid", "Ticketed", "1.5–2 hours", ["Families", "Groups"], ["family", "rainy-day"], { fam: 87, uni: 86 }],
  ["Color Factory / immersive pop-ups", "Various", "Rotating immersive photo experiences — check what’s open.", "paid", "Ticketed", "1–1.5 hours", ["Families", "Groups"], ["family", "photography", "rainy-day"], { pop: 84, fam: 86 }],
  ["Artechouse NYC", "Chelsea Market area", "Digital art immersion — rainy-day wow.", "paid", "Ticketed", "1 hour", ["Families", "Couples"], ["family", "couples", "rainy-day", "photography"], { uni: 87, fam: 85 }],
  ["Pier 57 rooftop park", "Chelsea", "Elevated park and market pier — newer West Side stop.", "free", "Free park access", "1–2 hours", ["Families", "Views"], ["free", "family", "views", "food"], { con: 88, fam: 86 }],
  ["Little Island sunset", "Hudson River Park", "Sculptural pier park — golden hour favorite.", "free", "Free", "1–2 hours", ["Couples", "Photography"], ["free", "couples", "views", "photography", "evening"], { sat: 92, uni: 91 }],
].map(([name, neighborhood, summary, cost, costLabel, duration, bestFor, tags, base]) => ({
  name,
  neighborhood,
  summary,
  cost,
  costLabel,
  duration,
  bestFor,
  tags,
  base,
}));

writeCityFile(
  "nyc-extra.ts",
  "nycExtraPlaces",
  "nyc",
  nycExtra,
  "Additional New York places merged into the live NYC scoreboard.",
);

function cityList(rows) {
  return rows.map(
    ([name, neighborhood, summary, cost, costLabel, duration, bestFor, tags, base, viator]) => ({
      name,
      neighborhood,
      summary,
      cost,
      costLabel,
      duration,
      bestFor,
      tags,
      base,
      viator,
    }),
  );
}

const la = cityList([
  ["Griffith Observatory", "Los Feliz", "Free hilltop views of the Hollywood Sign and Downtown — go for sunset.", "free", "Free", "2–3 hours", ["First-time visitors", "Couples"], ["free", "views", "first-time", "photography", "couples"], { first: 96, val: 99, pop: 95 }],
  ["Hollywood Walk of Fame", "Hollywood", "Star-studded sidewalks — touristy, still a first-timer checkbox.", "free", "Free", "1–2 hours", ["First-time visitors"], ["free", "first-time", "walking", "photography"], { first: 88, pop: 92, con: 85 }],
  ["Griffith Park trails", "Griffith Park", "Urban wilderness hikes with city overlooks.", "free", "Free", "2–4 hours", ["Walking", "Families"], ["free", "walking", "family", "views"], { walk: 80, val: 96 }],
  ["Santa Monica Pier", "Santa Monica", "Pacific Park rides and ocean air — classic LA beach day.", "under_50", "Pier free; rides extra", "2–4 hours", ["Families", "Couples"], ["family", "couples", "views", "walking", "evening"], { fam: 92, pop: 93 }],
  ["Santa Monica State Beach", "Santa Monica", "Wide sand and bike path — easygoing coast time.", "free", "Free (parking extra)", "2–4 hours", ["Families", "Couples"], ["free", "family", "couples", "walking"], { val: 95, fam: 90 }],
  ["Venice Beach Boardwalk", "Venice", "Muscle Beach, murals, skatepark — eccentric coast energy.", "free", "Free", "2–3 hours", ["First-time visitors", "Walking"], ["free", "first-time", "walking", "photography"], { pop: 90, uni: 88 }],
  ["Abbot Kinney Boulevard", "Venice", "Shops, coffee, and LA style — browse and graze.", "under_50", "Window shop free", "2–3 hours", ["Shopping", "Couples"], ["shopping", "food", "couples", "walking"], { sat: 90 }],
  ["The Getty Center", "Brentwood", "Architecture, gardens, and art with tram arrival — outstanding free museum.", "free", "Free (parking fee)", "3–5 hours", ["Culture", "Families"], ["free", "culture", "family", "views", "photography"], { sat: 95, val: 98, uni: 94 }],
  ["Getty Villa", "Pacific Palisades", "Roman-inspired villa museum on the coast — timed tickets.", "free", "Free timed entry", "2–3 hours", ["Culture", "History"], ["free", "culture", "history", "views"], { uni: 95, sat: 93 }],
  ["Los Angeles County Museum of Art", "Miracle Mile", "Broad LA art campus — pair with nearby museums.", "paid", "Admission fee", "2–4 hours", ["Culture"], ["culture", "rainy-day"], { sat: 90, pop: 88 }],
  ["La Brea Tar Pits", "Miracle Mile", "Ice Age fossils in the middle of the city — great with kids.", "paid", "Museum ticket", "2–3 hours", ["Families"], ["family", "history", "rainy-day"], { fam: 93, uni: 92 }],
  ["Petersen Automotive Museum", "Miracle Mile", "Car culture temple — glossy and fun.", "paid", "Admission fee", "2–3 hours", ["Families", "Groups"], ["family", "rainy-day", "culture"], { fam: 90, uni: 89 }],
  ["Academy Museum of Motion Pictures", "Miracle Mile", "Cinema history done big — film lovers’ stop.", "paid", "Admission fee", "2–3 hours", ["Culture", "First-time visitors"], ["culture", "rainy-day", "first-time"], { first: 91, uni: 90 }],
  ["Hollywood Bowl", "Hollywood", "Outdoor amphitheater shows under the hills — check calendar.", "paid", "Ticketed", "3–4 hours", ["Evening", "Couples"], ["evening", "culture", "couples"], { sat: 94, uni: 91 }],
  ["Universal Studios Hollywood", "Universal City", "Theme park + studio tram — full-day energy.", "paid", "Park tickets", "6–10 hours", ["Families"], ["family", "first-time"], { fam: 94, pop: 95, first: 92 }],
  ["Warner Bros. Studio Tour", "Burbank", "Soundstages and backlot — more intimate than Universal.", "paid", "Tour tickets", "2–3 hours", ["Families", "Culture"], ["family", "culture", "first-time"], { uni: 90, sat: 92 }],
  ["Runyon Canyon", "Hollywood Hills", "Celebrity-adjacent hike with city views — go early.", "free", "Free", "1–2 hours", ["Walking", "Views"], ["free", "walking", "views", "photography"], { walk: 85, pop: 88 }],
  ["Mulholland Drive overlooks", "Hollywood Hills", "Nighttime city carpet views — classic drive.", "free", "Free", "45–90 min", ["Couples", "Views"], ["free", "views", "couples", "evening", "photography"], { sat: 93, uni: 90 }],
  ["Rodeo Drive window walk", "Beverly Hills", "Luxury window shopping — free spectacle.", "free", "Free to browse", "1–2 hours", ["Shopping", "First-time visitors"], ["free", "shopping", "first-time", "walking"], { first: 86, pop: 87 }],
  ["Beverly Gardens Park", "Beverly Hills", "Beverly Hills sign photos and palm promenade.", "free", "Free", "30–60 min", ["Photography"], ["free", "photography", "walking"], { pop: 84 }],
  ["The Broad", "Downtown", "Free contemporary museum — Yayoi and beyond; line early.", "free", "Free timed tickets", "1.5–2.5 hours", ["Culture"], ["free", "culture", "rainy-day", "first-time"], { val: 97, sat: 92, pop: 91 }],
  ["Walt Disney Concert Hall", "Downtown", "Gehry steel curves — tour or catch a performance.", "under_50", "Exterior free; shows ticketed", "1–3 hours", ["Culture", "Photography"], ["culture", "photography", "evening"], { uni: 94, sat: 91 }],
  ["Grand Central Market", "Downtown", "Historic food hall — LA grazing central.", "under_50", "Pay per stall", "1–2 hours", ["Food lovers"], ["food", "first-time"], { sat: 92, val: 90, pop: 90 }],
  ["Angels Flight Railway", "Downtown", "Tiny historic funicular — quick novelty ride.", "under_50", "Small fare", "15–30 min", ["Families", "History"], ["family", "history", "first-time"], { uni: 88, fam: 85 }],
  ["OUE Skyspace LA", "Downtown", "Glass slide and skyline decks.", "paid", "Ticketed", "1–2 hours", ["Views", "Couples"], ["views", "couples", "photography", "evening"], { pop: 86, first: 88 }],
  ["Staples Center / Crypto.com Arena area", "Downtown", "Sports and concert district energy on event nights.", "paid", "Event tickets", "3–4 hours", ["Evening", "Groups"], ["evening", "nightlife"], { pop: 88 }],
  ["LACMA Lights / Urban Light", "Miracle Mile", "Lamp-post art installation — free night photos.", "free", "Free", "30–60 min", ["Photography", "Couples"], ["free", "photography", "couples", "evening"], { pop: 93, sat: 91 }],
  ["Malibu Pier & Surfrider vibe", "Malibu", "Pier stroll and surf culture — Pacific postcard.", "free", "Free", "2–3 hours", ["Couples", "Views"], ["free", "couples", "views", "walking"], { sat: 92, uni: 88 }],
  ["El Matador State Beach", "Malibu", "Sea caves and stacks — golden hour magic.", "under_50", "Parking fee", "2–3 hours", ["Couples", "Photography"], ["couples", "photography", "views", "walking"], { uni: 94, sat: 95, walk: 60 }],
  ["Huntington Library & Gardens", "San Marino", "Gardens, art, and rare books — full half-day.", "paid", "Admission fee", "3–5 hours", ["Families", "Culture"], ["family", "culture", "walking", "photography"], { sat: 94, fam: 90, uni: 92 }],
  ["Pasadena Old Town", "Pasadena", "Walkable dining and shops east of Downtown LA.", "under_50", "Free to wander", "2–3 hours", ["Food lovers", "Couples"], ["food", "shopping", "couples", "walking"], { con: 88 }],
  ["Rose Bowl area / flea market days", "Pasadena", "Stadium icon; flea market Sundays are a scene.", "under_50", "Event pricing varies", "2–4 hours", ["Shopping", "Groups"], ["shopping", "walking"], { uni: 86, pop: 84 }],
  ["Olvera Street", "Downtown", "Historic Mexican marketplace — colorful and touristy.", "under_50", "Free to enter", "1–2 hours", ["Families", "Food lovers"], ["family", "food", "history", "culture"], { first: 88, fam: 87 }],
  ["Korean BBQ in Koreatown", "Koreatown", "Late-night grill culture — LA essential.", "paid", "Shared meals", "1.5–2.5 hours", ["Food lovers", "Nightlife"], ["food", "nightlife", "evening"], { sat: 94, pop: 91 }],
  ["Arts District murals & coffee", "Arts District", "Street art and specialty coffee warehouses.", "under_50", "Coffee/food costs", "2–3 hours", ["Photography", "Couples"], ["photography", "food", "walking", "couples"], { uni: 88, sat: 89 }],
  ["Echo Park Lake", "Echo Park", "Paddleboats and downtown views — neighborhood favorite.", "under_50", "Boat rental optional", "1–2 hours", ["Couples", "Families"], ["family", "couples", "views", "walking"], { sat: 90, fam: 88 }],
  ["Silver Lake Reservoir walk", "Silver Lake", "Hip neighborhood loop — cafes after.", "free", "Free", "1–2 hours", ["Walking", "Couples"], ["free", "walking", "couples"], { walk: 55, sat: 88 }],
  ["Dodger Stadium game", "Echo Park area", "Baseball with skyline sunsets — classic LA night.", "paid", "Game tickets", "3–4 hours", ["Families", "Groups"], ["family", "evening", "first-time"], { pop: 90, fam: 89 }],
  ["Paramount Studio lot exterior vibe", "Hollywood", "Studio-adjacent Hollywood — tours when available.", "paid", "Tour pricing", "2 hours", ["Culture"], ["culture", "first-time"], { first: 85 }],
  ["Original Farmers Market & The Grove", "Fairfax", "Historic stalls meeting polished outdoor mall.", "under_50", "Free to wander", "2–3 hours", ["Families", "Food lovers"], ["family", "food", "shopping"], { fam: 91, con: 90 }],
]);

writeCityFile("los-angeles.ts", "losAngelesPlaces", "la", la, "Los Angeles TIW scoreboard places.");

const chicago = cityList([
  ["Millennium Park & Cloud Gate", "Loop", "The Bean and pavilion — free downtown icon.", "free", "Free", "1–2 hours", ["First-time visitors", "Families"], ["free", "first-time", "family", "photography"], { first: 97, pop: 96, val: 99 }],
  ["Art Institute of Chicago", "Loop", "World-class museum — lions out front, masterpieces inside.", "paid", "Admission fee", "3–4 hours", ["Culture"], ["culture", "rainy-day", "first-time"], { sat: 96, uni: 95, first: 94 }],
  ["Willis Tower Skydeck", "Loop", "Glass ledge views over the Midwest’s biggest skyline.", "paid", "Ticketed", "1–2 hours", ["Views", "Families"], ["views", "family", "first-time", "photography"], { first: 93, pop: 92 }],
  ["360 CHICAGO / John Hancock", "Streeterville", "Tilt and skyline — Mag Mile vantage.", "paid", "Ticketed", "1–2 hours", ["Views", "Couples"], ["views", "couples", "photography", "evening"], { sat: 90 }],
  ["Navy Pier", "Streeterville", "Ferris wheel and lakefront — touristy family staple.", "under_50", "Pier free; rides extra", "2–4 hours", ["Families"], ["family", "views", "evening"], { fam: 90, pop: 89 }],
  ["Chicago Riverwalk", "River North / Loop", "Layered river promenade — architecture cruise adjacent.", "free", "Free", "1–2 hours", ["Walking", "Couples"], ["free", "walking", "couples", "views"], { sat: 92, val: 96 }],
  ["Architecture River Cruise", "Chicago River", "The best way to learn the skyline story.", "paid", "Cruise tickets", "1.5 hours", ["First-time visitors", "Culture"], ["first-time", "culture", "history", "views"], { first: 96, uni: 94, sat: 95 }],
  ["Magnificent Mile window walk", "Near North", "Michigan Avenue shopping spine.", "free", "Free to browse", "1–3 hours", ["Shopping"], ["free", "shopping", "walking", "first-time"], { pop: 88 }],
  ["Lincoln Park Zoo", "Lincoln Park", "Free major zoo on the north side.", "free", "Free", "2–4 hours", ["Families"], ["free", "family"], { fam: 95, val: 99 }],
  ["Lincoln Park Conservatory", "Lincoln Park", "Palm house calm — free greenhouse escape.", "free", "Free", "45–90 min", ["Families", "Couples"], ["free", "family", "couples", "rainy-day"], { fam: 88, val: 96 }],
  ["Wrigley Field tour or game", "Wrigleyville", "Ivy walls and rooftop lore — baseball cathedral.", "paid", "Tour/game", "2–4 hours", ["Families", "Groups"], ["family", "evening", "first-time"], { pop: 91, fam: 90 }],
  ["Garfield Park Conservatory", "West Side", "Vast plant conservatory — underrated gem.", "free", "Free / donation", "1.5–2.5 hours", ["Families", "Couples"], ["free", "family", "couples", "rainy-day"], { uni: 90, val: 97 }],
  ["Museum of Science and Industry", "Hyde Park", "Huge hands-on museum — U-boat included.", "paid", "Admission fee", "3–5 hours", ["Families"], ["family", "rainy-day"], { fam: 96, uni: 93 }],
  ["Field Museum", "Museum Campus", "Sue the T. rex and global collections.", "paid", "Admission fee", "2–4 hours", ["Families", "Culture"], ["family", "culture", "history", "rainy-day"], { fam: 94, sat: 92 }],
  ["Shedd Aquarium", "Museum Campus", "Lakefront aquarium — penguins and belugas.", "paid", "Admission fee", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 93, pop: 90 }],
  ["Adler Planetarium", "Museum Campus", "Sky shows and lake edge skyline photos.", "paid", "Admission fee", "1.5–2.5 hours", ["Families"], ["family", "rainy-day", "views"], { fam: 90, uni: 88 }],
  ["Oak Street Beach", "Gold Coast", "Urban beach with skyline backdrop.", "free", "Free", "1–3 hours", ["Couples", "Views"], ["free", "couples", "views"], { sat: 89 }],
  ["North Avenue Beach", "Lincoln Park", "Classic lakefront summer scene.", "free", "Free", "2–4 hours", ["Families"], ["free", "family", "views"], { fam: 88 }],
  ["Logan Square Boulevard eats", "Logan Square", "Craft food and bars — neighborhood night.", "paid", "Dinner pricing", "2–3 hours", ["Food lovers", "Nightlife"], ["food", "nightlife", "evening"], { sat: 91 }],
  ["West Loop restaurant row", "West Loop", "One of America’s best dining corridors.", "paid", "Dinner pricing", "2–3 hours", ["Food lovers", "Couples"], ["food", "couples", "evening"], { sat: 95, pop: 92 }],
  ["The Second City", "Old Town", "Improv comedy institution — book ahead.", "paid", "Tickets", "2 hours", ["Nightlife", "Couples"], ["nightlife", "evening", "couples", "culture"], { uni: 92, sat: 93 }],
  ["Chicago Cultural Center", "Loop", "Tiffany dome and free exhibitions — civic beauty.", "free", "Free", "45–90 min", ["Culture", "Rainy day"], ["free", "culture", "rainy-day", "history"], { uni: 91, val: 98 }],
  ["Chicago Theatre marquee photo", "Loop", "Iconic marquee — shows when scheduled.", "free", "Exterior free", "15–30 min", ["Photography"], ["free", "photography", "evening"], { pop: 85 }],
  ["Millennium Park ice rink (seasonal)", "Loop", "Seasonal rink under the skyline.", "paid", "Skate fee", "1–2 hours", ["Families", "Couples"], ["family", "couples", "evening"], { fam: 89 }],
  ["606 Trail", "Logan / Wicker / Bucktown", "Elevated park trail across north neighborhoods.", "free", "Free", "1–2 hours", ["Walking"], ["free", "walking", "views"], { walk: 70, val: 95 }],
  ["Pilsen murals walk", "Pilsen", "Street art and Mexican culture corridor.", "free", "Free", "1.5–2.5 hours", ["Culture", "Photography"], ["free", "culture", "walking", "photography"], { uni: 90 }],
  ["Chinatown Square", "Chinatown", "Gates, snacks, and plaza life.", "under_50", "Food costs", "1–2 hours", ["Food lovers", "Families"], ["food", "family", "culture"], { sat: 88, fam: 86 }],
  ["Promontory Point", "Hyde Park", "Lake stone ledge with downtown views south.", "free", "Free", "1–2 hours", ["Couples", "Views"], ["free", "couples", "views", "photography"], { uni: 89, sat: 91 }],
  ["University of Chicago campus", "Hyde Park", "Gothic campus wander — free.", "free", "Free", "1–2 hours", ["Walking", "History"], ["free", "walking", "history", "photography"], { walk: 50 }],
  ["Fulton Market daytime browse", "West Loop", "Markets turning into dining district — daytime charm.", "under_50", "Free to wander", "1–2 hours", ["Food lovers"], ["food", "walking"], { sat: 88 }],
]);

writeCityFile("chicago.ts", "chicagoPlaces", "chi", chicago, "Chicago TIW scoreboard places.");

const miami = cityList([
  ["South Beach & Ocean Drive", "Miami Beach", "Art Deco hotels and beach parade — Miami postcard.", "free", "Beach free", "2–4 hours", ["First-time visitors", "Couples"], ["free", "first-time", "couples", "views", "walking", "photography"], { first: 95, pop: 96 }],
  ["Art Deco Historic District walk", "Miami Beach", "Pastel architecture stroll — morning light best.", "free", "Free", "1–2 hours", ["Culture", "Photography"], ["free", "culture", "history", "photography", "walking"], { uni: 92, sat: 91 }],
  ["Lummus Park Beach", "South Beach", "Central sandy stretch — umbrellas and volleyball energy.", "free", "Free", "2–5 hours", ["Families", "Couples"], ["free", "family", "couples"], { fam: 90 }],
  ["Wynwood Walls", "Wynwood", "Outdoor street art museum — vibrant and photogenic.", "under_50", "Entry fee for walls", "1.5–2.5 hours", ["Photography", "Culture"], ["culture", "photography", "first-time"], { pop: 93, uni: 91, first: 92 }],
  ["Wynwood food & brewery hop", "Wynwood", "Murals plus food halls and craft bars.", "paid", "Meals/drinks", "2–3 hours", ["Food lovers", "Nightlife"], ["food", "nightlife", "evening"], { sat: 90 }],
  ["Vizcaya Museum & Gardens", "Coconut Grove", "European-style estate on Biscayne Bay.", "paid", "Admission fee", "2–3 hours", ["Couples", "Culture"], ["culture", "history", "couples", "photography"], { uni: 95, sat: 94 }],
  ["Pérez Art Museum Miami", "Downtown", "Bayfront contemporary museum with hanging gardens.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture"], ["culture", "rainy-day", "views"], { sat: 90, uni: 89 }],
  ["Frost Science Museum", "Downtown", "Aquarium + planetarium downtown — strong with kids.", "paid", "Admission fee", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 93 }],
  ["Bayfront Park", "Downtown", "Waterfront lawns and skyline — event-ready plaza.", "free", "Free", "1 hour", ["Walking", "Views"], ["free", "views", "walking"], { val: 92 }],
  ["Little Havana – Calle Ocho", "Little Havana", "Cuban coffee, domino park, and cigar culture.", "under_50", "Snacks cheap", "2–3 hours", ["Food lovers", "Culture"], ["food", "culture", "walking", "music"], { uni: 93, sat: 92, first: 91 }],
  ["Versailles Restaurant", "Little Havana", "Iconic Cuban cafeteria — go for the window.", "under_50", "Hearty plates", "1 hour", ["Food lovers"], ["food", "first-time"], { pop: 90, sat: 89 }],
  ["Design District stroll", "Design District", "Luxury design shops and public art.", "free", "Free to browse", "1–2 hours", ["Shopping", "Couples"], ["free", "shopping", "couples", "walking"], { sat: 88 }],
  ["Coconut Grove village", "Coconut Grove", "Shady streets, bay, and cafes — softer Miami.", "under_50", "Free to wander", "2–3 hours", ["Couples", "Families"], ["couples", "family", "walking", "food"], { sat: 90 }],
  ["Key Biscayne beaches", "Key Biscayne", "Calmer sand and parks a bridge away.", "under_50", "Park fees possible", "3–5 hours", ["Families"], ["family", "views", "walking"], { fam: 91, uni: 86 }],
  ["Everglades airboat day trip", "Everglades", "Mangroves and gators — signature South Florida.", "paid", "Tour pricing", "Half day", ["Families", "First-time visitors"], ["family", "first-time"], { uni: 96, first: 94, fam: 90 }],
  ["Bayside Marketplace", "Downtown", "Touristy harbor shopping — ferry connections.", "under_50", "Free to enter", "1–2 hours", ["Families", "Shopping"], ["family", "shopping", "views"], { pop: 84 }],
  ["Brickell City Centre", "Brickell", "Polished mall and nightlife adjacent.", "under_50", "Free to browse", "1–2 hours", ["Shopping", "Nightlife"], ["shopping", "nightlife", "evening"], { con: 90 }],
  ["Sunset at South Pointe Park", "South Beach", "Jetty views where cruise ships glide by.", "free", "Free", "1–1.5 hours", ["Couples", "Views"], ["free", "couples", "views", "evening", "photography"], { sat: 94, uni: 90 }],
  ["Faena District beach stroll", "Mid-Beach", "Dramatic architecture along Collins.", "free", "Free", "1 hour", ["Photography", "Couples"], ["free", "photography", "couples", "walking"], { uni: 88 }],
  ["Jungle Island", "Watson Island", "Animal experiences between Miami and the Beach.", "paid", "Ticketed", "2–3 hours", ["Families"], ["family"], { fam: 86 }],
  ["Miami Beach Boardwalk bike", "Miami Beach", "Paved beachfront path — rent bikes.", "under_50", "Bike rental", "1–2 hours", ["Couples", "Families"], ["family", "couples", "views", "walking"], { sat: 91 }],
  ["Española Way", "South Beach", "Pedestrian dining lane — evening buzz.", "paid", "Dinner pricing", "1.5–2.5 hours", ["Food lovers", "Couples"], ["food", "couples", "evening"], { sat: 88 }],
  ["Superblue Miami", "Allapattah", "Immersive art experiences — ticketed wow.", "paid", "Ticketed", "1–2 hours", ["Families", "Couples"], ["family", "couples", "photography", "rainy-day"], { uni: 90, fam: 88 }],
  ["Museum of Graffiti", "Wynwood", "Street art history next to the walls.", "paid", "Admission fee", "1 hour", ["Culture"], ["culture", "rainy-day"], { uni: 87 }],
  ["Matheson Hammock Park", "Coral Gables", "Atoll pool beach and mangroves — local favorite.", "under_50", "Parking/entry", "2–4 hours", ["Families"], ["family", "views"], { fam: 92, uni: 88 }],
]);

writeCityFile("miami.ts", "miamiPlaces", "mia", miami, "Miami TIW scoreboard places.");

const vegas = cityList([
  ["Las Vegas Strip walk (night)", "Strip", "Neon canyon walk — the essential Vegas free show.", "free", "Free", "2–4 hours", ["First-time visitors", "Couples"], ["free", "first-time", "evening", "nightlife", "walking", "photography"], { first: 98, pop: 98, sat: 94 }],
  ["Bellagio Fountains", "Strip", "Choreographed water show — free and iconic.", "free", "Free", "30–60 min", ["Everyone"], ["free", "first-time", "evening", "couples", "family"], { first: 96, pop: 97, fam: 93 }],
  ["Fremont Street Experience", "Downtown", "LED canopy, zip lines, and old-school Vegas.", "free", "Free (zip extra)", "2–3 hours", ["Nightlife", "First-time visitors"], ["free", "nightlife", "evening", "first-time"], { pop: 92, uni: 90 }],
  ["High Roller observation wheel", "Strip", "Giant wheel views over the valley.", "paid", "Ticketed", "1 hour", ["Views", "Couples"], ["views", "couples", "photography", "evening"], { sat: 90, first: 89 }],
  ["The Venetian canals", "Strip", "Indoor gondolas and San Marco vibes — AC paradise.", "under_50", "Walk free; gondola extra", "1–2 hours", ["Families", "Couples"], ["family", "couples", "rainy-day"], { fam: 90, pop: 91 }],
  ["Conservatory at Bellagio", "Strip", "Seasonal floral displays — free wow.", "free", "Free", "30–60 min", ["Families", "Couples"], ["free", "family", "couples", "photography"], { sat: 92, val: 98 }],
  ["Sphere exterior & shows", "Strip area", "Sci-fi orb landmark — check residence shows.", "paid", "Show tickets", "2–3 hours", ["First-time visitors", "Culture"], ["first-time", "evening", "culture"], { uni: 97, pop: 95 }],
  ["Red Rock Canyon scenic drive", "West of Strip", "Desert sandstone loop — sunrise recommended.", "under_50", "Vehicle fee", "Half day", ["Couples", "Walking"], ["couples", "walking", "views", "photography"], { uni: 95, sat: 94, walk: 50 }],
  ["Hoover Dam day trip", "East of Vegas", "Engineering icon on the Colorado — half-day tour classic.", "under_50", "Tour/parking fees", "Half day", ["Families", "History"], ["family", "history", "first-time"], { first: 93, uni: 94 }],
  ["Neon Museum", "Downtown", "Boneyard of vintage signs — magical at night tours.", "paid", "Ticketed", "1–1.5 hours", ["Culture", "Photography"], ["culture", "history", "photography", "evening"], { uni: 96, sat: 93 }],
  ["Meow Wolf Omega Mart", "Area15", "Surreal immersive art mart — weird in the best way.", "paid", "Ticketed", "1.5–2.5 hours", ["Families", "Groups"], ["family", "photography", "rainy-day"], { uni: 95, fam: 90 }],
  ["Area15 complex", "West of Strip", "Immersive playground — Omega Mart plus more.", "under_50", "Some free areas", "2–3 hours", ["Groups", "Nightlife"], ["nightlife", "photography"], { uni: 92 }],
  ["Casino floor people-watching", "Strip", "Buzz without gambling big — walk and gawk.", "free", "Free to walk", "1–2 hours", ["First-time visitors"], ["free", "first-time", "nightlife", "evening"], { first: 90, pop: 92 }],
  ["Pool day at a Strip resort", "Strip", "Daybed culture — hotel guest or day pass.", "paid", "Day pass pricing", "3–6 hours", ["Couples", "Groups"], ["couples", "nightlife"], { sat: 88 }],
  ["Cirque du Soleil show", "Strip", "Peak Vegas spectacle — book popular titles early.", "paid", "Show tickets", "2 hours", ["Couples", "Families"], ["evening", "culture", "couples", "family"], { sat: 96, uni: 95 }],
  ["Secret Pizza at Cosmopolitan", "Strip", "Hidden late-night pizza — ask around.", "under_50", "Cheap slices", "30–60 min", ["Food lovers", "Nightlife"], ["food", "nightlife", "evening"], { uni: 90, sat: 91 }],
  ["Eataly Las Vegas", "Park MGM", "Italian market grazing indoors.", "under_50", "Pay per stall", "1–2 hours", ["Food lovers"], ["food", "rainy-day"], { sat: 89 }],
  ["Park MGM / Park Theater area", "Strip", "Less smoke, more dining — modern Strip pocket.", "under_50", "Free to wander", "1–2 hours", ["Food lovers"], ["food", "walking"], { con: 88 }],
  ["Welcome to Fabulous Las Vegas sign", "South Strip", "Classic photo stop — go early for fewer crowds.", "free", "Free", "20–40 min", ["Photography", "First-time visitors"], ["free", "photography", "first-time"], { first: 92, pop: 90 }],
  ["Lake Mead overlook", "East of Vegas", "Reservoir views near Hoover Dam corridor.", "free", "Free overlooks", "1–2 hours", ["Views", "Couples"], ["free", "views", "couples", "photography"], { uni: 88 }],
  ["Seven Magic Mountains", "South of Vegas", "Stacked neon boulders in the desert — quick photo stop.", "free", "Free", "30–60 min", ["Photography"], ["free", "photography"], { uni: 91, pop: 86 }],
  ["Downtown Arts District First Friday", "Downtown", "Gallery crawl nights — local creative Vegas.", "free", "Free", "2–3 hours", ["Culture", "Nightlife"], ["free", "culture", "nightlife", "evening"], { uni: 88 }],
  ["Mob Museum", "Downtown", "Crime history museum — surprisingly excellent.", "paid", "Admission fee", "2 hours", ["History", "Culture"], ["history", "culture", "rainy-day"], { sat: 92, uni: 91 }],
  ["Atomic Museum", "East Las Vegas", "Nuclear test history — unique to the region.", "paid", "Admission fee", "1.5–2 hours", ["History"], ["history", "rainy-day"], { uni: 90 }],
  ["Shark Reef Aquarium", "Mandalay Bay", "Unexpected Strip aquarium — rainy-day plan B.", "paid", "Ticketed", "1–2 hours", ["Families"], ["family", "rainy-day"], { fam: 88 }],
]);

writeCityFile("las-vegas.ts", "lasVegasPlaces", "vegas", vegas, "Las Vegas TIW scoreboard places.");

const sf = cityList([
  ["Golden Gate Bridge walk/view", "Marina / Vista Point", "Iconic span — Battery Spencer for the classic photo.", "free", "Free", "1–3 hours", ["First-time visitors", "Photography"], ["free", "first-time", "views", "photography", "walking"], { first: 98, pop: 97 }],
  ["Alcatraz Island", "Bay", "Ferry + audio tour of the Rock — book weeks ahead.", "paid", "Ferry ticket", "2.5–3.5 hours", ["History", "First-time visitors"], ["history", "first-time", "views"], { first: 95, uni: 96, sat: 94 }],
  ["Fisherman’s Wharf & Pier 39", "Waterfront", "Sea lions, chowder, and bay breeze — touristy fun.", "under_50", "Free to wander", "2–3 hours", ["Families"], ["family", "food", "first-time"], { fam: 90, pop: 92 }],
  ["Cable car ride", "Powell / Hyde", "Hills and bells — iconic transit experience.", "under_50", "Muni fare/tickets", "30–60 min", ["First-time visitors", "Families"], ["first-time", "family", "history"], { first: 94, fam: 91 }],
  ["Chinatown Gate & streets", "Chinatown", "Oldest Chinatown in North America — snacks and alleys.", "under_50", "Free to wander", "1–2 hours", ["Food lovers", "Culture"], ["food", "culture", "walking"], { sat: 90 }],
  ["Muir Woods day trip", "Marin", "Coastal redwoods — go early for parking/shuttle.", "under_50", "Reservation/parking", "Half day", ["Families", "Nature"], ["family", "walking"], { uni: 95, fam: 92, walk: 70 }],
  ["Painted Ladies & Alamo Square", "Alamo Square", "Postcard Victorians with skyline backdrop.", "free", "Free", "30–60 min", ["Photography", "First-time visitors"], ["free", "photography", "first-time"], { first: 93, pop: 91 }],
  ["Golden Gate Park", "Richmond / Sunset", "DeYoung, Academy, and meadows — city lungs.", "free", "Park free; museums ticketed", "3–5 hours", ["Families"], ["free", "family", "walking"], { fam: 93, val: 96 }],
  ["California Academy of Sciences", "Golden Gate Park", "Rainforest dome, aquarium, planetarium — rainy-day king.", "paid", "Admission fee", "2–4 hours", ["Families"], ["family", "rainy-day"], { fam: 95, uni: 92 }],
  ["de Young Museum", "Golden Gate Park", "Fine arts with tower views over the park.", "paid", "Admission fee", "2–3 hours", ["Culture"], ["culture", "rainy-day", "views"], { sat: 90 }],
  ["Lands End & Sutro Baths", "Outer Richmond", "Cliff paths and ruins above the Pacific.", "free", "Free", "1.5–2.5 hours", ["Walking", "Couples"], ["free", "walking", "couples", "views", "photography"], { uni: 93, sat: 92, walk: 75 }],
  ["Twin Peaks overlook", "Twin Peaks", "360° city views — windy and worth it.", "free", "Free", "45–90 min", ["Views", "Couples"], ["free", "views", "couples", "photography"], { sat: 91 }],
  ["Ferry Building Marketplace", "Embarcadero", "Food hall facing the bay — oysters and bread.", "under_50", "Pay per stall", "1–2 hours", ["Food lovers"], ["food", "views"], { sat: 93, val: 88 }],
  ["Coit Tower", "North Beach", "Murals and bay views above Telegraph Hill.", "under_50", "Elevator fee", "1–1.5 hours", ["Views", "History"], ["views", "history", "photography"], { uni: 88 }],
  ["North Beach espresso & streets", "North Beach", "Italian-American cafes and bookstore culture.", "under_50", "Coffee/food", "1–2 hours", ["Food lovers", "Couples"], ["food", "couples", "walking", "culture"], { sat: 90 }],
  ["Mission District murals & burritos", "Mission", "Street art and mission burritos — essential.", "under_50", "Cheap eats", "2–3 hours", ["Food lovers", "Culture"], ["food", "culture", "walking", "photography"], { sat: 92, uni: 90 }],
  ["Oracle Park game", "South Beach", "Bay-side baseball — kayaks chase home runs.", "paid", "Game tickets", "3–4 hours", ["Families", "Groups"], ["family", "evening", "views"], { fam: 90, sat: 91 }],
  ["Sausalito ferry day", "Bay / Marin", "Ferry to quieter waterfront town.", "under_50", "Ferry fare", "Half day", ["Couples"], ["couples", "views", "walking"], { sat: 92 }],
  ["Palace of Fine Arts", "Marina", "Rotunda reflections — free romantic stop.", "free", "Free", "45–90 min", ["Couples", "Photography"], ["free", "couples", "photography"], { sat: 93, uni: 91 }],
  ["Exploratorium", "Embarcadero", "Hands-on science on the pier — great with kids.", "paid", "Admission fee", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 94 }],
]);

writeCityFile("san-francisco.ts", "sanFranciscoPlaces", "sf", sf, "San Francisco TIW scoreboard places.");

const boston = cityList([
  ["Freedom Trail walk", "Downtown / North End", "Red-brick history loop — core Boston story.", "free", "Self-guided free", "2–4 hours", ["History", "First-time visitors"], ["free", "history", "first-time", "walking"], { first: 96, uni: 94 }],
  ["Boston Common & Public Garden", "Beacon Hill edge", "Swan boats and park paths — city green heart.", "free", "Park free", "1–2 hours", ["Families"], ["free", "family", "walking"], { fam: 92, val: 97 }],
  ["Fenway Park tour or game", "Fenway", "Green Monster lore — baseball pilgrimage.", "paid", "Tour/game", "2–4 hours", ["Families", "Groups"], ["family", "first-time", "evening"], { pop: 93, fam: 91 }],
  ["Harvard Square & Yard", "Cambridge", "Campus wander across the river.", "free", "Free", "1–2 hours", ["Walking", "History"], ["free", "walking", "history"], { first: 88 }],
  ["MIT campus & Kendall", "Cambridge", "Geek architecture and riverside path.", "free", "Free", "1–2 hours", ["Walking"], ["free", "walking", "photography"], { uni: 86 }],
  ["New England Aquarium", "Waterfront", "Penguins and the Giant Ocean Tank.", "paid", "Admission fee", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 93 }],
  ["Boston Harborwalk", "Seaport / North End", "Waterfront path with skyline and breeze.", "free", "Free", "1–2 hours", ["Walking", "Couples"], ["free", "walking", "couples", "views"], { sat: 90 }],
  ["North End cannoli crawl", "North End", "Italian bakeries and narrow streets.", "under_50", "Pastries", "1–2 hours", ["Food lovers"], ["food", "walking", "culture"], { sat: 93, pop: 91 }],
  ["Quincy Market / Faneuil Hall", "Downtown", "Historic market halls — touristy grazing.", "under_50", "Pay per stall", "1–2 hours", ["Families", "Food lovers"], ["family", "food", "history"], { fam: 88, pop: 90 }],
  ["Museum of Fine Arts", "Fenway", "Encyclopedic museum — rainy-day excellence.", "paid", "Admission fee", "2–4 hours", ["Culture"], ["culture", "rainy-day"], { sat: 94, uni: 92 }],
  ["Isabella Stewart Gardner Museum", "Fenway", "Courtyard palace museum — intimate masterpiece.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture", "Couples"], ["culture", "couples", "rainy-day"], { uni: 95, sat: 94 }],
  ["USS Constitution", "Charlestown", "Old Ironsides — naval history on the water.", "free", "Free / donation", "1–2 hours", ["History", "Families"], ["history", "family", "free"], { uni: 92, fam: 89 }],
  ["Bunker Hill Monument", "Charlestown", "Climb for harbor views after Freedom Trail.", "free", "Free", "45–90 min", ["History", "Views"], ["history", "views", "walking", "free"], { walk: 80 }],
  ["Boston Tea Party Ships", "Fort Point", "Interactive Revolution story on the water.", "paid", "Ticketed", "1–1.5 hours", ["Families", "History"], ["family", "history"], { fam: 90, first: 88 }],
  ["Seaport District evening", "Seaport", "New dining and harbor lights.", "paid", "Dinner pricing", "2–3 hours", ["Food lovers", "Couples"], ["food", "couples", "evening"], { sat: 89 }],
  ["Arnold Arboretum", "Jamaica Plain", "Vast Harvard trees — free seasonal beauty.", "free", "Free", "2–3 hours", ["Walking", "Families"], ["free", "walking", "family", "photography"], { val: 97, walk: 70 }],
  ["Sam Adams brewery tour", "Jamaica Plain", "Beer history tasting — book ahead.", "under_50", "Tour fee", "1–1.5 hours", ["Groups"], ["food", "nightlife"], { sat: 88 }],
  ["Skywalk Observatory", "Back Bay", "Prudential views over the Hub.", "paid", "Ticketed", "1 hour", ["Views"], ["views", "photography", "rainy-day"], { first: 88 }],
  ["Newbury Street stroll", "Back Bay", "Boutique browses brownstones.", "free", "Free to browse", "1–2 hours", ["Shopping", "Couples"], ["shopping", "couples", "walking", "free"], { sat: 88 }],
  ["Boston Public Library", "Back Bay", "Bates Hall beauty — free civic grandeur.", "free", "Free", "45–90 min", ["Culture", "Rainy day"], ["free", "culture", "rainy-day", "history"], { uni: 90, val: 98 }],
]);

writeCityFile("boston.ts", "bostonPlaces", "bos", boston, "Boston TIW scoreboard places.");

const dc = cityList([
  ["National Mall walk", "National Mall", "Monuments axis — America’s front lawn.", "free", "Free", "2–4 hours", ["First-time visitors", "Families"], ["free", "first-time", "family", "history", "walking"], { first: 98, val: 99 }],
  ["Lincoln Memorial", "National Mall", "Steps and statue at dusk — powerful and free.", "free", "Free", "45–90 min", ["History", "First-time visitors"], ["free", "history", "first-time", "photography", "evening"], { first: 97, sat: 96 }],
  ["Smithsonian National Air and Space", "Mall / Udvar-Hazy", "Aviation icons — Mall or annex.", "free", "Free", "2–4 hours", ["Families"], ["free", "family", "history", "rainy-day"], { fam: 96, pop: 95 }],
  ["Smithsonian Natural History", "National Mall", "Dinosaurs and Hope Diamond — free.", "free", "Free", "2–3 hours", ["Families"], ["free", "family", "rainy-day"], { fam: 95, val: 99 }],
  ["Smithsonian American History", "National Mall", "Pop culture and presidential artifacts.", "free", "Free", "2–3 hours", ["Families", "History"], ["free", "family", "history", "rainy-day"], { fam: 93 }],
  ["National Gallery of Art", "National Mall", "East and West Buildings — free world art.", "free", "Free", "2–4 hours", ["Culture"], ["free", "culture", "rainy-day"], { sat: 95, val: 99 }],
  ["United States Capitol tour", "Capitol Hill", "Book timed tours — democracy stage set.", "free", "Free timed tours", "1–1.5 hours", ["History", "First-time visitors"], ["free", "history", "first-time"], { first: 94, uni: 93 }],
  ["Library of Congress", "Capitol Hill", "Reading room grandeur — free timed entry.", "free", "Free", "1–1.5 hours", ["Culture", "History"], ["free", "culture", "history", "rainy-day"], { uni: 95, sat: 94 }],
  ["Supreme Court exterior", "Capitol Hill", "Steps and columns — quick civic photo.", "free", "Free", "20–40 min", ["History"], ["free", "history", "photography"], { first: 85 }],
  ["White House exterior view", "Downtown", "North/South Lawn viewpoints — security perimeter.", "free", "Free (exterior)", "30–60 min", ["First-time visitors"], ["free", "first-time", "photography"], { first: 92, pop: 94 }],
  ["Washington Monument grounds", "National Mall", "Obelisk base views — tickets for elevator when open.", "free", "Grounds free", "45–90 min", ["Families"], ["free", "family", "first-time"], { first: 90 }],
  ["Tidal Basin & cherry blossoms (seasonal)", "Tidal Basin", "Peak spring spectacle — shoulder hours best.", "free", "Free", "1–3 hours", ["Couples", "Photography"], ["free", "couples", "photography", "walking"], { sat: 96, uni: 94 }],
  ["Jefferson Memorial", "Tidal Basin", "Dome on the water — evening glow.", "free", "Free", "45–90 min", ["History", "Couples"], ["free", "history", "couples", "evening"], { sat: 92 }],
  ["National Zoo", "Woodley Park", "Pandas legacy and free Smithsonian zoo.", "free", "Free", "2–4 hours", ["Families"], ["free", "family", "walking"], { fam: 94, val: 99 }],
  ["Georgetown waterfront & streets", "Georgetown", "Cobbles, shops, and Potomac path.", "under_50", "Free to wander", "2–3 hours", ["Couples", "Shopping"], ["couples", "shopping", "walking", "food"], { sat: 91 }],
  ["Arlington National Cemetery", "Arlington, VA", "Changing of the Guard — solemn and essential.", "free", "Free", "2–3 hours", ["History"], ["free", "history", "walking"], { uni: 95, sat: 93, walk: 70 }],
  ["Kennedy Center free Millennium Stage", "Foggy Bottom", "Free nightly performances — check calendar.", "free", "Free shows", "1–2 hours", ["Culture", "Evening"], ["free", "culture", "evening"], { val: 98, uni: 88 }],
  ["International Spy Museum", "L’Enfant", "Interactive espionage — ticketed fun.", "paid", "Ticketed", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 92, uni: 91 }],
  ["National Museum of African American History", "National Mall", "Powerful modern Smithsonian — timed entry.", "free", "Free timed tickets", "2–4 hours", ["History", "Culture"], ["free", "history", "culture", "rainy-day"], { sat: 97, uni: 97, first: 95 }],
  ["Wharf waterfront", "Southwest", "Dining docks and fireworks nights.", "paid", "Dinner pricing", "2–3 hours", ["Food lovers", "Couples"], ["food", "couples", "evening", "views"], { sat: 90 }],
]);

writeCityFile("washington-dc.ts", "washingtonDcPlaces", "dc", dc, "Washington DC TIW scoreboard places.");

const seattle = cityList([
  ["Pike Place Market", "Downtown", "Fish tosses, flowers, and food stalls — Seattle heart.", "under_50", "Free to wander", "2–3 hours", ["First-time visitors", "Food lovers"], ["food", "first-time", "walking"], { first: 96, pop: 95, sat: 93 }],
  ["Space Needle", "Seattle Center", "Skyline classic — pair with Chihuly.", "paid", "Ticketed", "1–1.5 hours", ["Views", "Families"], ["views", "family", "first-time", "photography"], { first: 93, pop: 94 }],
  ["Chihuly Garden and Glass", "Seattle Center", "Glass gardens under the Needle.", "paid", "Admission fee", "1–1.5 hours", ["Culture", "Families"], ["culture", "family", "photography"], { sat: 94, uni: 95 }],
  ["Museum of Pop Culture", "Seattle Center", "Music and sci-fi extravaganza.", "paid", "Admission fee", "2–3 hours", ["Culture", "Families"], ["culture", "family", "rainy-day"], { uni: 92, fam: 88 }],
  ["Ferry to Bainbridge", "Waterfront", "Skyline outbound ferry — cheap wow.", "under_50", "Ferry fare", "2–4 hours", ["Couples", "Views"], ["couples", "views", "walking"], { sat: 93, val: 92 }],
  ["Olympic Sculpture Park", "Waterfront", "Outdoor art on Elliott Bay — free.", "free", "Free", "1–1.5 hours", ["Culture", "Views"], ["free", "culture", "views", "walking"], { val: 96, uni: 90 }],
  ["Kerry Park viewpoint", "Queen Anne", "Postcard skyline framing the Needle.", "free", "Free", "30–60 min", ["Photography", "Couples"], ["free", "photography", "couples", "views", "evening"], { sat: 95, pop: 92 }],
  ["Pike Place gum wall (Post Alley)", "Downtown", "Weirdly magnetic sticky wall — quick look.", "free", "Free", "15–30 min", ["Photography"], ["free", "photography"], { uni: 86, pop: 88 }],
  ["Starbucks Reserve Roastery", "Capitol Hill", "Coffee theme park — immersive tasting.", "under_50", "Drinks", "45–90 min", ["Food lovers"], ["food", "rainy-day"], { sat: 90, uni: 88 }],
  ["Ballard Locks", "Ballard", "Boats and fish ladder — free maritime theater.", "free", "Free", "1–2 hours", ["Families"], ["free", "family"], { fam: 90, uni: 88 }],
  ["Discovery Park", "Magnolia", "West Point lighthouse trails — city wilderness.", "free", "Free", "2–3 hours", ["Walking", "Families"], ["free", "walking", "family", "views"], { walk: 75, val: 96 }],
  ["Fremont Troll & neighborhood", "Fremont", "Quirky statue and indie shops.", "free", "Free", "1–2 hours", ["Families", "Photography"], ["free", "family", "photography", "walking"], { uni: 89 }],
  ["Museum of Flight", "South Seattle", "Aviation campus — Concorde and more.", "paid", "Admission fee", "2–4 hours", ["Families"], ["family", "history", "rainy-day"], { fam: 93, uni: 92 }],
  ["Underground Tour", "Pioneer Square", "Beneath the streets — quirky history.", "paid", "Ticketed", "1.5 hours", ["History"], ["history", "rainy-day"], { uni: 90, sat: 88 }],
  ["Gas Works Park", "Wallingford", "Industrial ruins with lake skyline views.", "free", "Free", "1–1.5 hours", ["Photography", "Families"], ["free", "family", "photography", "views"], { uni: 91, sat: 90 }],
  ["Amazon Spheres (exterior / tours)", "Downtown", "Biospheres downtown — check public access.", "free", "Exterior free", "30–60 min", ["Photography"], ["free", "photography"], { uni: 88, pop: 86 }],
  ["Capitol Hill nightlife", "Capitol Hill", "Bars and music dens — Seattle after dark.", "paid", "Covers/drinks", "3–5 hours", ["Nightlife"], ["nightlife", "evening"], { sat: 89 }],
  ["Snoqualmie Falls day trip", "East of Seattle", "Thunderous waterfall — easy half day.", "free", "Free / parking", "Half day", ["Families", "Couples"], ["family", "couples", "views", "walking"], { uni: 93, fam: 91 }],
  ["Mount Rainier viewpoint day (seasonal)", "South of Seattle", "Clear-day volcano views — weather dependent.", "under_50", "Park fees if entering", "Full day", ["Walking", "Views"], ["walking", "views", "photography"], { uni: 97, walk: 70 }],
  ["Waterfront Ferris wheel", "Pier 57", "Bay wheel rides — touristy treat.", "paid", "Ride tickets", "45–90 min", ["Families"], ["family", "views"], { fam: 86 }],
]);

writeCityFile("seattle.ts", "seattlePlaces", "sea", seattle, "Seattle TIW scoreboard places.");

const austin = cityList([
  ["Texas State Capitol", "Downtown", "Pink granite dome — free tours and grounds.", "free", "Free", "1–1.5 hours", ["History", "Families"], ["free", "history", "family", "photography"], { first: 90, val: 97 }],
  ["Lady Bird Lake hike-and-bike", "Downtown lakefront", "Trail loop with skyline — rent kayaks too.", "free", "Trail free", "1–3 hours", ["Walking", "Couples"], ["free", "walking", "couples", "views"], { sat: 93, walk: 70 }],
  ["Congress Avenue bats (seasonal)", "Downtown", "Dusk bat emergence — free spectacle.", "free", "Free", "1 hour evening", ["Families", "First-time visitors"], ["free", "family", "evening", "first-time"], { uni: 96, fam: 92, first: 94 }],
  ["Barton Springs Pool", "Zilker", "Spring-fed swimming — Austin classic.", "under_50", "Pool fee", "2–3 hours", ["Families", "Couples"], ["family", "couples"], { sat: 94, fam: 91 }],
  ["Zilker Metropolitan Park", "Zilker", "Festival lawns and skyline views.", "free", "Free", "1–3 hours", ["Families"], ["free", "family", "walking"], { fam: 90, val: 95 }],
  ["South Congress Avenue", "South Congress", "Indie shops, food, and neon — SoCo stroll.", "under_50", "Free to wander", "2–3 hours", ["Shopping", "Food lovers"], ["shopping", "food", "walking", "photography"], { sat: 92, pop: 91 }],
  ["Franklin Barbecue (or top BBQ)", "East Austin", "Brisket pilgrimage — lines are part of it.", "under_50", "Meat by the pound", "2–4 hours with line", ["Food lovers"], ["food", "first-time"], { sat: 96, uni: 93, pop: 94 }],
  ["Rainey Street bars", "Rainey", "Bungalow bar scene — nightlife crawl.", "paid", "Drinks", "2–4 hours", ["Nightlife"], ["nightlife", "evening"], { sat: 90, pop: 89 }],
  ["Live music on Sixth Street", "Downtown", "Neon music strip — earplugs optional.", "under_50", "Covers vary", "2–4 hours", ["Nightlife", "Music"], ["nightlife", "evening"], { pop: 92, uni: 88 }],
  ["Blanton Museum of Art", "UT area", "University art museum — strong and manageable.", "paid", "Admission fee", "1.5–2 hours", ["Culture"], ["culture", "rainy-day"], { sat: 89 }],
  ["Bullock Texas State History Museum", "Downtown", "Texas story with IMAX options.", "paid", "Admission fee", "2–3 hours", ["Families", "History"], ["family", "history", "rainy-day"], { fam: 90 }],
  ["Mount Bonnell", "West Austin", "Hilltop city/lake views — short climb.", "free", "Free", "45–90 min", ["Couples", "Views"], ["free", "couples", "views", "walking", "photography"], { sat: 91, walk: 60 }],
  ["Mayfield Park peacocks", "West Austin", "Cottage gardens and free-roaming peacocks.", "free", "Free", "1 hour", ["Families"], ["free", "family", "photography"], { fam: 88, uni: 87 }],
  ["East Austin coffee & murals", "East Austin", "Murals and specialty coffee circuit.", "under_50", "Coffee costs", "1–2 hours", ["Photography", "Couples"], ["photography", "food", "walking", "couples"], { sat: 88 }],
  ["ACL Live / Moody Theater show", "Downtown", "Flagship music venue — check calendar.", "paid", "Ticketed", "2–3 hours", ["Music", "Evening"], ["evening", "culture"], { sat: 92 }],
  ["Texas State Cemetery", "East Austin", "Quiet historic grounds near downtown.", "free", "Free", "45–90 min", ["History"], ["free", "history", "walking"], { uni: 84 }],
  ["Umlauf Sculpture Garden", "South Austin", "Outdoor sculpture among trees.", "under_50", "Admission fee", "1–1.5 hours", ["Couples", "Culture"], ["culture", "couples", "walking"], { uni: 88, sat: 89 }],
  ["Lake Travis day (seasonal)", "Northwest", "Reservoir swimming and boat days.", "under_50", "Park/boat costs", "Half day", ["Families", "Groups"], ["family"], { fam: 88, sat: 90 }],
  ["Austin Central Library", "Downtown", "Architectural public library — free views.", "free", "Free", "45–90 min", ["Culture", "Rainy day"], ["free", "culture", "rainy-day", "views"], { uni: 86, val: 95 }],
  ["Food truck park graze", "Various", "Austin’s trailer parks — follow what’s hot.", "under_50", "Cheap plates", "1–2 hours", ["Food lovers"], ["food"], { sat: 91, val: 93 }],
]);

writeCityFile("austin.ts", "austinPlaces", "atx", austin, "Austin TIW scoreboard places.");

const nola = cityList([
  ["French Quarter wander", "French Quarter", "Balconies, courtyards, and street music — go early and late.", "free", "Free to wander", "2–4 hours", ["First-time visitors"], ["free", "first-time", "walking", "music", "photography"], { first: 97, pop: 96, sat: 94 }],
  ["Jackson Square & St. Louis Cathedral", "French Quarter", "Plaza artists and cathedral facade.", "free", "Free", "45–90 min", ["Families", "Photography"], ["free", "family", "photography", "history"], { first: 93, fam: 90 }],
  ["Café du Monde beignets", "French Quarter", "Powdered sugar ritual — expect a line.", "under_50", "Cheap", "30–60 min", ["Food lovers", "Families"], ["food", "family", "first-time"], { first: 94, pop: 95, sat: 91 }],
  ["Garden District walking tour", "Garden District", "Mansions and shaded streets — streetcar accessible.", "free", "Self-guided free", "1.5–2.5 hours", ["Walking", "History"], ["free", "walking", "history", "photography"], { uni: 92, sat: 91 }],
  ["St. Charles Streetcar", "Uptown corridor", "Historic streetcar ride under oaks.", "under_50", "Transit fare", "30–90 min", ["First-time visitors", "Families"], ["first-time", "family", "history"], { first: 92, fam: 90 }],
  ["National WWII Museum", "Warehouse District", "One of America’s best museums — plan hours.", "paid", "Admission fee", "3–5 hours", ["History", "Families"], ["history", "family", "rainy-day"], { sat: 97, uni: 96, fam: 92 }],
  ["Frenchmen Street live music", "Marigny", "Clubs and street brass — less Bourbon, more music.", "under_50", "Covers vary", "2–4 hours", ["Nightlife", "Music"], ["nightlife", "evening", "music"], { sat: 95, uni: 94 }],
  ["Bourbon Street (short sample)", "French Quarter", "Chaotic nightlife artery — see it, don’t live there all night.", "under_50", "Free to walk", "1–2 hours", ["Nightlife", "First-time visitors"], ["nightlife", "evening", "first-time"], { pop: 94, con: 60 }],
  ["City Park & Sculpture Garden", "Mid-City", "Oaks, museum, and NOMA sculpture garden.", "free", "Park free; museum ticketed", "2–3 hours", ["Families", "Culture"], ["free", "family", "culture", "walking"], { fam: 91, val: 95 }],
  ["New Orleans Museum of Art", "City Park", "Art inside City Park — manageable size.", "paid", "Admission fee", "1.5–2.5 hours", ["Culture"], ["culture", "rainy-day"], { sat: 89 }],
  ["Magazine Street browse", "Uptown / Garden", "Miles of shops and cafes.", "under_50", "Free to browse", "2–3 hours", ["Shopping", "Couples"], ["shopping", "couples", "walking", "food"], { sat: 90 }],
  ["Swamp tour day trip", "Near NOLA", "Cypress and gators — classic Louisiana.", "paid", "Tour pricing", "Half day", ["Families", "First-time visitors"], ["family", "first-time"], { uni: 95, fam: 91, first: 93 }],
  ["Cemetery tour (St. Louis etc.)", "Various", "Above-ground tombs — go with a guide.", "paid", "Tour fee", "1.5–2 hours", ["History"], ["history", "walking"], { uni: 93, sat: 90 }],
  ["Jazz at Preservation Hall", "French Quarter", "Intimate traditional jazz — book ahead.", "paid", "Tickets", "1 hour", ["Music", "Couples"], ["music", "evening", "culture", "couples"], { uni: 96, sat: 95 }],
  ["Mississippi riverfront park", "French Quarter edge", "River walks and steamboat views.", "free", "Free", "45–90 min", ["Families", "Views"], ["free", "family", "views", "walking"], { val: 94 }],
  ["Warehouse District galleries", "Warehouse District", "Art spaces near WWII Museum.", "free", "Often free", "1–2 hours", ["Culture"], ["culture", "walking", "free"], { uni: 86 }],
  ["Audubon Zoo", "Uptown", "Strong zoo under oaks.", "paid", "Admission fee", "2–4 hours", ["Families"], ["family"], { fam: 92 }],
  ["Audubon Aquarium & Insectarium", "Riverfront", "Downtown aquarium complex.", "paid", "Admission fee", "2–3 hours", ["Families"], ["family", "rainy-day"], { fam: 91 }],
  ["Po-boy crawl", "Various", "Shrimp, roast beef — follow local counters.", "under_50", "Sandwiches", "1–2 hours", ["Food lovers"], ["food"], { sat: 93, val: 92 }],
  ["Mardi Gras World", "Julia Street", "Float dens — colorful behind-the-scenes.", "paid", "Ticketed", "1–1.5 hours", ["Families"], ["family", "culture"], { fam: 88, uni: 90 }],
]);

writeCityFile("new-orleans.ts", "newOrleansPlaces", "nola", nola, "New Orleans TIW scoreboard places.");

console.log("Done.");
