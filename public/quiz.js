const answers = new Map();
let current = 0;
let selectedQuestions = [];

function saveProgress() {
  localStorage.setItem("wokeometer_progress", JSON.stringify({
    selectedQuestions,
    current,
    answers: Array.from(answers.entries())
  }));
}

function loadProgress() {
  const saved = localStorage.getItem("wokeometer_progress");
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.selectedQuestions?.length) {
        selectedQuestions = state.selectedQuestions;
        current = state.current;
        state.answers.forEach(([k, v]) => answers.set(k, v));
        return true;
      }
    } catch(e) {}
  }
  return false;
}

if (!loadProgress()) {
  let qPool = [...window.QUESTIONS];
  const rankIndex = qPool.findIndex(q => q.id === "values_ranking");
  let rankQ = null;
  if (rankIndex !== -1) rankQ = qPool.splice(rankIndex, 1)[0];
  selectedQuestions = shuffle(qPool).slice(0, 19);
  if (rankQ) selectedQuestions.unshift(rankQ);
  saveProgress();
}

const view = document.getElementById("question-view");
const counter = document.getElementById("counter");
const progress = document.getElementById("progress");
const next = document.getElementById("next");
const back = document.getElementById("back");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function render() {
  const q = selectedQuestions[current];
  const saved = answers.get(q.id);

  counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(selectedQuestions.length).padStart(2, "0")}`;
  progress.style.width = `${((current + 1) / selectedQuestions.length) * 100}%`;
  back.disabled = current === 0;
  next.textContent = current === selectedQuestions.length - 1 ? "Analyze me →" : "Continue →";

  let typeLabel = "CHOOSE ONE";
  if (q.type === "essay") typeLabel = "OPEN ENDED";
  if (q.type === "rank") typeLabel = "RANKING";

  view.innerHTML = `
    <div class="question-category">${escapeHtml(q.category)} · ${typeLabel}</div>
    <h1>${escapeHtml(q.text)}</h1>
    ${q.type === "choice" ? renderChoices(q, saved) : (q.type === "rank" ? renderRank(q, saved) : renderEssay(q, saved))}
  `;

  if (q.type === "rank") {
    let draggedItem = null;
    const list = view.querySelector("#rank-list");
    list.querySelectorAll(".rank-item").forEach(item => {
      // Desktop Drag & Drop
      item.addEventListener("dragstart", function() {
        draggedItem = this;
        setTimeout(() => this.classList.add("dragging"), 0);
      });
      item.addEventListener("dragend", function() {
        draggedItem = null;
        this.classList.remove("dragging");
        const newOrder = Array.from(list.querySelectorAll(".rank-item")).map(el => el.dataset.item);
        answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: newOrder.join(" > ") }); saveProgress();
        updateNextState();
        render();
      });
      item.addEventListener("dragover", function(e) {
        e.preventDefault();
        if (this === draggedItem) return;
        const bounding = this.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) this.after(draggedItem);
        else this.before(draggedItem);
      });

      // Mobile Touch Support
      item.addEventListener("touchstart", function(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add("dragging"), 0);
      }, { passive: true });
      
      item.addEventListener("touchmove", function(e) {
        if (!draggedItem) return;
        e.preventDefault(); // Prevent scrolling while dragging
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target) {
          const rankItem = target.closest(".rank-item");
          if (rankItem && rankItem !== draggedItem) {
            const bounding = rankItem.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            if (touch.clientY - offset > 0) rankItem.after(draggedItem);
            else rankItem.before(draggedItem);
          }
        }
      }, { passive: false });

      item.addEventListener("touchend", function() {
        if (!draggedItem) return;
        draggedItem = null;
        this.classList.remove("dragging");
        const newOrder = Array.from(list.querySelectorAll(".rank-item")).map(el => el.dataset.item);
        answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: newOrder.join(" > ") }); saveProgress();
        updateNextState();
        render();
      });
    });
    if (!answers.has(q.id)) {
      answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: q.options.join(" > ") }); saveProgress();
    }
  }

  view.querySelectorAll("input[name=answer]").forEach(input => {
    input.addEventListener("change", () => {
      answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: input.value }); saveProgress();
      updateNextState();
      setTimeout(() => {
        if (!next.disabled) next.click();
      }, 350);
    });
  });

  const textarea = view.querySelector("textarea");
  if (textarea) {
    textarea.addEventListener("input", () => {
      answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: textarea.value }); saveProgress();
      updateNextState();
    });
  }

  updateNextState();
}

function renderChoices(q, saved) {
  return `
    <div class="options">
      ${q.options.map((option, index) => `
        <label class="option">
          <input type="radio" name="answer" value="${escapeAttr(option)}" ${saved?.answer === option ? "checked" : ""}>
          <span class="radio"></span>
          <span>${escapeHtml(option)}</span>
          <kbd>${index + 1}</kbd>
        </label>
      `).join("")}
    </div>
  `;
}

function renderRank(q, saved) {
  const items = saved?.answer ? saved.answer.split(" > ") : q.options;
  return `
    <div class="rank-list" id="rank-list">
      ${items.map((item, index) => `
        <div class="rank-item" draggable="true" data-item="${escapeAttr(item)}">
          <span class="rank-number">${index + 1}</span>
          <span class="rank-text">${escapeHtml(item)}</span>
          <span class="rank-drag">☰</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderEssay(q, saved) {
  return `
    <div class="essay-wrap">
      <textarea id="essay" maxlength="3000" placeholder="${escapeAttr(q.placeholder || "Explain what you actually think...")}">${escapeHtml(saved?.answer || "")}</textarea>
      <div class="essay-meta">
        <span id="char-warning">Minimum 20 characters required.</span>
        <span id="char-count">${(saved?.answer || "").length}/3000</span>
      </div>
    </div>
  `;
}

function updateNextState() {
  const q = selectedQuestions[current];
  const answer = answers.get(q.id)?.answer?.trim() || "";
  
  if (q.type === "essay") {
    const isLongEnough = answer.length >= 20;
    next.disabled = !isLongEnough;
    const warning = view.querySelector("#char-warning");
    if (warning) {
      warning.style.color = isLongEnough ? "var(--muted)" : "var(--accent)";
      warning.style.fontWeight = isLongEnough ? "500" : "700";
    }
  } else {
    next.disabled = !answers.has(q.id);
  }
  
  if (q.type === "choice") {
    next.style.display = "none";
  } else {
    next.style.display = "";
  }

  const count = view.querySelector("#char-count");
  const textarea = view.querySelector("textarea");
  if (count && textarea) count.textContent = `${textarea.value.length}/3000`;
}

next.addEventListener("click", () => {
  if (!answers.has(selectedQuestions[current].id)) return;
  trackProgress(selectedQuestions[current].id);

  if (current < selectedQuestions.length - 1) {
    current++; saveProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    const payload = selectedQuestions.map(q => answers.get(q.id));
    sessionStorage.setItem("wokeometerResponses", JSON.stringify(payload));
    localStorage.removeItem("wokeometer_progress"); window.location.href = "/results.html";
  }
});

back.addEventListener("click", () => {
  if (current === 0) return;
  current--; saveProgress();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("keydown", event => {
  if (current >= selectedQuestions.length) return;
  const q = selectedQuestions[current];

  if (q.type === "choice" && /^[1-7]$/.test(event.key)) {
    const option = q.options[Number(event.key) - 1];
    answers.set(q.id, { question: q.text, type: q.type, version: q.version, answer: option });
    render();
    setTimeout(() => {
      if (!next.disabled) next.click();
    }, 350);
  }

  if (event.key === "Enter" && !event.shiftKey && document.activeElement?.tagName !== "TEXTAREA") {
    if (!next.disabled) next.click();
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

render();
function trackProgress(qId) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId: qId })
  }).catch(()=>null);
}
