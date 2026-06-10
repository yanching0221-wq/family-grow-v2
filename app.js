// ── Storage helpers ───────────────────────────────────────────
const S = {
  get: k => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getOrDefault: (k, d) => { const v = S.get(k); return v !== null ? v : d; }
};

const DAY_NAMES = ['日','一','二','三','四','五','六'];
const DAY_FULL  = ['週日','週一','週二','週三','週四','週五','週六'];

// ── Init ──────────────────────────────────────────────────────
function initData() {
  // 從 v1（單一小孩）升級到 v2（多小孩）時清除舊資料
  if (S.get('initialized') && !S.get('children')) {
    localStorage.clear();
  }
  if (S.get('initialized')) {
    // 自動補上第三個小孩（舊資料只有兩個小孩時）
    const children = S.getOrDefault('children', []);
    if (children.length < 3) {
      children.push({ id: 3, name: '小勇者三', emoji: '🐼' });
      S.set('children', children);
      const coins = S.getOrDefault('coins', {});
      if (!coins[3]) { coins[3] = 0; S.set('coins', coins); }
    }
    return;
  }

  S.set('children', [
    { id: 1, name: '小勇者一', emoji: '🦁' },
    { id: 2, name: '小勇者二', emoji: '🐯' },
    { id: 3, name: '小勇者三', emoji: '🐼' }
  ]);
  S.set('coins', { 1: 0, 2: 0, 3: 0 });
  S.set('tasks', [
    { id:1, name:'整理書包',     category:'學習任務', coins:10, emoji:'🎒', daysOfWeek:[] },
    { id:2, name:'完成當天作業', category:'學習任務', coins:30, emoji:'📚', daysOfWeek:[] },
    { id:3, name:'摺棉被整理床', category:'生活雜事', coins:10, emoji:'🛏️', daysOfWeek:[] },
    { id:4, name:'幫忙洗碗',     category:'生活雜事', coins:20, emoji:'🍽️', daysOfWeek:[] },
    { id:5, name:'倒垃圾',       category:'生活雜事', coins:20, emoji:'🗑️', daysOfWeek:[6] },
    { id:6, name:'練習才藝30分鐘',category:'學習任務', coins:20, emoji:'🎵', daysOfWeek:[] },
  ]);
  S.set('rewards', [
    { id:1, name:'手搖飲一杯',   desc:'任選，限50元內', coins:80,  emoji:'🧋' },
    { id:2, name:'延後睡覺1小時',desc:'限週末使用',     coins:100, emoji:'🌙' },
    { id:3, name:'選一部電影',   desc:'家庭電影夜',     coins:120, emoji:'🎬' },
    { id:4, name:'遊樂場半天',   desc:'假日出遊',       coins:300, emoji:'🎡' },
  ]);
  S.set('messages', [
    { id:1, emoji:'💬', text:'今天記得說好話，讓別人開心！' },
    { id:2, emoji:'🙏', text:'受到別人幫助時，要記得說謝謝～' },
    { id:3, emoji:'⭐', text:'每天進步一點點，你就是最棒的！' },
    { id:4, emoji:'😊', text:'微笑是免費的禮物，多給別人一個！' },
  ]);
  S.set('completions', []);
  S.set('redeemedRewards', []);
  S.set('checkIns', {});
  S.set('lastBonusStreak', {});
  S.set('initialized', true);
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
  const html = children.map(c =>
    `<button onclick="goToChildLogin(${c.id})" class="w-full bg-white rounded-2xl p-5 text-left shadow-sm border border-gray-100 hover:shadow-md transition">
       <div class="font-bold text-lg">${c.emoji} ${c.name}</div>
       <div class="text-gray-400 text-sm mt-1">完成任務、獲得金幣</div>
     </button>`
  ).join('') +
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

  if (p.length < 4) { alert('請輸入4位爸媽密碼'); return; }

  S.set('pins', { parent: p });
  const children = S.getOrDefault('children', []);
  if (children[0]) children[0].name = c1n;
  if (children[1]) children[1].name = c2n;
  if (children[2]) children[2].name = c3n;
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

function getActiveTasks() {
  const dow = new Date().getDay();
  return S.getOrDefault('tasks', []).filter(t =>
    !t.daysOfWeek || t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dow)
  );
}

function getChildCoins(id) {
  const c = S.getOrDefault('coins', {});
  return c[id] || 0;
}

function setChildCoins(id, amount) {
  const c = S.getOrDefault('coins', {});
  c[id] = amount;
  S.set('coins', c);
}

