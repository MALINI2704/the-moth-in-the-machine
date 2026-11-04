/**
 * The Moth in the Machine - Core Game Controller & State Machine
 * 
 * Manages game progression, timers, API communication, DOM interactions,
 * audio triggers, and modal transitions.
 */

class GameEngine {
  constructor() {
    // Canvas & Renderers
    this.canvas = document.getElementById('gameCanvas');
    this.particleSystem = new ParticleSystem(this.canvas);
    this.sceneRenderer = new SceneRenderer(this.canvas, this.particleSystem);
    this.confetti = new ConfettiBlast('confettiCanvas');

    // Game state
    this.levels = [];
    this.currentLevelIndex = 0;
    this.currentPhase = 'phase1'; // 'phase1' | 'phase2' | 'phase3'
    this.score = 0;
    this.timeRemaining = 300; // 5:00 minutes
    this.timerInterval = null;
    this.startTime = Date.now();
    this.lastFrameTime = performance.now();

    // DOM Elements
    this.timeDisplay = document.getElementById('timeDisplay');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.instructionTitle = document.getElementById('instructionTitle');
    this.instructionHint = document.getElementById('instructionHint');
    this.panelQuestion = document.getElementById('panelQuestion');
    this.optionsContainer = document.getElementById('optionsContainer');
    this.feedbackCard = document.getElementById('feedbackCard');
    this.feedbackIcon = document.getElementById('feedbackIcon');
    this.feedbackMessage = document.getElementById('feedbackMessage');
    this.btnContinue = document.getElementById('btnContinue');
    this.sceneBubble = document.getElementById('sceneBubble');
    this.sceneBubbleText = document.getElementById('sceneBubbleText');
    this.currentSceneDisplay = document.getElementById('currentSceneDisplay');
    this.currentPhaseDisplay = document.getElementById('currentPhaseDisplay');
    this.codeStateBadge = document.getElementById('codeStateBadge');
    this.codePreviewContent = document.getElementById('codePreviewContent');
    this.levelDots = document.getElementById('levelDots');

    // Modals
    this.modalVictory = document.getElementById('modalVictory');
    this.modalHistory = document.getElementById('modalHistory');
    this.modalCode = document.getElementById('modalCode');
    this.modalCertificate = document.getElementById('modalCertificate');

    // Buttons
    this.btnSound = document.getElementById('btnSound');
    this.btnReset = document.getElementById('btnReset');
    this.btnCodeToggle = document.getElementById('btnCodeToggle');
    this.btnFullscreen = document.getElementById('btnFullscreen');
    this.btnInfo = document.getElementById('btnInfo');
    this.stageReplayBtn = document.getElementById('stageReplayBtn');

    this.bindEvents();
    this.init();
  }

  async init() {
    try {
      // 1. Attempt to fetch level configurations from backend REST API
      const res = await fetch('/api/levels');
      const data = await res.json();
      
      if (data.success && data.levels && data.levels.length > 0) {
        this.levels = data.levels;
        console.log('✅ Connected to Moth in the Machine backend API');
      } else {
        throw new Error('API returned invalid data');
      }
    } catch (err) {
      console.warn('⚡ Backend API unreachable or running via file:// protocol. Activating standalone engine fallback.');
      this.levels = this.getEmbeddedLevels();
    }

    this.loadLevel(0, 'phase1');
    this.startTimer();
    this.startGameLoop();
  }

