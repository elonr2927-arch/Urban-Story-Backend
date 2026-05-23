'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const Booking = require('../src/models/Booking');

const agents = [
  {
    name: 'Sophia Marchetti',
    phone: '+1 (212) 555-0142',
    email: 'sophia@nestquest.com',
    avatar: null,
  },
  {
    name: 'Marcus Chen',
    phone: '+1 (310) 555-0287',
    email: 'marcus@nestquest.com',
    avatar: null,
  },
  {
    name: 'Priya Nair',
    phone: '+1 (415) 555-0319',
    email: 'priya@nestquest.com',
    avatar: null,
  },
  {
    name: 'James Okafor',
    phone: '+1 (305) 555-0456',
    email: 'james@nestquest.com',
    avatar: null,
  },
  {
    name: 'Elena Vasquez',
    phone: '+1 (512) 555-0078',
    email: 'elena@nestquest.com',
    avatar: null,
  },
];

const properties = [
  {
    slug: 'prop-001',
    title: 'The Madison Loft',
    type: 'Apartment',
    city: 'New York',
    zip: '11201',
    address: '280 Madison Ave, Brooklyn, NY 11201',
    price: 4200,
    beds: 3,
    baths: 2,
    area: 1400,
    description:
      'A stunning loft apartment in the heart of Brooklyn with soaring 14-foot ceilings, exposed brick walls, and floor-to-ceiling industrial windows that flood the space with natural light. The open-plan kitchen features premium appliances, quartz countertops, and a generous island perfect for entertaining. Both bedrooms offer ample closet space, and the master suite includes a spa-inspired en suite bathroom.\n\nLocated just two blocks from the F train, this apartment provides seamless access to Manhattan while offering the vibrant culture and dining of Downtown Brooklyn at your doorstep.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    amenities: ['Parking', 'Gym', 'Concierge', 'Rooftop Terrace', 'AC', 'In-unit Laundry'],
    available: true,
    availableFrom: '2025-01-15',
    rating: 4.9,
    reviewCount: 42,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 40.7282,
    lng: -73.9942,
    neighbourhood:
      'Downtown Brooklyn is a vibrant hub of culture, dining, and commerce, blending the historic character of brownstone-lined streets with the energy of a thriving urban neighborhood. World-class restaurants, boutique shops, and convenient subway access make it one of NYC\'s most coveted addresses.',
    createdAt: new Date('2024-06-01'),
  },
  {
    slug: 'prop-002',
    title: 'SoHo Artist Studio',
    type: 'Studio',
    city: 'New York',
    zip: '10013',
    address: '147 Spring St, Manhattan, NY 10013',
    price: 3100,
    beds: 0,
    baths: 1,
    area: 620,
    description:
      'An exquisitely designed studio in the prestigious SoHo Cast Iron Historic District. Original hardwood floors and oversized factory windows pay homage to the building\'s artistic heritage, while the thoughtfully curated interior provides a modern, minimalist sanctuary.\n\nThe Murphy bed folds away to reveal a generous living area perfect for a home studio or lounge space. The sleek kitchen features integrated appliances and custom cabinetry. This is SoHo living at its most refined.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'Elevator', 'Storage'],
    available: true,
    availableFrom: '2025-02-01',
    rating: 4.6,
    reviewCount: 28,
    featured: true,
    isNewListing: false,
    agent: agents[0],
    lat: 40.7246,
    lng: -74.003,
    neighbourhood:
      'SoHo is synonymous with world-class art, fashion, and dining. Cobblestone streets lead past landmark galleries, high-end boutiques, and some of New York\'s finest restaurants.',
    createdAt: new Date('2024-07-15'),
  },
  {
    slug: 'prop-003',
    title: 'Tribeca Penthouse',
    type: 'Apartment',
    city: 'New York',
    zip: '10007',
    address: '88 Leonard St, Tribeca, NY 10007',
    price: 8500,
    beds: 4,
    baths: 3,
    area: 2800,
    description:
      'An extraordinary full-floor penthouse with 360-degree views of Manhattan, the Hudson River, and the Brooklyn Bridge. This rare offering features four bedrooms, three spa bathrooms, a chef\'s kitchen with Wolf/Sub-Zero appliances, a private terrace, and direct elevator access.\n\nThe building amenities include 24-hour doorman, live-in super, fitness center, and a beautifully landscaped roof deck.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Gym', 'Concierge', 'Rooftop Terrace', 'AC', 'In-unit Laundry', 'Doorman', 'Private Terrace'],
    available: true,
    availableFrom: '2025-03-01',
    rating: 5.0,
    reviewCount: 17,
    featured: true,
    isNewListing: true,
    agent: agents[0],
    lat: 40.7178,
    lng: -74.009,
    neighbourhood:
      'Tribeca (Triangle Below Canal Street) is one of Manhattan\'s most prestigious neighborhoods, known for its converted warehouses, celebrity residents, and exceptional restaurants.',
    createdAt: new Date('2024-11-01'),
  },

  // ── Los Angeles ───────────────────────────────────────────────────────────
  {
    slug: 'prop-004',
    title: 'Silver Lake Modern',
    type: 'House',
    city: 'Los Angeles',
    zip: '90026',
    address: '2341 Hyperion Ave, Silver Lake, CA 90026',
    price: 5800,
    beds: 3,
    baths: 2,
    area: 1900,
    description:
      'A meticulously renovated mid-century modern home perched above the Silver Lake Reservoir with panoramic views of the hills and the iconic reservoir. Open-plan living, chef\'s kitchen, private pool deck, and a two-car garage.\n\nThe home has been freshly updated with polished concrete floors, designer light fixtures, and smart home technology throughout.',
    images: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Pool', 'AC', 'Garden', 'Smart Home'],
    available: true,
    availableFrom: '2025-01-20',
    rating: 4.8,
    reviewCount: 31,
    featured: true,
    isNewListing: false,
    agent: agents[1],
    lat: 34.0877,
    lng: -118.2699,
    neighbourhood:
      'Silver Lake is LA\'s creative epicenter — a hillside neighborhood of indie coffee shops, vinyl record stores, and eclectic restaurants.',
    createdAt: new Date('2024-05-20'),
  },
  {
    slug: 'prop-005',
    title: 'Venice Beach Bungalow',
    type: 'House',
    city: 'Los Angeles',
    zip: '90291',
    address: '15 Breeze Ave, Venice, CA 90291',
    price: 4900,
    beds: 2,
    baths: 1,
    area: 1050,
    description:
      'A charming craftsman bungalow just two blocks from Venice Beach with a beautifully restored interior and a private sun-drenched backyard. The open kitchen flows into the living space, making it ideal for indoor-outdoor California living.\n\nWalk to the beach, the boardwalk, Abbot Kinney\'s world-famous boutiques, and some of LA\'s best restaurants.',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'Garden', 'Washer/Dryer', 'Bike Storage'],
    available: true,
    availableFrom: '2025-02-15',
    rating: 4.7,
    reviewCount: 23,
    featured: false,
    isNewListing: false,
    agent: agents[1],
    lat: 33.9913,
    lng: -118.4682,
    neighbourhood:
      'Venice is one of LA\'s most dynamic neighborhoods — a blend of beach culture, street art, and tech creativity that gives it a truly unique energy.',
    createdAt: new Date('2024-08-10'),
  },
  {
    slug: 'prop-006',
    title: 'West Hollywood Condo',
    type: 'Condo',
    city: 'Los Angeles',
    zip: '90046',
    address: '8720 Sunset Blvd, West Hollywood, CA 90046',
    price: 3800,
    beds: 2,
    baths: 2,
    area: 1150,
    description:
      'A chic, light-filled condo on the famed Sunset Strip with floor-to-ceiling windows, a private balcony with city views, and an open-plan layout ideal for modern city living.\n\nBuilding amenities include a rooftop pool, fitness center, valet parking, and 24-hour concierge. Minutes from the best dining, nightlife, and entertainment LA has to offer.',
    images: [
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Pool', 'Gym', 'Concierge', 'AC', 'Rooftop Terrace'],
    available: true,
    availableFrom: '2025-01-01',
    rating: 4.5,
    reviewCount: 38,
    featured: true,
    isNewListing: false,
    agent: agents[1],
    lat: 34.0901,
    lng: -118.3874,
    neighbourhood:
      'West Hollywood sits at the cultural heart of LA, home to the Sunset Strip, world-class restaurants, and the creative industries that define Hollywood.',
    createdAt: new Date('2024-04-15'),
  },

  // ── San Francisco ─────────────────────────────────────────────────────────
  {
    slug: 'prop-007',
    title: 'Pacific Heights Victorian',
    type: 'House',
    city: 'San Francisco',
    zip: '94115',
    address: '2657 Broadway St, Pacific Heights, CA 94115',
    price: 7200,
    beds: 4,
    baths: 3,
    area: 2400,
    description:
      'A grand, fully restored Victorian home in the prestigious Pacific Heights neighborhood, offering sweeping views of the Bay, Marin County, and the Golden Gate Bridge. Soaring ceilings, original crown molding, hardwood floors throughout, and a chef\'s kitchen with marble countertops.\n\nThe home features a private garden, a formal dining room, a library, and off-street parking for two cars.',
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=80',
      'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Garden', 'Fireplace', 'Washer/Dryer', 'Storage'],
    available: true,
    availableFrom: '2025-02-01',
    rating: 4.9,
    reviewCount: 19,
    featured: true,
    isNewListing: false,
    agent: agents[2],
    lat: 37.7934,
    lng: -122.4351,
    neighbourhood:
      'Pacific Heights is one of San Francisco\'s most exclusive residential neighborhoods, known for its stately mansions, stunning bay views, and the upscale Fillmore Street shopping and dining corridor.',
    createdAt: new Date('2024-09-01'),
  },
  {
    slug: 'prop-008',
    title: 'Mission District Loft',
    type: 'Apartment',
    city: 'San Francisco',
    zip: '94110',
    address: '500 Florida St, Mission District, CA 94110',
    price: 3600,
    beds: 1,
    baths: 1,
    area: 820,
    description:
      'A bright, airy warehouse loft in the heart of the Mission with polished concrete floors, exposed ductwork, and oversized windows. The open-concept space features a custom kitchen island and a mezzanine sleeping area.\n\nSurrounded by the Mission\'s legendary murals, taquerias, and vibrant nightlife — walk to BART in under 5 minutes.',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&q=80',
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&q=80',
      'https://images.unsplash.com/photo-1537833885069-f879df82dbb1?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Bike Storage', 'Washer/Dryer', 'AC'],
    available: true,
    availableFrom: '2025-01-10',
    rating: 4.4,
    reviewCount: 44,
    featured: false,
    isNewListing: false,
    agent: agents[2],
    lat: 37.7596,
    lng: -122.4103,
    neighbourhood:
      'The Mission District is San Francisco\'s most culturally rich neighborhood — a vibrant canvas of street art, Latin culture, and some of the city\'s best restaurants.',
    createdAt: new Date('2024-06-25'),
  },
  {
    slug: 'prop-009',
    title: 'Hayes Valley Studio',
    type: 'Studio',
    city: 'San Francisco',
    zip: '94102',
    address: '340 Octavia St, Hayes Valley, CA 94102',
    price: 2400,
    beds: 0,
    baths: 1,
    area: 480,
    description:
      'A thoughtfully designed studio apartment in the heart of Hayes Valley, one of SF\'s most walkable and stylish neighborhoods. The studio features a Murphy bed, built-in shelving, and a Juliet balcony.\n\nSteps from the best boutiques, farm-to-table restaurants, and Patricia\'s Green park. Easy access to multiple MUNI lines.',
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&q=80',
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'Elevator', 'Pet Friendly'],
    available: true,
    availableFrom: '2025-01-05',
    rating: 4.3,
    reviewCount: 56,
    featured: false,
    isNewListing: true,
    agent: agents[2],
    lat: 37.7758,
    lng: -122.4244,
    neighbourhood:
      'Hayes Valley has transformed from a gritty underpass into one of SF\'s most desirable neighborhoods — a curated collection of design studios, wine bars, and excellent restaurants.',
    createdAt: new Date('2024-10-15'),
  },

  // ── Miami ─────────────────────────────────────────────────────────────────
  {
    slug: 'prop-010',
    title: 'Brickell Bay View',
    type: 'Condo',
    city: 'Miami',
    zip: '33131',
    address: '1300 S Miami Ave, Brickell, FL 33131',
    price: 4600,
    beds: 2,
    baths: 2,
    area: 1300,
    description:
      'A luxury condo in Brickell\'s most prestigious tower with breathtaking Biscayne Bay views from every room. Floor-to-ceiling impact glass, Italian marble floors, and a wraparound balcony create an unparalleled living experience.\n\nFull-floor amenities include a resort-style pool deck, spa, fitness center, wine bar, and 24-hour valet.',
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80',
      'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Pool', 'Gym', 'Concierge', 'AC', 'Spa', 'Valet'],
    available: true,
    availableFrom: '2025-01-01',
    rating: 4.8,
    reviewCount: 27,
    featured: true,
    isNewListing: false,
    agent: agents[3],
    lat: 25.7617,
    lng: -80.1918,
    neighbourhood:
      'Brickell is Miami\'s sophisticated financial district — a skyline of gleaming towers above a walkable neighborhood of upscale restaurants, cocktail bars, and bayside parks.',
    createdAt: new Date('2024-03-10'),
  },
  {
    slug: 'prop-011',
    title: 'Wynwood Art Loft',
    type: 'Apartment',
    city: 'Miami',
    zip: '33127',
    address: '310 NW 26th St, Wynwood, FL 33127',
    price: 2900,
    beds: 1,
    baths: 1,
    area: 780,
    description:
      'Live at the epicenter of Miami\'s world-famous arts district in this stunning industrial loft directly across from the Wynwood Walls. Polished concrete floors, 15-foot ceilings, raw steel accents, and a private courtyard.\n\nWalk to galleries, rooftop bars, and the best brunches in Miami.',
    images: [
      'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&q=80',
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=1200&q=80',
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'Courtyard', 'Pet Friendly', 'Bike Storage'],
    available: true,
    availableFrom: '2025-02-01',
    rating: 4.5,
    reviewCount: 33,
    featured: false,
    isNewListing: true,
    agent: agents[3],
    lat: 25.8007,
    lng: -80.1989,
    neighbourhood:
      'Wynwood is Miami\'s globally recognized arts district, known for its vibrant street murals, galleries, and a booming food and nightlife scene.',
    createdAt: new Date('2024-11-10'),
  },

  // ── Chicago ────────────────────────────────────────────────────────────────
  {
    slug: 'prop-012',
    title: 'Lincoln Park Greystone',
    type: 'House',
    city: 'Chicago',
    zip: '60614',
    address: '2150 N Sheffield Ave, Lincoln Park, IL 60614',
    price: 4800,
    beds: 4,
    baths: 2,
    area: 2200,
    description:
      'A beautifully preserved 1890s greystone townhouse on one of Lincoln Park\'s most charming tree-lined streets. The home retains original architectural details — decorative cornices, pocket doors, and fireplaces — while offering a fully modernized kitchen, updated baths, and central air.\n\nPrivate rear deck, a charming front garden, and a two-car garage. Steps from Lincoln Park Zoo, the lakefront, and dining on Halsted.',
    images: [
      'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=1200&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Garden', 'Fireplace', 'AC', 'Washer/Dryer'],
    available: true,
    availableFrom: '2025-01-15',
    rating: 4.7,
    reviewCount: 21,
    featured: false,
    isNewListing: false,
    agent: agents[4],
    lat: 41.921,
    lng: -87.6538,
    neighbourhood:
      'Lincoln Park is one of Chicago\'s most beloved neighborhoods — a leafy, family-friendly area bordering the zoo, the lakefront, and some of the city\'s finest restaurants.',
    createdAt: new Date('2024-07-01'),
  },
  {
    slug: 'prop-013',
    title: 'River North Penthouse',
    type: 'Condo',
    city: 'Chicago',
    zip: '60654',
    address: '600 N Lake Shore Dr, River North, IL 60654',
    price: 6500,
    beds: 3,
    baths: 2,
    area: 1900,
    description:
      'A jaw-dropping penthouse with panoramic Chicago skyline and Lake Michigan views from every room. This full-floor unit features herringbone hardwood floors, a chef\'s kitchen with Sub-Zero and Wolf appliances, and a sprawling wraparound terrace ideal for entertaining.\n\nBuilding amenities include an indoor pool, fitness center, wine storage, and 24-hour door staff.',
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80',
      'https://images.unsplash.com/photo-1580041065738-e72023775cdc?w=1200&q=80',
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Pool', 'Gym', 'Concierge', 'AC', 'Rooftop Terrace', 'Wine Storage'],
    available: true,
    availableFrom: '2025-03-01',
    rating: 4.9,
    reviewCount: 14,
    featured: true,
    isNewListing: true,
    agent: agents[4],
    lat: 41.8919,
    lng: -87.6165,
    neighbourhood:
      'River North is Chicago\'s most vibrant urban neighborhood — gallery row, Michelin-starred restaurants, and easy access to the Magnificent Mile.',
    createdAt: new Date('2024-11-20'),
  },

  // ── Austin ─────────────────────────────────────────────────────────────────
  {
    slug: 'prop-014',
    title: 'East Austin Compound',
    type: 'House',
    city: 'Austin',
    zip: '78702',
    address: '1823 E 6th St, East Austin, TX 78702',
    price: 3900,
    beds: 3,
    baths: 2,
    area: 1700,
    description:
      'A stunning contemporary compound in the heart of East Austin — the city\'s most creative and rapidly evolving neighborhood. This three-bedroom home features an open-plan layout, a designer kitchen, and a large backyard with a deck, outdoor kitchen, and hot tub.\n\nWalk to dozens of acclaimed restaurants, bars, and coffee shops. Live music is never more than a block away.',
    images: [
      'https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=1200&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'Garden', 'Hot Tub', 'Outdoor Kitchen', 'Smart Home'],
    available: true,
    availableFrom: '2025-01-20',
    rating: 4.8,
    reviewCount: 36,
    featured: false,
    isNewListing: false,
    agent: agents[4],
    lat: 30.2627,
    lng: -97.7199,
    neighbourhood:
      'East Austin is the city\'s cultural heartbeat — a rapidly evolving neighborhood of murals, craft breweries, taco trucks, and some of Austin\'s most celebrated restaurants.',
    createdAt: new Date('2024-05-10'),
  },
  {
    slug: 'prop-015',
    title: 'Downtown Austin High-Rise',
    type: 'Apartment',
    city: 'Austin',
    zip: '78701',
    address: '360 Nueces St, Downtown Austin, TX 78701',
    price: 3200,
    beds: 1,
    baths: 1,
    area: 860,
    description:
      'A sleek, high-floor apartment in Austin\'s iconic 360 Condominiums tower with sweeping views of Lady Bird Lake and the downtown skyline. Floor-to-ceiling windows, polished concrete floors, and a state-of-the-art kitchen make this an exceptional urban retreat.\n\nWalk to the hike-and-bike trail, Rainey Street, and the best of downtown Austin.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Pool', 'Gym', 'Concierge', 'AC', 'Rooftop Terrace'],
    available: true,
    availableFrom: '2025-02-01',
    rating: 4.6,
    reviewCount: 41,
    featured: false,
    isNewListing: false,
    agent: agents[4],
    lat: 30.2671,
    lng: -97.7495,
    neighbourhood:
      'Downtown Austin sits at the intersection of tech culture and live music, with Lady Bird Lake, world-class restaurants, and the vibrant 6th Street entertainment district.',
    createdAt: new Date('2024-04-20'),
  },

  // ── Seattle ────────────────────────────────────────────────────────────────
  {
    slug: 'prop-016',
    title: 'Capitol Hill Craftsman',
    type: 'House',
    city: 'Seattle',
    zip: '98102',
    address: '1540 E Olive Way, Capitol Hill, WA 98102',
    price: 4100,
    beds: 3,
    baths: 2,
    area: 1800,
    description:
      'A beautifully restored 1920s craftsman bungalow on Capitol Hill\'s most sought-after street. Original fir floors, craftsman built-ins, and a wrap-around porch blend seamlessly with a fully updated kitchen and a stunning primary suite with rainfall shower.\n\nThe private backyard garden is a rare urban oasis, perfect for entertaining.',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
      'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Parking', 'Garden', 'Fireplace', 'Washer/Dryer', 'AC'],
    available: true,
    availableFrom: '2025-01-25',
    rating: 4.7,
    reviewCount: 29,
    featured: false,
    isNewListing: false,
    agent: agents[2],
    lat: 47.6205,
    lng: -122.3188,
    neighbourhood:
      'Capitol Hill is Seattle\'s most vibrant neighborhood — a hub of arts, culture, nightlife, and exceptional dining, with easy access to downtown.',
    createdAt: new Date('2024-08-20'),
  },
  {
    slug: 'prop-017',
    title: 'South Lake Union Studio',
    type: 'Studio',
    city: 'Seattle',
    zip: '98109',
    address: '440 Terry Ave N, South Lake Union, WA 98109',
    price: 2200,
    beds: 0,
    baths: 1,
    area: 510,
    description:
      'A modern, light-filled studio in Seattle\'s fastest-growing tech neighborhood, walking distance from Amazon\'s campus. Floor-to-ceiling windows, a smart layout with built-in storage, and a gourmet kitchen make this studio feel far larger than its footprint.\n\nBuilding amenities include a rooftop deck with lake views, fitness center, and a shared workshop space.',
    images: [
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=1200&q=80',
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Gym', 'Rooftop Terrace', 'AC', 'Bike Storage', 'Pet Friendly'],
    available: true,
    availableFrom: '2025-01-01',
    rating: 4.4,
    reviewCount: 52,
    featured: false,
    isNewListing: true,
    agent: agents[2],
    lat: 47.6235,
    lng: -122.3367,
    neighbourhood:
      'South Lake Union is Seattle\'s tech corridor — a rapidly growing urban neighborhood with world-class restaurants, easy transit, and stunning lake views.',
    createdAt: new Date('2024-10-01'),
  },

  // ── Boston ─────────────────────────────────────────────────────────────────
  {
    slug: 'prop-018',
    title: 'Beacon Hill Brownstone',
    type: 'Apartment',
    city: 'Boston',
    zip: '02108',
    address: '14 Chestnut St, Beacon Hill, MA 02108',
    price: 3800,
    beds: 2,
    baths: 1,
    area: 1100,
    description:
      'A classic Beacon Hill brownstone apartment with original wide-plank pine floors, decorative fireplace, and beautifully proportioned rooms on a gas-lit, cobblestone street. The flat spans the entire second floor of an 1840s Federal-style townhouse.\n\nA short stroll from the State House, Boston Common, and the boutiques of Charles Street.',
    images: [
      'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=1200&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Fireplace', 'Washer/Dryer', 'Storage'],
    available: true,
    availableFrom: '2025-02-15',
    rating: 4.6,
    reviewCount: 24,
    featured: false,
    isNewListing: false,
    agent: agents[0],
    lat: 42.3578,
    lng: -71.0659,
    neighbourhood:
      'Beacon Hill is Boston\'s most iconic neighborhood — a preserved enclave of Federal architecture, brick sidewalks, and gas-lit streets steps from the Common.',
    createdAt: new Date('2024-06-15'),
  },
  {
    slug: 'prop-019',
    title: 'South End Condo',
    type: 'Condo',
    city: 'Boston',
    zip: '02118',
    address: '555 Tremont St, South End, MA 02118',
    price: 4300,
    beds: 2,
    baths: 2,
    area: 1250,
    description:
      'A stunning bi-level condo in a beautifully converted church on Tremont Street. The dramatic double-height living room features original stained glass windows, a mezzanine bedroom, and a chef\'s kitchen at the altar level.\n\nThe South End is Boston\'s premier dining neighborhood, and this address puts the best of it at your doorstep.',
    images: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200&q=80',
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['AC', 'In-unit Laundry', 'Storage', 'Elevator'],
    available: true,
    availableFrom: '2025-03-01',
    rating: 4.8,
    reviewCount: 18,
    featured: false,
    isNewListing: true,
    agent: agents[0],
    lat: 42.3435,
    lng: -71.0751,
    neighbourhood:
      'The South End is Boston\'s culinary capital — a Victorian brownstone neighborhood with the highest concentration of restaurants per capita in the city.',
    createdAt: new Date('2024-11-05'),
  },
  {
    slug: 'prop-020',
    title: 'Cambridge Studio Near Harvard',
    type: 'Studio',
    city: 'Boston',
    zip: '02138',
    address: '29 Garden St, Cambridge, MA 02138',
    price: 2600,
    beds: 0,
    baths: 1,
    area: 440,
    description:
      'A bright, fully furnished studio apartment a five-minute walk from Harvard Yard in leafy Cambridge. Perfect for a visiting academic, young professional, or anyone who wants to live in one of America\'s most intellectually vibrant communities.\n\nAll utilities included. Furnished with a queen bed, full kitchen, and study area.',
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80',
    ],
    videoUrl: null,
    amenities: ['Furnished', 'Utilities Included', 'Washer/Dryer', 'AC'],
    available: true,
    availableFrom: '2025-01-01',
    rating: 4.3,
    reviewCount: 67,
    featured: false,
    isNewListing: false,
    agent: agents[0],
    lat: 42.3785,
    lng: -71.1187,
    neighbourhood:
      'Cambridge is a world-class university city — the home of Harvard and MIT — offering exceptional dining, culture, and one of America\'s most walkable urban environments.',
    createdAt: new Date('2024-02-01'),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed function
// ─────────────────────────────────────────────────────────────────────────────
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
  console.log('[Seed] Inserting 20 properties…');
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
    images: [properties[3].images[0]],
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
