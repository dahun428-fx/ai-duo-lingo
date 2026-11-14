/* ---------- helpers ---------- */
const SVGNS = "http://www.w3.org/2000/svg";
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}
function s(tag, attrs = {}, text) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}
let UID = 0;
const REDRAW = [];
function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function fmt(x, d = 3) { if (!isFinite(x)) return x > 0 ? "∞" : "−∞"; return (Math.round(x * 10 ** d) / 10 ** d).toString().replace("-", "−"); }
function shell(root, lab, title, hint) {
  root.innerHTML = "";
  root.append(h("div", { class: "w-head" }, h("span", { class: "lab" }, lab), h("b", {}, title)));
  const body = h("div", { class: "w-body" });
  if (hint) body.append(h("p", { class: "w-hint" }, hint));
  root.append(body);
  return body;
}
function slider(label, min, max, step, val, on, f = v => v) {
  const id = "sl" + (++UID);
  const out = h("output", { for: id }, f(val));
  const inp = h("input", { type: "range", id, min, max, step, value: val });
  inp.addEventListener("input", () => { out.textContent = f(+inp.value); on(+inp.value); });
  const el = h("label", { class: "sl", for: id }, h("span", { class: "row" }, h("span", {}, label), out), inp);
  return { el, get v() { return +inp.value; }, set(v) { inp.value = v; out.textContent = f(+inp.value); } };
}
function ro(label, big) {
  const b = h("b", {}, "–");
  const el = h("div", { class: "ro" + (big ? " big" : "") }, h("small", {}, label), b);
  return { el, set(v) { b.textContent = v; } };
}
function btn(text, on, cls = "") { return h("button", { class: "btn " + cls, type: "button", onclick: on }, text); }
function randn() { let u = 0, v = 0; while (u === 0) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function softmax(z) { const m = Math.max(...z); const e = z.map(x => Math.exp(x - m)); const S = e.reduce((a, b) => a + b, 0); return e.map(x => x / S); }
function setupCanvas(cv, w, hgt) { const r = window.devicePixelRatio || 1; cv.width = w * r; cv.height = hgt * r; cv.style.width = w + "px"; cv.style.aspectRatio = w + " / " + hgt; const c = cv.getContext("2d"); c.setTransform(r, 0, 0, r, 0, 0); return c; }

const W = {};

/* ---------- 1. paper map ---------- */
W.papermap = function (root) {
  const body = shell(root, "논문 지도", "Seq2Seq 번역 과정 따라가기", "버튼을 누르면 영어 문장 \"A B C\"가 프랑스어 \"W X Y Z\"로 번역되는 과정을 한 단계씩 보여 줍니다. 노란색이 지금 일하는 부분입니다.");
  const svg = s("svg", { viewBox: "0 0 790 270", width: 790, height: 270, role: "img", "aria-label": "인코더와 디코더 구조도" });
  const defs = s("defs");
  const mk = s("marker", { id: "arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
  mk.append(s("path", { d: "M0 0L10 5L0 10z", class: "s-muted" }));
  defs.append(mk); svg.append(defs);
  const node = (id, x, y, w, hh, label, cls = "") => {
    const g = s("g", { "data-id": id, class: "pm-n " + cls });
    g.append(s("rect", { x, y, width: w, height: hh, rx: 8, class: cls.includes("cell") ? "s-card k-ink" : "s-paper", "stroke-width": cls.includes("cell") ? 1.5 : 0, fill: "transparent" }));
    g.append(s("text", { x: x + w / 2, y: y + hh / 2 + 5, "text-anchor": "middle", "font-size": cls.includes("cell") ? 13 : 15, "font-weight": cls.includes("cell") ? 600 : 500, class: "s-ink" }, label));
    svg.append(g); return g;
  };
  const line = (x1, y1, x2, y2, dash) => svg.append(s("line", { x1, y1, x2, y2, class: "k-muted", "stroke-width": 1.4, "marker-end": "url(#arr)", "stroke-dasharray": dash ? "4 4" : "none" }));
  svg.append(s("rect", { x: 14, y: 96, width: 316, height: 94, rx: 14, fill: "none", class: "k-line", "stroke-dasharray": "5 5" }));
  svg.append(s("rect", { x: 388, y: 96, width: 392, height: 94, rx: 14, fill: "none", class: "k-line", "stroke-dasharray": "5 5" }));
  svg.append(s("text", { x: 22, y: 88, "font-size": 12, class: "s-muted" }, "인코더 · 입력을 읽는다 (뒤집은 순서)"));
  svg.append(s("text", { x: 396, y: 88, "font-size": 12, class: "s-muted" }, "디코더 · 한 단어씩 쓴다"));
  const inp = ["C", "B", "A"];
  inp.forEach((t, i) => {
    const x = 30 + i * 100;
    node("e" + i, x, 120, 74, 46, "LSTM", "cell");
    node("in" + i, x + 17, 214, 40, 30, t);
    line(x + 37, 213, x + 37, 168);
    if (i < 2) line(x + 74, 143, x + 98, 143);
  });
  line(304, 143, 324, 143);
  const vg = s("g", { "data-id": "v", class: "pm-n" });
  vg.append(s("circle", { cx: 346, cy: 143, r: 20, class: "s-card k-acc", "stroke-width": 2 }));
  vg.append(s("text", { x: 346, y: 149, "text-anchor": "middle", "font-size": 16, "font-weight": 700, class: "s-acc" }, "v"));
  svg.append(vg);
  line(366, 143, 398, 143);
  const din = ["<EOS>", "W", "X", "Y", "Z"], dout = ["W", "X", "Y", "Z", "<EOS>"];
  din.forEach((t, i) => {
    const x = 400 + i * 76;
    node("d" + i, x, 120, 60, 46, "LSTM", "cell");
    node("din" + i, x + 2, 214, 56, 30, t);
    node("out" + i, x + 2, 26, 56, 30, dout[i]);
    line(x + 30, 213, x + 30, 168);
    line(x + 30, 120, x + 30, 58);
    if (i < 4) line(x + 60, 143, x + 74, 143);
    if (i < 4) svg.append(s("path", { d: `M${x + 52} 41 C ${x + 90} 60, ${x + 64} 210, ${x + 80} 222`, fill: "none", class: "k-acc", "stroke-width": 1.1, "stroke-dasharray": "3 4", opacity: .55, "marker-end": "url(#arr)" }));
  });
  const steps = [
    [[], "▶ 다음을 눌러 시작하세요. 점선 화살표는 '방금 만든 단어를 다음 칸 입력으로 넣는다'는 뜻입니다."],
    [["in0", "e0"], "인코더가 첫 단어 'C'를 읽습니다. 단어는 먼저 1000차원 벡터(임베딩)로 바뀝니다.", "day01"],
    [["in1", "e1"], "'B'를 읽으며, 앞에서 읽은 내용(은닉 상태)과 합칩니다. 이 안의 계산은 전부 Wx + b입니다.", "day02"],
    [["in2", "e2"], "마지막 'A'까지 읽었습니다. 입력을 뒤집었기 때문에 원문 첫 단어 A가 번역 시작 지점과 가장 가깝습니다.", "roadmap"],
    [["v"], "인코더의 마지막 상태가 문장 전체를 담은 벡터 v가 됩니다. 이제 v만 들고 디코더로 넘어갑니다.", "day10"],
    [["din0", "d0", "out0"], "디코더가 v에서 출발해 첫 단어의 확률을 계산합니다. 80,000개 단어에 소프트맥스를 씌워 'W'가 가장 높게 나왔습니다.", "day05"],
    [["din1", "d1", "out1"], "방금 쓴 'W'를 다음 칸 입력으로 넣고 'X'를 예측합니다. 학습 때는 여기에 모델 예측 대신 정답을 넣어 줍니다(teacher forcing).", "day10"],
    [["din2", "d2", "out2", "din3", "d3", "out3"], "같은 과정을 반복합니다. 단계별 확률을 모두 곱하면 문장 전체의 확률, 논문의 식 (1)이 됩니다.", "day03"],
    [["din4", "d4", "out4"], "<EOS>가 나오면 멈춥니다. 학습은 정답 단어들의 −log 확률 합(크로스엔트로피)을 줄이는 방향으로 진행됩니다.", "day07"]
  ];
  let k = 0, timer = null;
  const cap = h("p", { class: "w-hint", style: "min-height:3.4em;color:var(--ink)" });
  const counter = h("span", { class: "w-hint", style: "font-family:var(--f-mono)" });
  function show() {
    svg.querySelectorAll(".pm-n").forEach(g => g.classList.toggle("on", steps[k][0].includes(g.dataset.id)));
    cap.innerHTML = ""; cap.append(steps[k][1]);
    if (steps[k][2]) { cap.append(" "); cap.append(h("a", { href: "#" + steps[k][2] }, steps[k][2] === "roadmap" ? "→ 3주차 Day 14" : "→ " + steps[k][2].replace("day", "Day "))); }
    counter.textContent = k + " / " + (steps.length - 1);
  }
  const playB = btn("자동 재생", () => {
    if (timer) { clearInterval(timer); timer = null; playB.textContent = "자동 재생"; return; }
    playB.textContent = "멈춤";
    timer = setInterval(() => { k = (k + 1) % steps.length; show(); if (k === steps.length - 1) { clearInterval(timer); timer = null; playB.textContent = "자동 재생"; } }, 2600);
  });
  body.append(h("div", { class: "svgwrap" }, svg), cap,
    h("div", { class: "btns" }, btn("처음", () => { k = 0; show(); }), btn("이전", () => { k = Math.max(0, k - 1); show(); }), btn("다음", () => { k = Math.min(steps.length - 1, k + 1); show(); }, "pri"), playB, counter));
  const st = h("style", {}, `.pm-n.on rect{fill:var(--mark)!important}.pm-n.on text{fill:var(--mark-ink)!important;font-weight:700}.pm-n.on circle{fill:var(--mark)}`);
  root.append(st);
  show();
};

/* ---------- 2. dot product ---------- */
W.dot = function (root) {
  const body = shell(root, "실습 · Day 01", "벡터 두 개를 끌어서 내적 느끼기", "파란 화살표 a와 초록 화살표 b의 끝점을 드래그하세요. 방향이 비슷할수록 코사인이 1에 가까워집니다.");
  const S = 300, sc = 60, O = S / 2;
  const svg = s("svg", { viewBox: `0 0 ${S} ${S}`, width: S, height: S, style: "touch-action:none;max-width:100%;height:auto" });
  for (let i = -2; i <= 2; i++) {
    svg.append(s("line", { x1: O + i * sc, y1: 0, x2: O + i * sc, y2: S, class: "k-line", "stroke-width": i === 0 ? 1.5 : 1 }));
    svg.append(s("line", { y1: O + i * sc, x1: 0, y2: O + i * sc, x2: S, class: "k-line", "stroke-width": i === 0 ? 1.5 : 1 }));
    if (i) svg.append(s("text", { x: O + i * sc + 3, y: O + 13, "font-size": 10, class: "s-muted" }, i));
  }
  const vec = { a: [0.9, 0.8], b: [0.8, 0.9] };
  const col = { a: "accent", b: "good" };
  const els = {};
  const arc = s("path", { fill: "none", class: "k-muted", "stroke-width": 1.2, "stroke-dasharray": "3 3" });
  svg.append(arc);
  for (const n of ["a", "b"]) {
    const ln = s("line", { x1: O, y1: O, class: "k-" + (col[n] === "accent" ? "acc" : "good"), "stroke-width": 3, "stroke-linecap": "round" });
    const hd = s("circle", { r: 11, class: "s-" + (col[n] === "accent" ? "acc" : "good"), style: "cursor:grab", "fill-opacity": .85 });
    const tx = s("text", { "font-size": 14, "font-weight": 700, class: "s-ink" }, n);
    svg.append(ln, hd, tx); els[n] = { ln, hd, tx };
    hd.addEventListener("pointerdown", e => { hd.setPointerCapture(e.pointerId); drag = n; });
    hd.addEventListener("pointerup", () => drag = null);
  }
  let drag = null;
  svg.addEventListener("pointermove", e => {
    if (!drag) return;
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) * S / r.width, py = (e.clientY - r.top) * S / r.height;
    let x = Math.round(((px - O) / sc) * 10) / 10, y = Math.round(((O - py) / sc) * 10) / 10;
    x = Math.max(-2.4, Math.min(2.4, x)); y = Math.max(-2.4, Math.min(2.4, y));
    if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05) return;
    vec[drag] = [x, y]; draw();
  });
  const rA = ro("a"), rB = ro("b"), rD = ro("a · b (내적)"), rC = ro("코사인 유사도", true), rT = ro("사이 각도");
  const calc = h("div", { class: "calc" });
  function draw() {
    for (const n of ["a", "b"]) {
      const [x, y] = vec[n]; const X = O + x * sc, Y = O - y * sc;
      els[n].ln.setAttribute("x2", X); els[n].ln.setAttribute("y2", Y);
      els[n].hd.setAttribute("cx", X); els[n].hd.setAttribute("cy", Y);
      els[n].tx.setAttribute("x", X + 12); els[n].tx.setAttribute("y", Y - 10);
    }
    const [a1, a2] = vec.a, [b1, b2] = vec.b;
    const d = a1 * b1 + a2 * b2, na = Math.hypot(a1, a2), nb = Math.hypot(b1, b2), c = d / (na * nb);
    const ang = Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
    const t1 = Math.atan2(a2, a1), t2 = Math.atan2(b2, b1);
    const R = 26;
    let dt = t2 - t1; while (dt > Math.PI) dt -= 2 * Math.PI; while (dt < -Math.PI) dt += 2 * Math.PI;
    const p1 = [O + R * Math.cos(t1), O - R * Math.sin(t1)], p2 = [O + R * Math.cos(t1 + dt), O - R * Math.sin(t1 + dt)];
    arc.setAttribute("d", `M${p1[0]} ${p1[1]} A ${R} ${R} 0 0 ${dt > 0 ? 0 : 1} ${p2[0]} ${p2[1]}`);
    rA.set(`[${fmt(a1, 1)}, ${fmt(a2, 1)}]`); rB.set(`[${fmt(b1, 1)}, ${fmt(b2, 1)}]`);
    rD.set(fmt(d, 2)); rC.set(fmt(c, 3)); rT.set(fmt(ang, 0) + "°");
    calc.textContent = `a·b = ${fmt(a1,1)}×${fmt(b1,1)} + ${fmt(a2,1)}×${fmt(b2,1)} = ${fmt(d,2)}\n‖a‖ = ${fmt(na,3)},  ‖b‖ = ${fmt(nb,3)}\ncos = ${fmt(d,2)} / (${fmt(na,3)} × ${fmt(nb,3)}) = ${fmt(c,3)}   ${c > .9 ? "→ 거의 같은 방향" : c > .2 ? "→ 비슷한 편" : c > -.2 ? "→ 거의 직각 (무관)" : "→ 반대 방향"}`;
  }
  const preset = (a, b) => () => { vec.a = a; vec.b = b; draw(); };
  body.append(
    h("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start" },
      h("div", { style: "flex:0 1 300px;min-width:0" }, svg),
      h("div", { style: "flex:1 1 220px;display:grid;gap:8px;min-width:0" },
        h("div", { class: "readout" }, rA.el, rB.el, rD.el), h("div", { class: "readout" }, rC.el, rT.el),
        h("div", { class: "btns" }, btn("고양이 · 강아지", preset([0.9, 0.8], [0.8, 0.9])), btn("고양이 · 자동차", preset([0.9, 0.8], [-0.7, 0.2])), btn("직각", preset([1, 0], [0, 1])), btn("정반대", preset([1, 1], [-1, -1])), btn("길이만 2배", () => { vec.b = [vec.a[0] * 2, vec.a[1] * 2]; draw(); })))),
    calc);
  draw();
};

