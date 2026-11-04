/**
 * The Moth in the Machine - Scene Renderers & Animation Engines
 * 
 * Implements high-fidelity visual rendering and interactive animations 
 * for all 4 game levels using HTML5 Canvas 2D API.
 */

class SceneRenderer {
  constructor(canvas, particleSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = particleSystem;
    
    // Animation state
    this.currentLevelId = 1;
    this.phase = 'phase1'; // phase1 (find bug), phase2 (pick fix), phase3 (watch it work)
    this.progress = 0;     // 0 to 1 normalized animation progress
    this.animating = true;
    this.time = 0;         // elapsed time for sine/idle oscillations
  }

  setLevel(levelId, phase) {
    this.currentLevelId = levelId;
    this.phase = phase;
    this.progress = 0;
    this.animating = true;
  }

  update(dt) {
    this.time += dt;

    if (this.animating) {
      if (this.phase === 'phase1') {
        // Buggy preview animation (loops or stops at bug point)
        this.progress += dt * 0.45;
        if (this.progress > 1.2) {
          this.progress = 0; // loop preview
        }
      } else if (this.phase === 'phase2') {
        // Paused at bug point to let player think
        this.progress = 0.35;
      } else if (this.phase === 'phase3') {
        // Correct sequence playback
        this.progress += dt * 0.55;
        if (this.progress >= 1.0) {
          this.progress = 1.0;
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background with soft gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#edf2f7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle background grid for technical/computational feel
    this.drawBackgroundGrid(ctx, w, h);

    // Render active scene
    switch (this.currentLevelId) {
      case 1:
        this.renderRocketScene(ctx, w, h);
        break;
      case 2:
        this.renderCircuitScene(ctx, w, h);
        break;
      case 3:
        this.renderForkScene(ctx, w, h);
        break;
      case 4:
        this.renderStamperScene(ctx, w, h);
        break;
      default:
        this.renderRocketScene(ctx, w, h);
    }

    // Render active dynamic particle layer on top
    this.particles.updateAndDraw();
  }

  drawBackgroundGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // SCENE 1: ROCKET WAYPOINTS
  // Waypoint 1 -> 2 -> 3 -> Golden Star
  // =========================================================================
  renderRocketScene(ctx, w, h) {
    const waypoints = [
      { x: 150, y: 300, id: 1 },
      { x: 340, y: 220, id: 2 },
      { x: 520, y: 290, id: 3 },
      { x: 680, y: 240, id: 'star' }
    ];

    // Draw connecting dotted trajectory
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fcd34d';
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    ctx.quadraticCurveTo(waypoints[1].x, waypoints[1].y - 30, waypoints[1].x, waypoints[1].y);
    ctx.quadraticCurveTo((waypoints[1].x + waypoints[2].x) / 2, 320, waypoints[2].x, waypoints[2].y);
    ctx.quadraticCurveTo((waypoints[2].x + waypoints[3].x) / 2, 210, waypoints[3].x, waypoints[3].y);
    ctx.stroke();
    ctx.restore();

    // Draw waypoints 1, 2, 3
    for (let i = 0; i < 3; i++) {
      const pt = waypoints[i];
      ctx.save();
      // Outer ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Number text
      ctx.font = 'bold 16px Nunito';
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pt.id, pt.x, pt.y);
      ctx.restore();
    }

    // Draw Target Golden Star
    const starPt = waypoints[3];
    ctx.save();
    const starScale = 1 + Math.sin(this.time * 3) * 0.08;
    ctx.translate(starPt.x, starPt.y);
    ctx.scale(starScale, starScale);

    // Soft glow behind star
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.fill();

    // Golden 5-point star
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    this.drawStarPath(ctx, 0, 0, 5, 36, 18);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Compute Rocket Position along path
    let t = 0;
    if (this.phase === 'phase1') {
      // In Bug phase, rocket only travels from start to waypoint 1 and gets stuck!
      t = Math.min(this.progress, 0.28);
    } else if (this.phase === 'phase2') {
      t = 0.28; // Paused at waypoint 1
    } else {
      // In Watch it work (phase 3), rocket travels smoothly from 0 to 1.0 (to the star!)
      t = Math.min(this.progress, 1.0);
    }

    // Spline interpolation for rocket coordinates
    const rocketPos = this.getRocketCoords(waypoints, t);
    
    // Emit thruster flame particles when moving
    if (this.phase === 'phase3' && t < 0.98) {
      this.particles.emitRocketExhaust(rocketPos.x - 22, rocketPos.y, Math.PI + rocketPos.angle);
    }

    // If rocket hits star in phase 3, trigger star collect celebration burst
    if (this.phase === 'phase3' && t >= 0.98 && !this.starCollected) {
      this.starCollected = true;
      this.particles.emitStarCollect(starPt.x, starPt.y);
      if (window.soundFx) window.soundFx.playCorrect();
    }
    if (this.phase !== 'phase3') {
      this.starCollected = false;
    }

    // Draw Rocket Body
    this.drawRocketShip(ctx, rocketPos.x, rocketPos.y, rocketPos.angle);
  }

  getRocketCoords(pts, t) {
    // Piecewise bezier interpolation across 3 segments
    if (t <= 0.33) {
      const u = t / 0.33;
      const x = (1 - u) * pts[0].x + u * pts[1].x;
      const y = (1 - u) * pts[0].y + u * pts[1].y;
      return { x, y, angle: -0.2 };
    } else if (t <= 0.66) {
      const u = (t - 0.33) / 0.33;
      const x = (1 - u) * pts[1].x + u * pts[2].x;
      const y = (1 - u) * pts[1].y + u * pts[2].y;
      return { x, y, angle: 0.35 };
    } else {
      const u = (t - 0.66) / 0.34;
      const x = (1 - u) * pts[2].x + u * pts[3].x;
      const y = (1 - u) * pts[2].y + u * pts[3].y;
      return { x, y, angle: -0.15 };
    }
  }

  drawRocketShip(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 3D Drop Shadow
    ctx.shadowColor = 'rgba(239, 68, 68, 0.28)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;

    // Rocket Main Hull (Vibrant Red Capsule matching screenshot)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rocket Nose Cone
    ctx.beginPath();
    ctx.moveTo(30, -14);
    ctx.lineTo(48, 0);
    ctx.lineTo(30, 14);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Rear Fins
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-20, -18);
    ctx.lineTo(-38, -26);
    ctx.lineTo(-28, -6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-20, 18);
    ctx.lineTo(-38, 26);
    ctx.lineTo(-28, 6);
    ctx.closePath();
    ctx.fill();

    // Cockpit Window (Glowing Cyan / White Port)
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(10, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(12, -2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#bae6fd';
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // SCENE 2: LAMP CIRCUIT
  // Switch (OFF / ON) -> Conductor Wire -> Lamp (Dark / Glowing)
  // =========================================================================
  renderCircuitScene(ctx, w, h) {
    const isCircuitOn = this.phase === 'phase3';

    // 1. Switch Box Coordinates
    const switchX = 180;
    const switchY = 260;
    const lampX = 540;
    const lampY = 260;

    // 2. Draw Heavy Connecting Copper Wire
    ctx.save();
    ctx.lineWidth = 10;
    ctx.strokeStyle = isCircuitOn ? '#fbbf24' : '#475569';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(switchX + 50, switchY);
    ctx.lineTo(lampX - 60, lampY);
    ctx.stroke();

    // If ON, draw animated electric energy pulses traveling down the wire
    if (isCircuitOn) {
      const pulsePos = (this.time * 240) % (lampX - switchX - 110);
      const px = switchX + 50 + pulsePos;
      
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px - 20, switchY);
      ctx.lineTo(px + 20, switchY);
      ctx.stroke();

      this.particles.emitElectricSparks(px, switchY);
    }
    ctx.restore();

    // 3. Draw Tactile Switch Box
    ctx.save();
    ctx.translate(switchX, switchY);
    
    // Box Shadow & Base
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    this.drawRoundedRect(ctx, -55, -70, 110, 140, 24);
    ctx.fill();

    // Switch Button (Green "ON" or Grey/Red "OFF")
    ctx.shadowColor = 'transparent';
    const btnColor = isCircuitOn ? '#22c55e' : '#475569';
    const btnLabel = isCircuitOn ? 'ON' : 'OFF';

    ctx.fillStyle = btnColor;
    this.drawRoundedRect(ctx, -40, -45, 80, 90, 18);
    ctx.fill();

    // Button Label
    ctx.font = 'bold 24px Fredoka';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btnLabel, 0, 0);
    ctx.restore();

    // 4. Draw Light Bulb / Lamp
    ctx.save();
    ctx.translate(lampX, lampY);

    if (isCircuitOn) {
      // Magnificent Radiant Warm Light Glow
      const bulbGlow = ctx.createRadialGradient(0, -30, 20, 0, -30, 160);
      bulbGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      bulbGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.35)');
      bulbGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bulbGlow;
      ctx.beginPath();
      ctx.arc(0, -30, 160, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bulb Base / Screw Thread
    ctx.fillStyle = '#94a3b8';
    this.drawRoundedRect(ctx, -18, 25, 36, 18, 4);
    ctx.fill();
    this.drawRoundedRect(ctx, -14, 46, 28, 10, 4);
    ctx.fill();

    // Bulb Glass Body
    ctx.beginPath();
    ctx.arc(0, -30, 50, 0, Math.PI * 2);
    ctx.fillStyle = isCircuitOn ? '#fef08a' : '#64748b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isCircuitOn ? '#f59e0b' : '#475569';
    ctx.stroke();

    // Filament Inside
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isCircuitOn ? '#f59e0b' : '#334155';
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-10, -20);
    ctx.lineTo(0, -35);
    ctx.lineTo(10, -20);
    ctx.lineTo(15, 10);
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // SCENE 3: FORK IN THE PATH
  // Y-Junction road: Left -> Gift Box | Right -> Dog & Basketball
  // =========================================================================
  renderForkScene(ctx, w, h) {
    const isFixed = this.phase === 'phase3';

    // 1. Draw Y-Shaped Path / Highway
    ctx.save();
    const startX = 400;
    const startY = 460;
    const junctionX = 400;
    const junctionY = 270;
    const leftBranchX = 260;
    const leftBranchY = 170;
    const rightBranchX = 540;
    const rightBranchY = 170;

    // Trunk Path (Stem)
    ctx.lineCap = 'round';
    ctx.lineWidth = 32;
    ctx.strokeStyle = '#f43f5e'; // Pink/salmon trunk as in screenshot
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(junctionX, junctionY);
    ctx.stroke();

    // Left Branch (Pink to Gift Box)
    ctx.strokeStyle = isFixed ? '#f43f5e' : 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.moveTo(junctionX, junctionY);
    ctx.lineTo(leftBranchX, leftBranchY);
    ctx.stroke();

    // Right Branch (Green to Dog/Ball)
    ctx.strokeStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.moveTo(junctionX, junctionY);
    ctx.lineTo(rightBranchX, rightBranchY);
    ctx.stroke();
    ctx.restore();

    // 2. Left Branch: Gift Box
    ctx.save();
    ctx.translate(leftBranchX - 35, leftBranchY - 40);
    this.drawGiftBox(ctx, isFixed);
    ctx.restore();

    // 3. Right Branch: Dog Icon & Basketball
    ctx.save();
    ctx.translate(rightBranchX + 10, leftBranchY - 35);
    this.drawDogToy(ctx);
    ctx.translate(55, 0);
    this.drawBasketball(ctx);
    ctx.restore();

    // 4. Animated Character (Boy Avatar)
    let charX = junctionX;
    let charY = junctionY;

    if (this.phase === 'phase1') {
      // In bug state, walks straight up into empty dead zone!
      const walkUp = Math.min(this.progress * 80, 70);
      charY = junctionY - walkUp;
    } else if (this.phase === 'phase2') {
      // Stuck above junction looking into empty space
      charY = junctionY - 70;
    } else if (this.phase === 'phase3') {
      // In fixed state, walks left towards the gift box!
      const t = Math.min(this.progress * 1.2, 1.0);
      charX = junctionX + (leftBranchX - junctionX) * t;
      charY = junctionY + (leftBranchY - junctionY) * t;
    }

    this.drawCharacterAvatar(ctx, charX, charY);
  }

  drawGiftBox(ctx, isOpen) {
    ctx.save();
    // 3D Isometric Gift Box Frame
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = isOpen ? '#fef08a' : '#f8fafc';

    // Box Front Face
    ctx.fillRect(0, 15, 45, 45);
    ctx.strokeRect(0, 15, 45, 45);

    // Box Top Lid
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(15, 0);
    ctx.lineTo(60, 0);
    ctx.lineTo(45, 15);
    ctx.closePath();
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.stroke();

    // Box Right Side
    ctx.beginPath();
    ctx.moveTo(45, 15);
    ctx.lineTo(60, 0);
    ctx.lineTo(60, 45);
    ctx.lineTo(45, 60);
    ctx.closePath();
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    ctx.stroke();

    // Ribbon / Bow
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(22, 15);
    ctx.lineTo(22, 60);
    ctx.stroke();

    if (isOpen) {
      // Open star sparkles popping out
      this.drawStarPath(ctx, 22, -10, 5, 14, 7);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }
    ctx.restore();
  }

  drawDogToy(ctx) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fb923c';
    ctx.fillStyle = '#fed7aa';

    // Dog Head
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.beginPath();
    ctx.ellipse(-18, -12, 8, 14, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(18, -12, 8, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Snout / Eyes
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(-7, -4, 3, 0, Math.PI * 2);
    ctx.arc(7, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBasketball(ctx) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = '#ffffff';

    // Ball Circle
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ball Seams
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.moveTo(0, -22);
    ctx.lineTo(0, 22);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-14, 0, 16, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, 0, 16, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  }

  drawCharacterAvatar(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Glowing circle frame around avatar
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Stylized Cute Face
    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, -2, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fbcfe8';
    ctx.fill();

    // Hair
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, -6, 18, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 3, 5, 0, Math.PI);
    ctx.stroke();

    // Blue Shirt collar
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-18, 20);
    ctx.quadraticCurveTo(0, 14, 18, 20);
    ctx.lineTo(22, 30);
    ctx.lineTo(-22, 30);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // =========================================================================
  // SCENE 4: STAMPER MACHINE LOOP
  // Piston Stamp -> Stamped Star Items on Conveyor
  // =========================================================================
  renderStamperScene(ctx, w, h) {
    const isFixed = this.phase === 'phase3';

    // 1. Conveyor / Platform Base
    ctx.save();
    const platX = 400;
    const platY = 380;
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    this.drawRoundedRect(ctx, platX - 180, platY - 40, 360, 80, 35);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Stamped Items on Conveyor
    // Item 1: Stamped Star
    this.drawStampedStar(ctx, platX - 90, platY);
    
    // Item 2: Stamped Star
    this.drawStampedStar(ctx, platX, platY);

    // Item 3: Stamped Star (only stamps in phase 3!)
    if (isFixed && this.progress >= 0.4) {
      this.drawStampedStar(ctx, platX + 90, platY);
    } else {
      // Empty outline waiting for stamp
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      this.drawStarPath(ctx, platX + 90, platY, 5, 20, 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // 2. Mechanical Piston Stamper
    ctx.save();
    let stampOffsetY = 0;

    if (this.phase === 'phase1') {
      // Stamps twice then stops
      const cycle = (this.time * 2.5) % 3;
      if (cycle < 2) {
        stampOffsetY = Math.sin(cycle * Math.PI) * 55;
      }
    } else if (this.phase === 'phase3') {
      // Final stamp stroke hitting item 3
      if (this.progress < 0.6) {
        stampOffsetY = Math.sin(this.progress * Math.PI / 0.6) * 65;
        if (stampOffsetY > 60 && !this.stampHit) {
          this.stampHit = true;
          this.particles.emitStampImpact(platX + 90, platY - 20);
          if (window.soundFx) window.soundFx.playStampPunch();
        }
      }
    }
    if (this.phase !== 'phase3') {
      this.stampHit = false;
    }

    const stampX = isFixed ? platX + 90 : platX;
    const stampBaseY = 180 + stampOffsetY;

    // Top "T" Handle (Red)
    ctx.fillStyle = '#b91c1c';
    this.drawRoundedRect(ctx, stampX - 50, stampBaseY - 110, 100, 20, 6);
    ctx.fill();
    this.drawRoundedRect(ctx, stampX - 14, stampBaseY - 110, 28, 70, 4);
    ctx.fill();

    // Cylinder Body (Grey Chrome)
    const cylGrad = ctx.createLinearGradient(stampX - 70, 0, stampX + 70, 0);
    cylGrad.addColorStop(0, '#94a3b8');
    cylGrad.addColorStop(0.5, '#f1f5f9');
    cylGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = cylGrad;
    this.drawRoundedRect(ctx, stampX - 70, stampBaseY - 40, 140, 50, 16);
    ctx.fill();

    // Stamping Pad (Orange Rubber Head with texture)
    ctx.fillStyle = '#fb923c';
    this.drawRoundedRect(ctx, stampX - 75, stampBaseY + 10, 150, 36, 10);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c2410c';
    ctx.stroke();

    ctx.restore();
  }

  drawStampedStar(ctx, x, y) {
    ctx.save();
    this.drawStarPath(ctx, x, y, 5, 24, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // UTILITY DRAWING HELPERS
  // =========================================================================
  drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawStarPath(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
}
