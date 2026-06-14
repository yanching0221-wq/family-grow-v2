// ── Firebase ──────────────────────────────────────────────────
import { initializeApp }                                from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getDatabase, ref, set as dbSet, get as dbGet, onValue }
  from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

const _fbApp = initializeApp({
  apiKey:            'AIzaSyCl0-ivm8G42BwSdeGK-1Qe9Ax3kdEt0E8',
  authDomain:        'family-grow-dfe51.firebaseapp.com',
  databaseURL:       'https://family-grow-dfe51-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         'family-grow-dfe51',
  storageBucket:     'family-grow-dfe51.firebasestorage.app',
  messagingSenderId: '1031974005973',
  appId:             '1:1031974005973:web:6e0f6de88b18f37beb865c',
});
const _db = getDatabase(_fbApp);

// ── Data layer ────────────────────────────────────────────────
let _cache        = {};
let _familyCode   = localStorage.getItem('fg_family_code');
let _fbUnsub      = null;
let _refreshTimer = null;

function familyRef(path) {
  return ref(_db, path ? `families/${_familyCode}/${path}` : `families/${_familyCode}`);
}

const S = {
  get(k) { const v = _cache[k]; return v !== undefined ? v : null; },
  set(k, v) { _cache[k] = v; dbSet(familyRef(k), v !== undefined ? v : null); },
  getOrDefault(k, d) {
    let v = _cache[k];
    if (v === undefined || v === null) return d;
    if (Array.isArray(d) && !Array.isArray(v) && typeof v === 'object') {
      return Object.values(v).filter(x => x != null);
    }
    return v;
  }
};

const DAY_NAMES = ['日','一','二','三','四','五','六'];

// ── 預設貼心提醒 ───────────────────────────────────────────────
function getDefaultMessages() {
  return [
    { id:1,  emoji:'💬', text:'今天記得說好話，讓別人開心！' },
    { id:2,  emoji:'🙏', text:'受到別人幫助時，要記得說謝謝～' },
    { id:3,  emoji:'⭐', text:'每天進步一點點，你就是最棒的！' },
    { id:4,  emoji:'😊', text:'微笑是免費的禮物，多給別人一個！' },
    { id:5,  emoji:'🌬️', text:'遇到不開心的事，先深呼吸，再想解決方法' },
    { id:6,  emoji:'🤝', text:'幫助別人一件小事，今天就很棒了' },
    { id:7,  emoji:'💭', text:'說話前先想想，這句話會讓人開心還是難過' },
    { id:8,  emoji:'📚', text:'作業先做完，玩起來才真的開心' },
    { id:9,  emoji:'💪', text:'不會的題目，試試看再問，不要直接放棄' },
    { id:10, emoji:'🚀', text:'每天進步一點點，一年後的你會很厲害' },
    { id:11, emoji:'🔍', text:'錯誤不可怕，重要的是知道哪裡錯了' },
    { id:12, emoji:'🧹', text:'自己的東西自己整理，找東西就不會手忙腳亂' },
    { id:13, emoji:'🌙', text:'早睡早起，明天才有精神玩和學習' },
    { id:14, emoji:'🍚', text:'吃飯時放下手機和平板，專心吃飯' },
    { id:15, emoji:'🤜', text:'答應別人的事，要記得做到' },
    { id:16, emoji:'👋', text:'看到長輩主動打招呼，讓大家都開心' },
  ];
}

// ── 預設今日選擇清單 ──────────────────────────────────────────
function getDefaultFreeChoices() {
  return [
    { id:1, name:'閱讀30分鐘',     emoji:'📖', category:'靜態' },
    { id:2, name:'出去騎腳踏車',   emoji:'🚲', category:'戶外' },
    { id:3, name:'去公園',         emoji:'🌳', category:'戶外' },
    { id:4, name:'畫畫或做手工',   emoji:'🎨', category:'創作' },
    { id:5, name:'幫忙準備一道菜', emoji:'🍳', category:'生活' },
    { id:6, name:'自己選首歌練習', emoji:'🎵', category:'音樂' },
    { id:7, name:'研究一件好奇的事',emoji:'🔍', category:'探索' },
  ];
}

// ── 預設任務清單 ───────────────────────────────────────────────
function getDefaultTasks() {
  return [
    // ── 每日任務（全部小孩）─────────────────────────────
    { id:1,  name:'洗自己的便當盒',              category:'每日任務', emoji:'🍱', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'自己的東西自己負責，明天才有乾淨的盒子用' },
    { id:2,  name:'完成每日作業（含連絡本簽名）', category:'每日任務', emoji:'📚', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'medium',
      reminder:'今天的事今天完成，不留到明天' },
    { id:3,  name:'9點前洗澡',                   category:'每日任務', emoji:'🚿', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'洗完澡才能放鬆，也讓別人有時間用浴室' },
    { id:4,  name:'做一件家事',                  category:'每日任務', emoji:'🧹', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'家是大家的，每個人都有責任維持' },
    { id:5,  name:'跟長輩打招呼',                category:'每日任務', emoji:'🙏', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'回家第一件事，讓家人知道你回來了' },
    { id:6,  name:'完成均一平台練習',             category:'每日任務', emoji:'🔤', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'medium',
      reminder:'每天一點點，累積比爆發更有力' },
    { id:17, name:'自由時間到9點，洗澡且10點前關大燈', category:'每日任務', emoji:'🌙', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'這是今天所有自由時間的前提' },
    // ── 低年級專屬 ──────────────────────────────────────
    { id:7,  name:'完成音樂練習',     category:'低年級專屬', emoji:'🎵', daysOfWeek:[], type:'once', targetGrade:'low', difficulty:'simple', isPractice:true,
      reminder:'練習不是為了表演，是讓手指記住' },
    { id:8,  name:'練習 15 分鐘',     category:'低年級專屬', emoji:'⏱️', daysOfWeek:[], type:'once', targetGrade:'low', difficulty:'medium', isPractice:true,
      reminder:'時間不長，但要專心' },
    { id:10, name:'主動練習（不用提醒）', category:'低年級專屬', emoji:'💪', daysOfWeek:[], type:'once', targetGrade:'low', difficulty:'hard', isPractice:true,
      reminder:'自己想到就去做，這才是真正的進步' },
    // ── 高年級專屬 ──────────────────────────────────────
    { id:11, name:'主動複習 / 整理筆記', category:'高年級專屬', emoji:'📖', daysOfWeek:[], type:'once', targetGrade:'high', difficulty:'hard',
      reminder:'整理過的東西才真的進到腦袋裡' },
    { id:12, name:'協助規劃家庭事務',   category:'高年級專屬', emoji:'📋', daysOfWeek:[], type:'once', targetGrade:'high', difficulty:'hard',
      reminder:'參與家庭決定，你的意見很重要' },
    // ── 運動（可重複）─────────────────────────────────
    { id:20, name:'跳繩800下（跳完+喝水）', category:'運動', emoji:'🪢', daysOfWeek:[], type:'multi', targetGrade:'all', difficulty:'medium',
      reminder:'跳完記得補水，運動後的水分很重要' },
    // ── 每週挑戰 ────────────────────────────────────────
    { id:21, name:'本週跳繩8000下', category:'每週挑戰', emoji:'🏅', daysOfWeek:[], type:'weekly', targetGrade:'all', weeklyTarget:10, autoFrom:20,
      reminder:'一週10次，平均一天不到兩次，你可以的' },
    // ── 週末任務 ────────────────────────────────────────
    { id:13, name:'9點前完成早餐',  category:'週末任務', emoji:'🍳', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'早餐是一天的開關，別讓它太晚開機' },
    { id:14, name:'公園放風30分鐘', category:'週末任務', emoji:'🌳', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'medium',
      reminder:'身體需要在戶外動，螢幕等你回來' },
    { id:15, name:'跑步3K',         category:'週末任務', emoji:'🏃', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'hard',
      reminder:'累了沒關係，配速跑完比速度更重要' },
    { id:16, name:'倒垃圾',         category:'週末任務', emoji:'🗑️', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple',
      reminder:'垃圾車不等人，這是全家的任務' },
  ];
}

