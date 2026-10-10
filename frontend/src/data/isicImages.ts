/**
 * Realistic dermoscopic image generators matching the 4 ISIC photos uploaded by the user:
 * - ISIC_0024311: Reticular reddish-brown lesion on pink skin with delicate vascular network
 * - ISIC_0024312: Diffuse light-brown / slate-grey macule with focal dark pigment and fine hairs
 * - ISIC_0024313: Dense, deeply pigmented jet-black/dark-brown nodular lesion on pale skin
 * - ISIC_0024314: Central dark-brown pigmented papule with radiating streaks and crossed hairs
 */

// Helper to create an SVG data URL
function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// 1. ISIC_0024311 (Vascular / Reticular pigmented lesion on pink skin)
export const ISIC_0024311_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="skinBg1" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#f8cfc8"/>
      <stop offset="50%" stop-color="#f5c2bb"/>
      <stop offset="100%" stop-color="#ecb3ab"/>
    </radialGradient>
    <radialGradient id="lesionBlush" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a6372d" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#934136" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#b65c4f" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#e09489" stop-opacity="0"/>
    </radialGradient>
    <filter id="skinTexture1">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.9   0 0 0 0 0.75   0 0 0 0 0.72   0 0 0 0.25 0"/>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>

  <!-- Base Skin -->
  <rect width="400" height="400" fill="url(#skinBg1)"/>

  <!-- Skin fine lines / stratum corneum texture -->
  <g stroke="#e29e94" stroke-width="0.7" opacity="0.4" fill="none">
    <path d="M10,40 Q150,60 380,30 M20,120 Q200,100 390,140 M15,220 Q180,240 385,210 M10,320 Q210,300 390,340"/>
    <path d="M50,10 Q60,180 40,390 M140,15 Q155,200 135,385 M260,20 Q245,190 270,390 M340,10 Q350,195 335,385"/>
  </g>

  <!-- Lesion Diffuse Pigment Blush -->
  <path d="M130,170 C140,110 240,90 280,130 C330,170 340,240 290,290 C250,330 170,330 130,280 C90,230 110,190 130,170 Z" fill="url(#lesionBlush)"/>

  <!-- Dense central vascular reticular pigment network -->
  <g stroke="#6e231c" stroke-width="1.6" fill="none" opacity="0.8">
    <circle cx="210" cy="190" r="14"/>
    <circle cx="230" cy="180" r="12"/>
    <circle cx="245" cy="155" r="16"/>
    <circle cx="190" cy="210" r="18"/>
    <circle cx="215" cy="225" r="15"/>
    <circle cx="180" cy="240" r="13"/>
    <circle cx="155" cy="265" r="14"/>
    <circle cx="240" cy="215" r="15"/>
    <circle cx="260" cy="235" r="12"/>
    <circle cx="225" cy="255" r="16"/>
    <circle cx="195" cy="275" r="11"/>
    <circle cx="170" cy="290" r="9"/>
    <!-- Interconnecting rete ridges -->
    <path d="M190,160 Q210,180 230,170 T260,150 M170,220 Q200,240 230,220 T270,230 M150,260 Q180,280 220,265 T255,270"/>
    <path d="M200,150 L205,280 M235,140 L240,260 M175,190 L180,290 M265,180 L250,250"/>
  </g>

  <!-- Intense dark brown focal clots (bleeding / thrombosis) -->
  <ellipse cx="245" cy="150" rx="14" ry="10" fill="#4d140e" opacity="0.9"/>
  <ellipse cx="205" cy="255" rx="10" ry="7" fill="#521711" opacity="0.9"/>
  <ellipse cx="155" cy="285" rx="8" ry="6" fill="#5c1c15" opacity="0.8"/>
</svg>
`);

// 2. ISIC_0024312 (Atypical pigmented lesion with blue-white veil and crossed hair strands)
export const ISIC_0024312_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="skinBg2" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#ebd3ce"/>
      <stop offset="60%" stop-color="#dfc2bc"/>
      <stop offset="100%" stop-color="#d4b4ae"/>
    </radialGradient>
    <radialGradient id="blueWhiteVeil" cx="54%" cy="48%" r="35%">
      <stop offset="0%" stop-color="#a49eb6" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#8a798f" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#b89381" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Base Skin -->
  <rect width="400" height="400" fill="url(#skinBg2)"/>

  <!-- Irregular patchy lesion border -->
  <path d="M100,160 C110,80 260,60 310,100 C360,140 370,250 310,320 C270,360 160,370 110,320 C70,270 90,200 100,160 Z" fill="#9e7b6c" opacity="0.6"/>
  <path d="M120,170 C140,110 240,90 290,120 C340,160 345,240 295,295 C250,335 170,340 130,290 C95,245 110,200 120,170 Z" fill="#755243" opacity="0.75"/>

  <!-- Blue-White Veil in central region -->
  <ellipse cx="225" cy="205" rx="75" ry="65" fill="url(#blueWhiteVeil)"/>

  <!-- Deep dark brown focal areas -->
  <circle cx="280" cy="155" r="16" fill="#3a1f16" opacity="0.85"/>
  <circle cx="295" cy="180" r="14" fill="#44261c" opacity="0.8"/>
  <ellipse cx="260" cy="290" rx="35" ry="20" fill="#583528" opacity="0.8"/>

  <!-- Dark Hair Follicles / Strands across the surface -->
  <g stroke="#1a1412" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.9">
    <path d="M245,10 Q243,45 245,75"/>
    <path d="M115,115 Q110,150 100,185"/>
    <path d="M270,145 Q290,185 305,210"/>
    <path d="M385,150 Q390,205 390,260"/>
    <path d="M138,285 Q125,335 108,390"/>
    <path d="M30,365 Q40,395 20,400"/>
  </g>
</svg>
`);

