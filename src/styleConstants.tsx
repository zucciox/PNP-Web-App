export const resourceColors: Record<string, string> = {
    // --- Energy & Fluids Chain ---
    Gas: '#4da699',          // FIXED: Lifted from murky teal to a readable, desaturated seafoam
    Methane: '#ff7700',      // Vibrant amber-orange
    Energy: '#ffff00',       // Max brightness electric yellow
    Oil: '#a87cc3',          // FIXED: Changed from purple-black to a faded neon lavender/oil-slick purple
    Fuel: '#ff0022',         // Ultra-bright racing red
    
    // --- Basics & Lifeline ---
    Treasury: '#ffbe00',     // Bright marigold gold
    Water: '#3a86ff',        // Vibrant digital blue
    Food: '#cd7f32',         // FIXED: Slightly brightened to a warm bronze/terracotta
    Oxygen: '#38b000',       // Crisp, bright life-giving green
    
    // --- Carbon & Nuclear ---
    Coal: '#8a8a8a',         // FIXED: Lifted from near-black charcoal to a visible medium-light slate grey
    UraniumOre: '#5b9e53',   // FIXED: Brightened from deep forest to a pale, mossy military green
    Uranium: '#39ff14',      // Blindingly bright neon green
    
    // --- Industrial Metals & Ores ---
    IronOre: '#b35c5c',      // FIXED: Lifted from dark rust red to a dusty, readable rose-rust
    Steel: '#a89078',        // Bright metallic tan/grey
    
    AluminumOre: '#8e8ea8',  // FIXED: Lifted from dark slate to a soft, readable lavender-grey
    Aluminum: '#d5b8ff',     // Bright silvery-lilac
    
    CopperOre: '#cd853f',    // FIXED: Brightened from dark earth-brown to a visible peru/tan-brown
    Copper: '#ff7f50',       // Bright shiny coral/copper
    
    TitaniumOre: '#5f8da8',  // FIXED: Lifted from heavy ocean blue to a muted, readable steel blue
    Titanium: '#70d6ff',     // Bright electric cyan
    
    // --- Precious Metals & Gems ---
    GoldOre: '#d4af37',      // FIXED: Lifted from muddy ochre to a distinct, metallic dull-gold
    Gold: '#ffee55',         // Super bright glittering yellow-gold
    
    PlatinumOre: '#9fa0b0',  // FIXED: Lifted from dark grit to a clear, muted platinum-grey
    Platinum: '#e2e2ec',     // Bright white-silver
    
    Diamond: '#90e0ef',      // Highly brilliant diamond blue
    NaturalGas: '#4db6ac'    // Soft teal
}

export const nationColors: Record<string, string> = {
  A: '#00bfff', // Cyan / Light Blue (Slightly boosted for vibrancy)
  B: '#ffcc00', // Amber / Bright Yellow (Brightened)
  C: '#e65c84', // Maroon / Burgundy -> Lifted to a vibrant mauve/rose
  D: '#2bb32b', // Bright Green (Kept, already high contrast)
  E: '#4a82f0', // Medium Blue (Lifted from dark blue to neon/sky variant)
  F: '#a866ff', // Purple (Lightened to a vivid lavender-purple)
  G: '#ff7a14', // Orange (Saturated and brightened)
  H: '#b36b19', // Brown -> Lifted to a warm, readable copper/tan
  I: '#5dade2', // Soft Sky Blue (Kept, excellent for dark mode)
  J: '#2ecc71', // Emerald / Teal Green (Brightened slightly)
  K: '#e0e0e0', // Light Gray (Flipped back to light for dark mode contrast)
  L: '#f1c40f', // Yellow (Boosted for crisp visibility)
  M: '#bdc3c7', // Light Gray (Kept, good mid-light tone)
  N: '#1abc9c', // Darker Green -> Shifted to a bright Teal/Mint for contrast
  O: '#87a96b', // Olive / Forest Green -> Lifted to a visible sage/light olive
  P: '#4382f6', // Royal Blue (Brightened so it doesn't bleed into the black)
  Q: '#ff4d4d', // Red (Brightened to a neon pastel red so it doesn't look muddy)
  R: '#ffffff', // White (Flipped back to pure white for stark dark mode contrast)
  S: '#d972ff', // Lavender / Light Violet (Kept, already great)
  T: '#ff8442', // Light Orange / Coral (Slightly brightened)
  U: '#bfff00', // Lime Green (Slightly boosted)
  V: '#bb6fd9', // Violet / Plum (Lightened)
  W: '#95a5a6', // Charcoal Gray -> Lifted to a readable cool gray
  X: '#00d2ff', // Turquoise (Brightened)
  Y: '#ff3333', // Crimson Red (Lifted to vivid crimson)
  Z: '#f3cf2a', // Gold / Mustard Yellow (Brightened)
};

export const stableTextColor: string = '#5690f5';
export const additiveTextColor: string = '#44ff44';
export const negativeTextColor: string = '#ff4444';