function getChildName(id) {
  return S.getOrDefault('children', []).find(c => c.id === id)?.name || `小孩${id}`;
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
  updateChildHeader();
  renderChildTasks();
  renderChildRewards();
  renderChildMyRewards();
  renderChildHistory();
  rotateBanner();
}

function updateChildHeader() {
  const id          = window._currentChildId;
  const activeTasks = getActiveTasks();
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
  const activeTasks = getActiveTasks();
  const todayC      = S.getOrDefault('completions', []).filter(c => c.childId === id && c.date === today());

  if (!activeTasks.length) {
    document.getElementById('child-tab-tasks').innerHTML =
      renderStreakWidget(id) +
      '<p class="text-center text-gray-300 py-8">今天沒有任務，好好休息！</p>';
    return;
  }

  const byCategory = {};
  activeTasks.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  let html = renderStreakWidget(id);
  for (const [cat, list] of Object.entries(byCategory)) {
    html += `<h3 class="text-sm font-semibold text-gray-500 mb-3 mt-4">${cat}</h3>
    <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">`;
    list.forEach(task => {
      const comp  = todayC.find(c => c.taskId === task.id);
      const boxCls = 'task-checkbox' + (comp ? ' checked' : '');
      const dayTag = task.daysOfWeek?.length
        ? `<span class="text-xs text-blue-300 ml-1">（${task.daysOfWeek.map(d=>'週'+DAY_NAMES[d]).join('/')}）</span>` : '';
      let status = '';
      if (comp?.status === 'pending')  status = `<span class="text-xs text-orange-400">等待爸媽審核中...</span>`;
      if (comp?.status === 'approved') status = `<span class="text-xs text-green-500">已獲得 +${comp.coins} 金幣</span>`;
      if (comp?.status === 'rejected') status = `<span class="text-xs text-red-400">爸媽駁回</span>`;

      html += `<div class="flex items-center p-4 gap-4">
        <div class="${boxCls}" onclick="${!comp ? `submitTask(${task.id})` : ''}">
          ${comp ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium">${task.emoji} ${task.name}${dayTag}</div>
          <div>${status}</div>
        </div>
        <div class="text-brand font-bold shrink-0">${task.coins} 金幣</div>
      </div>`;
    });
    html += '</div>';
  }
  document.getElementById('child-tab-tasks').innerHTML = html;
}

function submitTask(taskId) {
  const id    = window._currentChildId;
  const tasks = S.getOrDefault('tasks', []);
  const task  = tasks.find(t => t.id === taskId);
  if (!task) return;
  const comps = S.getOrDefault('completions', []);
  if (comps.find(c => c.taskId === taskId && c.childId === id && c.date === today())) return;
  comps.push({ id: Date.now(), taskId, childId: id, date: today(), status: 'pending', coins: task.coins });
  S.set('completions', comps);

  // 第一次提交任務 → 自動打卡，達成7天全勤 → 發放獎勵
  const bonusAwarded = markCheckIn(id);
  renderChildTasks();
  updateChildHeader();
  if (bonusAwarded) {
    setTimeout(() => alert('🎉 恭喜！連續打卡 7 天，獲得全勤獎勵 +5 金幣！'), 300);
  }
}

