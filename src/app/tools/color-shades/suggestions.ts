export interface ColorSuggestion {
  id: string;
  name: string;
  colors: string[];
  description: string;
  bestFor: string[];
}

export const COLOR_SUGGESTIONS: {
  category: string;
  items: ColorSuggestion[];
}[] = [
  {
    category: "🎨 Classic Gradients",
    items: [
      {
        id: "classic-1",
        name: "Black to White",
        colors: ["#000000", "#ffffff"],
        description: "A timeless grayscale gradient for clean transitions.",
        bestFor: [
          "Background transitions",
          "UI elements",
          "Minimalist designs",
        ],
      },
      {
        id: "classic-2",
        name: "Primary Colors",
        colors: ["#ff0000", "#00ff00", "#0000ff"],
        description: "Bold and vibrant primary color transitions.",
        bestFor: ["Children's apps", "Creative designs", "Educational tools"],
      },
      {
        id: "classic-3",
        name: "Warm to Cool",
        colors: ["#ff5733", "#33aaff"],
        description: "A dynamic shift from warm reds to cool blues.",
        bestFor: ["Dashboards", "Data visualizations", "Dynamic UIs"],
      },
      {
        id: "classic-4",
        name: "Gray Tones",
        colors: ["#333333", "#999999", "#e0e0e0"],
        description: "Subtle gray shades for professional interfaces.",
        bestFor: ["Corporate websites", "Form backgrounds", "Neutral themes"],
      },
    ],
  },
  {
    category: "🏆 Brand Gradients",
    items: [
      {
        id: "brand-1",
        name: "Instagram",
        colors: ["#833ab4", "#fd1d1d", "#fcb045"],
        description: "Vibrant social media gradient inspired by Instagram.",
        bestFor: ["Social media graphics", "Modern UIs", "Marketing visuals"],
      },
      {
        id: "brand-2",
        name: "Spotify",
        colors: ["#1db954", "#191414"],
        description: "Bold green-to-black gradient from Spotify’s palette.",
        bestFor: ["Music-related designs", "Dark themes", "Entertainment apps"],
      },
      {
        id: "brand-3",
        name: "Twitter",
        colors: ["#1da1f2", "#e1f5fe"],
        description: "Light and airy blue gradient inspired by Twitter.",
        bestFor: ["Tech blogs", "Social platforms", "Light themes"],
      },
      {
        id: "brand-4",
        name: "Airbnb",
        colors: ["#ff5a5f", "#ff7a7f"],
        description: "Warm coral tones from Airbnb’s welcoming palette.",
        bestFor: ["Travel websites", "Hospitality apps", "Friendly UIs"],
      },
      {
        id: "brand-5",
        name: "Slack",
        colors: ["#4a154b", "#36c5f0", "#2eb67d"],
        description: "Eclectic gradient inspired by Slack’s vibrant identity.",
        bestFor: ["Collaboration tools", "Creative workspaces", "Team apps"],
      },
    ],
  },
  {
    category: "🌿 Nature Inspired",
    items: [
      {
        id: "nature-1",
        name: "Ocean Breeze",
        colors: ["#00c6fb", "#005bea"],
        description: "Cool blue tones evoking calm ocean waves.",
        bestFor: ["Travel sites", "Relaxing apps", "Wellness platforms"],
      },
      {
        id: "nature-2",
        name: "Sunset Glow",
        colors: ["#ff7e5f", "#feb47b"],
        description: "Warm orange and peach tones of a serene sunset.",
        bestFor: ["Restaurant sites", "Summer themes", "Event pages"],
      },
      {
        id: "nature-3",
        name: "Forest Canopy",
        colors: ["#1a3c34", "#4a7043", "#8bb077"],
        description: "Rich greens inspired by a lush forest.",
        bestFor: ["Eco-friendly brands", "Outdoor apps", "Nature blogs"],
      },
      {
        id: "nature-4",
        name: "Desert Sands",
        colors: ["#d4a017", "#e8c39e", "#f4e4bc"],
        description: "Warm, earthy tones of a desert landscape.",
        bestFor: ["Travel blogs", "Cultural sites", "Warm themes"],
      },
      {
        id: "nature-5",
        name: "Aurora Borealis",
        colors: ["#2e1e5b", "#00ddeb", "#6bffb8"],
        description: "Mystical blues and greens of the northern lights.",
        bestFor: ["Creative portfolios", "Sci-fi designs", "Night themes"],
      },
    ],
  },
  {
    category: "🌸 Pastel Dreams",
    items: [
      {
        id: "pastel-1",
        name: "Cotton Candy",
        colors: ["#ffb7c5", "#ffdde1"],
        description: "Soft pink tones for a sweet, delicate look.",
        bestFor: ["Fashion websites", "Baby products", "Feminine brands"],
      },
      {
        id: "pastel-2",
        name: "Mint Breeze",
        colors: ["#a8e6cf", "#dcedc1"],
        description: "Fresh mint and light green for a calming palette.",
        bestFor: ["Health apps", "Spa websites", "Minimalist UIs"],
      },
      {
        id: "pastel-3",
        name: "Lavender Mist",
        colors: ["#d7bde2", "#e8daef"],
        description: "Soothing lavender shades for serene designs.",
        bestFor: ["Wellness blogs", "Creative apps", "Soft interfaces"],
      },
      {
        id: "pastel-4",
        name: "Peach Whisper",
        colors: ["#ffdab9", "#ffefdb"],
        description: "Gentle peach tones for warm, inviting designs.",
        bestFor: ["Food blogs", "Hospitality sites", "Cozy themes"],
      },
    ],
  },
  {
    category: "⚡️ Neon Vibes",
    items: [
      {
        id: "neon-1",
        name: "Cyber Punk",
        colors: ["#ff00ff", "#00f0ff"],
        description: "Bold magenta-to-cyan gradient for futuristic designs.",
        bestFor: ["Gaming interfaces", "Tech startups", "Nightlife apps"],
      },
      {
        id: "neon-2",
        name: "Electric Lime",
        colors: ["#ccff00", "#33cc33"],
        description: "Vibrant lime green tones for high-energy visuals.",
        bestFor: ["Fitness apps", "Event promotions", "Youth brands"],
      },
      {
        id: "neon-3",
        name: "Hot Coral",
        colors: ["#ff4040", "#ff66cc"],
        description: "Fiery red-to-pink gradient for bold statements.",
        bestFor: ["Fashion brands", "Music festivals", "Creative campaigns"],
      },
      {
        id: "neon-4",
        name: "Ultra Violet",
        colors: ["#8a2be2", "#ff00ff"],
        description: "Electric purple shades for a vibrant edge.",
        bestFor: ["Art portfolios", "Creative agencies", "Modern UIs"],
      },
    ],
  },
  {
    category: "🖤 Monochromatic Tones",
    items: [
      {
        id: "mono-1",
        name: "Deep Blue",
        colors: ["#1c2526", "#2a4d69", "#4b86b4"],
        description: "Rich blue shades for a cohesive, professional look.",
        bestFor: ["Corporate sites", "Tech products", "Dark UIs"],
      },
      {
        id: "mono-2",
        name: "Warm Gray",
        colors: ["#4a3728", "#8b6f47", "#c9ad81"],
        description: "Neutral gray-brown tones for elegant simplicity.",
        bestFor: ["Portfolio sites", "Minimalist apps", "Luxury brands"],
      },
      {
        id: "mono-3",
        name: "Soft Red",
        colors: ["#4a0000", "#800000", "#b22222"],
        description: "Subtle red shades for bold yet refined designs.",
        bestFor: ["Restaurant menus", "Branding", "Cultural sites"],
      },
      {
        id: "mono-4",
        name: "Emerald Green",
        colors: ["#013220", "#355e3b", "#5b8c5a"],
        description: "Deep green tones for a natural, grounded feel.",
        bestFor: ["Eco brands", "Health products", "Outdoor themes"],
      },
    ],
  },
  {
    category: "🍂 Seasonal Moods",
    items: [
      {
        id: "season-1",
        name: "Autumn Harvest",
        colors: ["#8b4513", "#d2691e", "#f4a460"],
        description: "Warm brown and orange tones of fall.",
        bestFor: ["Seasonal promotions", "Food blogs", "Cozy UIs"],
      },
      {
        id: "season-2",
        name: "Winter Frost",
        colors: ["#e6e6fa", "#b0c4de", "#4682b4"],
        description: "Cool blues and whites for a wintry vibe.",
        bestFor: ["Holiday sites", "Winter campaigns", "Clean designs"],
      },
      {
        id: "season-3",
        name: "Spring Blossom",
        colors: ["#ff69b4", "#dda0dd", "#98fb98"],
        description: "Bright pinks and greens for a fresh spring look.",
        bestFor: ["Floral brands", "Event pages", "Youthful apps"],
      },
      {
        id: "season-4",
        name: "Summer Heat",
        colors: ["#ff4500", "#ff8c00", "#ffd700"],
        description: "Fiery orange and yellow tones for summer energy.",
        bestFor: ["Travel promotions", "Beach themes", "Vibrant UIs"],
      },
    ],
  },
  {
    category: "🌍 Cultural Hues",
    items: [
      {
        id: "cultural-1",
        name: "Saffron Spice",
        colors: ["#ff9933", "#cc3300", "#663300"],
        description: "Warm Indian-inspired tones for rich designs.",
        bestFor: ["Cultural sites", "Food apps", "Festive themes"],
      },
      {
        id: "cultural-2",
        name: "Sakura Bloom",
        colors: ["#ffb7c5", "#f08080", "#dc143c"],
        description: "Japanese cherry blossom-inspired pinks and reds.",
        bestFor: ["Art blogs", "Travel sites", "Elegant UIs"],
      },
      {
        id: "cultural-3",
        name: "Mediterranean Blue",
        colors: ["#0077b6", "#00b4d8", "#90e0ef"],
        description: "Bright blues inspired by Mediterranean coasts.",
        bestFor: ["Vacation sites", "Lifestyle blogs", "Summer themes"],
      },
      {
        id: "cultural-4",
        name: "African Sunset",
        colors: ["#ff4500", "#8b0000", "#4a2c00"],
        description: "Bold reds and browns of an African savanna sunset.",
        bestFor: ["Cultural events", "Travel campaigns", "Warm designs"],
      },
    ],
  },
  {
    category: "📼 Retro Aesthetics",
    items: [
      {
        id: "retro-1",
        name: "Vaporwave",
        colors: ["#ff71ce", "#01cdfe", "#05ffa1"],
        description: "Neon pinks and blues for a retro-futuristic vibe.",
        bestFor: ["Music apps", "Creative portfolios", "80s themes"],
      },
      {
        id: "retro-2",
        name: "Miami Vice",
        colors: ["#ff6f61", "#6b7280", "#4b0082"],
        description: "Bold coral and indigo tones from 80s pop culture.",
        bestFor: ["Entertainment sites", "Retro games", "Vibrant UIs"],
      },
      {
        id: "retro-3",
        name: "Synthwave",
        colors: ["#ff00ff", "#9400d3", "#4b0082"],
        description: "Deep purples for a nostalgic synthwave aesthetic.",
        bestFor: ["Music platforms", "Gaming UIs", "Night themes"],
      },
      {
        id: "retro-4",
        name: "Old School CRT",
        colors: ["#00ff00", "#008000", "#004d00"],
        description: "Green monochrome tones inspired by vintage CRT screens.",
        bestFor: ["Tech nostalgia", "Retro apps", "Minimalist designs"],
      },
    ],
  },
  {
    category: "🧘 Minimalist Palettes",
    items: [
      {
        id: "minimal-1",
        name: "Pure White",
        colors: ["#ffffff", "#f5f5f5", "#e0e0e0"],
        description: "Clean white shades for ultimate simplicity.",
        bestFor: ["Modern websites", "Clean UIs", "Luxury brands"],
      },
      {
        id: "minimal-2",
        name: "Slate Serenity",
        colors: ["#2f4f4f", "#708090", "#b0c4de"],
        description: "Cool slate tones for understated elegance.",
        bestFor: ["Professional apps", "Corporate sites", "Calm themes"],
      },
      {
        id: "minimal-3",
        name: "Soft Beige",
        colors: ["#f5f5dc", "#e6d5b8", "#d2b48c"],
        description: "Neutral beige tones for a warm, minimal look.",
        bestFor: ["Interior design sites", "Lifestyle blogs", "Cozy UIs"],
      },
      {
        id: "minimal-4",
        name: "Charcoal Depth",
        colors: ["#1c2526", "#36454f", "#536872"],
        description: "Dark charcoal shades for sleek, modern designs.",
        bestFor: ["Tech startups", "Dark themes", "Premium brands"],
      },
    ],
  },
];
