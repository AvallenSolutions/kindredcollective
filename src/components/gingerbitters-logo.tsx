export function GingerbittersBadge() {
  return (
    <svg
      width="112"
      height="28"
      viewBox="0 0 112 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gingerbitters Ltd logo"
    >
      {/* Ginger root icon */}
      <g>
        {/* Main root body */}
        <ellipse cx="10" cy="15" rx="5.5" ry="4" fill="#F97316" stroke="#000" strokeWidth="1.5" />
        {/* Left nub */}
        <ellipse cx="5.5" cy="12.5" rx="2.8" ry="2" fill="#F97316" stroke="#000" strokeWidth="1.5" />
        {/* Right nub */}
        <ellipse cx="14.5" cy="12" rx="2.5" ry="2" fill="#F97316" stroke="#000" strokeWidth="1.5" />
        {/* Top shoot */}
        <ellipse cx="10" cy="10" rx="2" ry="3" fill="#22c55e" stroke="#000" strokeWidth="1.5" />
        {/* Shine dot */}
        <circle cx="8.5" cy="14" r="0.9" fill="#fff" opacity="0.6" />
      </g>

      {/* "GINGERBITTERS" wordmark */}
      <text
        x="24"
        y="18"
        fontFamily="'Space Grotesk', Arial, sans-serif"
        fontSize="11"
        fontWeight="900"
        letterSpacing="0.5"
        textAnchor="start"
        fill="#000"
      >
        GINGERBITTERS
      </text>

      {/* "LTD" superscript badge */}
      <rect x="97" y="5" width="14" height="9" rx="1" fill="#F97316" stroke="#000" strokeWidth="1" />
      <text
        x="104"
        y="13"
        fontFamily="'Space Grotesk', Arial, sans-serif"
        fontSize="6.5"
        fontWeight="900"
        textAnchor="middle"
        fill="#000"
      >
        LTD
      </text>
    </svg>
  )
}
