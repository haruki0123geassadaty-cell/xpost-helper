'use strict';

// =========================================================
// CONFIG  — YOUR_*** を実際の値に書き換えてください
// =========================================================
const Config = {
  SUPABASE_URL:      'https://fekyylduknwequazurva.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla3l5bGR1a253ZXF1YXp1cnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczOTksImV4cCI6MjA5NDg3MzM5OX0.XB59yRGaX3gI-AxbbVidEkmS-wfn4iVRXSGUpodsnQ4',
  FUNCTIONS_BASE:    'https://fekyylduknwequazurva.supabase.co/functions/v1',
  DAILY_LIMITS:      { free: 2, paid: 30 },
};

// =========================================================
// UTILS
// =========================================================
const Utils = {
  id() { return Date.now().toString(36) + Math.random().toString(36).slice(2); },
  esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },
  fmt(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  },
  fmtRelative(iso) {
    if (!iso) return '';
    const diff = new Date(iso) - Date.now();
    if (diff < 0) return Utils.fmt(iso);
    if (diff < 3_600_000) return `約${Math.floor(diff/60000)}分後`;
    if (diff < 86_400_000) return `約${Math.floor(diff/3_600_000)}時間後`;
    return Utils.fmt(iso);
  },
  isSoon(iso) {
    if (!iso) return false;
    const diff = new Date(iso) - Date.now();
    return diff > 0 && diff < 3_600_000;
  },
  nowDT()      { return new Date().toISOString().slice(0,16); },
  plusHourDT() { return new Date(Date.now()+3_600_000).toISOString().slice(0,16); }
};

// =========================================================
// STORE  (localStorage)
// =========================================================
const Store = {
  posts() { try { return JSON.parse(localStorage.getItem('xph_posts')||'[]'); } catch { return []; } },
  savePosts(list) { localStorage.setItem('xph_posts', JSON.stringify(list)); },
  addPost(d) {
    const p = {
      id:Utils.id(), content:d.content||'', status:d.status||'draft',
      scheduledAt:d.scheduledAt||null, personaName:d.personaName||'',
      memo:d.memo||'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
    };
    const list = this.posts(); list.unshift(p); this.savePosts(list); return p;
  },
  updatePost(id, d) {
    const list = this.posts();
    const i = list.findIndex(p => p.id===id); if (i<0) return;
    list[i] = {...list[i],...d, updatedAt:new Date().toISOString()};
    this.savePosts(list);
  },
  deletePost(id) { this.savePosts(this.posts().filter(p=>p.id!==id)); },

  personas() {
    const s = localStorage.getItem('xph_personas');
    if (!s) { const d=this._defaultPersonas(); this.savePersonas(d); return d; }
    try { return JSON.parse(s); } catch { return this._defaultPersonas(); }
  },
  savePersonas(list) { localStorage.setItem('xph_personas', JSON.stringify(list)); },
  addPersona(d) {
    const p = {id:Utils.id(), name:d.name, tone:d.tone||'', policy:d.policy||'',
      ngExpressions:d.ngExpressions||'', hashtagPolicy:d.hashtagPolicy||'',
      isBuiltIn:false, createdAt:new Date().toISOString()};
    const list=this.personas(); list.push(p); this.savePersonas(list); return p;
  },
  updatePersona(id, d) {
    const list=this.personas(); const i=list.findIndex(p=>p.id===id); if(i<0) return;
    list[i]={...list[i],...d}; this.savePersonas(list);
  },
  deletePersona(id) { this.savePersonas(this.personas().filter(p=>p.id!==id)); },

  get(k,def=null) { const v=localStorage.getItem('xph_s_'+k); return v===null?def:JSON.parse(v); },
  set(k,v) { localStorage.setItem('xph_s_'+k, JSON.stringify(v)); },

  _defaultPersonas() {
    const now = new Date().toISOString();
    return [
      {id:'bi1',name:'🏇 競馬アカウント',
       tone:'熱量高め。レース結果を速報、予想を自信満々に語る。「〜だ！」「絶対来る！」調。',
       policy:'レース結果・重賞予想・回収率報告・馬券戦略を中心に投稿。',
       ngExpressions:'確実に当たる、絶対儲かる、投資詐欺的表現',
       hashtagPolicy:'#競馬 #中央競馬 #重賞予想',isBuiltIn:true,createdAt:now},
      {id:'bi2',name:'💃 AI美女アカウント',
       tone:'柔らかく親しみやすい。少し甘え口調。「〜だよ♡」「〜してみたの！」調。',
       policy:'日常・グルメ・おしゃれ・美容・恋愛系の話題を発信。',
       ngExpressions:'過激な表現、政治的発言、批判的内容',
       hashtagPolicy:'#女子力 #日常 #グルメ #コーデ',isBuiltIn:true,createdAt:now},
      {id:'bi3',name:'💰 副業インフルエンサー',
       tone:'モチベーション高め。共感を誘い、行動を促す。「〜してみました！」「変わった！」調。',
       policy:'副業・節約・時間管理・資産運用の実体験をシェア。',
       ngExpressions:'詐欺的表現、誇大広告、「必ず稼げる」等',
       hashtagPolicy:'#副業 #資産形成 #在宅ワーク #FIRE',isBuiltIn:true,createdAt:now},
      {id:'bi4',name:'💻 エンジニア',
       tone:'論理的・簡潔。たまにユーモア交じり。「〜なんだけど」「試してみた」調。',
       policy:'技術Tips・学習記録・開発の気づき・ツール紹介。',
       ngExpressions:'技術的に不正確な情報、根拠のない断言',
       hashtagPolicy:'#エンジニア #プログラミング #個人開発',isBuiltIn:true,createdAt:now},
    ];
  }
};

