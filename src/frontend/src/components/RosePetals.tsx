export default function RosePetals() {
  const petals = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((i) => (
        <div
          key={i}
          className="rose-petal"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${10 + Math.random() * 5}s`,
          }}
        >
          🌸
        </div>
      ))}
    </div>
  );
}
