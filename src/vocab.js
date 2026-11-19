/* ---------- 단어장: 용어 사전(GLOSSARY) 카드 + Leitner 5상자 간격 반복 ---------- */
// 카드 = [용어, 뜻, 챕터id]. 그 챕터를 완료(DONE)해야 열린다.
// 상자 1→1일, 2→2일, 3→4일, 4→8일, 5→16일 뒤 복습. 5에서 맞히면 졸업(상자 6), 30일 뒤 한 번 점검하고 끝.
// 틀리면 상자 1로(상자 4·5·졸업에서 틀리면 상자 2로). 힌트를 보고 맞히면 맞음이지만 상자는 그대로.
const VKEY = "seq2seq30-vocab";
const VBOX_DAYS = [0, 1, 2, 4, 8, 16], VGRAD_DAYS = 30;
const VREV_CAP = 20, VNEW_CAP = 5, VNEW_GATE = 15, VLEECH = 4;
function loadVocab() {
  try { const v = JSON.parse(localStorage.getItem(VKEY) || "null"); if (v && typeof v === "object" && v.cards && typeof v.cards === "object") return { v: 1, cards: v.cards, day: v.day || null, dayd: v.dayd || null }; } catch (e) { }
  return { v: 1, cards: {}, day: null, dayd: null };
}
function saveVocab() { try { localStorage.setItem(VKEY, JSON.stringify(VOCAB)); } catch (e) { } }
let VOCAB = loadVocab();
const VCARDS = (() => {
  const seen = new Set(), out = [];
  (typeof GLOSSARY !== "undefined" ? GLOSSARY : []).forEach(g => {
    if (!Array.isArray(g) || !g[0] || !g[1] || !g[2]) return;
    const id = g[0] + "@" + g[2]; if (seen.has(id)) return; seen.add(id);
    out.push({ id, term: g[0], mean: g[1], ch: g[2] });
  });
  return out;
})();
const VBY = Object.fromEntries(VCARDS.map(c => [c.id, c]));
// AI 사전 퀴즈 카드(위키독스 사전 표제어). 챕터와 상관없이 처음부터 전부 열려 있다.
const VDICT = (typeof DICT !== "undefined" ? DICT : []).map(([term, mean, pg]) => ({ id: "dict:" + term, term, mean, ch: "dict", url: "https://wikidocs.net/" + pg }));
const VDICT_NEW = 10, VMORE_N = 10;
let VDECK = "mine", VMORE = false;   // 지금 보는 덱("mine" 내 단어장 | "dict" AI 사전), 더 풀기 모드
const vHome = () => VDECK === "dict" ? "#vocab-dict" : "#vocab";
const vPool = () => VDECK === "dict" ? VDICT : VCARDS;
let VORD = null;
function vOrd(ch) { if (!VORD) VORD = Object.fromEntries(LESSONS.map((p, i) => [p.id, i])); return ch in VORD ? VORD[ch] : 999; }
function vToday() { return ymd(new Date()); }
function vAdd(d, n) { const [y, m, dd] = d.split("-").map(Number); return ymd(new Date(y, m - 1, dd + n)); }
function vDiff(a, b) { const p = s => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(a) - p(b)) / 864e5); }
function vDay(deck = VDECK) { const d = vToday(), k = deck === "dict" ? "dayd" : "day"; if (!VOCAB[k] || VOCAB[k].d !== d) VOCAB[k] = { d, rev: 0, nw: 0 }; return VOCAB[k]; }
function vState(c) { return VOCAB.cards[c.id] || null; }
function vChName(ch) { if (ch === "dict") return "위키독스 AI 사전"; const co = chapterOf(ch); return co ? co.ch.name : byId[ch] ? byId[ch].short : ch; }
function vUnlocked(deck = VDECK) { return deck === "dict" ? VDICT : VCARDS.filter(c => DONE.has(c.ch)); }
// 오늘 할 일: 복습은 상한 20장(낮은 상자 → 오래 밀린 순), 새 카드는 오늘 예정 복습이 15장 이하일 때만 최대 5장
function vPlan(deck = VDECK) {
  const today = vToday(), dc = vDay(deck), open = vUnlocked(deck), cap = deck === "dict" ? VDICT_NEW : VNEW_CAP;
  const due = open.filter(c => { const s = vState(c); return s && s.due && s.due <= today; })
    .sort((a, b) => vState(a).b - vState(b).b || vState(a).due.localeCompare(vState(b).due) || vOrd(a.ch) - vOrd(b.ch));
  const reviews = due.slice(0, Math.max(0, VREV_CAP - dc.rev));
  const fresh = open.filter(c => !vState(c)).sort((a, b) => vOrd(a.ch) - vOrd(b.ch));
  const newOk = due.length + dc.rev <= VNEW_GATE;
  let news = newOk ? fresh.slice(0, Math.max(0, cap - dc.nw)) : [], more = false;
  // AI 사전 "더 풀기": 하루 한도와 상관없이 10장 더. 안 본 카드부터, 다 봤으면 아무 카드나
  if (deck === "dict" && VMORE) {
    more = true;
    const fr = shuffle(fresh.slice());
    news = fr.slice(0, VMORE_N);
    const extra = shuffle(open.filter(c => vState(c) && !reviews.includes(c))).slice(0, VMORE_N - news.length);
    return { open, due, reviews: extra, fresh, news, newOk, total: extra.length + news.length, dc, cap, more };
  }
  return { open, due, reviews, fresh, news, newOk, total: reviews.length + news.length, dc, cap, more };
}
function vTodayCount() { try { return vPlan("mine").total; } catch (e) { return 0; } }
function vBoxOf(c) { const s = vState(c); return s ? s.b : 0; }
function vNextDue() {
  const today = vToday(); let best = null, n = 0;
  vUnlocked().forEach(c => { const s = vState(c); if (!s || !s.due || s.due <= today) return; if (!best || s.due < best) { best = s.due; n = 1; } else if (s.due === best) n++; });
  return best ? { d: best, n } : null;
}
function vWhen(d) { const k = vDiff(d, vToday()); return k <= 0 ? "오늘" : k === 1 ? "내일" : k + "일 뒤"; }