/* ---------- 3. matrix × vector ---------- */
W.matvec = function (root) {
  const body = shell(root, "실습 · Day 02", "행렬 × 벡터 계산기", "숫자를 바꿔 보세요. 결과 y의 칸에 마우스를 올리면(또는 탭하면) 그 칸을 만든 W의 행이 노랗게 표시됩니다.");
  const Wm = [[1, -1, 0], [2, 0, 1]], x = [3, 1, 2], b = [0.5, -1];
  let relu = true;
  const mkIn = (arr, i, j) => { const e = h("input", { class: "numin", type: "number", step: "0.5", value: j == null ? arr[i] : arr[i][j], "aria-label": "값" }); e.addEventListener("input", () => { const v = parseFloat(e.value) || 0; if (j == null) arr[i] = v; else arr[i][j] = v; calc(); }); return e; };
  const wIn = Wm.map((r, i) => r.map((_, j) => mkIn(Wm, i, j)));
  const xIn = x.map((_, i) => mkIn(x, i));
  const bIn = b.map((_, i) => mkIn(b, i));
  const yOut = [0, 1].map(i => h("div", { class: "numin", style: "width:auto;min-width:58px;font-weight:700;color:var(--accent);cursor:pointer", tabindex: 0 }));
  const matW = h("div", { class: "mat", style: "grid-template-columns:repeat(3,auto)" }, ...wIn.flat());
  const matX = h("div", { class: "mat" }, ...xIn);
  const matB = h("div", { class: "mat" }, ...bIn);
  const matY = h("div", { class: "mat" }, ...yOut);
  const lines = h("div", { class: "calc" });
  const reluB = btn("ReLU 켜짐", () => { relu = !relu; reluB.textContent = relu ? "ReLU 켜짐" : "ReLU 꺼짐"; reluB.classList.toggle("on", relu); calc(); }, "on");
  function hl(i) { wIn.forEach((r, k) => r.forEach(e => e.classList.toggle("hl", k === i))); xIn.forEach(e => e.classList.toggle("hl", i != null)); bIn.forEach((e, k) => e.classList.toggle("hl", k === i)); }
  yOut.forEach((e, i) => { e.addEventListener("mouseenter", () => hl(i)); e.addEventListener("mouseleave", () => hl(null)); e.addEventListener("focus", () => hl(i)); e.addEventListener("blur", () => hl(null)); });
  function calc() {
    const out = [];
    let txt = "";
    for (let i = 0; i < 2; i++) {
      const terms = Wm[i].map((w, j) => `${fmt(w, 2)}·${fmt(x[j], 2)}`).join(" + ");
      const z = Wm[i].reduce((a, w, j) => a + w * x[j], 0) + b[i];
      const y = relu ? Math.max(0, z) : z;
      out.push(y);
      yOut[i].textContent = fmt(y, 2);
      txt += `y${i + 1} = ${relu ? "ReLU(" : ""}${terms} + ${fmt(b[i], 2)}${relu ? ")" : ""} = ${relu ? `ReLU(${fmt(z, 2)}) = ` : ""}${fmt(y, 2)}\n`;
    }
    txt += `\nshape: W (2, 3) × x (3,) + b (2,) → y (2,)    파라미터 수 = 2×3 + 2 = 8`;
    lines.textContent = txt;
  }
  const sym = t => h("span", { style: "font-size:20px;color:var(--muted)" }, t);
  // shape checker
  const m = h("input", { class: "numin", type: "number", value: 1000, "aria-label": "행 수 m" });
  const n = h("input", { class: "numin", type: "number", value: 160000, style: "width:80px", "aria-label": "열 수 n" });
  const k = h("input", { class: "numin", type: "number", value: 160000, style: "width:80px", "aria-label": "벡터 길이" });
  const res = h("p", {});
  function shape() {
    const M = +m.value, N = +n.value, K = +k.value;
    res.innerHTML = "";
    if (N === K) res.append(h("span", { class: "badge good" }, "곱할 수 있음"), ` 결과 shape = (${M},)  ·  W의 파라미터 ${(M * N).toLocaleString()}개`);
    else res.append(h("span", { class: "badge bad" }, "곱할 수 없음"), ` 안쪽 숫자 ${N} ≠ ${K}`);
  }
  [m, n, k].forEach(e => e.addEventListener("input", shape));
  body.append(
    h("div", { class: "matrow" }, h("div", {}, h("small", { class: "w-hint" }, "W (2×3)"), h("br"), matW), sym("×"), h("div", {}, h("small", { class: "w-hint" }, "x"), h("br"), matX), sym("+"), h("div", {}, h("small", { class: "w-hint" }, "b"), h("br"), matB), sym("→"), h("div", {}, h("small", { class: "w-hint" }, "y"), h("br"), matY)),
    h("div", { class: "btns" }, reluB, btn("예제로 되돌리기", () => { [[1, -1, 0], [2, 0, 1]].forEach((r, i) => r.forEach((v, j) => { Wm[i][j] = v; wIn[i][j].value = v; })); [3, 1, 2].forEach((v, i) => { x[i] = v; xIn[i].value = v; }); [0.5, -1].forEach((v, i) => { b[i] = v; bIn[i].value = v; }); calc(); })),
    lines,
    h("div", { style: "border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:8px" },
      h("b", {}, "shape 맞추기 연습"),
      h("div", { class: "matrow" }, "W (", m, ",", n, ") × x (", k, ",)"), res,
      h("p", { class: "w-hint" }, "기본값은 논문의 입력 임베딩 크기(1000 × 160,000)입니다. 세 번째 칸을 바꿔 에러를 만들어 보세요.")));
  calc(); shape();
};

