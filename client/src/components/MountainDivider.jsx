export default function MountainDivider() {
  return (
    <svg
      className="mountain-divider"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Darkest red layer (back) */}
      <polygon
        fill="#5C1000"
        points="0,120 0,95 120,60 250,80 380,45 500,70 620,35 750,65 880,30 1000,55 1120,25 1250,50 1380,40 1440,55 1440,120"
      />
      {/* Dark red layer */}
      <polygon
        fill="#8B1500"
        points="0,120 0,100 100,70 200,85 320,55 440,78 560,48 680,72 800,42 920,68 1040,38 1160,62 1300,50 1440,65 1440,120"
      />
      {/* Red layer */}
      <polygon
        fill="#CC2200"
        points="0,120 0,105 80,78 180,90 300,65 420,85 540,60 660,82 780,55 900,78 1020,52 1140,75 1280,60 1440,75 1440,120"
      />
      {/* Orange-red layer */}
      <polygon
        fill="#E64500"
        points="0,120 0,108 60,85 170,95 290,75 410,92 530,72 650,90 770,68 890,88 1010,65 1130,85 1260,72 1440,82 1440,120"
      />
      {/* Orange layer (front) */}
      <polygon
        fill="#FF6B00"
        points="0,120 0,110 50,92 160,100 280,85 400,98 520,82 640,96 760,80 880,95 1000,78 1120,93 1260,83 1440,90 1440,120"
      />
    </svg>
  )
}
