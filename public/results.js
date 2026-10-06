const loading = document.getElementById("loading");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");

async function main() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (id) {
    try {
      const res = await fetch(`/api/result?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const statsRes = await fetch('/api/stats');
      const statsData = statsRes.ok ? await statsRes.json() : null;
      
      sessionStorage.setItem("wokeometerResultId", id);
      sessionStorage.setItem("wokeometerResult", JSON.stringify(data.result));
      renderResult(data.result, statsData);
    } catch (e) {
      showError(e.message || "Failed to load result.");
    }
    return;
  }

  const raw = sessionStorage.getItem("wokeometerResponses");
  if (!raw) {
    showError("No quiz session found. Start the quiz again.");
    return;
  }

  let responses;
  try {
    responses = JSON.parse(raw);
  } catch {
    showError("Your quiz session is invalid. Start again.");
    return;
  }

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");

    sessionStorage.setItem("wokeometerResult", JSON.stringify(data.result));
    sessionStorage.removeItem("wokeometerResponses");
    
    if (data.id) {
      sessionStorage.setItem("wokeometerResultId", data.id);
      window.history.replaceState({}, "", `/results.html?id=${data.id}`);
    }

    const statsRes = await fetch('/api/stats');
    const statsData = statsRes.ok ? await statsRes.json() : null;

    renderResult(data.result, statsData);
  } catch (error) {
    showError(error.message || "Something went wrong.");
  }
}

function renderResult(r, stats = null) {
  loading.classList.add("hidden");
  resultEl.classList.remove("hidden");

  resultEl.innerHTML = `
    <section class="score-card">
      <p class="eyebrow">YOUR WOKEOMETER</p>
      
      <div class="gauge-container">
        <svg viewBox="0 0 100 55" class="gauge">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#22c55e" />
              <stop offset="50%" stop-color="#eab308" />
              <stop offset="100%" stop-color="#e63946" />
            </linearGradient>
          </defs>
          <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border)" stroke-width="12" stroke-linecap="round"/>
          <path class="gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gaugeGradient)" stroke-width="12" stroke-linecap="round" stroke-dasharray="126" stroke-dashoffset="126"/>
        </svg>
        <div class="gauge-score"><span id="anim-score">0</span><span style="font-size: 0.5em">%</span></div>
      </div>

      <div class="score-label">${escapeHtml(scoreLabel(r.wokeScore))}</div>
      ${stats ? `<div class="global-stats">Global Avg: ${Math.round(stats.averageScore)}% · Most Common: ${escapeHtml(stats.topArchetype)}</div>` : ''}
      
      <img src="/images/${escapeHtml(r.archetype).replace(/ /g, '_')}.jpg" alt="${escapeHtml(r.archetype)}" class="archetype-img" onerror="this.style.display='none'">
      <h1>${escapeHtml(r.archetype)}</h1>
      
      <p class="historical-figure">You relate most with:</p>
      <div class="figures-accordion">
        ${(r.relatedFigures || []).map(f => {
          const name = typeof f === 'string' ? f : f.name;
          const reason = typeof f === 'string' ? "You share similar overarching ideological principles." : f.reason;
          return `
          <div class="accordion-item">
            <button class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
              <div class="figure-img placeholder" data-name="${escapeHtml(name)}"></div>
              <span>${escapeHtml(name)}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
            </button>
            <div class="accordion-body">
              <p>${escapeHtml(reason)}</p>
            </div>
          </div>
          `;
        }).join("")}
      </div>


      <p class="headline">${escapeHtml(r.headline)}</p>
      <p class="summary">${escapeHtml(r.summary)}</p>
    </section>

    <section class="result-section">
      <div class="section-heading">
        <span>01</span>
        <h2>Your worldview</h2>
      </div>
      <div class="dimensions">
        ${dimension("Social progressivism", r.dimensions.socialProgressivism)}
        ${dimension("Economic progressivism", r.dimensions.economicProgressivism)}
        ${dimension("Identity consciousness", r.dimensions.identityConsciousness)}
        ${dimension("Gender progressivism", r.dimensions.genderProgressivism)}
        ${dimension("Traditionalism", r.dimensions.traditionalism)}
        ${dimension("Free-speech absolutism", r.dimensions.freeSpeech)}
        ${dimension("Individualism", r.dimensions.individualism)}
      </div>
    </section>

    <section class="result-section">
      <div class="section-heading">
        <span>02</span>
        <h2>What stands out</h2>
      </div>
      <div class="list-card">
        <h3>Strongest beliefs</h3>
        ${list(r.strongestBeliefs)}
      </div>
      <div class="list-card">
        <h3>Contradictions</h3>
        ${r.contradictions?.length ? list(r.contradictions) : "<p>You were annoyingly consistent.</p>"}
      </div>
    </section>

    <section class="result-section">
      <div class="section-heading">
        <span>03</span>
        <h2>Your most revealing answer</h2>
      </div>
      <article class="quote-card">
        <p class="quote-question">${escapeHtml(r.mostRevealing.question)}</p>
        <blockquote>“${escapeHtml(r.mostRevealing.answer)}”</blockquote>
        <p>${escapeHtml(r.mostRevealing.analysis)}</p>
      </article>
    </section>

    <section class="result-section split">
      <div class="list-card">
        <h3>Strongest argument</h3>
        <p>${escapeHtml(r.strongestArgument)}</p>
      </div>
      <div class="list-card">
        <h3>Weakest argument</h3>
        <p>${escapeHtml(r.weakestArgument)}</p>
      </div>
    </section>

    <section class="roast-card">
      <p class="eyebrow">THE VERDICT</p>
      <h2>${escapeHtml(r.roast)}</h2>
      <p>Analysis confidence: ${escapeHtml(r.confidence)}%</p>
    </section>

    <div class="result-actions">
      <button class="button primary" id="share">Share my result</button>
      <a class="button ghost" href="/quiz.html">Take it again</a>
    </div>
  `;

  document.getElementById("share").addEventListener("click", shareResult);

  // Animate Gauge
  setTimeout(() => {
    const dashoffset = 126 - (r.wokeScore / 100) * 126;
    const fill = document.querySelector(".gauge-fill");
    if (fill) {
      fill.style.transition = "stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
      fill.style.strokeDashoffset = dashoffset;
    }
    const scoreText = document.getElementById("anim-score");
    if (scoreText && r.wokeScore > 0) {
      let start = 0;
      const stepTime = 1500 / r.wokeScore;
      const timer = setInterval(() => {
        if (start >= r.wokeScore) {
          clearInterval(timer);
          scoreText.textContent = r.wokeScore;
        } else {
          start++;
          scoreText.textContent = start;
        }
      }, stepTime);
    }
  }, 100);

  // Fetch Wikipedia Images
  document.querySelectorAll(".figure-img").forEach(async imgEl => {
    const name = imgEl.dataset.name;
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=100&origin=*`);
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pages[pageId]?.thumbnail) {
          imgEl.style.backgroundImage = `url('${pages[pageId].thumbnail.source}')`;
          imgEl.classList.remove("placeholder");
        }
      }
    } catch (e) {
      console.error("Failed to fetch image for", name);
    }
  });
}

