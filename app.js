// ── Storage helpers ───────────────────────────────────────────
const S = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getOrDefault: (k, d) => { const v = S.get(k); return v !== null ? v : d; }
};

const DAY_NAMES = ['日','一','二','三','四','五','六'];
const DAY_FULL  = ['週日','週一','週二','週三','週四','週五','週六'];

// ── 等級里程碑（依 1–4 點/任務 校正）─────────────────────────
const TIERS = [
  { pts:0,   label:'勤勞小芽', emoji:'🌱', desc:'萬事起頭難，你做到了！',     bg:'bg-green-50',  text:'text-green-700'  },
  { pts:15,  label:'習慣新星', emoji:'⭐', desc:'好習慣正在養成中，加油！',    bg:'bg-yellow-50', text:'text-yellow-700' },
  { pts:40,  label:'努力小將', emoji:'🥉', desc:'持之以恆，超棒的！',          bg:'bg-orange-50', text:'text-orange-700' },
  { pts:90,  label:'認真達人', emoji:'🥈', desc:'認真是最好的天賦！',          bg:'bg-blue-50',   text:'text-blue-700'   },
  { pts:160, label:'習慣大師', emoji:'🥇', desc:'你已是大家的榜樣！',          bg:'bg-purple-50', text:'text-purple-700' },
  { pts:250, label:'傳說勇者', emoji:'👑', desc:'無人能及的習慣勇者！',         bg:'bg-red-50',    text:'text-red-700'    },
];

// ── 任務難度說明 ───────────────────────────────────────────────
const DIFF_INFO = {
  simple:  { label:'簡單', dot:'🟢', time:'5 分鐘內',     pts:1 },
  medium:  { label:'中等', dot:'🟡', time:'15–30 分鐘',   pts:2 },
  hard:    { label:'困難', dot:'🔴', time:'30 分鐘以上',  pts:3 },
  special: { label:'特殊', dot:'⭐', time:'超越日常',     pts:4 },
};

// ── 才藝練習週獎勵 ─────────────────────────────────────────────
function getPracticeCountThisWeek(childId) {
  const tasks      = S.getOrDefault('tasks', []);
  const practiceIds = tasks.filter(t => t.isPractice).map(t => t.id);
  if (!practiceIds.length) return 0;
  const ws  = getWeekStart();
  const wed = new Date(ws); wed.setDate(wed.getDate() + 6);
  const we  = wed.toISOString().slice(0, 10);
  return S.getOrDefault('completions', []).filter(c =>
    practiceIds.includes(c.taskId) && c.childId === childId &&
    c.status === 'approved' && c.date >= ws && c.date <= we
  ).length;
}

function checkAndAwardPracticeBonus(childId) {
  if (getPracticeCountThisWeek(childId) < 5) return false;
  const key = `pb_${childId}_${getWeekStart()}`;
  if (S.get(key)) return false;
  setChildCoins(childId, getChildCoins(childId) + 3);
  S.set(key, true);
  return true;
}

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

// ── 預設獎勵清單 ───────────────────────────────────────────────
function getDefaultRewards() {
  return [
    // 遊戲時間兌換
    { id:1, name:'遊戲 15 分鐘',    desc:'平日使用，當日有效不累積',    coins:5,  emoji:'🎮', category:'遊戲時間' },
    { id:2, name:'遊戲 60 分鐘',    desc:'平日或週末均可，整一小時',    coins:15, emoji:'🕹️', category:'遊戲時間' },
    { id:3, name:'週末加碼 2 小時', desc:'僅限週末，需提前一天預約',    coins:30, emoji:'⏱️', category:'遊戲時間' },
    // 其他獎勵
    { id:4, name:'選週末外食地點',  desc:'全家一起享用',                coins:20, emoji:'🍜', category:'其他獎勵' },
    { id:5, name:'選假日活動',      desc:'公園、電影、DIY 等',          coins:40, emoji:'🎡', category:'其他獎勵' },
    { id:6, name:'大獎勵',          desc:'玩具、書、特殊體驗',          coins:80, emoji:'🎁', category:'其他獎勵' },
  ];
}