/* ---------- 4. conditional probability + chain rule ---------- */
W.condprob = function (root) {
  const body = shell(root, "실습 · Day 03", "조건을 걸면 분모가 바뀐다", "버튼으로 '누구 중에서' 볼지 고르세요. 노란 칸이 분자, 굵은 테두리가 분모(관심 범위)입니다.");
  const C = [[30, 10], [20, 40]];
  const rows = ["코딩 좋아함", "코딩 안 좋아함"], cols = ["안경 O", "안경 X"];
  const cells = [[], []];
  const tbl = h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, cols[0]), h("th", {}, cols[1]), h("th", {}, "합계"))));
  const tb = h("tbody");
  rows.forEach((r, i) => { const tr = h("tr", {}, h("th", {}, r)); C[i].forEach((c, j) => { const td = h("td", { style: "font-family:var(--f-mono);text-align:center;transition:all .2s" }, c); cells[i][j] = td; tr.append(td); }); tr.append(h("td", { style: "text-align:center;color:var(--muted)" }, C[i][0] + C[i][1])); tb.append(tr); });
  tb.append(h("tr", {}, h("th", {}, "합계"), h("td", { style: "text-align:center;color:var(--muted)" }, 50), h("td", { style: "text-align:center;color:var(--muted)" }, 50), h("td", { style: "text-align:center;color:var(--muted)" }, 100)));
  tbl.append(tb);
  const out = h("div", { class: "calc" });
  const modes = {
    all: { den: [[0, 0], [0, 1], [1, 0], [1, 1]], txt: "P(코딩, 안경) = 둘 다인 사람 / 전체 = 30 / 100 = 0.30\n→ 결합확률: 관심 범위는 학생 전체" },
    row: { den: [[0, 0], [0, 1]], txt: "P(안경 | 코딩) = 30 / (30 + 10) = 30 / 40 = 0.75\n→ 코딩 좋아하는 40명만 남기고, 그중 안경 쓴 비율" },
    col: { den: [[0, 0], [1, 0]], txt: "P(코딩 | 안경) = 30 / (30 + 20) = 30 / 50 = 0.60\n→ 안경 쓴 50명만 남기고, 그중 코딩 좋아하는 비율\n같은 30명인데 분모가 달라서 답이 다릅니다. (내일 베이즈 정리가 이 둘을 잇습니다)" }
  };
  const bs = {};
  function set(mo) {
    Object.values(bs).forEach(b => b.classList.remove("on")); bs[mo].classList.add("on");
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const inDen = modes[mo].den.some(([a, b]) => a === i && b === j);
      cells[i][j].classList.toggle("hl", i === 0 && j === 0);
      cells[i][j].style.outline = inDen ? "2px solid var(--ink)" : "none";
      cells[i][j].style.opacity = inDen ? 1 : .3;
    }
    out.textContent = modes[mo].txt;
  }
  bs.all = btn("전체 중에서", () => set("all")); bs.row = btn("코딩 좋아하는 사람 중에서", () => set("row")); bs.col = btn("안경 쓴 사람 중에서", () => set("col"));
  // chain rule builder
  const words = ["나는", "밥을", "먹었다", "<EOS>"];
  const conds = ["p(나는)", "p(밥을 | 나는)", "p(먹었다 | 나는, 밥을)", "p(<EOS> | 나는, 밥을, 먹었다)"];
  const ps = [0.6, 0.5, 0.9, 0.8];
  const bar = h("div", { style: "height:14px;border-radius:7px;background:var(--line);overflow:hidden" }, h("i", { style: "display:block;height:100%;background:var(--accent);transition:width .2s" }));
  const chainTxt = h("div", { class: "calc" });
  const sls = ps.map((p, i) => slider(conds[i], 0.01, 1, 0.01, p, v => { ps[i] = v; chain(); }, v => v.toFixed(2)));
  function chain() {
    const prod = ps.reduce((a, b) => a * b, 1), lg = ps.reduce((a, b) => a + Math.log(b), 0);
    bar.firstChild.style.width = (prod * 100) + "%";
    chainTxt.textContent = `P("나는 밥을 먹었다") = ${ps.map(p => p.toFixed(2)).join(" × ")} = ${fmt(prod, 4)}\nlog P = ${ps.map(p => fmt(Math.log(p), 3)).join(" + ")} = ${fmt(lg, 3)}`;
  }
  // underflow
  const uTxt = h("div", { class: "calc" });
  let up = 0.5, un = 50;
  const u1 = slider("단어마다 정답 확률", 0.05, 0.99, 0.01, up, v => { up = v; uf(); }, v => v.toFixed(2));
  const u2 = slider("문장 길이 (단어 수)", 1, 3000, 1, un, v => { un = v; uf(); });
  function uf() {
    const prod = Math.pow(up, un), lg = un * Math.log(up);
    uTxt.textContent = `곱: ${up.toFixed(2)}^${un} = ${prod === 0 ? "0  ← underflow! 컴퓨터가 0으로 뭉갰습니다" : prod.toExponential(3)}\n로그 합: ${un} × ${fmt(Math.log(up), 4)} = ${fmt(lg, 2)}  ← 로그는 멀쩡합니다 (Day 05)`;
  }
  body.append(h("div", { class: "btns" }, bs.all, bs.row, bs.col), h("div", { class: "tablewrap" }, tbl), out,
    h("div", { style: "border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:10px" },
      h("b", {}, "연쇄법칙: 문장 확률 = 단계별 조건부확률의 곱"), h("div", { class: "ctrls" }, ...sls.map(x => x.el)), bar, chainTxt),
    h("div", { style: "border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:10px" },
      h("b", {}, "긴 문장의 함정: 곱하면 0으로 사라진다"), h("div", { class: "ctrls" }, u1.el, u2.el), uTxt));
  set("row"); chain(); uf();
};

