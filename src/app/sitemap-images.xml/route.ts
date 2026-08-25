import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

interface PageImages {
  path: string;
  images: { loc: string; title: string; caption?: string }[];
}

// Every entry below must be an image the page actually renders — Google
// discards image-sitemap entries it cannot find on the URL they are filed
// under. `sitemap-images.test.ts` enforces this, so add an image to the page
// before adding it here.
//
// Landing pages share a property-card footer (Pinotfront / dome-rose-spa1 /
// lakeside-cottage-exterior). Those are deliberately not repeated on every
// page — each entry leads with the imagery distinctive to that URL.
const pages: PageImages[] = [
  {
    path: "/",
    images: [
      {
        loc: "/images/IMG_0136.jpg",
        title: "Luxury glamping domes at Lakeside Retreat overlooking Lake Dunstan",
        caption: "Lakeside Retreat — luxury glamping domes on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/IMG_0097.jpg",
        title: "View from the dome deck across the golden vineyard and Lake Dunstan",
      },

      {
        loc: "/images/LakeDView.jpeg",
        title: "Lake Dunstan location and surrounding Central Otago wine country",
      },
      {
        loc: "/images/galleryrainbow.jpeg",
        title: "Double rainbow arcing over Lake Dunstan and the vineyards at Lakeside Retreat",
      },
      {
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot exterior with panoramic Lake Dunstan views",
      },
	{
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Dome Rose over vineyard to Lake Dunstan",
      },

      {
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Self-contained lakefront cottage, sleeps 3. Direct Lake Dunstan access, and pet-friendly",
      },
    ],
  },
  {
    path: "/dome-pinot",
    images: [
      {
        loc: "/images/20220125_091449.jpg",
        title: "Dome Pinot exterior with panoramic Lake Dunstan views",
        caption: "Dome Pinot — flagship 50sqm luxury geodesic dome",
      },
      {
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot exterior with snow-capped mountain views",
      },
      {
        loc: "/images/IMG_0097.jpg",
        title: "Dome Pinot private deck overlooking the autumn vineyard and lake",
      },
      {
        loc: "/images/pinotinternal.jpeg",
        title: "Dome Pinot interior luxury living space",
      },
      {
        loc: "/images/windowview.jpeg",
        title: "View from inside Dome Pinot over the vineyard and Lake Dunstan",
      },
{
        loc: "/images/GallerySwingChair.jpeg",
        title: "View from swing chair over the vineyard and Lake Dunstan",
      },
{
        loc: "/images/pinotexternal2.jpeg",
        title: "Dome Pinot from the driveway over looking vineyard and Lake Dunstan",
      },
      {
        loc: "/images/PinotKichen.jpg",
        title: "Dome Pinot kitchenette and dining area",
      },
      {
        loc: "/images/SpaArialView.jpeg",
        title: "Dome Pinot private saltwater spa from above",
      },
      {
        loc: "/images/DomeMilkyWay.jpg",
        title: "Milky Way over Dome Pinot — Central Otago dark skies",
        caption: "Stargazing from the dome under Central Otago's dark skies",
      },
    ],
  },
  {
    path: "/dome-rose",
    images: [
      {
        loc: "/images/vineyard.jpeg",
        title: "Dome Rosé exterior — romantic glamping dome",
        caption: "Dome Rosé — 40sqm luxury dome with vineyard views",
      },
      {
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Dome Rosé private saltwater spa",
      },
      {
        loc: "/images/RoseKitchen.jpg",
        title: "Dome Rosé kitchenette and living space",
      },
      {
        loc: "/images/SkyView.jpeg",
        title: "Night sky through the Dome Rosé skylight",
      },
{
        loc: "/images/domesmountainview.jpeg",
        title: "Dome Rosé kitchenette and living space",
      },
      {
        loc: "/images/IMG_1403.webp",
        title: "Dome Rose Luxury interior",
      },
{
        loc: "/images/IMG_E8726.jpg",
        title: "Mountain views from Dome Rosé desking",
      },
{
        loc: "/images/RoseArialView.jpg",
        title: "Dome Rosé Arial view",
      },
{
        loc: "/images/Spa.jpeg",
        title: "Dome Rosé Arial view",
      },
    ],
  },
  {
    path: "/lakeside-cottage",
    images: [
      {
        loc: "/images/HeadingWarm.jpeg",
        title: "Lakeside Cottage exterior with direct lake access",
        caption: "Lakeside Cottage — adults-only lakefront stay on Lake Dunstan",
      },
{
        loc: "/images/cottage-hottub.jpg",
        title: "Wood-fired cedar hot tub at Lakeside Cottage with Lake Dunstan and Pisa Range views",
      },
{
        loc: "/images/lakeview.jpeg",
        title: "Lake Dunstan views from Lakeside Cottage",
      },
      {
        loc: "/images/lakesidecottageinterior.jpeg",
        title: "Sitting area with lake views",
      },
      {
        loc: "/images/cottagebedroom.jpeg",
        title: "Lakeside Cottage queen bedroom with mountain views",
      },
      {
        loc: "/images/cottagebathroom.jpeg",
        title: "Lakeside Cottage bathroom with timber vanity",
      },
      {
        loc: "/images/20220425_140215.jpg",
        title: "Sitting area with Weber BBQ",
      },
      {
        loc: "/images/CottageWinterView.jpg",
        title: "Lakeside Cottage in winter with snow on the Pisa Range",
      },
      {
        loc: "/images/MilkyWayOntheLake.jpg",
        title: "Milky Way over Lake Dunstan from the Lakeside Cottage",
      },
    ],
  },
  {
    path: "/gallery",
    images: [
{
        loc: "/images/LakeDunstanCloud.jpeg",
        title: "Glamping domes at sunset over Lake Dunstan vineyards",
        caption: "Explore our luxury accommodations, stunning lake views, and the beauty of Central Otago",
      },
 {
        loc: "/images/20210618_084416.jpg",
        title: "Glamping domes with Central Otago mountain views",
      },
{
        loc: "/images/hottub-lakeview.jpg",
        title: "Wood-fired hot tub with Lake Dunstan views",
      },

 {
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Lakeside Cottage with direct Lake Dunstan access",
      },
{
        loc: "/images/cottagebedroom.jpeg",
        title: "Lakeside Cottage bedroom with mountain views",
      },
 {
        loc: "/images/lakesidecottageinterior.jpeg",
        title: "Lakeside Cottage sitting room",
      },
{
        loc: "/images/cottagebathroom.jpeg",
        title: "Lakeside Cottage bathroom",
      },
{
        loc: "/images/CottageMountainView.jpeg",
        title: "Mountain views from the Lakeside Cottage",
      },
 {
        loc: "/images/domes-vineyard-sunset.jpg",
        title: "Both glamping domes at Lakeside Retreat with Lake Dunstan and sunset sky",
      },
{
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot exterior with snow-capped mountain views",
      },
 {
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Dome Rosé nestled in golden autumn vineyard by the lake",
      },
{
        loc: "/images/IMG_1266-1920x1080.jpeg",
        title: "Both domes in winter vineyard with snow-capped mountains",
      },
 {
        loc: "/images/Spa.jpeg",
        title: "Private saltwater spa at Lakeside Retreat",
      },
{
        loc: "/images/galleryrainbow.jpeg",
        title: "Rainbow over Lake Dunstan from Lakeside Retreat",
      },
 {
        loc: "/images/domesmountainview.jpeg",
        title: "Domes with Central Otago mountain backdrop",
      },
      {
        loc: "/images/magical-sunset.jpg",
        title: "Stunning sunset over Lake Dunstan",
      },
     {
        loc: "/images/lakeview.jpeg",
        title: "Vineyard Morning Over Lake Dunstan",
      },
{
        loc: "/images/vineyard.jpeg",
        title: "Central Otago vineyard views from Lakeside Retreat",
      },
{
        loc: "/images/pinotinternal.jpeg",
        title: "Dome Pinot interior luxury living space with vineyard views",
      },
{
        loc: "/images/PinotExterior.jpeg",
        title: "Dome Pinot with vineyard views",
      },
{
        loc: "/images/dome-rose-interior.jpeg",
        title: "Dome Rosé interior with panoramic windows overlooking the lake",
      },
{
        loc: "/images/gallerydecksitting.jpeg",
        title: "Dome deck overlooking the golden autumn vineyard and Lake Dunstan",
      },
{
        loc: "/images/IMG_E8724.jpg",
        title: "Dome lake and mountain views",
      },
{
        loc: "/images/gallerydeck.jpeg",
        title: "Relaxing on the deck with vineyard views",
      },
{
        loc: "/images/DroneViewRose.jpeg",
        title: "Dome and vineyard arial views",
      },
{
        loc: "/images/domes-portrait-lake.jpg",
        title: "Both geodesic domes with vineyard rows leading to Lake Dunstan",
      },
{
        loc: "/images/WinterVineyard.jpeg",
        title: "Winter Vineyard View",
      },
{
        loc: "/images/LakeDunstanReflaction.jpeg",
        title: "Lake Dunstan Reflaction",
      },
{
        loc: "/images/20220110_081038.jpg",
        title: "Beautiful Lake Dunstan",
      },
{
        loc: "/images/MilkyWayOntheLake.jpg",
        title: "Milkyway over Lake Dunstan",
      },
{
        loc: "/images/DomeMilkyWay.jpg",
        title: "Milkyway over the dome",
      },
{
        loc: "/images/GasWeber.jpg",
        title: "Gas Weber for private use",
      },
{
        loc: "/images/BathRobes.jpg",
        title: "Bathrobes available in the dome",
      },
{
        loc: "/images/RoseKitchen.jpg",
        title: "Dome Rose kitchen",
      },
{
        loc: "/images/PinotSpa.jpg",
        title: "Dome Pinot spa",
      },
{
        loc: "/images/20260422153555_0026.jpg",
        title: "Vineyard view to the lake",
      },

    ],
  },
  {
    path: "/glamping-central-otago",
    images: [
      {
        loc: "/images/IMG_8536.jpg",
        title: "Luxury glamping in Central Otago — domes above the vineyard",
        caption: "Adults-only luxury glamping on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/SpaArialView.jpeg",
        title: "Private saltwater spa at Lakeside Retreat glamping domes",
      },
      {
        loc: "/images/MilkyWay.jpg",
        title: "Milky Way over the Central Otago glamping domes",
      },
      {
        loc: "/images/springview.jpeg",
        title: "Spring at Lakeside Retreat, Central Otago",
      },
    ],
  },
  {
    path: "/autumn-central-otago",
    images: [
{
        loc: "/images/IMG_0097.jpg",
        title: "Golden autumn vineyards in Central Otago during harvest season",
        caption: "Autumn in Central Otago — vineyards in full colour",
      },

      {
        loc: "/images/VineyardAutumn.jpeg",
        title: "Golden autumn vineyard in Central Otago wine country",
       },
      {
        loc: "/images/AutumnSpa.jpg",
        title: "Private spa surrounded by autumn colour",
      },
      {
        loc: "/images/CycleTrail.jpeg",
        title: "Lake Dunstan cycle trail in autumn",
      },
    ],
  },
  {
    path: "/our-story",
    images: [
      {
        loc: "/images/galleryrainbow.jpeg",
        title: "Rainbow over Lake Dunstan at Lakeside Retreat",
      },
      {
        loc: "/images/SteveSandy.jpg",
        title: "Stephen and Sandy, hosts of Lakeside Retreat",
        caption: "The hosts behind Lakeside Retreat, Cromwell",
      },
      {
        loc: "/images/LakeDunstanCloud.jpeg",
        title: "Cloud over Lake Dunstan from Lakeside Retreat",
      },
      {
        loc: "/images/IMG_8536.jpg",
        title: "Ripe grapes in the vineyard at Lakeside Retreat",
      },
    ],
  },
  {
    path: "/winter-glamping-central-otago",
    images: [
      {
        loc: "/images/IMG_1266-1920x1080.jpeg",
        title: "Winter glamping domes with snow-capped Pisa Range backdrop",
        caption: "Adults-only winter glamping on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/Spa.jpeg",
        title: "Private saltwater spa with winter mountain views",
      },
      {
        loc: "/images/pinotinternal.jpeg",
        title: "Warm dome interior on a Central Otago winter night",
      },
      {
        loc: "/images/SkyView.jpeg",
        title: "Winter night sky through the dome skylight",
      },
    ],
  },
  {
    path: "/couples-retreat-central-otago",
    images: [
      {
        loc: "/images/mtPisa.jpeg",
        title: "The Alpenglow cast a magical light over Mt Pisa",
        caption: "Adults-only couples retreat in Central Otago wine country",
      },
      {
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot luxury geodesic dome with Lake Dunstan views",
      },
      {
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Private saltwater spa for two at Dome Rosé",
      },
    ],
  },
{
    path: "/luxury-accommodation-cromwell",
    images: [
      {
        loc: "/images/alpenglow-mountains.jpeg",
        title: "Luxury glamping dome with panoramic Lake Dunstan views, Cromwell",
        caption:
          "Geodesic glamping domes and a lakeside cottage on Lake Dunstan. " +
          "The finest accommodation in Central Otago wine country",
      },
      ],
  },
  {
    path: "/central-otago-wine-trail",
    images: [
      {
        loc: "/images/20260423090956_0003.jpg",
        title: "Central Otago wine trail — vineyards near Cromwell",
        caption: "30+ cellar doors within 15 minutes of Lakeside Retreat",
      },
      ],
  },
  {
    path: "/dog-friendly-accommodation-central-otago",
    images: [
      {
        loc: "/images/LakeViewInSpring.jpeg",
        title: "Dog-friendly lakefront accommodation on Lake Dunstan",
        caption: "Adults-only pet-friendly lakefront cottage in Cromwell",
      },
      {
        loc: "/images/cottagebedroom.jpeg",
        title: "Lakeside Cottage bedroom — the dog-friendly stay",
      },
    ],
  },
  {
    path: "/otago-rail-trail-accommodation",
    images: [
      {
        loc: "/images/LakeDunstanCycleTrail.jpeg",
        title: "Lake Dunstan cycle trail beside Lakeside Retreat",
        caption: "Adults-only lakefront cottage on the Otago Rail Trail",
      },
      {
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Otago Rail Trail accommodation — Lakeside Cottage",
      },
    ],
  },
  {
    path: "/food-dining-central-otago",
    images: [
      {
        loc: "/images/Fruits.jpeg",
        title: "Central Otago stone fruit and produce",
        caption: "Orchards, cellar doors and dining around Cromwell",
      },
    ],
  },
  {
    path: "/cromwell-activities",
    images: [
      {
        loc: "/images/OldTownCromwell.jpeg",
        title: "Old Cromwell Town heritage precinct",
        caption: "Things to do around Cromwell and Lake Dunstan",
      },
      {
        loc: "/images/DunstanCycleTrail.jpeg",
        title: "Lake Dunstan cycle trail near Cromwell",
      },
      {
        loc: "/images/lakeview.jpeg",
        title: "Lake Dunstan views from Lakeside Retreat",
      },
    ],
  },
  {
    path: "/wanaka-day-trip",
    images: [
      {
        loc: "/images/Wanaka.jpeg",
        title: "Wanaka day trip — 30 minutes from Lakeside Retreat",
      },
    ],
  },
  {
    path: "/weekend-getaway-queenstown",
    images: [
      {
        loc: "/images/Queenstown.jpeg",
        title: "Weekend getaway from Queenstown — Lakeside Retreat",
        caption: "Adults-only weekend escape 45 minutes from Queenstown",
      },
    ],
  },
  {
    path: "/stay",
    images: [
      {
        loc: "/images/WinterVineyard.jpeg",
        title: "Winter vineyard at Lakeside Retreat, Central Otago",
        caption: "Three adults-only stays on Lake Dunstan",
      },
      {
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot — flagship 50sqm luxury dome",
      },
      {
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Dome Rosé with private saltwater spa",
      },
      {
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Lakeside Cottage — lakefront, pet friendly",
      },
    ],
  },
  {
    path: "/guides",
    images: [
      {
        loc: "/images/lakeview.jpeg",
        title: "Lake Dunstan views — Central Otago travel guides",
        caption: "Local guides to Cromwell, Wanaka, Queenstown and the wine trail",
      },
      {
        loc: "/images/lakeviewautumn.jpeg",
        title: "Autumn colours on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/OldTownCromwell.jpeg",
        title: "Old Cromwell Town heritage precinct",
      },
      {
        loc: "/images/Fruits.jpeg",
        title: "Central Otago food and wine",
      },
      {
        loc: "/images/IMG_8536.jpg",
        title: "Grapes in the Central Otago vineyards",
      },
{
        loc: "/images/IMG_1266-1920x1080.jpeg",
        title: "Winter Glamping in Central Otago",
      },
{
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Dog-Friendly Accommodation in Central Otago",
      },
{
        loc: "/images/CycleTrail.jpeg",
        title: "Central Otago Cycle Trails: Accommodation & Guide",
      },
{
        loc: "/images/Queenstown.jpeg",
        title: "Queenstown Day Trip: Adventure Awaits",
      },
{
        loc: "/images/Wanaka.jpeg",
        title: "Wanaka: Lakes, Mountains & That Tree",
      },
    ],
  },
  {
    path: "/reviews",
    images: [
      {
        loc: "/images/20210618_084416.jpg",
        title: "Lakeside Retreat guest reviews — 4.9 stars, 416+ reviews",
      },
    ],
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const urlEntries = pages
    .map(({ path, images }) => {
      const imageEntries = images
        .map(({ loc, title, caption }) => {
          const captionTag = caption
            ? `\n      <image:caption>${escapeXml(caption)}</image:caption>`
            : "";
          return `    <image:image>
      <image:loc>${escapeXml(`${BASE_URL}${loc}`)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>${captionTag}
    </image:image>`;
        })
        .join("\n");

      return `  <url>
    <loc>${escapeXml(`${BASE_URL}${path}`)}</loc>
${imageEntries}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${urlEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
