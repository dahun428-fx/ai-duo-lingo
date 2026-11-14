/* ---------- storage ---------- */
const KEY = "seq2seq30-done";
function loadDone() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); } }
function saveDone(sd) { try { localStorage.setItem(KEY, JSON.stringify([...sd])); } catch (e) { } }
let DONE = loadDone();
const LESSONS = PAGES.filter(p => p.id.startsWith("day"));
const ORDER = ["home", ...LESSONS.map(p => p.id), "roadmap"];
const byId = Object.fromEntries(PAGES.map(p => [p.id, p]));

/* ---------- markdown ---------- */
function renderMD(md) {
  const codes = [], maths = [];
  md = md.replace(/```[\s\S]*?```/g, m => { codes.push(m); return `KXCODE${codes.length - 1}KX`; });
  md = md.replace(/`[^`\n]+`/g, m => { codes.push(m); return `KXCODE${codes.length - 1}KX`; });
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => { maths.push([t, true]); return `KXMATH${maths.length - 1}KX`; });
  md = md.replace(/\$([^$\n]+?)\$/g, (m, t) => { maths.push([t, false]); return `KXMATH${maths.length - 1}KX`; });
  md = md.replace(/KXCODE(\d+)KX/g, (m, i) => codes[+i]);
  let html = window.marked ? marked.parse(md) : "<pre>" + md.replace(/</g, "&lt;") + "</pre>";
  html = html.replace(/KXMATH(\d+)KX/g, (m, i) => {
    const [t, disp] = maths[+i];
    if (!window.katex) return disp ? `<div class="calc">${t}</div>` : `<code>${t}</code>`;
    try { return katex.renderToString(t, { displayMode: disp, output: "mathml", throwOnError: false, strict: false }); } catch (e) { return `<code>${t}</code>`; }
  });
  return html;
}
function hlPy(code) {
  const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const re = /(#[^\n]*)|([fr]?"(?:[^"\\\n]|\\.)*"|[fr]?'(?:[^'\\\n]|\\.)*')|\b(\d+(?:_\d+)*(?:\.\d+)?(?:e-?\d+)?)\b|\b(import|from|as|def|return|for|in|if|elif|else|while|lambda|True|False|None|and|or|not|with|class|try|except|print|range|len|sum|zip|enumerate)\b/g;
  let out = "", last = 0, m;
  while ((m = re.exec(code))) {
    out += esc(code.slice(last, m.index));
    const cls = m[1] ? "co" : m[2] ? "st" : m[3] ? "nu" : "kw";
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + esc(code.slice(last));
}

/* ---------- rail + progress ---------- */
const rail = document.getElementById("rail");
function buildRail(cur) {
  rail.innerHTML = "";
  const link = (id, dn, title, done, soon) => h("a", { href: "#" + id, class: (id === cur || "practice-" + id === cur ? "on " : "") + (soon ? "soon" : "") }, h("span", { class: "dn" }, dn), h("span", {}, title), done != null ? h("span", { class: "ck" + (done ? " done" : "") }) : null);
  rail.append(h("h4", {}, "시작"), link("home", "00", "교재 소개와 논문 지도"), link("practice-mix", "✦", "전체 복습 퀴즈 (랜덤 12문제)"));
  rail.append(h("h4", {}, "1주차 · 논문을 읽기 위한 언어"));
  LESSONS.slice(0, 5).forEach(p => rail.append(link(p.id, p.id.slice(3), p.short, DONE.has(p.id))));
  rail.append(h("h4", {}, "2주차 · 모델은 어떻게 배우는가"));
  LESSONS.slice(5).forEach(p => rail.append(link(p.id, p.id.slice(3), p.short, DONE.has(p.id))));
  rail.append(h("h4", {}, "3~4주차 · 준비 중"), link("roadmap", "11+", "모델 해부와 미니 구현 (개요)", null, true));
  rail.append(h("h4", {}, "논문"), h("a", { href: "https://arxiv.org/abs/1409.3215", target: "_blank", rel: "noopener" }, h("span", { class: "dn" }, "↗"), h("span", {}, "원문 PDF (arXiv 1409.3215)")));
  const n = LESSONS.filter(p => DONE.has(p.id)).length;
  document.getElementById("progbar").style.width = (n / LESSONS.length * 100) + "%";
  document.getElementById("progtxt").textContent = `완료 ${n}/${LESSONS.length}`;
}

/* ---------- glossary ---------- */
let pop = null;
function closePop() { if (pop) { pop.remove(); pop = null; } }
function showPop(btnEl, g) {
  closePop();
  pop = h("div", { class: "pop", role: "tooltip" }, h("b", {}, g[0]), g[1], h("div", { style: "margin-top:6px;font-size:12px;opacity:.75" }, "처음 나오는 곳: " + g[2].replace("day", "Day ")));
  document.body.append(pop);
  const r = btnEl.getBoundingClientRect();
  const left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 16);
  pop.style.left = Math.max(16, left) + "px";
  pop.style.top = (window.scrollY + r.bottom + 6) + "px";
}
document.addEventListener("click", e => { if (pop && !e.target.closest(".term") && !e.target.closest(".pop")) closePop(); });
function annotate(root) {
  const terms = [...GLOSSARY].sort((a, b) => b[0].length - a[0].length);
  const used = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || p.closest("pre,code,a,h1,h2,h3,math,.widget,.quick,summary,.hook,.term,.meta,table th,.eyebrow,.finish")) return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const g of terms) {
    if (used.size > 14) break;
    for (const n of nodes) {
      if (!n.parentNode) continue;
      const txt = n.nodeValue, i = txt.toLowerCase().indexOf(g[0].toLowerCase());
      if (i < 0) continue;
      const after = n.splitText(i); const rest = after.splitText(g[0].length);
      const b = h("button", { class: "term", type: "button", "aria-label": g[0] + " 뜻 보기" }, after.nodeValue);
      b.addEventListener("click", e => { e.stopPropagation(); showPop(b, g); });
      after.replaceWith(b);
      nodes.push(rest);
      used.add(g[0]); break;
    }
  }
}
function openGlossary() {
  if (document.querySelector(".modal")) return;
  const list = h("div", { class: "gl" });
  const inp = h("input", { type: "search", id: "glq", placeholder: "용어 검색 (예: 엔트로피, softmax)", "aria-label": "용어 검색" });
  const fill = () => {
    const q = inp.value.trim().toLowerCase(); list.innerHTML = "";
    GLOSSARY.filter(g => !q || (g[0] + g[1]).toLowerCase().includes(q)).sort((a, b) => a[2].localeCompare(b[2])).forEach(g => list.append(h("div", {}, h("b", {}, g[0]), h("span", {}, g[1] + " "), h("a", { href: "#" + g[2], onclick: close }, g[2].replace("day", "Day ")))));
  };
  const modal = h("div", { class: "modal", onclick: e => { if (e.target === modal) close(); } },
    h("div", { class: "sheet", role: "dialog", "aria-label": "용어 사전" }, h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px" }, h("b", { style: "font-size:18px" }, "용어 사전"), h("button", { class: "iconbtn", type: "button", onclick: () => close() }, "닫기")), inp, list));
  function close() { modal.remove(); }
  inp.addEventListener("input", fill);
  document.body.append(modal); fill(); inp.focus();
}
document.getElementById("fab").addEventListener("click", openGlossary);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closePop(); document.querySelector(".modal")?.remove(); rail.classList.remove("open"); }
  if (e.key === "?" && !e.target.closest("input,textarea")) { e.preventDefault(); openGlossary(); }
});

/* ---------- quick quiz ---------- */
function quickQuiz(id) {
  const qs = QUICK[id]; if (!qs) return null;
  let right = 0, answered = 0;
  const score = h("div", { class: "score" }, `0 / ${qs.length}`);
  const box = h("section", { class: "quick" }, h("h3", {}, "빠른 확인"), h("p", { class: "sub" }, "보기를 누르면 바로 채점됩니다. 아래 셀프 체크 퀴즈 전에 몸풀기로 풀어 보세요."));
  qs.forEach(q => {
    const why = h("div", { class: "why", hidden: "" }, q.w);
    const opts = h("div", { class: "opts" });
    let done = false;
    q.o.forEach((o, i) => opts.append(h("button", { class: "opt", type: "button", onclick: e => {
      if (done) return; done = true; answered++;
      const ok = i === q.a; if (ok) right++;
      e.currentTarget.classList.add(ok ? "right" : "wrong");
      opts.children[q.a].classList.add("right");
      why.hidden = false; why.textContent = (ok ? "정답! " : "아쉬워요. ") + q.w;
      score.textContent = `${right} / ${qs.length}` + (answered === qs.length ? (right === qs.length ? "  · 완벽합니다" : "  · 틀린 문제는 본문에서 다시 확인해 보세요") : "");
    } }, o)));
    box.append(h("div", { class: "q" }, h("p", {}, q.q), opts, why));
  });
  box.append(score);
  return box;
}

/* ---------- pages ---------- */
const lessonEl = document.getElementById("lesson"), tocEl = document.getElementById("toc");
function decorate(root) {
  root.querySelectorAll("table").forEach(t => { const w = h("div", { class: "tablewrap" }); t.replaceWith(w); w.append(t); });
  root.querySelectorAll("pre > code").forEach(c => {
    const pre = c.parentElement, py = /language-python/.test(c.className), raw = c.textContent;
    if (py) c.innerHTML = hlPy(raw);
    const cb = h("button", { class: "copy", type: "button" }, "복사");
    cb.addEventListener("click", () => {
      const ok = () => { cb.textContent = "복사됨"; setTimeout(() => cb.textContent = "복사", 1400); };
      try { navigator.clipboard.writeText(raw).then(ok, () => selectText(c)); } catch (e) { selectText(c); }
    });
    pre.append(cb); if (py) pre.append(h("span", { class: "lang" }, "python"));
  });
  root.querySelectorAll(".widget[data-w]").forEach(el => { const f = W[el.dataset.w]; if (f) { try { f(el); } catch (e) { el.textContent = "위젯을 불러오지 못했습니다: " + e.message; } } });
}
function selectText(el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
function buildToc(root) {
  tocEl.innerHTML = ""; const hs = [...root.querySelectorAll("h2")];
  if (!hs.length) return;
  tocEl.append(h("b", {}, "이 문서에서"));
  hs.forEach((x, i) => { x.id = "s" + i; tocEl.append(h("a", { href: "#" + location.hash.slice(1), onclick: e => { e.preventDefault(); x.scrollIntoView({ behavior: "smooth", block: "start" }); } }, x.textContent.replace(/\s*\(\d+분\)/, ""))); });
}
function renderLesson(p) {
  lessonEl.innerHTML = renderMD(p.md);
  const h1 = lessonEl.querySelector("h1");
  const wk = LESSONS.indexOf(p) < 5 ? "1주차" : "2주차";
  h1.before(h("div", { class: "eyebrow" }, `${wk} · ${p.id.replace("day", "Day ")} · 하루 30분`));
  const meta = h1.nextElementSibling; if (meta && meta.tagName === "P") meta.classList.add("meta");
  if (HOOKS[p.id]) (meta || h1).after(h("div", { class: "hook" }, h("span", { class: "tag" }, "오늘의 장면"), h("p", {}, HOOKS[p.id])));
  lessonEl.querySelector(".hook")?.after(practiceCard(p.id));
  const quizH = [...lessonEl.querySelectorAll("h2")].find(x => x.textContent.includes("셀프 체크"));
  const qq = quickQuiz(p.id); if (qq && quizH) quizH.before(qq);
  decorate(lessonEl);
  annotate(lessonEl);
  const i = ORDER.indexOf(p.id), prev = byId[ORDER[i - 1]], next = byId[ORDER[i + 1]];
  const db = h("button", { class: "donebtn", type: "button" });
  const sync = () => { const d = DONE.has(p.id); db.textContent = d ? "✓ 오늘 학습 완료 (다시 누르면 취소)" : "오늘 30분 학습 완료 체크"; db.classList.toggle("is-done", d); };
  db.addEventListener("click", () => { DONE.has(p.id) ? DONE.delete(p.id) : DONE.add(p.id); saveDone(DONE); sync(); buildRail(p.id); });
  sync();
  lessonEl.append(h("div", { class: "finish" }, practiceCard(p.id), db, h("nav", { class: "pn", "aria-label": "이전 다음" },
    prev ? h("a", { href: "#" + prev.id }, h("small", {}, "이전"), prev.short) : h("span"),
    next ? h("a", { href: "#" + next.id, class: "next" }, h("small", {}, "다음"), next.short) : h("span"))));
  buildToc(lessonEl);
}
function renderHome() {
  const p = byId.home;
  lessonEl.innerHTML = "";
  const n = LESSONS.filter(x => DONE.has(x.id)).length;
  const nextL = LESSONS.find(x => !DONE.has(x.id)) || LESSONS[0];
  lessonEl.append(
    h("div", { class: "hero" },
      h("div", { class: "eyebrow" }, "Sutskever · Vinyals · Le  ·  NIPS 2014"),
      h("h1", {}, "논문 한 편으로 배우는 ", h("em", {}, "AI 수학")),
      h("p", {}, "\"Sequence to Sequence Learning with Neural Networks\"를 하루 30분씩 손으로 풀어 봅니다. 선형대수, 베이즈 정리, 엔트로피, 중심극한정리, teacher forcing이 모두 이 9쪽짜리 논문 안에 있습니다."),
      h("div", { class: "btns" }, h("a", { class: "btn pri", href: "#" + nextL.id, style: "text-decoration:none" }, n ? `이어서 하기: ${nextL.id.replace("day", "Day ")}` : "Day 01부터 시작"), h("a", { class: "btn", href: "https://arxiv.org/abs/1409.3215", target: "_blank", rel: "noopener", style: "text-decoration:none" }, "논문 원문 ↗"), h("a", { class: "btn", href: "#practice-mix", style: "text-decoration:none" }, "전체 복습 퀴즈"), h("button", { class: "btn", type: "button", onclick: openGlossary }, "용어 사전 (?)")),
      h("div", { class: "stats" }, h("div", {}, h("small", {}, "연속 학습"), h("b", {}, streak() + "일")), h("div", {}, h("small", {}, "누적 XP"), h("b", {}, STATS.xp)), h("div", {}, h("small", {}, "완료한 레슨"), h("b", {}, n + " / " + LESSONS.length)))),
    h("div", { class: "widget", "data-w": "papermap" }),
    h("h2", {}, "하루 30분 루틴"),
    h("div", { style: "overflow-x:auto" }, h("div", { class: "routine" },
      ...[["1분", "목표 확인", 1], ["8분", "개념 + 직관", 8], ["6분", "예제 따라 풀기", 6], ["10분", "손계산 + 코드 + 실습 위젯", 10], ["4분", "퀴즈", 4], ["1분", "한 줄 정리", 1]].map(([t, l, w]) => h("div", { style: `flex:${w + 1.2}` }, h("b", {}, t), l)))),
    h("h2", {}, "학습 경로"),
    h("div", { class: "cards" }, ...LESSONS.map(x => h("a", { class: "card", href: "#" + x.id }, h("small", {}, x.id.replace("day", "DAY ") + (DONE.has(x.id) ? " · 완료" : " · 30분")), h("b", {}, x.short), h("span", {}, x.link))), h("a", { class: "card", href: "#roadmap" }, h("small", {}, "DAY 11–20 · 개요"), h("b", {}, "3~4주차: 모델 해부와 미니 구현"), h("span", {}, "LSTM 게이트, 입력 뒤집기, 빔 서치, BLEU, 숫자열 뒤집기 seq2seq 만들기"))),
  );
  const rest = h("div", {}); rest.innerHTML = renderMD(p.md.replace(/^# .*\n/, "").replace(/## 3\. 전체 일정[\s\S]*?(?=## 4\.)/, ""));
  lessonEl.append(...rest.childNodes);
  decorate(lessonEl);
  annotate(lessonEl);
  buildToc(lessonEl);
}
function renderRoadmap() {
  lessonEl.innerHTML = renderMD(byId.roadmap.md);
  lessonEl.querySelector("h1")?.before(h("div", { class: "eyebrow" }, "3~4주차 · 개요"));
  decorate(lessonEl); annotate(lessonEl); buildToc(lessonEl);
  lessonEl.append(h("div", { class: "finish" }, h("nav", { class: "pn" }, h("a", { href: "#day10" }, h("small", {}, "이전"), byId.day10.short), h("a", { href: "#home", class: "next" }, h("small", {}, "처음으로"), "교재 소개"))));
}
function route() {
  REDRAW.length = 0;
  closePop(); document.querySelector(".modal")?.remove();
  let id = location.hash.slice(1);
  const prac = id.startsWith("practice-") && (id === "practice-mix" || (byId[id.slice(9)] && id.slice(9).startsWith("day")));
  document.querySelector(".page").hidden = !!prac; document.getElementById("practice").hidden = !prac; document.getElementById("fab").hidden = !!prac;
  if (prac) { buildRail(id); rail.classList.remove("open"); window.scrollTo(0, 0); renderPractice(id.slice(9)); document.title = "연습 · 손으로 푸는 Seq2Seq"; return; }
  if (!byId[id]) id = "home";
  buildRail(id);
  if (id === "home") renderHome(); else if (id === "roadmap") renderRoadmap(); else renderLesson(byId[id]);
  rail.classList.remove("open");
  window.scrollTo(0, 0);
  document.title = id === "home" ? "손으로 푸는 Seq2Seq" : (byId[id].short + " · 손으로 푸는 Seq2Seq");
}
window.addEventListener("hashchange", route);
document.getElementById("menu").addEventListener("click", () => rail.classList.toggle("open"));
const mq = matchMedia("(prefers-color-scheme: dark)");
const redrawAll = () => REDRAW.forEach(f => f());
mq.addEventListener?.("change", redrawAll);
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
updateChips();
route();
