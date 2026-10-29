export const BUTTON_TEMPLATES = [
  {
    id: '58mm',
    name: '58 mm (2.25")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 58.0,
    cutDiameterMm: 70.0,
    bleedMm: 6.0,
    press: 'Populairste Europese & Hobby Persen (o.a. Chinese rode/blauwe pers, Badge-It XL)',
    description: 'De absolute standaard voor bands, scholen, evenementen en hobby.'
  },
  {
    id: '25mm',
    name: '25 mm (1")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 25.0,
    cutDiameterMm: 35.2,
    bleedMm: 5.1,
    press: 'Klassieke punk & band buttons (Tecre 100, Badge-It, Chinese mini pers)',
    description: 'Kleine, subtiele button voor tassen en jasjes.'
  },
  {
    id: '32mm',
    name: '32 mm (1.25")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 32.0,
    cutDiameterMm: 44.0,
    bleedMm: 6.0,
    press: 'Tecre 125, Enterprise Products, Micro pers',
    description: 'Iets groter dan 25mm, perfect voor logo’s en portretten.'
  },
  {
    id: '37mm',
    name: '37 mm (1.5")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 37.0,
    cutDiameterMm: 48.8,
    bleedMm: 5.9,
    press: 'Badge-It Classic, Tecre 150',
    description: 'Klassieke speelgoed Badge-It en medium formaat.'
  },
  {
    id: '44mm',
    name: '44 mm (1.75")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 44.0,
    cutDiameterMm: 54.0,
    bleedMm: 5.0,
    press: 'Tecre 175, Buttonboss',
    description: 'Mooi tussenformaat voor campagnes en illustraties.'
  },
  {
    id: '50mm',
    name: '50 mm (2")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 50.0,
    cutDiameterMm: 63.0,
    bleedMm: 6.5,
    press: 'Tecre 200, Spiegeltjes & flessenopeners',
    description: 'Veel gebruikt voor zakspiegels en flesopeners.'
  },
  {
    id: '75mm',
    name: '75 mm (3")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 75.0,
    cutDiameterMm: 86.3,
    bleedMm: 5.65,
    press: 'Tecre 300, Enterprise 75mm',
    description: 'Grote statement button, ideaal voor foto’s en verjaardagen.'
  },
  {
    id: 'us-125',
    name: '1.25" Tecre US (31.75mm)',
    category: 'imperial',
    popular: false,
    faceDiameterMm: 31.75,
    cutDiameterMm: 41.38, // 1.629 inch = 41.38 mm
    bleedMm: 4.81,
    press: 'Tecre 125 US Standard Punch',
    description: 'Exacte Amerikaanse Tecre stansmaat.'
  },
  {
    id: 'us-225',
    name: '2.25" Tecre US (57.15mm)',
    category: 'imperial',
    popular: false,
    faceDiameterMm: 57.15,
    cutDiameterMm: 66.68, // 2.625 inch = 66.68 mm
    bleedMm: 4.76,
    press: 'Tecre 225 US Standard Punch',
    description: 'Exacte Amerikaanse Tecre stansmaat voor 2.25 inch.'
  },
  {
    id: 'custom',
    name: 'Aangepaste maat (Custom)',
    category: 'custom',
    popular: false,
    faceDiameterMm: 58.0,
    cutDiameterMm: 70.0,
    bleedMm: 6.0,
    press: 'Eigen instelling',
    description: 'Voer zelf de exacte millimeters of inches in.'
  }
];

export const PAPER_FORMATS = [
  {
    id: 'a4',
    name: 'A4 (210 × 297 mm)',
    widthMm: 210,
    heightMm: 297,
    marginMm: 10,
    standard: 'Europa / Wereldwijd'
  },
  {
    id: 'letter',
    name: 'US Letter (8.5 × 11 in / 215.9 × 279.4 mm)',
    widthMm: 215.9,
    heightMm: 279.4,
    marginMm: 10,
    standard: 'Noord-Amerika'
  }
];

export const GOOGLE_FONTS = [
  { name: 'Inter (Modern Sans)', family: "'Inter', sans-serif" },
  { name: 'Montserrat (Vet & Rond)', family: "'Montserrat', sans-serif" },
  { name: 'Oswald (Compact & Krachtig)', family: "'Oswald', sans-serif" },
  { name: 'Bebas Neue (Hoofdletters & Poster)', family: "'Bebas Neue', cursive" },
  { name: 'Bangers (Comic / Pop-art)', family: "'Bangers', cursive" },
  { name: 'Pacifico (Speels Handschrift)', family: "'Pacifico', cursive" },
  { name: 'Playfair Display (Klassiek Serif)', family: "'Playfair Display', serif" },
  { name: 'Arial (Systeem standaard)', family: "Arial, sans-serif" },
  { name: 'Impact (Heavy Stijl)', family: "Impact, sans-serif" },
  { name: 'Courier New (Typewriter / Retro)', family: "'Courier New', monospace" }
];