// ── 預設任務清單 ───────────────────────────────────────────────
function getDefaultTasks() {
  return [
    // ── 每日任務（全部小孩）─────────────────────────────
    { id:1,  name:'洗自己的便當盒',               category:'每日任務', coins:1, emoji:'🍱', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'simple'  },
    { id:2,  name:'完成每日作業（含連絡本簽名）',  category:'每日任務', coins:2, emoji:'📚', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'medium'  },
    { id:3,  name:'9點前洗澡',                    category:'每日任務', coins:1, emoji:'🚿', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'simple'  },
    { id:4,  name:'做一件家事',                   category:'每日任務', coins:1, emoji:'🧹', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'simple'  },
    { id:5,  name:'跟長輩打招呼',                 category:'每日任務', coins:1, emoji:'🙏', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'simple'  },
    { id:6,  name:'完成英文練習',                 category:'每日任務', coins:2, emoji:'🔤', daysOfWeek:[], type:'once',   targetGrade:'all', difficulty:'medium'  },
    // ── 低年級專屬 ──────────────────────────────────────
    { id:7,  name:'完成音樂練習',                 category:'低年級專屬', coins:1, emoji:'🎵', daysOfWeek:[], type:'once',  targetGrade:'low',  difficulty:'simple', isPractice:true },
    { id:8,  name:'練習 15 分鐘',                 category:'低年級專屬', coins:2, emoji:'⏱️', daysOfWeek:[], type:'once',  targetGrade:'low',  difficulty:'medium', isPractice:true },
    { id:9,  name:'練習 30 分鐘以上',             category:'低年級專屬', coins:3, emoji:'⏰', daysOfWeek:[], type:'once',  targetGrade:'low',  difficulty:'hard',   isPractice:true },
    { id:10, name:'主動練習（不用提醒）',          category:'低年級專屬', coins:3, emoji:'💪', daysOfWeek:[], type:'once',  targetGrade:'low',  difficulty:'hard',   isPractice:true },
    // ── 高年級專屬 ──────────────────────────────────────
    { id:11, name:'主動複習 / 整理筆記',           category:'高年級專屬', coins:3, emoji:'📖', daysOfWeek:[], type:'once',  targetGrade:'high', difficulty:'hard'    },
    { id:12, name:'協助規劃家庭事務',              category:'高年級專屬', coins:3, emoji:'📋', daysOfWeek:[], type:'once',  targetGrade:'high', difficulty:'hard'    },
    // ── 運動（可重複）─────────────────────────────────
    { id:20, name:'跳繩500下',                    category:'運動',     coins:2, emoji:'🪢', daysOfWeek:[], type:'multi',  targetGrade:'all', difficulty:'medium' },
    // ── 每週挑戰 ────────────────────────────────────────
    { id:21, name:'本週跳繩5000下',               category:'每週挑戰', coins:4, emoji:'🏅', daysOfWeek:[], type:'weekly', targetGrade:'all', weeklyTarget:10, autoFrom:20 },
    // ── 週末任務 ────────────────────────────────────────
    { id:13, name:'9點前完成早餐',    category:'週末任務', coins:1, emoji:'🍳', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple' },
    { id:14, name:'公園放風30分鐘',   category:'週末任務', coins:2, emoji:'🌳', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'medium' },
    { id:15, name:'跑步3K',           category:'週末任務', coins:3, emoji:'🏃', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'hard'   },
    { id:16, name:'倒垃圾',           category:'週末任務', coins:1, emoji:'🗑️', daysOfWeek:[], type:'once', targetGrade:'all', difficulty:'simple' },
  ];
}

// ── Init ──────────────────────────────────────────────────────
function initData() {
  // v1 → v2：清除單一小孩的舊資料
  if (S.get('initialized') && !S.get('children')) { localStorage.clear(); }

  if (S.get('initialized')) {
    const children = S.getOrDefault('children', []);
    // 補上第三個小孩
    if (children.length < 3) {
      children.push({ id: 3, name: '小勇者三', emoji: '🐼', grade: 'low' });
      S.set('children', children);
      const coins = S.getOrDefault('coins', {});
      if (!coins[3]) { coins[3] = 0; S.set('coins', coins); }
    }

    // v3 遷移：年級 + 新任務 + 集點卡
    if (!S.get('data_v3')) {
      // 為每個小孩補上年級
      children.forEach(c => { if (!c.grade) c.grade = 'low'; });
      S.set('children', children);

      // 換成新任務清單
      S.set('tasks', getDefaultTasks());

      // 初始化集點卡（從既有 approved 完成記錄推算）
      const comps  = S.getOrDefault('completions', []);
      const lc     = { 1: 0, 2: 0, 3: 0 };
      comps.filter(c => c.status === 'approved')
           .forEach(c => { if (lc[c.childId] !== undefined) lc[c.childId] += (c.coins || 0); });
      // 若計算值低於目前金幣，取較大值（含未記錄的獎勵）
      const curCoins = S.getOrDefault('coins', {});
      [1,2,3].forEach(id => { if (lc[id] < (curCoins[id]||0)) lc[id] = curCoins[id]||0; });
      S.set('lifetimeCoins', lc);

      // 初始化 lifetimeCoins for new children
      const coins = S.getOrDefault('coins', {});
      if (!coins[3]) { coins[3] = 0; S.set('coins', coins); }

      S.set('data_v3', true);
    }

    // v4 遷移：重新命名類別 + 依難度校正點數（1/2/3/4）
    if (!S.get('data_v4')) {
      const coinMap = { simple:1, medium:2, hard:3, special:4 };
      const tasks = S.getOrDefault('tasks', []);
      tasks.forEach(t => {
        if (t.category === '每日日常') t.category = '每日任務';
        if (t.difficulty && coinMap[t.difficulty] !== undefined) t.coins = coinMap[t.difficulty];
        // 跳繩500下（multi，medium）
        if (t.id === 20 && !t.difficulty) { t.difficulty = 'medium'; t.coins = 2; }
        // 本週跳繩5000下（weekly）
        if (t.id === 21) t.coins = 4;
      });
      S.set('tasks', tasks);
      S.set('data_v4', true);
    }

    // v5 遷移：新增週末任務
    if (!S.get('data_v5')) {
      const tasks      = S.getOrDefault('tasks', []);
      const existingIds = tasks.map(t => t.id);
      [
        { id:13, name:'9點前完成早餐',  category:'週末任務', coins:1, emoji:'🍳', daysOfWeek:[0,6], type:'once', targetGrade:'all', difficulty:'simple' },
        { id:14, name:'公園放風30分鐘', category:'週末任務', coins:2, emoji:'🌳', daysOfWeek:[0,6], type:'once', targetGrade:'all', difficulty:'medium' },
        { id:15, name:'跑步3K',         category:'週末任務', coins:3, emoji:'🏃', daysOfWeek:[0,6], type:'once', targetGrade:'all', difficulty:'hard'   },
        { id:16, name:'倒垃圾',         category:'週末任務', coins:1, emoji:'🗑️', daysOfWeek:[0,6], type:'once', targetGrade:'all', difficulty:'simple' },
      ].forEach(wt => { if (!existingIds.includes(wt.id)) tasks.push(wt); });
      S.set('tasks', tasks);
      S.set('data_v5', true);
    }

    // v6 遷移：更新獎勵清單 + 標記才藝練習任務
    if (!S.get('data_v6')) {
      S.set('rewards', getDefaultRewards());
      const tasks = S.getOrDefault('tasks', []);
      [7, 8, 9, 10].forEach(pid => {
        const t = tasks.find(x => x.id === pid);
        if (t) t.isPractice = true;
      });
      S.set('tasks', tasks);
      S.set('data_v6', true);
    }

    // v7 遷移：週末任務不再限定週末出現
    if (!S.get('data_v7')) {
      const tasks = S.getOrDefault('tasks', []);
      tasks.forEach(t => {
        if (t.category === '週末任務') t.daysOfWeek = [];
      });
      S.set('tasks', tasks);
      S.set('data_v7', true);
    }

    // v8 遷移：補入新增的貼心提醒
    if (!S.get('data_v8')) {
      const msgs      = S.getOrDefault('messages', []);
      const existIds  = msgs.map(m => m.id);
      getDefaultMessages().forEach(m => {
        if (!existIds.includes(m.id)) msgs.push(m);
      });
      S.set('messages', msgs);
      S.set('data_v8', true);
    }
    return;
  }

  // ── 全新安裝 ──────────────────────────────────────────────
  S.set('children', [
    { id: 1, name: '小勇者一', emoji: '🦁', grade: 'low' },
    { id: 2, name: '小勇者二', emoji: '🐯', grade: 'low' },
    { id: 3, name: '小勇者三', emoji: '🐼', grade: 'low' }
  ]);
  S.set('coins',         { 1: 0, 2: 0, 3: 0 });
  S.set('lifetimeCoins', { 1: 0, 2: 0, 3: 0 });
  S.set('tasks', getDefaultTasks());
  S.set('rewards', getDefaultRewards());
  S.set('messages', getDefaultMessages());
  S.set('completions',    []);
  S.set('redeemedRewards',[]);
  S.set('checkIns',       {});
  S.set('lastBonusStreak',{});
  S.set('data_v3',        true);
  S.set('data_v4',        true);
  S.set('data_v5',        true);
  S.set('data_v6',        true);
  S.set('data_v7',        true);
  S.set('data_v8',        true);
  S.set('initialized',    true);
}

// ── Page routing ──────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// ── Welcome ───────────────────────────────────────────────────
function renderWelcome() {
  const children = S.getOrDefault('children', []);
  const html = children.map(c => {
    const gl = c.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    const gc = c.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';
    return `<button onclick="goToChildLogin(${c.id})" class="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 hover:shadow-md transition">
       <div class="flex items-center justify-between">
         <div class="font-bold text-lg">${c.emoji} ${c.name}</div>
         <span class="text-xs px-2 py-0.5 rounded-full ${gc}">${gl}</span>
       </div>
       <div class="text-gray-400 text-sm mt-1">完成任務、獲得金幣</div>
     </button>`;
  }).join('') +
  `<button onclick="goToParentLogin()" class="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 hover:shadow-md transition">
     <div class="font-bold text-lg">🐻 爸爸 / 媽媽</div>
     <div class="text-gray-400 text-sm mt-1">養成管理、給予獎勵</div>
   </button>`;
  document.getElementById('welcome-buttons').innerHTML = html;
}

// ── Setup ─────────────────────────────────────────────────────
function saveSetup() {
  const p   = document.getElementById('setup-parent-pin').value.trim();
  const c1n = document.getElementById('setup-child1-name').value.trim() || '小勇者一';
  const c2n = document.getElementById('setup-child2-name').value.trim() || '小勇者二';
  const c3n = document.getElementById('setup-child3-name').value.trim() || '小勇者三';
  const c1g = document.querySelector('input[name="child1-grade"]:checked')?.value || 'low';
  const c2g = document.querySelector('input[name="child2-grade"]:checked')?.value || 'low';
  const c3g = document.querySelector('input[name="child3-grade"]:checked')?.value || 'low';

  if (p.length < 4) { alert('請輸入4位爸媽密碼'); return; }

  S.set('pins', { parent: p });
  const children = S.getOrDefault('children', []);
  if (children[0]) { children[0].name = c1n; children[0].grade = c1g; }
  if (children[1]) { children[1].name = c2n; children[1].grade = c2g; }
  if (children[2]) { children[2].name = c3n; children[2].grade = c3g; }
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
  const input   = document.getElementById('child-pin-input').value;
  const pins    = S.get('pins');
  const idx     = window._loginChildId - 1;
  if (pins && input === pins.children[idx]) {
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
  if (input === pins.parent) {
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

// ── Helpers ───────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

// grade 可傳入 'low'/'high'（小孩頁面），不傳則顯示全部（爸媽頁面）
function getActiveTasks(grade) {
  const dow = new Date().getDay();
  return S.getOrDefault('tasks', []).filter(t => {
    const dayOk   = !t.daysOfWeek || t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dow);
    const gradeOk = !grade || !t.targetGrade || t.targetGrade === 'all' || t.targetGrade === grade;
    return dayOk && gradeOk;
  });
}

function getChildCoins(id) {
  const c = S.getOrDefault('coins', {});
  return c[id] || 0;
}

function setChildCoins(id, newAmount) {
  const c = S.getOrDefault('coins', {});
  const oldAmount = c[id] || 0;
  c[id] = newAmount;
  S.set('coins', c);
  // 只有加分才累計終身點數
  if (newAmount > oldAmount) {
    const lc = S.getOrDefault('lifetimeCoins', {});
    lc[id] = (lc[id] || 0) + (newAmount - oldAmount);
    S.set('lifetimeCoins', lc);
  }
}

function getLifetimeCoins(id) {
  return S.getOrDefault('lifetimeCoins', {})[id] || 0;
}

function getChildName(id) {
  return S.getOrDefault('children', []).find(c => c.id === id)?.name || `小孩${id}`;
}

// 取本週一的日期字串，作為「這週」的唯一識別
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

// 本週已審核通過的次數（weekly 任務用）
// 若任務有 autoFrom，則改計算來源任務在本週的 approved 紀錄數
function getWeeklyProgress(childId, taskId) {
  const task      = S.getOrDefault('tasks', []).find(t => t.id === taskId);
  const weekStart = getWeekStart();
  const comps     = S.getOrDefault('completions', []);

  if (task?.autoFrom) {
    // 計算本週一到週日之間，來源任務的 approved 筆數
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);
    return comps.filter(c =>
      c.taskId === task.autoFrom &&
      c.childId === childId &&
      c.status === 'approved' &&
      c.date >= weekStart &&
      c.date <= weekEnd
    ).length;
  }

  return comps.filter(c =>
    c.taskId === taskId && c.childId === childId &&
    c.week === weekStart && c.status === 'approved'
  ).length;
}

// 本週是否已領過全勤獎勵
function checkAndAwardWeeklyBonus(childId, taskId) {
  const task = S.getOrDefault('tasks', []).find(t => t.id === taskId);
  if (!task || task.type !== 'weekly') return false;
  const progress = getWeeklyProgress(childId, taskId);
  if (progress < task.weeklyTarget) return false;
  const key = `wb_${childId}_${taskId}_${getWeekStart()}`;
  if (S.get(key)) return false;
  setChildCoins(childId, getChildCoins(childId) + task.coins);
  S.set(key, true);
  return true;
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

function markCheckIn(childId) {
  const checkIns = S.getOrDefault('checkIns', {});
  if (!checkIns[childId]) checkIns[childId] = [];
  if (checkIns[childId].includes(today())) return false; // 今天已打卡

  checkIns[childId].push(today());
  S.set('checkIns', checkIns);

  // 每連續 7 天發一次獎勵
  const streak = getStreak(childId);
  if (streak > 0 && streak % 7 === 0) {
    const lastBonus = S.getOrDefault('lastBonusStreak', {});
    if (lastBonus[childId] !== streak) {
      setChildCoins(childId, getChildCoins(childId) + 5);
      lastBonus[childId] = streak;
      S.set('lastBonusStreak', lastBonus);
      return true; // 發放獎勵
    }
  }
  return false;
}

function renderStreakWidget(childId) {
  const dates   = S.getOrDefault('checkIns', {})[childId] || [];
  const streak  = getStreak(childId);
  const justDone = streak > 0 && streak % 7 === 0;
  const remaining = justDone ? 0 : 7 - (streak % 7);

  // 顯示最近 7 天
  const now = new Date();
  const circles = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return {
      dayName: DAY_NAMES[d.getDay()],
      checked: dates.includes(dateStr),
      isToday: dateStr === today()
    };
  });

  const circlesHtml = circles.map(c => `
    <div class="flex flex-col items-center gap-1">
      <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
        ${c.checked ? 'bg-brand text-white' : c.isToday ? 'border-2 border-brand text-brand' : 'bg-gray-100 text-gray-300'}">
        ${c.checked ? '✓' : c.isToday ? '今' : ''}
      </div>
      <span class="text-xs text-gray-400">週${c.dayName}</span>
    </div>`).join('');

  const msgHtml = justDone
    ? `<div class="text-xs text-center text-green-500 font-bold">🎉 一週全勤！已獲得 +5 金幣</div>`
    : `<div class="text-xs text-center text-gray-400">再打卡 <span class="text-brand font-bold">${remaining}</span> 天，獲得全勤 +5 金幣</div>`;

  return `<div class="bg-white rounded-2xl shadow-sm p-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">🔥</span>
        <span class="font-bold">每日打卡</span>
      </div>
      <span class="font-bold ${streak > 0 ? 'text-brand' : 'text-gray-400'}">連續 ${streak} 天</span>
    </div>
    <div class="flex justify-between mb-3">${circlesHtml}</div>
    ${msgHtml}
  </div>`;
}

// ── Child: main ───────────────────────────────────────────────
function renderChildMain() {
  const id    = window._currentChildId;
  const child = S.getOrDefault('children', []).find(c => c.id === id);
  document.getElementById('child-name-display').textContent = child?.name || '小勇者';
  // 顯示年級標籤
  const gradeEl = document.getElementById('child-grade-display');
  if (gradeEl) {
    gradeEl.textContent = child?.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    gradeEl.className   = `text-xs px-2 py-0.5 rounded-full ${child?.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`;
  }
  updateChildHeader();
  renderChildTasks();
  renderStampCard();
  renderChildRewards();
  renderChildMyRewards();
  renderChildHistory();
  rotateBanner();
}

function updateChildHeader() {
  const id    = window._currentChildId;
  const child = S.getOrDefault('children', []).find(c => c.id === id);
  const activeTasks = getActiveTasks(child?.grade);
  const approved    = S.getOrDefault('completions', [])
    .filter(c => c.childId === id && c.date === today() && c.status === 'approved').length;
  const total = activeTasks.length;

  document.getElementById('child-coins').textContent        = getChildCoins(id);
  document.getElementById('child-progress-text').textContent = `${approved} / ${total}`;
  document.getElementById('child-progress-bar').style.width  = total ? `${(approved/total)*100}%` : '0%';
}

function rotateBanner() {
  const msgs = S.getOrDefault('messages', []);
  if (!msgs.length) return;
  const el = document.getElementById('banner-text');
  let i = 0;
  el.textContent = msgs[0].text;
  if (window._bannerInterval) clearInterval(window._bannerInterval);
  window._bannerInterval = setInterval(() => {
    i = (i + 1) % msgs.length;
    el.textContent = msgs[i].text;
  }, 5000);
}

function renderChildTasks() {
  const id          = window._currentChildId;
  const child       = S.getOrDefault('children', []).find(c => c.id === id);
  const activeTasks = getActiveTasks(child?.grade);
  const todayC      = S.getOrDefault('completions', []).filter(c => c.childId === id && c.date === today());

  const onceTasks    = activeTasks.filter(t => (t.type||'once')==='once' && t.category !== '週末任務');
  const multiTasks   = activeTasks.filter(t => t.type === 'multi');
  const weeklyTasks  = activeTasks.filter(t => t.type === 'weekly');
  const allTasks     = activeTasks.filter(t => t.category === '週末任務');

  document.getElementById('child-tab-tasks').innerHTML = `
    <div class="sticky top-0 z-20 bg-[#FAF7F4] px-5 pt-3">
      ${renderStreakWidget(id)}
      <div class="flex -mx-5 px-0 border-b border-gray-200 bg-[#FAF7F4] overflow-x-auto">
        <button id="stab-once"    onclick="switchTaskTab('once')"    class="stab-btn active shrink-0 flex-1 py-2.5 text-sm text-center">每日任務</button>
        <button id="stab-multi"   onclick="switchTaskTab('multi')"   class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">重覆任務</button>
        <button id="stab-weekend" onclick="switchTaskTab('weekend')" class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">週末任務</button>
        <button id="stab-weekly"  onclick="switchTaskTab('weekly')"  class="stab-btn shrink-0 flex-1 py-2.5 text-sm text-center text-gray-400">每週挑戰</button>
      </div>
    </div>
    <div id="stab-once-content"    class="stab-content px-5 pt-3 pb-24">${buildOnceHtml(onceTasks, todayC)}</div>
    <div id="stab-multi-content"   class="stab-content hidden px-5 pt-3 pb-24">${buildMultiHtml(multiTasks, todayC)}</div>
    <div id="stab-weekend-content" class="stab-content hidden px-5 pt-3 pb-24">${buildWeekendHtml(allTasks, todayC)}</div>
    <div id="stab-weekly-content"  class="stab-content hidden px-5 pt-3 pb-24">${buildWeeklyHtml(weeklyTasks, id)}</div>`;
}

function switchTaskTab(type) {
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

// 點數說明面板切換
function togglePointGuide() {
  const el = document.getElementById('point-guide-inline');
  if (el) el.classList.toggle('hidden');
}

// ── 一次性任務列表 ─────────────────────────────────────────────
function buildOnceHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">今天沒有每日任務</p>';
  const byCategory = {};
  tasks.forEach(t => { (byCategory[t.category] = byCategory[t.category] || []).push(t); });
  let html = '';
  for (const [cat, list] of Object.entries(byCategory)) {
    if (cat === '每日任務') {
      // 「每日任務」標題 + 點數說明連結
      html += `
      <div class="flex items-center justify-between mt-4 mb-2">
        <h3 class="text-sm font-semibold text-gray-500">每日任務</h3>
        <button onclick="togglePointGuide()" class="text-xs text-brand font-medium underline underline-offset-2">點數說明 ▾</button>
      </div>
      <div id="point-guide-inline" class="hidden rounded-xl bg-brand-light px-4 py-3 mb-3 text-xs">
        <div class="font-bold text-brand mb-2">📊 點數設計指南</div>
        <div class="space-y-1.5 text-gray-600">
          <div class="flex justify-between"><span>🟢 簡單（5 分鐘內）</span><span class="font-bold text-gray-700">1 點</span></div>
          <div class="flex justify-between"><span>🟡 中等（15–30 分鐘）</span><span class="font-bold text-gray-700">2 點</span></div>
          <div class="flex justify-between"><span>🔴 困難（30 分鐘以上）</span><span class="font-bold text-gray-700">3 點</span></div>
          <div class="flex justify-between"><span>⭐ 特殊貢獻</span><span class="font-bold text-gray-700">4 點</span></div>
        </div>
      </div>`;
    } else {
      html += `<h3 class="text-sm font-semibold text-gray-500 mb-2 mt-4">${cat}</h3>`;
    }
    html += `<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">`;
    list.forEach(task => {
      const comp   = todayC.find(c => c.taskId === task.id);
      const boxCls = 'task-checkbox' + (comp ? ' checked' : '');
      const dayTag = task.daysOfWeek?.length ? `<span class="text-xs text-blue-300 ml-1">（${task.daysOfWeek.map(d=>'週'+DAY_NAMES[d]).join('/')}）</span>` : '';
      let status = '';
      if (comp?.status === 'pending')  status = `<span class="text-xs text-orange-400">等待爸媽審核中...</span><button onclick="cancelTask(${task.id})" class="text-xs text-gray-300 underline ml-2">取消</button>`;
      if (comp?.status === 'approved') status = `<span class="text-xs text-green-500">已獲得 +${task.coins} 點</span>`;
      if (comp?.status === 'rejected') status = `<span class="text-xs text-red-400">爸媽駁回</span>`;
      html += `<div class="flex items-center p-4 gap-4">
        <div class="${boxCls}" onclick="${!comp ? `submitTask(${task.id})` : ''}">
          ${comp ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium">${task.emoji} ${task.name}${dayTag}</div>
          <div>${status}</div>
        </div>
        <div class="text-brand font-bold shrink-0">${task.coins} 點</div>
      </div>`;
    });
    html += '</div>';
  }
  return html;
}

// ── 多次性任務列表 ─────────────────────────────────────────────
function buildMultiHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有重覆任務</p>';
  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const allToday    = todayC.filter(c => c.taskId === task.id);
    const approvedCnt = allToday.filter(c => c.status === 'approved').length;
    const pendingCnt  = allToday.filter(c => c.status === 'pending').length;
    const rejectedCnt = allToday.filter(c => c.status === 'rejected').length;
    let statusParts = [];
    if (approvedCnt) statusParts.push(`<span class="text-green-500">已獲 +${approvedCnt * task.coins} 點</span>`);
    if (pendingCnt)  statusParts.push(`<span class="text-orange-400">${pendingCnt} 件待審核 <button onclick="cancelLastTask(${task.id})" class="text-gray-300 underline ml-1">取消</button></span>`);
    if (rejectedCnt) statusParts.push(`<span class="text-red-400">${rejectedCnt} 件駁回</span>`);
    html += `<div class="flex items-center p-4 gap-4">
      <div class="flex-1 min-w-0">
        <div class="font-medium">${task.emoji} ${task.name}
          ${allToday.length ? `<span class="text-brand font-bold ml-1">×${allToday.length}</span>` : ''}
        </div>
        <div class="text-xs">${statusParts.join(' ') || '<span class="text-gray-300">尚未完成</span>'}</div>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <div class="text-brand font-bold">${task.coins} 金幣／次</div>
        <button onclick="submitTask(${task.id})" class="text-xs bg-brand text-white px-3 py-1.5 rounded-full font-bold">＋ 完成一次</button>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ── 週末任務列表 ───────────────────────────────────────────────
function buildWeekendHtml(tasks, todayC) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">暫無週末任務</p>';

  let html = '<div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mt-3">';
  tasks.forEach(task => {
    const comp   = todayC.find(c => c.taskId === task.id);
    const boxCls = 'task-checkbox' + (comp ? ' checked' : '');
    const diffDot = task.difficulty ? (DIFF_INFO[task.difficulty]?.dot || '') : '';
    let status = '';
    if (comp?.status === 'pending')  status = `<span class="text-xs text-orange-400">等待爸媽審核中...</span><button onclick="cancelTask(${task.id})" class="text-xs text-gray-300 underline ml-2">取消</button>`;
    if (comp?.status === 'approved') status = `<span class="text-xs text-green-500">已獲得 +${task.coins} 點</span>`;
    if (comp?.status === 'rejected') status = `<span class="text-xs text-red-400">爸媽駁回</span>`;
    html += `<div class="flex items-center p-4 gap-4">
      <div class="${boxCls}" onclick="${!comp ? `submitTask(${task.id})` : ''}">
        ${comp ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium">${task.emoji} ${task.name} <span class="text-sm">${diffDot}</span></div>
        <div>${status}</div>
      </div>
      <div class="text-brand font-bold shrink-0">${task.coins} 點</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ── 每週挑戰任務列表 ───────────────────────────────────────────
function buildWeeklyHtml(tasks, childId) {
  if (!tasks.length) return '<p class="text-center text-gray-300 py-12">目前沒有每週挑戰</p>';
  const allTasks = S.getOrDefault('tasks', []);
  let html = '<div class="space-y-3 mt-3">';
  tasks.forEach(task => {
    const progress   = getWeeklyProgress(childId, task.id);
    const target     = task.weeklyTarget || 1;
    const done       = progress >= target;
    const pct        = Math.min(100, Math.round(progress / target * 100));
    const isAuto     = !!task.autoFrom; // 自動累計（不需手動提交）
    const pendingCnt = !isAuto
      ? S.getOrDefault('completions', [])
          .filter(c => c.taskId === task.id && c.childId === childId && c.week === getWeekStart() && c.status === 'pending').length
      : 0;

    // 自動累計模式：顯示來源任務名稱
    const sourceTask = isAuto ? allTasks.find(t => t.id === task.autoFrom) : null;

    html += `<div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="font-bold">${task.emoji} ${task.name}</div>
        <div class="text-brand font-bold">${task.coins} 金幣</div>
      </div>
      <div class="flex justify-between text-xs text-gray-400 mb-1">
        <span>本週進度</span>
        <span class="font-bold ${done ? 'text-green-500' : 'text-brand'}">${progress} / ${target} 次</span>
      </div>
      <div class="h-3 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div class="h-3 rounded-full transition-all ${done ? 'bg-green-400' : 'bg-brand'}" style="width:${pct}%"></div>
      </div>
      ${done
        ? `<div class="text-sm text-center text-green-500 font-bold py-1">🎉 本週完成！已獲得 ${task.coins} 金幣</div>`
        : isAuto
          ? `<div class="text-xs text-center text-gray-400 py-1">
               每次「${sourceTask?.name || '關聯任務'}」審核通過自動累計 🔗
             </div>`
          : `<div class="flex items-center justify-between">
               <span class="text-xs text-orange-400">${pendingCnt ? `${pendingCnt} 件待審核` : ''}</span>
               <button onclick="submitTask(${task.id})" class="bg-brand text-white px-5 py-2 rounded-xl text-sm font-bold">＋ 提交進度</button>
             </div>`
      }
    </div>`;
  });
  html += '</div>';
  return html;
}

function submitTask(taskId) {
  const id    = window._currentChildId;
  const tasks = S.getOrDefault('tasks', []);
  const task  = tasks.find(t => t.id === taskId);
  if (!task) return;
  const type  = task.type || 'once';
  const comps = S.getOrDefault('completions', []);

  // 一次性：每天只能提交一次
  if (type === 'once') {
    if (comps.find(c => c.taskId === taskId && c.childId === id && c.date === today())) return;
  }
  // 每週任務：自動累計的不可手動提交；達標後也不能再提交
  if (type === 'weekly') {
    if (task.autoFrom) return; // 由來源任務審核自動累計
    const progress = getWeeklyProgress(id, taskId);
    if (progress >= (task.weeklyTarget || 1)) return;
  }

  const entry = { id: Date.now(), taskId, childId: id, date: today(), status: 'pending', coins: task.coins, type };
  if (type === 'weekly') entry.week = getWeekStart();
  comps.push(entry);
  S.set('completions', comps);

  // 第一次提交任務 → 自動打卡，達成7天全勤 → 發放獎勵
  const bonusAwarded = markCheckIn(id);
  renderChildTasks();
  updateChildHeader();
  if (bonusAwarded) {
    setTimeout(() => alert('🎉 恭喜！連續打卡 7 天，獲得全勤獎勵 +5 金幣！'), 300);
  }
}

function cancelTask(taskId) {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', []);
  const idx   = comps.findIndex(c => c.taskId === taskId && c.childId === id && c.date === today() && c.status === 'pending');
  if (idx !== -1) comps.splice(idx, 1);
  S.set('completions', comps);
  renderChildTasks();
  updateChildHeader();
}

// 多次性任務：取消最後一筆待審核
function cancelLastTask(taskId) {
  const id    = window._currentChildId;
  const comps = S.getOrDefault('completions', []);
  // 找最後一筆 pending
  for (let i = comps.length - 1; i >= 0; i--) {
    const c = comps[i];
    if (c.taskId === taskId && c.childId === id && c.status === 'pending') {
      comps.splice(i, 1);
      break;
    }
  }
  S.set('completions', comps);
  renderChildTasks();
  updateChildHeader();
}

// ── 集點卡 ────────────────────────────────────────────────────
function renderStampCard() {
  const id       = window._currentChildId;
  const lifetime = getLifetimeCoins(id);

  // 找目前等級
  let tierIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lifetime >= TIERS[i].pts) { tierIdx = i; break; }
  }
  const cur  = TIERS[tierIdx];
  const next = TIERS[tierIdx + 1];

  // 往下一等級的進度條
  const progressHtml = next
    ? (() => {
        const earned = lifetime - cur.pts;
        const need   = next.pts - cur.pts;
        const pct    = Math.min(100, Math.round(earned / need * 100));
        return `<div class="mt-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>距離 ${next.emoji} ${next.label}</span>
            <span class="font-bold text-brand">還差 ${next.pts - lifetime} 點</span>
          </div>
          <div class="h-3 bg-white/60 rounded-full overflow-hidden">
            <div class="h-3 bg-white rounded-full transition-all" style="width:${pct}%;opacity:0.8"></div>
          </div>
        </div>`;
      })()
    : `<div class="text-center text-sm font-bold mt-3">🎊 已達最高傳說等級！</div>`;

  // 里程碑列表
  const milestones = TIERS.map((t, i) => {
    const reached = lifetime >= t.pts;
    const isCur   = i === tierIdx;
    return `<div class="flex items-center gap-3 py-2.5 ${i < TIERS.length-1 ? 'border-b border-gray-50' : ''}">
      <div class="text-2xl ${reached ? '' : 'grayscale opacity-30'}">${t.emoji}</div>
      <div class="flex-1">
        <div class="font-bold text-sm ${reached ? 'text-gray-700' : 'text-gray-300'}">${t.label}</div>
        <div class="text-xs ${reached ? 'text-gray-400' : 'text-gray-200'}">${t.pts === 0 ? '起點' : `累積 ${t.pts} 點解鎖`}</div>
      </div>
      <div>
        ${isCur
          ? '<span class="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-bold">現在</span>'
          : reached
            ? '<span class="text-xs text-green-500 font-bold">✅ 達成</span>'
            : `<span class="text-xs text-gray-300">${t.pts} 點</span>`
        }
      </div>
    </div>`;
  }).join('');

  // 難度說明
  const diffCards = Object.entries(DIFF_INFO).map(([, d]) =>
    `<div class="flex items-center gap-3 p-3 border-b border-gray-50 last:border-0">
      <div class="text-2xl">${d.dot}</div>
      <div class="flex-1">
        <div class="font-bold text-sm">${d.label}任務</div>
        <div class="text-xs text-gray-400">${d.time}</div>
      </div>
      <div class="font-bold text-brand text-base">＋ ${d.pts} 點</div>
    </div>`
  ).join('');

  document.getElementById('child-tab-stamps').innerHTML = `
    <div class="${cur.bg} rounded-2xl p-5 mb-4">
      <div class="text-center mb-3">
        <div class="text-5xl mb-1">${cur.emoji}</div>
        <div class="font-bold text-xl ${cur.text}">${cur.label}</div>
        <div class="text-xs text-gray-500 mt-1">${cur.desc}</div>
      </div>
      <div class="text-center">
        <span class="text-4xl font-bold text-gray-700">${lifetime}</span>
        <span class="text-gray-400 ml-1">累積點數</span>
      </div>
      ${progressHtml}
    </div>

    <div class="text-sm font-semibold text-gray-500 mb-2">📊 點數賺取說明</div>
    <div class="bg-white rounded-2xl shadow-sm mb-4">${diffCards}</div>

    <div class="text-sm font-semibold text-gray-500 mb-2">🗺️ 成就里程碑</div>
    <div class="bg-white rounded-2xl shadow-sm p-4">${milestones}</div>`;
}

