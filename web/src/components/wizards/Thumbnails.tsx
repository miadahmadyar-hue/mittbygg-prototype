/** Schematic mock plantegninger / snitt / fasader for søknadspakke preview. */

export function PlanSvg() {
  return (
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="150" fill="#fff" />
      <g stroke="#1a1917" strokeWidth="2" fill="none">
        <rect x="20" y="20" width="160" height="110" />
        <line x1="100" y1="20" x2="100" y2="80" />
        <line x1="20" y1="80" x2="180" y2="80" />
        <line x1="100" y1="80" x2="100" y2="130" />
      </g>
      <g stroke="#1a1917" strokeWidth="1" fill="none">
        <rect x="40" y="60" width="20" height="3" fill="#fff" />
        <rect x="115" y="40" width="3" height="20" fill="#fff" />
        <rect x="40" y="100" width="14" height="3" fill="#fff" />
      </g>
      <text x="55" y="55" fontFamily="sans-serif" fontSize="6" fill="#666">Stue</text>
      <text x="135" y="55" fontFamily="sans-serif" fontSize="6" fill="#666">Kjøkken</text>
      <text x="55" y="110" fontFamily="sans-serif" fontSize="6" fill="#666">Soverom</text>
      <text x="135" y="110" fontFamily="sans-serif" fontSize="6" fill="#666">Bad</text>
    </svg>
  );
}

export function SnittSvg() {
  return (
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="150" fill="#fff" />
      <g stroke="#1a1917" strokeWidth="1.5" fill="none">
        <line x1="10" y1="125" x2="190" y2="125" />
        <polygon points="10,80 100,40 190,80 180,80 100,50 20,80" />
        <rect x="20" y="80" width="160" height="45" />
        <rect x="20" y="125" width="160" height="3" fill="#888" />
      </g>
      <text x="100" y="100" fontFamily="sans-serif" fontSize="6" fill="#666" textAnchor="middle">1. etasje</text>
    </svg>
  );
}

export function FasadeSvg() {
  return (
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="150" fill="#fff" />
      <g stroke="#1a1917" strokeWidth="1.2" fill="none">
        <line x1="10" y1="120" x2="190" y2="120" />
        <polygon points="30,75 100,35 170,75 170,120 30,120" />
        <rect x="55" y="85" width="20" height="20" fill="#e8f0f8" />
        <rect x="125" y="85" width="20" height="20" fill="#e8f0f8" />
        <rect x="92" y="92" width="16" height="28" fill="#d0c0a0" />
      </g>
    </svg>
  );
}

export function SitSvg() {
  return (
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="200" height="150" fill="#fff" />
      <g fill="none" stroke="#1a1917" strokeWidth="1">
        <rect x="15" y="15" width="170" height="120" strokeWidth="1.5" />
        <rect x="35" y="35" width="130" height="80" strokeDasharray="3,3" stroke="#c44" />
        <rect x="60" y="55" width="50" height="40" fill="#888" />
        <path d="M 130 130 L 130 80 L 100 80" stroke="#a07040" strokeWidth="3" />
      </g>
      <text x="85" y="80" fontFamily="sans-serif" fontSize="6" fill="#fff" textAnchor="middle">Bygget</text>
    </svg>
  );
}