  getEmbeddedLevels() {
    return [
      {
        id: 1,
        levelNumber: 1,
        name: "Rocket Waypoints",
        instruction: "Find the Bug & Fix the Code Sequence!",
        hint: "Watch the rocket animation and select what is happening!",
        points: 25,
        phase1: {
          title: "What is happening?",
          bubbleText: null,
          options: [
            { id: "repeat", label: "Repeat", icon: "repeat", isBug: false },
            { id: "move", label: "Move", icon: "arrow-right", isBug: false },
            { id: "stop", label: "Stop", icon: "stop", isBug: true, correctExplanation: "The rocket stopped prematurely at waypoint 1 instead of reaching the Star!" }
          ]
        },
        phase2: {
          title: "How do we fix it?",
          bubbleText: "Stuck at 1!",
          options: [
            { id: "repeat_3", label: "Repeat 3 Times", icon: "repeat", isFix: true, correctExplanation: "Awesome! Repeating the move forward step 3 times lets the rocket reach waypoints 1, 2, 3, and the golden star!" },
            { id: "turn_back", label: "Turn Back", icon: "arrow-left", isFix: false, explanation: "Turning back won't help the rocket reach the star ahead." },
            { id: "stop_rocket", label: "Stop Rocket", icon: "stop", isFix: false, explanation: "Stopping won't get the rocket to the finish line!" }
          ]
        },
        codeSnippet: {
          buggy: [
            "// Buggy Sequence",
            "rocket.launch();",
            "rocket.moveForward(1); // Stuck at waypoint 1!",
            "rocket.stop();"
          ],
          fixed: [
            "// Fixed Sequence with Loop",
            "rocket.launch();",
            "for (let step = 1; step <= 3; step++) {",
            "  rocket.moveToWaypoint(step);",
            "}",
            "rocket.collectStar();"
          ]
        }
      },
      {
        id: 2,
        levelNumber: 2,
        name: "Lamp Circuit",
        instruction: "Find the Bug & Fix the Code Sequence!",
        hint: "Watch the circuit animation and select what is happening!",
        points: 25,
        phase1: {
          title: "What is happening?",
          bubbleText: "Dark!",
          options: [
            { id: "switch", label: "Switch", icon: "toggle", isBug: true, correctExplanation: "The switch is in the OFF state, breaking the circuit so no electrical current reaches the lamp!" },
            { id: "lamp", label: "Lamp", icon: "bulb", isBug: false },
            { id: "power", label: "Power", icon: "zap", isBug: false }
          ]
        },
        phase2: {
          title: "How do we fix it?",
          bubbleText: "Dark!",
          options: [
            { id: "switch_on", label: "Switch ON", icon: "toggle", isFix: true, correctExplanation: "Bingo! Flipping the switch to ON completes the circuit and energizes the lamp!" },
            { id: "change_lamp", label: "Change Lamp", icon: "bulb", isFix: false, explanation: "The lamp isn't broken—it just lacks electrical power because the switch is open." },
            { id: "more_power", label: "Boost Voltage", icon: "zap", isFix: false, explanation: "Increasing power won't work if the switch is in the OFF position." }
          ]
        },
        codeSnippet: {
          buggy: [
            "// Buggy Circuit Logic",
            "let circuitState = 'OFF';",
            "if (circuitState === 'ON') {",
            "  lamp.turnOn();",
            "} else {",
            "  lamp.remainDark(); // Bug: Switch is OFF!",
            "}"
          ],
          fixed: [
            "// Fixed Circuit Logic",
            "let circuitState = 'ON'; // Switch toggled!",
            "if (circuitState === 'ON') {",
            "  power.flowThroughWire();",
            "  lamp.illuminate(100);",
            "}"
          ]
        }
      },
      {
        id: 3,
        levelNumber: 3,
        name: "Fork in the Path",
        instruction: "Find the Bug & Fix the Code Sequence!",
        hint: "Watch the character animation and select what is happening!",
        points: 25,
        phase1: {
          title: "What is happening?",
          bubbleText: null,
          options: [
            { id: "move_forward", label: "Move Forward", icon: "arrow-up", isBug: true, correctExplanation: "The character continued moving straight ahead into empty dead space instead of taking the turn!" },
            { id: "turn_left", label: "Turn Left", icon: "arrow-left", isBug: false },
            { id: "pick_gift", label: "Pick Gift", icon: "gift", isBug: false }
          ]
        },
        phase2: {
          title: "How do we fix it?",
          bubbleText: "Empty!",
          options: [
            { id: "turn_left", label: "Turn Left", icon: "arrow-left", isFix: true, correctExplanation: "Excellent direction! Turning left steers the character down the path directly to the mystery gift box!" },
            { id: "turn_right", label: "Turn Right", icon: "arrow-right", isFix: false, explanation: "Turning right leads towards the toys, but our primary mission target is the gift box!" },
            { id: "turn_around", label: "Turn Around", icon: "repeat", isFix: false, explanation: "Turning around walks back to the starting point instead of progressing to the gift!" }
          ]
        },
        codeSnippet: {
          buggy: [
            "// Buggy Navigation",
            "character.walkTo(Junction);",
            "character.moveForward(); // Walked off into empty space!",
            "character.lookForGift(); // Result: Empty!"
          ],
          fixed: [
            "// Fixed Conditional Navigation",
            "character.walkTo(Junction);",
            "character.turnLeft(); // Correct branch",
            "character.walkTo(GiftBox);",
            "character.openGift(); // Success!"
          ]
        }
      },
      {
        id: 4,
        levelNumber: 4,
        name: "Stamper Machine Loop",
        instruction: "Find the Bug & Fix the Code Sequence!",
        hint: "Watch the stamper animation and select what is happening!",
        points: 25,
        phase1: {
          title: "What is happening?",
          bubbleText: null,
          options: [
            { id: "repeat", label: "Repeat", icon: "repeat", isBug: false },
            { id: "stamp", label: "Stamp", icon: "arrow-down", isBug: false },
            { id: "end", label: "End", icon: "stop", isBug: true, correctExplanation: "The stamping loop stopped prematurely after only 2 stamps! It suffered an off-by-one loop error." }
          ]
        },
        phase2: {
          title: "How do we fix it?",
          bubbleText: "Need 1 more!",
          options: [
            { id: "repeat_1", label: "Repeat 1", icon: "arrow-down", isFix: true, correctExplanation: "Perfect! Adding 1 more repetition completes the required quota of 3 stamped items!" },
            { id: "repeat_3", label: "Repeat 3", icon: "repeat", isFix: false, explanation: "Repeating 3 more times would over-stamp the batch (5 total)!" },
            { id: "repeat_forever", label: "Repeat Forever", icon: "repeat", isFix: false, explanation: "Repeating forever creates an infinite loop and crashes the machine!" }
          ]
        },
        codeSnippet: {
          buggy: [
            "// Buggy Loop Counter (Off-by-one)",
            "let targetStamps = 3;",
            "for (let count = 0; count < 2; count++) {",
            "  machine.stamp();",
            "}",
            "// Stopped early: Need 1 more!"
          ],
          fixed: [
            "// Fixed Loop Counter",
            "let targetStamps = 3;",
            "for (let count = 0; count < targetStamps; count++) {",
            "  machine.stamp();",
            "}",
            "machine.completeBatch(); // 100% finished!"
          ]
        }
      }
    ];
  }

