import { useEffect, useRef } from "react";

interface OrbitalRing {
  radius: number;
  tiltX: number; // slight perspective tilt (radians)
  speed: number; // radians per frame
  angle: number; // current rotation phase
  width: number;
  alpha: number;
  particles: RingParticle[];
}

interface RingParticle {
  angle: number;
  speed: number;
  size: number;
  glow: number;
  glowDir: number;
}

function startOrbitalAnimation(
  cv: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): () => void {
  let W = 0;
  let H = 0;
  let cx = 0;
  let cy = 0;
  let scale = 1;
  let rafId = 0;

  // 7 concentric orbital rings — all in cobalt blue palette only
  const RING_DEFS: Omit<OrbitalRing, "radius" | "particles">[] = [
    { tiltX: 0.18, speed: 0.00038, angle: 0, width: 1.3, alpha: 0.8 },
    {
      tiltX: 0.14,
      speed: -0.00028,
      angle: Math.PI * 0.6,
      width: 1.1,
      alpha: 0.68,
    },
    {
      tiltX: 0.2,
      speed: 0.00022,
      angle: Math.PI * 1.2,
      width: 1.0,
      alpha: 0.58,
    },
    {
      tiltX: 0.12,
      speed: -0.00018,
      angle: Math.PI * 0.3,
      width: 0.9,
      alpha: 0.5,
    },
    {
      tiltX: 0.22,
      speed: 0.00015,
      angle: Math.PI * 0.9,
      width: 0.8,
      alpha: 0.42,
    },
    {
      tiltX: 0.1,
      speed: -0.00013,
      angle: Math.PI * 1.5,
      width: 0.7,
      alpha: 0.34,
    },
    {
      tiltX: 0.16,
      speed: 0.0001,
      angle: Math.PI * 0.1,
      width: 0.6,
      alpha: 0.26,
    },
  ];

  const rings: OrbitalRing[] = RING_DEFS.map((d) => ({
    ...d,
    radius: 0,
    particles: [],
  }));

  function initRings() {
    const base = Math.min(W, H) * 0.16;
    const sizes = [1.0, 1.35, 1.68, 2.0, 2.3, 2.58, 2.85];
    rings.forEach((ring, i) => {
      ring.radius = base * sizes[i];
      ring.particles = [];
      // 1-2 small orbital dots per ring
      const count = i < 3 ? 2 : 1;
      for (let p = 0; p < count; p++) {
        ring.particles.push({
          angle: Math.random() * Math.PI * 2,
          speed: (0.0012 + Math.random() * 0.001) * Math.sign(ring.speed),
          size: 1.8 + Math.random() * 1.4,
          glow: Math.random(),
          glowDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    });
  }

  function resize() {
    const rect = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
    scale = Math.min(W, H) / 700;
    initRings();
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(cv);
  resize();

  // Project an ellipse point with perspective tilt
  function ellipsePoint(ring: OrbitalRing, angle: number): [number, number] {
    const r = ring.radius;
    // tiltX makes it look like a ring tilted in 3D space
    const scaleY = Math.cos(ring.tiltX);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle) * scaleY;
    return [x, y];
  }

  function drawRing(ring: OrbitalRing, t: number) {
    const SEG = 200;
    const scaleY = Math.cos(ring.tiltX);
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.00055 + ring.tiltX * 5);

    // Outer soft glow halo
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, ring.radius, ring.radius * scaleY, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(30,100,220,${ring.alpha * pulse * 0.18})`;
    ctx.lineWidth = ring.width * scale * 7;
    ctx.stroke();
    ctx.restore();

    // Main ring line — cobalt blue
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, ring.radius, ring.radius * scaleY, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(60,140,255,${ring.alpha * pulse})`;
    ctx.lineWidth = ring.width * scale + 0.2;
    ctx.shadowColor = "rgba(80,160,255,0.6)";
    ctx.shadowBlur = 8 * scale;
    ctx.stroke();
    ctx.restore();

    // Inner bright highlight — creates the depth illusion
    ctx.save();
    // Draw a brighter arc on the "top" of the ring
    const arcStart = ring.angle + Math.PI * 0.85;
    const arcEnd = ring.angle + Math.PI * 1.15;
    ctx.beginPath();
    for (let i = 0; i <= SEG; i++) {
      const a = arcStart + (arcEnd - arcStart) * (i / SEG);
      const [px, py] = ellipsePoint(ring, a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `rgba(180,220,255,${ring.alpha * pulse * 0.55})`;
    ctx.lineWidth = ring.width * scale * 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(ring: OrbitalRing) {
    for (const p of ring.particles) {
      p.angle += p.speed;
      p.glow += 0.015 * p.glowDir;
      if (p.glow > 1 || p.glow < 0) p.glowDir *= -1;
      p.glow = Math.max(0, Math.min(1, p.glow));

      const a = ring.angle + p.angle;
      const [px, py] = ellipsePoint(ring, a);
      const r = p.size * scale;

      const gr = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
      gr.addColorStop(0, `rgba(230,245,255,${0.85 * p.glow + 0.15})`);
      gr.addColorStop(0.3, `rgba(80,160,255,${0.6 * p.glow})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, r * 5, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();

      // Bright dot core
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.9 * p.glow + 0.1})`;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCore(t: number) {
    const breathe = 0.96 + 0.04 * Math.sin(t * 0.00065);
    const coreR = Math.min(W, H) * 0.055 * scale * breathe;

    // --- Outer diffuse glow layers (deep cobalt only) ---
    const glowLayers: [number, number][] = [
      [7.0, 0.025],
      [5.2, 0.045],
      [3.8, 0.08],
      [2.6, 0.13],
      [1.8, 0.22],
    ];
    for (const [factor, a] of glowLayers) {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * factor);
      gr.addColorStop(0, `rgba(20,100,255,${a})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * factor, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.restore();
    }

    // --- Smooth sphere body ---
    const sphereGr = ctx.createRadialGradient(
      cx - coreR * 0.28,
      cy - coreR * 0.28,
      0,
      cx,
      cy,
      coreR,
    );
    sphereGr.addColorStop(0, "rgba(255,255,255,0.98)");
    sphereGr.addColorStop(0.18, "rgba(200,230,255,0.95)");
    sphereGr.addColorStop(0.5, "rgba(60,130,255,0.80)");
    sphereGr.addColorStop(0.82, "rgba(10,60,180,0.70)");
    sphereGr.addColorStop(1, "rgba(0,20,80,0.60)");

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = sphereGr;
    ctx.shadowColor = "rgba(100,180,255,0.9)";
    ctx.shadowBlur = 24 * scale;
    ctx.fill();
    ctx.restore();

    // --- Single central light flare / spark ---
    const flarePhase = t * 0.0008;
    const flarePulse = 0.82 + 0.18 * Math.sin(flarePhase);
    const flareR = coreR * 0.38 * flarePulse;
    const flareX = cx - coreR * 0.15;
    const flareY = cy - coreR * 0.15;

    const flareGr = ctx.createRadialGradient(
      flareX,
      flareY,
      0,
      flareX,
      flareY,
      flareR * 3,
    );
    flareGr.addColorStop(0, `rgba(255,255,255,${0.95 * flarePulse})`);
    flareGr.addColorStop(0.25, `rgba(220,240,255,${0.6 * flarePulse})`);
    flareGr.addColorStop(0.6, `rgba(140,200,255,${0.2 * flarePulse})`);
    flareGr.addColorStop(1, "rgba(0,0,0,0)");

    ctx.save();
    ctx.beginPath();
    ctx.arc(flareX, flareY, flareR * 3, 0, Math.PI * 2);
    ctx.fillStyle = flareGr;
    ctx.fill();
    ctx.restore();

    // Tiny bright pinpoint
    ctx.save();
    ctx.beginPath();
    ctx.arc(flareX, flareY, Math.max(1, flareR * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${flarePulse})`;
    ctx.shadowColor = "rgba(255,255,255,1)";
    ctx.shadowBlur = 10 * scale;
    ctx.fill();
    ctx.restore();
  }

  function draw(timestamp: number) {
    ctx.clearRect(0, 0, W, H);

    // Advance ring angles
    for (const ring of rings) {
      ring.angle += ring.speed * 16;
    }

    // 1. Rings (outermost first)
    for (let i = rings.length - 1; i >= 0; i--) {
      drawRing(rings[i], timestamp);
    }

    // 2. Orbital particles
    for (const ring of rings) {
      drawParticles(ring);
    }

    // 3. Central glowing sphere + flare
    drawCore(timestamp);

    // 4. Radial edge mask — fade to pure black
    const edgeMask = ctx.createRadialGradient(
      cx,
      cy,
      Math.min(W, H) * 0.28,
      cx,
      cy,
      Math.min(W, H) * 0.72,
    );
    edgeMask.addColorStop(0, "rgba(0,0,0,0)");
    edgeMask.addColorStop(0.55, "rgba(0,0,0,0)");
    edgeMask.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = edgeMask;
    ctx.fillRect(0, 0, W, H);

    rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();
  };
}

export function CosmicNetworkGraphic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    return startOrbitalAnimation(canvas, ctx);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