// =========================================================
// AUTH MANAGER
// =========================================================
const AuthManager = {
  _client: null,
  _user:   null,
  _cbs:    [],

  init() {
    if (typeof window.supabase === 'undefined') return;
    if (Config.SUPABASE_URL.includes('YOUR_PROJECT_ID')) return;
    this._client = window.supabase.createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);
    this._client.auth.onAuthStateChange((_event, session) => {
      const prevId = this._user?.id;
      this._user = session?.user ?? null;
      if (prevId !== this._user?.id) {
        UserProfile.clearCache();
        this._cbs.forEach(cb => cb(this._user));
      }
    });
    this._client.auth.getSession().then(({ data }) => {
      const prevId = this._user?.id;
      this._user = data.session?.user ?? null;
      if (prevId !== this._user?.id) {
        this._cbs.forEach(cb => cb(this._user));
      }
    });
  },

  get client()       { return this._client; },
  get user()         { return this._user; },
  get isConfigured() { return this._client !== null; },

  onAuthChange(cb) { this._cbs.push(cb); },

  async signUp(email, password) {
    const { data, error } = await this._client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },
  async signIn(email, password) {
    const { data, error } = await this._client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    this._user = null;
    await this._client?.auth.signOut();
  },
  async getToken() {
    if (!this._client) return null;
    const { data } = await this._client.auth.getSession();
    return data?.session?.access_token ?? null;
  }
};

// =========================================================
// USER PROFILE
// =========================================================
const UserProfile = {
  _cache:     null,
  _cacheTime: 0,
  _CACHE_MS:  30_000,

  async get(forceRefresh = false) {
    if (!AuthManager.client || !AuthManager.user) return null;
    if (!forceRefresh && this._cache && Date.now()-this._cacheTime < this._CACHE_MS) return this._cache;
    try {
      const { data } = await AuthManager.client
        .from('user_profiles')
        .select('plan, daily_count, last_used_date, is_admin')
        .eq('id', AuthManager.user.id)
        .single();
      this._cache = data;
      this._cacheTime = Date.now();
      return data;
    } catch { return this._cache; }
  },

  clearCache() { this._cache = null; this._cacheTime = 0; },

  todayCount(p)  { if (!p) return 0; const t=new Date().toISOString().slice(0,10); return p.last_used_date===t?(p.daily_count||0):0; },
  limit(p)       { return Config.DAILY_LIMITS[p?.plan ?? 'free'] ?? Config.DAILY_LIMITS.free; },
  remaining(p)   { return Math.max(0, this.limit(p) - this.todayCount(p)); },
};

// =========================================================
// X HELPER
// =========================================================
const XHelper = {
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = Object.assign(document.createElement('textarea'),
        {value:text, style:'position:fixed;opacity:0'});
      document.body.appendChild(el); el.select(); document.execCommand('copy');
      document.body.removeChild(el);
    }
  },
  openApp() { window.location.href = 'twitter://'; },
  openWeb() { window.open('https://x.com','_blank'); }
};

// =========================================================
// TOAST
// =========================================================
const Toast = {
  _timer: null,
  show(msg, ms=2200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(()=>el.classList.remove('show'), ms);
  }
};

// =========================================================
// MODAL
// =========================================================
const Modal = {
  show(html) {
    const ov = document.getElementById('modal-overlay');
    const ct = document.getElementById('modal-content');
    ct.innerHTML = html;
    ov.classList.remove('hidden');
    ov.onclick = e => { if(e.target===ov) Modal.hide(); };
  },
  hide() { document.getElementById('modal-overlay').classList.add('hidden'); }
};

// =========================================================
// STATUS CONFIG
// =========================================================
const ST = {
  draft:     {label:'下書き',  cls:'status-draft',     icon:'✏️'},
  scheduled: {label:'予約中',  cls:'status-scheduled', icon:'🕐'},
  posted:    {label:'投稿済み',cls:'status-posted',     icon:'✅'}
};

// =========================================================
// AUTH MODAL
// =========================================================
const AuthModal = {
  _onSuccess: null,

  open(onSuccess) {
    this._onSuccess = onSuccess || null;
    Modal.show(this._tpl());
    this._bindTabs();
    this._bindForm('login');
  },

  _tpl() {
    return `
    <div class="modal-header">
      <h2>ログイン / 新規登録</h2>
      <button id="m-close">✕</button>
    </div>
    <div class="modal-body">
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">ログイン</button>
        <button class="auth-tab" data-tab="signup">新規登録</button>
      </div>
      <div id="auth-form-area">${this._loginForm()}</div>
    </div>`;
  },

  _loginForm() {
    return `
    <div class="auth-form">
      <div class="form-section">
        <label class="form-label">メールアドレス</label>
        <input id="auth-email" type="email" class="form-input" placeholder="example@email.com" autocomplete="email">
      </div>
      <div class="form-section">
        <label class="form-label">パスワード</label>
        <input id="auth-password" type="password" class="form-input" placeholder="パスワード" autocomplete="current-password">
      </div>
      <div id="auth-error" class="auth-error hidden"></div>
      <button id="auth-submit" class="btn-primary">ログイン</button>
    </div>`;
  },

  _signupForm() {
    return `
    <div class="auth-form">
      <div class="form-section">
        <label class="form-label">メールアドレス</label>
        <input id="auth-email" type="email" class="form-input" placeholder="example@email.com" autocomplete="email">
      </div>
      <div class="form-section">
        <label class="form-label">パスワード（8文字以上）</label>
        <input id="auth-password" type="password" class="form-input" placeholder="パスワード" autocomplete="new-password">
      </div>
      <div id="auth-error" class="auth-error hidden"></div>
      <button id="auth-submit" class="btn-primary">新規登録</button>
      <p class="auth-note">登録後、確認メールが送信されます。<br>確認後にログインできます。</p>
    </div>`;
  },

  _bindTabs() {
    document.getElementById('m-close')?.addEventListener('click', ()=>Modal.hide());
    let mode = 'login';
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        mode = tab.dataset.tab;
        document.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===mode));
        document.getElementById('auth-form-area').innerHTML = mode==='login'?this._loginForm():this._signupForm();
        this._bindForm(mode);
      });
    });
  },

  _bindForm(mode) {
    const enterSubmit = id => document.getElementById(id)?.addEventListener('keydown', e=>{
      if(e.key==='Enter') document.getElementById('auth-submit')?.click();
    });
    enterSubmit('auth-email'); enterSubmit('auth-password');

    document.getElementById('auth-submit')?.addEventListener('click', async () => {
      const email    = document.getElementById('auth-email')?.value?.trim()||'';
      const password = document.getElementById('auth-password')?.value||'';
      const errEl    = document.getElementById('auth-error');
      if (!email||!password) {
        errEl.textContent='メールアドレスとパスワードを入力してください'; errEl.classList.remove('hidden'); return;
      }
      const btn = document.getElementById('auth-submit');
      btn.disabled=true; btn.textContent='処理中...'; errEl.classList.add('hidden');
      try {
        if (mode==='login') {
          await AuthManager.signIn(email, password);
          Modal.hide(); Toast.show('ログインしました ✅');
          this._onSuccess?.();
        } else {
          await AuthManager.signUp(email, password);
          Modal.hide(); Toast.show('確認メールを送信しました。メールを確認してください。', 5000);
          this._onSuccess?.();
        }
      } catch(err) {
        errEl.textContent = this._errMsg(err.message); errEl.classList.remove('hidden');
        btn.disabled=false; btn.textContent=mode==='login'?'ログイン':'新規登録';
      }
    });
  },

  _errMsg(m) {
    if (m.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません';
    if (m.includes('Email not confirmed'))       return 'メールの確認が完了していません。確認メールをご確認ください';
    if (m.includes('User already registered'))   return 'このメールアドレスは既に登録されています';
    if (m.includes('Password should be'))        return 'パスワードは8文字以上で入力してください';
    if (m.includes('Invalid email'))             return '有効なメールアドレスを入力してください';
    if (m.includes('未設定'))                    return 'Supabaseが設定されていません（Config を確認）';
    return `エラー: ${m}`;
  }
};

