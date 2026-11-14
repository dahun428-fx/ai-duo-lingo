/* ---------- Duolingo-style practice ---------- */
const SKEY = "seq2seq30-stats";
function loadStats() { try { return Object.assign({ xp: 0, days: [], best: {}, spoke: {} }, JSON.parse(localStorage.getItem(SKEY) || "{}")); } catch (e) { return { xp: 0, days: [], best: {} }; } }
function saveStats(st) { try { localStorage.setItem(SKEY, JSON.stringify(st)); } catch (e) { } }
let STATS = loadStats();
// XP는 "기기마다 그 기기에서 번 XP"(xpBy)로 두고 총합을 쓴다. 두 기기가 따로 번 XP를 합칠 때 어느 쪽도 사라지지 않는다.
const KEY_RE = /^[a-z0-9]{8,32}$/;
function newDevKey() { const a = new Uint8Array(8); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256); return [...a].map(x => x.toString(16).padStart(2, "0")).join(""); }
function sumXp() { return Object.values(STATS.xpBy).reduce((a, b) => a + b, 0); }
(function normStats() {
  if (!KEY_RE.test(STATS.dev || "")) STATS.dev = newDevKey();
  if (!STATS.xpBy || typeof STATS.xpBy !== "object") STATS.xpBy = { [STATS.dev]: Math.max(0, Math.floor(STATS.xp) || 0) };
  STATS.spoke = STATS.spoke || {};
  STATS.xp = sumXp();
})();
function addXp(n) { STATS.xpBy[STATS.dev] = (STATS.xpBy[STATS.dev] || 0) + n; STATS.xp = sumXp(); }
function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function streak() {
  const set = new Set(STATS.days); const d = new Date();
  if (!set.has(ymd(d))) d.setDate(d.getDate() - 1);
  let n = 0; while (set.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
/* ---------- levels ---------- */
const LEVELS = [
  [0, "벡터 새싹"], [80, "행렬 견습생"], [180, "확률 탐험가"], [300, "베이즈 추리꾼"], [440, "소프트맥스 조율사"],
  [600, "엔트로피 측정가"], [780, "손실 사냥꾼"], [980, "경사 등반가"], [1200, "종 모양 수집가"], [1450, "Seq2Seq 번역가"]
];
function levelInfo(xp) {
  let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
  const cur = LEVELS[i][0], next = i + 1 < LEVELS.length ? LEVELS[i + 1][0] : null;
  return { level: i + 1, title: LEVELS[i][1], cur, next, into: xp - cur, span: next == null ? 0 : next - cur, pct: next == null ? 100 : Math.round((xp - cur) / (next - cur) * 100), max: next == null };
}
function levelBar(xp) {
  const L = levelInfo(xp);
  return h("div", { class: "lvl" },
    h("div", { class: "lvl-badge" }, "Lv." + L.level),
    h("div", { class: "lvl-main" }, h("b", {}, L.title),
      h("div", { class: "lvl-track" }, h("i", { style: `width:${L.pct}%` })),
      h("span", {}, L.max ? `최고 레벨 달성 · 누적 ${xp} XP` : `다음 레벨까지 ${L.next - xp} XP  (${L.into} / ${L.span})`)));
}
function updateChips() {
  const lEl = document.getElementById("lvl");
  if (lEl) { const L = levelInfo(STATS.xp); lEl.textContent = "Lv." + L.level + " " + L.title; }
  const sEl = document.getElementById("streak"), xEl = document.getElementById("xp");
  if (sEl) sEl.textContent = "연속 " + streak() + "일";
  if (xEl) xEl.textContent = STATS.xp + " XP";
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function bankFor(id) { return [...(QUICK[id] || []).map(q => ({ t: "mc", ...q })), ...(DRILL[id] || [])].map(q => ({ ...q, day: id })); }
function parseNum(s) {
  s = String(s).trim().replace(/[−–]/g, "-").replace(/,/g, "").replace(/\s/g, "");
  if (!s) return NaN;
  const f = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (f) return +f[1] / +f[2];
  return /^-?\d*\.?\d+(e-?\d+)?$/.test(s) ? parseFloat(s) : NaN;
}
const LV = { ox: 1, mc: 1, order: 2, num: 3 };
// 객관식 보기를 섞고 정답 번호를 다시 맞춘다
function prep(q) {
  if (q.t !== "mc") return { ...q };
  const idx = shuffle(q.o.map((_, i) => i));
  return { ...q, o: idx.map(i => q.o[i]), a: idx.indexOf(q.a) };
}
// 쉬운 문제 3개로 몸을 풀고, 뒤로 갈수록 어려워지되 같은 유형이 몰리지 않게 섞는다
function ordered(pool) {
  const lv = q => q.lv || LV[q.t] || 2;
  const s = shuffle(pool.slice()).sort((a, b) => lv(a) - lv(b));
  const warm = s.slice(0, 3), rest = s.slice(3).map(q => [lv(q) + Math.random() * 1.6, q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const out = warm.concat(rest);
  for (let i = 2; i < out.length - 1; i++) if (out[i].t === out[i - 1].t && out[i].t === out[i - 2].t) { const j = out.findIndex((q, k) => k > i && q.t !== out[i].t); if (j > 0) [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const TYPE_LABEL = { mc: "알맞은 답을 고르세요", num: "계산해서 답을 입력하세요", ox: "맞으면 O, 틀리면 X", order: "순서대로 탭해서 완성하세요" };
const praise = ["정답!", "좋아요!", "완벽해요!", "훌륭해요!", "바로 그거예요!"];

function renderPractice(id) {
  const root = document.getElementById("practice");
  const lessonId = id === "mix" ? null : id;
  let pool = id === "mix" ? ordered(shuffle(LESSONS.flatMap(p => bankFor(p.id))).slice(0, 12)) : ordered(bankFor(id));
  if (!pool.length) { location.hash = "home"; return; }
  // keep the same question type from repeating three times in a row
  const st = { queue: pool.map((q, i) => ({ ...prep(q), key: i })), total: pool.length, done: new Set(), missed: new Set(), hearts: 3, xp: 0, combo: 0, bestCombo: 0, hinted: new Set(), cheered: false, saved: false };
  let cur = null, answer = null, checked = false;
  const exitHref = lessonId ? "#" + lessonId : "#home";
  root.innerHTML = "";
  const bar = h("i", {}); const hearts = h("span", { class: "hearts", "aria-label": "남은 하트" });
  const head = h("div", { class: "pr-head" }, h("a", { class: "pr-x", href: exitHref, "aria-label": "연습 그만하기" }, "✕"), h("div", { class: "pr-bar" }, bar), hearts);
  const card = h("div", { class: "pr-card" });
  const foot = h("div", { class: "pr-foot" });
  root.append(head, card, foot);

  function drawHead() {
    bar.style.width = (st.done.size / st.total * 100) + "%";
    hearts.innerHTML = ""; for (let i = 0; i < 3; i++) hearts.append(h("span", { class: i < st.hearts ? "hf" : "he" }, "♥"));
  }
  function setFoot(state, title, msg, btnText, onBtn) {
    foot.className = "pr-foot " + state; foot.innerHTML = "";
    const left = h("div", { class: "pr-msg" }, title ? h("b", {}, title) : null, ...[].concat(msg || []).filter(Boolean).map(m => typeof m === "string" ? h("span", {}, m) : m));
    const b = h("button", { class: "pr-go", type: "button", id: "prgo" }, btnText);
    b.disabled = state === "idle" && answer == null;
    b.addEventListener("click", onBtn);
    foot.append(left, b);
  }
  function next() {
    checked = false; answer = null;
    if (st.hearts <= 0) return fail();
    if (!st.queue.length) return finish();
    cur = st.queue.shift();
    drawHead(); drawQ();
  }
  function ready(v) { answer = v; const b = document.getElementById("prgo"); if (b) b.disabled = v == null || v === ""; }
  function drawQ() {
    card.innerHTML = ""; card.classList.remove("pop-in"); void card.offsetWidth; card.classList.add("pop-in");
    const tag = h("div", { class: "pr-type" }, (st.missed.has(cur.key) ? "다시 도전 · " : "") + TYPE_LABEL[cur.t] + (id === "mix" ? "  ·  " + cur.day.replace("day", "Day ") : ""));
    card.append(tag, h("p", { class: "pr-q" }, cur.q));
    if (cur.t === "mc") {
      const box = h("div", { class: "pr-opts" });
      cur.o.forEach((o, i) => box.append(h("button", { class: "pr-opt", type: "button", "data-i": i, onclick: () => { if (checked) return; box.querySelectorAll(".pr-opt").forEach(b => b.classList.toggle("sel", +b.dataset.i === i)); ready(i); } }, h("kbd", {}, i + 1), o)));
      card.append(box);
    } else if (cur.t === "ox") {
      const box = h("div", { class: "pr-ox" });
      [[true, "O"], [false, "X"]].forEach(([v, t]) => box.append(h("button", { class: "pr-oxb", type: "button", "data-v": t, onclick: () => { if (checked) return; box.querySelectorAll(".pr-oxb").forEach(b => b.classList.toggle("sel", b.dataset.v === t)); ready(v); } }, t)));
      card.append(box);
    } else if (cur.t === "num") {
      const inp = h("input", { class: "pr-num", id: "prnum", type: "text", inputmode: "decimal", autocomplete: "off", placeholder: "숫자 입력 (예: 0.25, −1.4, 1/3)", "aria-label": "답" });
      inp.addEventListener("input", () => ready(isNaN(parseNum(inp.value)) ? null : parseNum(inp.value)));
      inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); document.getElementById("prgo")?.click(); } });
      card.append(inp, h("p", { class: "w-hint" }, cur.tol ? `±${cur.tol} 이내면 정답으로 처리합니다.` : "정확한 값을 입력하세요."));
      if (cur.h) {
        const hb = h("button", { class: "btn pr-hint", type: "button" }, "힌트 보기 (정답 시 +7 XP)");
        const show = () => hb.replaceWith(h("p", { class: "pr-hintbox" }, h("b", {}, "힌트  "), cur.h));
        hb.addEventListener("click", () => { st.hinted.add(cur.key); show(); inp.focus(); });
        card.append(hb); if (st.hinted.has(cur.key)) show();
      }
      setTimeout(() => inp.focus(), 50);
    } else if (cur.t === "order") {
      const picked = [];
      const ans = h("div", { class: "pr-ans" }), bank = h("div", { class: "pr-bank" });
      const all = shuffle([...cur.tokens, ...(cur.extra || [])].map((t, i) => ({ t, i })));
      const redraw = () => {
        ans.innerHTML = ""; bank.innerHTML = "";
        if (!picked.length) ans.append(h("span", { class: "w-hint" }, "아래 카드를 순서대로 탭하세요"));
        picked.forEach((tk, k) => ans.append(h("button", { class: "pr-tok", type: "button", onclick: () => { if (checked) return; picked.splice(k, 1); redraw(); } }, tk.t)));
        all.forEach(tk => { const used = picked.includes(tk); bank.append(h("button", { class: "pr-tok" + (used ? " used" : ""), type: "button", disabled: used ? "" : null, onclick: () => { if (checked || used) return; picked.push(tk); redraw(); } }, tk.t)); });
        ready(picked.length ? picked.map(x => x.t) : null);
      };
      redraw(); card.append(ans, bank);
    }
    setFoot("idle", "", "", "확인", check);
  }
  function correctText() {
    if (cur.t === "mc") return cur.o[cur.a];
    if (cur.t === "ox") return cur.a ? "O" : "X";
    if (cur.t === "num") return String(cur.a).replace("-", "−");
    return cur.tokens.join("  →  ");
  }
  function check() {
    if (checked || answer == null) return;
    checked = true;
    let ok;
    if (cur.t === "num") ok = Math.abs(answer - cur.a) <= (cur.tol || 1e-9);
    else if (cur.t === "order") ok = answer.length === cur.tokens.length && answer.every((t, i) => t === cur.tokens[i]);
    else ok = answer === cur.a;
    if (cur.t === "mc") card.querySelectorAll(".pr-opt").forEach(b => { const i = +b.dataset.i; if (i === cur.a) b.classList.add("right"); else if (i === answer) b.classList.add("wrong"); });
    if (cur.t === "ox") card.querySelectorAll(".pr-oxb").forEach(b => { const v = b.dataset.v === "O"; if (v === cur.a) b.classList.add("right"); else if (v === answer) b.classList.add("wrong"); });
    if (cur.t === "num") card.querySelector(".pr-num").classList.add(ok ? "right" : "wrong");
    if (cur.t === "order") card.querySelector(".pr-ans").classList.add(ok ? "right" : "wrong");
    if (ok) {
      const gain = st.missed.has(cur.key) ? 5 : st.hinted.has(cur.key) ? 7 : 10;
      st.xp += gain; st.combo++; st.bestCombo = Math.max(st.bestCombo, st.combo); st.done.add(cur.key);
      let extra = st.combo >= 3 ? `  · ${st.combo}연속` : "";
      if (st.combo % 3 === 0 && st.hearts < 3) { st.hearts++; extra += "  · 하트 회복 ♥"; }
      else if (!st.cheered && st.done.size * 2 >= st.total && st.done.size < st.total) { st.cheered = true; extra += "  · 절반 넘었어요"; }
      drawHead();
      setFoot("good", praise[Math.floor(Math.random() * praise.length)] + `  +${gain} XP` + extra, [cur.w, refLine(cur.day)], "계속", next);
    } else {
      const again = st.missed.has(cur.key);
      if (!again) st.hearts--;   // 다시 나온 문제는 틀려도 하트를 깎지 않는다
      st.combo = 0; st.missed.add(cur.key);
      st.queue.push(cur);
      drawHead();
      setFoot("bad", "정답: " + correctText(), [cur.w + (again ? "  한 번 더 나와요. 하트는 그대로예요." : "  이 문제는 뒤에서 다시 나와요."), refLine(cur.day)], st.hearts > 0 ? "계속" : "결과 보기", next);
    }
    setTimeout(() => document.getElementById("prgo")?.focus(), 30);
  }
  function bank() {
    if (st.saved) return; st.saved = true;
    const today = ymd(new Date());
    if (st.done.size && !STATS.days.includes(today)) STATS.days.push(today);
    addXp(st.xp); saveStats(STATS); updateChips(); queueSync();
  }
  function fail() {
    bank();
    card.innerHTML = ""; drawHead();
    card.append(h("div", { class: "pr-end" }, h("div", { class: "pr-big bad" }, "♥ 0"), h("h2", {}, "하트를 모두 썼어요"), h("p", {}, `${st.done.size} / ${st.total}문제까지 왔어요. 맞힌 만큼 +${st.xp} XP는 그대로 쌓였어요. 틀린 부분을 본문에서 한 번 더 보고 다시 도전해 보세요.`)));
    setFoot("idle end", "", "", "다시 도전", () => renderPractice(id));
    foot.prepend(h("a", { class: "btn", href: exitHref, style: "text-decoration:none" }, lessonId ? "본문 다시 보기" : "처음으로"));
    document.getElementById("prgo").disabled = false;
  }
  function finish() {
    drawHead();
    const acc = Math.round((st.total - st.missed.size) / st.total * 100);
    const before = levelInfo(STATS.xp);
    bank();
    const after = levelInfo(STATS.xp), leveled = after.level > before.level;
    if (lessonId) { STATS.best[lessonId] = Math.max(STATS.best[lessonId] || 0, acc); DONE.add(lessonId); saveDone(DONE); queueSync(); }
    saveStats(STATS); updateChips(); buildRail("practice-" + id);
    const nextL = lessonId ? byId[ORDER[ORDER.indexOf(lessonId) + 1]] : null;
    card.innerHTML = "";
    card.append(h("div", { class: "pr-end" },
      h("div", { class: "pr-big" + (leveled ? " lvup" : "") }, leveled ? "레벨 업!" : acc === 100 ? "완벽!" : "완료!"),
      leveled ? h("p", { class: "lvup-line" }, `Lv.${before.level} ${before.title}  →  `, h("b", {}, `Lv.${after.level} ${after.title}`)) : null,
      h("h2", {}, lessonId ? `「${chapterOf(lessonId).ch.name}」 연습을 끝냈어요` : "전체 복습을 끝냈어요"),
      lessonId ? h("p", { class: "pr-stars" }, starText(acc >= 100 ? 3 : acc >= 80 ? 2 : 1)) : null,
      h("div", { class: "readout", style: "width:100%" },
        h("div", { class: "ro big" }, h("small", {}, "얻은 XP"), h("b", {}, "+" + st.xp)),
        h("div", { class: "ro big" }, h("small", {}, "한 번에 맞힌 비율"), h("b", {}, acc + "%")),
        h("div", { class: "ro big" }, h("small", {}, "연속 학습"), h("b", {}, streak() + "일")),
        h("div", { class: "ro big" }, h("small", {}, "최고 연속 정답"), h("b", {}, st.bestCombo))),
      levelBar(STATS.xp),
      h("p", { class: "w-hint" }, acc < 70 ? "틀린 문제의 해설을 본문에서 다시 확인하고 한 번 더 풀면 기억에 오래 남아요." : "내일 같은 시간에 다음 레슨으로 연속 기록을 이어 가세요.")));
    setFoot("idle end", "", "", nextL && nextL.id !== "roadmap" ? "다음 챕터: " + chapterOf(nextL.id).ch.name : "학습 지도로", () => { location.hash = nextL && nextL.id !== "roadmap" ? nextL.id : "home"; });
    foot.prepend(h("button", { class: "btn", type: "button", onclick: () => renderPractice(id) }, "한 번 더"));
    document.getElementById("prgo").disabled = false;
  }
  root.onkeydown = null;
  next();
}
document.addEventListener("keydown", e => {
  const root = document.getElementById("practice");
  if (!root || root.hidden || e.target.closest("input,textarea")) return;
  if (/^[1-4]$/.test(e.key)) { root.querySelector(`.pr-opt[data-i="${+e.key - 1}"]`)?.click(); }
  if (e.key === "o" || e.key === "O") root.querySelector('.pr-oxb[data-v="O"]')?.click();
  if (e.key === "x" || e.key === "X") root.querySelector('.pr-oxb[data-v="X"]')?.click();
  if (e.key === "Enter" && !e.target.closest("button")) { const b = document.getElementById("prgo"); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
});
function practiceCard(id) {
  const best = STATS.best[id];
  return h("div", { class: "prcard" },
    h("div", {}, h("b", {}, "연습 문제 " + bankFor(id).length + "개로 실력 확인"), h("span", {}, "하트 3개 · 객관식, 계산, O/X, 순서 맞추기 · 틀린 문제는 다시 나와요" + (best != null ? ` · 최고 기록 ${best}%` : ""))),
    h("a", { class: "btn pri", href: "#practice-" + id, style: "text-decoration:none;white-space:nowrap" }, best != null ? "다시 연습" : "연습 시작"));
}

// 채점 화면에 붙는 근거 한 줄: 그날의 첫 번째 참고 자료
function refLine(day) {
  const r = (typeof REFS !== "undefined" && REFS[day] || [])[0];
  if (!r) return null;
  return h("span", { class: "pr-ref" }, "근거: ", h("a", { href: r.u, target: "_blank", rel: "noopener" }, r.t), r.w ? " · " + r.w : "");
}