// 3. ISIC_0024313 (Deeply pigmented dark black/brown nodular lesion on pale skin)
export const ISIC_0024313_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="skinBg3" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#f1dfdc"/>
      <stop offset="70%" stop-color="#e7cfcc"/>
      <stop offset="100%" stop-color="#dcbeba"/>
    </radialGradient>
    <radialGradient id="haloBg" cx="45%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#99584d" stop-opacity="0.6"/>
      <stop offset="70%" stop-color="#b87a70" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#e7cfcc" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Pale Skin Background -->
  <rect width="400" height="400" fill="url(#skinBg3)"/>

  <!-- Subtle natural freckles and hair on periphery -->
  <ellipse cx="150" cy="205" rx="30" ry="22" fill="#ab766c" opacity="0.45"/>
  <ellipse cx="115" cy="225" rx="20" ry="16" fill="#ba8980" opacity="0.35"/>
  <ellipse cx="290" cy="320" rx="30" ry="14" fill="#ba8980" opacity="0.25"/>

  <!-- Inflammatory Erythematous / Pigmented Halo around the central nodule -->
  <ellipse cx="225" cy="205" rx="65" ry="60" fill="url(#haloBg)"/>

  <!-- Deep Jet-Black / Dark Brown Nodular Lesion with notched scalloped borders -->
  <path d="M205,145 C230,140 260,150 270,175 C282,205 280,225 265,245 C250,260 235,260 220,250 C210,255 195,250 185,240 C175,225 185,210 180,195 C175,175 190,150 205,145 Z" fill="#0d0807"/>

  <!-- Scalloped edges and micro-lobules -->
  <path d="M203,143 C212,138 228,140 240,145 C255,148 268,160 272,175 C278,190 282,210 270,230 C262,242 248,252 235,252 C220,255 210,248 198,245 C185,240 178,230 180,215 C182,200 178,188 184,175 C190,160 196,148 203,143 Z" fill="#170f0d"/>

  <!-- Minute hair strand at upper right border -->
  <path d="M360,10 Q370,25 380,35" stroke="#221511" stroke-width="1.6" fill="none"/>
</svg>
`);

// 4. ISIC_0024314 (Central dark brown papule with radiating streaks and crossed hairs)
export const ISIC_0024314_SVG = svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="skinBg4" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#edd2ce"/>
      <stop offset="60%" stop-color="#e3c2bc"/>
      <stop offset="100%" stop-color="#d6b0a8"/>
    </radialGradient>
    <radialGradient id="sunburstGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4a2216" stop-opacity="1"/>
      <stop offset="35%" stop-color="#693724" stop-opacity="0.85"/>
      <stop offset="70%" stop-color="#995c42" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#c99581" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Base Skin with vascular mottling -->
  <rect width="400" height="400" fill="url(#skinBg4)"/>

  <!-- Skin reticulation network -->
  <g stroke="#c79990" stroke-width="0.8" opacity="0.35" fill="none">
    <path d="M10,80 Q200,90 390,70 M10,180 Q200,170 390,190 M10,280 Q200,290 390,270"/>
    <path d="M80,10 Q90,200 70,390 M180,10 Q170,200 190,390 M280,10 Q290,200 270,390"/>
  </g>

  <!-- Peripheral radiating streaks (sunburst / starburst pattern) -->
  <g stroke="#804733" stroke-width="3" opacity="0.7" stroke-linecap="round">
    <line x1="200" y1="200" x2="140" y2="150"/>
    <line x1="200" y1="200" x2="150" y2="135"/>
    <line x1="200" y1="200" x2="185" y2="120"/>
    <line x1="200" y1="200" x2="225" y2="130"/>
    <line x1="200" y1="200" x2="255" y2="160"/>
    <line x1="200" y1="200" x2="250" y2="210"/>
    <line x1="200" y1="200" x2="230" y2="235"/>
    <line x1="200" y1="200" x2="180" y2="240"/>
    <line x1="200" y1="200" x2="155" y2="215"/>
  </g>

  <!-- Central Pigmented Core -->
  <ellipse cx="205" cy="195" rx="50" ry="40" fill="url(#sunburstGrad)"/>
  <ellipse cx="202" cy="192" rx="28" ry="20" fill="#2d130c"/>

  <!-- Crossed Dark Hair Strands over surface -->
  <g stroke="#1a1412" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.85">
    <!-- Long curving hair crossing from left to right -->
    <path d="M68,100 C150,140 280,145 385,100"/>
    <!-- Second crossing hair diagonally -->
    <path d="M265,40 C280,180 360,280 395,390"/>
  </g>

  <!-- Pigment ink / marker dot at bottom corner (common in dermatoscopy) -->
  <ellipse cx="80" cy="370" rx="35" ry="12" fill="#221e3d" opacity="0.5"/>
</svg>
`);
