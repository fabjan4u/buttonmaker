export const BUTTON_TEMPLATES = [
  {
    id: '58mm',
    name: '58 mm (VEVOR 2.25")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 58.0,
    cutDiameterMm: 70.0,
    bleedMm: 6.0,
    press: 'VEVOR 58mm Button Maker (Cirkelsnijder / Stansmaat: 70 mm)',
    description: 'De populairste VEVOR buttonmaat. 58mm zichtbaar, 70mm snijden.'
  },
  {
    id: '32mm',
    name: '32 mm (VEVOR 1.25")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 32.0,
    cutDiameterMm: 44.0,
    bleedMm: 6.0,
    press: 'VEVOR 32mm Button Maker (Cirkelsnijder / Stansmaat: 44 mm)',
    description: 'Exact afgestemd op de VEVOR 32mm stans (44mm papiermaat).'
  },
  {
    id: '75mm',
    name: '75 mm (VEVOR 3")',
    category: 'metric',
    popular: true,
    faceDiameterMm: 75.0,
    cutDiameterMm: 86.0,
    bleedMm: 5.5,
    press: 'VEVOR 75mm Button Maker (Cirkelsnijder / Stansmaat: 86 mm)',
    description: 'Grote VEVOR badge. 75mm zichtbaar, 86mm snijden.'
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
    faceDiameterMm: 32.0,
    cutDiameterMm: 44.0,
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