// =========================================================
// HOME VIEW
// =========================================================
const HomeView = {
  st: {filter:'all', search:'', sort:'createdDesc'},

  render() {
    return `
    <div class="view-home">
      <div class="search-wrap">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input id="h-search" type="search" placeholder="本文・人格・メモで検索" value="${Utils.esc(this.st.search)}">
        </div>
        <select id="h-sort" class="sort-select">
          <option value="createdDesc"  ${this.st.sort==='createdDesc' ?'selected':''}>新しい順</option>
          <option value="createdAsc"   ${this.st.sort==='createdAsc'  ?'selected':''}>古い順</option>
          <option value="scheduledAsc" ${this.st.sort==='scheduledAsc'?'selected':''}>予約日時順</option>
        </select>
      </div>
      <div class="filter-chips" id="h-chips">
        ${['all','draft','scheduled','posted'].map(f=>{
          const label = f==='all'?'すべて':ST[f]?.label||f;
          return `<button class="chip${this.st.filter===f?' active':''}" data-f="${f}">${label}</button>`;
        }).join('')}
      </div>
      <div id="h-list"></div>
    </div>`;
  },

  _filtered() {
    let list = Store.posts();
    if (this.st.filter!=='all') list=list.filter(p=>p.status===this.st.filter);
    if (this.st.search) {
      const q=this.st.search.toLowerCase();
      list=list.filter(p=>p.content.toLowerCase().includes(q)||p.personaName.toLowerCase().includes(q)||p.memo.toLowerCase().includes(q));
    }
    list.sort((a,b)=>{
      if (this.st.sort==='createdAsc')   return a.createdAt.localeCompare(b.createdAt);
      if (this.st.sort==='scheduledAsc') return (a.scheduledAt||'9999').localeCompare(b.scheduledAt||'9999');
      return b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  },

  _renderList() {
    const list = this._filtered();
    if (!list.length) return `
      <div class="empty-state"><div class="empty-icon">📭</div>
      <p>${this.st.search?'検索結果が見つかりません':'投稿がまだありません'}</p></div>`;
    return `<div class="post-count">${list.length}件</div>` + list.map(p=>{
      const s=ST[p.status]||ST.draft; const soon=Utils.isSoon(p.scheduledAt);
      const prev=Utils.esc(p.content.slice(0,140))+(p.content.length>140?'…':'');
      return `
      <div class="post-card${soon?' soon':''}" data-id="${p.id}">
        <div class="card-header">
          <span class="persona-label">${Utils.esc(p.personaName||'')}</span>
          <span class="status-badge ${s.cls}">${s.icon} ${s.label}</span>
        </div>
        <div class="card-content">${prev||'<span class="empty-text">（本文なし）</span>'}</div>
        ${p.scheduledAt?`<div class="card-scheduled${soon?' soon':''}">${soon?'⚠️':'🕐'} ${Utils.fmtRelative(p.scheduledAt)}</div>`:''}
        ${p.memo?`<div class="card-memo">📝 ${Utils.esc(p.memo)}</div>`:''}
        <div class="card-actions">
          <button class="action-btn" data-a="edit"   data-id="${p.id}">✏️ 編集</button>
          <button class="action-btn" data-a="copy"   data-id="${p.id}">📋 コピー</button>
          <button class="action-btn" data-a="x-app"  data-id="${p.id}">𝕏 アプリ</button>
          <button class="action-btn" data-a="x-web"  data-id="${p.id}">🌐 ブラウザ</button>
          ${p.status!=='posted'?`<button class="action-btn btn-posted" data-a="posted" data-id="${p.id}">✅ 投稿済み</button>`:''}
          <button class="action-btn btn-delete" data-a="del" data-id="${p.id}">🗑</button>
        </div>
      </div>`;
    }).join('');
  },

  _refresh() { const el=document.getElementById('h-list'); if(el) el.innerHTML=this._renderList(); },

  mount() {
    document.getElementById('h-search')?.addEventListener('input',e=>{ this.st.search=e.target.value; this._refresh(); });
    document.getElementById('h-sort')?.addEventListener('change',e=>{ this.st.sort=e.target.value; this._refresh(); });
    document.getElementById('h-chips')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-f]'); if(!btn) return;
      this.st.filter=btn.dataset.f;
      document.querySelectorAll('#h-chips .chip').forEach(c=>c.classList.toggle('active',c.dataset.f===this.st.filter));
      this._refresh();
    });
    this._refresh();
    document.getElementById('h-list')?.addEventListener('click', async e=>{
      const btn=e.target.closest('[data-a]'); if(!btn) return;
      const {a,id}=btn.dataset;
      const post=Store.posts().find(p=>p.id===id); if(!post) return;
      if(a==='edit')   { EditModal.open(post); return; }
      if(a==='copy')   { await XHelper.copy(post.content); Toast.show('コピーしました ✅'); return; }
      if(a==='x-app')  { await XHelper.copy(post.content); Toast.show('コピーしました。Xアプリに貼り付けてください'); XHelper.openApp(); return; }
      if(a==='x-web')  { await XHelper.copy(post.content); Toast.show('コピーしました。ブラウザ版Xに貼り付けてください'); XHelper.openWeb(); return; }
      if(a==='posted') { Store.updatePost(id,{status:'posted'}); Toast.show('投稿済みにしました ✅'); this._refresh(); return; }
      if(a==='del')    { if(confirm('この投稿を削除しますか？')) { Store.deletePost(id); this._refresh(); } }
    });
  },

  refresh() { this._refresh(); }
};

