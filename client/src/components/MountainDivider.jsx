export default function MountainDivider() {
  return (
    <svg
      className="mountain-divider"
      viewBox="0 0 1440 80"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Darkest red — tallest jagged peaks (back) */}
      <polygon
        fill="#5C1000"
        points="0,80 0,55 120,40 200,52 320,18 440,45 560,22 720,48 850,12 980,42 1100,28 1220,50 1340,20 1440,38 1440,80"
      />
      {/* Dark red */}
      <polygon
        fill="#8B1500"
        points="0,80 0,58 100,48 220,32 360,52 480,28 620,50 760,24 900,46 1040,30 1180,48 1300,34 1440,44 1440,80"
      />
      {/* Red */}
      <polygon
        fill="#CC2200"
        points="0,80 0,62 150,50 300,38 450,55 600,35 750,52 900,38 1050,54 1200,40 1350,50 1440,46 1440,80"
      />
      {/* Orange-red */}
      <polygon
        fill="#E64500"
        points="0,80 0,66 180,54 360,46 540,58 720,44 900,56 1080,46 1260,55 1440,50 1440,80"
      />
      {/* Orange (front) */}
      <polygon
        fill="#FF6B00"
        points="0,80 0,70 200,60 400,54 600,62 800,52 1000,60 1200,54 1440,58 1440,80"
      />
    </svg>
  )
}
