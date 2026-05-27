import { useEffect, useRef } from 'react';

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);

    const particles: any[] = [];
    const colors = ['#0891b2', '#c026d3', '#e11d48', '#38bdf8', '#fbbf24'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height, // Start above screen
        r: Math.random() * 6 + 2,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleInc: (Math.random() * 0.07) + 0.05,
        tiltAngle: 0
      });
    }

    let animationId: number;

    const render = () => {
      animationId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += (Math.cos(p.tiltAngle) + p.dy + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle) * 2;

        if (p.x > width + 20 || p.x < -20 || p.y > height) {
           p.x = Math.random() * width;
           p.y = -20;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
    };

    // Delay start for phase transition
    const timeout = setTimeout(() => {
      render();
    }, 500);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen opacity-70" 
    />
  );
}
