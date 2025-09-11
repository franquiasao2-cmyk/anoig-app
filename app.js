/* ================== SUPABASE: INIT ================== */
const SUPABASE_URL = "https://tyhoonmssqxbtktiuwtd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aG9vbm1zc3F4YnRrdGl1d3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjg5MTgsImV4cCI6MjA3MzAwNDkxOH0.e-vVW5CSihmFlYGpvms0KLCrhqxdCqujJxhT6a-nBpI";

// Garante que supabase SDK está presente
if (typeof supabase === "undefined") {
  console.error("Supabase SDK não carregou. Verifique a <script src='@supabase/supabase-js@2'> no index.html.");
}
let supa = typeof supabase !== "undefined" ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;

/* ============ THEME & STATE ============ */
const THEME_KEY = 'anoig-theme';
var assinaturaStatus = 'ativa';

var state = {
  header: {
    title: 'Título da Página',
    titleColor: '#111827',
    titleFont: 'Inter, Arial, sans-serif',
    subtitle: 'Subtítulo opcional',
    subtitleColor: '#4b5563',
    bgType: 'solid',      // solid | gradient | preset
    color: '#e5e7eb',     // solid
    grad1: '#6366f1',     // gradient
    grad2: '#ec4899',     // gradient
    preset: 'pattern1',   // preset chosen
    logoDataUrl: ''       // preview do logo
  },
  buttons: [],
  selectedIndex: -1,
  slug: ''
};

/* ============ HELPERS ============ */
function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
}
function shade(hex, factor){
  try{
    if(!hex) hex='#2b7a78';
    if(typeof factor!=='number') factor=0.6;
    let c=hex.replace('#',''); if(c.length!==6) return hex;
    let n=parseInt(c,16);
    let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    let s=v=>Math.min(255,Math.max(0,Math.round(v*factor)));
    let out=(s(r)<<16)|(s(g)<<8)|s(b);
    let h=out.toString(16); while(h.length<6) h='0'+h;
    return '#'+h;
  }catch(e){ return hex; }
}
function sanitizeSlug(s){
  try{
    s=(s||'').toLowerCase();
    if(s.normalize) s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    s=s.replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return s;
  }catch(e){ return s||''; }
}
function applyTheme(theme){
  try{
    var t=(theme==='dark')?'dark':'light';
    document.documentElement.setAttribute('data-theme',t);
    localStorage.setItem(THEME_KEY,t);
    var sel=qs('#themeSelect'); if(sel) sel.value=t;
  }catch(e){}
}
function initTheme(){
  try{
    var saved=localStorage.getItem(THEME_KEY);
    applyTheme(saved||'light');
  }catch(e){
    applyTheme('light');
  }
}
function fmtDate(iso){
  try{ const d=new Date(iso); return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return '-';}
}
function monthKey(iso){ const d=new Date(iso); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function monthLabel(key){ const [y,m]=key.split('-'); const d=new Date(Number(y), Number(m)-1, 1); return d.toLocaleDateString('pt-BR',{month:'long', year:'numeric'}); }

/* ============ TABS / SCREENS ============ */
function setScreenFromHash(){
  try{
    var hash=(location.hash||'').replace('#','')||'criar';
    qsa('.screen').forEach(s=>s.classList.add('hidden'));
    var el=qs('#view-'+hash); if(el) el.classList.remove('hidden');
    qsa('.tab').forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+hash));
    if(hash==='projetos'){ initProjectsView(); }
  }catch(e){ console.error(e); }
}

/* ============ MODELOS: USAR MODELO ============ */
var presetModels = {
  essencial: [
    { label:'WhatsApp', link:'https://wa.me/5591...', color:'#25D366', textColor:'#ffffff', size:'md', radius:14, shadow:true },
    { label:'Instagram', link:'https://instagram.com/seucliente', color:'#E1306C', textColor:'#ffffff', size:'md', radius:14, shadow:true },
    { label:'Site', link:'https://exemplo.com', color:'#2b7a78', textColor:'#ffffff', size:'md', radius:14, shadow:false }
  ],
  promo: [
    { label:'Compre agora', link:'https://loja.com/produto', color:'#ef4444', textColor:'#ffffff', size:'md', radius:16, shadow:true },
    { label:'Cupom -20%', link:'https://exemplo.com/cupom', color:'#f59e0b', textColor:'#111827', size:'lg', radius:16, shadow:true }
  ],
  servicos: [
    { label:'Agendar consulta', link:'https://agenda.com', color:'#3b82f6', textColor:'#ffffff', size:'md', radius:14, shadow:true },
    { label:'Orçamento', link:'https://formulario.com', color:'#9333ea', textColor:'#ffffff', size:'md', radius:14, shadow:false }
  ],
  restaurante: [
    { label:'Cardápio', link:'https://menu.delivery', color:'#ef4444', textColor:'#ffffff', size:'lg', radius:18, shadow:true },
    { label:'Peça no iFood', link:'https://ifood.com', color:'#f97316', textColor:'#111827', size:'md', radius:16, shadow:true }
  ]
};

