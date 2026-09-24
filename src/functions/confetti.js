// Lightweight canvas confetti particle generator (zero dependencies)

export function fireConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
    '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'
  ];

  const particles = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() * 200 - 100),
      y: height * 0.45 + (Math.random() * 100 - 50),
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.8) * 16 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.35,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }

  let animationFrameId;
  const startTime = Date.now();
  const maxDuration = 3500;

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxDuration) {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      cancelAnimationFrame(animationFrameId);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;

      if (elapsed > maxDuration - 1000) {
        p.opacity = Math.max(0, (maxDuration - elapsed) / 1000);
      }

      if (p.opacity > 0) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }
    });

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  }

  animationFrameId = requestAnimationFrame(animate);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);
  setTimeout(() => window.removeEventListener('resize', handleResize), maxDuration + 100);
}