// =========================================================
// CREATE VIEW
// =========================================================
const CreateView = {
  render() {
    const personas = Store.personas();
    return `
    <div class="form-view">
      <div class="form-section">
        <label class="form-label">投稿本文</label>
        <textarea id="c-content" class="content-input" placeholder="投稿内容を入力してください…"></textarea>
        <div class="char-counter"><span id="c-count">0</span> / 280</div>
      </div>
      <div class="form-section">
        <label class="form-label">人格プリセット</label>
        <select id="c-persona" class="form-select">
          <option value="">なし</option>
          ${personas.map(p=>`<option value="${Utils.esc(p.name)}">${Utils.esc(p.name)}</option>`).join('')}
        </select>
        <div id="c-persona-prev" class="persona-preview"></div>
      </div>
      <div class="form-section">
        <label class="form-label">ステータス</label>
        <div class="status-selector">
          <button class="status-btn active" data-st="draft">✏️ 下書き</button>
          <button class="status-btn" data-st="scheduled">🕐 予約</button>
          <button class="status-btn" data-st="posted">✅ 投稿済み</button>
        </div>
      </div>
      <div class="form-section" id="c-sched-wrap" style="display:none">
        <label class="form-label">予約日時</label>
        <input type="datetime-local" id="c-sched" class="form-input" value="${Utils.plusHourDT()}" min="${Utils.nowDT()}">
      </div>
      <div class="form-section">
        <label class="form-label">メモ（自分用）</label>
        <input type="text" id="c-memo" class="form-input" placeholder="メモを入力（任意）">
      </div>
      <div class="form-actions">
        <button id="c-save" class="btn-primary">保存</button>
        <button id="c-copy" class="btn-secondary">📋 クリップボードにコピー</button>
        <button id="c-xapp" class="btn-secondary">𝕏 コピーしてXアプリを開く</button>
        <button id="c-xweb" class="btn-secondary">🌐 コピーしてブラウザ版Xを開く</button>
      </div>
    </div>`;
  },

  mount() {
    const contentEl = document.getElementById('c-content');
    const countEl   = document.getElementById('c-count');
    contentEl?.addEventListener('input',()=>{
      const n=contentEl.value.length; countEl.textContent=n;
      countEl.classList.toggle('over',n>280);
    });
    const personaEl = document.getElementById('c-persona');
    personaEl?.addEventListener('change',()=>this._updatePersonaPreview(personaEl.value));
    document.querySelectorAll('.status-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.status-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('c-sched-wrap').style.display=btn.dataset.st==='scheduled'?'':'none';
      });
    });
    document.getElementById('c-save')?.addEventListener('click',()=>this._save());
    document.getElementById('c-copy')?.addEventListener('click', async()=>{
      const t=contentEl?.value?.trim(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました ✅');
    });
    document.getElementById('c-xapp')?.addEventListener('click', async()=>{
      const t=contentEl?.value?.trim(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました。Xアプリに貼り付けてください'); XHelper.openApp();
    });
    document.getElementById('c-xweb')?.addEventListener('click', async()=>{
      const t=contentEl?.value?.trim(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました。ブラウザ版Xに貼り付けてください'); XHelper.openWeb();
    });
  },

  _updatePersonaPreview(name) {
    const el=document.getElementById('c-persona-prev'); if(!el) return;
    const p=Store.personas().find(p=>p.name===name);
    el.innerHTML=p?`<div>${Utils.esc(p.tone)}</div>${p.hashtagPolicy?`<div class="preview-hashtag">${Utils.esc(p.hashtagPolicy)}</div>`:''}`:'';
  },

  _save() {
    const content=document.getElementById('c-content')?.value?.trim()||'';
    if(!content) return Toast.show('本文を入力してください');
    if(content.length>280) return Toast.show('280文字を超えています');
    const status=document.querySelector('.status-btn.active')?.dataset.st||'draft';
    const scheduledAt=status==='scheduled'?new Date(document.getElementById('c-sched')?.value||'').toISOString():null;
    Store.addPost({content,status,scheduledAt,
      personaName:document.getElementById('c-persona')?.value||'',
      memo:document.getElementById('c-memo')?.value||''});
    document.getElementById('c-content').value=''; document.getElementById('c-count').textContent='0';
    document.getElementById('c-memo').value=''; document.getElementById('c-persona').value='';
    document.getElementById('c-sched-wrap').style.display='none';
    document.querySelectorAll('.status-btn').forEach(b=>b.classList.toggle('active',b.dataset.st==='draft'));
    this._updatePersonaPreview('');
    Toast.show('保存しました ✅'); HomeView.refresh();
  }
};

// =========================================================
// EDIT MODAL
// =========================================================
const EditModal = {
  open(post) {
    const personas=Store.personas();
    const sched=post.scheduledAt?post.scheduledAt.slice(0,16):Utils.plusHourDT();
    Modal.show(`
      <div class="modal-header"><h2>投稿を編集</h2><button id="m-close">✕</button></div>
      <div class="modal-body">
        <div class="form-section">
          <label class="form-label">投稿本文</label>
          <textarea id="e-content" class="content-input">${Utils.esc(post.content)}</textarea>
          <div class="char-counter"><span id="e-count">${post.content.length}</span> / 280</div>
        </div>
        <div class="form-section">
          <label class="form-label">人格プリセット</label>
          <select id="e-persona" class="form-select">
            <option value="">なし</option>
            ${personas.map(p=>`<option value="${Utils.esc(p.name)}"${p.name===post.personaName?' selected':''}>${Utils.esc(p.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-section">
          <label class="form-label">ステータス</label>
          <div class="status-selector">
            ${['draft','scheduled','posted'].map(s=>`
              <button class="status-btn${post.status===s?' active':''}" data-st="${s}">${ST[s].icon} ${ST[s].label}</button>
            `).join('')}
          </div>
        </div>
        <div class="form-section" id="e-sched-wrap" style="${post.status==='scheduled'?'':'display:none'}">
          <label class="form-label">予約日時</label>
          <input type="datetime-local" id="e-sched" class="form-input" value="${sched}" min="${Utils.nowDT()}">
        </div>
        <div class="form-section">
          <label class="form-label">メモ</label>
          <input type="text" id="e-memo" class="form-input" value="${Utils.esc(post.memo||'')}">
        </div>
        <div class="form-actions">
          <button id="e-save" class="btn-primary">更新</button>
          <button id="e-copy" class="btn-secondary">📋 コピー</button>
          <button id="e-xapp" class="btn-secondary">𝕏 コピーしてXアプリを開く</button>
          <button id="e-xweb" class="btn-secondary">🌐 コピーしてブラウザ版Xを開く</button>
        </div>
      </div>`);

    document.getElementById('m-close')?.addEventListener('click',()=>Modal.hide());
    const ce=document.getElementById('e-content');
    ce?.addEventListener('input',()=>{
      document.getElementById('e-count').textContent=ce.value.length;
      document.getElementById('e-count').classList.toggle('over',ce.value.length>280);
    });
    document.querySelectorAll('#modal-content .status-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('#modal-content .status-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('e-sched-wrap').style.display=btn.dataset.st==='scheduled'?'':'none';
      });
    });
    document.getElementById('e-save')?.addEventListener('click',()=>{
      const content=ce?.value?.trim()||'';
      if(!content) return Toast.show('本文を入力してください');
      if(content.length>280) return Toast.show('280文字を超えています');
      const status=document.querySelector('#modal-content .status-btn.active')?.dataset.st||'draft';
      const scheduledAt=status==='scheduled'?new Date(document.getElementById('e-sched')?.value||'').toISOString():null;
      Store.updatePost(post.id,{content,status,scheduledAt,
        personaName:document.getElementById('e-persona')?.value||'',
        memo:document.getElementById('e-memo')?.value||''});
      Modal.hide(); Toast.show('更新しました ✅'); HomeView.refresh();
    });
    const getContent=()=>document.getElementById('e-content')?.value?.trim()||'';
    document.getElementById('e-copy')?.addEventListener('click', async()=>{
      const t=getContent(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました ✅');
    });
    document.getElementById('e-xapp')?.addEventListener('click', async()=>{
      const t=getContent(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました。Xアプリに貼り付けてください'); XHelper.openApp();
    });
    document.getElementById('e-xweb')?.addEventListener('click', async()=>{
      const t=getContent(); if(!t) return Toast.show('本文を入力してください');
      await XHelper.copy(t); Toast.show('コピーしました。ブラウザ版Xに貼り付けてください'); XHelper.openWeb();
    });
  }
};

// =========================================================
// AI GENERATE VIEW
// =========================================================
const AIView = {
  generated: [],

  render() {
    if (!AuthManager.isConfigured) return this._renderNotConfigured();
    if (!AuthManager.user)         return this._renderLoginRequired();
    const personas = Store.personas();
    return `
    <div class="form-view">
      <div id="ai-usage-bar" class="usage-bar">
        <span class="usage-loading">利用状況を読み込み中…</span>
      </div>
      <div class="form-section">
        <label class="form-label">テーマ</label>
        <input id="ai-theme" type="text" class="form-input" placeholder="例：競馬の週末予想、副業の始め方…">
      </div>
      <div class="form-section">
        <label class="form-label">生成件数：<span id="ai-count-disp">3</span>件</label>
        <input id="ai-count" type="range" min="1" max="3" value="3" class="range-input">
      </div>
      <div class="form-section">
        <label class="form-label">人格プリセット</label>
        <select id="ai-persona" class="form-select">
          <option value="">なし</option>
          ${personas.map(p=>`<option value="${Utils.esc(p.name)}">${Utils.esc(p.name)}</option>`).join('')}
        </select>
      </div>
      <button id="ai-gen-btn" class="btn-primary">✨ 投稿を生成する</button>
      <div id="ai-loading" class="loading hidden">生成中</div>
      <div id="ai-results" style="margin-top:16px"></div>
    </div>`;
  },

  _renderNotConfigured() {
    return `
    <div class="auth-wall">
      <div class="auth-wall-icon">⚙️</div>
      <h2 class="auth-wall-title">未設定</h2>
      <p class="auth-wall-desc">app.js の Config に<br>Supabase URL と Anon Key を設定してください。</p>
    </div>`;
  },

  _renderLoginRequired() {
    return `
    <div class="auth-wall">
      <div class="auth-wall-icon">🔐</div>
      <h2 class="auth-wall-title">ログインが必要です</h2>
      <p class="auth-wall-desc">AI投稿生成を使用するには<br>ログインしてください</p>
      <button id="ai-login-btn" class="btn-primary" style="margin-top:20px">ログイン / 新規登録</button>
    </div>`;
  },

  mount() {
    if (!AuthManager.isConfigured || !AuthManager.user) {
      document.getElementById('ai-login-btn')?.addEventListener('click', () => {
        AuthModal.open(() => Router.render('ai-generate'));
      });
      return;
    }

    document.getElementById('ai-count')?.addEventListener('input', e => {
      document.getElementById('ai-count-disp').textContent = e.target.value;
    });
    document.getElementById('ai-gen-btn')?.addEventListener('click', () => this._generate());

    this._loadUsage();
  },

  async _loadUsage() {
    const profile = await UserProfile.get();
    this._renderUsageBar(profile);
  },

  _renderUsageBar(profile) {
    const el = document.getElementById('ai-usage-bar'); if (!el) return;
    if (!profile) { el.innerHTML = '<span class="usage-loading">利用状況を取得できませんでした</span>'; return; }
    const plan      = profile.plan || 'free';
    const isAdmin   = profile.is_admin === true;
    const limit     = UserProfile.limit(profile);
    const used      = UserProfile.todayCount(profile);
    const remaining = isAdmin ? '∞' : UserProfile.remaining(profile);
    const planLabel = plan === 'paid' ? '有料プラン' : '無料プラン';
    const remainCls = (!isAdmin && remaining === 0) ? 'usage-remaining zero' : 'usage-remaining';
    el.innerHTML = `
      <div class="usage-info">
        <span class="usage-plan-badge ${plan === 'paid' ? 'paid' : ''}">${planLabel}</span>
        <div class="usage-counts">
          <span>本日 <strong>${used} / ${isAdmin ? '∞' : limit}</strong> 回</span>
          <span class="${remainCls}">残り ${remaining} 回</span>
        </div>
        ${plan === 'free' && !isAdmin ? `<button id="ai-upgrade-btn" class="usage-upgrade-btn">有料プランへ ›</button>` : ''}
      </div>`;
    document.getElementById('ai-upgrade-btn')?.addEventListener('click', () => this._openCheckout());

    const maxCount = (plan === 'paid' || isAdmin) ? 7 : 3;
    const slider = document.getElementById('ai-count');
    if (slider) {
      slider.max = maxCount;
      if (parseInt(slider.value) > maxCount) {
        slider.value = maxCount;
        document.getElementById('ai-count-disp').textContent = String(maxCount);
      }
    }
  },

  async _openCheckout() {
    const token = await AuthManager.getToken();
    if (!token) return Toast.show('ログインしてください');
    Toast.show('決済画面を準備中…');
    try {
      const res  = await fetch(`${Config.FUNCTIONS_BASE}/create-checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 400 && data.error === 'already_paid') {
        Toast.show('すでに有料プランです'); return;
      }
      if (data.url) window.open(data.url, '_blank');
      else Toast.show('決済画面の作成に失敗しました');
    } catch { Toast.show('通信エラーが発生しました'); }
  },

  async _generate() {
    const theme = document.getElementById('ai-theme')?.value?.trim();
    if (!theme) return Toast.show('テーマを入力してください');

    const token = await AuthManager.getToken();
    if (!token) { Toast.show('ログインが必要です'); AuthModal.open(()=>Router.render('ai-generate')); return; }

    const count   = parseInt(document.getElementById('ai-count')?.value||'3');
    const pName   = document.getElementById('ai-persona')?.value||'';
    const persona = Store.personas().find(p=>p.name===pName);

    const btn = document.getElementById('ai-gen-btn');
    btn.disabled = true;
    document.getElementById('ai-loading').classList.remove('hidden');
    document.getElementById('ai-results').innerHTML = '';

    try {
      const res = await fetch(`${Config.FUNCTIONS_BASE}/generate-post`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme, count,
          personaTone:     persona?.tone||'',
          personaHashtags: persona?.hashtagPolicy||'',
          personaNg:       persona?.ngExpressions||'',
        }),
      });

      if (res.status === 401) {
        Toast.show('セッションが切れました。再ログインしてください', 4000);
        AuthModal.open(()=>Router.render('ai-generate')); return;
      }

      if (res.status === 429) {
        const d = await res.json();
        const msg = d.plan === 'free'
          ? '本日の無料生成回数に達しました。\n有料プランに変更すると、1日30回まで利用できます。'
          : '本日の生成回数上限に達しました。\nAPIコスト保護のため上限を設けています。明日以降にお試しください。';
        Toast.show(msg, 5000);
        UserProfile.clearCache();
        this._loadUsage(); return;
      }

      if (!res.ok) { Toast.show('生成に失敗しました。しばらくしてから再度お試しください。'); return; }

      const data  = await res.json();
      const texts = data.texts || [];
      if (!texts.length) { Toast.show('生成結果が空でした。テーマを変えてお試しください。'); return; }

      this.generated = texts.map(t=>({content:t, selected:true}));
      this._renderResults(pName);

      // 利用状況を更新
      UserProfile.clearCache();
      const profile = await UserProfile.get(true);
      this._renderUsageBar(profile);

    } catch { Toast.show('通信エラーが発生しました'); }
    finally  { btn.disabled=false; document.getElementById('ai-loading').classList.add('hidden'); }
  },

  _renderResults(pName) {
    const box = document.getElementById('ai-results'); if (!box) return;
    box.innerHTML = `
      <div class="ai-results-header">
        <span>生成結果 ${this.generated.length}件</span>
        <div>
          <button class="link-btn" id="ai-all">全選択</button>
          <button class="link-btn red" id="ai-none">全解除</button>
        </div>
      </div>
      ${this.generated.map((g,i)=>`
        <div class="ai-card">
          <button class="ai-check selected" data-chk="${i}">☑</button>
          <textarea class="ai-content" data-idx="${i}">${Utils.esc(g.content)}</textarea>
          <div class="ai-charcount" data-cnt="${i}">${g.content.length}文字</div>
        </div>`).join('')}
      <button id="ai-save-btn" class="btn-primary" style="margin-top:8px">
        下書きに追加（選択中: ${this.generated.filter(g=>g.selected).length}件）
      </button>`;

    box.querySelectorAll('.ai-content').forEach(ta=>{
      ta.addEventListener('input',e=>{
        const i=parseInt(e.target.dataset.idx);
        this.generated[i].content=e.target.value;
        box.querySelector(`[data-cnt="${i}"]`).textContent=`${e.target.value.length}文字`;
      });
    });
    box.querySelectorAll('[data-chk]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=parseInt(btn.dataset.chk);
        this.generated[i].selected=!this.generated[i].selected;
        btn.textContent=this.generated[i].selected?'☑':'☐';
        btn.classList.toggle('selected',this.generated[i].selected);
        this._updateSaveBtn();
      });
    });
    document.getElementById('ai-all')?.addEventListener('click',()=>{
      this.generated.forEach(g=>g.selected=true);
      box.querySelectorAll('[data-chk]').forEach(b=>{b.textContent='☑';b.classList.add('selected');});
      this._updateSaveBtn();
    });
    document.getElementById('ai-none')?.addEventListener('click',()=>{
      this.generated.forEach(g=>g.selected=false);
      box.querySelectorAll('[data-chk]').forEach(b=>{b.textContent='☐';b.classList.remove('selected');});
      this._updateSaveBtn();
    });
    document.getElementById('ai-save-btn')?.addEventListener('click',()=>{
      const sel=this.generated.filter(g=>g.selected);
      if(!sel.length) return Toast.show('投稿を選択してください');
      sel.forEach(g=>Store.addPost({content:g.content,status:'draft',personaName:pName}));
      this.generated=this.generated.filter(g=>!g.selected);
      Toast.show(`✅ ${sel.length}件を下書きに追加しました`);
      HomeView.refresh(); this._renderResults(pName);
    });
  },

  _updateSaveBtn() {
    const btn=document.getElementById('ai-save-btn');
    if(btn) btn.textContent=`下書きに追加（選択中: ${this.generated.filter(g=>g.selected).length}件）`;
  }
};

