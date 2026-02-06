export default function FloatingHearts() {
  const hearts = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((i) => (
        <div
          key={i}
          className="floating-heart"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
}
