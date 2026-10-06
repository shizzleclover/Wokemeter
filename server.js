const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const PORT = Number(process.env.PORT || 3000);
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const MODEL = "openai/gpt-oss-120b";
const PUBLIC_DIR = path.join(__dirname, "public");

let db;
if (MONGO_URI) {
  const client = new MongoClient(MONGO_URI);
  client.connect().then(() => {
    db = client.db("wokeometer");
    console.log("Connected to MongoDB.");
  }).catch(console.error);
}

if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const MAX_BODY_BYTES = 150_000;
const MAX_RESPONSES = 60;
const MAX_ANSWER_LENGTH = 3_000;

// Very small in-memory rate limiter for the MVP.
// Replace with a real edge/server rate limiter before public launch.
const rateMap = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateMap.entries()) {
    if (now - data.startedAt > WINDOW_MS) {
      rateMap.delete(key);
    }
  }
}, WINDOW_MS);

let satori, Resvg;
try {
  satori = require("satori").default || require("satori");
  Resvg = require("@resvg/resvg-js").Resvg;
} catch (e) {
  console.warn("Satori or resvg not installed. OG image generation will fail.");
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return String(forwarded || req.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function allowed(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const current = rateMap.get(key);

  if (!current || now - current.startedAt > WINDOW_MS) {
    rateMap.set(key, { startedAt: now, count: 1 });
    return true;
  }

  current.count += 1;
  return current.count <= MAX_REQUESTS_PER_WINDOW;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        resolve(Buffer.concat(chunks).toString("utf8"));
      } catch {
        reject(new Error("Could not read request."));
      }
    });

    req.on("error", reject);
  });
}

function logAnalytics(result) {
  try {
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      wokeScore: result.wokeScore,
      dimensions: result.dimensions
    }) + "\n";
    fs.appendFile(path.join(__dirname, "analytics.jsonl"), logEntry, (err) => {
      if (err) console.error("Failed to write analytics:", err);
    });
  } catch (err) {
    console.error("Failed to serialize analytics:", err);
  }
}

