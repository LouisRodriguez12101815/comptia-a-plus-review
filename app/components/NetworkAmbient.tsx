export function NetworkAmbient() {
  return (
    <div aria-hidden="true" className="network-ambient">
      <div className="ambient-aura" />
      <svg viewBox="0 0 1200 720" preserveAspectRatio="none" className="ambient-topology">
        <g fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M45 180 180 92 330 210 510 120 690 250 865 118 1115 205" />
          <path d="M75 560 240 430 410 520 600 390 790 540 990 420 1160 505" />
          <path d="M180 92 240 430M510 120 600 390M865 118 790 540M330 210 410 520M690 250 990 420" />
        </g>
        <g fill="currentColor">
          <circle cx="180" cy="92" r="3" /><circle cx="330" cy="210" r="2" /><circle cx="510" cy="120" r="3" />
          <circle cx="690" cy="250" r="2" /><circle cx="865" cy="118" r="3" /><circle cx="240" cy="430" r="2" />
          <circle cx="410" cy="520" r="3" /><circle cx="600" cy="390" r="2" /><circle cx="790" cy="540" r="3" />
          <circle cx="990" cy="420" r="2" />
        </g>
        <circle className="ambient-packet" cx="180" cy="92" r="4" fill="var(--color-cyan-300)" />
      </svg>
    </div>
  );
}