function renderChildRewards() {
  const id      = window._currentChildId;
  const coins   = getChildCoins(id);
  const rewards = S.getOrDefault('rewards', []);

  const card = r => {
    const ok = coins >= r.coins;
    return `<div class="flex items-center p-4 gap-3">
      <div class="text-3xl">${r.emoji}</div>
      <div class="flex-1">
        <div class="font-medium">${r.name}</div>
        <div class="text-xs text-gray-400">${r.coins} 點・${r.desc}</div>
      </div>
      <button onclick="redeemReward(${r.id})"
        class="px-3 py-2 rounded-xl text-sm font-bold shrink-0 ${ok ? 'bg-brand text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}">兌換</button>
    </div>`;
  };

  const gameRewards  = rewards.filter(r => r.category === '遊戲時間');
  const otherRewards = rewards.filter(r => r.category !== '遊戲時間');

  // 才藝練習週獎勵狀態
  const practiceCount   = getPracticeCountThisWeek(id);
  const practiceAwarded = !!S.get(`pb_${id}_${getWeekStart()}`);
  const practicePct     = Math.min(100, Math.round(practiceCount / 5 * 100));

  let html = `
  <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex justify-between items-center">
    <div>
      <div class="text-xs text-yellow-600 mb-1">目前點數</div>
      <div class="text-3xl font-bold text-yellow-500">${coins} 💰</div>
    </div>
    <div class="text-xs text-gray-400 text-right">完成任務<br>累積更多</div>
  </div>

  <div class="text-sm font-semibold text-gray-500 mb-2">🎮 遊戲時間兌換</div>
  <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">
    ${gameRewards.length ? gameRewards.map(card).join('') : '<p class="text-center text-gray-300 py-6 text-sm">暫無遊戲時間獎勵</p>'}
  </div>

  <div class="text-sm font-semibold text-gray-500 mb-2">🎁 其他獎勵</div>
  <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-4">
    ${otherRewards.length ? otherRewards.map(card).join('') : '<p class="text-center text-gray-300 py-6 text-sm">暫無其他獎勵</p>'}
  </div>

  <div class="bg-brand-light rounded-2xl p-4">
    <div class="flex items-center justify-between mb-1">
      <div class="font-bold text-sm text-brand">⭐ 才藝練習週獎勵</div>
      ${practiceAwarded ? '<span class="text-xs text-green-500 font-bold">✅ 本週已領取！</span>' : ''}
    </div>
    <div class="text-xs text-gray-600 mb-2">每週練習 5 次以上，額外獲得 <span class="font-bold text-brand">＋3 點</span></div>
    <div class="flex items-center gap-2">
      <div class="flex-1 h-2 bg-white/70 rounded-full overflow-hidden">
        <div class="h-2 bg-brand rounded-full transition-all" style="width:${practicePct}%"></div>
      </div>
      <span class="text-xs font-bold ${practiceCount >= 5 ? 'text-green-600' : 'text-brand'}">${practiceCount} / 5 次</span>
    </div>
  </div>`;

  document.getElementById('child-tab-rewards').innerHTML = html;
}

