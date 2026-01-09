import { useEffect, useRef } from "react";
import gsap from "gsap";

const LiquidChrome = ({ 
  baseColor = [0.08, 0.08, 0.08], 
  speed = 1, 
  amplitude = 0.6, 
  interactive = true 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Set canvas size
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();

    // Mouse interaction
    const handleMouseMove = (e) => {
      if (interactive) {
        mouseRef.current = {
          x: e.clientX / width,
          y: e.clientY / height,
        };
      }
    };

    window.addEventListener("resize", setSize);
    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Animation variables
    let time = 0;
    const particles = [];
    const particleCount = 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Animation loop
    const animate = () => {
      time += 0.01 * speed;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const hue = (time * 20) % 360;
      
      gradient.addColorStop(0, `hsl(${hue}, 70%, 10%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 60%, 15%)`);
      gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 50%, 12%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw animated particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX + Math.sin(time + i) * amplitude;
        particle.y += particle.speedY + Math.cos(time + i) * amplitude;

        // Interact with mouse
        if (interactive) {
          const dx = mouseRef.current.x * width - particle.x;
          const dy = mouseRef.current.y * height - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            particle.x -= dx * 0.01;
            particle.y -= dy * 0.01;
          }
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Draw particle with glow
        const particleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        particleGradient.addColorStop(0, `hsla(${(hue + i * 10) % 360}, 80%, 60%, ${particle.opacity})`);
        particleGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = particleGradient;
        ctx.fillRect(
          particle.x - particle.size * 3,
          particle.y - particle.size * 3,
          particle.size * 6,
          particle.size * 6
        );
      });

      // Draw connecting lines
      ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", setSize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [baseColor, speed, amplitude, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};

export default LiquidChrome;
