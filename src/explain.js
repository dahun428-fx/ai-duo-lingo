/* ---------- 내 말로 설명하기 (#vocab-explain, #vocab-dict-explain) ---------- */
// 용어를 보고 뜻을 내 말로 써 보면 AI 선생님(my-planner 서버의 POST /api/v1/study/grade)이 채점한다.
// 서버 연결(설정 > 웹과 앱 진도 자동으로 맞추기)이 없거나 서버에 닿지 않으면 뜻풀이를 보고 스스로 채점한다.
// 상자(간격 반복)는 건드리지 않는다. XP와 공부한 날만 쌓고, 카드마다 내 설명 최고 점수를 기기에 남긴다.
const XN = 5;                  // 한 판에 설명할 카드 수
const XMIN = 8;                // 이보다 짧은 설명은 보내기 전에 한 번 더 써 보게 한다(글자)
const XTIMEOUT = 90000;        // AI 채점 기다리는 시간(ms). 서버 두뇌는 한 번에 하나씩 답한다
const XVERDICT = {
  great: { t: "핵심을 잡았어요!", m: "cheer", xp: 3, cls: "good" },
  close: { t: "거의 다 왔어요", m: "happy", xp: 2, cls: "good" },
  retry: { t: "다시 한 번 볼까요?", m: "think", xp: 1, cls: "bad" },
};
const XSELF = [["great", "맞게 설명했어요"], ["close", "반쯤 맞았어요"], ["retry", "많이 달랐어요"]];
const xErrMsg = { 401: "서버 토큰이 맞지 않아요. 설정에서 연결을 확인해 주세요.", 404: "서버에 아직 AI 채점 기능이 없어요(서버 업데이트가 필요해요).", 429: "오늘 AI 채점은 다 썼어요. 내일 다시 할 수 있어요.", 503: "지금은 AI가 채점할 수 없어요." };

