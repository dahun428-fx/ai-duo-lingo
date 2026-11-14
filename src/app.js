/* ---------- storage ---------- */
const KEY = "seq2seq30-done";
function loadDone() { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { return new Set(); } }
function saveDone(sd) { try { localStorage.setItem(KEY, JSON.stringify([...sd])); } catch (e) { } }
let DONE = loadDone();
const byIdAll = Object.fromEntries(PAGES.map(p => [p.id, p]));
// 학습 순서 = 로드맵(SUBJECTS) 순서. 챕터로 연결되지 않은 레슨은 뒤에 붙인다.
const LESSONS = [...new Set([...SUBJECTS.flatMap(s => s.chapters.filter(c => c.l && byIdAll[c.l]).map(c => c.l)), ...PAGES.filter(p => p.lesson).map(p => p.id)])].map(id => byIdAll[id]);
const COURSE = LESSONS.filter(p => p.id.startsWith("day"));
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
function chapterOf(id) {
  for (const sub of SUBJECTS) { const k = sub.chapters.findIndex(c => c.l === id); if (k >= 0) return { sub, k, ch: sub.chapters[k] }; }
  return null;
}
function stars(id) { const b = STATS.best[id]; return b == null ? 0 : b >= 100 ? 3 : b >= 80 ? 2 : 1; }
function starText(n) { return "★".repeat(n) + "☆".repeat(3 - n); }
function nextLesson() { return LESSONS.find(x => !DONE.has(x.id)) || LESSONS[0]; }
function buildRail(cur) {
  rail.innerHTML = "";
  const link = (id, dn, title, done, soon, extra) => h("a", { href: "#" + id, class: (id === cur || "practice-" + id === cur ? "on " : "") + (soon ? "soon" : "") }, h("span", { class: "dn" }, dn), h("span", {}, title, extra ? h("small", { class: "st" }, extra) : null), done != null ? h("span", { class: "ck" + (done ? " done" : "") }) : null);
  rail.append(h("h4", {}, "홈"), link("home", "⌂", "학습 지도"), link("practice-mix", "✦", "전체 복습 퀴즈"), link("course-seq2seq", "▤", "논문 코스: Seq2Seq"), link("speak", "◉", "면접에서 말해보기"), link("refs", "§", "참고 자료"), link("settings", "⚙", "앱 설치와 진도"), h("a", { href: "#", onclick: e => { e.preventDefault(); rail.classList.remove("open"); openGlossary(); } }, h("span", { class: "dn" }, "?"), h("span", {}, "용어 사전")));
  SUBJECTS.forEach(sub => {
    rail.append(h("h4", {}, sub.stage + " " + sub.name));
    if (!sub.chapters.some(c => c.l)) { rail.append(h("a", { class: "soon locked", "aria-disabled": "true" }, h("span", { class: "dn" }, "·"), h("span", {}, sub.chapters.length + "개 챕터", h("small", { class: "st" }, "준비 중")))); return; }
    sub.chapters.forEach((c, k) => {
      if (c.l) rail.append(link(c.l, String(k + 1), c.name, DONE.has(c.l), false, stars(c.l) ? starText(stars(c.l)) : null));
      else rail.append(h("a", { class: "soon locked", "aria-disabled": "true" }, h("span", { class: "dn" }, String(k + 1)), h("span", {}, c.soon, h("small", { class: "st" }, "준비 중"))));
    });
  });
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
  const co = chapterOf(p.id);
  h1.before(h("div", { class: "eyebrow" }, `${co ? co.sub.stage + " " + co.sub.name + " · 챕터 " + (co.k + 1) : "레슨"}${p.id.startsWith("day") ? " · Seq2Seq 코스 " + p.id.replace("day", "Day ") : ""} · 30분`));
  const meta = h1.nextElementSibling; if (meta && meta.tagName === "P") meta.classList.add("meta");
  if (HOOKS[p.id]) (meta || h1).after(h("div", { class: "hook" }, mascot("think", 64), h("div", { class: "hook-say" }, h("span", { class: "tag" }, "오늘의 장면"), h("p", {}, HOOKS[p.id]))));
  lessonEl.querySelector(".hook")?.after(practiceCard(p.id));
  const quizH = [...lessonEl.querySelectorAll("h2")].find(x => x.textContent.includes("셀프 체크"));
  const qq = quickQuiz(p.id); if (qq && quizH) quizH.before(qq);
  decorate(lessonEl);
  annotate(lessonEl);
  const i = ORDER.indexOf(p.id), prev = byId[ORDER[i - 1]], next = byId[ORDER[i + 1]];
  const db = h("button", { class: "donebtn", type: "button" });
  const sync = () => { const d = DONE.has(p.id); db.textContent = d ? "✓ 오늘 학습 완료 (다시 누르면 취소)" : "오늘 30분 학습 완료 체크"; db.classList.toggle("is-done", d); };
  db.addEventListener("click", () => { DONE.has(p.id) ? DONE.delete(p.id) : DONE.add(p.id); saveDone(DONE); sync(); buildRail(p.id); queueSync(); });
  sync();
  const rs = refSection(p.id); if (rs) lessonEl.append(rs);
  lessonEl.append(h("div", { class: "finish" }, practiceCard(p.id), speakCard(p.id), db, h("nav", { class: "pn", "aria-label": "이전 다음" },
    prev ? h("a", { href: "#" + prev.id }, h("small", {}, "이전"), prev.short) : h("span"),
    next ? h("a", { href: "#" + next.id, class: "next" }, h("small", {}, "다음"), next.short) : h("span"))));
  buildToc(lessonEl);
  stepify(p);
}
function renderHome() {
  lessonEl.innerHTML = "";
  const n = LESSONS.filter(x => DONE.has(x.id)).length, nextL = nextLesson();
  const totalStars = LESSONS.reduce((a, x) => a + stars(x.id), 0);
  lessonEl.append(
    h("div", { class: "hero" },
      h("div", { class: "eyebrow" }, "AI 학습 듀오링고"),
      h("h1", {}, "하루 30분, 문제로 익히는 ", h("em", {}, "AI 수학")),
      h("p", {}, "과목을 고르고 챕터를 하나씩 깨 보세요. 챕터마다 읽을거리, 직접 만져보는 실습, 연습 문제 10개가 있습니다. 문제를 풀면 XP가 쌓이고 레벨이 오릅니다."),
      h("div", { class: "btns" }, h("a", { class: "btn pri", href: "#" + nextL.id, style: "text-decoration:none" }, n ? "이어서 하기: " + chapterOf(nextL.id).ch.name : "첫 챕터 시작"), h("a", { class: "btn", href: "#practice-mix", style: "text-decoration:none" }, "전체 복습 퀴즈"), h("a", { class: "btn", href: "#speak", style: "text-decoration:none" }, "면접에서 말해보기"), h("a", { class: "btn", href: "#course-seq2seq", style: "text-decoration:none" }, "논문 코스로 보기"), h("button", { class: "btn", type: "button", onclick: openGlossary }, "용어 사전 (?)")),
      levelBar(STATS.xp),
      h("div", { class: "stats" }, h("div", {}, h("small", {}, "연속 학습"), h("b", {}, streak() + "일")), h("div", {}, h("small", {}, "누적 XP"), h("b", {}, STATS.xp)), h("div", {}, h("small", {}, "완료한 챕터"), h("b", {}, n + " / " + LESSONS.length)), h("div", {}, h("small", {}, "모은 별"), h("b", {}, totalStars + " / " + LESSONS.length * 3)))));
  const off = [0, 56, 96, 56];
  SUBJECTS.forEach((sub, si) => {
    const live = sub.chapters.filter(c => c.l), dn = live.filter(c => DONE.has(c.l)).length;
    const path = h("div", { class: "path" });
    sub.chapters.forEach((c, k) => {
      const st = c.l ? stars(c.l) : 0, isNext = c.l === nextL.id, done = c.l && DONE.has(c.l);
      const node = c.l
        ? h("a", { class: "node" + (done ? " done" : "") + (isNext ? " next" : ""), href: "#" + c.l, "aria-label": c.name }, isNext ? h("span", { class: "bubble" }, n ? "이어서" : "시작") : null, h("span", { class: "num" }, done ? "✓" : k + 1))
        : h("span", { class: "node locked", "aria-label": c.soon + " (준비 중)" }, h("span", { class: "num" }, k + 1));
      path.append(h("div", { class: "step", style: `--off:${off[k % 4]}px` }, node,
        h("div", { class: "step-txt" }, h("b", {}, c.l ? c.name : c.soon), h("span", {}, c.l ? (st ? starText(st) + "  최고 " + STATS.best[c.l] + "%" : done ? "읽음 · 연습 전" : "읽기 + 실습 + 문제 10개") : "준비 중"))));
    });
    lessonEl.append(h("section", { class: "unit u" + (si % 5) },
      h("div", { class: "unit-head" }, h("div", {}, h("small", {}, "과목 " + (si + 1)), h("h2", {}, sub.name), h("p", {}, sub.desc)),
        h("div", { class: "unit-prog" }, h("b", {}, dn + " / " + live.length), h("div", { class: "lvl-track" }, h("i", { style: `width:${live.length ? dn / live.length * 100 : 0}%` })))),
      path));
  });
  lessonEl.append(h("h2", {}, "논문 코스"), h("div", { class: "cards" }, h("a", { class: "card", href: "#course-seq2seq" }, h("small", {}, "10일 · 하루 30분"), h("b", {}, "Seq2Seq (Sutskever 외, 2014)"), h("span", {}, "위 챕터들을 논문 한 편을 읽는 순서로 따라갑니다. 논문 지도와 하루 루틴도 여기 있어요.")), h("a", { class: "card", href: "#roadmap" }, h("small", {}, "준비 중"), h("b", {}, "3~4주차: 모델 해부와 미니 구현"), h("span", {}, "LSTM 게이트, 입력 뒤집기, 빔 서치, BLEU, 숫자열 뒤집기 seq2seq"))));
  buildToc(lessonEl);
}
function renderCourse() {
  const p = byId.home;
  lessonEl.innerHTML = "";
  const n = COURSE.filter(x => DONE.has(x.id)).length;
  const nextL = COURSE.find(x => !DONE.has(x.id)) || COURSE[0];
  lessonEl.append(
    h("div", { class: "hero" },
      h("div", { class: "eyebrow" }, "논문 코스 · Sutskever · Vinyals · Le · NIPS 2014"),
      h("h1", {}, "논문 한 편으로 배우는 ", h("em", {}, "AI 수학")),
      h("p", {}, "\"Sequence to Sequence Learning with Neural Networks\"를 하루 30분씩 손으로 풀어 봅니다. 선형대수, 베이즈 정리, 엔트로피, 중심극한정리, teacher forcing이 모두 이 9쪽짜리 논문 안에 있습니다."),
      h("div", { class: "btns" }, h("a", { class: "btn pri", href: "#" + nextL.id, style: "text-decoration:none" }, n ? `이어서 하기: ${nextL.id.replace("day", "Day ")}` : "Day 01부터 시작"), h("a", { class: "btn", href: "https://arxiv.org/abs/1409.3215", target: "_blank", rel: "noopener", style: "text-decoration:none" }, "논문 원문 ↗"), h("a", { class: "btn", href: "#practice-mix", style: "text-decoration:none" }, "전체 복습 퀴즈"), h("button", { class: "btn", type: "button", onclick: openGlossary }, "용어 사전 (?)")),
 ),
    h("div", { class: "widget", "data-w": "papermap" }),
    h("h2", {}, "하루 30분 루틴"),
    h("div", { style: "overflow-x:auto" }, h("div", { class: "routine" },
      ...[["1분", "목표 확인", 1], ["8분", "개념 + 직관", 8], ["6분", "예제 따라 풀기", 6], ["10분", "손계산 + 코드 + 실습 위젯", 10], ["4분", "퀴즈", 4], ["1분", "한 줄 정리", 1]].map(([t, l, w]) => h("div", { style: `flex:${w + 1.2}` }, h("b", {}, t), l)))),
    h("h2", {}, "학습 경로"),
    h("div", { class: "cards" }, ...COURSE.map(x => h("a", { class: "card", href: "#" + x.id }, h("small", {}, x.id.replace("day", "DAY ") + (DONE.has(x.id) ? " · 완료" : " · 30분")), h("b", {}, x.short), h("span", {}, x.link))), h("a", { class: "card", href: "#roadmap" }, h("small", {}, "DAY 11–20 · 개요"), h("b", {}, "3~4주차: 모델 해부와 미니 구현"), h("span", {}, "LSTM 게이트, 입력 뒤집기, 빔 서치, BLEU, 숫자열 뒤집기 seq2seq 만들기"))),
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
function renderRefs() {
  lessonEl.innerHTML = "";
  lessonEl.append(h("div", { class: "eyebrow" }, "근거"), h("h1", {}, "참고 자료"),
    h("p", { class: "meta" }, "레슨의 설명, 숫자, 문제가 어디에서 왔는지 모아 둔 곳입니다. 논문에 없는 내용을 지어내지 않기 위해, 각 레슨은 여기 적힌 자료의 해당 부분만 다룹니다."),
    h("h2", {}, "학습 방식의 근거"), refList(METHOD_REFS));
  LESSONS.forEach(p => { if (REFS[p.id]) lessonEl.append(h("h2", {}, h("a", { href: "#" + p.id }, chapterOf(p.id) ? chapterOf(p.id).ch.name : p.short)), refList(REFS[p.id])); });
  buildToc(lessonEl);
}
function route() {
  REDRAW.length = 0; stopSpeak(); leaveSteps(); document.querySelector(".nsheet-wrap")?.remove();
  closePop(); document.querySelector(".modal")?.remove();
  let id = location.hash.slice(1);
  const prac = id.startsWith("practice-") && (id === "practice-mix" || (byId[id.slice(9)] && byId[id.slice(9)].lesson));
  document.querySelector(".page").hidden = !!prac; document.getElementById("practice").hidden = !prac; document.getElementById("fab").hidden = !!prac;
  document.body.classList.toggle("focus-practice", !!prac); drawTabs(id || "home");
  if (prac) { buildRail(id); rail.classList.remove("open"); window.scrollTo(0, 0); renderPractice(id.slice(9)); document.title = "연습 · AI 듀오링고"; return; }
  if (!byId[id] && id !== "course-seq2seq" && id !== "refs" && id !== "settings" && id !== "speak" && !(id.startsWith("speak-") && SPEAK[id.slice(6)])) id = "home";
  buildRail(id);
  if (id === "home") renderPath(); else if (id === "course-seq2seq") renderCourse(); else if (id === "roadmap") renderRoadmap(); else if (id === "refs") renderRefs(); else if (id === "settings") renderSettings(); else if (id === "speak") renderSpeakList(); else if (id.startsWith("speak-")) renderSpeak(id.slice(6)); else renderLesson(byId[id]);
  rail.classList.remove("open");
  window.scrollTo(0, 0);
  document.title = id === "home" ? "AI 듀오링고" : ((byId[id] ? byId[id].short : id === "refs" ? "참고 자료" : id === "settings" ? "설정" : id.startsWith("speak") ? "면접에서 말해보기" : "논문 코스: Seq2Seq") + " · AI 듀오링고");
}
window.addEventListener("hashchange", route);
document.getElementById("menu")?.addEventListener("click", () => rail.classList.toggle("open"));
const mq = matchMedia("(prefers-color-scheme: dark)");
const redrawAll = () => REDRAW.forEach(f => f());
mq.addEventListener?.("change", redrawAll);
new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
updateChips();