function redeemReward(rewardId) {
  const id      = window._currentChildId;
  const rewards = S.getOrDefault('rewards', []);
  const r       = rewards.find(x => x.id === rewardId);
  const coins   = getChildCoins(id);
  if (coins < r.coins) { alert('金幣不足！'); return; }
  if (!confirm(`確定要兌換「${r.name}」嗎？需要 ${r.coins} 金幣`)) return;

  setChildCoins(id, coins - r.coins);
  const redeemed = S.getOrDefault('redeemedRewards', []);
  redeemed.push({
    id: Date.now(), rewardId, childId: id,
    rewardName: r.name, rewardEmoji: r.emoji, rewardDesc: r.desc,
    date: new Date().toISOString().slice(0,16), status: 'pending', coins: r.coins
  });
  S.set('redeemedRewards', redeemed);
  updateChildHeader();
  renderChildRewards();
  renderChildMyRewards();
  updateBadges();
}

function renderChildMyRewards() {
  const id       = window._currentChildId;
  const all      = S.getOrDefault('redeemedRewards', []).filter(r => r.childId === id);
  const pending  = all.filter(r => r.status === 'pending');
  const used     = all.filter(r => r.status === 'used');

  document.getElementById('my-rewards-badge').textContent = pending.length;
  document.getElementById('my-rewards-badge').classList.toggle('hidden', !pending.length);

  const card = (r, showBtn) => `
    <div class="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <div class="flex items-center gap-3 mb-3">
        <div class="text-3xl">${r.rewardEmoji}</div>
        <div class="flex-1">
          <div class="font-bold">${r.rewardName}</div>
          <div class="text-xs text-gray-400">${r.rewardDesc}</div>
          <div class="text-xs text-gray-300">兌換於 ${r.date}</div>
        </div>
        <span class="text-xs px-3 py-1 rounded-full ${r.status==='pending'?'bg-red-50 text-red-400':'bg-gray-100 text-gray-400'}">${r.status==='pending'?'未使用':'已使用'}</span>
      </div>
      ${showBtn && r.status==='pending' ? `<button onclick="applyUseReward(${r.id})" class="w-full bg-brand text-white py-2 rounded-xl text-sm font-bold">🎟️ 申請使用（給爸媽核銷）</button>` : ''}
      ${r.status==='used' ? `<div class="text-xs text-green-500 text-center">✅ 已使用・${r.usedDate||''}</div>` : ''}
    </div>`;

  const emptyMsg = '<p class="text-center text-gray-300 py-10">沒有獎勵</p>';
  document.getElementById('child-tab-my-rewards').innerHTML = `
    <div class="flex gap-2 mb-4">
      <button onclick="switchMyRewardsTab('pending',this)" id="mr-tab-pending" class="px-4 py-2 rounded-full text-sm font-bold bg-brand text-white">未使用</button>
      <button onclick="switchMyRewardsTab('used',this)" id="mr-tab-used" class="px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400">已使用</button>
    </div>
    <div id="mr-list-pending">${pending.map(r=>card(r,true)).join('')||emptyMsg}</div>
    <div id="mr-list-used" class="hidden">${used.map(r=>card(r,false)).join('')||emptyMsg}</div>`;
}