// =========================================================
// PERSONA VIEW
// =========================================================
const PersonaView = {
  render() {
    const personas=Store.personas();
    const bi=personas.filter(p=>p.isBuiltIn), cu=personas.filter(p=>!p.isBuiltIn);
    return `
    <div class="view-persona" style="padding-bottom:16px">
      <div class="section-header">✨ プリセット</div>
      ${bi.map(p=>this._row(p)).join('')}
      ${cu.length?`<div class="section-header" style="margin-top:8px">👤 カスタム</div>${cu.map(p=>this._row(p)).join('')}`:''}
      <button id="pa-add" class="btn-add-persona">＋ 新しい人格を追加</button>
    </div>`;
  },
  _row(p) {
    return `
    <div class="persona-row">
      <div class="persona-info">
        <div class="persona-name">${Utils.esc(p.name)}</div>
        ${p.tone?`<div class="persona-tone">${Utils.esc(p.tone.slice(0,60))}${p.tone.length>60?'…':''}</div>`:''}
        ${p.hashtagPolicy?`<div class="persona-tags">${Utils.esc(p.hashtagPolicy)}</div>`:''}
      </div>
      <div class="persona-actions">
        ${p.isBuiltIn?'<span class="builtin-badge">プリセット</span>':''}
        <button class="btn-icon" data-pa="edit" data-id="${p.id}">✏️</button>
        ${!p.isBuiltIn?`<button class="btn-icon red" data-pa="del" data-id="${p.id}">🗑</button>`:''}
      </div>
    </div>`;
  },
  mount() {
    document.getElementById('pa-add')?.addEventListener('click',()=>PersonaEditModal.open(null));
    document.querySelector('.view-persona')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-pa]'); if(!btn) return;
      const {pa,id}=btn.dataset;
      if(pa==='edit') { PersonaEditModal.open(Store.personas().find(p=>p.id===id)); }
      if(pa==='del')  { if(confirm('この人格を削除しますか？')) { Store.deletePersona(id); Router.render('persona'); } }
    });
  }
};