function dimension(label, value) {
  return `
    <div class="dimension">
      <div class="dimension-top">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
      <div class="bar"><div style="width:${Math.max(0, Math.min(100, value))}%"></div></div>
    </div>
  `;
}

function list(items = []) {
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function scoreLabel(score) {
  if (score >= 90) return "EXTREMELY WOKE";
  if (score >= 75) return "VERY WOKE";
  if (score >= 60) return "WOKE";
  if (score >= 45) return "MIXED BAG";
  if (score >= 30) return "NOT VERY WOKE";
  return "ANTI-WOKE";
}

async function shareResult() {
  const r = JSON.parse(sessionStorage.getItem("wokeometerResult") || "{}");
  const id = sessionStorage.getItem("wokeometerResultId");
  const text = `I scored ${r.wokeScore}% on Wokeometer: ${r.archetype}. ${r.headline}`;
  const shareUrl = id ? `${location.origin}/share?id=${id}` : `${location.origin}/share?score=${encodeURIComponent(r.wokeScore)}&archetype=${encodeURIComponent(r.archetype)}`;

  if (navigator.share) {
    await navigator.share({ title: "My Wokeometer result", text, url: shareUrl });
  } else {
    await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    const button = document.getElementById("share");
    button.textContent = "Copied";
    setTimeout(() => button.textContent = "Share my result", 1800);
  }
}

function showError(message) {
  loading.classList.add("hidden");
  errorEl.classList.remove("hidden");
  errorEl.innerHTML = `<h2>Something went wrong</h2><p>${escapeHtml(message)}</p><a class="button primary" href="/quiz.html">Try again</a>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

main();