/* ---------- 5. Bayes ---------- */
W.bayes = function (root) {
  const body = shell(root, "실습 · Day 04", "1,000명 마을의 건강검진", "점 하나가 한 사람입니다. 슬라이더를 움직여 양성 판정 중 진짜 환자가 몇 명인지 세어 보세요.");
  let prior = 1, sens = 90, fpr = 5;
  const cv = h("canvas", { role: "img", "aria-label": "1000명 점 그림" });
  const CW = 560, CH = 360;
  const leg = h("div", { class: "btns", style: "font-size:13px;gap:14px" });
  const big = ro("양성일 때 실제 병일 확률 P(병|양성)", true), tp = ro("병 + 양성"), fp = ro("건강 + 양성"), pos = ro("양성 전체");
  const calc = h("div", { class: "calc" });
  const sP = slider("유병률 (사전확률)", 0.1, 50, 0.1, prior, v => { prior = v; draw(); }, v => v.toFixed(1) + "%");
  const sS = slider("민감도 P(양성|병)", 50, 100, 1, sens, v => { sens = v; draw(); }, v => v + "%");
  const sF = slider("오탐률 P(양성|건강)", 0, 30, 0.5, fpr, v => { fpr = v; draw(); }, v => v + "%");
  function draw() {
    const c = setupCanvas(cv, CW, CH);
    const N = 1000, sick = Math.round(N * prior / 100), TP = Math.round(sick * sens / 100), FN = sick - TP;
    const healthy = N - sick, FP = Math.round(healthy * fpr / 100);
    const col = { tp: cssv("--accent"), fn: cssv("--accent"), fp: cssv("--bad"), tn: cssv("--line") };
    const kinds = []; for (let i = 0; i < TP; i++) kinds.push("tp"); for (let i = 0; i < FN; i++) kinds.push("fn"); for (let i = 0; i < FP; i++) kinds.push("fp"); while (kinds.length < N) kinds.push("tn");
    const cols = 40, cell = 14;
    kinds.forEach((kd, i) => {
      const x = (i % cols) * cell + 1, y = Math.floor(i / cols) * cell + 1;
      c.beginPath(); c.arc(x + 6, y + 6, 5, 0, Math.PI * 2);
      if (kd === "fn") { c.strokeStyle = col.fn; c.lineWidth = 1.5; c.stroke(); } else { c.fillStyle = col[kd]; c.fill(); }
    });
    const p = prior / 100, se = sens / 100, f = fpr / 100, ev = se * p + f * (1 - p), post = ev ? se * p / ev : 0;
    big.set((post * 100).toFixed(1) + "%"); tp.set(TP + "명"); fp.set(FP + "명"); pos.set((TP + FP) + "명");
    calc.textContent = `P(양성) = ${se}×${fmt(p, 4)} + ${f}×${fmt(1 - p, 4)} = ${fmt(ev, 5)}\nP(병|양성) = ${se}×${fmt(p, 4)} / ${fmt(ev, 5)} = ${fmt(post, 4)}\n점으로 세면: 양성 ${TP + FP}명 중 진짜 환자 ${TP}명 (1,000명 기준 반올림)`;
    leg.innerHTML = "";
    [["tp", "병 + 양성"], ["fn", "병 + 음성 (놓침)"], ["fp", "건강 + 양성 (오탐)"], ["tn", "건강 + 음성"]].forEach(([kd, t]) => leg.append(h("span", { style: "display:inline-flex;align-items:center;gap:6px" }, h("i", { style: `width:11px;height:11px;border-radius:50%;display:inline-block;${kd === "fn" ? "border:1.5px solid " + col.fn : "background:" + col[kd]}` }), t)));
  }
  REDRAW.push(() => root.isConnected && draw());
  body.append(h("div", { class: "ctrls" }, sP.el, sS.el, sF.el), h("div", { class: "readout" }, big.el, tp.el, fp.el, pos.el), h("div", { style: "overflow-x:auto" }, cv), leg, calc,
    h("div", { class: "btns" }, btn("두 번째 검사도 양성 → 사후를 새 사전으로", () => { const p = prior / 100, se = sens / 100, f = fpr / 100; const post = se * p / (se * p + f * (1 - p)); prior = Math.min(50, Math.max(0.1, Math.round(post * 1000) / 10)); sP.set(prior); draw(); }, "pri"), btn("처음 예제 (1% · 90% · 5%)", () => { prior = 1; sens = 90; fpr = 5; sP.set(1); sS.set(90); sF.set(5); draw(); })),
    h("p", { class: "w-hint" }, "슬라이더 범위 때문에 두 번째 검사 후 유병률은 최대 50%까지만 표시됩니다."));
  draw();
};

/* ---------- 6. softmax ---------- */
W.softmax = function (root) {
  const body = shell(root, "실습 · Day 05", "점수를 확률로 바꾸는 소프트맥스", "디코더가 \"the cat sat on the ___\" 다음 단어에 매긴 점수(logit)입니다. 점수와 온도를 바꿔 보세요.");
  const words = ["mat", "floor", "dog", "car"], z = [2, 1, 0, -1];
  let T = 1;
  const BW = 520, BH = 210;
  const svg = s("svg", { viewBox: `0 0 ${BW} ${BH}`, width: BW, height: BH, style: "max-width:100%;height:auto" });
  const table = h("div", { class: "tablewrap" });
  const sls = z.map((v, i) => slider(`logit: ${words[i]}`, -5, 5, 0.1, v, x => { z[i] = x; draw(); }, x => x.toFixed(1)));
  const sT = slider("온도 T (temperature)", 0.1, 5, 0.1, T, x => { T = x; draw(); }, x => x.toFixed(1));
  function draw() {
    const zt = z.map(v => v / T), p = softmax(zt), e = zt.map(v => Math.exp(v)), S = e.reduce((a, b) => a + b, 0);
    const am = p.indexOf(Math.max(...p));
    svg.innerHTML = "";
    const base = BH - 30, top = 20, bw = 80, gap = (BW - 40 - bw * 4) / 3;
    [0, .25, .5, .75, 1].forEach(t => { const y = base - t * (base - top); svg.append(s("line", { x1: 30, x2: BW - 6, y1: y, y2: y, class: "k-line" })); svg.append(s("text", { x: 2, y: y + 4, "font-size": 10, class: "s-muted" }, t.toFixed(2))); });
    p.forEach((v, i) => {
      const x = 40 + i * (bw + gap), hh = v * (base - top);
      svg.append(s("rect", { x, y: base - hh, width: bw, height: Math.max(hh, 0.5), rx: 4, class: i === am ? "s-acc" : "s-muted", "fill-opacity": i === am ? 1 : .45 }));
      svg.append(s("text", { x: x + bw / 2, y: base - hh - 6, "text-anchor": "middle", "font-size": 13, "font-weight": 700, class: "s-ink" }, v.toFixed(3)));
      svg.append(s("text", { x: x + bw / 2, y: base + 18, "text-anchor": "middle", "font-size": 13, class: "s-ink" }, words[i] + (i === am ? " ★" : "")));
    });
    table.innerHTML = "";
    const t = h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "단어"), h("th", {}, "z"), h("th", {}, "z / T"), h("th", {}, "e^(z/T)"), h("th", {}, "확률 = e / 합"))));
    const tb = h("tbody"); words.forEach((w, i) => tb.append(h("tr", {}, h("td", {}, w), h("td", {}, fmt(z[i], 1)), h("td", {}, fmt(zt[i], 2)), h("td", {}, fmt(e[i], 3)), h("td", {}, fmt(p[i], 3)))));
    tb.append(h("tr", {}, h("td", {}, "합"), h("td", {}, ""), h("td", {}, ""), h("td", {}, fmt(S, 3)), h("td", {}, "1.000")));
    t.append(tb); table.append(t);
  }
  body.append(h("div", { class: "ctrls" }, ...sls.map(x => x.el), sT.el), h("div", { class: "svgwrap" }, svg), table,
    h("div", { class: "btns" }, btn("모두 같은 점수", () => { z.fill(1); sls.forEach(x => x.set(1)); draw(); }), btn("모두 +10 (차이만 중요!)", () => { for (let i = 0; i < 4; i++) { z[i] = Math.min(5, z[i] + 3); sls[i].set(z[i]); } draw(); }), btn("T = 0.2 (확신)", () => { T = 0.2; sT.set(0.2); draw(); }), btn("T = 5 (무작위)", () => { T = 5; sT.set(5); draw(); }), btn("초기화", () => { [2, 1, 0, -1].forEach((v, i) => { z[i] = v; sls[i].set(v); }); T = 1; sT.set(1); draw(); })),
    h("p", { class: "w-hint" }, "확인해 볼 것: 모든 점수에 같은 값을 더해도 확률이 변하지 않나요? (이게 '최댓값 빼기' 트릭이 가능한 이유)"));
  draw();
};