// ── Init ──────────────────────────────────────────────────────
function initData() {
  if (S.get('initialized')) {
    // v2 遷移：補入 freeChoiceItems
    if (!S.get('data_v2_fc')) {
      if (!S.getOrDefault('freeChoiceItems', []).length) {
        S.set('freeChoiceItems', getDefaultFreeChoices());
      }
      S.set('data_v2_fc', true);
    }
    // v2 遷移：補入 reminder 到現有任務
    if (!S.get('data_v2_reminder')) {
      const newTasks = getDefaultTasks();
      const tasks = S.getOrDefault('tasks', []);
      tasks.forEach(t => {
        const def = newTasks.find(d => d.id === t.id);
        if (def && !t.reminder) t.reminder = def.reminder;
        delete t.coins; // 移除點數欄位
      });
      // 補入新任務 id:17
      if (!tasks.find(t => t.id === 17)) {
        const t17 = newTasks.find(d => d.id === 17);
        if (t17) tasks.push(t17);
      }
      S.set('tasks', tasks);
      S.set('data_v2_reminder', true);
    }
    return;
  }

  // ── 全新安裝 ──────────────────────────────────────────────
  S.set('children', [
    { id: 1, name: '小孩一', emoji: '🦁', grade: 'low' },
    { id: 2, name: '小孩二', emoji: '🐯', grade: 'low' },
  ]);
  S.set('tasks',          getDefaultTasks());
  S.set('freeChoiceItems', getDefaultFreeChoices());
  S.set('freeChoiceLogs', []);
  S.set('messages',       getDefaultMessages());
  S.set('completions',    []);
  S.set('checkIns',       {});
  S.set('bestStreak',     {});
  S.set('data_v2_fc',     true);
  S.set('data_v2_reminder', true);
  S.set('initialized',    true);
}