function switchMyRewardsTab(tab) {
  document.getElementById('mr-list-pending').classList.toggle('hidden', tab !== 'pending');
  document.getElementById('mr-list-used').classList.toggle('hidden',   tab !== 'used');
  document.getElementById('mr-tab-pending').className = `px-4 py-2 rounded-full text-sm font-bold ${tab==='pending'?'bg-brand text-white':'bg-gray-100 text-gray-400'}`;
  document.getElementById('mr-tab-used').className    = `px-4 py-2 rounded-full text-sm font-bold ${tab==='used'   ?'bg-brand text-white':'bg-gray-100 text-gray-400'}`;
}

function applyUseReward(id) {
  if (!confirm('確定要申請使用這個獎勵嗎？')) return;
  const redeemed = S.getOrDefault('redeemedRewards', []);
  const item = redeemed.find(r => r.id === id);
  if (item) item.status = 'pending-use';
  S.set('redeemedRewards', redeemed);
  renderChildMyRewards();
  alert('已送出申請，請給爸媽確認！');
}

function renderChildHistory() {
  const id    = window._currentChildId;
  const comps = [...S.getOrDefault('completions', []).filter(c => c.childId === id)].reverse();
  const tasks = S.getOrDefault('tasks', []);

  let html = `<div class="flex gap-2 mb-4 flex-wrap">
    ${['全部','今天','近7天','近30天'].map((l,i)=>
      `<button onclick="filterHistory(${i},this)" class="px-3 py-1 rounded-full text-sm ${i===0?'bg-brand text-white':'bg-gray-100 text-gray-400'}">${l}</button>`
    ).join('')}
  </div>
  <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">`;

  if (!comps.length) {
    html += '<p class="text-center text-gray-300 py-10">還沒有任何記錄</p>';
  } else {
    comps.forEach(c => {
      const task = tasks.find(t => t.id === c.taskId);
      if (!task) return;
      const color = c.status==='approved'?'text-blue-400':c.status==='rejected'?'text-red-400':'text-orange-400';
      const label = c.status==='approved'?'准奏':c.status==='rejected'?'駁回':'待審核';
      html += `<div class="flex items-center p-4 gap-3" data-date="${c.date}">
        <div class="flex-1"><div class="font-medium">${task.name}</div>
        <div class="text-xs text-gray-400">${c.date}</div></div>
        <div class="text-right">
          <div class="text-xs px-2 py-1 rounded-full bg-gray-50 ${color} mb-1">${label}</div>
          <div class="text-green-500 font-bold text-sm">+${c.coins}</div>
        </div>
      </div>`;
    });
  }
  html += '</div>';
  document.getElementById('child-tab-history').innerHTML = html;
}