/* ---------- 7. entropy ---------- */
W.entropy = function (root) {
  const body = shell(root, "실습 · Day 06", "불확실성 측정기", "위는 동전, 아래는 결과가 4가지인 상황입니다. 분포를 바꾸며 엔트로피가 언제 커지고 작아지는지 보세요.");
  const H2 = p => -p.filter(x => x > 0).reduce((a, x) => a + x * Math.log2(x), 0);
  const PW = 360, PH = 190, L = 34, Rr = 10, Tt = 12, B = 30;
  const svg = s("svg", { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: "max-width:100%;height:auto" });
  const X = q => L + q * (PW - L - Rr), Y = v => PH - B - v * (PH - B - Tt);
  [0, .5, 1].forEach(v => { svg.append(s("line", { x1: L, x2: PW - Rr, y1: Y(v), y2: Y(v), class: "k-line" })); svg.append(s("text", { x: 4, y: Y(v) + 4, "font-size": 10, class: "s-muted" }, v + " bit")); });
  [0, .5, 1].forEach(q => svg.append(s("text", { x: X(q), y: PH - 12, "text-anchor": "middle", "font-size": 10, class: "s-muted" }, "q=" + q)));
  let d = ""; for (let i = 0; i <= 100; i++) { const q = i / 100; d += (i ? "L" : "M") + X(q) + " " + Y(H2([q, 1 - q])); }
  svg.append(s("path", { d, fill: "none", class: "k-acc", "stroke-width": 2.5 }));
  const pt = s("circle", { r: 7, class: "s-acc" }); const ptx = s("text", { "font-size": 12, "font-weight": 700, class: "s-ink" });
  svg.append(pt, ptx);
  const coinR = ro("동전 엔트로피", true);
  const sq = slider("앞면 확률 q", 0, 1, 0.01, 0.9, q => coin(q), v => v.toFixed(2));
  function coin(q) { const v = H2([q, 1 - q]); pt.setAttribute("cx", X(q)); pt.setAttribute("cy", Y(v)); ptx.setAttribute("x", Math.min(X(q) + 10, PW - 70)); ptx.setAttribute("y", Y(v) - 10); ptx.textContent = v.toFixed(3) + " bit"; coinR.set(v.toFixed(3) + " bit"); }
  // 4-outcome
  const names = ["mat", "floor", "rug", "dog"], w = [7, 2, 1, 0.5];
  const sl4 = w.map((v, i) => slider("가중치: " + names[i], 0, 10, 0.1, v, x => { w[i] = x; four(); }, x => x.toFixed(1)));
  const bars = h("div", { style: "display:grid;gap:6px" });
  const hR = ro("엔트로피 H", true), effR = ro("2^H = 실질 후보 수"), maxR = ro("최대 가능 (균등)");
  function four() {
    const S = w.reduce((a, b) => a + b, 0) || 1, p = w.map(x => x / S), Hh = H2(p);
    bars.innerHTML = "";
    p.forEach((v, i) => bars.append(h("div", { style: "display:grid;grid-template-columns:60px 1fr 60px;gap:8px;align-items:center;font-size:13px" }, h("span", {}, names[i]), h("div", { style: "height:12px;background:var(--line);border-radius:6px;overflow:hidden" }, h("i", { style: `display:block;height:100%;width:${v * 100}%;background:var(--accent)` })), h("span", { style: "font-family:var(--f-mono);text-align:right" }, v.toFixed(3)))));
    hR.set(Hh.toFixed(3) + " bit"); effR.set((2 ** Hh).toFixed(2) + "개"); maxR.set("2.000 bit");
  }
  const preset = arr => () => { arr.forEach((v, i) => { w[i] = v; sl4[i].set(v); }); four(); };
  body.append(
    h("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:center" }, h("div", { style: "flex:0 1 360px;min-width:0" }, svg), h("div", { style: "flex:1 1 200px;display:grid;gap:10px;min-width:0" }, sq.el, coinR.el, h("p", { class: "w-hint" }, "q = 0.5에서 곡선이 가장 높습니다. 결과를 전혀 예측할 수 없을 때 불확실성이 최대입니다."))),
    h("div", { style: "border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:10px" },
      h("b", {}, "\"the cat sat on the ___\" 다음 단어 분포"), h("div", { class: "ctrls" }, ...sl4.map(x => x.el)), bars, h("div", { class: "readout" }, hR.el, effR.el, maxR.el),
      h("div", { class: "btns" }, btn("균등 (최대 불확실)", preset([1, 1, 1, 1])), btn("확실 (mat 100%)", preset([10, 0, 0, 0])), btn("반반", preset([5, 5, 0, 0])), btn("처음 예제", preset([7, 2, 1, 0.5])))));
  coin(0.9); four();
};