// =========================================================
// PERSONA EDIT MODAL
// =========================================================
const PersonaEditModal = {
  open(persona) {
    const isNew=!persona;
    Modal.show(`
      <div class="modal-header"><h2>${isNew?'人格を追加':'人格を編集'}</h2><button id="m-close">✕</button></div>
      <div class="persona-edit-form">
        <div class="form-section">
          <label class="form-label">人格名</label>
          <input id="pe-name" type="text" class="form-input" value="${Utils.esc(persona?.name||'')}" ${persona?.isBuiltIn?'readonly':''} placeholder="例：競馬アカウント">
        </div>
        <div class="form-section">
          <label class="form-label">口調・キャラクター</label>
          <textarea id="pe-tone" class="form-textarea">${Utils.esc(persona?.tone||'')}</textarea>
        </div>
        <div class="form-section">
          <label class="form-label">投稿方針</label>
          <textarea id="pe-policy" class="form-textarea">${Utils.esc(persona?.policy||'')}</textarea>
        </div>
        <div class="form-section">
          <label class="form-label">NG表現・禁止ワード</label>
          <input id="pe-ng" type="text" class="form-input" value="${Utils.esc(persona?.ngExpressions||'')}" placeholder="例：確実に当たる">
        </div>
        <div class="form-section">
          <label class="form-label">ハッシュタグ方針</label>
          <input id="pe-tags" type="text" class="form-input" value="${Utils.esc(persona?.hashtagPolicy||'')}" placeholder="例：#競馬 #中央競馬">
        </div>
        ${persona?.isBuiltIn?'<p class="builtin-note">🔒 プリセットは削除できません（内容は編集できます）</p>':''}
        <button id="pe-save" class="btn-primary" style="margin-top:8px">保存</button>
      </div>`);
    document.getElementById('m-close')?.addEventListener('click',()=>Modal.hide());
    document.getElementById('pe-save')?.addEventListener('click',()=>{
      const name=document.getElementById('pe-name')?.value?.trim()||'';
      if(!name) return Toast.show('人格名を入力してください');
      const d={name, tone:document.getElementById('pe-tone')?.value||'',
        policy:document.getElementById('pe-policy')?.value||'',
        ngExpressions:document.getElementById('pe-ng')?.value||'',
        hashtagPolicy:document.getElementById('pe-tags')?.value||''};
      persona?Store.updatePersona(persona.id,d):Store.addPersona(d);
      Modal.hide(); Toast.show('保存しました ✅'); Router.render('persona');
    });
  }
};