/* ============ AUTENTICAÇÃO BÁSICA ============ */
async function getCurrentUser(){
  if(!supa) return null;
  const { data:{ user } = { user:null } } = await supa.auth.getUser();
  return user||null;
}
function setAuthUI(user){
  try{
    const hello=qs('#authHello'), helloEmail=qs('#authEmail');
    const emailInp=qs('#authEmailInput'), passInp=qs('#authPassInput');
    const btnUp=qs('#btnSignUp'), btnIn=qs('#btnSignIn'), btnOut=qs('#btnSignOut');

    if(user){
      if(hello) hello.style.display='inline';
      if(helloEmail) helloEmail.textContent=user.email||'';
      if(emailInp) emailInp.style.display='none';
      if(passInp)  passInp.style.display='none';
      if(btnUp) btnUp.style.display='none';
      if(btnIn) btnIn.style.display='none';
      if(btnOut) btnOut.style.display='inline-block';
    }else{
      if(hello) hello.style.display='none';
      if(helloEmail) helloEmail.textContent='';
      if(emailInp){ emailInp.style.display='inline-block'; emailInp.value=''; }
      if(passInp){ passInp.style.display='inline-block'; passInp.value=''; }
      if(btnUp) btnUp.style.display='inline-block';
      if(btnIn) btnIn.style.display='inline-block';
      if(btnOut) btnOut.style.display='none';
    }

    const saveBtn=qs('#saveDraft'), pubBtn=qs('#publish'), hint=qs('#publishHint');
    const signed=!!user;
    if(saveBtn) saveBtn.disabled=!signed;
    if(pubBtn)  pubBtn.disabled=!signed || (assinaturaStatus!=='ativa');
    if(hint){
      if(!signed) hint.textContent='Faça login para salvar e publicar.';
      else if(assinaturaStatus!=='ativa') hint.textContent='Assinatura inativa.';
      else hint.textContent='';
    }
    const meuEmail=qs('#meuEmail'); if(meuEmail) meuEmail.value=user?(user.email||''):'';
  }catch(e){ console.error(e); }
}
async function handleSignUp(){
  if(!supa){ alert('Supabase indisponível'); return; }
  const email=(qs('#authEmailInput')?.value||'').trim();
  const pass=(qs('#authPassInput')?.value||'').trim();
  if(!email||!pass){ alert('Preencha e-mail e senha.'); return; }
  const { error } = await supa.auth.signUp({ email, password:pass });
  if(error){ alert('Erro no cadastro: '+error.message); return; }
  alert('Cadastro feito! Verifique seu e-mail se necessário.');
  const u=await getCurrentUser(); setAuthUI(u);
}
async function handleSignIn(){
  if(!supa){ alert('Supabase indisponível'); return; }
  const email=(qs('#authEmailInput')?.value||'').trim();
  const pass=(qs('#authPassInput')?.value||'').trim();
  if(!email||!pass){ alert('Preencha e-mail e senha.'); return; }
  const { error } = await supa.auth.signInWithPassword({ email, password:pass });
  if(error){ alert('Erro ao entrar: '+error.message); return; }
  alert('Bem-vindo!');
  const u=await getCurrentUser(); setAuthUI(u);
}
async function handleSignOut(){
  if(!supa) return;
  await supa.auth.signOut();
  setAuthUI(null);
}

/* ============ PERFIL (tema etc) ============ */
async function savePreferences(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para salvar.'); return; }
  const name=(qs('#meuNome')?.value||'').trim();
  const theme=(qs('#themeSelect')?.value||'light');
  applyTheme(theme);
  const { error } = await supa.from('profiles').update({ name, theme }).eq('id',user.id);
  if(error){ alert('Erro ao salvar perfil: '+error.message); return; }
  alert('Preferências salvas.');
}