  bindEvents() {
    // Continue Button Click
    this.btnContinue.addEventListener('click', () => {
      if (window.soundFx) window.soundFx.playClick();
      this.handleContinue();
    });

    // Sound toggle
    this.btnSound.addEventListener('click', () => {
      const isMuted = window.soundFx.toggleMute();
      document.getElementById('iconSoundOn').classList.toggle('hidden', isMuted);
      document.getElementById('iconSoundOff').classList.toggle('hidden', !isMuted);
    });

    // Reset / Replay
    this.btnReset.addEventListener('click', () => {
      if (window.soundFx) window.soundFx.playClick();
      this.replayCurrentScene();
    });
    this.stageReplayBtn.addEventListener('click', () => {
      if (window.soundFx) window.soundFx.playClick();
      this.replayCurrentScene();
    });

    // History modal
    this.btnInfo.addEventListener('click', () => {
      if (window.soundFx) window.soundFx.playClick();
      this.modalHistory.classList.remove('hidden');
    });
    document.getElementById('btnCloseHistory').addEventListener('click', () => {
      this.modalHistory.classList.add('hidden');
    });
    document.getElementById('btnHistoryGotIt').addEventListener('click', () => {
      this.modalHistory.classList.add('hidden');
    });

    // Code Inspector modal
    this.btnCodeToggle.addEventListener('click', () => {
      if (window.soundFx) window.soundFx.playClick();
      this.openCodeInspector();
    });
    document.getElementById('btnCloseCode').addEventListener('click', () => {
      this.modalCode.classList.add('hidden');
    });

    // Fullscreen toggle
    this.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Certificate modal triggers
    document.getElementById('btnViewCertificate').addEventListener('click', () => {
      const name = document.getElementById('playerNameInput').value.trim() || 'Intern Developer';
      document.getElementById('certPlayerName').textContent = name;
      document.getElementById('certScore').textContent = `${this.score} / 100 PTS`;
      document.getElementById('certDate').textContent = new Date().toISOString().split('T')[0];
      this.modalCertificate.classList.remove('hidden');
    });
    document.getElementById('btnCloseCertificate').addEventListener('click', () => {
      this.modalCertificate.classList.add('hidden');
    });
    document.getElementById('btnCloseCertBtn').addEventListener('click', () => {
      this.modalCertificate.classList.add('hidden');
    });

    // Play again
    document.getElementById('btnPlayAgain').addEventListener('click', () => {
      this.resetGame();
    });

    // Save leaderboard record
    document.getElementById('btnSaveRecord').addEventListener('click', async () => {
      const name = document.getElementById('playerNameInput').value.trim() || 'Intern Developer';
      const timeTaken = this.formatTime(300 - this.timeRemaining);
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score: this.score, timeTaken })
        });
        document.getElementById('btnSaveRecord').textContent = 'Saved! ✓';
        document.getElementById('btnSaveRecord').disabled = true;
      } catch (e) {
        console.error(e);
      }
    });
  }

  loadLevel(levelIndex, phase = 'phase1') {
    this.currentLevelIndex = levelIndex;
    this.currentPhase = phase;
    const level = this.levels[levelIndex];

    // Update Top & Status Labels
    this.currentSceneDisplay.textContent = `Level ${level.levelNumber}`;
    this.currentPhaseDisplay.textContent = phase === 'phase1' 
      ? 'Find the bug' 
      : (phase === 'phase2' ? 'Pick the fix' : 'Watch it work');

    // Update Level Progress Dots
    const dots = this.levelDots.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
      dot.classList.remove('active');
      if (idx === levelIndex) dot.classList.add('active');
      if (idx < levelIndex) dot.classList.add('completed');
    });

    // Update Instruction Header
    this.instructionTitle.textContent = level.instruction;
    this.instructionHint.textContent = `(Hint: ${level.hint})`;

    // Hide feedback & continue buttons
    this.feedbackCard.classList.add('hidden');
    this.btnContinue.classList.add('hidden');

    // Configure Scene Bubble Overlay
    const phaseData = phase === 'phase1' ? level.phase1 : level.phase2;
    if (phaseData && phaseData.bubbleText) {
      this.sceneBubbleText.textContent = phaseData.bubbleText;
      this.sceneBubble.classList.remove('hidden');
    } else {
      this.sceneBubble.classList.add('hidden');
    }

    // Configure Code Strip
    if (phase === 'phase3') {
      this.codeStateBadge.textContent = 'FIXED';
      this.codeStateBadge.className = 'strip-state fixed';
      this.codePreviewContent.innerHTML = `<code>${level.codeSnippet.fixed.join('\n')}</code>`;
    } else {
      this.codeStateBadge.textContent = 'BUGGY';
      this.codeStateBadge.className = 'strip-state';
      this.codePreviewContent.innerHTML = `<code>${level.codeSnippet.buggy.join('\n')}</code>`;
    }

    // Load Option Buttons
    this.renderOptions(level, phase);

    // Notify scene renderer
    this.sceneRenderer.setLevel(level.id, phase);

    // Play scene audio cues
    if (phase === 'phase1') {
      if (level.id === 1) window.soundFx.playRocketThrust(0.8);
      if (level.id === 2) window.soundFx.playSwitchClick();
      if (level.id === 4) window.soundFx.playStampPunch();
    }
  }

  renderOptions(level, phase) {
    this.optionsContainer.innerHTML = '';
    const phaseData = phase === 'phase1' ? level.phase1 : level.phase2;
    
    this.panelQuestion.textContent = phaseData.title;

    phaseData.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-icon">${this.getIconSvg(opt.icon)}</span>
        <span class="option-label">${opt.label}</span>
      `;

      btn.addEventListener('click', () => this.handleOptionSelect(btn, opt, level, phase));
      this.optionsContainer.appendChild(btn);
    });
  }

  async handleOptionSelect(btnElement, option, level, phase) {
    if (window.soundFx) window.soundFx.playClick();

    // Disable all options during evaluation
    const allButtons = this.optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);

    let isCorrect = false;
    let message = '';
    let nextPhase = 'phase1';

    try {
      // Validate via backend REST API
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelId: level.id,
          phase: phase,
          selectedOptionId: option.id
        })
      });
      const data = await res.json();
      isCorrect = data.isCorrect;
      message = data.message;
      nextPhase = data.nextPhase;
    } catch (err) {
      // Local evaluation fallback (when running offline or file:// protocol)
      if (phase === 'phase1') {
        isCorrect = option.isBug === true;
        message = isCorrect ? option.correctExplanation : 'That was not the cause of the bug. Observe the animation closely and try again!';
        nextPhase = isCorrect ? 'phase2' : 'phase1';
      } else {
        isCorrect = option.isFix === true;
        message = isCorrect ? option.correctExplanation : (option.explanation || 'Not quite! Think what code instruction would fix the sequence.');
        nextPhase = isCorrect ? 'phase3' : 'phase2';
      }
    }

    if (isCorrect) {
      // Correct answer!
      btnElement.classList.add('correct');
      if (window.soundFx) window.soundFx.playCorrect();

      this.feedbackIcon.textContent = '🎉';
      this.feedbackMessage.textContent = message;
      this.feedbackCard.classList.remove('hidden');

      // Show Continue button
      this.btnContinue.classList.remove('hidden');
      this.pendingNextPhase = nextPhase;

    } else {
      // Wrong answer
      btnElement.classList.add('wrong');
      if (window.soundFx) window.soundFx.playWrong();

      this.feedbackIcon.textContent = '🤔';
      this.feedbackMessage.textContent = message;
      this.feedbackCard.classList.remove('hidden');

      // Re-enable options after shake
      setTimeout(() => {
        btnElement.classList.remove('wrong');
        allButtons.forEach(b => b.disabled = false);
      }, 900);
    }
  }

  handleContinue() {
    const level = this.levels[this.currentLevelIndex];

    if (this.pendingNextPhase === 'phase2') {
      // Advance to Phase 2 (Pick the fix)
      this.loadLevel(this.currentLevelIndex, 'phase2');
    } else if (this.pendingNextPhase === 'phase3') {
      // Advance to Phase 3 (Watch it work!)
      this.currentPhase = 'phase3';
      this.currentPhaseDisplay.textContent = 'Watch it work';
      this.optionsContainer.innerHTML = '';
      this.panelQuestion.textContent = '🎉 Bug Fixed! Watch it work!';
      this.btnContinue.classList.add('hidden');
      this.sceneBubble.classList.add('hidden');

      // Update score
      this.score += level.points;
      this.scoreDisplay.textContent = this.score;

      // Update code preview to Fixed
      this.codeStateBadge.textContent = 'FIXED';
      this.codeStateBadge.className = 'strip-state fixed';
      this.codePreviewContent.innerHTML = `<code>${level.codeSnippet.fixed.join('\n')}</code>`;

      // Trigger scene full animation
      this.sceneRenderer.setLevel(level.id, 'phase3');

      // Play audio fanfare for level scene
      if (level.id === 1) window.soundFx.playRocketThrust(1.8);
      if (level.id === 2) {
        window.soundFx.playSwitchClick();
        setTimeout(() => window.soundFx.playElectricSpark(), 200);
      }
      if (level.id === 4) {
        setTimeout(() => window.soundFx.playStampPunch(), 400);
      }

      // After 3.5 seconds of watching it work, advance to next level or show victory
      setTimeout(() => {
        if (this.currentLevelIndex + 1 < this.levels.length) {
          this.loadLevel(this.currentLevelIndex + 1, 'phase1');
        } else {
          this.triggerVictory();
        }
      }, 3500);
    }
  }

  replayCurrentScene() {
    this.sceneRenderer.setLevel(this.levels[this.currentLevelIndex].id, this.currentPhase);
  }

  openCodeInspector() {
    const level = this.levels[this.currentLevelIndex];
    document.getElementById('modalBuggyCode').textContent = level.codeSnippet.buggy.join('\n');
    document.getElementById('modalFixedCode').textContent = level.codeSnippet.fixed.join('\n');
    this.modalCode.classList.remove('hidden');
  }

  triggerVictory() {
    clearInterval(this.timerInterval);
    const timeTakenSeconds = 300 - this.timeRemaining;
    const timeFormatted = this.formatTime(timeTakenSeconds);

    document.getElementById('victoryTime').textContent = timeFormatted;
    document.getElementById('victoryScore').textContent = `${this.score} pts`;

    // Confetti blast!
    this.confetti.start();
    if (window.soundFx) window.soundFx.playVictoryFanfare();

    // Show victory modal
    this.modalVictory.classList.remove('hidden');
  }

  resetGame() {
    this.modalVictory.classList.add('hidden');
    this.confetti.stop();
    this.score = 0;
    this.scoreDisplay.textContent = '0';
    this.timeRemaining = 300;
    this.startTimer();
    this.loadLevel(0, 'phase1');
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        clearInterval(this.timerInterval);
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    this.timeDisplay.textContent = this.formatTime(this.timeRemaining);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Animation Game Loop
  startGameLoop() {
    const loop = (currentTime) => {
      const dt = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      // Update scene & particle simulation
      this.sceneRenderer.update(Math.min(dt, 0.1));
      this.sceneRenderer.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  getIconSvg(iconType) {
    switch (iconType) {
      case 'repeat':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
      case 'arrow-right':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
      case 'arrow-left':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
      case 'arrow-up':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
      case 'arrow-down':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;
      case 'stop':
        return `<svg viewBox="0 0 24 24" width="18" height="18" fill="#ef4444"><circle cx="12" cy="12" r="10"/></svg>`;
      case 'toggle':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>`;
      case 'bulb':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>`;
      case 'zap':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
      case 'gift':
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>`;
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
