/**
 * The Moth in the Machine - Full-Stack Game Server
 * 
 * Architecture:
 * - Native Node.js HTTP Server (Zero external dependencies needed!)
 * - RESTful API Endpoints for level delivery, answer validation, and session tracking
 * - High-speed static file server with MIME-type mapping and cache-friendly headers
 * - Built-in persistence for game scores and leaderboards
 * 
 * Author: Internship Project
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Server configuration
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'levels.json');
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// In-memory session store (keyed by IP or session-id)
const playerSessions = new Map();

// Helper: Read JSON file safely
function loadJson(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[Data Error] Failed reading ${filePath}:`, err.message);
  }
  return fallback;
}

// Helper: Save JSON file safely
function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Data Error] Failed writing ${filePath}:`, err.message);
    return false;
  }
}

// Pre-load levels
const gameData = loadJson(DATA_FILE, { levels: [] });

// Initialize leaderboard if missing
if (!fs.existsSync(LEADERBOARD_FILE)) {
  saveJson(LEADERBOARD_FILE, [
    { name: "Grace Hopper", score: 100, timeTaken: "00:54", date: "1947-09-09" },
    { name: "Ada Lovelace", score: 100, timeTaken: "01:05", date: "2026-10-12" },
    { name: "Alan Turing", score: 100, timeTaken: "01:10", date: "2026-10-24" }
  ]);
}

// MIME Type dictionary for static file delivery
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Helper: Parse incoming JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Guard against huge payload attacks
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
    'Cache-Control': 'no-cache'
  });
  res.end(json);
}

// Helper: Get or initialize player session
function getSession(req) {
  const sessionId = req.headers['x-session-id'] || req.socket.remoteAddress || 'default-player';
  if (!playerSessions.has(sessionId)) {
    playerSessions.set(sessionId, {
      currentLevel: 1,
      currentPhase: 'phase1',
      score: 0,
      completedLevels: [],
      startTime: Date.now()
    });
  }
  return { id: sessionId, session: playerSessions.get(sessionId) };
}

// Static File Handler
function serveStaticFile(req, res, pathname) {
  // Normalize and prevent path traversal attacks
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Check if file exists within public folder
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: The requested resource ${pathname} was not found.`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Main HTTP Request Dispatcher
const server = http.createServer(async (req, res) => {
  // Handle CORS pre-flight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const { session } = getSession(req);

  try {
    // -------------------------------------------------------------
    // API ROUTE: GET /api/levels
    // Delivers level metadata, questions, and visual configurations
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/levels') {
      return sendJson(res, 200, {
        success: true,
        title: gameData.gameTitle,
        subtitle: gameData.subtitle,
        totalLevels: gameData.levels.length,
        timeLimitSeconds: gameData.timeLimitSeconds,
        levels: gameData.levels.map(lvl => ({
          id: lvl.id,
          levelNumber: lvl.levelNumber,
          name: lvl.name,
          instruction: lvl.instruction,
          hint: lvl.hint,
          points: lvl.points,
          phase1: lvl.phase1,
          phase2: lvl.phase2,
          codeSnippet: lvl.codeSnippet
        }))
      });
    }

    // -------------------------------------------------------------
    // API ROUTE: GET /api/levels/:id
    // Returns detailed level info
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname.startsWith('/api/levels/')) {
      const levelId = parseInt(pathname.split('/')[3], 10);
      const level = gameData.levels.find(l => l.id === levelId);
      if (!level) {
        return sendJson(res, 404, { success: false, error: 'Level not found' });
      }
      return sendJson(res, 200, { success: true, level });
    }

    // -------------------------------------------------------------
    // API ROUTE: POST /api/validate
    // Validates player answers for Phase 1 (Find bug) or Phase 2 (Fix bug)
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/validate') {
      const payload = await parseRequestBody(req);
      const { levelId, phase, selectedOptionId } = payload;

      const level = gameData.levels.find(l => l.id === parseInt(levelId, 10));
      if (!level) {
        return sendJson(res, 404, { success: false, error: 'Invalid level' });
      }

      if (phase === 'phase1') {
        const option = level.phase1.options.find(o => o.id === selectedOptionId);
        if (!option) {
          return sendJson(res, 400, { success: false, error: 'Invalid option selected' });
        }
        const isCorrect = option.isBug === true;
        return sendJson(res, 200, {
          success: true,
          isCorrect,
          message: isCorrect ? option.correctExplanation : 'That was not the cause of the bug. Observe the animation closely and try again!',
          nextPhase: isCorrect ? 'phase2' : 'phase1'
        });
      }

      if (phase === 'phase2') {
        const option = level.phase2.options.find(o => o.id === selectedOptionId);
        if (!option) {
          return sendJson(res, 400, { success: false, error: 'Invalid option selected' });
        }
        const isCorrect = option.isFix === true;
        if (isCorrect) {
          if (!session.completedLevels.includes(level.id)) {
            session.completedLevels.push(level.id);
            session.score += level.points;
          }
        }
        return sendJson(res, 200, {
          success: true,
          isCorrect,
          message: isCorrect ? option.correctExplanation : (option.explanation || 'Not quite! Think what code instruction would fix the sequence.'),
          currentScore: session.score,
          isLevelCompleted: isCorrect,
          nextPhase: isCorrect ? 'phase3' : 'phase2'
        });
      }

      return sendJson(res, 400, { success: false, error: 'Unknown phase' });
    }

    // -------------------------------------------------------------
    // API ROUTE: GET /api/progress
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/progress') {
      const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
      return sendJson(res, 200, {
        success: true,
        currentLevel: session.currentLevel,
        currentPhase: session.currentPhase,
        score: session.score,
        completedLevels: session.completedLevels,
        elapsedSeconds
      });
    }

    // -------------------------------------------------------------
    // API ROUTE: POST /api/progress/reset
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/progress/reset') {
      session.currentLevel = 1;
      session.currentPhase = 'phase1';
      session.score = 0;
      session.completedLevels = [];
      session.startTime = Date.now();
      return sendJson(res, 200, { success: true, message: 'Game progress reset successfully' });
    }

    // -------------------------------------------------------------
    // API ROUTE: GET /api/leaderboard
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/leaderboard') {
      const board = loadJson(LEADERBOARD_FILE, []);
      board.sort((a, b) => b.score - a.score);
      return sendJson(res, 200, { success: true, leaderboard: board.slice(0, 10) });
    }

    // -------------------------------------------------------------
    // API ROUTE: POST /api/leaderboard
    // -------------------------------------------------------------
    if (req.method === 'POST' && pathname === '/api/leaderboard') {
      const payload = await parseRequestBody(req);
      const { name, score, timeTaken } = payload;
      if (!name || typeof score !== 'number') {
        return sendJson(res, 400, { success: false, error: 'Invalid leaderboard entry' });
      }

      const board = loadJson(LEADERBOARD_FILE, []);
      board.push({
        name: name.slice(0, 24),
        score,
        timeTaken: timeTaken || '01:00',
        date: new Date().toISOString().split('T')[0]
      });
      board.sort((a, b) => b.score - a.score);
      saveJson(LEADERBOARD_FILE, board);

      return sendJson(res, 201, { success: true, leaderboard: board.slice(0, 10) });
    }

    // -------------------------------------------------------------
    // API ROUTE: GET /api/history
    // History about Grace Hopper & The Moth in the Machine
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/history') {
      return sendJson(res, 200, {
        success: true,
        historicalFact: {
          title: "The First Computer 'Bug' (1947)",
          pioneer: "Grace Hopper & The Harvard Mark II Team",
          date: "September 9, 1947",
          logbookEntry: "Relay #70, Panel F (moth) in relay.",
          quote: "First actual case of bug being found.",
          description: "While working on the Harvard Mark II computer at Harvard University, operators traced an error to an actual moth trapped between the points of relay #70. The moth was carefully removed and taped into the laboratory logbook with the caption 'First actual case of bug being found'. This popularized the terms 'bug' and 'debugging' throughout computing history!"
        }
      });
    }

    // Fallback: Static File Serving
    serveStaticFile(req, res, pathname);

  } catch (error) {
    console.error(`[Server Error] ${req.method} ${pathname}:`, error);
    sendJson(res, 500, { success: false, error: 'Internal Server Error' });
  }
});

// Start listening
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 [THE MOTH IN THE MACHINE] Server running!`);
  console.log(`🌐 Local URL:   http://localhost:${PORT}`);
  console.log(`📁 Public Dir:  ${PUBLIC_DIR}`);
  console.log(`🎮 Game Levels: ${gameData.levels.length} loaded`);
  console.log('====================================================');
});
