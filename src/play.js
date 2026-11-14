/* ---------- 놀이 같은 화면: 아이콘, 캐릭터, 소리, 축하, 학습 길, 한 걸음씩 읽기 ---------- */
const ICONS = {
  home: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  flame: '<path d="M12 2.5c.6 3.4 4.8 5.3 4.8 10.2A4.9 4.9 0 0 1 12 17.8a4.9 4.9 0 0 1-4.8-5.1c0-1.8.7-3 1.7-4.1.3 1.3 1 2 1.8 2.300C10.3 8 10.8 5 12 2.500z" fill="currentColor" stroke="none"/><path d="M8.5 21h7" />',
  bolt: '<path d="M13.5 2.5 5 13.500h5.500L9.5 21.5 19 10h-5.500z" fill="currentColor" stroke="none"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.800-4.5 4.3 1.1 6.100L12 16.900l-5.4 2.9 1.1-6.100L3.2 9.400l6.1-.800z" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.500V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  play: '<path d="M8 5.500v13l11-6.500z" fill="currentColor" stroke="none"/>',
  check: '<path d="m5 12.5 4.5 4.500L19 7.5" stroke-width="3"/>',
  book: '<path d="M4.5 5.500A2.5 2.5 0 0 1 7 3h12.500v15H7a2.5 2.5 0 0 0-2.5 2.500zM4.5 20.500A2.5 2.5 0 0 0 7 21h12.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18" stroke-width="2.6"/>',
  heart: '<path d="M12 20.500s-7.5-4.6-7.5-10.200A4.3 4.3 0 0 1 12 7.700a4.3 4.3 0 0 1 7.5 2.600c0 5.6-7.5 10.2-7.5 10.200z" fill="currentColor" stroke="none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.5 12H21M5.6 5.600l1.8 1.800M16.6 16.600l1.8 1.800M5.6 18.400l1.8-1.800M16.6 7.400l1.8-1.8"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4.5a2.5 2.5 0 0 0 3 3.5M17 6h2.5a2.5 2.5 0 0 1-3 3.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="2" fill="currentColor" stroke="none"/><rect x="2.5" y="6.5" width="19" height="4" rx="1.5" fill="currentColor" stroke="none"/><path d="M12 6.5v14" stroke="var(--card)" stroke-width="2.4"/><path d="M12 6.5c-1.5-3.5-5.5-3.5-5-1 .3 1.3 3 1 5 1zm0 0c1.5-3.5 5.5-3.5 5-1-.3 1.3-3 1-5 1z"/>',
  cards: '<rect x="4" y="6" width="13" height="14" rx="2"/><path d="M8 3.500h10a2 2 0 0 1 2 2V17"/>'
};
function ico(name, cls) {
  const d = ICONS[name] || "";
  return h("span", { class: "ico" + (cls ? " " + cls : ""), "aria-hidden": "true", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>` });
}
// 캐릭터 "벡이": 화살표(벡터) 더듬이가 달린 동그란 친구. 표정: happy, cheer, sad, think
function mascot(mood, size) {
  const m = mood || "happy";
  const eyes = m === "sad" ? '<path d="M35 52q5-5 10 0M59 52q5-5 10 0" stroke="#1d2033" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    : m === "cheer" ? '<path d="M34 51q6-8 12 0M58 51q6-8 12 0" stroke="#1d2033" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
      : '<circle cx="40" cy="50" r="5" fill="#1d2033"/><circle cx="64" cy="50" r="5" fill="#1d2033"/><circle cx="41.5" cy="48.5" r="1.6" fill="#fff"/><circle cx="65.5" cy="48.5" r="1.6" fill="#fff"/>';
  const mouth = m === "sad" ? '<path d="M44 68q8-6 16 0" stroke="#1d2033" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    : m === "cheer" ? '<path d="M42 62h20a10 10 0 0 1-20 0z" fill="#1d2033"/><path d="M47 69a6 4 0 0 1 10 0z" fill="#ff8f86"/>'
      : m === "think" ? '<path d="M46 66h12" stroke="#1d2033" stroke-width="3.5" stroke-linecap="round"/>'
        : '<path d="M43 62q9 9 18 0" stroke="#1d2033" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  const arms = m === "cheer" ? '<path d="M17 52 7 36M87 52l10-16" stroke="var(--mc-d)" stroke-width="7" stroke-linecap="round"/>' : '<path d="M17 60 9 68M87 60l8 8" stroke="var(--mc-d)" stroke-width="7" stroke-linecap="round"/>';
  const svg = `<svg viewBox="0 0 104 104" width="${size || 96}" height="${size || 96}" role="img" aria-label="벡이">
    ${arms}
    <path d="M52 24V10" stroke="#ffb400" stroke-width="5" stroke-linecap="round"/><path d="M45 15l7-8 7 8" fill="none" stroke="#ffb400" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="16" y="26" width="72" height="66" rx="28" fill="var(--mc-d)"/>
    <rect x="16" y="22" width="72" height="64" rx="28" fill="var(--mc)"/>
    <ellipse cx="33" cy="60" rx="5" ry="3.5" fill="#ff9aa2" opacity=".7"/><ellipse cx="71" cy="60" rx="5" ry="3.5" fill="#ff9aa2" opacity=".7"/>
    ${eyes}${mouth}</svg>`;
  return h("span", { class: "mascot m-" + m, html: svg });
}
/* 소리: 짧은 효과음. 설정에서 끌 수 있다 */
let actx = null;
function soundOn() { try { return localStorage.getItem("aiduo-sound") !== "0"; } catch (_) { return true; } }
function sfx(kind) {
  if (!soundOn()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const seq = { ok: [[660, 0, .09], [880, .09, .14]], bad: [[220, 0, .16], [180, .14, .2]], done: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .22]], tap: [[520, 0, .04]] }[kind] || [];
    seq.forEach(([f, at, len]) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + at;
      o.type = kind === "bad" ? "triangle" : "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + len + 0.02);
    });
  } catch (_) { }
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = h("div", { class: "confetti", "aria-hidden": "true" });
  const colors = ["var(--accent)", "var(--sun)", "var(--good)", "var(--coral)", "var(--sky)"];
  for (let i = 0; i < 36; i++) box.append(h("i", { style: `left:${Math.random() * 100}%;background:${colors[i % 5]};animation-delay:${Math.random() * .35}s;animation-duration:${1.1 + Math.random() * .9}s;transform:rotate(${Math.random() * 360}deg)` }));
  document.body.append(box); setTimeout(() => box.remove(), 2400);
}
/* 오늘 번 XP와 하루 목표 */
const DAILY_GOAL = 30;
function todayXp() { const t = STATS.today; return t && t.d === ymd(new Date()) ? t.xp : 0; }
function goalRing() {
  const x = todayXp(), pct = Math.min(1, x / DAILY_GOAL), hit = pct >= 1;
  return h("a", { class: "quest" + (hit ? " hit" : ""), href: "#practice-mix", "aria-label": `오늘의 목표 ${x} / ${DAILY_GOAL} XP` },
    ico("bolt", "c-sun"),
    h("div", { class: "quest-main" }, h("b", {}, hit ? "오늘 목표 달성!" : `오늘 ${DAILY_GOAL} XP 모으기`),
      h("div", { class: "quest-bar" }, h("i", { style: `width:${pct * 100}%` }), h("span", {}, `${x} / ${DAILY_GOAL}`))),
    ico("gift", hit ? "c-sun" : "c-off"));
}
/* 위쪽 스탯, 아래 탭 */
function drawStats() {
  const set = (id, icon, text, label) => { const el = document.getElementById(id); if (!el) return; el.innerHTML = ""; el.append(ico(icon), h("b", {}, text)); el.setAttribute("aria-label", label); };
  const L = levelInfo(STATS.xp), s = streak();
  set("streak", "flame", String(s), `연속 학습 ${s}일`);
  set("xp", "bolt", String(STATS.xp), `누적 ${STATS.xp} XP`);
  set("lvl", "star", "Lv." + L.level, `레벨 ${L.level} ${L.title}`);
  document.getElementById("streak")?.classList.toggle("off", s === 0);
}
function drawTabs(cur) {
  const el = document.getElementById("tabs"); if (!el) return;
  const tab = cur.startsWith("speak") ? "speak" : cur === "practice-mix" ? "review" : ["settings", "refs", "course-seq2seq", "roadmap"].includes(cur) ? "more" : "home";
  const item = (key, icon, label, href, onclick) => h(href ? "a" : "button", { class: "tab" + (tab === key ? " on" : ""), href, type: href ? null : "button", onclick, "aria-current": tab === key ? "page" : null }, ico(icon), h("span", {}, label));
  el.innerHTML = "";
  el.append(item("home", "home", "학습", "#home"), item("review", "target", "복습", "#practice-mix"), item("speak", "mic", "말하기", "#speak"), item("more", "more", "더보기", null, () => rail.classList.toggle("open")));
  const bm = document.getElementById("brandmark"); if (bm && !bm.firstChild) bm.append(mascot("happy", 34));
}
/* 학습 길 (홈) */
const UNIT_COLORS = ["u-indigo", "u-mint", "u-sun", "u-coral", "u-sky"];
function nodeSheet(c, state) {
  document.querySelector(".nsheet-wrap")?.remove();
  const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  const best = STATS.best[c.l];
  const wrap = h("div", { class: "nsheet-wrap", onclick: e => { if (e.target === wrap) close(); } },
    h("div", { class: "nsheet", role: "dialog", "aria-modal": "true", "aria-label": c.name },
      h("button", { class: "nsheet-x", type: "button", "aria-label": "닫기", onclick: close }, ico("close")),
      h("small", {}, chapterOf(c.l).sub.name + " · 챕터 " + (chapterOf(c.l).k + 1)),
      h("h3", {}, c.name),
      h("p", {}, best != null ? `연습 최고 기록 ${best}%  ${starText(stars(c.l))}` : state === "done" ? "레슨을 읽었어요. 연습 문제로 별을 모아 보세요." : "읽을거리와 실습, 문제 10개가 있어요. 약 30분."),
      h("a", { class: "btn pri big", href: "#" + c.l, onclick: close }, ico("book"), state === "done" ? "레슨 다시 보기" : "레슨 시작  +5 XP"),
      h("a", { class: "btn big", href: "#practice-" + c.l, onclick: close }, ico("target"), "연습 문제  +10 XP씩"),
      SPEAK[c.l] ? h("a", { class: "btn big", href: "#speak-" + c.l, onclick: close }, ico("mic"), "면접에서 말해보기") : null));
  document.body.append(wrap); document.addEventListener("keydown", onKey);
  wrap.querySelector(".btn.pri").focus(); sfx("tap");
}
function renderPath() {
  lessonEl.innerHTML = ""; tocEl.innerHTML = "";
  const n = LESSONS.filter(x => DONE.has(x.id)).length, nextL = nextLesson(), s = streak(), L = levelInfo(STATS.xp);
  const all = n === LESSONS.length;
  const say = all ? "지금 열린 챕터를 모두 끝냈어요! 복습으로 별 세 개를 채워 볼까요?" : !n && !STATS.xp ? "안녕하세요, 저는 벡이예요. 첫 챕터부터 같이 가요!" : todayXp() >= DAILY_GOAL ? "오늘 목표 달성! 내일도 만나요." : s >= 2 ? `${s}일째 이어 가는 중이에요. 오늘도 한 챕터만!` : "오늘은 「" + chapterOf(nextL.id).ch.name + "」 차례예요.";
  lessonEl.append(
    h("section", { class: "greet" }, mascot(all || todayXp() >= DAILY_GOAL ? "cheer" : "happy", 80),
      h("div", { class: "say" }, h("p", {}, say), h("a", { class: "btn pri big", href: all ? "#practice-mix" : "#" + nextL.id }, ico("play"), all ? "전체 복습" : n ? "이어서 하기" : "시작하기"))),
    goalRing());
  const zig = [0, 46, 72, 46, 0, -46, -72, -46];
  let gi = 0;
  SUBJECTS.forEach((sub, si) => {
    const live = sub.chapters.filter(c => c.l), dn = live.filter(c => DONE.has(c.l)).length;
    if (!live.length) {
      // 아직 레슨이 없는 단계: 길 대신 무엇을 배우게 되는지만 짧게 보여 준다
      lessonEl.append(h("section", { class: "unit unit-later " + UNIT_COLORS[si % 5] },
        h("div", { class: "unit-head" }, h("div", {}, h("small", {}, sub.stage + " · 준비 중"), h("h2", {}, sub.name), h("p", {}, sub.desc)), ico("lock")),
        h("ul", { class: "later-list" }, ...sub.chapters.map(c => h("li", {}, c.soon)))));
      return;
    }
    const path = h("ol", { class: "path" });
    sub.chapters.forEach((c, k) => {
      const done = c.l && DONE.has(c.l), isNext = c.l === nextL.id && !all, st = c.l ? stars(c.l) : 0;
      const state = !c.l ? "locked" : done ? "done" : isNext ? "next" : "open";
      const node = c.l
        ? h("button", { class: "node " + state, type: "button", "aria-label": `${c.name}${done ? " (완료)" : isNext ? " (다음 차례)" : ""}`, onclick: () => nodeSheet(c, state) },
          isNext ? h("span", { class: "bubble" }, n ? "이어서" : "시작") : null, ico(done ? "check" : isNext ? "play" : "star"))
        : h("span", { class: "node locked", "aria-label": c.soon + " (준비 중)" }, ico("lock"));
      path.append(h("li", { class: "pstep", style: `--x:${zig[gi++ % zig.length]}px` }, node,
        h("span", { class: "plabel" }, c.l ? c.name : c.soon), st ? h("span", { class: "pstars", "aria-label": `별 ${st}개` }, starText(st)) : !c.l ? h("span", { class: "psoon" }, "준비 중") : null));
      // 길 옆에 벡이가 서서 응원한다 (과목마다 한 번, 길이 꺾이는 반대편)
      if (k === 1) path.lastChild.append(h("span", { class: "pbuddy", style: `--bx:${zig[(gi - 1) % zig.length] > 0 ? -130 : 130}px`, "aria-hidden": "true" }, mascot(si % 2 ? "think" : "happy", 64)));
    });
    const won = live.length && dn === live.length;
    path.append(h("li", { class: "pstep", style: `--x:${zig[gi++ % zig.length]}px` },
      h("span", { class: "node trophy" + (won ? " done" : " locked"), "aria-label": won ? sub.name + " 과목 완료 트로피" : sub.name + " 과목 트로피 (아직)" }, ico("trophy"))));
    lessonEl.append(h("section", { class: "unit " + UNIT_COLORS[si % 5] },
      h("div", { class: "unit-head" }, h("div", {}, h("small", {}, sub.stage), h("h2", {}, sub.name), h("p", {}, sub.desc)),
        h("div", { class: "unit-prog", "aria-label": `${live.length}개 중 ${dn}개 완료` }, h("b", {}, dn + " / " + live.length), h("div", { class: "lvl-track" }, h("i", { style: `width:${live.length ? dn / live.length * 100 : 0}%` })))),
      path));
  });
  lessonEl.append(h("section", { class: "extras" },
    h("a", { class: "card", href: "#course-seq2seq" }, h("small", {}, "논문 코스"), h("b", {}, "Seq2Seq (2014) 순서로 보기"), h("span", {}, "논문 지도와 하루 30분 루틴")),
    h("a", { class: "card", href: "#refs" }, h("small", {}, "근거"), h("b", {}, "참고 자료"), h("span", {}, "레슨이 기대는 논문과 교과서")),
    h("a", { class: "card", href: "#settings" }, h("small", {}, "설정"), h("b", {}, "앱 설치와 진도"), h("span", {}, "폰에 설치, 웹과 앱 진도 맞추기"))));
}
/* 레슨을 한 걸음씩 읽기 */
function readMode() { try { return localStorage.getItem("aiduo-read") === "all" ? "all" : "step"; } catch (_) { return "step"; } }
function setReadMode(m) { try { localStorage.setItem("aiduo-read", m); } catch (_) { } }
let stepKeys = null;
function leaveSteps() { document.body.classList.remove("focus-lesson"); if (stepKeys) { document.removeEventListener("keydown", stepKeys); stepKeys = null; } document.querySelector(".lfoot")?.remove(); }
function stepify(p) {
  leaveSteps();
  if (readMode() === "all") {
    lessonEl.prepend(h("button", { class: "btn modebtn", type: "button", onclick: () => { setReadMode("step"); route(); } }, "한 걸음씩 보기"));
    return;
  }
  const steps = []; let cur = h("section", { class: "lstep" });
  const tail = [];
  [...lessonEl.children].forEach(k => {
    if (k.classList.contains("finish") || k.classList.contains("refbox")) { tail.push(k); return; }
    if (k.tagName === "H2" && cur.childNodes.length) { steps.push(cur); cur = h("section", { class: "lstep" }); }
    cur.append(k);
  });
  if (cur.childNodes.length) steps.push(cur);
  const end = h("section", { class: "lstep lend" }, h("div", { class: "lend-top" }, mascot("cheer", 110), h("h2", {}, "레슨 끝!"), h("p", { id: "lendmsg" }, "읽기를 마쳤어요. 이제 문제로 확인하면 훨씬 오래 기억에 남아요.")), ...tail);
  steps.push(end);
  const bar = h("i", {}), count = h("span", { class: "lcount" });
  const top = h("div", { class: "lbar" }, h("a", { class: "lx", href: "#home", "aria-label": "레슨 닫기" }, ico("close")), h("div", { class: "pr-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(steps.length) }, bar), count,
    h("button", { class: "btn modebtn", type: "button", onclick: () => { setReadMode("all"); route(); } }, "전체 보기"));
  lessonEl.innerHTML = ""; lessonEl.append(top, ...steps);
  const prev = h("button", { class: "btn big", type: "button" }, "이전"), next = h("button", { class: "btn pri big", type: "button" }, "계속");
  const foot = h("div", { class: "lfoot" }, h("div", { class: "lfoot-in" }, prev, next));
  document.body.append(foot); document.body.classList.add("focus-lesson");
  const key = "aiduo-step-" + p.id;
  let i = 0; try { i = Math.min(steps.length - 1, Math.max(0, +sessionStorage.getItem(key) || 0)); } catch (_) { }
  if (i === steps.length - 1) i = 0;
  function show(k, quiet) {
    i = Math.max(0, Math.min(steps.length - 1, k));
    steps.forEach((s, j) => { s.hidden = j !== i; });
    bar.style.width = ((i + 1) / steps.length * 100) + "%"; count.textContent = `${i + 1} / ${steps.length}`;
    top.querySelector(".pr-bar").setAttribute("aria-valuenow", String(i + 1));
    prev.disabled = i === 0; next.hidden = i === steps.length - 1;
    try { sessionStorage.setItem(key, String(i)); } catch (_) { }
    REDRAW.forEach(f => f());
    if (!quiet) { window.scrollTo(0, 0); steps[i].classList.remove("slide"); void steps[i].offsetWidth; steps[i].classList.add("slide"); }
    if (i === steps.length - 1) {
      const first = !DONE.has(p.id);
      if (first) { DONE.add(p.id); saveDone(DONE); addXp(5); saveStats(STATS); updateChips(); buildRail(p.id); queueSync(); confetti(); sfx("done"); document.getElementById("lendmsg").textContent = "읽기 완료 +5 XP! 이제 문제로 확인하면 훨씬 오래 기억에 남아요."; }
      const db = end.querySelector(".donebtn"); if (db) db.hidden = true;
    }
  }
  prev.addEventListener("click", () => show(i - 1)); next.addEventListener("click", () => { sfx("tap"); show(i + 1); });
  stepKeys = e => {
    if (e.target.closest("input,textarea,select,button,a,summary,[contenteditable]") || document.querySelector(".modal,.nsheet-wrap")) return;
    if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); show(i + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
  };
  document.addEventListener("keydown", stepKeys);
  show(i, true);
}