// ── Page routing ──────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ── Loading overlay ────────────────────────────────────────────
function showLoading(msg = '載入中...') {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div style="font-size:2.5rem;margin-bottom:1rem;animation:pulse 1s infinite">☀️</div><div style="color:#888">${msg}</div>`;
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// ── Family management ──────────────────────────────────────────
function generateFamilyCode() {
  return String(Math.floor(Math.random() * 90) + 10);
}

function setupFamilyListener() {
  if (_fbUnsub) _fbUnsub();
  _fbUnsub = onValue(familyRef(''), snap => {
    _cache = snap.val() || {};
    clearTimeout(_refreshTimer);
    _refreshTimer = setTimeout(refreshCurrentView, 600);
  });
}

function refreshCurrentView() {
  const page = document.querySelector('.page:not(.hidden)')?.id;
  if (page === 'page-welcome')          renderWelcome();
  else if (page === 'page-parent-main') renderParentMain();
  else if (page === 'page-child-main')  renderChildProgress();
}

function renderChildProgress() {
  const id = window._currentChildId;
  if (!id) return;
  updateChildHeader();
}

async function startNewFamily() {
  const inputEl    = document.getElementById('new-family-code-input');
  const customCode = inputEl ? inputEl.value.trim().toUpperCase() : '';
  const code = customCode || generateFamilyCode();
  showLoading('建立家庭中...');
  const snap = await dbGet(ref(_db, `families/${code}`));
  if (snap.exists()) {
    hideLoading();
    alert(`⚠️ 代碼「${code}」已被使用，請換一個`);
    return;
  }
  _familyCode = code;
  localStorage.setItem('fg_family_code', code);
  _cache = {};
  initData();
  setupFamilyListener();
  hideLoading();
  document.getElementById('setup-family-code-display').textContent = code;
  showPage('page-setup');
}

async function joinFamilySubmit() {
  const code = document.getElementById('join-code-input').value.trim();
  if (code.length < 2) { alert('請輸入家庭代碼'); return; }
  showLoading('連線中...');
  try {
    const snap = await dbGet(ref(_db, `families/${code}`));
    if (!snap.exists()) {
      hideLoading();
      alert('⚠️ 找不到此家庭代碼，請確認後再試');
      return;
    }
    _familyCode = code;
    localStorage.setItem('fg_family_code', code);
    _cache = snap.val() || {};
    setupFamilyListener();
    hideLoading();
    renderWelcome();
    showPage('page-welcome');
  } catch {
    hideLoading();
    alert('連線失敗，請確認網路連線後再試');
  }
}

function leaveFamily() {
  if (!confirm('確定要離開此家庭？\n（資料不會刪除，可用代碼重新加入）')) return;
  if (_fbUnsub) { _fbUnsub(); _fbUnsub = null; }
  _familyCode = null;
  _cache = {};
  localStorage.removeItem('fg_family_code');
  showPage('page-family-select');
}

// ── Setup ─────────────────────────────────────────────────────
function saveSetup() {
  const p   = document.getElementById('setup-parent-pin').value.trim();
  const c1n = document.getElementById('setup-child1-name').value.trim() || '小孩一';
  const c2n = document.getElementById('setup-child2-name').value.trim() || '小孩二';
  const c1g = document.querySelector('input[name="child1-grade"]:checked')?.value || 'low';
  const c2g = document.querySelector('input[name="child2-grade"]:checked')?.value || 'low';
  if (p.length < 4) { alert('請輸入4位爸媽密碼'); return; }
  S.set('pins', { parent: p });
  const children = S.getOrDefault('children', []);
  if (children[0]) { children[0].name = c1n; children[0].grade = c1g; }
  if (children[1]) { children[1].name = c2n; children[1].grade = c2g; }
  S.set('children', children);
  renderWelcome();
  showPage('page-welcome');
}

// ── Login ─────────────────────────────────────────────────────
function goToChildLogin(childId) {
  window._currentChildId = childId;
  renderChildMain();
  showPage('page-child-main');
}

function goToParentLogin() {
  document.getElementById('parent-pin-input').value = '';
  document.getElementById('parent-login-error').classList.add('hidden');
  showPage('page-parent-login');
}

function loginChild() {
  const input = document.getElementById('child-pin-input').value;
  const pins  = S.get('pins');
  const idx   = window._loginChildId - 1;
  if (pins && input === pins.children?.[idx]) {
    window._currentChildId = window._loginChildId;
    renderChildMain();
    showPage('page-child-main');
  } else {
    document.getElementById('child-login-error').classList.remove('hidden');
  }
}

function loginParent() {
  const input = document.getElementById('parent-pin-input').value;
  const pins  = S.get('pins');
  if (input === pins?.parent) {
    renderParentMain();
    showPage('page-parent-main');
  } else {
    document.getElementById('parent-login-error').classList.remove('hidden');
  }
}

function logout() {
  window._currentChildId = null;
  if (window._bannerInterval) clearInterval(window._bannerInterval);
  renderWelcome();
  showPage('page-welcome');
}

// ── Welcome ───────────────────────────────────────────────────
function renderWelcome() {
  const children = S.getOrDefault('children', []);
  const html = children.map(c => {
    const gl = c.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    const gc = c.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';
    return `<button onclick="goToChildLogin(${c.id})" class="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100">
      <div class="flex items-center justify-between">
        <div class="font-bold text-lg">${c.emoji} ${c.name}</div>
        <span class="text-xs px-2 py-0.5 rounded-full ${gc}">${gl}</span>
      </div>
      <div class="text-gray-400 text-sm mt-1">完成今日任務，記錄自己</div>
    </button>`;
  }).join('') +
  `<button onclick="goToParentLogin()" class="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100">
    <div class="font-bold text-lg">🐻 爸爸 / 媽媽</div>
    <div class="text-gray-400 text-sm mt-1">管理任務、查看狀況</div>
  </button>`;
  document.getElementById('welcome-buttons').innerHTML = html;
}

// ── Helpers ───────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function getActiveTasks(grade) {
  const dow = new Date().getDay();
  return S.getOrDefault('tasks', []).filter(t => {
    const dayOk   = !t.daysOfWeek || t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dow);
    const gradeOk = !grade || !t.targetGrade || t.targetGrade === 'all' || t.targetGrade === grade;
    return dayOk && gradeOk;
  });
}

function getChildName(id) {
  return S.getOrDefault('children', []).find(c => c.id === id)?.name || `小孩${id}`;
}

function getWeeklyProgress(childId, taskId) {
  const task      = S.getOrDefault('tasks', []).find(t => t.id === taskId);
  const weekStart = getWeekStart();
  const comps     = S.getOrDefault('completions', []);
  if (task?.autoFrom) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const we = weekEnd.toISOString().slice(0, 10);
    return comps.filter(c =>
      c.taskId === task.autoFrom && c.childId === childId &&
      c.status === 'done' && c.date >= weekStart && c.date <= we
    ).length;
  }
  return comps.filter(c =>
    c.taskId === taskId && c.childId === childId &&
    c.week === weekStart && c.status === 'done'
  ).length;
}

// ── 打卡 & 連續天數 ───────────────────────────────────────────
function getStreak(childId) {
  const dates = S.getOrDefault('checkIns', {})[childId] || [];
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (dates.includes(d.toISOString().slice(0, 10))) streak++;
    else break;
  }
  return streak;
}

function getBestStreak(childId) {
  return S.getOrDefault('bestStreak', {})[childId] || 0;
}

function markCheckIn(childId) {
  const checkIns = S.getOrDefault('checkIns', {});
  if (!checkIns[childId]) checkIns[childId] = [];
  if (checkIns[childId].includes(today())) return;
  checkIns[childId].push(today());
  S.set('checkIns', checkIns);
  // 更新歷史最高紀錄
  const streak = getStreak(childId);
  const best   = getBestStreak(childId);
  if (streak > best) {
    const bs = S.getOrDefault('bestStreak', {});
    bs[childId] = streak;
    S.set('bestStreak', bs);
  }
}

function renderStreakWidget(childId) {
  const dates  = S.getOrDefault('checkIns', {})[childId] || [];
  const streak = getStreak(childId);
  const best   = getBestStreak(childId);
  const now    = new Date();

  const circles = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { dayName: DAY_NAMES[d.getDay()], checked: dates.includes(dateStr), isToday: dateStr === today() };
  });

  const circlesHtml = circles.map(c => `
    <div class="flex flex-col items-center gap-1">
      <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
        ${c.checked ? 'bg-brand text-white' : c.isToday ? 'border-2 border-brand text-brand' : 'bg-gray-100 text-gray-300'}">
        ${c.checked ? '✓' : c.isToday ? '今' : ''}
      </div>
      <span class="text-xs text-gray-400">週${c.dayName}</span>
    </div>`).join('');

  return `<div class="bg-white rounded-2xl shadow-sm p-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">🔥</span>
        <span class="font-bold">每日打卡</span>
      </div>
      <div class="text-right">
        <div class="font-bold ${streak > 0 ? 'text-brand' : 'text-gray-400'}">連續 ${streak} 天</div>
        ${best > 0 ? `<div class="text-xs text-gray-400">最高紀錄 ${best} 天</div>` : ''}
      </div>
    </div>
    <div class="flex justify-between">${circlesHtml}</div>
  </div>`;
}

// ── 上週回顧快照 ──────────────────────────────────────────────
function renderWeeklySnapshot(childId) {
  const weekStart  = getWeekStart();
  const lastMon    = new Date(weekStart);
  lastMon.setDate(lastMon.getDate() - 7);
  const lastSun    = new Date(weekStart);
  lastSun.setDate(lastSun.getDate() - 1);
  const start = lastMon.toISOString().slice(0, 10);
  const end   = lastSun.toISOString().slice(0, 10);

  const comps = S.getOrDefault('completions', []).filter(c =>
    c.childId === childId && c.date >= start && c.date <= end && c.status === 'done'
  );
  const logs = S.getOrDefault('freeChoiceLogs', []).filter(l =>
    l.childId === childId && l.date >= start && l.date <= end
  );
  const checkIns = S.getOrDefault('checkIns', {})[childId] || [];
  let checkinDays = 0;
  for (let d = new Date(start); d <= lastSun; d.setDate(d.getDate() + 1)) {
    if (checkIns.includes(d.toISOString().slice(0, 10))) checkinDays++;
  }

  if (!comps.length && !logs.length && !checkinDays) return '';

  const items = S.getOrDefault('freeChoiceItems', []);
  const choiceCounts = {};
  logs.forEach(l => {
    const item = items.find(i => i.id === l.itemId);
    const name = item ? `${item.emoji} ${item.name}` : (l.customName || '自訂');
    choiceCounts[name] = (choiceCounts[name] || 0) + 1;
  });
  const choiceText = Object.entries(choiceCounts).map(([n, c]) => `${n} ×${c}`).join('、') || '';
  const label = `${start.slice(5).replace('-','/')} – ${end.slice(5).replace('-','/')}`;

  return `<div class="bg-white rounded-2xl shadow-sm p-4 mb-4">
    <div class="flex items-center gap-2 mb-3">
      <span class="text-xl">📊</span>
      <span class="font-bold">上週的你</span>
      <span class="text-xs text-gray-400">${label}</span>
    </div>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between"><span class="text-gray-500">任務完成</span><span class="font-bold">${comps.length} 項</span></div>
      <div class="flex justify-between"><span class="text-gray-500">打卡天數</span><span class="font-bold">${checkinDays} 天</span></div>
      ${choiceText ? `<div class="pt-1 text-gray-500">你選擇了<br><span class="text-gray-700 font-medium">${choiceText}</span></div>` : ''}
    </div>
  </div>`;
}

// ── Child: main ───────────────────────────────────────────────
function renderChildMain() {
  const id    = window._currentChildId;
  const child = S.getOrDefault('children', []).find(c => c.id === id);
  document.getElementById('child-name-display').textContent = child?.name || '小孩';
  const codeEl = document.getElementById('child-family-code-text');
  if (codeEl) codeEl.textContent = _familyCode || '';
  const gradeEl = document.getElementById('child-grade-display');
  if (gradeEl) {
    gradeEl.textContent = child?.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    gradeEl.className   = `text-xs px-2 py-0.5 rounded-full ${child?.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`;
  }
  updateChildHeader();
  renderChildTasks();
  renderFreeChoiceTab();
  renderChildHistory();
  rotateBanner();
}

function updateChildHeader() {
  const id    = window._currentChildId;
  const child = S.getOrDefault('children', []).find(c => c.id === id);
  const activeTasks = getActiveTasks(child?.grade).filter(t => (t.type||'once') === 'once');
  const done  = S.getOrDefault('completions', [])
    .filter(c => c.childId === id && c.date === today() && c.status === 'done').length;
  const total = activeTasks.length;
  document.getElementById('child-progress-text').textContent = `${done} / ${total}`;
  document.getElementById('child-progress-bar').style.width  = total ? `${(done/total)*100}%` : '0%';
}

function switchChildTab(tab, btn) {
  document.querySelectorAll('.child-tab').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-gray-400');
  });
  document.getElementById(`child-tab-${tab}`)?.classList.remove('hidden');
  if (btn) { btn.classList.add('active'); btn.classList.remove('text-gray-400'); }
}

// ── Child: tasks ──────────────────────────────────────────────
function renderChildTasks() {
  const id        = window._currentChildId;
  const child     = S.getOrDefault('children', []).find(c => c.id === id);
  const tasks     = getActiveTasks(child?.grade);
  const todayC    = S.getOrDefault('completions', []).filter(c => c.childId === id && c.date === today());
  const onceTasks = tasks.filter(t => (t.type||'once') === 'once' && t.category !== '週末任務');
  const multiTasks  = tasks.filter(t => t.type === 'multi');
  const weeklyTasks = tasks.filter(t => t.type === 'weekly');
  const weekendTasks = tasks.filter(t => t.category === '週末任務');

  document.getElementById('child-tab-tasks').innerHTML = `
    <div class="sticky top-0 z-20 bg-[#FAF7F4] px-5 pt-3">
      ${renderStreakWidget(id)}
      ${renderWeeklySnapshot(id)}
      <div class="flex -mx-5 px-0 border-b border-gray-200 bg-[#FAF7F4] overflow-x-auto">
        <button id="stab-once"    onclick="switchTaskTab('once')"    class="stab-btn active shrink-0 flex-1 py-2.5 text-sm text-center">每日任務</button>
        <button id="stab-multi"   onclick="switchTaskTab('multi')"   class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">重覆任務</button>
        <button id="stab-weekend" onclick="switchTaskTab('weekend')" class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">週末任務</button>
        <button id="stab-weekly"  onclick="switchTaskTab('weekly')"  class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">每週挑戰</button>
      </div>
    </div>
    <div id="stab-once-content"    class="stab-content px-5 pt-3 pb-24">${buildOnceHtml(onceTasks, todayC)}</div>
    <div id="stab-multi-content"   class="stab-content hidden px-5 pt-3 pb-24">${buildMultiHtml(multiTasks, todayC)}</div>
    <div id="stab-weekend-content" class="stab-content hidden px-5 pt-3 pb-24">${buildWeekendHtml(weekendTasks, todayC)}</div>
    <div id="stab-weekly-content"  class="stab-content hidden px-5 pt-3 pb-24">${buildWeeklyHtml(weeklyTasks, id)}</div>`;

  if (window._currentTaskTab && window._currentTaskTab !== 'once') {
    switchTaskTab(window._currentTaskTab);
  }
}

function switchTaskTab(type) {
  window._currentTaskTab = type;
  ['once','multi','weekend','weekly'].forEach(t => {
    const btn     = document.getElementById(`stab-${t}`);
    const content = document.getElementById(`stab-${t}-content`);
    if (!btn || !content) return;
    if (t === type) {
      btn.className = 'stab-btn active shrink-0 flex-1 py-2.5 text-sm text-center';
      content.classList.remove('hidden');
    } else {
      btn.className = 'stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400';
      content.classList.add('hidden');
    }
  });
}

function buildOnceHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有任務</p>';
  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const comp    = todayC.find(c => c.taskId === task.id && c.status === 'done');
    const checked = !!comp;
    html += `<div class="flex items-center p-4 gap-4 ${checked ? 'opacity-60' : ''}">
      <div onclick="toggleTask(${task.id})" class="task-checkbox ${checked ? 'checked' : ''}">
        ${checked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium ${checked ? 'line-through text-gray-400' : ''}">${task.emoji} ${task.name}</div>
        ${task.reminder ? `<div class="text-xs text-gray-400 mt-0.5">${task.reminder}</div>` : ''}
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function buildMultiHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有重覆任務</p>';
  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const allToday   = todayC.filter(c => c.taskId === task.id);
    const doneCnt    = allToday.filter(c => c.status === 'done').length;
    html += `<div class="flex items-center p-4 gap-4">
      <div class="flex-1 min-w-0">
        <div class="font-medium">${task.emoji} ${task.name}
          ${doneCnt ? `<span class="text-brand font-bold ml-1">×${doneCnt}</span>` : ''}
        </div>
        ${task.reminder ? `<div class="text-xs text-gray-400 mt-0.5">${task.reminder}</div>` : ''}
        ${doneCnt ? `<div class="text-xs text-green-500 mt-0.5">今天已完成 ${doneCnt} 次</div>` : ''}
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        ${allToday.length >= 10
          ? `<button disabled class="text-xs bg-gray-200 text-gray-400 px-3 py-1.5 rounded-full font-bold">已達上限</button>`
          : `<button onclick="submitTask(${task.id})" class="text-xs bg-brand text-white px-3 py-1.5 rounded-full font-bold">＋ 完成一次</button>`}
        ${doneCnt ? `<button onclick="cancelLastTask(${task.id})" class="text-xs text-gray-300 underline">取消上一次</button>` : ''}
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function buildWeekendHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有週末任務</p>';
  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const comp    = todayC.find(c => c.taskId === task.id && c.status === 'done');
    const checked = !!comp;
    html += `<div class="flex items-center p-4 gap-4 ${checked ? 'opacity-60' : ''}">
      <div onclick="toggleTask(${task.id})" class="task-checkbox ${checked ? 'checked' : ''}">
        ${checked ? '<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium ${checked ? 'line-through text-gray-400' : ''}">${task.emoji} ${task.name}</div>
        ${task.reminder ? `<div class="text-xs text-gray-400 mt-0.5">${task.reminder}</div>` : ''}
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function buildWeeklyHtml(tasks, childId) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有每週挑戰</p>';
  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const progress = getWeeklyProgress(childId, task.id);
    const target   = task.weeklyTarget || 1;
    const pct      = Math.min((progress / target) * 100, 100);
    const done     = progress >= target;
    html += `<div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="font-medium">${task.emoji} ${task.name}</div>
        <span class="text-sm font-bold ${done ? 'text-green-500' : 'text-brand'}">${progress} / ${target}</span>
      </div>
      ${task.reminder ? `<div class="text-xs text-gray-400 mb-2">${task.reminder}</div>` : ''}
      <div class="h-2 bg-gray-100 rounded-full">
        <div class="h-2 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-brand'}" style="width:${pct}%"></div>
      </div>
      ${done ? '<div class="text-xs text-green-500 mt-1 font-bold">🎉 本週挑戰完成！</div>' : ''}
    </div>`;
  });
  html += '</div>';
  return html;
}

// ── 任務完成（立即標記，不需審核）───────────────────────────
function toggleTask(taskId) {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', []);
  const done  = comps.find(c => c.taskId === taskId && c.childId === id && c.date === today() && c.status === 'done');
  if (done) cancelTask(taskId);
  else submitTask(taskId);
}

function submitTask(taskId) {
  const id    = window._currentChildId;
  const tasks = S.getOrDefault('tasks', []);
  const task  = tasks.find(t => t.id === taskId);
  if (!task) return;
  const type  = task.type || 'once';
  const comps = S.getOrDefault('completions', []);

  if (type === 'once') {
    if (comps.find(c => c.taskId === taskId && c.childId === id && c.date === today() && c.status === 'done')) return;
  }
  if (type === 'multi') {
    const cnt = comps.filter(c => c.taskId === taskId && c.childId === id && c.date === today()).length;
    if (cnt >= 10) { alert('今天這個任務已達上限（10次）！'); return; }
  }
  if (type === 'weekly') {
    if (task.autoFrom) return;
    if (getWeeklyProgress(id, taskId) >= (task.weeklyTarget || 1)) return;
  }

  const entry = { id: Date.now(), taskId, childId: id, date: today(), status: 'done', type };
  if (type === 'weekly') entry.week = getWeekStart();
  comps.push(entry);
  S.set('completions', comps);

  markCheckIn(id);
  updateChildHeader();
  renderChildTasks();
}

function cancelTask(taskId) {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', []);
  const idx   = comps.findIndex(c => c.taskId === taskId && c.childId === id && c.date === today() && c.status === 'done');
  if (idx !== -1) comps.splice(idx, 1);
  S.set('completions', comps);
  updateChildHeader();
  renderChildTasks();
}

function cancelLastTask(taskId) {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', []);
  let lastIdx = -1;
  comps.forEach((c, i) => {
    if (c.taskId === taskId && c.childId === id && c.date === today()) lastIdx = i;
  });
  if (lastIdx !== -1) comps.splice(lastIdx, 1);
  S.set('completions', comps);
  updateChildHeader();
  renderChildTasks();
}

// ── 今日選擇 ──────────────────────────────────────────────────
function renderFreeChoiceTab() {
  const id    = window._currentChildId;
  const items = S.getOrDefault('freeChoiceItems', []);
  const logs  = S.getOrDefault('freeChoiceLogs', []);
  const todayLogs = logs.filter(l => l.childId === id && l.date === today());

  // 本月統計
  const monthStart = today().slice(0, 7);
  const monthLogs  = logs.filter(l => l.childId === id && l.date.startsWith(monthStart));
  const monthlyCounts = {};
  monthLogs.forEach(l => {
    const item = items.find(i => i.id === l.itemId);
    const name = item ? `${item.emoji} ${item.name}` : (l.customName || '自訂');
    monthlyCounts[name] = (monthlyCounts[name] || 0) + 1;
  });
  const monthlyHtml = Object.entries(monthlyCounts).length
    ? Object.entries(monthlyCounts).sort((a,b) => b[1]-a[1]).map(([name, cnt]) => {
        const max = Math.max(...Object.values(monthlyCounts));
        const pct = Math.round((cnt / max) * 100);
        return `<div class="flex items-center gap-2 text-sm">
          <span class="w-28 truncate text-gray-600">${name}</span>
          <div class="flex-1 h-2 bg-gray-100 rounded-full">
            <div class="h-2 bg-brand rounded-full" style="width:${pct}%"></div>
          </div>
          <span class="text-gray-500 w-6 text-right">${cnt}</span>
        </div>`;
      }).join('')
    : '<p class="text-sm text-gray-300">本月尚無記錄</p>';

  const itemsHtml = items.map(item => {
    const doneToday = todayLogs.filter(l => l.itemId === item.id).length;
    return `<div class="flex items-center p-3 gap-3">
      <span class="text-2xl">${item.emoji}</span>
      <div class="flex-1">
        <div class="font-medium text-sm">${item.name}</div>
        ${doneToday ? `<div class="text-xs text-brand">今天已選 ${doneToday} 次</div>` : ''}
      </div>
      <button onclick="logFreeChoice(${item.id})" class="text-xs bg-brand text-white px-3 py-1.5 rounded-full font-bold shrink-0">選擇</button>
    </div>`;
  }).join('');

  document.getElementById('child-tab-free-choice').innerHTML = `
    <div class="bg-amber-50 rounded-2xl p-4 mb-4">
      <div class="font-bold text-amber-700 mb-1">📅 本月你選擇了</div>
      <div class="space-y-2">${monthlyHtml}</div>
    </div>
    <div class="font-semibold mb-2">今天可以做什麼？</div>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">${itemsHtml}</div>
    <div class="bg-gray-50 rounded-2xl p-4">
      <div class="text-sm font-bold text-gray-600 mb-2">＋ 自己加一件事</div>
      <div class="flex gap-2">
        <input id="custom-choice-input" type="text" placeholder="今天想做什麼？" maxlength="20"
          class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand">
        <button onclick="logCustomChoice()" class="bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold shrink-0">記錄</button>
      </div>
    </div>
    <div class="mt-4">
      <div class="font-semibold text-sm mb-2">今天的記錄</div>
      ${todayLogs.length
        ? `<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
            ${todayLogs.map(l => {
              const item = items.find(i => i.id === l.itemId);
              return `<div class="flex items-center justify-between p-3 text-sm">
                <span>${item ? `${item.emoji} ${item.name}` : (l.customName || '自訂')}</span>
                <button onclick="deleteFreeChoiceLog(${l.id})" class="text-gray-300 text-xs underline">刪除</button>
              </div>`;
            }).join('')}
           </div>`
        : '<p class="text-sm text-gray-300">今天還沒有記錄</p>'}
    </div>`;
}

function logFreeChoice(itemId) {
  const id   = window._currentChildId;
  const logs = S.getOrDefault('freeChoiceLogs', []);
  logs.push({ id: Date.now(), childId: id, itemId, date: today() });
  S.set('freeChoiceLogs', logs);
  renderFreeChoiceTab();
}

function logCustomChoice() {
  const input = document.getElementById('custom-choice-input');
  const name  = input?.value.trim();
  if (!name) return;
  const id   = window._currentChildId;
  const logs = S.getOrDefault('freeChoiceLogs', []);
  logs.push({ id: Date.now(), childId: id, itemId: null, customName: name, date: today() });
  S.set('freeChoiceLogs', logs);
  if (input) input.value = '';
  renderFreeChoiceTab();
}

function deleteFreeChoiceLog(logId) {
  const logs = S.getOrDefault('freeChoiceLogs', []);
  const idx  = logs.findIndex(l => l.id === logId);
  if (idx !== -1) logs.splice(idx, 1);
  S.set('freeChoiceLogs', logs);
  renderFreeChoiceTab();
}

// ── 孩子歷程 ──────────────────────────────────────────────────
function renderChildHistory() {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', [])
    .filter(c => c.childId === id && c.status === 'done')
    .sort((a, b) => b.date.localeCompare(a.date));
  const tasks = S.getOrDefault('tasks', []);

  const byDate = {};
  comps.forEach(c => {
    if (!byDate[c.date]) byDate[c.date] = [];
    byDate[c.date].push(c);
  });

  const html = Object.entries(byDate).slice(0, 14).map(([date, cs]) => {
    const rows = cs.map(c => {
      const task = tasks.find(t => t.id === c.taskId);
      return `<div class="text-sm text-gray-600 py-1">${task ? `${task.emoji} ${task.name}` : '已刪除的任務'}</div>`;
    }).join('');
    return `<div class="mb-4">
      <div class="text-xs font-bold text-gray-400 mb-1">${date}</div>
      <div class="bg-white rounded-xl px-4 divide-y divide-gray-50">${rows}</div>
    </div>`;
  }).join('') || '<p class="text-center text-gray-300 py-12">尚無記錄</p>';

  document.getElementById('child-tab-history').innerHTML = html;
}

// ── Banner ─────────────────────────────────────────────────────
function rotateBanner() {
  const msgs = S.getOrDefault('messages', []);
  if (!msgs.length) return;
  const el = document.getElementById('banner-text');
  let i = 0;
  el.textContent = msgs[0].text;
  if (window._bannerInterval) clearInterval(window._bannerInterval);
  window._bannerInterval = setInterval(() => {
    i = (i + 1) % msgs.length;
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = msgs[i].text; el.style.opacity = '1'; }, 300);
  }, 6000);
}