function renderChildRewards() {
  const id      = window._currentChildId;
  const coins   = getChildCoins(id);
  const rewards = S.getOrDefault('rewards', []);

  let html = `<div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-5 flex justify-between items-center">
    <div><div class="text-xs text-yellow-600 mb-1">目前金幣</div>
    <div class="text-3xl font-bold text-yellow-500">${coins} 💰</div></div>
    <div class="text-xs text-gray-400 text-right">完成任務<br>累積更多</div>
  </div>
  <div class="text-sm font-semibold text-gray-500 mb-3">國庫兌換中心</div>
  <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">`;

  rewards.forEach(r => {
    const ok = coins >= r.coins;
    html += `<div class="flex items-center p-4 gap-3">
      <div class="text-3xl">${r.emoji}</div>
      <div class="flex-1">
        <div class="font-medium">${r.name}</div>
        <div class="text-xs text-gray-400">${r.coins} 金幣・${r.desc}</div>
      </div>
      <button onclick="redeemReward(${r.id})"
        class="px-4 py-2 rounded-xl text-sm font-bold ${ok ? 'bg-brand text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}">兌換</button>
    </div>`;
  });
  html += '</div>';
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
    const approved    = completions.filter(c => c.childId===child.id && c.date===today() && c.status==='approved').length;
    const childPend   = completions.filter(c => c.childId===child.id && c.status==='pending').length;
    return `<div class="bg-white rounded-2xl shadow-sm p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">${child.emoji}</span>
        <span class="font-bold">${child.name}</span>
        ${childPend ? `<span class="badge">${childPend}</span>` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2 text-center">
        <div class="bg-yellow-50 rounded-xl p-2">
          <div class="text-lg font-bold text-yellow-500">${coins}</div>
          <div class="text-xs text-gray-400">金幣</div>
        </div>
        <div class="bg-green-50 rounded-xl p-2">
          <div class="text-lg font-bold text-green-500">${approved}/${activeTasks.length}</div>
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
  setChildCoins(c.childId, getChildCoins(c.childId) + c.coins);
  S.set('completions', comps);
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
function renderParentTasks() {
  const tasks = S.getOrDefault('tasks', []);
  const byCategory = {};
  tasks.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  const dayCheckboxes = DAY_FULL.map((d,i) =>
    `<label class="flex items-center gap-1 text-sm cursor-pointer">
       <input type="checkbox" value="${i}" name="new-task-days" class="rounded accent-brand"> ${d}
     </label>`
  ).join('');

  let html = `<button onclick="showAddTaskForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold mb-5">＋ 新增任務</button>
  <div id="add-task-form" class="hidden bg-white rounded-2xl shadow-sm p-5 mb-5">
    <h3 class="font-bold mb-4">新增任務</h3>
    <div class="space-y-3">
      <input id="new-task-name" placeholder="任務名稱" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-task-emoji" placeholder="Emoji（如 📚）" value="⭐" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-task-coins" type="number" placeholder="金幣數量" value="10" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <select id="new-task-category" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
        <option>學習任務</option><option>生活雜事</option>
      </select>
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
      const dayLabel = task.daysOfWeek?.length
        ? task.daysOfWeek.map(d=>DAY_FULL[d]).join('、') : '每天';
      html += `<div class="flex items-center p-4 gap-3">
        <div class="text-2xl">${task.emoji}</div>
        <div class="flex-1"><div class="font-medium">${task.name}</div>
        <div class="text-xs text-gray-400">${task.coins} 金幣・${dayLabel}</div></div>
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

function addTask() {
  const name     = document.getElementById('new-task-name').value.trim();
  const emoji    = document.getElementById('new-task-emoji').value.trim() || '⭐';
  const coins    = parseInt(document.getElementById('new-task-coins').value) || 10;
  const category = document.getElementById('new-task-category').value;
  const days     = [...document.querySelectorAll('input[name="new-task-days"]:checked')].map(el=>+el.value);
  if (!name) { alert('請輸入任務名稱'); return; }
  const tasks = S.getOrDefault('tasks', []);
  tasks.push({ id: Date.now(), name, emoji, coins, category, daysOfWeek: days });
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
  let html = `<button onclick="showAddRewardForm()" class="w-full bg-brand text-white py-3 rounded-2xl font-bold mb-5">＋ 新增獎勵</button>
  <div id="add-reward-form" class="hidden bg-white rounded-2xl shadow-sm p-5 mb-5">
    <h3 class="font-bold mb-4">新增獎勵</h3>
    <div class="space-y-3">
      <input id="new-reward-name"  placeholder="獎勵名稱" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-emoji" placeholder="Emoji（如 🎁）" value="🎁" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-desc"  placeholder="說明（如：限週末使用）" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <input id="new-reward-coins" type="number" placeholder="所需金幣" value="100" class="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-brand">
      <button onclick="addReward()" class="w-full bg-brand text-white py-3 rounded-xl font-bold">確認新增</button>
    </div>
  </div>
  <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">`;
  rewards.forEach(r => {
    html += `<div class="flex items-center p-4 gap-3">
      <div class="text-3xl">${r.emoji}</div>
      <div class="flex-1"><div class="font-medium">${r.name}</div>
      <div class="text-xs text-gray-400">${r.coins} 金幣・${r.desc}</div></div>
      <button onclick="deleteReward(${r.id})" class="text-red-300 text-sm px-3 py-1 hover:text-red-500">刪除</button>
    </div>`;
  });
  html += '</div>';
  document.getElementById('parent-tab-rewards-mgmt').innerHTML = html;
}

function showAddRewardForm() {
  document.getElementById('add-reward-form').classList.toggle('hidden');
}

function addReward() {
  const name  = document.getElementById('new-reward-name').value.trim();
  const emoji = document.getElementById('new-reward-emoji').value.trim() || '🎁';
  const desc  = document.getElementById('new-reward-desc').value.trim();
  const coins = parseInt(document.getElementById('new-reward-coins').value) || 100;
  if (!name) { alert('請輸入獎勵名稱'); return; }
  const rewards = S.getOrDefault('rewards', []);
  rewards.push({ id: Date.now(), name, emoji, desc, coins });
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