/* ---------- 8. cross-entropy ---------- */
W.crossent = function (root) {
  const body = shell(root, "실습 · Day 07", "모델 조종하기: 손실을 줄여라", "정답 단어를 고르고, 모델의 예측 분포를 조절하세요. 손실(크로스엔트로피)이 0.1보다 작아지면 성공입니다.");
  const names = ["mat", "floor", "dog"], w = [3, 2, 5];
  let target = 0;
  const tb = names.map((n, i) => btn("정답: " + n, () => { target = i; draw(); }));
  const sls = w.map((v, i) => slider("모델 가중치: " + names[i], 0, 10, 0.1, v, x => { w[i] = x; draw(); }, x => x.toFixed(1)));
  const bars = h("div", { style: "display:grid;gap:6px" });
  const ce = ro("손실 = −ln q(정답)", true), qv = ro("정답에 준 확률"), st = ro("상태");
  const PW = 360, PH = 170, L = 30, B = 26;
  const svg = s("svg", { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: "max-width:100%;height:auto" });
  const X = q => L + q * (PW - L - 10), Y = v => PH - B - Math.min(v, 4.6) / 4.6 * (PH - B - 10);
  [0, 1, 2, 3, 4].forEach(v => { svg.append(s("line", { x1: L, x2: PW - 10, y1: Y(v), y2: Y(v), class: "k-line" })); svg.append(s("text", { x: 4, y: Y(v) + 4, "font-size": 10, class: "s-muted" }, v)); });
  [0.01, 0.5, 1].forEach(q => svg.append(s("text", { x: X(q), y: PH - 8, "text-anchor": "middle", "font-size": 10, class: "s-muted" }, "q=" + q)));
  let d = ""; for (let i = 1; i <= 100; i++) { const q = i / 100; d += (i > 1 ? "L" : "M") + X(q) + " " + Y(-Math.log(q)); }
  svg.append(s("path", { d, fill: "none", class: "k-bad", "stroke-width": 2.2 }));
  const pt = s("circle", { r: 7, class: "s-bad" }); svg.append(pt);
  let won = false;
  function draw() {
    tb.forEach((b, i) => b.classList.toggle("on", i === target));
    const S = w.reduce((a, b) => a + b, 0) || 1e-9, q = w.map(x => x / S), qt = Math.max(q[target], 1e-6), L_ = -Math.log(qt);
    bars.innerHTML = "";
    q.forEach((v, i) => bars.append(h("div", { style: "display:grid;grid-template-columns:70px 1fr 60px;gap:8px;align-items:center;font-size:13px" }, h("span", { style: i === target ? "font-weight:700;color:var(--good)" : "" }, names[i] + (i === target ? " ✓" : "")), h("div", { style: "height:12px;background:var(--line);border-radius:6px;overflow:hidden" }, h("i", { style: `display:block;height:100%;width:${v * 100}%;background:${i === target ? "var(--good)" : "var(--muted)"}` })), h("span", { style: "font-family:var(--f-mono);text-align:right" }, v.toFixed(3)))));
    ce.set(fmt(L_, 3)); qv.set(qt.toFixed(3));
    const mx = q.indexOf(Math.max(...q));
    if (L_ < 0.1) { st.set("성공! 🎯".replace(" 🎯", "")); if (!won) { won = true; } }
    else if (mx !== target && q[mx] > 0.6) st.set("틀린 확신 (큰 벌점)");
    else if (L_ > 1) st.set("애매함");
    else st.set("괜찮음");
    pt.setAttribute("cx", X(Math.max(qt, 0.01))); pt.setAttribute("cy", Y(L_));
  }
  body.append(h("div", { class: "btns" }, ...tb), h("div", { class: "ctrls" }, ...sls.map(x => x.el)), bars, h("div", { class: "readout" }, ce.el, qv.el, st.el),
    h("div", { style: "display:flex;flex-wrap:wrap;gap:16px;align-items:center" }, h("div", { style: "flex:0 1 360px;min-width:0" }, svg), h("p", { class: "w-hint", style: "flex:1 1 200px" }, "빨간 곡선이 −ln q입니다. q가 1에 가까우면 손실이 0, q가 0에 가까우면 손실이 끝없이 커집니다. 정답에 0.05만 주면 손실이 약 3.0입니다.")));
  draw();
};

/* ---------- 9. gradient descent ---------- */
W.gd = function (root) {
  const body = shell(root, "실습 · Day 08", "경사하강으로 골짜기 내려가기", "손실 L(w) = (w − 3)²의 바닥(w = 3)을 찾아가는 과정입니다. 학습률을 바꿔 가며 '한 걸음'을 눌러 보세요.");
  const PW = 540, PH = 260, xmin = -3, xmax = 9, ymax = 40, L = 30, B = 26;
  const svg = s("svg", { viewBox: `0 0 ${PW} ${PH}`, width: PW, height: PH, style: "max-width:100%;height:auto" });
  const X = w => L + (w - xmin) / (xmax - xmin) * (PW - L - 10), Y = v => PH - B - Math.min(v, ymax) / ymax * (PH - B - 10);
  [0, 10, 20, 30, 40].forEach(v => { svg.append(s("line", { x1: L, x2: PW - 10, y1: Y(v), y2: Y(v), class: "k-line" })); svg.append(s("text", { x: 2, y: Y(v) + 4, "font-size": 10, class: "s-muted" }, v)); });
  [-3, 0, 3, 6, 9].forEach(w => svg.append(s("text", { x: X(w), y: PH - 8, "text-anchor": "middle", "font-size": 10, class: "s-muted" }, "w=" + w)));
  let d = ""; for (let i = 0; i <= 120; i++) { const w = xmin + i / 120 * (xmax - xmin); d += (i ? "L" : "M") + X(w) + " " + Y((w - 3) ** 2); }
  svg.append(s("path", { d, fill: "none", class: "k-ink", "stroke-width": 2 }));
  const trail = s("g"); svg.append(trail);
  const pt = s("circle", { r: 8, class: "s-acc" }); svg.append(pt);
  let lr = 0.1, w0 = 0, w = 0, hist = [], timer = null;
  const sl = slider("학습률 η", 0.01, 1.2, 0.01, lr, v => { lr = v; }, v => v.toFixed(2));
  const sw = slider("시작 위치 w₀", -2, 8, 0.5, w0, v => { w0 = v; reset(); }, v => v.toFixed(1));
  const rW = ro("현재 w"), rL = ro("손실 L(w)"), rG = ro("기울기 2(w−3)"), rS = ro("상태", true);
  const log = h("div", { class: "calc", style: "max-height:150px;overflow:auto" });
  function render() {
    trail.innerHTML = "";
    for (let i = 1; i < hist.length; i++) trail.append(s("line", { x1: X(Math.max(xmin, Math.min(xmax, hist[i - 1]))), y1: Y((hist[i - 1] - 3) ** 2), x2: X(Math.max(xmin, Math.min(xmax, hist[i]))), y2: Y((hist[i] - 3) ** 2), class: "k-acc", "stroke-width": 1.3, "stroke-dasharray": "4 3" }));
    hist.forEach(v => trail.append(s("circle", { cx: X(Math.max(xmin, Math.min(xmax, v))), cy: Y((v - 3) ** 2), r: 3, class: "s-acc", "fill-opacity": .5 })));
    pt.setAttribute("cx", X(Math.max(xmin, Math.min(xmax, w)))); pt.setAttribute("cy", Y((w - 3) ** 2));
    rW.set(fmt(w, 3)); rL.set(fmt((w - 3) ** 2, 3)); rG.set(fmt(2 * (w - 3), 3));
    const n = hist.length;
    if (Math.abs(w - 3) < 0.01) rS.set("도착!");
    else if (n > 2 && Math.abs(hist[n - 1] - 3) > Math.abs(hist[n - 2] - 3) + 1e-9) rS.set("발산 중");
    else if (n > 2 && (hist[n - 1] - 3) * (hist[n - 2] - 3) < 0) rS.set("진동하며 수렴");
    else rS.set(n > 1 ? "내려가는 중" : "출발 전");
  }
  function step() {
    const g = 2 * (w - 3), nw = w - lr * g;
    log.textContent += `${hist.length}: w = ${fmt(w, 3)} − ${lr.toFixed(2)} × (${fmt(g, 3)}) = ${fmt(nw, 3)}\n`;
    log.scrollTop = log.scrollHeight;
    w = nw; hist.push(w); render();
    if (Math.abs(w) > 1e6 && timer) { clearInterval(timer); timer = null; }
  }
  function reset() { if (timer) { clearInterval(timer); timer = null; } w = w0; hist = [w]; log.textContent = ""; render(); }
  body.append(h("div", { class: "ctrls" }, sl.el, sw.el), h("div", { class: "svgwrap" }, svg), h("div", { class: "readout" }, rW.el, rL.el, rG.el, rS.el),
    h("div", { class: "btns" }, btn("한 걸음", step, "pri"), btn("20걸음 자동", () => { if (timer) return; let k = 0; timer = setInterval(() => { step(); if (++k >= 20) { clearInterval(timer); timer = null; } }, 180); }), btn("처음으로", reset),
      btn("η = 0.1", () => { lr = 0.1; sl.set(0.1); reset(); }), btn("η = 0.9", () => { lr = 0.9; sl.set(0.9); reset(); }), btn("η = 1.1 (위험)", () => { lr = 1.1; sl.set(1.1); reset(); })),
    log, h("p", { class: "w-hint" }, "이 함수에서는 η < 0.5면 한쪽에서 차분히, 0.5 < η < 1이면 좌우로 튀며 수렴, η > 1이면 발산합니다. 논문의 0.7은 실제 신경망 손실에 맞춰 고른 값입니다."));
  reset();
};

