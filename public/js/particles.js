/**
 * The Moth in the Machine - Particle & Confetti Engine
 * 
 * Provides dynamic canvas particles for rocket exhaust, electric sparks, 
 * star dust, and victory confetti blasts!
 */

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }

  // Clear all active particles
  reset() {
    this.particles = [];
  }

  // Emit rocket exhaust particles
  emitRocketExhaust(x, y, angle = Math.PI) {
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 3 + 2;
      const vx = Math.cos(angle + spread) * speed;
      const vy = Math.sin(angle + spread) * speed;
      
      const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#ffffff', '#38bdf8'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx,
        vy,
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        shape: 'circle'
      });
    }
  }

  // Emit electrical wire sparks
  emitElectricSparks(x, y) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: Math.random() > 0.4 ? '#38bdf8' : '#fef08a',
        alpha: 1,
        decay: Math.random() * 0.05 + 0.04,
        shape: 'spark'
      });
    }
  }

  // Emit star collect sparkle
  emitStarCollect(x, y) {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: ['#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#f43f5e'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
        shape: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }
  }

  // Emit stamper impact steam/sparks
  emitStampImpact(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI * 0.1 - Math.random() * Math.PI * 0.8;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#f59e0b' : '#cbd5e1',
        alpha: 1,
        decay: 0.03,
        shape: 'circle'
      });
    }
  }

  // Update & render particles on canvas
  updateAndDraw() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.strokeStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'spark') {
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        this.ctx.lineTo(p.x, p.y);
        this.ctx.stroke();
      } else if (p.shape === 'star') {
        this.drawStar(p.x, p.y, 5, p.radius * 1.5, p.radius * 0.7);
      }

      this.ctx.restore();
    }
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

// Fullscreen Confetti Engine for Grand Finale
class ConfettiBlast {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.pieces = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.stop();
    this.pieces = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    
    // Spawn 180 confetti pieces with gravity, wobble, and color variations
    for (let i = 0; i < 180; i++) {
      this.pieces.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -this.canvas.height,
        w: Math.random() * 12 + 8,
        h: Math.random() * 6 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 3,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.15,
        wobble: Math.random() * 10
      });
    }

    const loop = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (let p of this.pieces) {
        p.x += p.vx + Math.sin(p.wobble) * 1.5;
        p.y += p.vy;
        p.angle += p.vAngle;
        p.wobble += 0.05;

        // Wrap around top if needed
        if (p.y > this.canvas.height) {
          p.y = -20;
          p.x = Math.random() * this.canvas.width;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.angle);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      }

      this.animationId = requestAnimationFrame(loop);
    };

    loop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.pieces = [];
  }
}
