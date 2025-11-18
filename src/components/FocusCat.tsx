import { useEffect, useState } from "react";

export const FocusCat = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition((prev) => {
        const newX = prev.x + (direction === "right" ? 2 : -2);
        const maxX = window.innerWidth - 60;

        if (newX >= maxX) {
          setDirection("left");
          return { x: maxX, y: prev.y };
        } else if (newX <= 0) {
          setDirection("right");
          return { x: 0, y: prev.y };
        }

        return { x: newX, y: prev.y };
      });
    }, 50);

    const jumpInterval = setInterval(() => {
      setPosition((prev) => ({
        ...prev,
        y: Math.random() * 50 - 25,
      }));
    }, 2000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(jumpInterval);
    };
  }, [direction]);

  return (
    <div
      className="fixed bottom-4 pointer-events-none z-50 transition-transform duration-100"
      style={{
        left: `${position.x}px`,
        transform: `translateY(${position.y}px) scaleX(${direction === "left" ? -1 : 1})`,
      }}
    >
      <div className="text-5xl animate-bounce">
        🐱
      </div>
    </div>
  );
};