/* 채점: 상자 옮기기. 결과를 바로 저장한다(세션 중간에 나가도 남는다) */
function vGrade(c, ok, hinted) {
  const today = vToday(), dc = vDay(), s = vState(c), isNew = !s;
  const from = isNew ? 0 : s.b, st = s ? { ...s } : { b: 1, n: 0, w: 0 };
  if (isNew) { dc.nw++; st.b = 1; st.due = vAdd(today, 1); if (!ok) st.w++; }
  else {
    dc.rev++;
    if (ok && !hinted) { if (from >= 6) st.due = ""; else { st.b = from + 1; st.due = vAdd(today, st.b >= 6 ? VGRAD_DAYS : VBOX_DAYS[st.b]); } }
    else if (ok) st.due = vAdd(today, from >= 6 ? VGRAD_DAYS : VBOX_DAYS[from]);
    else { st.w++; st.b = from >= 4 ? 2 : 1; st.due = vAdd(today, VBOX_DAYS[st.b]); }
  }
  st.n = (st.n || 0) + 1; st.t = Date.now();
  VOCAB.cards[c.id] = st; saveVocab();
  return { from, to: st.b, due: st.due, leech: st.w >= VLEECH, retired: st.b >= 6 && !st.due };
}
// 진도 코드로 합치기: 카드마다 더 최근에 복습한 기록(t)을 남긴다
function vSnapshot() { return { v: 1, cards: VOCAB.cards }; }
function mergeVocab(p) {
  if (!p || typeof p.cards !== "object" || !p.cards) return;
  const DAY = /^\d{4}-\d{2}-\d{2}$/;
  for (const id in p.cards) {
    const r = p.cards[id]; if (!r || typeof r !== "object" || id.length > 200) continue;
    const t = +r.t, b = Math.floor(+r.b);
    if (!Number.isFinite(t) || !(b >= 1 && b <= 6) || !(r.due === "" || DAY.test(r.due))) continue;
    const mine = VOCAB.cards[id];
    if (!mine || !(mine.t >= t)) VOCAB.cards[id] = { b, due: r.due, t, n: Math.max(0, Math.floor(+r.n) || 0), w: Math.max(0, Math.floor(+r.w) || 0) };
  }
  saveVocab();
}

