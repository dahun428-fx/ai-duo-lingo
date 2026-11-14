/* ---------- 앱 설치, 오프라인, 진도 옮기기 ---------- */
const APP_BUILD = "__BUILD__";
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
}
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (location.hash.slice(1) === "settings") route(); });
window.addEventListener("appinstalled", () => { installEvt = null; });
function isStandalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
// 두 진도를 합친다(서버와 같은 규칙): 완료와 학습일은 합집합, 최고 기록과 말한 횟수는 큰 쪽, XP는 기기 칸마다 큰 쪽
const LESSON_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/, DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
function cleanInt(v, max) { v = Math.floor(+v); return Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0; }
function mergeIn(p) {
  (p.done || []).filter(x => byId[x]).forEach(x => DONE.add(x)); saveDone(DONE);
  STATS.days = [...new Set([...STATS.days, ...(p.days || []).filter(x => DAY_RE.test(x))])].sort();
  for (const k in (p.best || {})) if (LESSON_RE.test(k)) STATS.best[k] = Math.max(STATS.best[k] || 0, cleanInt(p.best[k], 100));
  for (const k in (p.spoke || {})) if (LESSON_RE.test(k)) STATS.spoke[k] = Math.max(STATS.spoke[k] || 0, cleanInt(p.spoke[k], 100000));
  for (const k in (p.xp_by || {})) if (KEY_RE.test(k)) STATS.xpBy[k] = Math.max(STATS.xpBy[k] || 0, cleanInt(p.xp_by[k], 10000000));
  STATS.xp = sumXp(); saveStats(STATS); updateChips();
}
function snapshot() {
  const pick = (o, max) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => LESSON_RE.test(k)).map(([k, v]) => [k, cleanInt(v, max)]));
  return { v: 1, done: [...DONE].filter(x => LESSON_RE.test(x)).sort(), days: STATS.days.filter(x => DAY_RE.test(x)).sort(), best: pick(STATS.best, 100), spoke: pick(STATS.spoke, 100000),
    xp_by: Object.fromEntries(Object.entries(STATS.xpBy).filter(([k]) => KEY_RE.test(k)).map(([k, v]) => [k, cleanInt(v, 10000000)])) };
}
// 진도 코드: 서버 없이 이 기기의 진도를 글자 한 줄로 만들어 다른 기기에 붙여 넣는다
function b64(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
function unb64(t) { return JSON.parse(decodeURIComponent(escape(atob(t)))); }
function exportCode() { return "AIDUO2." + b64(snapshot()); }
function importCode(code) {
  const m = String(code).trim().match(/^AIDUO([12])\.([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error("진도 코드 형식이 아니에요.");
  let d; try { d = unb64(m[2]); } catch (_) { d = null; }
  if (!d || !Array.isArray(d.done)) throw new Error("진도 코드를 읽을 수 없어요.");
  if (m[1] === "2") { mergeIn(d); return; }
  // 예전 코드(총 XP만 있음): 모자란 만큼을 이 기기 칸에 더한다
  const st = d.stats || {};
  mergeIn({ done: d.done, days: st.days, best: st.best, spoke: st.spoke });
  const more = cleanInt(st.xp, 10000000) - STATS.xp;
  if (more > 0) { addXp(more); saveStats(STATS); updateChips(); }
}
/* ---------- my-planner 서버와 자동으로 맞추기 ---------- */
// 서버 주소와 공부 토큰은 이 기기의 localStorage에만 둔다. 연결되면 앱을 열 때와 진도가 바뀔 때마다 보낸다.
const SYNC_KEY = "aiduo-sync";
let SYNC = (() => { try { const c = JSON.parse(localStorage.getItem(SYNC_KEY) || "null"); return c && c.url && c.token ? c : null; } catch (_) { return null; } })();
let syncState = { status: SYNC ? "idle" : "off", at: SYNC && SYNC.at || null, error: "" }, syncTimer = null, syncBusy = false, syncAgain = false;
function saveSync() { try { SYNC ? localStorage.setItem(SYNC_KEY, JSON.stringify(SYNC)) : localStorage.removeItem(SYNC_KEY); } catch (_) { } }
function normUrl(raw) {
  let u; try { u = new URL(String(raw).trim()); } catch (_) { throw new Error("서버 주소를 읽을 수 없어요. https://로 시작하는 주소를 넣어 주세요."); }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) throw new Error("서버 주소는 https://로 시작해야 해요.");
  return u.origin;
}
const SYNC_ERR = { 401: "토큰이 맞지 않아요. 공부 토큰(STUDY_TOKEN)인지 확인해 주세요.", 404: "서버에 공부 진도 경로가 없어요. 서버에 STUDY_TOKEN을 넣고 다시 켰는지 확인해 주세요.", 422: "서버가 진도를 합치지 못했어요.", 429: "잠시 뒤에 다시 해 주세요.", 503: "서버가 안전 모드예요." };
async function syncOnce(cfg) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(cfg.url + "/api/v1/study/progress", { method: "PUT", headers: { "Authorization": "Bearer " + cfg.token, "Content-Type": "application/json" }, body: JSON.stringify(snapshot()), signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(SYNC_ERR[r.status] || `서버가 ${r.status}로 답했어요.`);
    mergeIn(await r.json());
  } catch (e) {
    if (e.name === "AbortError" || e instanceof TypeError) throw new Error("서버에 닿지 않아요. 노트북과 Tailscale이 켜져 있는지, 서버의 허용 출처에 이 주소가 있는지 확인해 주세요.");
    throw e;
  } finally { clearTimeout(t); }
}
async function syncNow() {
  if (!SYNC) return false;
  if (syncBusy) { syncAgain = true; return false; }
  syncBusy = true; syncState.status = "busy"; drawSyncStatus();
  let ok = false;
  try { await syncOnce(SYNC); ok = true; SYNC.at = Date.now(); saveSync(); syncState = { status: "ok", at: SYNC.at, error: "" }; }
  catch (e) { syncState = { status: "error", at: SYNC && SYNC.at || null, error: e.message }; }
  syncBusy = false; drawSyncStatus();
  if (ok) { const id = location.hash.slice(1) || "home"; if (id === "home") route(); else buildRail(id); }
  if (syncAgain) { syncAgain = false; queueSync(); }
  return ok;
}
function queueSync() { if (!SYNC) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 1200); }
function syncText() {
  if (!SYNC) return "연결 안 됨";
  const when = syncState.at ? new Date(syncState.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
  if (syncState.status === "busy") return "맞추는 중…";
  if (syncState.status === "error") return syncState.error + (when ? ` 마지막으로 맞춘 때: ${when}. 진도는 이 기기에 쌓였다가 다음에 닿을 때 합쳐져요.` : "");
  return when ? `맞춤 · ${when}` : "연결됨";
}
function drawSyncStatus() { const el = document.getElementById("syncstat"); if (el) { el.textContent = syncText(); el.className = "syncstat " + syncState.status; } }
window.addEventListener("online", queueSync);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") queueSync(); });
function connectCode() { return "AIDUOSYNC1." + b64({ url: SYNC.url, token: SYNC.token }); }
function parseConnect(text) {
  const m = String(text).trim().match(/^AIDUOSYNC1\.([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  try { const d = unb64(m[1]); return d && typeof d.url === "string" && typeof d.token === "string" ? d : null; } catch (_) { return null; }
}
function syncBox() {
  const box = h("section", { class: "setbox" }, h("h2", {}, "웹과 앱 진도 자동으로 맞추기"));
  const stat = h("p", { id: "syncstat", class: "syncstat " + syncState.status, role: "status" }, syncText());
  if (SYNC) {
    const msg = h("p", { class: "w-hint", role: "status" });
    box.append(h("p", {}, "my-planner 서버에 연결돼 있어요. 앱을 열 때와 문제를 풀 때마다 진도를 보내고, 다른 기기의 진도와 합칩니다."), h("p", { class: "w-hint" }, "서버: " + SYNC.url), stat,
      h("div", { class: "btns" },
        h("button", { class: "btn pri", type: "button", onclick: syncNow }, "지금 맞추기"),
        h("button", { class: "btn", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(connectCode()); msg.textContent = "연결 정보를 복사했어요. 다른 기기의 이 화면에 붙여 넣으세요. 토큰이 들어 있으니 다른 사람에게 보내지 마세요."; } catch (_) { msg.textContent = "복사하지 못했어요. 다른 기기에서 서버 주소와 토큰을 직접 넣어 주세요."; } } }, "연결 정보 복사"),
        h("button", { class: "btn", type: "button", onclick: () => { SYNC = null; saveSync(); syncState = { status: "off", at: null, error: "" }; route(); } }, "연결 끊기")), msg,
      h("p", { class: "w-hint" }, "합치기만 합니다. 한 기기에서 완료를 취소해도 다른 기기에 완료가 남아 있으면 다시 완료로 돌아와요."));
    return box;
  }
  const url = h("input", { class: "codebox", type: "url", inputmode: "url", autocomplete: "off", placeholder: "https://<기계>.<tailnet>.ts.net", "aria-label": "서버 주소" });
  const tok = h("input", { class: "codebox", type: "password", autocomplete: "off", placeholder: "공부 토큰 (STUDY_TOKEN) 또는 다른 기기에서 복사한 연결 정보", "aria-label": "공부 토큰 또는 연결 정보" });
  const msg = h("p", { class: "w-hint", role: "status" });
  const go = h("button", { class: "btn pri", type: "button" }, "연결");
  go.addEventListener("click", async () => {
    let cfg;
    try {
      const pasted = parseConnect(tok.value) || parseConnect(url.value);
      cfg = pasted ? { url: normUrl(pasted.url), token: pasted.token.trim() } : { url: normUrl(url.value), token: tok.value.trim() };
      if (cfg.token.length < 43 || /\s/.test(cfg.token)) throw new Error("토큰은 43자 이상이에요. 공부 토큰(STUDY_TOKEN)을 그대로 붙여 넣어 주세요.");
    } catch (e) { msg.textContent = e.message; return; }
    go.disabled = true; msg.textContent = "연결하는 중…";
    try { await syncOnce(cfg); SYNC = { ...cfg, at: Date.now() }; saveSync(); syncState = { status: "ok", at: SYNC.at, error: "" }; route(); }
    catch (e) { msg.textContent = e.message; go.disabled = false; }
  });
  box.append(h("p", {}, "my-planner 서버(노트북)에 진도를 두고, 컴퓨터 브라우저와 폰 앱이 같은 진도를 보게 합니다. 서버 주소와 공부 토큰을 기기마다 한 번 넣으면 그 뒤로는 자동이에요."),
    h("h3", {}, "서버 주소"), url, h("h3", {}, "공부 토큰"), tok, go, msg,
    h("p", { class: "w-hint" }, "이미 연결한 기기가 있으면 그 기기의 '연결 정보 복사'로 받은 한 줄을 토큰 칸에 붙여 넣으면 됩니다. 토큰은 이 기기에만 저장됩니다. 서버 설정은 my-planner 저장소 README의 '공부 앱 진도 맞추기'에 있어요."));
  return box;
}
function renderSettings() {
  lessonEl.innerHTML = "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const inst = h("section", { class: "setbox" }, h("h2", {}, "폰에 앱으로 설치"));
  if (isStandalone()) inst.append(h("p", {}, "지금 앱으로 열려 있어요."));
  else if (installEvt) inst.append(h("p", {}, "홈 화면에 아이콘이 생기고, 주소창 없이 앱처럼 열립니다."), h("button", { class: "btn pri", type: "button", onclick: async () => { const e = installEvt; installEvt = null; e.prompt(); try { await e.userChoice; } catch (_) { } route(); } }, "앱 설치"));
  else inst.append(h("p", {}, ios ? "사파리 아래쪽의 공유 버튼을 누르고 '홈 화면에 추가'를 고르세요. 홈 화면 아이콘으로 열면 주소창 없이 앱처럼 열립니다." : "브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 고르세요. 아이폰은 사파리의 공유 버튼에서 '홈 화면에 추가'입니다."));
  inst.append(h("p", { class: "w-hint" }, "한 번 연 뒤에는 인터넷이 없어도 레슨과 연습 문제가 열립니다."));
  const out = h("textarea", { class: "codebox", readonly: "", rows: 4, "aria-label": "내 진도 코드" }); out.value = exportCode();
  const inp = h("textarea", { class: "codebox", rows: 4, placeholder: "다른 기기에서 복사한 진도 코드를 붙여 넣으세요", "aria-label": "가져올 진도 코드" });
  const msg = h("p", { class: "w-hint", role: "status" });
  const sync = h("section", { class: "setbox" }, h("h2", {}, "진도 코드로 옮기기 (서버 없이)"),
    h("p", {}, "서버에 연결하지 않았을 때 쓰는 방법입니다. 한쪽에서 코드를 복사해 다른 쪽에 붙여 넣으면 두 기기의 기록이 합쳐집니다."),
    h("h3", {}, "이 기기의 진도 코드"), out,
    h("button", { class: "btn", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(out.value); msg.textContent = "복사했어요."; } catch (_) { out.select(); msg.textContent = "코드를 길게 눌러 복사하세요."; } } }, "코드 복사"),
    h("h3", {}, "다른 기기의 진도 가져오기"), inp,
    h("button", { class: "btn pri", type: "button", onclick: () => { try { importCode(inp.value); out.value = exportCode(); inp.value = ""; buildRail("settings"); msg.textContent = `가져왔어요. 지금 ${STATS.xp} XP, 완료 ${LESSONS.filter(x => DONE.has(x.id)).length}개입니다.`; } catch (e) { msg.textContent = e.message || "진도 코드를 읽을 수 없어요."; } } }, "가져오기"), msg);
  lessonEl.append(h("div", { class: "eyebrow" }, "설정"), h("h1", {}, "앱 설치와 진도"), inst, syncBox(), sync, h("p", { class: "w-hint" }, "버전 " + APP_BUILD));
  tocEl.innerHTML = "";
}
route();
if (SYNC) syncNow();