// =========================================================
// SETTINGS VIEW
// =========================================================
const SettingsView = {
  render() {
    const user = AuthManager.user;
    return `
    <div style="padding-bottom:32px">
      ${user ? this._renderAccountSection(user) : this._renderLoginSection()}

      <div class="settings-section">
        <div class="settings-header">このアプリについて</div>
        <div class="about-text">
          X（旧Twitter）への投稿は<strong>すべてご自身の手で</strong>行います。<br>
          本アプリは投稿文の作成・管理・クリップボードへのコピーを支援するツールです。X APIによる自動投稿機能は実装していません。
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-header">アプリ情報</div>
        <div class="info-row"><span>バージョン</span><span>2.1.0</span></div>
        <div class="info-row"><span>ストレージ</span><span>ブラウザ内（localStorage）</span></div>
        <div class="info-row"><span>対応環境</span><span>Safari (iOS) / Chrome</span></div>
        <div class="settings-row">
          <span>表示が古い場合</span>
          <button id="s-force-reload" class="link-btn">キャッシュをクリアして更新</button>
        </div>
      </div>
    </div>`;
  },

  _renderAccountSection(user) {
    return `
    <div class="settings-section">
      <div class="settings-header">アカウント</div>
      <div class="settings-row">
        <span>メールアドレス</span>
        <span style="font-size:13px;color:var(--text2);word-break:break-all">${Utils.esc(user.email)}</span>
      </div>
      <div id="s-plan-row" class="settings-row">
        <span>プラン</span>
        <span class="text-muted">読み込み中…</span>
      </div>
      <div id="s-usage-row" class="settings-row">
        <span>本日の利用</span>
        <span class="text-muted">読み込み中…</span>
      </div>
      <div id="s-upgrade-row" class="settings-row hidden">
        <span></span>
        <button id="s-upgrade" class="link-btn" style="color:var(--accent)">有料プランへ ›</button>
      </div>
      <div class="settings-row" style="border-top:1px solid var(--border);padding-top:14px">
        <button id="s-logout" style="color:var(--red);font-size:15px;width:100%;text-align:center">ログアウト</button>
      </div>
    </div>`;
  },

  _renderLoginSection() {
    return `
    <div class="settings-section">
      <div class="settings-header">アカウント</div>
      <div class="settings-row">
        <span>ログインしていません</span>
        <button id="s-login" class="link-btn">ログイン →</button>
      </div>
      <p class="settings-note">AI生成機能を使用するにはログインが必要です。</p>
    </div>`;
  },

  mount() {
    if (AuthManager.user) {
      this._loadProfile();
      document.getElementById('s-logout')?.addEventListener('click', async () => {
        if (!confirm('ログアウトしますか？')) return;
        await AuthManager.signOut(); UserProfile.clearCache();
        Toast.show('ログアウトしました'); Router.render('settings');
      });
    } else {
      document.getElementById('s-login')?.addEventListener('click', () => {
        AuthModal.open(() => Router.render('settings'));
      });
    }

    document.getElementById('s-force-reload')?.addEventListener('click', async () => {
      Toast.show('キャッシュをクリア中…', 3000);
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      } catch {}
      window.location.reload(true);
    });
  },

  async _loadProfile() {
    const profile = await UserProfile.get();
    if (!profile) return;

    const plan      = profile.plan || 'free';
    const limit     = UserProfile.limit(profile);
    const used      = UserProfile.todayCount(profile);
    const remaining = UserProfile.remaining(profile);
    const planLabel = plan === 'paid' ? '有料プラン' : '無料プラン（無料）';

    const planRow = document.getElementById('s-plan-row');
    if (planRow) planRow.querySelector('span:last-child').textContent = planLabel;

    const usageRow = document.getElementById('s-usage-row');
    if (usageRow) usageRow.querySelector('span:last-child').textContent = `${used} / ${limit} 回（残り${remaining}回）`;

    if (plan === 'free') {
      const upgradeRow = document.getElementById('s-upgrade-row');
      if (upgradeRow) upgradeRow.classList.remove('hidden');
      document.getElementById('s-upgrade')?.addEventListener('click', () => {
        Router.go('ai-generate');
        setTimeout(() => document.getElementById('ai-upgrade-btn')?.click(), 300);
      });
    }
  }
};

