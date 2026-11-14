/* ---------- 앱 설치, 오프라인, 진도 옮기기 ---------- */
const APP_BUILD = "__BUILD__";
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
}
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (location.hash.slice(1) === "settings") route(); });
window.addEventListener("appinstalled", () => { installEvt = null; });
function isStandalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; }
// 진도 코드: 이 기기의 진도를 글자 한 줄로 만들어 다른 기기에 붙여 넣는다
function exportCode() {
  const data = { v: 1, done: [...DONE], stats: STATS };
  return "AIDUO1." + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function importCode(code) {
  const m = String(code).trim().match(/^AIDUO1\.([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error("진도 코드 형식이 아니에요.");
  const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  if (!d || !Array.isArray(d.done) || !d.stats || typeof d.stats.xp !== "number") throw new Error("진도 코드를 읽을 수 없어요.");
  // 두 기기의 기록을 합친다: 완료와 학습일은 합집합, XP와 최고 기록은 큰 쪽
  d.done.filter(x => byId[x]).forEach(x => DONE.add(x)); saveDone(DONE);
  STATS.xp = Math.max(STATS.xp, Math.floor(d.stats.xp) || 0);
  STATS.days = [...new Set([...STATS.days, ...(d.stats.days || []).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x))])].sort();
  for (const k in (d.stats.best || {})) if (byId[k]) STATS.best[k] = Math.max(STATS.best[k] || 0, Math.min(100, +d.stats.best[k] || 0));
  STATS.spoke = STATS.spoke || {};
  for (const k in (d.stats.spoke || {})) if (byId[k]) STATS.spoke[k] = Math.max(STATS.spoke[k] || 0, Math.floor(+d.stats.spoke[k]) || 0);
  saveStats(STATS); updateChips();
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
  const sync = h("section", { class: "setbox" }, h("h2", {}, "진도 옮기기"),
    h("p", {}, "진도, XP, 레벨은 지금 쓰는 기기에만 저장됩니다. 컴퓨터와 폰을 같이 쓰려면 한쪽에서 코드를 복사해 다른 쪽에 붙여 넣으세요. 두 기기의 기록은 합쳐집니다."),
    h("h3", {}, "이 기기의 진도 코드"), out,
    h("button", { class: "btn", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(out.value); msg.textContent = "복사했어요."; } catch (_) { out.select(); msg.textContent = "코드를 길게 눌러 복사하세요."; } } }, "코드 복사"),
    h("h3", {}, "다른 기기의 진도 가져오기"), inp,
    h("button", { class: "btn pri", type: "button", onclick: () => { try { importCode(inp.value); out.value = exportCode(); inp.value = ""; buildRail("settings"); msg.textContent = `가져왔어요. 지금 ${STATS.xp} XP, 완료 ${LESSONS.filter(x => DONE.has(x.id)).length}개입니다.`; } catch (e) { msg.textContent = e.message || "진도 코드를 읽을 수 없어요."; } } }, "가져오기"), msg);
  lessonEl.append(h("div", { class: "eyebrow" }, "설정"), h("h1", {}, "앱 설치와 진도"), inst, sync, h("p", { class: "w-hint" }, "버전 " + APP_BUILD));
  tocEl.innerHTML = "";
}
route();
