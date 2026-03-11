import { PrismaClient, City, Channel, BookingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.bookingExtra.deleteMany();
  await prisma.bookingExtra.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.message.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.guideTour.deleteMany();
  await prisma.faqEntry.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.tour.deleteMany();

  // TOURS
  const tours = await Promise.all([
    prisma.tour.create({
      data: {
        name: "Sydney Icons Drive",
        city: City.SYDNEY,
        duration: "1h",
        price: 180,
        description: "Discover Sydney's iconic landmarks in a private vehicle.",
      },
    }),
    prisma.tour.create({
      data: {
        name: "Sydney Sunset Harbour Tour",
        city: City.SYDNEY,
        duration: "1h30",
        price: 320,
        description: "Watch the sunset over Sydney Harbour in style.",
      },
    }),
    prisma.tour.create({
      data: {
        name: "Grand Sydney Discovery",
        city: City.SYDNEY,
        duration: "3h",
        price: 420,
        description: "The ultimate Sydney experience covering all highlights.",
      },
    }),
    prisma.tour.create({
      data: {
        name: "Melbourne Cultural Highlights Tour",
        city: City.MELBOURNE,
        duration: "2h",
        price: 290,
        description: "Explore Melbourne's arts, culture and coffee scene.",
      },
    }),
    prisma.tour.create({
      data: {
        name: "Coastal Scenic Experience",
        city: City.GOLD_COAST,
        duration: "3h",
        price: 480,
        description: "Stunning coastal drive along the Gold Coast.",
      },
    }),
  ]);
  console.log(`✅ Created ${tours.length} tours`);

  // EXTRAS
  const extras = await Promise.all([
    prisma.extra.create({ data: { name: "Hotel Pickup", price: 60 } }),
    prisma.extra.create({ data: { name: "Professional Photoshoot", price: 250 } }),
    prisma.extra.create({ data: { name: "Local Wine & Snacks Pack", price: 45 } }),
  ]);
  console.log(`✅ Created ${extras.length} extras`);

  // GUIDES
  const guidesData = [
    { name: "Jack Wilson",    email: "jack@southerncross-demo.com",    city: City.SYDNEY,      priority: 1 },
    { name: "Emily Carter",   email: "emily@southerncross-demo.com",   city: City.SYDNEY,      priority: 2 },
    { name: "Liam Thompson",  email: "liam@southerncross-demo.com",    city: City.SYDNEY,      priority: 3 },
    { name: "Olivia Brown",   email: "olivia@southerncross-demo.com",  city: City.MELBOURNE,   priority: 1 },
    { name: "Noah Harris",    email: "noah@southerncross-demo.com",    city: City.GOLD_COAST,  priority: 1 },
    { name: "Ava Martinez",   email: "ava@southerncross-demo.com",     city: City.SYDNEY,      priority: 4 },
    { name: "William Davis",  email: "william@southerncross-demo.com", city: City.MELBOURNE,   priority: 2 },
    { name: "Sophia Garcia",  email: "sophia@southerncross-demo.com",  city: City.GOLD_COAST,  priority: 2 },
    { name: "James Miller",   email: "james@southerncross-demo.com",   city: City.SYDNEY,      priority: 5 },
    { name: "Isabella Wilson","email": "isabella@southerncross-demo.com", city: City.MELBOURNE, priority: 3 },
    { name: "Oliver Taylor",  email: "oliver@southerncross-demo.com",  city: City.GOLD_COAST,  priority: 3 },
    { name: "Mia Anderson",   email: "mia@southerncross-demo.com",     city: City.SYDNEY,      priority: 6 },
  ];

  const guides = await Promise.all(
    guidesData.map((g) =>
      prisma.guide.create({ data: { ...g, languages: ["EN"] } })
    )
  );
  console.log(`✅ Created ${guides.length} guides`);

  // Link guides to tours
  const sydneyTours = tours.filter((t) => t.city === City.SYDNEY);
  const melbTours   = tours.filter((t) => t.city === City.MELBOURNE);
  const gcTours     = tours.filter((t) => t.city === City.GOLD_COAST);

  for (const guide of guides) {
    const relevantTours =
      guide.city === City.SYDNEY      ? sydneyTours :
      guide.city === City.MELBOURNE   ? melbTours   : gcTours;

    for (const tour of relevantTours) {
      await prisma.guideTour.create({
        data: { guideId: guide.id, tourId: tour.id },
      });
    }
  }
  console.log("✅ Linked guides to tours");

  // SAMPLE BOOKINGS
  const sydneyIconsTour = tours[0];
  const jackGuide = guides[0]; // Jack Wilson

  const sampleBooking = await prisma.booking.create({
    data: {
      reservationId: "VIATOR-DEMO-77542",
      customerName: "Sarah Mitchell",
      customerEmail: "sarah.mitchell@email-demo.com",
      customerCountry: "Australia",
      channel: Channel.VIATOR,
      tourId: sydneyIconsTour.id,
      guideId: jackGuide.id,
      city: City.SYDNEY,
      date: new Date("2026-04-18"),
      time: "15:00",
      passengers: 3,
      totalPrice: 490,
      status: BookingStatus.CONFIRMED,
    },
  });

  // Add extras to booking
  await prisma.bookingExtra.create({
    data: { bookingId: sampleBooking.id, extraId: extras[0].id }, // Hotel Pickup
  });
  await prisma.bookingExtra.create({
    data: { bookingId: sampleBooking.id, extraId: extras[1].id }, // Photoshoot
  });

  // Add reminders
  const tourDate = new Date("2026-04-18T08:00:00");
  const postTour  = new Date("2026-04-18T17:00:00");
  await prisma.reminder.create({
    data: {
      bookingId: sampleBooking.id,
      type: "day_of",
      scheduled: tourDate,
      channel: "whatsapp",
      content: `Hi Sarah! 👋 This is a reminder for your Sydney Icons Drive today at 15:00. Your guide Jack will meet you at the confirmed meeting point.`,
    },
  });
  await prisma.reminder.create({
    data: {
      bookingId: sampleBooking.id,
      type: "post_tour",
      scheduled: postTour,
      channel: "whatsapp",
      content: `We hope you enjoyed your experience 💙 Would you mind leaving us a review? 👉 https://g.page/r/southerncross-demo/review`,
    },
  });

  // FAQ ENTRIES
  const faqs = [
    {
      question: "Do you accept dogs?",
      answer: "Small pets are welcome as long as they are in a carrier. Large dogs are not allowed.",
      tags: ["pets", "dogs", "animals"],
    },
    {
      question: "What happens if it rains?",
      answer: "The tour runs as planned. Our vehicles are fully covered and weather-ready.",
      tags: ["weather", "rain", "rains", "cancellation"],
    },
    {
      question: "Where does the tour start?",
      answer: "The exact meeting point depends on the selected tour and will be confirmed after booking.",
      tags: ["meeting point", "location", "start"],
    },
    {
      question: "Can I get a refund?",
      answer: "Full refund if cancelled 48h+ before the tour. 50% refund within 24-48h. No refund within 24h.",
      tags: ["refund", "cancellation", "policy"],
    },
    {
      question: "How many people fit per vehicle?",
      answer: "Each vehicle has 1 guide and fits up to 3 passengers for a private experience.",
      tags: ["capacity", "passengers", "group"],
    },
    {
      question: "Do you offer hotel pickup?",
      answer: "Yes! Hotel pickup is available as an extra for +60 AUD. Please add it when booking.",
      tags: ["pickup", "hotel", "extras"],
    },
    {
      question: "What languages are tours available in?",
      answer: "All tours are currently conducted in English.",
      tags: ["language", "english"],
    },
  ];

  await Promise.all(faqs.map((f) => prisma.faqEntry.create({ data: f })));
  console.log(`✅ Created ${faqs.length} FAQ entries`);

  console.log("\n🎉 Seed completed successfully!");
  console.log(`   Tours:    ${tours.length}`);
  console.log(`   Guides:   ${guides.length}`);
  console.log(`   Extras:   ${extras.length}`);
  console.log(`   Bookings: 1 (sample)`);
  console.log(`   FAQs:     ${faqs.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
