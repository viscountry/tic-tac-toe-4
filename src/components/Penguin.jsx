export default function Penguin({ className = "w-16 h-16" }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="100" cy="120" rx="50" ry="65" fill="#000000"/>
      
      {/* White belly */}
      <ellipse cx="100" cy="125" rx="35" ry="50" fill="#ffffff"/>
      
      {/* Head */}
      <circle cx="100" cy="70" r="40" fill="#000000"/>
      
      {/* White face */}
      <ellipse cx="100" cy="75" rx="30" ry="35" fill="#ffffff"/>
      
      {/* Eyes */}
      <circle cx="88" cy="65" r="4" fill="#000000"/>
      <circle cx="112" cy="65" r="4" fill="#000000"/>
      
      {/* Beak */}
      <path d="M 95 75 L 85 80 L 95 85 Z" fill="#FF8C42"/>
      
      {/* Left wing */}
      <ellipse cx="60" cy="110" rx="15" ry="35" fill="#000000" transform="rotate(-20 60 110)"/>
      
      {/* Right wing */}
      <ellipse cx="140" cy="110" rx="15" ry="35" fill="#000000" transform="rotate(20 140 110)"/>
      
      {/* Left foot */}
      <ellipse cx="80" cy="175" rx="18" ry="8" fill="#FF8C42"/>
      
      {/* Right foot */}
      <ellipse cx="120" cy="175" rx="18" ry="8" fill="#FF8C42"/>
    </svg>
  );
}