function xPick() {
  const open = vUnlocked(), seen = shuffle(open.filter(c => vState(c))), fresh = shuffle(open.filter(c => !vState(c)));
  return [...seen, ...fresh].slice(0, XN);   // 퀴즈에서 본 카드부터(처음 보는 말은 설명하기 어렵다)
}
function xBest(c) { return VOCAB.ex && VOCAB.ex[c.id] != null ? VOCAB.ex[c.id] : null; }
function xSaveBest(c, score) { VOCAB.ex = VOCAB.ex || {}; VOCAB.ex[c.id] = Math.max(score, xBest(c) || 0); saveVocab(); }
async function xAskAI(c, answer) {
  if (typeof SYNC === "undefined" || !SYNC) throw Object.assign(new Error("서버에 연결하지 않아서 스스로 채점해요."), { offline: true });
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), XTIMEOUT);
  try {
    const r = await fetch(SYNC.url + "/api/v1/study/grade", { method: "POST", headers: { "Authorization": "Bearer " + SYNC.token, "Content-Type": "application/json" }, body: JSON.stringify({ term: c.term, meaning: c.mean, answer }), signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(xErrMsg[r.status] || `서버가 답하지 못했어요(${r.status}).`);
    const d = await r.json();
    if (typeof d.score !== "number" || !XVERDICT[d.verdict]) throw new Error("AI 답을 읽지 못했어요.");
    return d;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("AI가 너무 오래 걸려요. 노트북이 켜져 있는지 확인해 주세요.");
    if (e instanceof TypeError) throw new Error("서버에 닿지 않아요(노트북이 꺼져 있거나 Tailscale이 끊겼어요).");
    throw e;
  } finally { clearTimeout(t); }
}
function xList(cls, icon, title, items) {
  if (!items || !items.length) return null;
  return h("div", { class: "xfb " + cls }, h("b", {}, h("span", { class: "xfb-ico", "aria-hidden": "true" }, icon), title), h("ul", {}, ...items.map(s => h("li", {}, s))));
}
function xScoreRing(score, cls) {
  const R = 34, L = 2 * Math.PI * R, off = L * (1 - score / 100);
  const svg = `<svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" class="xring-bg"/><circle cx="42" cy="42" r="${R}" class="xring-fg ${cls}" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${L.toFixed(1)}" data-off="${off.toFixed(1)}" transform="rotate(-90 42 42)"/></svg>`;
  const el = h("div", { class: "xring", role: "img", "aria-label": `${score}점` }); el.innerHTML = svg;
  el.append(h("b", {}, score), h("small", {}, "점"));
  requestAnimationFrame(() => requestAnimationFrame(() => { const fg = el.querySelector(".xring-fg"); if (fg) fg.style.strokeDashoffset = fg.dataset.off; }));
  return el;
}

function renderExplain() {
  const root = document.getElementById("practice");
  const cards = xPick();
  if (!cards.length) { location.replace(vHome()); return; }
  const st = { i: 0, xp: 0, scores: [], ai: 0 };
  let checked = false;
  root.innerHTML = "";
  const bar = h("i", {}), count = h("span", { class: "lcount" });
  const head = h("div", { class: "pr-head" }, h("a", { class: "pr-x", href: vHome(), "aria-label": "설명하기 그만하기" }, ico("close")), h("div", { class: "pr-bar", role: "progressbar", "aria-label": "진행" }, bar), count);
  const card = h("div", { class: "pr-card" }), foot = h("div", { class: "pr-foot" });
  root.append(head, card, foot);
  const drawHead = () => { bar.style.width = (st.i / cards.length * 100) + "%"; count.textContent = `${Math.min(st.i + 1, cards.length)} / ${cards.length}`; };
  function setFoot(state, title, msg, btnText, onBtn, disabled) {
    foot.className = "pr-foot " + state; foot.innerHTML = "";
    if (state === "good" || state === "bad") foot.append(h("span", { class: "pr-badge" }, ico(state === "good" ? "check" : "close")));
    foot.append(h("div", { class: "pr-msg" }, title ? h("b", {}, title) : null, ...[].concat(msg || []).filter(Boolean).map(m => typeof m === "string" ? h("span", {}, m) : m)));
    const b = h("button", { class: "pr-go", type: "button", id: "prgo" }, btnText);
    b.disabled = !!disabled; b.addEventListener("click", onBtn); foot.append(b);
    return b;
  }
  function bank(n) {
    const today = vToday();
    if (!STATS.days.includes(today)) STATS.days.push(today);
    if (n) { addXp(n); st.xp += n; }
    saveStats(STATS); updateChips(); queueSync();
  }
  function next() {
    checked = false;
    if (st.i >= cards.length) return finish();
    drawHead(); draw(cards[st.i]);
  }
  function draw(c) {
    card.innerHTML = ""; card.classList.remove("pop-in"); void card.offsetWidth; card.classList.add("pop-in");
    const best = xBest(c);
    card.append(h("div", { class: "pr-type" }, "내 말로 설명하기" + (best != null ? ` · 지난 최고 ${best}점` : "")),
      h("div", { class: "pr-ask" }, mascot("happy", 72), h("p", { class: "pr-q" }, `「${c.term}」이 뭔지 친구에게 설명하듯 써 보세요`)));
    const ta = h("textarea", { class: "xans", id: "xans", rows: "5", maxlength: "1000", placeholder: "예: 이건 ~할 때 쓰는 방법인데, ~하는 거예요.", "aria-label": "내 설명" });
    const cnt = h("small", { class: "xcnt" }, "0 / 1000");
    const tips = h("details", { class: "xtips" }, h("summary", {}, "막막하면 이렇게 써 보세요"),
      h("ul", {}, h("li", {}, "한 문장으로: 이건 무엇인가요?"), h("li", {}, "왜 필요한가요? 없으면 무엇이 곤란한가요?"), h("li", {}, "생활 속 비유나 예를 하나 들어 보세요.")));
    const idk = h("button", { class: "btn", type: "button" }, "모르겠어요 (뜻 보기)");
    idk.addEventListener("click", () => { if (checked) return; checked = true; ta.disabled = true; showSelf(c, "", "괜찮아요. 뜻을 읽고 다음에 내 말로 다시 써 봐요.", true); });
    card.append(ta, h("div", { class: "xrow" }, cnt, idk), tips);
    const online = typeof SYNC !== "undefined" && !!SYNC;
    const go = setFoot("idle", "", online ? "AI 선생님이 맞은 점, 빠진 점, 틀린 점을 짚어 줘요." : "서버에 연결하지 않아서 뜻풀이를 보고 스스로 채점해요.", online ? "AI 채점" : "채점", () => submit(c, ta), true);
    ta.addEventListener("input", () => { const n = ta.value.trim().length; cnt.textContent = `${ta.value.length} / 1000`; go.disabled = !n; });
    setTimeout(() => ta.focus(), 50);
  }
  async function submit(c, ta) {
    if (checked) return;
    const answer = ta.value.trim();
    if (!answer) return;
    if (answer.length < XMIN && !ta.dataset.warned) { ta.dataset.warned = "1"; setFoot("idle", "조금만 더 써 볼까요?", "한두 문장이면 AI가 더 자세히 짚어 줄 수 있어요. 그대로 보내려면 한 번 더 누르세요.", "그대로 채점", () => submit(c, ta)); return; }
    checked = true; ta.disabled = true;
    if (typeof SYNC === "undefined" || !SYNC) return showSelf(c, answer, null);
    card.querySelector(".pr-ask .mascot")?.replaceWith(mascot("think", 72));
    const wait = h("p", { class: "xwait", role: "status" }, h("span", { class: "xdots", "aria-hidden": "true" }, h("i"), h("i"), h("i")), "AI 선생님이 읽고 있어요. 10~30초쯤 걸려요.");
    card.append(wait);
    setFoot("idle", "", "채점하는 동안 내 설명을 다시 읽어 보세요.", "채점 중…", () => { }, true);
    try {
      const d = await xAskAI(c, answer);
      wait.remove(); showAI(c, d);
    } catch (e) {
      wait.remove(); showSelf(c, answer, e.message + " 이번 카드는 뜻풀이를 보고 스스로 채점해 주세요.");
    }
  }
  // 결과를 보일 때: 입력 도구를 거두고 결과 상자를 화면 위쪽으로(바닥 띠에 가리지 않게)
  function tidy() { card.querySelector(".xrow")?.remove(); card.querySelector(".xtips")?.remove(); }
  function reveal(box) { setTimeout(() => box.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 60); }
  function showAI(c, d) {
    const v = XVERDICT[d.verdict];
    st.ai++; st.scores.push(d.score); xSaveBest(c, d.score);
    card.querySelector(".pr-ask .mascot")?.replaceWith(mascot(v.m, 72));
    const box = h("div", { class: "xresult" },
      h("div", { class: "xres-head" }, xScoreRing(d.score, v.cls), h("div", {}, h("b", { class: "xres-t" }, v.t), h("span", { class: "w-hint" }, "AI 채점 · 표현이 달라도 뜻이 맞으면 맞은 거예요"))),
      xList("good", "✓", "잘 잡은 점", d.good), xList("miss", "+", "빠진 핵심", d.missing), xList("bad", "!", "틀리거나 헷갈린 점", d.wrong),
      d.tip ? h("p", { class: "xtip" }, h("b", {}, "기억 팁  "), d.tip) : null,
      h("p", { class: "w-hint xref" }, "참고 뜻풀이"), vBack(c));
    tidy(); card.append(box); reveal(box);
    react(v, ["점수와 피드백은 위에 있어요."]);
  }
  function showSelf(c, answer, why, gaveUp) {
    card.querySelector(".pr-ask .mascot")?.replaceWith(mascot("think", 72));
    const box = h("div", { class: "xresult" }, why ? h("p", { class: "vnote" }, why) : null,
      h("p", { class: "w-hint" }, "참고 뜻풀이예요. 내 설명과 뜻이 같은지 비교해 보세요. 표현은 달라도 괜찮아요."), vBack(c));
    tidy(); card.append(box); reveal(box);
    if (gaveUp) { st.scores.push(0); return react(XVERDICT.retry, [], true); }
    const pick = h("div", { class: "xself" }, ...XSELF.map(([k, label]) => h("button", { class: "btn" + (k === "great" ? " pri" : ""), type: "button", onclick: () => { pick.remove(); const sc = { great: 90, close: 60, retry: 30 }[k]; st.scores.push(sc); xSaveBest(c, sc); react(XVERDICT[k], []); } }, label)));
    box.append(h("b", { class: "xself-q" }, "내 설명은 어땠나요?"), pick);
    setFoot("idle", "", "솔직하게 골라 주세요. 어느 쪽이든 XP를 받아요.", "계속", () => { }, true);
  }
  function react(v, msg, gaveUp) {
    const gain = gaveUp ? 1 : v.xp;
    bank(gain);
    if (v.cls === "good") { sfx("ok"); buzz(12); } else sfx("tap");
    const pop = h("span", { class: "xp-pop", "aria-hidden": "true" }, "+" + gain + " XP"); card.append(pop); setTimeout(() => pop.remove(), 1000);
    st.i++;
    setFoot(gaveUp ? "bad" : v.cls, (gaveUp ? "뜻을 확인했어요" : v.t) + `  +${gain} XP`, msg, st.i >= cards.length ? "결과 보기" : "다음 카드", next);
    setTimeout(() => document.getElementById("prgo")?.focus(), 30);
  }
  function finish() {
    bar.style.width = "100%"; count.textContent = `${cards.length} / ${cards.length}`;
    const avg = st.scores.length ? Math.round(st.scores.reduce((a, b) => a + b, 0) / st.scores.length) : 0;
    card.innerHTML = ""; confetti(); sfx("done");
    card.append(h("div", { class: "pr-end" }, mascot("cheer", 120),
      h("div", { class: "pr-big" }, avg >= 80 ? "설명왕!" : "설명 끝!"),
      h("h2", {}, `카드 ${cards.length}장을 내 말로 설명했어요`),
      h("div", { class: "readout", style: "width:100%" },
        h("div", { class: "ro big t-sun" }, h("small", {}, "얻은 XP"), h("b", {}, ico("bolt"), "+" + st.xp)),
        h("div", { class: "ro big t-good" }, h("small", {}, "평균 점수"), h("b", {}, ico("target"), avg + "점")),
        h("div", { class: "ro big t-sky" }, h("small", {}, "AI 채점"), h("b", {}, ico("cards"), st.ai + "장")),
        h("div", { class: "ro big t-flame" }, h("small", {}, "연속 학습"), h("b", {}, ico("flame"), streak() + "일"))),
      h("p", { class: "w-hint" }, "내 말로 설명해 보는 것은 뜻을 고르는 것보다 훨씬 오래 남아요(설명 효과). 헷갈린 카드는 내일 퀴즈에서 다시 만나요.")));
    setFoot("idle end", "", "", "단어장으로", () => { location.hash = vHome().slice(1); });
    foot.prepend(h("a", { class: "btn", href: "#" + (VDECK === "dict" ? "vocab-dict-explain" : "vocab-explain"), style: "text-decoration:none", onclick: e => { e.preventDefault(); route(); } }, `${XN}장 더 설명하기`));
    buildRail(VDECK === "dict" ? "vocab-dict-play" : "vocab-play");
  }
  next();
}
