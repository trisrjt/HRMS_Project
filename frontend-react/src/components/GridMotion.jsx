import { useEffect, useRef } from "react";
import gsap from "gsap";

const GridMotion = ({ items = [], gradientColor = "#000" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const gridItems = containerRef.current.querySelectorAll(".grid-item");

    // Animate each grid item with GSAP
    gsap.fromTo(
      gridItems,
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        stagger: 0.2,
        ease: "power2.out",
      }
    );

    // Continuous floating animation
    gridItems.forEach((item, index) => {
      gsap.to(item, {
        y: "random(-20, 20)",
        x: "random(-20, 20)",
        duration: "random(3, 5)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2,
      });
    });
  }, [items]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "20px",
        padding: "20px",
        background: `linear-gradient(135deg, ${gradientColor}22 0%, ${gradientColor}44 100%)`,
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="grid-item"
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <img
            src={item}
            alt={`grid-${index}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.7) saturate(1.2)",
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default GridMotion;
