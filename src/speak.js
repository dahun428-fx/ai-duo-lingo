/* ---------- 면접에서 말해보기 ---------- */
// 1) 스크립트를 읽고 듣는다  2) 가리고 말한다(녹음, 받아쓰기)  3) 핵심어를 스스로 점검한다
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let speakCleanup = null;
function stopSpeak() { if (speakCleanup) { try { speakCleanup(); } catch (_) { } speakCleanup = null; } try { window.speechSynthesis?.cancel(); } catch (_) { } }
function spokeCount(id) { return (STATS.spoke || {})[id] || 0; }
function norm(t) { return String(t).toLowerCase().replace(/[\s.,!?'"·]/g, ""); }
function speakCard(id) {
  if (!SPEAK[id]) return null;
  const n = spokeCount(id);
  return h("div", { class: "prcard spk" },
    h("div", {}, h("b", {}, "면접에서 말해보기"), h("span", {}, "“" + SPEAK[id].q + "”" + (n ? ` · ${n}번 말해 봤어요` : " · 스크립트를 읽고, 가리고, 소리 내어 답해 보세요"))),
    h("a", { class: "btn", href: "#speak-" + id, style: "text-decoration:none;white-space:nowrap" }, n ? "다시 말하기" : "말해보기"));
}
function renderSpeakList() {
  lessonEl.innerHTML = ""; tocEl.innerHTML = "";
  lessonEl.append(h("div", { class: "eyebrow" }, "말하기 연습"), h("h1", {}, "면접에서 말해보기"),
    h("p", { class: "meta" }, "아는 것과 말로 설명할 수 있는 것은 다릅니다. 챕터마다 면접 질문 하나와 1분짜리 답변 스크립트가 있습니다. 읽고, 가리고, 소리 내어 답해 보세요."));
  SUBJECTS.forEach(sub => {
    const live = sub.chapters.filter(c => c.l && SPEAK[c.l]); if (!live.length) return;
    lessonEl.append(h("h2", {}, sub.name), h("div", { class: "cards" }, ...live.map(c => h("a", { class: "card", href: "#speak-" + c.l }, h("small", {}, c.name + (spokeCount(c.l) ? ` · ${spokeCount(c.l)}번 말함` : "")), h("b", {}, SPEAK[c.l].q)))));
  });
}
function renderSpeak(id) {
  const d = SPEAK[id]; if (!d) { location.hash = "speak"; return; }
  stopSpeak();
  lessonEl.innerHTML = ""; tocEl.innerHTML = "";
  const full = d.s.join(" ");
  let step = 0, hidden = false, rec = null, stream = null, chunks = [], recog = null, heard = "", t0 = 0, timer = null, audioUrl = null;
  const body = h("div", { class: "spk-body" });
  const steps = h("ol", { class: "spk-steps" }, ...["읽기", "가리고 말하기", "점검"].map(t => h("li", {}, t)));
  lessonEl.append(h("div", { class: "eyebrow" }, "면접에서 말해보기 · " + (chapterOf(id) ? chapterOf(id).ch.name : id)),
    h("h1", { class: "spk-q" }, "“" + d.q + "”"), steps, body,
    h("p", { class: "w-hint" }, h("a", { href: "#" + id }, "이 챕터 본문으로"), "  ·  ", h("a", { href: "#speak" }, "다른 질문 보기")));
  const stopAll = () => {
    clearInterval(timer); timer = null;
    try { if (rec && rec.state !== "inactive") rec.stop(); } catch (_) { }
    try { recog && recog.stop(); } catch (_) { }
    try { stream && stream.getTracks().forEach(t => t.stop()); } catch (_) { }
    stream = null;
  };
  speakCleanup = () => { stopAll(); if (audioUrl) URL.revokeObjectURL(audioUrl); };
  const scriptEl = hide => h("div", { class: "spk-script" + (hide ? " hid" : "") }, ...d.s.map((x, i) => h("p", {}, h("span", { class: "spk-n" }, i + 1), hide ? h("span", { class: "spk-blur", "aria-hidden": "true" }, x) : x)));
  function draw() {
    [...steps.children].forEach((li, i) => { li.className = i === step ? "on" : i < step ? "ok" : ""; });
    body.innerHTML = "";
    if (step === 0) drawRead(); else if (step === 1) drawSay(); else drawCheck();
  }
  function drawRead() {
    const tts = "speechSynthesis" in window;
    const listen = h("button", { class: "btn", type: "button" }, "모범 답변 들어보기");
    listen.addEventListener("click", () => {
      if (!tts) return;
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); listen.textContent = "모범 답변 들어보기"; return; }
      const u = new SpeechSynthesisUtterance(full); u.lang = "ko-KR"; u.rate = 0.95;
      u.onend = u.onerror = () => { listen.textContent = "모범 답변 들어보기"; };
      speechSynthesis.speak(u); listen.textContent = "멈추기";
    });
    body.append(h("p", {}, "먼저 소리 내어 두 번 읽어 보세요. 문장 번호 순서(정의, 방법, 예시, 논문 연결)를 기억하면 외우지 않아도 말이 이어집니다."),
      scriptEl(false),
      h("div", { class: "spk-keys" }, h("small", {}, "꼭 들어가야 하는 말"), ...d.k.map(k => h("span", { class: "chip" }, k))),
      h("div", { class: "btns" }, tts ? listen : null, h("button", { class: "btn pri", type: "button", onclick: () => { try { speechSynthesis.cancel(); } catch (_) { } step = 1; hidden = true; draw(); } }, "가리고 말해보기")));
  }
  function drawSay() {
    const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    const clock = h("b", { class: "spk-clock" }, "0:00");
    const status = h("p", { class: "w-hint", role: "status" }, canRec ? "녹음은 이 기기 안에서만 재생되고, 어디에도 저장하거나 보내지 않습니다." : "이 브라우저에서는 녹음을 쓸 수 없어요. 타이머를 켜고 소리 내어 말한 뒤 점검으로 넘어가세요.");
    const live = h("p", { class: "spk-live" });
    const player = h("div", {});
    const holder = h("div", {}, scriptEl(hidden));
    const peek = h("button", { class: "btn", type: "button" }, hidden ? "스크립트 잠깐 보기" : "다시 가리기");
    peek.addEventListener("click", () => { hidden = !hidden; holder.innerHTML = ""; holder.append(scriptEl(hidden)); peek.textContent = hidden ? "스크립트 잠깐 보기" : "다시 가리기"; });
    const go = h("button", { class: "btn pri spk-rec", type: "button" }, canRec ? "● 녹음 시작" : "타이머 시작");
    const tick = () => { const s = Math.floor((Date.now() - t0) / 1000); clock.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
    async function start() {
      heard = ""; live.textContent = ""; player.innerHTML = "";
      if (canRec) {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
        catch (_) { status.textContent = "마이크를 쓸 수 없어요. 브라우저의 마이크 권한을 허용하거나, 녹음 없이 소리 내어 말한 뒤 점검으로 넘어가세요."; stream = null; }
      }
      if (stream) {
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
          if (!chunks.length) return;
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
          player.innerHTML = ""; player.append(h("small", {}, "내 답변 다시 듣기"), h("audio", { controls: "", src: audioUrl, class: "spk-audio" }));
        };
        rec.start();
        if (SR) {
          try {
            recog = new SR(); recog.lang = "ko-KR"; recog.continuous = true; recog.interimResults = true;
            let fin = "";
            recog.onresult = e => { let it = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t + " "; else it += t; } heard = fin + it; live.textContent = heard; };
            recog.onerror = () => { }; recog.start();
          } catch (_) { recog = null; }
        }
      }
      t0 = Date.now(); tick(); timer = setInterval(tick, 500);
      go.textContent = "■ 끝내기"; go.classList.add("on"); go.onclick = stop;
    }
    function stop() {
      stopAll();
      go.textContent = canRec ? "● 다시 녹음" : "타이머 다시 시작"; go.classList.remove("on"); go.onclick = start;
      next.disabled = false;
    }
    go.onclick = start;
    const next = h("button", { class: "btn pri", type: "button", onclick: () => { stopAll(); step = 2; draw(); } }, "점검하기");
    body.append(h("p", {}, "면접관이 앞에 있다고 생각하고 40초에서 1분 안에 답해 보세요. 막히면 아래 핵심어만 보고 이어 가세요."),
      h("div", { class: "spk-keys" }, h("small", {}, "핵심어"), ...d.k.map(k => h("span", { class: "chip" }, k))),
      holder,
      h("div", { class: "spk-bar" }, go, clock, peek),
      live, player, status,
      h("div", { class: "btns" }, h("button", { class: "btn", type: "button", onclick: () => { stopAll(); step = 0; draw(); } }, "다시 읽기"), next));
  }
  function drawCheck() {
    const got = norm(heard);
    const boxes = d.k.map(k => { const c = h("input", { type: "checkbox" }); if (got && got.includes(norm(k))) c.checked = true; return [k, c]; });
    const sum = h("b", {});
    const upd = () => { const n = boxes.filter(b => b[1].checked).length; sum.textContent = `핵심어 ${n} / ${boxes.length}`; };
    boxes.forEach(b => b[1].addEventListener("change", upd)); upd();
    const done = h("button", { class: "btn pri", type: "button" }, "말하기 완료");
    const msg = h("p", { class: "w-hint", role: "status" });
    done.addEventListener("click", () => {
      const n = boxes.filter(b => b[1].checked).length, first = !spokeCount(id);
      const gain = (first ? 15 : 5) + (n === boxes.length ? 5 : 0);
      const before = levelInfo(STATS.xp);
      STATS.spoke = STATS.spoke || {}; STATS.spoke[id] = spokeCount(id) + 1; addXp(gain);
      const today = ymd(new Date()); if (!STATS.days.includes(today)) STATS.days.push(today);
      saveStats(STATS); updateChips(); queueSync();
      const after = levelInfo(STATS.xp);
      done.disabled = true;
      msg.textContent = `+${gain} XP` + (after.level > before.level ? `  ·  레벨 업! Lv.${after.level} ${after.title}` : "") + (n < boxes.length ? "  ·  빠진 핵심어를 넣어 한 번 더 말해 보면 훨씬 매끄러워져요." : "  ·  핵심어를 모두 넣었어요.");
    });
    body.append(h("p", {}, heard ? "받아쓴 내용에서 찾은 핵심어를 미리 표시했어요. 받아쓰기는 틀릴 수 있으니 직접 고쳐 주세요." : "방금 답변에 들어간 핵심어에 표시해 보세요. 녹음을 다시 들으며 확인하면 정확합니다."),
      h("div", { class: "spk-check" }, ...boxes.map(([k, c]) => h("label", {}, c, h("span", {}, k)))), sum,
      heard ? h("details", {}, h("summary", {}, "받아쓴 내 답변 보기"), h("p", { class: "spk-live" }, heard)) : null,
      h("h3", {}, "모범 답변과 비교"), scriptEl(false),
      h("div", { class: "btns" }, h("button", { class: "btn", type: "button", onclick: () => { step = 1; hidden = true; draw(); } }, "한 번 더 말하기"), done), msg);
  }
  draw();
}