/* 문제 재료 */
function vNorm(s) { return String(s).normalize("NFKC").toLowerCase().replace(/[\s·・\-_'"’‘“”.,()\[\]{}\/~]/g, ""); }
const vHangul = s => /[가-힣]/.test(s);
function vAliasesRaw(term) {
  const set = new Set([term]);
  const m = term.match(/^(.*?)\s*\((.*)\)\s*$/); if (m) { set.add(m[1]); set.add(m[2]); }
  term.split(/\s*[\/,]\s*/).forEach(p => p && set.add(p));
  const w = term.split(/\s+/); if (w.length === 2 && vHangul(w[0]) !== vHangul(w[1])) w.forEach(p => set.add(p));
  return [...set].map(x => x.trim()).filter(Boolean);
}
function vLev(a, b) {
  const A = [...a], B = [...b]; let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) { const cur = [i]; for (let j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)); prev = cur; }
  return prev[B.length];
}
// 직접 떠올리기 채점: 띄어쓰기·기호·대소문자는 무시, 긴 말은 오타 한두 글자까지 봐준다
function vTypedOk(input, term) {
  const x = vNorm(input); if (!x) return false;
  return vAliasesRaw(term).map(vNorm).filter(Boolean).some(a => { if (a === x) return true; const n = [...a].length, tol = n >= 8 ? 2 : n >= 4 ? 1 : 0; return tol > 0 && vLev(a, x) <= tol; });
}
function vChosung(t) {
  const C = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"; let first = true;
  return [...t].map(ch => {
    const c = ch.charCodeAt(0);
    if (c >= 0xAC00 && c <= 0xD7A3) { first = true; return C[Math.floor((c - 0xAC00) / 588)]; }
    if (/[A-Za-z]/.test(ch)) { const r = first ? ch : "_"; first = false; return r; }
    first = true; return ch;
  }).join("");
}
function vEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
// 뜻 안에 용어가 그대로 들어 있으면 가린다
function vMask(mean, term) {
  let out = mean;
  vAliasesRaw(term).filter(a => [...a].length >= 2 || /[^\x00-\x7f]/.test(a)).sort((a, b) => b.length - a.length)
    .forEach(a => { out = out.replace(new RegExp(vEsc(a), "gi"), "＿＿"); });
  return out;
}
// 오답 보기: 같은 챕터 → 가까운 챕터의 다른 용어
function vNear(c, n, key) {
  const o = vOrd(c.ch), seen = new Set([c[key]]), out = [];
  const pool = vPool().filter(x => x.id !== c.id && x.term !== c.term && x.mean !== c.mean)
    .map(x => [(x.ch === c.ch ? -1 : Math.abs(vOrd(x.ch) - o)) + Math.random() * 1.5, x]).sort((a, b) => a[0] - b[0]);
  for (const [, x] of pool) { if (seen.has(x[key])) continue; seen.add(x[key]); out.push(x); if (out.length >= n) break; }
  return out;
}
function vBack(c, extra) {
  return h("div", { class: "vback" }, h("b", {}, c.term), h("span", {}, c.mean),
    h("span", { class: "vfrom" }, ...vSrc(c)), extra || null);
}
function vSrc(c) {
  return c.url ? ["출처: ", h("a", { href: c.url, target: "_blank", rel: "noopener" }, "위키독스 AI 사전 ↗")] : ["배운 곳: ", h("a", { href: "#" + c.ch }, vChName(c.ch))];
}
function vBoxLabel(b) { return b >= 6 ? "졸업" : b ? "상자 " + b : "새 카드"; }

/* ---------- 단어장 홈 (#vocab) ---------- */
function vShelf() {
  const open = vUnlocked(), cnt = [0, 0, 0, 0, 0, 0, 0];
  open.forEach(c => cnt[vBoxOf(c)]++);
  const lab = ["", "매일", "2일마다", "4일마다", "8일마다", "16일마다", "다 외웠어요"];
  const shelf = h("div", { class: "vshelf", role: "list", "aria-label": "상자별 카드 수" });
  for (let b = 1; b <= 6; b++) {
    const stack = h("div", { class: "vstack", "aria-hidden": "true" });
    for (let k = 0; k < Math.min(cnt[b], 6); k++) stack.append(h("i", { style: `--k:${k}` }));
    shelf.append(h("div", { class: "vbox vb" + b + (cnt[b] ? "" : " empty"), role: "listitem", "aria-label": `${vBoxLabel(b)} ${cnt[b]}장` },
      stack, h("div", { class: "vbox-front" }, h("b", {}, cnt[b])), h("small", {}, b >= 6 ? "졸업" : "상자 " + b), h("span", {}, lab[b])));
  }
  return h("div", { class: "vshelf-wrap" }, shelf, cnt[0] ? h("p", { class: "w-hint" }, `아직 한 번도 안 본 새 카드 ${cnt[0]}장이 대기 중이에요.`) : null);
}
function vTabs() {
  const t = (deck, href, label) => h("a", { class: "vtab" + (VDECK === deck ? " on" : ""), href, role: "tab", "aria-selected": String(VDECK === deck) }, label);
  return h("div", { class: "vtabs", role: "tablist" }, t("mine", "#vocab", "내 단어장"), t("dict", "#vocab-dict", "AI 사전 퀴즈"));
}
function renderVocab() {
  lessonEl.innerHTML = ""; tocEl.innerHTML = "";
  const dict = VDECK === "dict";
  const p = vPlan(), open = p.open, locked = vPool().length - open.length;
  lessonEl.append(h("div", { class: "eyebrow" }, dict ? "단어장 · 위키독스 AI 사전" : "단어장 · 간격 반복"), h("h1", {}, dict ? "AI 사전 퀴즈" : "단어장"), vTabs());
  if (dict) lessonEl.append(h("p", { class: "w-hint" }, "위키독스 『인공지능(AI) & 머신러닝(ML) 사전』의 표제어 ", VDICT.length + "개로 만든 퀴즈예요. 챕터를 안 끝내도 전부 열려 있어요. 뜻풀이는 이 앱이 쉽게 다시 쓴 것이고, 카드마다 사전 원문 링크가 있어요. ",
    h("a", { href: "https://wikidocs.net/book/5942", target: "_blank", rel: "noopener" }, "사전 보기 ↗")));
  if (!open.length) {
    const nl = nextLesson();
    lessonEl.append(h("section", { class: "greet vempty" }, mascot("think", 80),
      h("div", { class: "say" }, h("p", {}, "첫 챕터를 끝내면 카드가 생겨요."),
        h("span", { class: "w-hint" }, `챕터에서 배운 용어가 카드가 되어 여기 쌓여요. 지금 잠긴 카드 ${locked}장.`),
        h("a", { class: "btn pri big", href: "#" + nl.id }, ico("play"), "「" + vChName(nl.id) + "」 시작"))));
    lessonEl.append(vHow());
    return;
  }
  const nd = vNextDue();
  const moreBtn = dict ? h("a", { class: "btn big", href: "#vocab-dict-play-more" }, ico("bolt"), `${VMORE_N}장 더 풀기`) : null;
  const say = p.total ? `오늘 복습 ${p.reviews.length}장${p.news.length ? `, 새 카드 ${p.news.length}장` : ""}이 기다려요. 5분이면 끝나요!`
    : `오늘 카드를 다 했어요!${nd ? ` 다음 복습은 ${vWhen(nd.d)} ${nd.n}장이에요.` : ""}`;
  lessonEl.append(h("section", { class: "greet" }, mascot(p.total ? "happy" : "cheer", 80),
    h("div", { class: "say" }, h("p", {}, say),
      p.total ? h("a", { class: "btn pri big", href: dict ? "#vocab-dict-play" : "#vocab-play", id: "vgo" }, ico("play"), `시작하기 · ${p.total}장`) : dict ? null : h("a", { class: "btn big", href: "#home" }, ico("home"), "학습 지도로"), moreBtn)));
  lessonEl.append(h("div", { class: "vtoday" },
    h("div", { class: "mini" }, ico("target", "c-flame"), h("div", {}, h("small", {}, "오늘 복습"), h("b", {}, p.reviews.length + "장"))),
    h("div", { class: "mini" }, ico("gift", "c-sun"), h("div", {}, h("small", {}, "새 카드"), h("b", {}, p.news.length + "장")))));
  const notes = [];
  if (p.due.length > p.reviews.length) notes.push(`밀린 복습이 ${p.due.length}장이라 오늘은 낮은 상자부터 ${p.reviews.length}장만 해요. 나머지는 내일로 넘어가도 상자는 내려가지 않아요.`);
  if (!p.newOk && p.fresh.length) notes.push(`복습할 카드가 15장보다 많아서 오늘은 새 카드를 쉬어요. 복습이 줄면 새 카드가 다시 들어와요.`);
  else if (p.newOk && p.fresh.length > p.news.length && p.dc.nw >= p.cap) notes.push(`새 카드는 하루 ${p.cap}장까지예요. 남은 ${p.fresh.length}장은 내일부터 들어와요.${dict ? " 더 하고 싶으면 「더 풀기」를 누르세요." : ""}`);
  notes.forEach(t => lessonEl.append(h("p", { class: "vnote" }, t)));
  lessonEl.append(h("h2", {}, "내 카드 진열장"), vShelf());
  const leeches = open.filter(c => (vState(c) || {}).w >= VLEECH);
  if (leeches.length) lessonEl.append(h("h2", {}, "어려운 카드"), h("p", { class: "w-hint" }, "네 번 이상 틀린 카드예요. 배운 챕터를 1분만 다시 훑어보면 훨씬 쉬워져요."),
    h("div", { class: "vlist" }, ...leeches.map(c => vRow(c))));
  const inp = h("input", { type: "search", class: "vsearch", placeholder: dict ? "카드 검색 (예: 드롭아웃, 새 카드)" : "열린 카드 검색 (예: 엔트로피, 상자 3)", "aria-label": "카드 검색" });
  const list = h("div", { class: "vlist" });
  const fill = () => {
    const q = inp.value.trim().toLowerCase(); list.innerHTML = "";
    const rows = open.filter(c => !q || (c.term + " " + c.mean + " " + vChName(c.ch) + " " + vBoxLabel(vBoxOf(c))).toLowerCase().includes(q))
      .sort((a, b) => dict ? a.term.localeCompare(b.term, "ko") : vOrd(a.ch) - vOrd(b.ch));
    rows.forEach(c => list.append(vRow(c)));
    if (!rows.length) list.append(h("p", { class: "w-hint" }, "찾는 카드가 없어요."));
  };
  inp.addEventListener("input", fill); fill();
  lessonEl.append(h("h2", {}, dict ? `전체 카드 ${open.length}장` : `열린 카드 ${open.length}장`), locked ? h("p", { class: "w-hint" }, `잠긴 카드 ${locked}장은 챕터를 끝내면 열려요.`) : null, inp, list, vHow());
}
function vRow(c) {
  const s = vState(c), b = s ? s.b : 0, leech = s && s.w >= VLEECH;
  const when = !s ? "새 카드" : !s.due ? "졸업 완료" : "다음 복습 " + vWhen(s.due);
  return h("div", { class: "vrow" + (leech ? " leech" : "") },
    h("span", { class: "vchip vb" + b }, vBoxLabel(b)),
    h("div", { class: "vrow-main" }, h("b", {}, c.term, leech ? h("span", { class: "vleech" }, "어려운 카드") : null), h("span", {}, c.mean),
      h("small", {}, when, " · ", ...vSrc(c))));
}
function vHow() {
  return h("details", { class: "vhow" }, h("summary", {}, "단어장은 어떻게 돌아가나요?"),
    h("p", {}, "챕터를 끝내면 그 챕터의 용어가 카드로 열려요. 카드는 상자 5개를 차례로 올라가요. 맞히면 한 칸 위로, 틀리면 상자 1로 돌아가요(상자 4·5에서 틀리면 상자 2로)."),
    h("p", {}, "상자 1은 다음 날, 2는 2일 뒤, 3은 4일 뒤, 4는 8일 뒤, 5는 16일 뒤에 다시 나와요. 상자 5에서 맞히면 졸업하고, 30일 뒤에 한 번만 점검해요. 잊어버릴 즈음 다시 떠올리는 것이 가장 오래 남는 방법이에요(간격 효과, 시험 효과)."),
    h("p", {}, "하루에 복습은 20장까지, 새 카드는 5장까지예요. 복습이 15장보다 많은 날은 새 카드를 쉬어요. 힌트를 보고 맞히면 맞음이지만 상자는 그대로예요."));
}
// 홈 학습 길 위의 진입점
function vocabQuest() {
  const open = vUnlocked("mine").length, n = open ? vTodayCount() : 0;
  return h("a", { class: "quest vquest" + (open && !n ? " hit" : ""), href: "#vocab", "aria-label": open ? `단어장, 오늘 ${n}장` : "단어장" },
    ico("cards", "c-flame"),
    h("div", { class: "quest-main" }, h("b", {}, "단어장"), h("span", { class: "vq-sub" }, !open ? "첫 챕터를 끝내면 카드가 생겨요" : n ? `오늘 복습 ${n}장 · 5분` : "오늘 카드 끝! 내일 또 만나요")),
    n ? h("span", { class: "vbadge", "aria-hidden": "true" }, n) : ico(open ? "check" : "lock", "c-off"));
}

/* ---------- 세션 (#vocab-play) ---------- */
const VPRAISE = ["정답!", "좋아요!", "기억났네요!", "훌륭해요!", "바로 그거예요!"];
function vBuildRounds(p) {
  const items = [...p.reviews.map(c => ({ c, isNew: false, b: vState(c).b })), ...p.news.map(c => ({ c, isNew: true, b: 1 }))];
  const b1 = shuffle(items.filter(x => x.b === 1)), mid = shuffle(items.filter(x => x.b === 2 || x.b === 3)), hard = shuffle(items.filter(x => x.b >= 4));
  const rounds = [], singles = [];
  // 상자 1: 4장 이상이면 4~5장씩 짝맞추기, 나머지는 뜻 → 용어 고르기
  let rest = b1.slice();
  while (rest.length >= 4 && rounds.length < 1) {
    const grp = [], terms = new Set(), means = new Set();
    for (const x of rest) { if (grp.length >= 5) break; if (terms.has(x.c.term) || means.has(x.c.mean)) continue; terms.add(x.c.term); means.add(x.c.mean); grp.push(x); }
    if (grp.length < 4) break;
    rounds.push({ t: "match", items: grp }); rest = rest.filter(x => !grp.includes(x));
  }
  rest.forEach(x => singles.push({ t: "m2t", items: [x] }));
  // 짝맞추기 한 판이 있으면 새 카드 몇 장은 고르기로 먼저 몸을 푼다
  return [...singles, ...rounds, ...mid.map(x => ({ t: "t2m", items: [x] })), ...hard.map(x => ({ t: "type", items: [x] }))];
}
function renderVocabPlay() {
  const root = document.getElementById("practice");
  const plan = vPlan();
  if (!plan.total) { location.replace(vHome()); return; }
  const rounds = vBuildRounds(plan), repeat = [];
  const st = { total: plan.total, answered: 0, xp: 0, first: 0, up: 0, combo: 0, best: 0, graded: 0, moved: [] };
  let cur = null, answer = null, checked = false, hinted = false;
  root.innerHTML = "";
  const bar = h("i", {}), count = h("span", { class: "lcount" }), combo = h("span", { class: "combo", "aria-live": "polite" });
  const head = h("div", { class: "pr-head" }, h("a", { class: "pr-x", href: vHome(), "aria-label": "단어장 그만하기" }, ico("close")), h("div", { class: "pr-bar", role: "progressbar", "aria-label": "진행" }, bar, combo), count);
  const card = h("div", { class: "pr-card" }), foot = h("div", { class: "pr-foot" });
  root.append(head, card, foot);
  function drawHead() {
    const tot = st.total + repeat.length + (cur && cur.rep ? 0 : 0);
    bar.style.width = Math.min(100, st.answered / Math.max(1, tot) * 100) + "%";
    count.textContent = `${Math.min(st.answered, tot)} / ${tot}`;
    combo.textContent = st.combo >= 3 ? st.combo + "연속!" : ""; combo.classList.toggle("on", st.combo >= 3);
  }
  function setFoot(state, title, msg, btnText, onBtn) {
    foot.className = "pr-foot " + state; foot.innerHTML = "";
    if (state === "good" || state === "bad") foot.append(h("span", { class: "pr-badge" }, ico(state === "good" ? "check" : "close")));
    foot.append(h("div", { class: "pr-msg" }, title ? h("b", {}, title) : null, ...[].concat(msg || []).filter(Boolean).map(m => typeof m === "string" ? h("span", {}, m) : m)));
    const b = h("button", { class: "pr-go", type: "button", id: "prgo" }, btnText);
    b.disabled = state === "idle" && answer == null; b.addEventListener("click", onBtn); foot.append(b);
  }
  function ready(v) { answer = v; const b = document.getElementById("prgo"); if (b) b.disabled = v == null || v === ""; }
  function bankXp(n) {
    const today = vToday();
    if (!STATS.days.includes(today)) STATS.days.push(today);
    if (n) { addXp(n); st.xp += n; }
    saveStats(STATS); updateChips(); queueSync();
  }
  // 한 장 채점: 상자 이동, XP, 상자 1에서 틀리면 세션 끝에 한 번 더
  function gradeOne(x, ok, usedHint, isRep) {
    st.answered++;
    if (isRep) { if (ok) st.combo++; else st.combo = 0; st.best = Math.max(st.best, st.combo); bankXp(0); return null; }
    const r = vGrade(x.c, ok, usedHint);
    st.graded++;
    if (ok) { st.combo++; st.best = Math.max(st.best, st.combo); if (!usedHint) st.first++; if (r.to > r.from && r.from) st.up++; }
    else { st.combo = 0; if (r.from <= 1) repeat.push({ t: "m2t", items: [x], rep: true }); }
    const gain = ok ? (usedHint ? 1 : x.b >= 4 ? 2 : 1) : 0;
    bankXp(gain);
    return { ...r, gain };
  }
  function moveText(r, ok, usedHint) {
    if (!r) return ok ? "다시 확인 완료! 상자는 내일 복습에서 정해져요." : "괜찮아요. 내일 다시 나와요.";
    if (r.retired) return "졸업 점검 통과! 이 카드는 이제 완전히 내 것이에요.";
    if (!r.from) return ok ? "새 카드를 상자 1에 넣었어요 · 내일 다시 만나요" : "상자 1에 넣었어요 · 이 세션 끝에 한 번 더, 내일 또 나와요";
    if (ok && usedHint) return `힌트를 봐서 ${vBoxLabel(r.to)}에 그대로 있어요 · ${vWhen(r.due)} 다시 만나요`;
    if (ok) return r.to >= 6 ? "졸업! 30일 뒤에 한 번만 점검해요" : `${vBoxLabel(r.from)} → ${vBoxLabel(r.to)} · ${vWhen(r.due)} 다시 만나요`;
    return `${vBoxLabel(r.to)}로 돌아가요 · ${vWhen(r.due)} 다시 나와요` + (r.from <= 1 ? " · 이 세션 끝에 한 번 더" : "");
  }
  function leechLine(x, r) {
    if (!r || !r.leech) return null;
    return h("span", { class: "vleech-line" }, "자주 헷갈리는 카드예요. ", x.c.url ? h("a", { href: x.c.url, target: "_blank", rel: "noopener" }, "사전 원문 1분 읽기 ↗") : h("a", { href: "#" + x.c.ch }, "「" + vChName(x.c.ch) + "」 1분 다시 보기"));
  }
  function next() {
    checked = false; answer = null; hinted = false;
    cur = rounds.length ? rounds.shift() : repeat.length ? repeat.shift() : null;
    if (!cur) return finish();
    drawHead(); draw();
  }
  function ask(text, sub) {
    card.innerHTML = ""; card.classList.remove("pop-in"); void card.offsetWidth; card.classList.add("pop-in");
    const x = cur.items[0];
    const tag = cur.rep ? "한 번 더 · " : cur.t !== "match" && x.isNew ? "새 카드 · " : cur.t !== "match" ? vBoxLabel(x.b) + " · " : "";
    card.append(h("div", { class: "pr-type" }, tag + sub), h("div", { class: "pr-ask" }, mascot(st.combo >= 3 ? "cheer" : "happy", 72), h("p", { class: "pr-q" + (text.length > 40 ? " long" : "") }, text)));
  }
  function draw() {
    if (cur.t === "match") return drawMatch();
    const x = cur.items[0], c = x.c;
    if (cur.t === "type") return drawType(x);
    const isT2m = cur.t === "t2m";
    ask(isT2m ? `「${c.term}」의 뜻은?` : vMask(c.mean, c.term), isT2m ? "용어를 보고 뜻 고르기" : "뜻을 보고 용어 고르기");
    const key = isT2m ? "mean" : "term";
    const opts = shuffle([c, ...vNear(c, 3, key)]);
    cur.opts = opts; cur.a = opts.indexOf(c);
    const box = h("div", { class: "pr-opts" });
    opts.forEach((o, i) => box.append(h("button", { class: "pr-opt" + (isT2m ? " vlong" : ""), type: "button", "data-i": i, onclick: () => { if (checked) return; box.querySelectorAll(".pr-opt").forEach(b => b.classList.toggle("sel", +b.dataset.i === i)); ready(i); } }, h("kbd", {}, i + 1), o[key])));
    card.append(box);
    if (!cur.rep && opts.length >= 4) {
      const hb = h("button", { class: "btn pr-hint", type: "button" }, "힌트: 보기 2개 지우기 (상자는 그대로)");
      hb.addEventListener("click", () => {
        hinted = true; hb.remove();
        shuffle(opts.map((_, i) => i).filter(i => i !== cur.a)).slice(0, 2).forEach(i => { const b = box.querySelector(`.pr-opt[data-i="${i}"]`); b.disabled = true; b.classList.add("gone"); b.classList.remove("sel"); if (answer === i) ready(null); });
      });
      card.append(hb);
    }
    setFoot("idle", "", "", "확인", checkMc);
  }
  function checkMc() {
    if (checked || answer == null) return; checked = true;
    const x = cur.items[0], ok = answer === cur.a;
    card.querySelectorAll(".pr-opt").forEach(b => { const i = +b.dataset.i; if (i === cur.a) b.classList.add("right"); else if (i === answer) b.classList.add("wrong"); });
    react(x, ok, hinted);
  }
  function react(x, ok, usedHint, typed) {
    card.querySelector(".pr-ask .mascot")?.replaceWith(mascot(ok ? "cheer" : "sad", 72));
    const r = gradeOne(x, ok, usedHint, !!cur.rep);
    drawHead();
    if (ok) {
      sfx("ok"); buzz(12);
      if (r && r.gain) { const pop = h("span", { class: "xp-pop", "aria-hidden": "true" }, "+" + r.gain + " XP"); card.append(pop); setTimeout(() => pop.remove(), 1000); }
      setFoot("good", VPRAISE[Math.floor(Math.random() * VPRAISE.length)] + (r && r.gain ? `  +${r.gain} XP` : "") + (st.combo >= 3 ? `  · ${st.combo}연속` : ""), [vBack(x.c), moveText(r, true, usedHint)], "계속", next);
    } else {
      sfx("bad"); buzz([30, 40, 30]);
      setFoot("bad", typed != null ? "정답: " + x.c.term : "아쉬워요", [vBack(x.c), moveText(r, false), leechLine(x, r)], "계속", next);
    }
    setTimeout(() => document.getElementById("prgo")?.focus(), 30);
  }
  // 상자 4·5·졸업: 뜻을 보고 용어를 직접 써서 떠올리기 (자동 채점, 자기 채점 없음)
  function drawType(x) {
    const c = x.c;
    ask(vMask(c.mean, c.term), "뜻을 보고 용어 직접 떠올리기");
    const inp = h("input", { class: "pr-num vtype", id: "vtype", type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "용어를 써 보세요", "aria-label": "용어" });
    inp.addEventListener("input", () => ready(inp.value.trim() ? inp.value : null));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); document.getElementById("prgo")?.click(); } });
    const tools = h("div", { class: "vtools" });
    const hb = h("button", { class: "btn pr-hint", type: "button" }, "힌트: 첫 글자 보기 (상자는 그대로)");
    hb.addEventListener("click", () => { hinted = true; hb.replaceWith(h("p", { class: "pr-hintbox" }, h("b", {}, "힌트  "), vChosung(c.term))); inp.focus(); });
    const idk = h("button", { class: "btn", type: "button" }, "모르겠어요");
    idk.addEventListener("click", () => { if (checked) return; answer = ""; checked = true; inp.disabled = true; inp.classList.add("wrong"); react(x, false, false, ""); });
    tools.append(hb, idk);
    card.append(inp, h("p", { class: "w-hint" }, "띄어쓰기와 대소문자는 신경 쓰지 않아도 돼요. 긴 말은 한두 글자 오타까지 맞음으로 봐요."), tools);
    setFoot("idle", "", "", "확인", () => {
      if (checked || answer == null) return; checked = true;
      const ok = vTypedOk(inp.value, c.term); inp.disabled = true; inp.classList.add(ok ? "right" : "wrong");
      tools.remove(); react(x, ok, hinted, inp.value);
    });
    setTimeout(() => inp.focus(), 50);
  }
  // 상자 1: 짝맞추기. 쌍마다 따로 채점(처음 고른 짝이 맞았는지)
  function drawMatch() {
    card.innerHTML = ""; card.classList.remove("pop-in"); void card.offsetWidth; card.classList.add("pop-in");
    card.append(h("div", { class: "pr-type" }, `짝맞추기 · ${cur.items.length}쌍`), h("div", { class: "pr-ask" }, mascot("happy", 72), h("p", { class: "pr-q" }, "용어와 뜻을 탭해서 짝지어 보세요")));
    const L = shuffle(cur.items.slice()), R = shuffle(cur.items.slice()), miss = new Set(), doneSet = new Set();
    let sel = null;
    const colL = h("div", { class: "vm-col" }), colR = h("div", { class: "vm-col" });
    const mk = (x, side) => h("button", { class: "vm-item " + side, type: "button", "data-id": x.c.id, onclick: e => pick(x, side, e.currentTarget) }, side === "L" ? x.c.term : vMask(x.c.mean, x.c.term));
    L.forEach(x => colL.append(mk(x, "L"))); R.forEach(x => colR.append(mk(x, "R")));
    card.append(h("div", { class: "vm-grid" }, colL, colR));
    const results = [];
    function pick(x, side, el) {
      if (doneSet.has(x.c.id) && el.classList.contains("right")) return;
      if (!sel || sel.side === side) { card.querySelectorAll(".vm-item.sel").forEach(b => b.classList.remove("sel")); sel = { x, side, el }; el.classList.add("sel"); sfx("tap"); return; }
      const a = sel; sel = null; a.el.classList.remove("sel");
      if (a.x === x) {
        a.el.classList.add("right"); el.classList.add("right"); a.el.disabled = el.disabled = true; doneSet.add(x.c.id);
        const ok = !miss.has(x.c.id);
        const r = gradeOne(x, ok, false, false); results.push({ x, ok, r });
        sfx("ok"); drawHead();
        if (doneSet.size === cur.items.length) matchDone();
      } else {
        miss.add(a.x.c.id); st.combo = 0;
        [a.el, el].forEach(b => { b.classList.remove("wrong"); void b.offsetWidth; b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 450); });
        sfx("bad"); buzz([30, 40, 30]); drawHead();
      }
    }
    function matchDone() {
      checked = true;
      const good = results.filter(z => z.ok).length, gain = results.reduce((s, z) => s + (z.r ? z.r.gain : 0), 0);
      card.querySelector(".pr-ask .mascot")?.replaceWith(mascot(good === results.length ? "cheer" : "happy", 72));
      if (gain) { const pop = h("span", { class: "xp-pop", "aria-hidden": "true" }, "+" + gain + " XP"); card.append(pop); setTimeout(() => pop.remove(), 1000); }
      const missed = results.filter(z => !z.ok);
      const msg = missed.length ? [`처음에 헷갈린 카드: ${missed.map(z => z.x.c.term).join(", ")}. 상자 1에 남고 이 세션 끝에 한 번 더 나와요.`, ...missed.map(z => leechLine(z.x, z.r))]
        : [results.some(z => z.r && !z.r.from) ? "새 카드는 상자 1에, 복습 카드는 상자 2로 올라갔어요." : "모두 상자 2로 올라갔어요 · 2일 뒤 다시 만나요"];
      setFoot(missed.length ? "bad" : "good", (missed.length ? `${results.length}쌍 중 ${good}쌍을 한 번에` : "완벽한 짝맞추기!") + (gain ? `  +${gain} XP` : ""), msg, "계속", next);
      if (!missed.length) sfx("ok");
      setTimeout(() => document.getElementById("prgo")?.focus(), 30);
    }
    setFoot("idle", "", "짝을 모두 찾으면 계속할 수 있어요.", "계속", next);
  }
  function finish() {
    drawHead(); bar.style.width = "100%";
    const acc = st.graded ? Math.round(st.first / st.graded * 100) : 100;
    card.innerHTML = ""; confetti(); sfx("done");
    const nd = vNextDue();
    card.append(h("div", { class: "pr-end" }, mascot("cheer", 120),
      h("div", { class: "pr-big" }, acc === 100 ? "완벽!" : "단어장 끝!"),
      h("h2", {}, `카드 ${st.graded}장을 복습했어요`),
      h("div", { class: "readout", style: "width:100%" },
        h("div", { class: "ro big t-sun" }, h("small", {}, "얻은 XP"), h("b", {}, ico("bolt"), "+" + st.xp)),
        h("div", { class: "ro big t-good" }, h("small", {}, "한 번에 맞힘"), h("b", {}, ico("target"), acc + "%")),
        h("div", { class: "ro big t-sky" }, h("small", {}, "상자 올라감"), h("b", {}, ico("cards"), st.up + "장")),
        h("div", { class: "ro big t-flame" }, h("small", {}, "연속 학습"), h("b", {}, ico("flame"), streak() + "일"))),
      vShelf(),
      h("p", { class: "w-hint" }, nd ? `다음 복습: ${vWhen(nd.d)} ${nd.n}장. 잊어버릴 즈음 다시 떠올리면 가장 오래 남아요.` : "잊어버릴 즈음 다시 떠올리면 가장 오래 남아요.")));
    setFoot("idle end", "", "", "학습 지도로", () => { location.hash = "home"; });
    foot.prepend(h("a", { class: "btn", href: VDECK === "dict" ? "#vocab-dict-play-more" : "#vocab", style: "text-decoration:none", onclick: VDECK === "dict" && location.hash === "#vocab-dict-play-more" ? (e => { e.preventDefault(); route(); }) : null }, VDECK === "dict" ? `${VMORE_N}장 더 풀기` : "단어장 보기"));
    document.getElementById("prgo").disabled = false;
    buildRail(VDECK === "dict" ? "vocab-dict-play" : "vocab-play");
  }
  next();
}
function vocabRailNote() { const n = vUnlocked("mine").length ? vTodayCount() : 0; return n ? `오늘 ${n}장` : null; }