function filterHistory(idx, btn) {
  document.querySelectorAll('#child-tab-history button').forEach(b =>
    b.className = 'px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-400');
  btn.className = 'px-3 py-1 rounded-full text-sm bg-brand text-white';
  const now = new Date();
  document.querySelectorAll('#child-tab-history [data-date]').forEach(row => {
    const diff = (now - new Date(row.dataset.date)) / 86400000;
    let show = true;
    if (idx===1) show = row.dataset.date === today();
    else if (idx===2) show = diff <= 7;
    else if (idx===3) show = diff <= 30;
    row.style.display = show ? '' : 'none';
  });
}

function switchChildTab(tab, btn) {
  document.querySelectorAll('.child-tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(`child-tab-${tab}`).classList.remove('hidden');
  document.querySelectorAll('#page-child-main .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // 切換到集點卡時重新渲染（確保資料最新）
  if (tab === 'stamps') renderStampCard();
}

// ── Parent: main ──────────────────────────────────────────────
function renderParentMain() {
  renderParentOverview();
  renderParentReview();
  renderParentTasks();
  renderParentRewardsMgmt();
  renderParentMessages();
  updateBadges();
}

function updateBadges() {
  const n = S.getOrDefault('completions', []).filter(c => c.status === 'pending').length
          + S.getOrDefault('redeemedRewards', []).filter(r => r.status === 'pending-use').length;
  document.getElementById('review-badge').textContent = n;
}

function renderParentOverview() {
  const children      = S.getOrDefault('children', []);
  const completions   = S.getOrDefault('completions', []);
  const activeTasks   = getActiveTasks();
  const taskPending   = completions.filter(c => c.status === 'pending').length;
  const rewardPending = S.getOrDefault('redeemedRewards', []).filter(r => r.status === 'pending-use').length;
  const totalPending  = taskPending + rewardPending;

  const childCards = children.map(child => {
    const coins       = getChildCoins(child.id);
    const childTasks  = getActiveTasks(child.grade); // 按年級過濾
    const approved    = completions.filter(c => c.childId===child.id && c.date===today() && c.status==='approved').length;
    const childPend   = completions.filter(c => c.childId===child.id && c.status==='pending').length;
    const gl = child.grade === 'high' ? '🎓 高年級' : '🌱 低年級';
    const gc = child.grade === 'high' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600';
    return `<div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">${child.emoji}</span>
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="font-bold">${child.name}</span>
            ${childPend ? `<span class="badge">${childPend}</span>` : ''}
          </div>
          <span class="text-xs px-1.5 py-0.5 rounded-full ${gc}">${gl}</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-center">
        <div class="bg-yellow-50 rounded-xl p-2">
          <div class="text-lg font-bold text-yellow-500">${coins}</div>
          <div class="text-xs text-gray-400">金幣</div>
        </div>
        <div class="bg-green-50 rounded-xl p-2">
          <div class="text-lg font-bold text-green-500">${approved}/${childTasks.length}</div>
          <div class="text-xs text-gray-400">今日完成</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const taskChips = activeTasks.map(t => {
    const allDone = children.every(child =>
      completions.some(c => c.taskId===t.id && c.childId===child.id && c.date===today() && c.status==='approved'));
    return `<span class="px-3 py-1 rounded-full text-sm ${allDone?'bg-green-100 text-green-600':'bg-gray-100 text-gray-400'}">${t.emoji} ${t.name}</span>`;
  }).join('');

  document.getElementById('parent-tab-overview').innerHTML = `
    ${totalPending ? `<div class="bg-orange-50 rounded-2xl p-4 mb-4 flex items-center justify-between cursor-pointer"
        onclick="switchParentTab('review', document.querySelector('[onclick*=review]'))">
      <div class="flex items-center gap-3"><span class="text-2xl">🔔</span>
        <div><div class="font-bold text-orange-700">有待處理項目</div>
        <div class="text-sm text-orange-500">共 ${totalPending} 件需要處理</div></div>
      </div><span class="text-orange-400">›</span>
    </div>` : ''}
    <div class="grid grid-cols-2 gap-3 mb-4">${childCards}</div>
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="bg-orange-50 rounded-2xl p-4"><div class="text-2xl mb-1">⏳</div>
        <div class="text-3xl font-bold text-orange-400">${taskPending}</div>
        <div class="text-xs text-gray-400">待審核任務</div></div>
      <div class="bg-pink-50 rounded-2xl p-4"><div class="text-2xl mb-1">🎟️</div>
        <div class="text-3xl font-bold text-pink-400">${rewardPending}</div>
        <div class="text-xs text-gray-400">票券核銷</div></div>
    </div>
    <div class="flex justify-between items-center mb-3">
      <span class="font-semibold">今日任務</span>
      <span class="text-xs text-brand cursor-pointer" onclick="switchParentTab('tasks',null)">管理 ›</span>
    </div>
    <div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex flex-wrap gap-2">${taskChips || '<span class="text-gray-300 text-sm">今天沒有任務</span>'}</div>
    </div>`;
}

function renderParentReview() {
  const completions = S.getOrDefault('completions', []);
  const tasks       = S.getOrDefault('tasks', []);
  const redeemed    = S.getOrDefault('redeemedRewards', []);
  const pending     = completions.filter(c => c.status === 'pending');
  const rewPending  = redeemed.filter(r => r.status === 'pending-use');
  const total       = pending.length + rewPending.length;

  const taskCards = pending.map(c => {
    const task = tasks.find(t => t.id === c.taskId);
    return `<div class="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <div class="flex justify-between items-start mb-3">
        <div><div class="font-bold text-lg">${task?.name||'未知任務'}</div>
        <div class="text-sm text-gray-400">${task?.coins||0} 金幣・${getChildName(c.childId)} 剛剛申報</div></div>
        <span class="text-xs px-3 py-1 bg-orange-50 text-orange-400 rounded-full">待審核</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="approveTask(${c.id})" class="bg-blue-50 text-blue-500 font-bold py-3 rounded-xl">✓ 准奏</button>
        <button onclick="rejectTask(${c.id})"  class="bg-red-50  text-red-400  font-bold py-3 rounded-xl">✕ 駁回</button>
      </div>
    </div>`;
  }).join('');

  const rewCards = rewPending.map(r =>
    `<div class="bg-white rounded-2xl shadow-sm p-4 mb-3">
      <div class="flex items-center gap-3 mb-3">
        <div class="text-3xl">${r.rewardEmoji}</div>
        <div class="flex-1"><div class="font-bold">${r.rewardName}</div>
        <div class="text-xs text-gray-400">${r.rewardDesc}・${getChildName(r.childId)} 申請核銷</div></div>
        <span class="text-xs px-3 py-1 bg-orange-50 text-orange-400 rounded-full">待核銷</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="approveReward(${r.id})" class="bg-blue-50 text-blue-500 font-bold py-3 rounded-xl">✓ 核銷</button>
        <button onclick="rejectReward(${r.id})"  class="bg-red-50  text-red-400  font-bold py-3 rounded-xl">✕ 拒絕</button>
      </div>
    </div>`
  ).join('');

  const history = [...completions.filter(c=>c.status!=='pending')].reverse().map(c => {
    const task = tasks.find(t => t.id === c.taskId);
    return `<div class="bg-white rounded-2xl p-4 mb-2 flex justify-between items-center">
      <div><div class="font-medium">${getChildName(c.childId)} — ${task?.name||'未知'}</div>
      <div class="text-xs text-gray-400">${c.date}</div></div>
      <span class="text-xs px-2 py-1 rounded-full ${c.status==='approved'?'bg-blue-50 text-blue-400':'bg-red-50 text-red-400'}">${c.status==='approved'?'准奏':'駁回'}</span>
    </div>`;
  }).join('') + [...redeemed.filter(r=>r.status==='used')].reverse().map(r =>
    `<div class="bg-white rounded-2xl p-4 mb-2 flex justify-between items-center">
      <div><div class="font-medium">${getChildName(r.childId)} — ${r.rewardName} 核銷</div>
      <div class="text-xs text-gray-400">${r.date}</div></div>
      <span class="text-xs px-2 py-1 rounded-full bg-green-50 text-green-400">已核銷</span>
    </div>`
  ).join('');

  document.getElementById('parent-tab-review').innerHTML = `
    <div class="flex gap-2 mb-4">
      <button onclick="switchReviewTab('pending',this)" id="rv-tab-pending"
        class="flex-1 py-3 rounded-xl font-bold bg-white shadow-sm text-brand border-2 border-brand">
        待處理（${total}）${total?`<span class="badge ml-1">${total}</span>`:''}
      </button>
      <button onclick="switchReviewTab('history',this)" id="rv-tab-history"
        class="flex-1 py-3 rounded-xl font-bold bg-white shadow-sm text-gray-400">歷程紀錄</button>
    </div>
    <div id="rv-list-pending">${taskCards+rewCards || '<p class="text-center text-gray-300 py-12">目前沒有待審核項目 🎉</p>'}</div>
    <div id="rv-list-history" class="hidden">${history || '<p class="text-center text-gray-300 py-12">尚無歷程</p>'}</div>`;
}

function switchReviewTab(tab) {
  document.getElementById('rv-list-pending').classList.toggle('hidden', tab!=='pending');
  document.getElementById('rv-list-history').classList.toggle('hidden', tab!=='history');
  document.getElementById('rv-tab-pending').className = `flex-1 py-3 rounded-xl font-bold bg-white shadow-sm ${tab==='pending'?'text-brand border-2 border-brand':'text-gray-400'}`;
  document.getElementById('rv-tab-history').className = `flex-1 py-3 rounded-xl font-bold bg-white shadow-sm ${tab==='history'?'text-brand border-2 border-brand':'text-gray-400'}`;
}

function approveTask(id) {
  const comps = S.getOrDefault('completions', []);
  const c = comps.find(x => x.id === id);
  if (!c) return;
  c.status = 'approved';
  S.set('completions', comps);
  const taskType = c.type || 'once';
  if (taskType === 'weekly') {
    // 每週任務：達標才給金幣
    checkAndAwardWeeklyBonus(c.childId, c.taskId);
  } else {
    // 一次性 / 多次性：每次准奏即給點數
    const curTask = S.getOrDefault('tasks', []).find(t => t.id === c.taskId);
    const awardCoins = curTask ? curTask.coins : c.coins; // 用任務目前點數
    setChildCoins(c.childId, getChildCoins(c.childId) + awardCoins);
    // 若有 autoFrom 連結此任務的每週挑戰，自動檢查是否達標
    S.getOrDefault('tasks', [])
      .filter(t => t.type === 'weekly' && t.autoFrom === c.taskId)
      .forEach(wt => checkAndAwardWeeklyBonus(c.childId, wt.id));
    // 才藝練習週獎勵
    if (curTask?.isPractice) checkAndAwardPracticeBonus(c.childId);
  }
  renderParentMain();
}

function rejectTask(id) {
  const comps = S.getOrDefault('completions', []);
  const c = comps.find(x => x.id === id);
  if (c) c.status = 'rejected';
  S.set('completions', comps);
  renderParentMain();
}

function approveReward(id) {
  const redeemed = S.getOrDefault('redeemedRewards', []);
  const r = redeemed.find(x => x.id === id);
  if (r) { r.status = 'used'; r.usedDate = new Date().toISOString().slice(0,16); }
  S.set('redeemedRewards', redeemed);
  renderParentMain();
}

function rejectReward(id) {
  const redeemed = S.getOrDefault('redeemedRewards', []);
  const r = redeemed.find(x => x.id === id);
  if (r) { r.status = 'pending'; setChildCoins(r.childId, getChildCoins(r.childId) + r.coins); }
  S.set('redeemedRewards', redeemed);
  renderParentMain();
}

// ── Parent: tasks ─────────────────────────────────────────────
// 修改小孩年級
function setChildGrade(childId, grade) {
  const children = S.getOrDefault('children', []);
  const child = children.find(c => c.id === childId);
  if (child) { child.grade = grade; S.set('children', children); }
  renderParentTasks(); // 重新渲染讓 UI 更新
}

function renderParentTasks() {
  const tasks    = S.getOrDefault('tasks', []);
  const children = S.getOrDefault('children', []);
  const byCategory = {};
  tasks.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  // ── 年級管理卡片 ──
  const gradeCards = children.map(c => {
    const isLow  = (c.grade || 'low') === 'low';
    const isHigh = !isLow;
    return `<div class="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span class="text-2xl">${c.emoji}</span>
      <span class="font-medium flex-1">${c.name}</span>
      <div class="flex gap-2">
        <button onclick="setChildGrade(${c.id},'low')"
          class="px-3 py-1 rounded-full text-xs font-bold border-2 transition
                 ${isLow ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-gray-200'}">
          🌱 低年級
        </button>
        <button onclick="setChildGrade(${c.id},'high')"
          class="px-3 py-1 rounded-full text-xs font-bold border-2 transition
                 ${isHigh ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-400 border-gray-200'}">
          🎓 高年級
        </button>
      </div>
    </div>`;
  }).join('');

  const dayCheckboxes = DAY_FULL.map((d,i) =>
    `<label class="flex items-center gap-1 text-sm cursor-pointer">
       <input type="checkbox" value="${i}" name="new-task-days" class="rounded accent-brand"> ${d}
     </label>`
  ).join('');

  let html = `
  <div class="bg-white rounded-2xl shadow-sm p-4 mb-5">
    <div class="font-bold text-sm text-gray-600 mb-1">👶 小孩年級設定</div>
    <div class="text-xs text-gray-400 mb-3">點選按鈕即可切換年級，任務會立即更新</div>
    ${gradeCards}
  </div>
  <button onclick="showAddTaskForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold mb-5">＋ 新增任務</button>
  <div id="add-task-form" class="hidden bg-white rounded-2xl shadow-sm p-5 mb-5">
    <h3 class="font-bold mb-4">新增任務</h3>
    <div class="space-y-3">
      <input id="new-task-name" placeholder="任務名稱" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-task-emoji" placeholder="Emoji（如 📚）" value="⭐" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-task-coins" type="number" placeholder="金幣數量" value="10" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <select id="new-task-category" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
        <option>每日任務</option><option>低年級專屬</option><option>高年級專屬</option><option>週末任務</option><option>運動</option><option>每週挑戰</option>
      </select>
      <div>
        <div class="text-sm text-gray-400 mb-2">適用年級</div>
        <div class="grid grid-cols-3 gap-2">
          <label class="flex flex-col items-center p-2 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-grade" value="all" checked class="hidden"><span class="text-base">👨‍👩‍👧</span><span class="text-xs font-bold mt-0.5">全部</span>
          </label>
          <label class="flex flex-col items-center p-2 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-grade" value="low" class="hidden"><span class="text-base">🌱</span><span class="text-xs font-bold mt-0.5">低年級</span>
          </label>
          <label class="flex flex-col items-center p-2 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-grade" value="high" class="hidden"><span class="text-base">🎓</span><span class="text-xs font-bold mt-0.5">高年級</span>
          </label>
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-400 mb-2">難度（選後自動填點數）</div>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-2 p-2.5 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="new-task-difficulty" value="simple" class="hidden"><span>🟢</span><div><div class="text-xs font-bold">簡單</div><div class="text-xs text-gray-400">5分內・5點</div></div>
          </label>
          <label class="flex items-center gap-2 p-2.5 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="new-task-difficulty" value="medium" class="hidden"><span>🟡</span><div><div class="text-xs font-bold">中等</div><div class="text-xs text-gray-400">15–30分・15點</div></div>
          </label>
          <label class="flex items-center gap-2 p-2.5 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="new-task-difficulty" value="hard" class="hidden"><span>🔴</span><div><div class="text-xs font-bold">困難</div><div class="text-xs text-gray-400">30分以上・30點</div></div>
          </label>
          <label class="flex items-center gap-2 p-2.5 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input type="radio" name="new-task-difficulty" value="special" class="hidden"><span>⭐</span><div><div class="text-xs font-bold">特殊貢獻</div><div class="text-xs text-gray-400">超越日常・50點</div></div>
          </label>
        </div>
      </div>
      <div>
        <div class="text-sm text-gray-400 mb-2">任務類型</div>
        <div class="grid grid-cols-3 gap-2">
          <label class="flex flex-col items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-type" value="once" checked class="hidden"> <span class="text-lg">1️⃣</span><span class="text-xs font-bold mt-1">一次性</span><span class="text-xs text-gray-400">每天1次</span>
          </label>
          <label class="flex flex-col items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-type" value="multi" class="hidden"> <span class="text-lg">🔁</span><span class="text-xs font-bold mt-1">多次性</span><span class="text-xs text-gray-400">無限次</span>
          </label>
          <label class="flex flex-col items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-center">
            <input type="radio" name="new-task-type" value="weekly" class="hidden"> <span class="text-lg">📅</span><span class="text-xs font-bold mt-1">每週任務</span><span class="text-xs text-gray-400">累計達標</span>
          </label>
        </div>
      </div>
      <div id="weekly-target-field" class="hidden">
        <div class="text-sm text-gray-400 mb-2">本週需完成次數</div>
        <input id="new-task-weekly-target" type="number" value="5" min="1"
          class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
        <div class="text-xs text-gray-400 mt-1">例：跳繩5000下，每次500下 → 填 10</div>
      </div>
      <div>
        <div class="text-sm text-gray-400 mb-2">指定星期（不選 = 每天都出現）</div>
        <div class="flex flex-wrap gap-3">${dayCheckboxes}</div>
      </div>
      <button onclick="addTask()" class="w-full bg-brand text-white py-3 rounded-xl font-bold">確認新增</button>
    </div>
  </div>`;

  for (const [cat, list] of Object.entries(byCategory)) {
    html += `<h3 class="text-sm font-semibold text-gray-500 mb-2 mt-4">${cat}</h3>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-3">`;
    list.forEach(task => {
      const dayLabel   = task.daysOfWeek?.length ? task.daysOfWeek.map(d=>DAY_FULL[d]).join('、') : '每天';
      const typeLabel  = task.type==='multi' ? '🔁 重複' : task.type==='weekly' ? `📅 週×${task.weeklyTarget||1}` : '1️⃣ 一次';
      const gradeLabel = task.targetGrade==='low' ? '🌱低' : task.targetGrade==='high' ? '🎓高' : '全';
      const diffDot    = task.difficulty ? (DIFF_INFO[task.difficulty]?.dot || '') : '';
      html += `<div class="flex items-center p-4 gap-3">
        <div class="text-2xl">${task.emoji}</div>
        <div class="flex-1"><div class="font-medium">${task.name}</div>
        <div class="text-xs text-gray-400">${task.coins}點・${dayLabel}・${typeLabel}・${gradeLabel}${diffDot ? `・${diffDot}` : ''}</div></div>
        <button onclick="deleteTask(${task.id})" class="text-red-300 text-sm px-3 py-1 hover:text-red-500">刪除</button>
      </div>`;
    });
    html += '</div>';
  }
  document.getElementById('parent-tab-tasks').innerHTML = html;
}

function showAddTaskForm() {
  document.getElementById('add-task-form').classList.toggle('hidden');
}

// 顯示/隱藏每週目標欄位
document.addEventListener('change', e => {
  if (e.target.name === 'new-task-type') {
    const field = document.getElementById('weekly-target-field');
    if (field) field.classList.toggle('hidden', e.target.value !== 'weekly');
  }
  // 選難度後自動建議點數
  if (e.target.name === 'new-task-difficulty') {
    const coinMap = { simple:1, medium:2, hard:3, special:4 };
    const coinsEl = document.getElementById('new-task-coins');
    if (coinsEl && coinMap[e.target.value] !== undefined) coinsEl.value = coinMap[e.target.value];
  }
});

function addTask() {
  const name         = document.getElementById('new-task-name').value.trim();
  const emoji        = document.getElementById('new-task-emoji').value.trim() || '⭐';
  const coins        = parseInt(document.getElementById('new-task-coins').value) || 10;
  const category     = document.getElementById('new-task-category').value;
  const days         = [...document.querySelectorAll('input[name="new-task-days"]:checked')].map(el=>+el.value);
  const type         = document.querySelector('input[name="new-task-type"]:checked')?.value || 'once';
  const targetGrade  = document.querySelector('input[name="new-task-grade"]:checked')?.value || 'all';
  const difficulty   = document.querySelector('input[name="new-task-difficulty"]:checked')?.value || '';
  const weeklyTarget = type === 'weekly' ? (parseInt(document.getElementById('new-task-weekly-target').value) || 5) : undefined;
  if (!name) { alert('請輸入任務名稱'); return; }
  const tasks = S.getOrDefault('tasks', []);
  const task  = { id: Date.now(), name, emoji, coins, category, daysOfWeek: days, type, targetGrade };
  if (difficulty)   task.difficulty   = difficulty;
  if (weeklyTarget) task.weeklyTarget = weeklyTarget;
  tasks.push(task);
  S.set('tasks', tasks);
  renderParentTasks();
}

function deleteTask(id) {
  if (!confirm('確定刪除此任務？')) return;
  S.set('tasks', S.getOrDefault('tasks', []).filter(t => t.id !== id));
  renderParentTasks();
}

// ── Parent: rewards ───────────────────────────────────────────
function renderParentRewardsMgmt() {
  const rewards = S.getOrDefault('rewards', []);

  const byCategory = {};
  rewards.forEach(r => {
    const cat = r.category || '其他獎勵';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  });

  let html = `<button onclick="showAddRewardForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold mb-5">＋ 新增獎勵</button>
  <div id="add-reward-form" class="hidden bg-white rounded-2xl shadow-sm p-5 mb-5">
    <h3 class="font-bold mb-4">新增獎勵</h3>
    <div class="space-y-3">
      <input id="new-reward-name"  placeholder="獎勵名稱" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-emoji" placeholder="Emoji（如 🎁）" value="🎁" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-desc"  placeholder="說明（如：限週末使用）" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-coins" type="number" placeholder="所需點數" value="10" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <div>
        <div class="text-sm text-gray-400 mb-2">類別</div>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center justify-center gap-1 py-2 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-sm font-bold">
            <input type="radio" name="new-reward-category" value="遊戲時間" checked class="hidden"> 🎮 遊戲時間
          </label>
          <label class="flex items-center justify-center gap-1 py-2 border-2 border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-light text-sm font-bold">
            <input type="radio" name="new-reward-category" value="其他獎勵" class="hidden"> 🎁 其他獎勵
          </label>
        </div>
      </div>
      <button onclick="addReward()" class="w-full bg-brand text-white py-3 rounded-xl font-bold">確認新增</button>
    </div>
  </div>`;

  const catOrder = ['遊戲時間', '其他獎勵'];
  const allCats  = [...new Set([...catOrder, ...Object.keys(byCategory)])];
  allCats.forEach(cat => {
    const list = byCategory[cat];
    if (!list?.length) return;
    const catIcon = cat === '遊戲時間' ? '🎮 ' : '🎁 ';
    html += `<h3 class="text-sm font-semibold text-gray-500 mb-2 mt-4">${catIcon}${cat}</h3>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-3">`;
    list.forEach(r => {
      html += `<div class="flex items-center p-4 gap-3">
        <div class="text-3xl">${r.emoji}</div>
        <div class="flex-1"><div class="font-medium">${r.name}</div>
        <div class="text-xs text-gray-400">${r.coins} 點・${r.desc}</div></div>
        <button onclick="deleteReward(${r.id})" class="text-red-300 text-sm px-3 py-1 hover:text-red-500">刪除</button>
      </div>`;
    });
    html += '</div>';
  });

  document.getElementById('parent-tab-rewards-mgmt').innerHTML = html;
}

function showAddRewardForm() {
  document.getElementById('add-reward-form').classList.toggle('hidden');
}

function addReward() {
  const name     = document.getElementById('new-reward-name').value.trim();
  const emoji    = document.getElementById('new-reward-emoji').value.trim() || '🎁';
  const desc     = document.getElementById('new-reward-desc').value.trim();
  const coins    = parseInt(document.getElementById('new-reward-coins').value) || 10;
  const category = document.querySelector('input[name="new-reward-category"]:checked')?.value || '其他獎勵';
  if (!name) { alert('請輸入獎勵名稱'); return; }
  const rewards = S.getOrDefault('rewards', []);
  rewards.push({ id: Date.now(), name, emoji, desc, coins, category });
  S.set('rewards', rewards);
  renderParentRewardsMgmt();
}

function deleteReward(id) {
  if (!confirm('確定刪除此獎勵？')) return;
  S.set('rewards', S.getOrDefault('rewards', []).filter(r => r.id !== id));
  renderParentRewardsMgmt();
}

// ── Parent: messages ──────────────────────────────────────────
const EMOJIS = ['💡','❤️','⭐','🙏','😊','🎯','📚','🌈','🤝','🧹','🐥','💬','🫶','🏃','🌸'];

function renderParentMessages() {
  const messages = S.getOrDefault('messages', []);
  const grid = EMOJIS.map(e =>
    `<button onclick="selectEmoji('${e}',this)" class="emoji-btn w-12 h-12 bg-gray-100 rounded-xl text-2xl border-2 border-transparent hover:bg-brand-light">${e}</button>`
  ).join('');
  const list = messages.map(m =>
    `<div class="flex items-center p-4 gap-3">
      <span class="text-2xl">${m.emoji}</span>
      <div class="flex-1 text-sm">${m.text}</div>
      <button onclick="deleteMessage(${m.id})" class="text-red-300 text-sm px-3 py-1 hover:text-red-500">刪除</button>
    </div>`
  ).join('');

  document.getElementById('parent-tab-messages').innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm p-5 mb-5">
      <h3 class="font-bold mb-4">＋ 新增每日提醒</h3>
      <div class="text-sm text-gray-400 mb-2">選擇 Emoji</div>
      <div id="emoji-grid" class="flex flex-wrap gap-2 mb-4">${grid}</div>
      <div class="text-sm text-gray-400 mb-2">提醒內容</div>
      <input id="new-message-text" placeholder="例：今天要記得跟同學打招呼！"
        class="w-full border border-gray-200 rounded-xl p-3 mb-4 focus:outline-none focus:border-brand">
      <button onclick="addMessage()" class="w-full bg-brand text-white py-3 rounded-xl font-bold">確認新增</button>
    </div>
    <div class="text-sm text-gray-400 mb-2">目前提醒清單（${messages.length} 條）</div>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">${list||'<p class="text-center text-gray-300 py-8">尚無提醒</p>'}</div>`;
  window._selectedEmoji = '💡';
}

function selectEmoji(emoji, btn) {
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('border-brand','bg-brand-light'));
  btn.classList.add('border-brand','bg-brand-light');
  window._selectedEmoji = emoji;
}

function addMessage() {
  const text = document.getElementById('new-message-text').value.trim();
  if (!text) { alert('請輸入提醒內容'); return; }
  const messages = S.getOrDefault('messages', []);
  messages.push({ id: Date.now(), emoji: window._selectedEmoji || '💡', text });
  S.set('messages', messages);
  renderParentMessages();
}

function deleteMessage(id) {
  if (!confirm('確定刪除此提醒？')) return;
  S.set('messages', S.getOrDefault('messages', []).filter(m => m.id !== id));
  renderParentMessages();
}

function switchParentTab(tab) {
  document.querySelectorAll('.parent-tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(`parent-tab-${tab}`).classList.remove('hidden');
  document.querySelectorAll('#page-parent-main .tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`#page-parent-main .tab-btn[onclick*="${tab}"]`);
  if (btn) btn.classList.add('active');
}

// ── Boot ──────────────────────────────────────────────────────
initData();
if (!S.get('pins')) {
  showPage('page-setup');
} else {
  renderWelcome();
  showPage('page-welcome');
}