/* ---------- 10. CLT ---------- */
W.clt = function (root) {
  const body = shell(root, "실습 · Day 09", "중심극한정리 실험실", "원래 분포와 n을 고른 뒤 '뽑기'를 누르세요. n개씩 뽑아 평균 낸 값 2,000개의 히스토그램이 쌓입니다. 점선은 중심극한정리가 예측하는 정규분포입니다.");
  const src = {
    dice: { name: "주사위", gen: () => 1 + Math.floor(Math.random() * 6), mu: 3.5, sd: Math.sqrt(35 / 12), lo: 1, hi: 6 },
    coin: { name: "동전 (0/1)", gen: () => Math.random() < .5 ? 0 : 1, mu: .5, sd: .5, lo: 0, hi: 1 },
    exp: { name: "지수분포 (비대칭)", gen: () => -Math.log(1 - Math.random()), mu: 1, sd: 1, lo: 0, hi: 4 }
  };
  let cur = "dice", n = 1, data = [], anim = null;
  const sb = {}; Object.keys(src).forEach(k => sb[k] = btn(src[k].name, () => { cur = k; Object.values(sb).forEach(b => b.classList.remove("on")); sb[k].classList.add("on"); run(); }));
  sb.dice.classList.add("on");
  const sn = slider("평균 낼 개수 n", 1, 50, 1, n, v => { n = v; }, v => v);
  const cv = h("canvas", { role: "img", "aria-label": "표본평균 히스토그램" });
  const CW = 560, CH = 230;
  const r1 = ro("예측 σ/√n"), r2 = ro("실제 표준편차"), r3 = ro("표본 평균의 평균");
  function draw() {
    const c = setupCanvas(cv, CW, CH), S = src[cur], bins = 40, lo = S.lo, hi = S.hi, bw = (hi - lo) / bins;
    const cnt = new Array(bins).fill(0);
    data.forEach(v => { let b = Math.floor((v - lo) / bw); if (b >= bins) b = bins - 1; if (b >= 0) cnt[b]++; });
    const sdm = S.sd / Math.sqrt(n);
    const dens = x => Math.exp(-((x - S.mu) ** 2) / (2 * sdm * sdm)) / (sdm * Math.sqrt(2 * Math.PI));
    const expPeak = 2000 * bw * dens(S.mu);
    const ymax = Math.max(...cnt, Math.min(expPeak, 2000), 10) * 1.1;
    const L = 8, B = 22, PWd = CW - 16, PHd = CH - B - 8;
    c.strokeStyle = cssv("--line"); c.lineWidth = 1; c.beginPath(); c.moveTo(L, 8 + PHd); c.lineTo(L + PWd, 8 + PHd); c.stroke();
    c.fillStyle = cssv("--accent");
    cnt.forEach((k, i) => { const hh = k / ymax * PHd; c.fillRect(L + i * PWd / bins + 1, 8 + PHd - hh, PWd / bins - 2, hh); });
    if (data.length && n > 1 || cur !== "dice") {
      c.strokeStyle = cssv("--ink"); c.setLineDash([5, 4]); c.lineWidth = 1.6; c.beginPath();
      for (let i = 0; i <= 200; i++) { const x = lo + i / 200 * (hi - lo), y = 2000 * bw * dens(x) / ymax * PHd; const X = L + (x - lo) / (hi - lo) * PWd, Y = 8 + PHd - Math.min(y, PHd + 4); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.stroke(); c.setLineDash([]);
    }
    c.fillStyle = cssv("--muted"); c.font = "11px " + cssv("--f-mono");
    [lo, (lo + hi) / 2, hi].forEach((v, i) => { c.textAlign = ["left", "center", "right"][i]; c.fillText(fmt(v, 2), L + (v - lo) / (hi - lo) * PWd, CH - 6); });
    if (data.length) { const m = data.reduce((a, b) => a + b, 0) / data.length, sd = Math.sqrt(data.reduce((a, b) => a + (b - m) ** 2, 0) / data.length); r1.set(fmt(sdm, 3)); r2.set(fmt(sd, 3)); r3.set(fmt(m, 3)); }
  }
  function run() {
    if (anim) cancelAnimationFrame(anim);
    data = []; const S = src[cur];
    const tick = () => {
      for (let k = 0; k < 80 && data.length < 2000; k++) { let t = 0; for (let j = 0; j < n; j++) t += S.gen(); data.push(t / n); }
      draw(); if (data.length < 2000) anim = requestAnimationFrame(tick);
    };
    tick();
  }
  REDRAW.push(() => root.isConnected && draw());
  // init part
  const cv2 = h("canvas", { role: "img", "aria-label": "tanh 출력 히스토그램" });
  const xs = Array.from({ length: 1000 }, randn);
  let a = 0.08;
  const sa = slider("초기화 범위 a  (W ~ U(−a, a))", 0.01, 0.5, 0.01, a, v => { a = v; init(); }, v => "±" + v.toFixed(2));
  const q1 = ro("예측 σ_z = √(1000·a²/3)"), q2 = ro("실제 σ_z"), q3 = ro("포화된 뉴런 |tanh| > 0.95", true);
  function init() {
    const N = 1500, zs = new Float64Array(N);
    for (let i = 0; i < N; i++) { let z = 0; for (let j = 0; j < 1000; j++) z += (Math.random() * 2 - 1) * a * xs[j]; zs[i] = z; }
    const m = zs.reduce((p, v) => p + v, 0) / N, sd = Math.sqrt(zs.reduce((p, v) => p + (v - m) ** 2, 0) / N);
    let sat = 0; const bins = 40, cnt = new Array(bins).fill(0);
    zs.forEach(z => { const t = Math.tanh(z); if (Math.abs(t) > .95) sat++; let b = Math.floor((t + 1) / 2 * bins); if (b >= bins) b = bins - 1; cnt[b]++; });
    q1.set(fmt(Math.sqrt(1000 * a * a / 3), 3)); q2.set(fmt(sd, 3)); q3.set((sat / N * 100).toFixed(1) + "%");
    const c = setupCanvas(cv2, CW, 170), PWd = CW - 16, PHd = 130, ymax = Math.max(...cnt) * 1.1;
    cnt.forEach((k, i) => { const hh = k / ymax * PHd; const edge = i < 1 || i >= bins - 1; c.fillStyle = edge ? cssv("--bad") : cssv("--good"); c.fillRect(8 + i * PWd / bins + 1, 8 + PHd - hh, PWd / bins - 2, hh); });
    c.fillStyle = cssv("--muted"); c.font = "11px " + cssv("--f-mono");
    [["−1", "left", 8], ["0", "center", 8 + PWd / 2], ["+1", "right", 8 + PWd]].forEach(([t, al, x]) => { c.textAlign = al; c.fillText("tanh = " + t, x, 162); });
  }
  REDRAW.push(() => root.isConnected && init());
  body.append(h("div", { class: "btns" }, ...Object.values(sb)), h("div", { class: "ctrls" }, sn.el), h("div", { class: "btns" }, btn("2,000번 뽑기", run, "pri"), btn("n = 1", () => { n = 1; sn.set(1); run(); }), btn("n = 5", () => { n = 5; sn.set(5); run(); }), btn("n = 30", () => { n = 30; sn.set(30); run(); })),
    h("div", { style: "overflow-x:auto" }, cv), h("div", { class: "readout" }, r1.el, r2.el, r3.el),
    h("div", { style: "border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:10px" },
      h("b", {}, "논문의 초기화: 뉴런 1,500개의 tanh(Σ wᵢxᵢ) 분포"),
      h("p", { class: "w-hint" }, "입력 1,000개를 받는 뉴런의 출력입니다. 논문의 a = 0.08에서는 대부분이 기울기가 살아 있는 가운데(초록)에 있습니다. a를 0.5로 올리면 양 끝(빨강)에 몰리는 '포화'가 생깁니다."),
      sa.el, h("div", { style: "overflow-x:auto" }, cv2), h("div", { class: "readout" }, q1.el, q2.el, q3.el)));
  run(); init();
};

/* ---------- 11. teacher forcing ---------- */
W.tf = function (root) {
  const body = shell(root, "실습 · Day 10", "Teacher forcing vs Free running", "같은 디코더를 두 방식으로 돌려 봅니다. 이 모델은 '나는' 다음 단어를 살짝 잘못 배웠습니다. '다음 스텝'을 눌러 한 칸씩 진행하세요.");
  const V = ["<BOS>", "나는", "밥을", "빵을", "먹었다", "<EOS>"];
  const P = {
    "<BOS>": [0, .90, .04, .03, .02, .01],
    "나는": [0, 0, .45, .50, .04, .01],
    "밥을": [0, .02, .03, .03, .90, .02],
    "빵을": [0, .02, .03, .55, .38, .02],
    "먹었다": [0, .03, .02, .02, .03, .90]
  };
  const target = ["나는", "밥을", "먹었다", "<EOS>"];
  let mode = "tf", t = 0, seq = [], loss = 0;
  const mb = { tf: btn("Teacher forcing (학습)", () => setMode("tf")), fr: btn("Free running (추론)", () => setMode("fr")) };
  const sp = slider("모델의 p(밥을 | 나는)  (나머지는 빵을)", 0.05, 0.9, 0.01, 0.45, v => { P["나는"][2] = v; P["나는"][3] = +(0.95 - v).toFixed(2); reset(); }, v => v.toFixed(2) + " / 빵을 " + (0.95 - v).toFixed(2));
  const lane = h("div", { style: "display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px" });
  const dist = h("div", { style: "display:grid;gap:5px" });
  const cap = h("p", { style: "min-height:3em" });
  const r1 = ro("누적 손실 Σ −ln q(정답)"), r2 = ro("만든 문장", true);
  function setMode(m) { mode = m; Object.entries(mb).forEach(([k, b]) => b.classList.toggle("on", k === m)); reset(); }
  function reset() { t = 0; seq = []; loss = 0; render(null); }
  function done() { return mode === "tf" ? t >= target.length : (seq.length && seq[seq.length - 1].out === "<EOS>") || t >= 8; }
  function step() {
    if (done()) return;
    const inp = t === 0 ? "<BOS>" : (mode === "tf" ? target[t - 1] : seq[t - 1].out);
    const q = P[inp];
    const am = V[q.indexOf(Math.max(...q))];
    let rec;
    if (mode === "tf") { const y = target[t], qy = q[V.indexOf(y)]; loss += -Math.log(qy); rec = { inp, out: y, pred: am, q, qy }; }
    else rec = { inp, out: am, q };
    seq.push(rec); t++; render(rec);
  }
  function render(rec) {
    lane.innerHTML = "";
    seq.forEach((r, i) => {
      const wrongPred = mode === "tf" && r.pred !== r.out;
      lane.append(h("div", { style: "flex:none;display:grid;gap:4px;justify-items:center;font-size:13px;min-width:86px" },
        h("span", { style: `font-weight:700;color:${mode === "tf" ? "var(--good)" : (i > 0 && r.out !== target[i] ? "var(--bad)" : "var(--ink)")}` }, r.out),
        h("span", { class: "w-hint", style: "font-size:11px" }, mode === "tf" ? (wrongPred ? `모델 1순위: ${r.pred}` : "모델도 맞힘") : "모델이 고름"),
        h("div", { style: "border:1.5px solid var(--ink);border-radius:8px;padding:6px 10px;background:var(--card);font-weight:600" + (i === seq.length - 1 ? ";background:var(--mark);color:var(--mark-ink)" : "") }, "LSTM"),
        h("span", { style: `font-family:var(--f-mono);font-size:12px;padding:2px 6px;border-radius:6px;${i > 0 ? (mode === "tf" ? "background:var(--good-soft);color:var(--good)" : "background:var(--accent-soft);color:var(--accent)") : ""}` }, r.inp),
        h("span", { class: "w-hint", style: "font-size:11px" }, i === 0 ? "시작" : (mode === "tf" ? "정답 입력" : "내 예측 입력"))));
    });
    if (!seq.length) lane.append(h("p", { class: "w-hint" }, "아직 시작 전입니다. '다음 스텝'을 누르세요."));
    dist.innerHTML = "";
    if (rec) {
      dist.append(h("small", { class: "w-hint" }, `입력이 "${rec.inp}"일 때 모델의 다음 단어 확률`));
      V.slice(1).forEach(w => {
        const v = rec.q[V.indexOf(w)], isT = mode === "tf" && w === rec.out, isC = mode === "fr" && w === rec.out;
        dist.append(h("div", { style: "display:grid;grid-template-columns:64px 1fr 48px;gap:8px;align-items:center;font-size:13px" },
          h("span", { style: isT || isC ? "font-weight:700" : "" }, w + (isT ? " ✓정답" : isC ? " ←선택" : "")),
          h("div", { style: "height:11px;background:var(--line);border-radius:6px;overflow:hidden" }, h("i", { style: `display:block;height:100%;width:${v * 100}%;background:${isT ? "var(--good)" : isC ? "var(--accent)" : "var(--muted)"}` })),
          h("span", { style: "font-family:var(--f-mono);text-align:right" }, v.toFixed(2))));
      });
    }
    r1.set(mode === "tf" ? fmt(loss, 3) : "추론엔 정답 없음");
    r2.set(seq.map(r => r.out).join(" ") || "–");
    if (!rec) cap.textContent = mode === "tf" ? "학습 모드: 매 칸 입력으로 '정답의 이전 단어'를 넣고, 정답 단어 확률의 −ln을 손실로 더합니다." : "추론 모드: 정답을 모릅니다. 매 칸 가장 확률 높은 단어를 골라 다음 입력으로 넣습니다(greedy).";
    else if (mode === "tf") cap.textContent = rec.pred !== rec.out ? `모델은 "${rec.pred}"를 더 높게 봤지만, 정답 "${rec.out}"의 확률 ${rec.qy.toFixed(2)}로 손실 ${fmt(-Math.log(rec.qy), 3)}를 받습니다. 다음 칸에는 그래도 정답 "${rec.out}"이 들어갑니다.` : `정답 "${rec.out}"의 확률 ${rec.qy.toFixed(2)} → 손실 ${fmt(-Math.log(rec.qy), 3)}. 다음 칸 입력은 정답 "${rec.out}".`;
    else cap.textContent = done() && rec.out !== "<EOS>" ? `8칸 제한에 걸렸습니다. "빵을"에 한 번 빠지자 학습 때 본 적 없는 상황이 이어졌습니다. 이것이 exposure bias입니다.` : rec.out === "<EOS>" ? "문장을 끝냈습니다." : `"${rec.out}"을(를) 골라 다음 칸 입력으로 넣습니다.`;
  }
  body.append(h("div", { class: "btns" }, mb.tf, mb.fr), sp.el, lane, cap, dist, h("div", { class: "readout" }, r1.el, r2.el),
    h("div", { class: "btns" }, btn("다음 스텝", step, "pri"), btn("끝까지", () => { while (!done()) step(); }), btn("처음부터", reset)),
    h("p", { class: "w-hint" }, "해볼 것: Free running에서 슬라이더를 0.50 이상으로 올려 모델을 '고쳐' 보세요. 학습(teacher forcing 손실 줄이기)이 하는 일이 바로 이것입니다."));
  setMode("tf");
};

/* ---------- 12. RNN step ---------- */
W.rnn = function (root) {
  const body = shell(root, "실습 · Day 10", "RNN 기억 상태 들여다보기", "입력 숫자를 바꾸면 h₁, h₂, h₃가 다시 계산됩니다. W_h를 키우면 과거를 더 오래 기억합니다.");
  const xs = [1, 2, -1];
  let wh = 0.5;
  const ins = xs.map((v, i) => { const e = h("input", { class: "numin", type: "number", step: "0.5", value: v, "aria-label": "x" + (i + 1) }); e.addEventListener("input", () => { xs[i] = parseFloat(e.value) || 0; calc(); }); return e; });
  const sw = slider("W_h 대각값 (기억 유지 정도)", 0, 1.5, 0.05, wh, v => { wh = v; calc(); }, v => v.toFixed(2));
  const out = h("div", { class: "calc" });
  const bars = h("div", { style: "display:flex;gap:16px;flex-wrap:wrap" });
  function calc() {
    let hh = [0, 0], txt = "h₀ = [0, 0]\n";
    bars.innerHTML = "";
    xs.forEach((x, i) => {
      const pre = [wh * hh[0] + x, wh * hh[1] - x];
      hh = pre.map(Math.tanh);
      txt += `h${"₁₂₃"[i]} = tanh(W_h·h${"₀₁₂"[i]} + W_x·${fmt(x, 1)}) = tanh([${fmt(pre[0], 3)}, ${fmt(pre[1], 3)}]) = [${fmt(hh[0], 3)}, ${fmt(hh[1], 3)}]\n`;
      bars.append(h("div", { style: "display:grid;gap:4px;font-size:12px;justify-items:center" }, h("b", {}, "h" + "₁₂₃"[i]),
        h("div", { style: "display:flex;gap:4px;align-items:center;height:80px" }, ...hh.map(v => h("div", { style: "width:18px;height:80px;position:relative;background:var(--paper);border:1px solid var(--line);border-radius:4px" }, h("i", { style: `position:absolute;left:0;right:0;${v >= 0 ? "bottom:50%" : "top:50%"};height:${Math.abs(v) * 50}%;background:${v >= 0 ? "var(--accent)" : "var(--bad)"};border-radius:3px` }))))));
    });
    out.textContent = txt.trim();
  }
  body.append(h("div", { class: "matrow" }, "입력 x₁, x₂, x₃:", ...ins), sw.el, bars, out);
  calc();
};
