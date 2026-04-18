import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { JsonLd, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Things to Do Near Cromwell | Wineries, Cycling & Lake Dunstan Activities",
  description:
    "Everything to do near Lakeside Retreat: Otago Rail Trail cycling, Central Otago wineries, Lake Dunstan water sports, and day trips to Queenstown, Wanaka, and Arrowtown.",
};

const distances = [
  { place: "Queenstown", time: "45 minutes" },
  { place: "Wanaka", time: "30 minutes" },
  { place: "Cromwell", time: "10 minutes" },
  { place: "Otago Rail Trail", time: "300m walk" },
  { place: "Lake Dunstan", time: "On-site" },
  { place: "Nearest Winery", time: "5 minutes" },
];

const wineries = [
  { name: "Mt Difficulty", specialty: "Award-winning Pinot Noir & stunning views", distance: "8 min" },
  { name: "Carrick Winery", specialty: "Organic wines & excellent restaurant", distance: "10 min" },
  { name: "Wooing Tree", specialty: "Underground cellar & unique varietals", distance: "12 min" },
  { name: "Brennan Wines", specialty: "Boutique family winery", distance: "15 min" },
  { name: "Gibbston Valley", specialty: "Cave tours & cheesery", distance: "35 min" },
];

const dayTrips = [
  {
    title: "Queenstown Adventures",
    desc: "Bungy jumping, jet boating, skiing, gondola rides, and world-class dining — all just 45 minutes away.",
    image: "/images/lake-mountains-perfect.jpg",
    time: "45 min drive",
  },
  {
    title: "Wanaka & Surrounds",
    desc: "That Wanaka Tree, Puzzling World, Roy\u2019s Peak, and charming lakeside cafes and galleries.",
    image: "/images/lakeviewautumn.jpeg",
    time: "30 min drive",
  },
  {
    title: "Historic Arrowtown",
    desc: "Gold rush heritage town with boutique shops, cafes, autumn colours, and the Chinese Settlement.",
    image: "/images/ViewfromVineyard.jpeg",
    time: "40 min drive",
  },
];

export default function ExplorePage() {
  return (
    <>
      <JsonLd data={[
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Explore", path: "/explore" },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/images/lake-mountains-perfect.jpg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Explore Central Otago</h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Thirty wineries, one great ride, and a lake — all out your front door.
          </p>
        </div>
      </section>

      {/* Distances */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Your Perfect Base for Adventure
          </h2>
          <p className="text-center text-muted text-lg mb-10">
            Lakeside Retreat is ideally located for exploring everything Central Otago has to offer
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {distances.map((d) => (
              <div key={d.place} className="bg-cream rounded-xl p-5 text-center">
                <div className="font-bold text-burgundy text-lg">{d.time}</div>
                <div className="text-sm text-muted">{d.place}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wine Country */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">Wine Country</h2>
          <p className="text-center text-muted text-lg mb-10 max-w-[800px] mx-auto">
            Central Otago is renowned for its world-class Pinot Noir. You&apos;re surrounded by 30+
            wineries, most just minutes from your door.
          </p>
          <div className="space-y-4 max-w-[800px] mx-auto">
            {wineries.map((w) => (
              <div
                key={w.name}
                className="bg-white rounded-xl p-6 shadow-sm flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-burgundy">{w.name}</h3>
                  <p className="text-muted text-sm m-0">{w.specialty}</p>
                </div>
                <span className="text-burgundy font-semibold text-sm whitespace-nowrap">
                  {w.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">Cycling &amp; Water Activities</h2>
          <p className="text-center text-muted text-lg mb-10">
            From lakeside swimming to epic trail rides
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-cream rounded-2xl overflow-hidden">
              <Image
                src="/images/vineyard-path.jpg"
                alt="Otago Rail Trail cycling path"
                width={800}
                height={500}
                className="w-full h-[250px] object-cover"
              />
              <div className="p-6">
                <h3 className="font-display text-xl mb-2">Otago Rail Trail</h3>
                <p className="text-muted text-sm">
                  Just 300m from your door &mdash; New Zealand&apos;s original Great Ride. The
                  Cromwell to Clyde section is flat and perfect for all fitness levels.
                </p>
              </div>
            </div>
            <div className="bg-cream rounded-2xl overflow-hidden">
              <Image
                src="/images/magical-sunset.jpg"
                alt="Lake Dunstan swimming and water activities"
                width={800}
                height={500}
                className="w-full h-[250px] object-cover"
              />
              <div className="p-6">
                <h3 className="font-display text-xl mb-2">Lake Dunstan Water Sports</h3>
                <p className="text-muted text-sm">
                  Crystal-clear waters for swimming, kayaking, and paddleboarding. The Lakeside
                  Cottage has direct lake access — bring your own kayak or hire in Cromwell.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Day Trips */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Day Trips</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {dayTrips.map((trip) => (
              <div key={trip.title} className="bg-white rounded-2xl overflow-hidden shadow-md">
                <Image
                  src={trip.image}
                  alt={trip.title}
                  width={800}
                  height={500}
                  className="w-full h-[200px] object-cover"
                />
                <div className="p-6">
                  <span className="text-burgundy text-xs font-semibold">{trip.time}</span>
                  <h3 className="font-display text-xl mb-2">{trip.title}</h3>
                  <p className="text-muted text-sm">{trip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Ready to Explore?</h2>
          <p className="text-lg text-muted mb-8">
            Book your stay at Lakeside Retreat and discover everything Central Otago has to offer.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
