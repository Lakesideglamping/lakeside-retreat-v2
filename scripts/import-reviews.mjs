import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://lakeside_db_bhye_user:2MkYi6S3ldxTv76mIK2eCpZfI15ly0WT@dpg-d5d1fsdactks73cfq69g-a.oregon-postgres.render.com/lakeside_db_bhye",
  ssl: { rejectUnauthorized: false },
});

const reviews = [
  // Reviews page (6)
  { guest_name: "Sarah & James", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2024-12-01", review_text: "Absolutely magical! The dome exceeded all expectations. Waking up to those lake views was incredible. Stephen and Sandy were wonderful hosts - their local recommendations for wineries were spot on. We'll definitely be back!" },
  { guest_name: "Mike & Family", platform: "direct", rating: 5, property: "Lakeside Cottage", stay_date: "2024-11-01", review_text: "The Lakeside Cottage was perfect for our family. The kids loved swimming in the lake, and we appreciated the fully equipped kitchen. Being able to bring our dog was a huge bonus. The location is ideal for exploring the region." },
  { guest_name: "Emma", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2024-10-01", review_text: "The private spa at Dome Rosé was heavenly! We spent hours soaking while watching the sunset over the vineyards. The attention to detail in the dome is impressive - from the quality linens to the thoughtful welcome basket." },
  { guest_name: "David & Lisa", platform: "booking", rating: 5, property: "Dome Pinot", stay_date: "2024-09-01", review_text: "We loved that Lakeside Retreat is solar-powered - it aligned perfectly with our values. The location is unbeatable: close enough to Queenstown for day trips but peaceful and quiet at night. The Rail Trail access was a bonus!" },
  { guest_name: "Rachel", platform: "direct", rating: 5, property: "Dome Rose", stay_date: "2024-08-01", review_text: "This was our third stay at Lakeside Retreat and it gets better every time. Stephen and Sandy remember us and always go above and beyond. The winter views of the snow-capped mountains from the hot tub were breathtaking." },
  { guest_name: "Tom & Anna", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2024-07-01", review_text: "We celebrated our anniversary here and it was perfect. The dome felt like a luxury hotel but with so much more character. The wine recommendations were excellent - we discovered some new favourites at the local wineries." },
  // Homepage (11)
  { guest_name: "Sarah", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2026-01-01", review_text: "Thank you Steve and Sandy for an outstanding experience. We were blown away by our surroundings and the brekky was amazing! Highly recommend booking a night here. Walking the vineyards and taking a dip in the lake was magical." },
  { guest_name: "Ryan", platform: "airbnb", rating: 5, property: "Lakeside Cottage", stay_date: "2026-02-01", review_text: "Such a lovely place to stay, right on the lake overlooking a vineyard. Loved the wood fired hot tub! Steve and Sandy were lovely and attentive hosts. Will definitely be staying again." },
  { guest_name: "Jarryd", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2026-02-01", review_text: "Incredible stay with amazing vineyard and lake views, hosts are super friendly and accommodating. Highly recommend staying here for stargazing and down time." },
  { guest_name: "Cath", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2026-02-01", review_text: "What a great relaxing stay. Lovely setting, great for a stroll along the lake. It was a perfect short getaway. Recommend getting the breakfast included, which was lunch as well!" },
  { guest_name: "Thomas David", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2026-02-01", review_text: "An amazing outlook. Super comfortable and terrific hosting from Steve and Sandy. Utterly memorable and highly recommended. It was great to meet Benji their friendly retriever too!" },
  { guest_name: "Sophia", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2026-02-01", review_text: "Absolutely beautiful! Sandy was so warm and welcoming, her place was just delightful. She gave us great food and wine tasting recommendations and her place was clean, cozy with breathtaking views." },
  { guest_name: "Abby", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2026-01-01", review_text: "Just book it! This was such a special place. The sunset was gorgeous walking through the grape vines. I swam early in the morning followed by a hot tub. And then Sandy brought breakfast! We raved over it. Wish we could have stayed another night!" },
  { guest_name: "William", platform: "airbnb", rating: 5, property: "Lakeside Cottage", stay_date: "2026-01-01", review_text: "Had a lovely stay. The property is beautiful with stunning views and a very comfortable place. The kitchen is well equipped and the BBQ and hot tub are great. Nothing like relaxing in the hot tub after a day exploring the region. Sandy was a fantastic host, spoiled us with fresh cherries from their tree!" },
  { guest_name: "Christopher James", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2026-01-01", review_text: "Our first trip to NZ and our accommodation experience of Glamping at Sandy and Steve's location was AMAZING! Private, amazing views and amazingly comfortable. Recommendations of places to eat, visit and things to do were spot on and the morning delivery of breakfast was perfection." },
  { guest_name: "Sophy", platform: "airbnb", rating: 5, property: "Dome Pinot", stay_date: "2026-01-01", review_text: "This place gave us a night of luxury! Steve and Sandy have a beautiful vineyard which they allowed us to walk around and they were incredibly welcoming. They have done an incredible job to provide your own spa space - the hot tub is incredible! Highly recommend in every way." },
  { guest_name: "Stuart", platform: "airbnb", rating: 5, property: "Dome Rose", stay_date: "2026-02-01", review_text: "A fantastic stay in a unique luxury dome tent overlooking a beautiful landscape. Couldn't recommend more highly. Sandy was a great host and made us feel very welcome." },
];

async function run() {
  await pool.query("DELETE FROM reviews");
  console.log("Cleared existing reviews");

  for (const r of reviews) {
    await pool.query(
      `INSERT INTO reviews (guest_name, platform, rating, property, stay_date, review_text, status, is_featured, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [r.guest_name, r.platform, r.rating, r.property, r.stay_date, r.review_text, "approved", true]
    );
  }

  const { rows } = await pool.query("SELECT COUNT(*) as count, AVG(rating) as avg FROM reviews");
  console.log("Total reviews:", rows[0].count, "| Avg rating:", Number(rows[0].avg).toFixed(1));
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
