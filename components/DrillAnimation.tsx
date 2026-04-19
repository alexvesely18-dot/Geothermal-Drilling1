export default function DrillAnimation() {
  const steamPuffs = [
    { cx: 86,  delay: '0s',   dur: '2.6s' },
    { cx: 76,  delay: '0.9s', dur: '3.0s' },
    { cx: 136, delay: '0.4s', dur: '2.4s' },
    { cx: 146, delay: '1.3s', dur: '2.9s' },
  ]

  const pipeSegs = [0, 30, 60, 90, 120, 150, 180, 210]

  return (
    <svg
      viewBox="0 0 220 380"
      className="w-full h-full"
      aria-hidden="true"
      style={{ maxHeight: 420 }}
    >
      {/* ── Earth layers ─────────────────────────────────────── */}

      {/* Surface */}
      <rect x="0" y="0" width="220" height="38" fill="#1a3810" />
      <path
        d="M0 22 Q27 14 54 22 Q81 30 108 22 Q135 14 162 22 Q189 30 220 22 L220 38 L0 38Z"
        fill="#2a5018"
      />
      {/* Surface cracks */}
      <path d="M30 32 L42 38" stroke="#1a3010" strokeWidth="1.2" opacity="0.5" />
      <path d="M150 35 L162 38" stroke="#1a3010" strokeWidth="1" opacity="0.4" />

      {/* Sediment */}
      <rect x="0" y="38" width="220" height="72" fill="#4a2e08" />
      <line x1="12" y1="58"  x2="208" y2="58"  stroke="#3a2206" strokeWidth="1.5" strokeDasharray="10 5" opacity="0.6" />
      <line x1="12" y1="76"  x2="208" y2="76"  stroke="#3a2206" strokeWidth="1"   strokeDasharray="8 6"  opacity="0.5" />
      <line x1="12" y1="96"  x2="208" y2="96"  stroke="#3a2206" strokeWidth="1.5" strokeDasharray="12 4" opacity="0.5" />

      {/* Granite */}
      <rect x="0" y="110" width="220" height="95" fill="#2a2a38" />
      <path d="M0 110 L38 123 L72 111 L108 121 L144 110 L178 120 L220 113 L220 110Z" fill="#1e1e2e" opacity="0.7" />
      <path d="M0 152 L48 144 L92 153 L136 143 L180 152 L220 145" stroke="#1a1a28" strokeWidth="2.5" fill="none" opacity="0.6" />
      <path d="M0 180 L55 188 L100 178 L155 186 L220 180" stroke="#1a1a28" strokeWidth="2" fill="none" opacity="0.4" />

      {/* Hot rock / geothermal zone */}
      <rect x="0" y="205" width="220" height="85" fill="#4a1205" />
      <rect x="0" y="258" width="220" height="32" fill="#6a1e08" opacity="0.8" />
      {/* Heat shimmer lines */}
      <path d="M20 225 Q40 220 60 225 Q80 230 100 225" stroke="#ff4400" strokeWidth="0.8" fill="none" opacity="0.2">
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M120 240 Q145 234 170 240 Q195 246 220 240" stroke="#ff6600" strokeWidth="0.8" fill="none" opacity="0.2">
        <animate attributeName="opacity" values="0.15;0.35;0.15" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
      </path>

      {/* Magma */}
      <rect x="0" y="290" width="220" height="90" fill="#7a2200" />
      <rect x="0" y="324" width="220" height="56" fill="#a03000" opacity="0.8" />
      <rect x="0" y="350" width="220" height="30" fill="#cc4400" opacity="0.7" />
      {/* Magma bubbles */}
      <ellipse cx="42"  cy="292" rx="20" ry="5" fill="#ff5500" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="ry"      values="4;7;4"       dur="2.2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="170" cy="294" rx="15" ry="4" fill="#ff6600" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.8s" begin="0.7s" repeatCount="indefinite" />
        <animate attributeName="ry"      values="3;6;3"       dur="1.8s" begin="0.7s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="100" cy="300" rx="12" ry="3" fill="#ff7700" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
      </ellipse>

      {/* ── Layer labels ──────────────────────────────────────── */}
      <text x="8" y="18"  fontSize="8" fill="#6db86d" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">SURFACE</text>
      <text x="8" y="64"  fontSize="8" fill="#c8902a" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">SEDIMENT</text>
      <text x="8" y="150" fontSize="8" fill="#8888aa" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">GRANITE</text>
      <text x="8" y="238" fontSize="8" fill="#ff8855" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">HOT ROCK</text>
      <text x="8" y="312" fontSize="8" fill="#ffaa55" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5">MAGMA</text>

      {/* ── Temperature scale (right) ─────────────────────────── */}
      <text x="176" y="10"  fontSize="7" fill="#556655" fontFamily="monospace">20°C</text>
      <text x="176" y="50"  fontSize="7" fill="#887744" fontFamily="monospace">90°C</text>
      <text x="176" y="120" fontSize="7" fill="#886633" fontFamily="monospace">200°C</text>
      <text x="176" y="218" fontSize="7" fill="#cc5522" fontFamily="monospace">350°C</text>
      <text x="176" y="304" fontSize="7" fill="#ff8800" fontFamily="monospace">450°C+</text>

      {/* ── Depth guide line ──────────────────────────────────── */}
      <line x1="62" y1="0" x2="62" y2="295" stroke="#ffffff" strokeWidth="0.4" opacity="0.08" strokeDasharray="3 6" />
      <text x="64" y="10"  fontSize="6.5" fill="#445544" fontFamily="monospace">0 m</text>
      <text x="64" y="48"  fontSize="6.5" fill="#554433" fontFamily="monospace">300 m</text>
      <text x="64" y="120" fontSize="6.5" fill="#444455" fontFamily="monospace">900 m</text>
      <text x="64" y="218" fontSize="6.5" fill="#773322" fontFamily="monospace">2,000 m</text>
      <text x="64" y="300" fontSize="6.5" fill="#884422" fontFamily="monospace">3,000 m</text>

      {/* ── Drilling fluid return (outside pipe) ──────────────── */}
      <rect x="96"  y="6" width="5" height="256" fill="#6b4a14" opacity="0.4" rx="1" />
      <rect x="119" y="6" width="5" height="256" fill="#6b4a14" opacity="0.4" rx="1" />

      {/* ── Drill pipe ───────────────────────────────────────── */}
      {pipeSegs.map((y, i) => (
        <rect key={i} x="101" y={y} width="18" height={28} fill={i % 2 === 0 ? '#8a8a9a' : '#707080'} rx="1" />
      ))}
      {/* Collar joints */}
      {[30, 60, 90, 120, 150, 180, 210].map((y, i) => (
        <rect key={i} x="99" y={y - 2} width="22" height="5" fill="#aaaabc" rx="1" />
      ))}
      {/* Pipe highlight */}
      <rect x="102" y="0" width="3" height="256" fill="#ffffff" opacity="0.12" rx="1" />

      {/* BHA - bottom hole assembly */}
      <rect x="99" y="237" width="22" height="26" fill="#66667a" rx="1" />
      <rect x="100" y="237" width="3"  height="26" fill="#ffffff" opacity="0.1" />

      {/* ── Rotary table at surface ───────────────────────────── */}
      <rect x="83" y="0" width="54" height="11" fill="#555566" rx="2" />
      <g style={{ transformOrigin: '110px 5.5px', animation: 'spin-slow 1.6s linear infinite' }}>
        <rect x="86" y="3" width="48" height="6" fill="#667" rx="2" opacity="0.85" />
        <rect x="107" y="1" width="6" height="10" fill="#778" rx="1" />
      </g>

      {/* ── Drill bit (bouncing) ──────────────────────────────── */}
      <g style={{ animation: 'drill-bounce 1.3s ease-in-out infinite' }}>
        {/* Bit body */}
        <rect x="99" y="263" width="22" height="12" fill="#555566" rx="1" />
        {/* Tricone shape */}
        <path d="M99 275 L105 296 L110 300 L115 296 L121 275Z" fill="#445" />
        {/* Cutting teeth */}
        <rect x="99"  y="295" width="7" height="6"  fill="#334" rx="1" />
        <rect x="107" y="297" width="6" height="8"  fill="#334" rx="1" />
        <rect x="114" y="295" width="7" height="6"  fill="#334" rx="1" />

        {/* Sparks */}
        <circle cx="104" cy="296" r="2" fill="#ff8800">
          <animate attributeName="opacity" values="1;0;0" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="296;284;274" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="cx" values="104;98;93"  dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="116" cy="296" r="1.8" fill="#ffcc00">
          <animate attributeName="opacity" values="0;1;0"   dur="0.42s" begin="0.15s" repeatCount="indefinite" />
          <animate attributeName="cy" values="296;285;276"  dur="0.42s" begin="0.15s" repeatCount="indefinite" />
          <animate attributeName="cx" values="116;122;127" dur="0.42s" begin="0.15s" repeatCount="indefinite" />
        </circle>
        <circle cx="110" cy="298" r="1.4" fill="#ff5500">
          <animate attributeName="opacity" values="0.5;1;0"  dur="0.38s" begin="0.28s" repeatCount="indefinite" />
          <animate attributeName="cy" values="298;288;280"   dur="0.38s" begin="0.28s" repeatCount="indefinite" />
        </circle>
        <circle cx="107" cy="295" r="1.2" fill="#ffaa00">
          <animate attributeName="opacity" values="0;0.8;0"  dur="0.55s" begin="0.08s" repeatCount="indefinite" />
          <animate attributeName="cy" values="295;283;274"   dur="0.55s" begin="0.08s" repeatCount="indefinite" />
          <animate attributeName="cx" values="107;101;96"   dur="0.55s" begin="0.08s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ── Heat glow at bit tip ──────────────────────────────── */}
      <ellipse cx="110" cy="306" rx="28" ry="12" fill="#ff4400" opacity="0.25">
        <animate attributeName="opacity" values="0.15;0.55;0.15" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="rx"      values="22;36;22"        dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="ry"      values="10;16;10"        dur="1.4s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="110" cy="304" rx="14" ry="6" fill="#ff8800" opacity="0.35">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.1s" begin="0.3s" repeatCount="indefinite" />
      </ellipse>

      {/* ── Steam from wellhead ───────────────────────────────── */}
      {steamPuffs.map(({ cx, delay, dur }, i) => (
        <ellipse key={i} cx={cx} ry="3.5" rx="5" fill="#88aabb" opacity="0">
          <animate attributeName="opacity" values="0;0.45;0"    dur={dur} begin={delay} repeatCount="indefinite" />
          <animate attributeName="cy"      values="12;-8;-24"   dur={dur} begin={delay} repeatCount="indefinite" />
          <animate attributeName="rx"      values="5;9;14"      dur={dur} begin={delay} repeatCount="indefinite" />
        </ellipse>
      ))}
    </svg>
  )
}
