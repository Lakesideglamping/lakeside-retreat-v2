import { NextResponse } from "next/server";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

interface PageImages {
  path: string;
  images: { loc: string; title: string; caption?: string }[];
}

const pages: PageImages[] = [
  {
    path: "/",
    images: [
      {
        loc: "/images/domes-vineyard-sunset.jpg",
        title: "Luxury glamping domes at Lakeside Retreat overlooking Lake Dunstan",
        caption: "Lakeside Retreat — luxury glamping domes on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/lake-mountains-perfect.jpg",
        title: "Lake Dunstan with snow-capped Central Otago mountains",
      },
    ],
  },
  {
    path: "/dome-pinot",
    images: [
      {
        loc: "/images/Pinotfront.jpeg",
        title: "Dome Pinot exterior with panoramic Lake Dunstan views",
        caption: "Dome Pinot — flagship 50sqm luxury geodesic dome",
      },
      {
        loc: "/images/gallerydecksitting.jpeg",
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
        loc: "/images/pinotspa.jpeg",
        title: "Dome Pinot private outdoor spa at night",
      },
    ],
  },
  {
    path: "/dome-rose",
    images: [
      {
        loc: "/images/dome-rose.jpeg",
        title: "Dome Rosé exterior — romantic glamping dome",
        caption: "Dome Rosé — 40sqm luxury dome with vineyard views",
      },
      {
        loc: "/images/dome-rose-spa1.jpeg",
        title: "Dome Rosé private outdoor spa",
      },
      {
        loc: "/images/dome-rose-interior.jpeg",
        title: "Dome Rosé interior with super king bed",
      },
      {
        loc: "/images/rosespa.jpeg",
        title: "Dome Rosé spa pool at sunset",
      },
    ],
  },
  {
    path: "/lakeside-cottage",
    images: [
      {
        loc: "/images/lakeside-cottage-exterior.jpeg",
        title: "Lakeside Cottage exterior with direct lake access",
        caption: "Lakeside Cottage — family accommodation on Lake Dunstan",
      },
      {
        loc: "/images/cottage.jpg",
        title: "Lakeside Cottage overlooking Lake Dunstan",
      },
      {
        loc: "/images/cottagebedroom.jpeg",
        title: "Lakeside Cottage bedroom",
      },
      {
        loc: "/images/cottagebathroom.jpeg",
        title: "Lakeside Cottage bathroom",
      },
    ],
  },
  {
    path: "/gallery",
    images: [
      {
        loc: "/images/domes-vineyard-sunset.jpg",
        title: "Glamping domes at sunset over the vineyard",
      },
      {
        loc: "/images/gallerydeck.jpeg",
        title: "Dome deck with vineyard views",
      },
      {
        loc: "/images/GallerySwingChair.jpeg",
        title: "Swing chair on the deck at Lakeside Retreat",
      },
      {
        loc: "/images/galleryrainbow.jpeg",
        title: "Rainbow over Lake Dunstan from Lakeside Retreat",
      },
      {
        loc: "/images/vineyarddomes.jpeg",
        title: "Glamping domes in the vineyard at Lakeside Retreat",
      },
      {
        loc: "/images/lakeview.jpeg",
        title: "Lake Dunstan views from Lakeside Retreat",
      },
      {
        loc: "/images/domesmountainview.jpeg",
        title: "Domes with Central Otago mountain backdrop",
      },
      {
        loc: "/images/magical-sunset.jpg",
        title: "Magical sunset over Lake Dunstan from Lakeside Retreat",
      },
    ],
  },
  {
    path: "/glamping-central-otago",
    images: [
      {
        loc: "/images/Hottub1000x700.jpeg",
        title: "Private hot tub at Lakeside Retreat glamping domes",
      },
      {
        loc: "/images/vineyard.jpeg",
        title: "Central Otago vineyard surrounding Lakeside Retreat",
      },
    ],
  },
  {
    path: "/autumn-central-otago",
    images: [
      {
        loc: "/images/lakeviewautumn.jpeg",
        title: "Autumn colours on Lake Dunstan, Central Otago",
      },
      {
        loc: "/images/golden-vineyard-autumn.jpg",
        title: "Golden autumn vineyard in Central Otago wine country",
      },
    ],
  },
  {
    path: "/our-story",
    images: [
      {
        loc: "/images/ViewfromVineyard.jpeg",
        title: "View from the vineyard at Lakeside Retreat",
      },
      {
        loc: "/images/solarpanel.jpeg",
        title: "Solar panels powering the eco-glamping domes",
        caption: "100% renewable energy at Lakeside Retreat",
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
