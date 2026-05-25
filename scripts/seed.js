'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Booking = require('../src/models/Booking');

const agents = [
  {
    name: 'Eleanora Vance',
    phone: '+1 (229) 745-2469',
    email: 'sophia@nestquest.com',
    avatar: 'https://i.ibb.co/N6ZXNs5w/el-vance.png',
  },
];

const properties = [
  {
    slug: 'prop-001',
    title: 'Charming 2-Bedroom Apartment in Brooklyn Heights',
    type: 'Apartment',
    city: 'New York',
    zip: '11201',
    address: '280 Court Street, Brooklyn, NY 11201',
    price: 1640,
    beds: 2,
    baths: 1,
    area: 950,
    description: 'Discover your perfect home in the heart of vibrant New York City! This stunning 2-bedroom apartment offers an exceptional blend of comfort, modern living, and unbeatable convenience. Bathed in natural light, the space features a beautifully designed kitchen, spacious living areas, and a peaceful ambiance perfect for relaxation and entertaining.\n\nLocated in the desirable 11201 area, you\'ll enjoy easy access to world-class dining, shopping, parks, and transportation. Whether you\'re starting a new chapter or seeking an upgraded lifestyle, this apartment delivers it all. All pets are welcome!\n\nAvailable from May 2026. Don\'t miss this rare opportunity to rent a beautiful 2-bedroom home at this incredible price in NYC.',
    images: [
      'https://i.ibb.co/gMQjYXQ6/13.jpg',
      'https://i.ibb.co/7xZDycx5/14.jpg',
      'https://i.ibb.co/BVJr9dyB/15.jpg',
      'https://i.ibb.co/Kj4wSwWC/16.jpg',
      'https://i.ibb.co/7xZDycx5/14.jpg',
      'https://i.ibb.co/BVJr9dyB/15.jpg',
      'https://i.ibb.co/60DB1j7g/3.jpg',
      'https://i.ibb.co/DHchYRsx/4.jpg',
      'https://i.ibb.co/k2S7vTM9/5.jpg',
      'https://i.ibb.co/9LnRC0m/6.jpg',
      'https://i.ibb.co/27Pvh6nN/7.jpg',
      'https://i.ibb.co/s9xsMBm2/8.jpg',
      'https://i.ibb.co/Kp2nRsMw/9.jpg',
      'https://i.ibb.co/ds3F80FL/10.jpg',
      'https://i.ibb.co/M5xj8X26/11.jpg',
      'https://i.ibb.co/5X086dQP/12.jpg'
    ],
    videoUrl: null,
    amenities: ['Pet Friendly', 'All Pets Allowed', 'Modern Kitchen', 'Natural Light', 'Laundry Facilities', 'Quiet Neighborhood'],
    available: true,
    availableFrom: '2026-05-01',
    rating: 4.8,
    reviewCount: 24,
    featured: true,
    isNewListing: true,
    agent: agents[0],
    lat: 40.6937,
    lng: -73.9899,
    neighbourhood: 'Brooklyn Heights is one of New York City\'s most desirable neighborhoods, offering tree-lined streets, historic brownstones, scenic waterfront views, and easy access to Manhattan. Enjoy world-class dining, boutique shopping, and beautiful parks right at your doorstep.',
    createdAt: new Date('2026-05-23')
  },
  {
    slug: 'prop-002',
    title: 'Spacious 3-Bedroom Apartment in Central Paterson',
    type: 'Apartment',
    city: 'Paterson',
    zip: '07501',
    address: 'Central Paterson, NJ 07501',
    price: 2700,
    beds: 3,
    baths: 2,
    area: 1250,
    description: 'Welcome to this beautifully maintained 3-bedroom, 2-bathroom apartment in the heart of Paterson, New Jersey. This bright and spacious home offers an ideal blend of comfort and convenience, featuring central air conditioning and heating, generous natural light from large windows, and thoughtful modern touches throughout.\n\nThe master bedroom boasts a walk-in closet and a luxurious modern bathroom with both a bathtub and stand-up shower. Additional highlights include in-unit washer and dryer hookups, ample closet space, dimmer switches, and a well-equipped kitchen with oven and refrigerator.\n\nPerfectly located with shopping, restaurants, and pharmacies just steps away, you\'ll also enjoy quick access to downtown Paterson, the NJ Transit train station, and St. Joseph\'s Hospital. An excellent choice for families or professionals seeking a vibrant, well-connected community.\n\nAvailable now with a 1-year lease. Street parking included. Price is negotiable for qualified applicants with strong income and credit.',
    images: [
      'https://i.ibb.co/VWnnK6Mb/7.jpg',
      'https://i.ibb.co/ND3j765/8.jpg',
      'https://i.ibb.co/93Cb9dzs/9.jpg',
      'https://i.ibb.co/PLBPsYD/10.jpg',
      'https://i.ibb.co/1fnRYgdJ/11.jpg',
      'https://i.ibb.co/4zMykxT/1.jpg',
      'https://i.ibb.co/Y7b04vxN/2.jpg',
      'https://i.ibb.co/GfSnPGKx/3.jpg',
      'https://i.ibb.co/0RwCp1Nz/4.jpg',
      'https://i.ibb.co/tpG6n2G4/5.jpg',
      'https://i.ibb.co/MD7Lq9QW/6.jpg'
    ],
    videoUrl: null,
    amenities: ['Central AC', 'Central Heating', 'Street Parking', 'In-Unit Laundry Hookups', 'Oven', 'Refrigerator', 'Walk-in Closets', 'Modern Bathroom'],
    available: true,
    availableFrom: '2026-05-23',
    rating: 4.7,
    reviewCount: 18,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 40.9155,
    lng: -74.1630,
    neighbourhood: 'Paterson is a vibrant and diverse city known for its rich history, cultural attractions, and convenient location. This central neighborhood offers easy access to shopping, dining, public transportation, and major employers, making it an excellent place to call home.',
    createdAt: new Date('2026-05-16')
  },
  {
    slug: 'prop-003',
    title: 'Charming Studio Apartment with Private Garden in West Village',
    type: 'Studio',
    city: 'New York',
    zip: '10014',
    address: '17 Gay St, New York, NY 10014',
    price: 3495,
    beds: 0,
    baths: 1,
    area: 650,
    description: 'Experience the magic of the West Village in this beautifully renovated studio apartment located on the iconic Gay Street. This charming home features a peaceful shared outdoor garden, soaring skylights that fill the space with natural light, a newly renovated kitchen with premium stainless steel appliances, a decorative fireplace, and elegant hardwood floors.\n\nPerfect for those seeking a serene yet vibrant lifestyle, this pet-friendly (dogs & cats welcome) residence offers both comfort and convenience. The building includes a virtual doorman, courtyard, and laundry facilities.\n\nPrime location just steps from the West 4th Street and Christopher Street subway stations, with effortless access to the city\'s best restaurants, shopping, and nightlife.\n\nAvailable for January 15th or February 1st move-in. A rare opportunity to live in one of New York City\'s most sought-after neighborhoods.',
    images: [
      'https://i.ibb.co/GvS30yXM/8.jpg',
      'https://i.ibb.co/8gN5YJx7/9.jpg',
      'https://i.ibb.co/qMHDFx3Z/11.jpg',
      'https://i.ibb.co/5tsf5W2/12.jpg',
      'https://i.ibb.co/1tQvwVL2/1.jpg',
      'https://i.ibb.co/Df7dvf5m/2.jpg',
      'https://i.ibb.co/2Y6rL0Xy/3.jpg',
      'https://i.ibb.co/TMZgbhyw/4.jpg',
      'https://i.ibb.co/C3BR18W8/5.jpg',
      'https://i.ibb.co/DgD4nmBx/6.jpg',
      'https://i.ibb.co/5xL3zFkN/7.jpg'
    ],
    videoUrl: null,
    amenities: ['Pet Friendly', 'Dogs & Cats Allowed', 'In-Unit Laundry', 'Shared Garden', 'Skylights', 'Stainless Steel Appliances', 'Hardwood Floors', 'Virtual Doorman', 'Courtyard'],
    available: true,
    availableFrom: '2026-01-15',
    rating: 4.9,
    reviewCount: 31,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 40.7330,
    lng: -74.0030,
    neighbourhood: 'The West Village is one of Manhattan\'s most prestigious and charming neighborhoods, known for its historic brownstones, tree-lined streets, boutique shops, acclaimed restaurants, and vibrant nightlife. This prime location offers unmatched access to culture, convenience, and the true essence of New York City living.',
    createdAt: new Date('2026-05-16')
  },
  {
    slug: 'prop-004',
    title: 'Spacious 3-Bedroom Apartment with Garage & Yard in Fairmont',
    type: 'Apartment',
    city: 'Fairmont',
    zip: '26554',
    address: '514 Race St, Fairmont, WV 26554',
    price: 1200,
    beds: 3,
    baths: 1.5,
    area: 1100,
    description: 'This spacious 3-bedroom, 1.5-bathroom apartment offers an exceptional blend of comfort and practicality in a convenient Fairmont location. Enjoy generous living space, central heating, washer/dryer hookups, and abundant natural light throughout.\n\nHighlights include a large garage with extra storage, a private fenced-in yard perfect for relaxation or pets, and plenty of closet space. The apartment is dog and cat friendly with an additional pet deposit and monthly fee.\n\nIdeally situated near local amenities, I-79, and schools, this home provides easy access to everything you need. Available from mid-June 2026. First month’s rent + security deposit required. Tenant responsible for all utilities.',
    images: [
      'https://i.ibb.co/Rknzc5pG/2.jpg',
      'https://i.ibb.co/Q3gbmPmV/3.jpg',
      'https://i.ibb.co/5XdmV3rZ/4.jpg',
      'https://i.ibb.co/HDBJppmh/5.jpg',
      'https://i.ibb.co/KjkxpHdv/6.jpg',
      'https://i.ibb.co/s9MZCWRT/7.jpg',
      'https://i.ibb.co/N2BtKn2G/8.jpg',
      'https://i.ibb.co/jZxCNxFW/9.jpg',
      'https://i.ibb.co/20XhK2gk/1.jpg'
    ],
    videoUrl: null,
    amenities: ['Pet Friendly', 'Dogs & Cats Allowed', 'Central Heating', 'Garage Parking', 'Fenced Yard', 'Washer/Dryer Hookups', 'Extra Storage'],
    available: true,
    availableFrom: '2026-06-14',
    rating: 4.6,
    reviewCount: 15,
    featured: false,
    isNewListing: true,
    agent: agents[0],
    lat: 39.4850,
    lng: -80.1425,
    neighbourhood: 'Fairmont, West Virginia offers a welcoming community with convenient access to major highways, local schools, shopping, and outdoor recreation. This peaceful residential area combines affordability with a high quality of life.',
    createdAt: new Date('2026-05-21')
  },
  {
    slug: 'prop-005',
    title: 'Luxury 2-Bedroom Apartment at Gore Luxe in Downtown Clarksburg',
    type: 'Apartment',
    city: 'Clarksburg',
    zip: '26301',
    address: '207 W Pike St, Clarksburg, WV 26301',
    price: 2000,
    beds: 2,
    baths: 2,
    area: 1150,
    description: 'Welcome to upscale living at Gore Luxe in the heart of downtown Clarksburg. This sophisticated 2-bedroom, 2-bathroom apartment offers modern elegance combined with exceptional urban convenience. Featuring a generous layout, spacious bedrooms, and pristine bathrooms with high-end fixtures, this residence is perfect for both comfort and entertaining.\n\nResidents enjoy a prime location just steps away from Clarksburg’s finest dining, including the award-winning Ritzy’s Diner, cultural attractions like the history museum and art gallery, and entertainment at the Robinson Grand Theatre. The building offers dedicated on-site parking, outdoor seating areas with a communal grill, and access to the elegant Gore lobby for community events and gatherings.\n\nExperience refined urban living with safety, convenience, and luxury all at your doorstep. Available now.',
    images: [
      'https://i.ibb.co/wrFsm1GR/2.jpg',
      'https://i.ibb.co/sScNcgr/4.jpg',
      'https://i.ibb.co/Cq90bY8/6.jpg',
      'https://i.ibb.co/XZDRs6pp/7.jpg',
      'https://i.ibb.co/s9FrR8VH/8.jpg',
      'https://i.ibb.co/chsGdCpx/9.jpg',
      'https://i.ibb.co/nM1g4kqQ/10.jpg',
      'https://i.ibb.co/FLBVqy18/11.jpg',
      'https://i.ibb.co/MFFHSxZ/1.jpg'
    ],
    videoUrl: null,
    amenities: ['On-Site Parking', 'Communal Grill', 'Outdoor Seating', 'Luxury Lobby', 'High-End Finishes', 'Downtown Location'],
    available: true,
    availableFrom: '2026-05-25',
    rating: 4.8,
    reviewCount: 22,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 39.2807,
    lng: -80.3440,
    neighbourhood: 'Downtown Clarksburg offers a vibrant mix of historic charm and modern amenities. Residents enjoy walkable access to excellent dining, cultural attractions, entertainment venues, and convenient transportation in the heart of the city.',
    createdAt: new Date('2026-05-16')
  },
  {
    slug: 'prop-006',
    title: 'End Unit 3-Bedroom Townhouse with Yard in Jane Lew',
    type: 'Apartment',
    city: 'Jane Lew',
    zip: '26378',
    address: 'Near Exit 105, Jane Lew, WV 26378',
    price: 1100,
    beds: 3,
    baths: 1,
    area: 1050,
    description: 'Charming end-unit 3-bedroom, 1-bathroom townhouse located just off Exit 105 in Jane Lew, WV. This well-maintained home offers a private yard, making it perfect for outdoor enjoyment and pets. Water and sewer are included for added convenience.\n\nEnjoy a quiet, comfortable living space in a convenient location near local amenities, with easy access to major roads. Ideal for families or those seeking affordable housing with a bit of outdoor space in a peaceful West Virginia community.',
    images: [
      'https://i.ibb.co/5WH3gGMS/2.jpg',
      'https://i.ibb.co/GQLFS3ZR/3.jpg',
      'https://i.ibb.co/7JVqD8DX/4.jpg',
      'https://i.ibb.co/WNZ279kt/5.jpg',
      'https://i.ibb.co/ccNyc8sT/6.jpg',
      'https://i.ibb.co/PZzytH4K/7.jpg',
      'https://i.ibb.co/nNsfxs8T/8.jpg',
      'https://i.ibb.co/zhzdy9SC/9.jpg',
      'https://i.ibb.co/Xr0hMjbv/1.jpg'
    ],
    videoUrl: null,
    amenities: ['Private Yard', 'End Unit', 'Water Included', 'Sewer Included', 'Off-Street Parking'],
    available: true,
    availableFrom: '2026-05-25',
    rating: 4.5,
    reviewCount: 12,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 39.1098,
    lng: -80.4068,
    neighbourhood: 'Jane Lew is a peaceful small town in Lewis County, West Virginia. Known for its friendly community and convenient location near major highways, it offers a relaxed lifestyle with easy access to nearby amenities and outdoor recreation.',
    createdAt: new Date('2026-05-16')
  },
  {
    slug: 'prop-weston-commercial',
    title: '3-Bay Commercial Building with Office Space in Weston',
    type: 'Studio',
    city: 'Weston',
    zip: '26452',
    address: 'Weston, WV 26452',
    price: 6000,
    beds: 0,
    baths: 2,
    area: 2500,
    description: 'Prime commercial opportunity in Weston, WV. This spacious 3-bay building offers excellent versatility for business use, featuring a large parking area and a built-in office space. Ideal for retail, service, storage, or professional offices.\n\nThe property provides ample room for operations and customer parking, making it a highly functional and accessible location. Perfect for entrepreneurs or established businesses looking for a well-situated commercial property with modern utility.\n\nAvailable now on a 1-year lease.',
    images: [
      'https://i.ibb.co/Kc5Q0Hgy/1.jpg',
      'https://i.ibb.co/GfNhPqyD/2.jpg',
      'https://i.ibb.co/kVkwQ4nD/3.jpg'
    ],
    videoUrl: null,
    amenities: ['Large Parking Area', '3-Bay Garage', 'Office Space', 'Commercial Zoning', 'High Visibility'],
    available: true,
    availableFrom: '2026-05-25',
    rating: 4.7,
    reviewCount: 8,
    featured: false,
    isNewListing: false,
    agent: agents[0],
    lat: 39.0384,
    lng: -80.4659,
    neighbourhood: 'Weston, West Virginia is a historic and growing community known for its small-town charm, convenient location, and supportive business environment. This property benefits from good accessibility and local amenities.',
    createdAt: new Date('2026-05-16')
  }
]

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nestquest';
  console.log('[Seed] Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('[Seed] Connected.');

  // ── Clear existing data ──────────────────────────────────────────────────
  console.log('[Seed] Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  // ── Seed properties ──────────────────────────────────────────────────────
  console.log(`[Seed] Inserting ${properties.length} properties…`);
  const insertedProperties = await Property.insertMany(properties);
  console.log(`[Seed] ✓ ${insertedProperties.length} properties inserted`);

  // ── Seed demo users ──────────────────────────────────────────────────────
  console.log('[Seed] Creating demo users…');

  const demoPassword = await bcrypt.hash('password123', 12);

  const users = await User.insertMany([
    {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: demoPassword,
      phone: '+1 (555) 010-0001',
      savedProperties: ['prop-001', 'prop-007'],
      joinedAt: new Date('2024-01-15'),
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: demoPassword,
      phone: '+1 (555) 020-0002',
      savedProperties: ['prop-004', 'prop-010'],
      joinedAt: new Date('2024-03-20'),
    },
  ]);

  console.log(`[Seed] ✓ ${users.length} demo users created`);
  console.log('[Seed]   Email: alex@example.com / Password: password123');
  console.log('[Seed]   Email: sarah@example.com / Password: password123');

  // ── Seed sample bookings ────────────────────────────────────────────────
  console.log('[Seed] Creating sample bookings…');

  // Future date helper
  const futureDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    // Avoid Sundays
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const alexUser = users[0];

  const prop001Snapshot = {
    id: 'prop-001',
    title: 'The Madison Loft',
    address: '280 Madison Ave, Brooklyn, NY 11201',
    city: 'New York',
    images: [properties[0].images[0]],
  };

  const prop004Snapshot = {
    id: 'prop-004',
    title: 'Silver Lake Modern',
    address: '2341 Hyperion Ave, Silver Lake, CA 90026',
    city: 'Los Angeles',
    images: [properties[1].images[0]],
  };

  const bookings = await Booking.insertMany([
    {
      userId: alexUser._id,
      propertyId: 'prop-001',
      propertySnapshot: prop001Snapshot,
      date: futureDate(7),
      slot: '10:30 AM',
      status: 'upcoming',
      reference: 'NQ-2025-001A',
      guestDetails: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        phone: '+1 (555) 010-0001',
        message: 'Interested in the loft views.',
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: alexUser._id,
      propertyId: 'prop-004',
      propertySnapshot: prop004Snapshot,
      date: pastDate(15),
      slot: '2:00 PM',
      status: 'completed',
      reference: 'NQ-2024-002B',
      guestDetails: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        phone: '+1 (555) 010-0001',
        message: '',
      },
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`[Seed] ✓ ${bookings.length} sample bookings created`);

  console.log('\n[Seed] Database seeded successfully!\n');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Seed failed:', err);
  process.exit(1);
});