function validatePayload(payload) {
  if (!payload || !Array.isArray(payload.responses)) {
    throw new Error("Invalid response payload.");
  }

  if (payload.responses.length < 10 || payload.responses.length > MAX_RESPONSES) {
    throw new Error("Invalid number of responses.");
  }

  return payload.responses.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid response at index ${index}.`);
    }

    const question = String(item.question || "").trim();
    const type = ["essay", "rank"].includes(item.type) ? item.type : "choice";
    const answer = String(item.answer || "").trim();
    const version = String(item.version || "1.0");

    if (!question || !answer) {
      throw new Error(`Missing response at index ${index}.`);
    }

    if (question.length > 600 || answer.length > MAX_ANSWER_LENGTH) {
      throw new Error(`Response at index ${index} is too long.`);
    }

    return { question, type, answer, version };
  });
}

const systemPrompt = `
You are Wokeometer's worldview analyst.

Wokeometer is an entertainment product that estimates how a person's
answers would generally be perceived along progressive/traditional and
related ideological dimensions.

Analyze the COMPLETE response set.

IMPORTANT INSTRUCTIONS FOR PERSONALIZATION:
- Address the user directly as "you" or "your" in your summary, roast, and analysis.
- When summarizing or roasting, directly quote or heavily paraphrase specific phrases from their essay answers to make it feel deeply personal.
- Assign the user to the most fitting 'archetype' strictly from the allowed list.
- In 'relatedFigures', provide exactly 5 real people across media, politics, history, or pop culture (e.g., Nelson Mandela, Mao Zedong, Joe Rogan, Taylor Swift, etc.) whose worldviews or public personas most closely align with the user's answers.
- Do not sanitize the analysis merely because the topic is controversial.
- Do not praise, shame, persuade, or lecture the user.

SCORING CALIBRATION:
- A score of 10-20 represents deeply traditional, conservative, or orthodox views.
- A score of 45-55 represents a mixed, moderate, or highly centrist worldview.
- A score of 80-90 represents highly progressive, socially liberal, and identity-conscious views.

Use 0-100 for dimensions and the overall score.
`.trim();

const resultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    wokeScore: { type: "integer", minimum: 0, maximum: 100 },
    archetype: { 
      type: "string",
      enum: [
        "The Visionary Reformer",
        "The Empathetic Utopian",
        "The Pragmatic Centrist",
        "The Live-and-Let-Live Libertarian",
        "The Free-Speech Absolutist",
        "The Steadfast Traditionalist",
        "The Stern Guardian",
        "The Skeptical Contrarian"
      ]
    },
    relatedFigures: { 
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5
    },
    headline: { type: "string" },
    summary: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    dimensions: {
      type: "object",
      additionalProperties: false,
      properties: {
        socialProgressivism: { type: "integer", minimum: 0, maximum: 100 },
        economicProgressivism: { type: "integer", minimum: 0, maximum: 100 },
        identityConsciousness: { type: "integer", minimum: 0, maximum: 100 },
        genderProgressivism: { type: "integer", minimum: 0, maximum: 100 },
        traditionalism: { type: "integer", minimum: 0, maximum: 100 },
        freeSpeech: { type: "integer", minimum: 0, maximum: 100 },
        individualism: { type: "integer", minimum: 0, maximum: 100 }
      },
      required: [
        "socialProgressivism",
        "economicProgressivism",
        "identityConsciousness",
        "genderProgressivism",
        "traditionalism",
        "freeSpeech",
        "individualism"
      ]
    },
    strongestBeliefs: {
      type: "array",
      items: { type: "string" }
    },
    contradictions: {
      type: "array",
      items: { type: "string" }
    },
    mostRevealing: {
      type: "object",
      additionalProperties: false,
      properties: {
        question: { type: "string" },
        answer: { type: "string" },
        analysis: { type: "string" }
      },
      required: ["question", "answer", "analysis"]
    },
    strongestArgument: { type: "string" },
    weakestArgument: { type: "string" },
    roast: { type: "string" }
  },
  required: [
    "wokeScore",
    "archetype",
    "relatedFigures",
    "headline",
    "summary",
    "confidence",
    "dimensions",
    "strongestBeliefs",
    "contradictions",
    "mostRevealing",
    "strongestArgument",
    "weakestArgument",
    "roast"
  ]
};

async function analyze(responses) {
  const userPrompt = `
Here are the user's responses.

${responses.map((r, i) => `
QUESTION ${i + 1} [${r.type.toUpperCase()}]
${r.question}

ANSWER
${r.answer}
`).join("\n")}

Return the complete Wokeometer result as JSON matching the schema.
`.trim();

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      reasoning_effort: "medium",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "wokeometer_result",
          strict: true,
          schema: resultSchema
        }
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Groq error:", JSON.stringify(data, null, 2));
    throw new Error(data?.error?.message || "AI analysis failed.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI returned no result.");

  return JSON.parse(content);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded);
  const filePath = path.join(PUBLIC_DIR, normalized === "/" ? "index.html" : normalized);
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/analyze") {
      if (!allowed(req)) {
        return json(res, 429, { error: "Too many attempts. Try again in a minute." });
      }

      const raw = await readBody(req);
      const payload = JSON.parse(raw);
      const responses = validatePayload(payload);
      const result = await analyze(responses);
      let resultId = null;
      if (db) {
        const doc = await db.collection("results").insertOne({ ...result, createdAt: new Date() });
        resultId = doc.insertedId.toString();
      }
      
      logAnalytics(result);

      return json(res, 200, { result, id: resultId });
    }
    
    if (req.method === "POST" && req.url === "/api/track") {
      const raw = await readBody(req);
      if (db) {
        await db.collection("analytics").insertOne({ event: "dropoff", data: JSON.parse(raw), timestamp: new Date() });
      }
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      
      if (parsedUrl.pathname === "/api/health") {
        return json(res, 200, { status: "ok", uptime: process.uptime() });
      }
      
      if (parsedUrl.pathname === "/api/result") {
        const id = parsedUrl.searchParams.get("id");
        if (!id || !db) return json(res, 404, { error: "Not found" });
        try {
          const doc = await db.collection("results").findOne({ _id: new ObjectId(id) });
          if (!doc) return json(res, 404, { error: "Not found" });
          return json(res, 200, { result: doc });
        } catch (e) {
          return json(res, 400, { error: "Invalid ID" });
        }
      }
      
      if (parsedUrl.pathname === "/api/stats") {
        if (!db) return json(res, 500, { error: "DB not connected" });
        const total = await db.collection("results").countDocuments();
        const scoreAvgAgg = await db.collection("results").aggregate([{ $group: { _id: null, avgScore: { $avg: "$wokeScore" } } }]).toArray();
        const archAgg = await db.collection("results").aggregate([
          { $group: { _id: "$archetype", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).toArray();
        return json(res, 200, {
          total,
          averageScore: scoreAvgAgg[0]?.avgScore || 0,
          topArchetype: archAgg[0]?._id || "Unknown"
        });
      }
      
      if (parsedUrl.pathname === "/api/og-image" && satori && Resvg) {
        let score = parsedUrl.searchParams.get("score") || "50";
        let archetype = parsedUrl.searchParams.get("archetype") || "Unknown";
        const id = parsedUrl.searchParams.get("id");
        
        if (id && db) {
          try {
            const doc = await db.collection("results").findOne({ _id: new ObjectId(id) });
            if (doc) {
              score = String(doc.wokeScore);
              archetype = doc.archetype;
            }
          } catch(e) {}
        }
        
        const fontData = fs.readFileSync(path.join(PUBLIC_DIR, "Inter-Bold.ttf"));
        const svg = await satori(
          {
            type: "div",
            props: {
              style: {
                display: "flex", flexDirection: "column", width: "100%", height: "100%",
                backgroundColor: "#1a1a1a", color: "#faf9f6", justifyContent: "center",
                alignItems: "center", padding: "40px", fontFamily: "Inter"
              },
              children: [
                { type: "div", props: { style: { color: "#e63946", fontSize: 32, letterSpacing: "0.2em", fontWeight: 700, marginBottom: 20 }, children: "WOKEOMETER" } },
                { type: "div", props: { style: { fontSize: 180, fontWeight: 800, margin: "20px 0", lineHeight: 1 }, children: score + "%" } },
                { type: "div", props: { style: { fontSize: 48, fontWeight: 700, textAlign: "center", color: "#e6e2d8" }, children: archetype } }
              ]
            }
          },
          { width: 1200, height: 630, fonts: [{ name: "Inter", data: fontData, weight: 700, style: "normal" }] }
        );
        
        const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000" });
        res.end(resvg.render().asPng());
        return;
      }

      if (parsedUrl.pathname === "/share") {
        let score = parsedUrl.searchParams.get("score") || "";
        let archetype = parsedUrl.searchParams.get("archetype") || "";
        const id = parsedUrl.searchParams.get("id");
        
        if (id && db) {
          try {
            const doc = await db.collection("results").findOne({ _id: new ObjectId(id) });
            if (doc) {
              score = String(doc.wokeScore);
              archetype = doc.archetype;
            }
          } catch(e) {}
        }
        
        score = escapeHtml(score);
        archetype = escapeHtml(archetype);
        
        const ogImageUrl = `http://${req.headers.host}/api/og-image?${id ? `id=${id}` : `score=${encodeURIComponent(score)}&archetype=${encodeURIComponent(archetype)}`}`;
        
        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wokeometer Result: ${score}% - ${archetype}</title>
  <meta property="og:title" content="Wokeometer Result: ${score}%">
  <meta property="og:description" content="I scored ${score}% on Wokeometer. Archetype: ${archetype}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="twitter:card" content="summary_large_image">
  <script>window.location.href = "${id ? `/results.html?id=${id}` : '/'}";</script>
</head>
<body><p>Redirecting...</p></body>
</html>`;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      const filePath = safePath(parsedUrl.pathname);
      if (!filePath) return json(res, 400, { error: "Bad path." });

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === "ENOENT") return json(res, 404, { error: "Not found." });
          return json(res, 500, { error: "Server error." });
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": mime[ext] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff"
        });
        res.end(content);
      });
      return;
    }

    json(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error(error);
    json(res, 400, { error: error.message || "Something went wrong." });
  }
});

server.listen(PORT, () => {
  console.log(`Wokeometer running at http://localhost:${PORT}`);
});
