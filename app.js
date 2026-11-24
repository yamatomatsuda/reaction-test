const ROUNDS = 5;
const pad = document.getElementById('pad');
const big = document.getElementById('big');
const sub = document.getElementById('sub');
const dots = document.getElementById('dots');
const bestEl = document.getElementById('best');

let state = 'idle';
let times = [];
let timer = null;
let goAt = 0;

function loadBest() { try { return Number(localStorage.getItem('rt-best')) || 0; } catch (e) { return 0; } }
function saveBest(v) { try { localStorage.setItem('rt-best', String(v)); } catch (e) {} }
let best = loadBest();

function showBest() { bestEl.textContent = best ? best + 'ms' : '—'; }
function drawDots() {
  dots.innerHTML = '';
  for (let i = 0; i < ROUNDS; i++) {
    const d = document.createElement('i');
    if (i < times.length) d.className = 'on';
    dots.appendChild(d);
  }
}
function set(s, b, t) { state = s; pad.dataset.s = s; big.innerHTML = b; sub.innerHTML = t; }

function rank(ms) {
  if (ms < 200) return 'プロゲーマー級！';
  if (ms < 250) return 'かなり速い！';
  if (ms < 300) return 'いい感じ。平均以上です';
  if (ms < 380) return 'ふつう。まだ伸びます';
  return 'ちょっと眠い？';
}

function startRound() {
  set('wait', '待って…', '緑になるまでガマン');
  clearTimeout(timer);
  timer = setTimeout(() => {
    goAt = performance.now();
    set('go', 'タップ！', '');
  }, 1200 + Math.random() * 2800);
}

function tap() {
  if (state === 'idle' || state === 'done') { times = []; drawDots(); startRound(); return; }
  if (state === 'wait') { clearTimeout(timer); set('early', 'フライング！', 'タップしてやり直し'); return; }
  if (state === 'early' || state === 'result') { startRound(); return; }
  if (state === 'go') {
    const ms = Math.round(performance.now() - goAt);
    times.push(ms);
    drawDots();
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
    if (times.length < ROUNDS) {
      set('result', `<span class="num">${ms}</span><span class="unit">ms</span>`,
        `${times.length} / ${ROUNDS} 回目 ・ タップで次へ`);
    } else {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / ROUNDS);
      const isBest = !best || avg < best;
      if (isBest) { best = avg; saveBest(avg); showBest(); }
      set('done', `平均 <span class="num">${avg}</span><span class="unit">ms</span>`,
        `${rank(avg)}${isBest ? '<br>🎉 自己ベスト更新' : ''}<br><span class="num">${times.join(' / ')}</span><br>タップでもう一度`);
    }
  }
}

pad.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
pad.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); }
});
showBest();
drawDots();

// オフラインでも動くように Service Worker を登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