// ── Parent: main ──────────────────────────────────────────────
function renderParentMain() {
  renderParentOverview();
  renderParentTasks();
  renderParentFreeChoices();
  renderParentMessages();
  const codeEl = document.getElementById('parent-family-code-text');
  if (codeEl) codeEl.textContent = _familyCode || '';
}

function switchParentTab(tab, btn) {
  document.querySelectorAll('.parent-tab').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-gray-400');
  });
  document.getElementById(`parent-tab-${tab}`)?.classList.remove('hidden');
  if (btn) { btn.classList.add('active'); btn.classList.remove('text-gray-400'); }
}

// ── Parent: overview ──────────────────────────────────────────
function renderParentOverview() {
  const children    = S.getOrDefault('children', []);
  const completions = S.getOrDefault('completions', []);

  const childCards = children.map(child => {
    const childTasks = getActiveTasks(child.grade).filter(t => (t.type||'once') === 'once');
    const doneCnt    = completions.filter(c => c.childId === child.id && c.date === today() && c.status === 'done').length;
    const total      = childTasks.length;
    const streak     = getStreak(child.id);
    const best       = getBestStreak(child.id);
    const gl = child.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    const gc = child.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';
    const pct = total ? Math.round((doneCnt / total) * 100) : 0;
    return `<div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">${child.emoji}</span>
        <div class="flex-1">
          <div class="font-bold">${child.name}</div>
          <span class="text-xs px-1.5 py-0.5 rounded-full ${gc}">${gl}</span>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-400">🔥 ${streak} 天</div>
          ${best > 0 ? `<div class="text-xs text-gray-300">最高 ${best}</div>` : ''}
        </div>
      </div>
      <div class="flex justify-between text-xs text-gray-400 mb-1">
        <span>今日完成</span><span>${doneCnt} / ${total}</span>
      </div>
      <div class="h-2 bg-gray-100 rounded-full">
        <div class="h-2 bg-brand rounded-full" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');

  // 本週各孩子完成統計
  const ws  = getWeekStart();
  const we  = new Date(ws); we.setDate(we.getDate() + 6);
  const weStr = we.toISOString().slice(0, 10);
  const weekStats = children.map(child => {
    const cnt = completions.filter(c => c.childId === child.id && c.date >= ws && c.date <= weStr && c.status === 'done').length;
    return `<div class="flex justify-between text-sm py-1"><span>${child.emoji} ${child.name}</span><span class="font-bold text-brand">${cnt} 項</span></div>`;
  }).join('');

  document.getElementById('parent-tab-overview').innerHTML = `
    <div class="grid grid-cols-2 gap-3 mb-4">${childCards}</div>
    <div class="bg-white rounded-2xl shadow-sm p-4 mb-4">
      <div class="font-semibold mb-2">📅 本週完成總計</div>
      ${weekStats}
    </div>
    <div class="mt-4 bg-brand-light rounded-2xl p-4 flex items-center justify-between">
      <div>
        <div class="text-xs text-gray-500 mb-0.5">家庭代碼</div>
        <div class="text-xl font-bold tracking-widest text-brand">${_familyCode || '------'}</div>
      </div>
      <button onclick="leaveFamily()" class="text-xs text-gray-400 underline">離開家庭</button>
    </div>
    <div class="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xl">💾</span>
        <span class="font-bold text-blue-700">資料備份與還原</span>
      </div>
      <p class="text-xs text-blue-500 mb-3">定期匯出備份，避免清快取或換手機後資料消失</p>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="exportData()" class="bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold">⬇️ 匯出備份</button>
        <label class="bg-white border border-blue-300 text-blue-600 py-2.5 rounded-xl text-sm font-bold text-center cursor-pointer">
          ⬆️ 匯入還原
          <input type="file" accept=".json" class="hidden" onchange="importData(this)">
        </label>
      </div>
    </div>`;
}

// ── Parent: tasks management ──────────────────────────────────
function renderParentTasks() {
  const tasks    = S.getOrDefault('tasks', []);
  const children = S.getOrDefault('children', []);

  const taskRows = tasks.map(task => {
    const typeLabel = task.type === 'multi' ? '🔁 重複' : task.type === 'weekly' ? `📅 週×${task.weeklyTarget||1}` : '1️⃣ 一次';
    const gradeLabel = task.targetGrade === 'high' ? '高年級' : task.targetGrade === 'low' ? '低年級' : '全部';
    return `<div class="flex items-start p-4 gap-3">
      <div class="flex-1 min-w-0">
        <div class="font-medium text-sm">${task.emoji} ${task.name}</div>
        ${task.reminder ? `<div class="text-xs text-gray-400 mt-0.5">${task.reminder}</div>` : ''}
        <div class="text-xs text-gray-400 mt-1">${typeLabel}・${gradeLabel}・${task.category}</div>
      </div>
      <button onclick="deleteTask(${task.id})" class="text-gray-300 text-xs shrink-0 mt-1">刪除</button>
    </div>`;
  }).join('');

  document.getElementById('parent-tab-tasks').innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">${taskRows || '<p class="p-4 text-gray-300 text-sm">尚無任務</p>'}</div>
    <button onclick="showAddTaskForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold text-sm">＋ 新增任務</button>
    <div id="add-task-form" class="hidden mt-4 bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div class="font-bold text-sm">新增任務</div>
      <input id="new-task-name"   type="text" placeholder="任務名稱" class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
      <input id="new-task-reminder" type="text" placeholder="提醒說明（選填）" class="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
      <div class="flex gap-2">
        <input id="new-task-emoji" type="text" placeholder="Emoji" maxlength="2" class="w-20 border border-gray-200 rounded-xl p-3 text-sm text-center focus:outline-none focus:border-brand">
        <select id="new-task-category" class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
          <option>每日任務</option>
          <option>低年級專屬</option>
          <option>高年級專屬</option>
          <option>週末任務</option>
          <option>運動</option>
          <option>每週挑戰</option>
        </select>
      </div>
      <div class="flex gap-2">
        <select id="new-task-grade" class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
          <option value="all">全部年級</option>
          <option value="low">低年級</option>
          <option value="high">高年級</option>
        </select>
        <select id="new-task-type" class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
          <option value="once">每日一次</option>
          <option value="multi">可重複多次</option>
        </select>
      </div>
      <button onclick="addTask()" class="w-full bg-brand text-white py-3 rounded-xl text-sm font-bold">新增</button>
    </div>
    <div class="mt-6">
      <div class="font-semibold mb-3">年級設定</div>
      ${children.map(c => {
        const gl = c.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
        const gc = c.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';
        return `<div class="flex items-center justify-between bg-white rounded-2xl p-4 mb-2 shadow-sm">
          <span class="font-medium">${c.emoji} ${c.name}</span>
          <button onclick="setChildGrade(${c.id})" class="text-xs px-3 py-1 rounded-full ${gc}">${gl}</button>
        </div>`;
      }).join('')}
    </div>`;
}

function showAddTaskForm() {
  document.getElementById('add-task-form').classList.toggle('hidden');
}

function addTask() {
  const name     = document.getElementById('new-task-name').value.trim();
  const reminder = document.getElementById('new-task-reminder').value.trim();
  const emoji    = document.getElementById('new-task-emoji').value.trim() || '✅';
  const category = document.getElementById('new-task-category').value;
  const grade    = document.getElementById('new-task-grade').value;
  const type     = document.getElementById('new-task-type').value;
  if (!name) { alert('請輸入任務名稱'); return; }
  const tasks = S.getOrDefault('tasks', []);
  const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
  const task  = { id: newId, name, emoji, category, daysOfWeek: [], type, targetGrade: grade, difficulty: 'simple' };
  if (reminder) task.reminder = reminder;
  tasks.push(task);
  S.set('tasks', tasks);
  renderParentTasks();
}

function deleteTask(taskId) {
  if (!confirm('確定要刪除這個任務嗎？')) return;
  const tasks = S.getOrDefault('tasks', []).filter(t => t.id !== taskId);
  S.set('tasks', tasks);
  renderParentTasks();
}

function setChildGrade(childId) {
  const children = S.getOrDefault('children', []);
  const child    = children.find(c => c.id === childId);
  if (child) child.grade = child.grade === 'high' ? 'low' : 'high';
  S.set('children', children);
  renderParentTasks();
}

// ── Parent: 今日選擇管理 ──────────────────────────────────────
function renderParentFreeChoices() {
  const items = S.getOrDefault('freeChoiceItems', []);
  const logs  = S.getOrDefault('freeChoiceLogs', []);
  const children = S.getOrDefault('children', []);

  const itemRows = items.map(item => {
    const totalLogs = logs.filter(l => l.itemId === item.id).length;
    return `<div class="flex items-center p-3 gap-3">
      <span class="text-xl">${item.emoji}</span>
      <div class="flex-1">
        <div class="text-sm font-medium">${item.name}</div>
        <div class="text-xs text-gray-400">已記錄 ${totalLogs} 次</div>
      </div>
      <button onclick="deleteFreeChoiceItem(${item.id})" class="text-gray-300 text-xs">刪除</button>
    </div>`;
  }).join('');

  // 本月各孩子自由選擇統計
  const monthStart = today().slice(0, 7);
  const childStats = children.map(child => {
    const ml = logs.filter(l => l.childId === child.id && l.date.startsWith(monthStart));
    const counts = {};
    ml.forEach(l => {
      const item = items.find(i => i.id === l.itemId);
      const name = item ? `${item.emoji} ${item.name}` : (l.customName || '自訂');
      counts[name] = (counts[name] || 0) + 1;
    });
    const rows = Object.entries(counts).sort((a,b) => b[1]-a[1])
      .map(([n, c]) => `<div class="flex justify-between text-xs py-0.5"><span>${n}</span><span class="font-bold">${c}</span></div>`)
      .join('') || '<div class="text-xs text-gray-300">本月無記錄</div>';
    return `<div class="bg-white rounded-xl p-3 mb-2">
      <div class="font-medium text-sm mb-1">${child.emoji} ${child.name}</div>
      ${rows}
    </div>`;
  }).join('');

  document.getElementById('parent-tab-free-choice').innerHTML = `
    <div class="mb-4">
      <div class="font-semibold mb-2">本月選擇統計</div>
      ${childStats}
    </div>
    <div class="font-semibold mb-2">選項清單</div>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">${itemRows || '<p class="p-4 text-sm text-gray-300">尚無選項</p>'}</div>
    <button onclick="showAddFreeChoiceForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold text-sm">＋ 新增選項</button>
    <div id="add-fc-form" class="hidden mt-4 bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div class="font-bold text-sm">新增選項</div>
      <div class="flex gap-2">
        <input id="new-fc-emoji" type="text" placeholder="Emoji" maxlength="2" class="w-16 border border-gray-200 rounded-xl p-3 text-sm text-center focus:outline-none focus:border-brand">
        <input id="new-fc-name"  type="text" placeholder="活動名稱" class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
      </div>
      <button onclick="addFreeChoiceItem()" class="w-full bg-brand text-white py-3 rounded-xl text-sm font-bold">新增</button>
    </div>`;
}

function showAddFreeChoiceForm() {
  document.getElementById('add-fc-form').classList.toggle('hidden');
}

function addFreeChoiceItem() {
  const name  = document.getElementById('new-fc-name').value.trim();
  const emoji = document.getElementById('new-fc-emoji').value.trim() || '⭐';
  if (!name) { alert('請輸入活動名稱'); return; }
  const items = S.getOrDefault('freeChoiceItems', []);
  items.push({ id: Date.now(), name, emoji, category: '其他' });
  S.set('freeChoiceItems', items);
  renderParentFreeChoices();
}

function deleteFreeChoiceItem(itemId) {
  if (!confirm('確定要刪除這個選項嗎？')) return;
  const items = S.getOrDefault('freeChoiceItems', []).filter(i => i.id !== itemId);
  S.set('freeChoiceItems', items);
  renderParentFreeChoices();
}

// ── Parent: messages ──────────────────────────────────────────
function renderParentMessages() {
  const msgs = S.getOrDefault('messages', []);
  const rows = msgs.map(m => `
    <div class="flex items-start p-4 gap-3">
      <span class="text-xl">${m.emoji}</span>
      <div class="flex-1 text-sm">${m.text}</div>
      <button onclick="deleteMessage(${m.id})" class="text-gray-300 text-xs shrink-0">刪除</button>
    </div>`).join('');

  document.getElementById('parent-tab-messages').innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">${rows || '<p class="p-4 text-sm text-gray-300">尚無提醒</p>'}</div>
    <div class="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div class="font-bold text-sm">新增貼心提醒</div>
      <div class="flex gap-2">
        <input id="new-msg-emoji" type="text" placeholder="😊" maxlength="2"
          class="w-16 border border-gray-200 rounded-xl p-3 text-center text-lg focus:outline-none focus:border-brand">
        <input id="new-msg-text" type="text" placeholder="輸入提醒內容"
          class="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand">
      </div>
      <button onclick="addMessage()" class="w-full bg-brand text-white py-2.5 rounded-xl text-sm font-bold">新增</button>
    </div>`;
}

function addMessage() {
  const emoji = document.getElementById('new-msg-emoji').value.trim() || '💬';
  const text  = document.getElementById('new-msg-text').value.trim();
  if (!text) return;
  const msgs = S.getOrDefault('messages', []);
  msgs.push({ id: Date.now(), emoji, text });
  S.set('messages', msgs);
  renderParentMessages();
  document.getElementById('new-msg-text').value = '';
}

function deleteMessage(id) {
  const msgs = S.getOrDefault('messages', []).filter(m => m.id !== id);
  S.set('messages', msgs);
  renderParentMessages();
}

// ── Export / Import ────────────────────────────────────────────
function exportData() {
  const data = JSON.stringify({ familyCode: _familyCode, ..._cache }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `daily-life-backup-${today()}.json`;
  a.click();
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      delete data.familyCode;
      Object.entries(data).forEach(([k, v]) => S.set(k, v));
      alert('✅ 資料還原成功，請重新整理頁面');
    } catch { alert('❌ 檔案格式錯誤'); }
  };
  reader.readAsText(file);
}

// ── App start ─────────────────────────────────────────────────
async function appStart() {
  const code = localStorage.getItem('fg_family_code');
  if (code) {
    showLoading('載入家庭資料中...');
    try {
      const snap = await dbGet(ref(_db, `families/${code}`));
      if (snap.exists()) {
        _familyCode = code;
        _cache = snap.val() || {};
        initData();
        setupFamilyListener();
        hideLoading();
        renderWelcome();
        showPage('page-welcome');
        return;
      }
    } catch { }
    hideLoading();
    localStorage.removeItem('fg_family_code');
  }
  showPage('page-family-select');
}
document.addEventListener('DOMContentLoaded', appStart);

// ── Window exports ────────────────────────────────────────────
Object.assign(window, {
  showPage, saveSetup, logout, goToChildLogin, goToParentLogin,
  loginChild, loginParent,
  switchChildTab, switchParentTab, switchTaskTab,
  startNewFamily, joinFamilySubmit, leaveFamily,
  toggleTask, submitTask, cancelTask, cancelLastTask,
  showAddTaskForm, addTask, deleteTask, setChildGrade,
  addMessage, deleteMessage,
  logFreeChoice, logCustomChoice, deleteFreeChoiceLog,
  showAddFreeChoiceForm, addFreeChoiceItem, deleteFreeChoiceItem,
  exportData, importData,
});