/* ============ PROJETOS (lista) ============ */
let _projectsCache = [];
async function fetchMyPages(){
  const user=await getCurrentUser(); if(!user || !supa) return [];
  const { data, error } = await supa.from('pages')
    .select('id, slug, title, is_published, created_at, updated_at, published_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending:false });
  if(error){ alert('Erro ao carregar projetos: '+error.message); return []; }
  return data||[];
}
function populateMonthFilter(pages){
  const sel=qs('#fltMonth'); if(!sel) return;
  const keys = Array.from(new Set((pages||[]).map(p=>monthKey(p.created_at||p.updated_at)))).sort().reverse();
  sel.innerHTML = '<option value="all">Todos os meses</option>' + keys.map(k=>`<option value="${k}">${escapeHtml(monthLabel(k))}</option>`).join('');
}
function filterProjects(pages){
  const st=(qs('#fltStatus')?.value)||'all';
  const mk=(qs('#fltMonth')?.value)||'all';
  return (pages||[]).filter(p=>{
    if(st==='published' && !p.is_published) return false;
    if(st==='draft' && p.is_published) return false;
    if(mk!=='all'){
      const k = monthKey(p.created_at||p.updated_at);
      if(k!==mk) return false;
    }
    return true;
  });
}
function renderProjects(pages){
  const list=qs('#projectsList'), empty=qs('#projectsEmpty');
  if(!list) return;
  list.innerHTML='';
  const items = filterProjects(pages);
  if(!items.length){ if(empty) empty.style.display='block'; return; }
  if(empty) empty.style.display='none';
  items.forEach(p=>{
    const card=document.createElement('div');
    card.className='proj-card';
    const badge = p.is_published ? '<span class="badge ok">Publicado</span>' : '<span class="badge">Rascunho</span>';
    const pubInfo = p.is_published ? `• publicado em ${fmtDate(p.published_at)}` : '';
    card.innerHTML = `
      <div class="proj-top">
        <div class="proj-title">${escapeHtml(p.title||'(sem título)')}</div>
        ${badge}
      </div>
      <div class="small-muted">Slug: <code>${escapeHtml(p.slug)}</code> • atualizado em ${fmtDate(p.updated_at||p.created_at)} ${pubInfo}</div>
      <div class="proj-foot">
        <button class="btn small" data-act="edit" data-id="${p.id}">Editar</button>
        ${p.is_published ? `<button class="btn small" data-act="copy" data-slug="${escapeHtml(p.slug)}">Copiar link</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
  list.querySelectorAll('button[data-act="edit"]').forEach(b=>{
    b.addEventListener('click', e=>{
      const id=e.currentTarget.getAttribute('data-id');
      loadPageForEditing(id);
    });
  });
  list.querySelectorAll('button[data-act="copy"]').forEach(b=>{
    b.addEventListener('click', e=>{
      const slug=e.currentTarget.getAttribute('data-slug');
      const url=location.origin + '/page.html#' + slug;
      if(navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(()=>alert('Link copiado:\n'+url),()=>window.prompt('Copie o link:', url));
      else window.prompt('Copie o link:', url);
    });
  });
}
async function initProjectsView(forceRefresh){
  const user=await getCurrentUser();
  if(!user){ alert('Faça login para ver seus projetos.'); return; }
  if(forceRefresh || !_projectsCache.length){ _projectsCache = await fetchMyPages(); }
  populateMonthFilter(_projectsCache);
  renderProjects(_projectsCache);
}

/* ============ CABEÇALHO: Binds e Preview ============ */
function bindHeaderUI(){
  try{
    const title=qs('#pageTitle'), subtitle=qs('#pageSubtitle');
    const titleColor=qs('#titleColor'), subtitleColor=qs('#subtitleColor');
    const titleFont=qs('#titleFont'), titleFontSample=qs('#titleFontSample');
    const bgType=qs('#headerBgType'), headerColor=qs('#headerColor');
    const grad1=qs('#gradColor1'), grad2=qs('#gradColor2');
    const bgSolidRow=qs('#bgSolidRow'), bgGradientRow=qs('#bgGradientRow'), bgPresetRow=qs('#bgPresetRow');
    const goButtons=qs('#goButtons');
    const logoInput=qs('#logoInput');

    if(title) title.addEventListener('input', e=>{ state.header.title=e.target.value||'Título da Página'; refreshHeader(); });
    if(subtitle) subtitle.addEventListener('input', e=>{ state.header.subtitle=e.target.value||''; refreshHeader(); });

    if(titleColor) titleColor.addEventListener('input', e=>{ state.header.titleColor=e.target.value||'#111827'; refreshHeader(); });
    if(subtitleColor) subtitleColor.addEventListener('input', e=>{ state.header.subtitleColor=e.target.value||'#4b5563'; refreshHeader(); });

    if(titleFont){
      titleFont.addEventListener('change', e=>{
        state.header.titleFont=e.target.value;
        if(titleFontSample) titleFontSample.style.fontFamily=state.header.titleFont;
        refreshHeader();
      });
      if(titleFontSample) titleFontSample.style.fontFamily=state.header.titleFont;
    }

    if(bgType) bgType.addEventListener('change', ()=>{
      state.header.bgType=bgType.value;
      if(bgSolidRow) bgSolidRow.classList.toggle('hidden-soft', state.header.bgType!=='solid');
      if(bgGradientRow) bgGradientRow.classList.toggle('hidden-soft', state.header.bgType!=='gradient');
      if(bgPresetRow) bgPresetRow.classList.toggle('hidden-soft', state.header.bgType!=='preset');
      refreshHeader();
    });

    if(headerColor) headerColor.addEventListener('input', e=>{ state.header.color=e.target.value||'#e5e7eb'; refreshHeader(); });
    if(grad1) grad1.addEventListener('input', e=>{ state.header.grad1=e.target.value||'#6366f1'; refreshHeader(); });
    if(grad2) grad2.addEventListener('input', e=>{ state.header.grad2=e.target.value||'#ec4899'; refreshHeader(); });

    const presetsGrid = qs('#headerPresetsGrid');
    if(presetsGrid){
      presetsGrid.addEventListener('click', e=>{
        const card = e.target.closest('.model-card'); if(!card) return;
        const preset = card.getAttribute('data-hpreset');
        state.header.preset = preset || 'pattern1';
        refreshHeader();
      });
    }

    if(logoInput){
      logoInput.addEventListener('change', ()=>{
        const f=logoInput.files && logoInput.files[0]; if(!f) return;
        const r=new FileReader();
        r.onload = ()=>{ state.header.logoDataUrl = String(r.result); refreshHeader(); };
        r.readAsDataURL(f);
      });
    }

    if(goButtons){ goButtons.addEventListener('click', ()=>{ const wrap=qs('#createNewWrap'); if(wrap) wrap.classList.remove('hidden-soft'); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
  }catch(e){ console.error(e); }
}

function refreshHeader(){
  try{
    const header=qs('#phoneHeader'); const t=qs('#pvTitle'); const s=qs('#pvSubtitle');
    const avatar=qs('#avatarBox');

    if(t){ t.textContent=state.header.title||'Título da Página'; t.style.color=state.header.titleColor||'#111827'; t.style.fontFamily=state.header.titleFont; }
    if(s){ s.textContent=state.header.subtitle||''; s.style.color=state.header.subtitleColor||'#4b5563'; }

    if(header){
      if(state.header.bgType==='solid'){
        header.style.background = state.header.color||'#e5e7eb';
      } else if(state.header.bgType==='gradient'){
        header.style.background = `linear-gradient(135deg, ${state.header.grad1||'#6366f1'}, ${state.header.grad2||'#ec4899'})`;
      } else {
        if(state.header.preset==='pattern2'){
          header.style.background='linear-gradient(135deg,#cbd5e1,#94a3b8)';
        } else if(state.header.preset==='pattern3'){
          header.style.background='linear-gradient(135deg,#fef3c7,#fca5a5)';
        } else {
          header.style.background='var(--phone-header-default)';
        }
      }
    }

    const logoPrev=qs('#logoPreview');
    if(state.header.logoDataUrl){
      if(logoPrev){ logoPrev.innerHTML=''; logoPrev.style.backgroundImage=`url(${state.header.logoDataUrl})`; logoPrev.style.backgroundSize='cover'; logoPrev.style.backgroundPosition='center'; }
      if(avatar){ avatar.textContent=''; avatar.style.backgroundImage=`url(${state.header.logoDataUrl})`; avatar.style.backgroundSize='cover'; avatar.style.backgroundPosition='center'; }
    } else {
      if(logoPrev){ logoPrev.style.backgroundImage='none'; logoPrev.textContent='LOGO'; }
      if(avatar){ avatar.style.backgroundImage='none'; avatar.textContent='+'; }
    }
  }catch(e){ console.error(e); }
}

/* ============ BOTÕES ============ */
function bindButtonsUI(){
  try{
    const optCreateNew=qs('#optCreateNew');
    const optUseModel=qs('#optUseModel');
    const createNewWrap=qs('#createNewWrap');
    const useModelWrap=qs('#useModelWrap');
    const addBtn=qs('#addBtn'), applyBtn=qs('#applyBtn'), deleteBtn=qs('#deleteBtn');
    const btnText=qs('#btnText'), btnLink=qs('#btnLink');
    const btnColor=qs('#btnColor'), btnTextColor=qs('#btnTextColor');
    const btnSize=qs('#btnSize'), btnRadius=qs('#btnRadius'), btnShadow=qs('#btnShadow');

    if(optCreateNew) optCreateNew.addEventListener('click', ()=>{
      if(createNewWrap) createNewWrap.classList.remove('hidden-soft');
      if(useModelWrap) useModelWrap.classList.add('hidden-soft');
    });
    if(optUseModel) optUseModel.addEventListener('click', ()=>{
      if(useModelWrap) useModelWrap.classList.remove('hidden-soft');
      if(createNewWrap) createNewWrap.classList.add('hidden-soft');
    });

    const grid=qs('#btnModelsGrid');
    if(grid){
      grid.innerHTML = '';
      Object.keys(presetModels).forEach(group=>{
        (presetModels[group]||[]).forEach((m)=>{
          const card=document.createElement('div');
          card.className='model-card';
          card.innerHTML = `
            <div class="thumb"></div>
            <strong>${escapeHtml(m.label)}</strong>
            <div class="model-plus">+</div>
          `;
          card.addEventListener('click', ()=>{
            state.buttons.push({
              label:m.label, link:m.link, color:m.color, textColor:m.textColor,
              size:m.size||'md', radius:(typeof m.radius==='number'?m.radius:14), shadow: !!m.shadow
            });
            state.selectedIndex = state.buttons.length-1;
            refreshButtonsUI();
          });
          grid.appendChild(card);
        });
      });
    }

    if(addBtn) addBtn.addEventListener('click', ()=>{
      const b = {
        label: (btnText?.value||'Novo botão'),
        link: (btnLink?.value||'https://'),
        color: (btnColor?.value||'#2b7a78'),
        textColor: (btnTextColor?.value||'#ffffff'),
        size: (btnSize?.value||'md'),
        radius: Number(btnRadius?.value||14),
        shadow: !!(btnShadow?.checked)
      };
      state.buttons.push(b);
      state.selectedIndex = state.buttons.length-1;
      refreshButtonsUI();
    });

    if(applyBtn) applyBtn.addEventListener('click', ()=>{
      if(state.selectedIndex<0 || !state.buttons[state.selectedIndex]) return;
      const b=state.buttons[state.selectedIndex];
      b.label = btnText?.value||'Botão';
      b.link  = btnLink?.value||'https://';
      b.color = btnColor?.value||'#2b7a78';
      b.textColor = btnTextColor?.value||'#ffffff';
      b.size  = btnSize?.value||'md';
      b.radius= Number(btnRadius?.value||14);
      b.shadow= !!(btnShadow?.checked);
      refreshButtonsUI();
    });

    if(deleteBtn) deleteBtn.addEventListener('click', ()=>{
      if(state.selectedIndex<0) return;
      state.buttons.splice(state.selectedIndex,1);
      state.selectedIndex=-1;
      refreshButtonsUI();
    });

    const list = qs('#buttonsList'); if(list){ enableDragSort(list); }
  }catch(e){ console.error(e); }
}

function refreshButtonsUI(){
  try{
    var list=qs('#buttonsList');
    if(list){
      list.innerHTML='';
      state.buttons.forEach(function(b,idx){
        var li=document.createElement('li'); li.draggable=true;
        li.innerHTML='<div class="item-left"><span class="item-handle">≡</span><span>'+escapeHtml(b.label)+'</span></div><div class="item-actions"><button class="btn small">Editar</button></div>';
        li.querySelector('.btn').addEventListener('click', function(){
          state.selectedIndex=idx; loadButtonToForm();
        });
        li.setAttribute('data-index', String(idx));
        list.appendChild(li);
      });
    }
    var pv=qs('#pvButtons');
    if(pv){
      pv.innerHTML='';
      state.buttons.forEach(function(b){
        const node = renderNativeButton(b);
        pv.appendChild(node);
      });
    }
    loadButtonToForm();
  }catch(e){ console.error(e); }
}

function loadButtonToForm(){
  try{
    var i=state.selectedIndex;
    const btnText=qs('#btnText'), btnLink=qs('#btnLink');
    const btnColor=qs('#btnColor'), btnTextColor=qs('#btnTextColor');
    const btnSize=qs('#btnSize'), btnRadius=qs('#btnRadius'), btnShadow=qs('#btnShadow');

    if(i<0 || !state.buttons[i]){
      if(btnText) btnText.value='';
      if(btnLink) btnLink.value='';
      if(btnColor) btnColor.value='#2b7a78';
      if(btnTextColor) btnTextColor.value='#ffffff';
      if(btnSize) btnSize.value='md';
      if(btnRadius) btnRadius.value=14;
      if(btnShadow) btnShadow.checked=true;
      return;
    }
    var b=state.buttons[i];
    if(btnText) btnText.value=b.label||'';
    if(btnLink) btnLink.value=b.link||'';
    if(btnColor) btnColor.value=b.color||'#2b7a78';
    if(btnTextColor) btnTextColor.value=b.textColor||'#ffffff';
    if(btnSize) btnSize.value=b.size||'md';
    if(btnRadius) btnRadius.value=(typeof b.radius==='number')?b.radius:14;
    if(btnShadow) btnShadow.checked=!!b.shadow;
  }catch(e){ console.error(e); }
}

function renderNativeButton(b){
  const a=document.createElement('a');
  a.className='card-btn'; a.href=b.link||'#'; a.target='_blank';
  a.style.borderRadius=(b.radius||14)+'px';
  a.setAttribute('data-style','solid');
  a.setAttribute('data-size', b.size||'md');
  a.setAttribute('data-shadow', b.shadow?'true':'false');
  a.style.background=b.color||'#2b7a78';
  a.style.border='0';
  a.innerHTML='<div class="card-inner"><div class="card-icon" style="background:'+ (b.color||'#2b7a78') +'"></div><div class="card-label" style="color:'+ (b.textColor||'#ffffff') +'">'+escapeHtml(b.label)+'</div></div>';
  return a;
}

function enableDragSort(list){
  var dragEl=null;
  list.addEventListener('dragstart', function(e){ dragEl=e.target.closest('li'); if(e.dataTransfer) e.dataTransfer.effectAllowed='move'; });
  list.addEventListener('dragover', function(e){ e.preventDefault(); var li=e.target.closest('li'); if(!li||li===dragEl) return; var rect=li.getBoundingClientRect(); var next=(e.clientY-rect.top)/rect.height>0.5; list.insertBefore(dragEl, next?li.nextSibling:li); });
  list.addEventListener('drop', function(){ var items=Array.prototype.slice.call(list.querySelectorAll('li')); var newOrder=items.map(li=>state.buttons[Number(li.getAttribute('data-index'))]); state.buttons=newOrder; state.selectedIndex=-1; refreshButtonsUI(); });
}

/* ============ IDENTIDADE & PUBLICAÇÃO ============ */
function bindIdentity(){
  try{
    const pageSlug=qs('#pageSlug');
    const saveDraftBtn=qs('#saveDraft'), publishBtn=qs('#publish'), copyLinkBtn=qs('#copyLink');

    if(pageSlug) pageSlug.addEventListener('input', e=>{ state.slug = sanitizeSlug(e.target.value); });

    if(saveDraftBtn) saveDraftBtn.addEventListener('click', saveToDatabase);
    if(publishBtn) publishBtn.addEventListener('click', publishPage);
    if(copyLinkBtn) copyLinkBtn.addEventListener('click', copyPublicLink);
  }catch(e){ console.error(e); }
}

function validateDraft(opts){
  try{
    opts=opts||{}; var errs=[];
    if(!state.header.title||state.header.title.replace(/\s+/g,'').length<2) errs.push('Título obrigatório.');
    if(!Array.isArray(state.buttons)||state.buttons.length===0) errs.push('Crie ao menos 1 botão.');
    if(!state.slug||state.slug.length<2) errs.push('Escolha o link (slug) inválido.');
    state.buttons.forEach(function(b,i){
      if(!b.label||!b.link) errs.push('Botão '+(i+1)+': texto e link são obrigatórios.');
      if(b.link&&!/^https?:\/\//i.test(b.link)) errs.push('Botão '+(i+1)+': link deve começar com http(s)://');
    });
    if(errs.length){ if(!opts.silent) alert('Antes de salvar/publicar:\n\n- '+errs.join('\n- ')); return false; }
    return true;
  }catch(e){ console.error(e); return false; }
}

async function saveToDatabase(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para salvar.'); return; }
  if(!supa){ alert('Supabase indisponível'); return; }
  if(!validateDraft()) return;

  try{
    const header_preset = (state.header.bgType==='preset' ? (state.header.preset||'pattern1') : state.header.bgType);
    const base = {
      owner_id:user.id,
      slug:state.slug,
      title:state.header.title,
      subtitle:state.header.subtitle||null,
      header_preset:header_preset,
      header_color: (state.header.bgType==='solid' ? state.header.color : (state.header.bgType==='gradient' ? `${state.header.grad1}|${state.header.grad2}` : null)),
      updated_at:new Date().toISOString(),
      is_published:false
    };

    let { data: ex, error: selErr } = await supa.from('pages').select('id').eq('owner_id',user.id).eq('slug',state.slug).limit(1);
    if(selErr){ alert('Erro lendo página: '+selErr.message); return; }
    let pageId=null;
    if(ex && ex.length){
      pageId=ex[0].id;
      const { error: upErr } = await supa.from('pages').update(base).eq('id',pageId).eq('owner_id',user.id);
      if(upErr){ alert('Erro atualizando página: '+upErr.message); return; }
    } else {
      const { data: ins, error: insErr } = await supa.from('pages').insert(base).select('id').single();
      if(insErr){ alert('Erro criando página: '+insErr.message); return; }
      pageId=ins.id;
    }

    await supa.from('buttons').delete().eq('page_id',pageId);
    const payload = state.buttons.map((b,idx)=>({
      page_id:pageId,
      label:b.label,
      url:b.link,
      order_index:idx,
      color:b.color||null,
      text_color:b.textColor||null,
      style:'solid',
      size:b.size||'md',
      radius: (typeof b.radius==='number'?b.radius:14),
      shadow: !!b.shadow,
      kind: 'native',
      svg_template_key: null,
      svg_color: null,
      svg_text_color: null
    }));
    const { error: btnErr } = await supa.from('buttons').insert(payload);
    if(btnErr){ alert('Erro salvando botões: '+btnErr.message); return; }

    alert('Rascunho salvo no banco!');
  }catch(e){ console.error(e); alert('Falha ao salvar: '+(e.message||e)); }
}

async function publishPage(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para publicar.'); return; }
  if(assinaturaStatus!=='ativa'){ alert('Assinatura inativa.'); return; }
  if(!supa){ alert('Supabase indisponível'); return; }
  if(!validateDraft()) return;

  try{
    await saveToDatabase();
    const { data: pg, error: selErr } = await supa.from('pages').select('id').eq('owner_id',user.id).eq('slug',state.slug).single();
    if(selErr){ alert('Erro localizando página: '+selErr.message); return; }
    const { error: pubErr } = await supa.from('pages').update({ is_published:true, published_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',pg.id).eq('owner_id',user.id);
    if(pubErr){ alert('Erro ao publicar: '+pubErr.message); return; }
    alert('Página publicada!');
  }catch(e){ console.error(e); alert('Falha ao publicar: '+(e.message||e)); }
}

function copyPublicLink(){
  if(!state.slug){ alert('Defina “Escolha o link” antes.'); return; }
  try{
    var url=location.origin + '/page.html#' + state.slug;
    if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(url).then(()=>alert('Link copiado:\n'+url),()=>window.prompt('Copie o link:', url)); }
    else { window.prompt('Copie o link:', url); }
  }catch(e){ console.error(e); }
}

/* ============ CARREGAR PROJETO PARA EDITAR ============ */
async function loadPageForEditing(pageId){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta.'); return; }
  if(!supa){ alert('Supabase indisponível'); return; }
  try{
    const { data: page, error: pErr } = await supa.from('pages').select('*').eq('id',pageId).eq('owner_id',user.id).single();
    if(pErr){ alert('Erro lendo página: '+pErr.message); return; }
    const { data: buttons, error: bErr } = await supa.from('buttons').select('*').eq('page_id',pageId).order('order_index',{ascending:true});
    if(bErr){ alert('Erro lendo botões: '+bErr.message); return; }

    state.slug=page.slug;
    state.header.title=page.title||'Título da Página';
    state.header.subtitle=page.subtitle||'';
    if((page.header_preset||'').startsWith('pattern')){ state.header.bgType='preset'; state.header.preset=page.header_preset; }
    else if(page.header_preset==='gradient' || (page.header_color||'').includes('|')){
      state.header.bgType='gradient';
      const parts=(page.header_color||'').split('|'); state.header.grad1=parts[0]||'#6366f1'; state.header.grad2=parts[1]||'#ec4899';
    } else {
      state.header.bgType='solid'; state.header.color=page.header_color||'#e5e7eb';
    }
    state.header.titleColor='#111827';
    state.header.subtitleColor='#4b5563';
    state.header.titleFont='Inter, Arial, sans-serif';
    state.header.logoDataUrl='';

    state.buttons=(buttons||[]).map(b=>({
      label:b.label, link:b.url, color:b.color||'#2b7a78', textColor:b.text_color||'#ffffff', size:b.size||'md', radius:(typeof b.radius==='number'?b.radius:14), shadow: !!b.shadow
    }));
    state.selectedIndex=-1;

    if(qs('#pageSlug')) qs('#pageSlug').value=state.slug;
    if(qs('#pageTitle')) qs('#pageTitle').value=state.header.title;
    if(qs('#pageSubtitle')) qs('#pageSubtitle').value=state.header.subtitle;
    if(qs('#headerBgType')) qs('#headerBgType').value=state.header.bgType;
    if(qs('#headerColor')) qs('#headerColor').value=state.header.color||'#e5e7eb';
    if(qs('#gradColor1')) qs('#gradColor1').value=state.header.grad1||'#6366f1';
    if(qs('#gradColor2')) qs('#gradColor2').value=state.header.grad2||'#ec4899';

    const bgSolidRow=qs('#bgSolidRow'), bgGradientRow=qs('#bgGradientRow'), bgPresetRow=qs('#bgPresetRow');
    if(bgSolidRow) bgSolidRow.classList.toggle('hidden-soft', state.header.bgType!=='solid');
    if(bgGradientRow) bgGradientRow.classList.toggle('hidden-soft', state.header.bgType!=='gradient');
    if(bgPresetRow) bgPresetRow.classList.toggle('hidden-soft', state.header.bgType!=='preset');

    location.hash='#criar';
    refreshHeader(); refreshButtonsUI();
  }catch(e){ console.error(e); }
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    if(!location.hash){ location.hash='#criar'; }
    initTheme(); setScreenFromHash();

    bindHeaderUI(); refreshHeader();
    bindButtonsUI(); refreshButtonsUI();
    bindIdentity();

    // Vitrine “Modelos Prontos” (aba separada)
    qsa('.model-card button').forEach(btn=>{
      btn.addEventListener('click', e=>{
        var card=e.currentTarget.closest('.model-card'); var modelName=card?card.getAttribute('data-model'):'';
        var model=presetModels[modelName];
        if(model){ state.buttons=model.map(b=>Object.assign({},b)); state.selectedIndex=-1; location.hash='#criar'; refreshButtonsUI(); }
      });
    });

    // Auth UI
    const u=await getCurrentUser(); setAuthUI(u);

    // Handlers auth (só se elementos existem)
    const up=qs('#btnSignUp'), si=qs('#btnSignIn'), so=qs('#btnSignOut');
    if(up) up.addEventListener('click', handleSignUp);
    if(si) si.addEventListener('click', handleSignIn);
    if(so) so.addEventListener('click', handleSignOut);
  }catch(e){
    console.error(e);
  }
});
window.addEventListener('hashchange', setScreenFromHash);