// =========================================================
// ROUTER
// =========================================================
const VIEWS = {
  home:          {title:'投稿一覧',       view: HomeView},
  create:        {title:'投稿を作成',     view: CreateView},
  'ai-generate': {title:'AI投稿生成',     view: AIView},
  persona:       {title:'人格プリセット', view: PersonaView},
  settings:      {title:'設定',           view: SettingsView},
};

const Router = {
  _current: null,

  render(name) {
    const cfg = VIEWS[name]; if (!cfg) return;
    this._current = name;
    document.getElementById('page-title').textContent = cfg.title;
    const vc = document.getElementById('view-container');
    vc.innerHTML = cfg.view.render();
    cfg.view.mount?.();
  },

  go(name) {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    this.render(name);
  }
};

// =========================================================
// APP INIT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.init();

  // 認証状態が変わったときに関連ビューを再描画
  AuthManager.onAuthChange(() => {
    const authDependentViews = ['ai-generate', 'settings'];
    if (authDependentViews.includes(Router._current)) {
      Router.render(Router._current);
    }
  });

  document.getElementById('tab-bar').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn'); if (!btn) return;
    Router.go(btn.dataset.view);
  });

  Router.go('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // 決済完了後のリダイレクト処理
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    UserProfile.clearCache();
    setTimeout(() => Toast.show('有料プランへの切り替えが完了しました！', 4000), 600);
    history.replaceState({}, '', window.location.pathname);
  }
  if (params.get('payment') === 'cancel') {
    setTimeout(() => Toast.show('決済がキャンセルされました'), 600);
    history.replaceState({}, '', window.location.pathname);
  }
});
