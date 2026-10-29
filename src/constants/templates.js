export const BUTTON_TEMPLATES = [
  {
    id: '32mm',
    name: '32 mm (JM-32 • 36 mm Groene Lijn / 44 mm Stans)',
    category: 'metric',
    popular: true,
    faceDiameterMm: 36.0,
    cutDiameterMm: 44.0,
    bleedMm: 4.0,
    press: 'VEVOR JM-32 Button Maker (Stans: 44 mm)',
    description: '36 mm maximale afbeelding op de groene lijn, 44 mm VEVOR stansmaat.'
  },
  {
    id: '58mm',
    name: '58 mm (JM-58 • 58 mm Groene Lijn / 70 mm Stans)',
    category: 'metric',
    popular: true,
    faceDiameterMm: 58.0,
    cutDiameterMm: 70.0,
    bleedMm: 6.0,
    press: 'VEVOR JM-58 Button Maker (Stans: 70 mm)',
    description: '58 mm ontwerp op de groene lijn, 70 mm VEVOR stansmaat.'
  },
  {
    id: '75mm',
    name: '75 mm (JM-75 • 75 mm Groene Lijn / 86 mm Stans)',
    category: 'metric',
    popular: true,
    faceDiameterMm: 75.0,
    cutDiameterMm: 86.0,
    bleedMm: 5.5,
    press: 'VEVOR JM-75 Button Maker (Stans: 86 mm)',
    description: '75 mm ontwerp op de groene lijn, 86 mm VEVOR stansmaat.'
  },
  {
    id: '38mm-badgers',
    name: '38 mm (Mad Badgers • 38 mm Design / 42 mm Bleed)',
    category: 'metric',
    popular: false,
    faceDiameterMm: 38.0,
    cutDiameterMm: 42.0,
    bleedMm: 2.0,
    press: '38 mm Badge Maker (Cirkelsnijder: 42 mm)',
    description: 'The Mad Badgers standaard: 38 mm zichtbaar, 42 mm snijden.'
  },
  {
    id: '58mm-badgers',
    name: '58 mm (Mad Badgers • 58 mm Design / 62 mm Bleed)',
    category: 'metric',
    popular: false,
    faceDiameterMm: 58.0,
    cutDiameterMm: 62.0,
    bleedMm: 2.0,
    press: '58 mm Badge Maker (Cirkelsnijder: 62 mm)',
    description: 'The Mad Badgers standaard: 58 mm zichtbaar, 62 mm snijden.'
  },
  {
    id: '25mm',
    name: '25 mm (VEVOR 1")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 25.0,
    cutDiameterMm: 35.0,
    bleedMm: 5.0,
    press: 'VEVOR 25mm Button Maker (Stansmaat: 35 mm)',
    description: 'Kleine klassieke pin badge.'
  },
  {
    id: '44mm',
    name: '44 mm (VEVOR 1.75")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 44.0,
    cutDiameterMm: 54.0,
    bleedMm: 5.0,
    press: 'VEVOR 44mm Button Maker (Stansmaat: 54 mm)',
    description: 'Mooi tussenformaat voor logo’s en illustraties.'
  },
  {
    id: '50mm',
    name: '50 mm (VEVOR 2")',
    category: 'metric',
    popular: false,
    faceDiameterMm: 50.0,
    cutDiameterMm: 63.0,
    bleedMm: 6.5,
    press: 'VEVOR 50mm Button Maker (Stansmaat: 63 mm)',
    description: 'Veel gebruikt voor zakspiegels en flesopeners.'
  },
  {
    id: 'custom',
    name: 'Aangepaste maat (Custom)',
    category: 'custom',
    popular: false,
    faceDiameterMm: 36.0,
    cutDiameterMm: 44.0,
    bleedMm: 4.0,
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
