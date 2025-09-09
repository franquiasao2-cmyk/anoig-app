/* ================== SUPABASE: INIT ================== */
const SUPABASE_URL = "https://tyhoonmssqxbtktiuwtd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aG9vbm1zc3F4YnRrdGl1d3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjg5MTgsImV4cCI6MjA3MzAwNDkxOH0.e-vVW5CSihmFlYGpvms0KLCrhqxdCqujJxhT6a-nBpI";
let supa = null;
function ensureSupa(){ if(!supa) supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON); return supa; }

/* ============ ESTADO BÁSICO E TEMA ============ */
const THEME_KEY = 'anoig-theme';
var assinaturaStatus = 'ativa';
var state = {
  slug: '',
  buttons: [],
  selectedIndex: -1,
  header: { title:'Título da Página', subtitle:'Subtítulo opcional', preset:'pattern1', color:'#e5e7eb' }
};

/* ============ UTILIDADES ============ */
function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function shade(hex, factor){ if(!hex) hex='#2b7a78'; if(typeof factor!=='number') factor=0.6; let c=hex.replace('#',''); if(c.length!==6) return hex; let n=parseInt(c,16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; let s=v=>Math.min(255,Math.max(0,Math.round(v*factor))); let out=(s(r)<<16)|(s(g)<<8)|s(b); let h=out.toString(16); while(h.length<6) h='0'+h; return '#'+h;}
function sanitizeSlug(s){ s=(s||'').toLowerCase(); s=s.normalize?s.normalize('NFD').replace(/[\u0300-\u036f]/g,''):s; s=s.replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); return s; }
function applyTheme(theme){ var t=(theme==='dark')?'dark':'light'; document.documentElement.setAttribute('data-theme',t); try{localStorage.setItem(THEME_KEY,t);}catch(e){} var sel=qs('#themeSelect'); if(sel) sel.value=t; }
function initTheme(){ var saved=null; try{ saved=localStorage.getItem(THEME_KEY);}catch(e){} applyTheme(saved||'light'); }
function fmtDate(iso){ try{ const d=new Date(iso); return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return '-';} }
function monthKey(iso){ const d=new Date(iso); return (d.getFullYear())+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function monthLabel(key){ const [y,m]=key.split('-'); const d=new Date(Number(y), Number(m)-1, 1); return d.toLocaleDateString('pt-BR',{month:'long', year:'numeric'}); }

/* ============ ABAS ============ */
function setScreenFromHash(){
  var hash=(location.hash||'').replace('#','')||'criar';
  qsa('.screen').forEach(s=>s.classList.add('hidden'));
  var el=qs('#view-'+hash); if(el) el.classList.remove('hidden');
  qsa('.tab').forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+hash));
  if(hash==='projetos'){ initProjectsView(); }
}

/* ============ MODELOS PRONTOS ============ */
var presetModels = {
  essencial: [
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0f172a', style:'solid', size:'md', radius:14, shadow:true },
    { label: 'Instagram', link: 'https://instagram.com/seucliente', color: '#E1306C', textColor:'#ffffff', style:'gradient', size:'md', radius:14, shadow:true },
    { label: 'Site', link: 'https://exemplo.com', color: '#2b7a78', textColor:'#0f172a', style:'outline', size:'md', radius:14, shadow:false }
  ],
  promo: [
    { label: 'Cupom -20%', link: 'https://exemplo.com/cupom', color: '#f59e0b', textColor:'#111827', style:'solid', size:'lg', radius:16, shadow:true },
    { label: 'Compre agora', link: 'https://loja.com/produto', color: '#ef4444', textColor:'#ffffff', style:'gradient', size:'md', radius:16, shadow:true },
    { label: 'WhatsApp Vendas', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0f172a', style:'glass', size:'md', radius:14, shadow:false }
  ],
  servicos: [
    { label: 'Agendar consulta', link: 'https://agenda.com', color: '#3b82f6', textColor:'#ffffff', style:'solid', size:'md', radius:14, shadow:true },
    { label: 'Orçamento', link: 'https://formulario.com', color: '#9333ea', textColor:'#ffffff', style:'outline', size:'md', radius:14, shadow:false },
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0f172a', style:'glass', size:'md', radius:14, shadow:false }
  ],
  restaurante: [
    { label: 'Cardápio', link: 'https://menu.delivery', color: '#ef4444', textColor:'#ffffff', style:'fantasy', size:'lg', radius:18, shadow:true },
    { label: 'Peça no iFood', link: 'https://ifood.com', color: '#f97316', textColor:'#111827', style:'solid', size:'md', radius:16, shadow:true },
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0f172a', style:'outline', size:'md', radius:14, shadow:false }
  ]
};

/* ============ AUTENTICAÇÃO ============ */
async function getCurrentUser(){ ensureSupa(); const { data:{ user } } = await supa.auth.getUser(); return user||null; }
function setAuthUI(user){
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
  const saveBtn=qs('#saveDraft'), pubBtn=qs('#publish'), hint=qs('#publishHint'); const signed=!!user;
  if(saveBtn) saveBtn.disabled=!signed;
  if(pubBtn)  pubBtn.disabled=!signed || (assinaturaStatus!=='ativa');
  if(hint){ if(!signed) hint.textContent='Faça login para salvar e publicar.'; else if(assinaturaStatus!=='ativa') hint.textContent='Assinatura inativa.'; else hint.textContent=''; }
  const meuEmail=qs('#meuEmail'); if(meuEmail) meuEmail.value=user?(user.email||''):'';
}
async function loadMyProfileIntoUI(){
  const user=await getCurrentUser(); if(!user) return;
  const { data, error } = await ensureSupa().from('profiles').select('*').eq('id',user.id).single();
  if(error) return;
  const nameInp=qs('#meuNome'); if(nameInp) nameInp.value=data.name||'';
  const themeSel=qs('#themeSelect'); if(themeSel&&data.theme){ applyTheme(data.theme); }
}
async function handleSignUp(){
  const email=(qs('#authEmailInput').value||'').trim();
  const pass=(qs('#authPassInput').value||'').trim();
  if(!email||!pass){ alert('Preencha e-mail e senha.'); return; }
  const { error } = await ensureSupa().auth.signUp({ email, password:pass });
  if(error){ alert('Erro no cadastro: '+error.message); return; }
  alert('Cadastro feito! Verifique seu e-mail se necessário.');
  const u=await getCurrentUser(); setAuthUI(u); loadMyProfileIntoUI();
}
async function handleSignIn(){
  const email=(qs('#authEmailInput').value||'').trim();
  const pass=(qs('#authPassInput').value||'').trim();
  if(!email||!pass){ alert('Preencha e-mail e senha.'); return; }
  const { error } = await ensureSupa().auth.signInWithPassword({ email, password:pass });
  if(error){ alert('Erro ao entrar: '+error.message); return; }
  alert('Bem-vindo!');
  const u=await getCurrentUser(); setAuthUI(u); loadMyProfileIntoUI(); if(location.hash==='#projetos') initProjectsView(true);
}
async function handleSignOut(){ await ensureSupa().auth.signOut(); setAuthUI(null); }

/* ============ PERFIL (tema/nome) ============ */
async function savePreferences(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para salvar.'); return; }
  const name=(qs('#meuNome').value||'').trim(); const theme=(qs('#themeSelect').value||'light'); applyTheme(theme);
  const { error } = await ensureSupa().from('profiles').update({ name, theme }).eq('id',user.id);
  if(error){ alert('Erro ao salvar perfil: '+error.message); return; }
  alert('Preferências salvas.');
}

/* ============ SALVAR / PUBLICAR ============ */
function validateDraft(opts){ opts=opts||{}; var errs=[]; if(!state.slug||state.slug.length<2) errs.push('Slug inválido.'); if(!state.header.title||state.header.title.replace(/\s+/g,'').length<2) errs.push('Título obrigatório.'); if(!Array.isArray(state.buttons)||state.buttons.length===0) errs.push('Crie ao menos 1 botão.'); state.buttons.forEach(function(b,i){ if(!b.label||!b.link) errs.push('Botão '+(i+1)+': texto e link são obrigatórios.'); if(b.link&&!/^https?:\/\//i.test(b.link)) errs.push('Botão '+(i+1)+': link deve começar com http(s)://'); }); if(errs.length){ if(!opts.silent) alert('Antes de salvar/publicar:\n\n- '+errs.join('\n- ')); return false; } return true; }

async function saveToDatabase(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para salvar.'); return; }
  if(!validateDraft()) return;
  const s=ensureSupa();
  // upsert page
  const base = { owner_id:user.id, slug:state.slug, title:state.header.title, subtitle:state.header.subtitle||null, header_preset:state.header.preset, header_color:state.header.color||'#e5e7eb', is_published:false, updated_at:new Date().toISOString() };
  let { data: ex, error: selErr } = await s.from('pages').select('id').eq('owner_id',user.id).eq('slug',state.slug).limit(1);
  if(selErr){ alert('Erro lendo página: '+selErr.message); return; }
  let pageId=null;
  if(ex && ex.length){ pageId=ex[0].id; const { error: upErr } = await s.from('pages').update(base).eq('id',pageId).eq('owner_id',user.id); if(upErr){ alert('Erro atualizando página: '+upErr.message); return; } }
  else { const { data: ins, error: insErr } = await s.from('pages').insert(base).select('id').single(); if(insErr){ alert('Erro criando página: '+insErr.message); return; } pageId=ins.id; }

  // replace buttons
  await s.from('buttons').delete().eq('page_id',pageId);
  const payload = state.buttons.map((b,idx)=>({ page_id:pageId, label:b.label, url:b.link, color:b.color||'#2b7a78', text_color:b.textColor||'#111827', style:b.style||'solid', size:b.size||'md', radius:b.radius??14, shadow:!!b.shadow, order_index:idx }));
  const { error: btnErr } = await s.from('buttons').insert(payload);
  if(btnErr){ alert('Erro salvando botões: '+btnErr.message); return; }
  alert('Rascunho salvo no banco!');
  // Atualiza lista de projetos (se estiver na aba)
  if(location.hash==='#projetos') initProjectsView(true);
}
async function publishPage(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para publicar.'); return; }
  if(assinaturaStatus!=='ativa'){ alert('Assinatura inativa.'); return; }
  if(!validateDraft()) return;
  await saveToDatabase();
  const s=ensureSupa();
  const { data: pg, error: selErr } = await s.from('pages').select('id').eq('owner_id',user.id).eq('slug',state.slug).single();
  if(selErr){ alert('Erro localizando página: '+selErr.message); return; }
  const { error: pubErr } = await s.from('pages').update({ is_published:true, published_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',pg.id).eq('owner_id',user.id);
  if(pubErr){ alert('Erro ao publicar: '+pubErr.message); return; }
  alert('Página publicada!');
  if(location.hash==='#projetos') initProjectsView(true);
}

/* ============ CARREGAR PROJETO PARA EDITAR ============ */
async function loadPageForEditing(pageId){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta.'); return; }
  const s=ensureSupa();
  const { data: page, error: pErr } = await s.from('pages').select('*').eq('id',pageId).eq('owner_id',user.id).single();
  if(pErr){ alert('Erro lendo página: '+pErr.message); return; }
  const { data: buttons, error: bErr } = await s.from('buttons').select('*').eq('page_id',pageId).order('order_index',{ascending:true});
  if(bErr){ alert('Erro lendo botões: '+bErr.message); return; }

  // Preenche state e UI
  state.slug=page.slug;
  state.header.title=page.title||'Título da Página';
  state.header.subtitle=page.subtitle||'';
  state.header.preset=page.header_preset||'pattern1';
  state.header.color=page.header_color||'#e5e7eb';
  state.buttons=(buttons||[]).map(b=>({
    label:b.label, link:b.url, color:b.color, textColor:b.text_color, style:b.style, size:b.size, radius:b.radius, shadow:b.shadow
  }));
  state.selectedIndex=-1;

  // Preenche formulários
  if(qs('#pageSlug')) qs('#pageSlug').value=state.slug;
  if(qs('#pageTitle')) qs('#pageTitle').value=state.header.title;
  if(qs('#pageSubtitle')) qs('#pageSubtitle').value=state.header.subtitle;
  if(qs('#headerPreset')) qs('#headerPreset').value=state.header.preset;
  if(qs('#headerColor')) qs('#headerColor').value=state.header.color;

  location.hash='#criar';
  refreshUI();
}

/* ============ PROJETOS (lista + filtros) ============ */
let _projectsCache = [];
async function fetchMyPages(){
  const user=await getCurrentUser(); if(!user) return [];
  const { data, error } = await ensureSupa().from('pages')
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

  // Ações
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

/* ============ UI DO EDITOR (igual base) ============ */
function bindEditor(){
  var addBtn=qs('#addBtn'), applyBtn=qs('#applyBtn'), deleteBtn=qs('#deleteBtn');
  var btnText=qs('#btnText'), btnLink=qs('#btnLink'), btnColor=qs('#btnColor'), btnTextColor=qs('#btnTextColor'), btnStyle=qs('#btnStyle'), btnSize=qs('#btnSize'), btnRadius=qs('#btnRadius'), btnShadow=qs('#btnShadow');
  var pageTitle=qs('#pageTitle'), pageSubtitle=qs('#pageSubtitle'), headerPreset=qs('#headerPreset'), headerColor=qs('#headerColor'), pageSlug=qs('#pageSlug');
  var saveDraftBtn=qs('#saveDraft'), publishBtn=qs('#publish'), copyLinkBtn=qs('#copyLink');

  if(addBtn){ addBtn.addEventListener('click', function(){ state.buttons.push({label:'Novo botão', link:'https://', color:'#2b7a78', textColor:'#111827', style:'solid', size:'md', radius:14, shadow:true}); state.selectedIndex=state.buttons.length-1; refreshUI(); }); }
  if(applyBtn){ applyBtn.addEventListener('click', function(){ if(state.selectedIndex<0) return; var b=state.buttons[state.selectedIndex]; b.label=btnText.value||'Botão'; b.link=btnLink.value||'https://'; b.color=btnColor.value||'#2b7a78'; b.textColor=btnTextColor.value||'#111827'; b.style=btnStyle.value||'solid'; b.size=btnSize.value||'md'; b.radius=Number(btnRadius.value||14); b.shadow=!!btnShadow.checked; refreshUI(); }); }
  if(deleteBtn){ deleteBtn.addEventListener('click', function(){ if(state.selectedIndex<0) return; state.buttons.splice(state.selectedIndex,1); state.selectedIndex=-1; refreshUI(); }); }
  if(pageTitle){ pageTitle.addEventListener('input', e=>{ state.header.title=e.target.value||'Título da Página'; refreshHeader(); }); }
  if(pageSubtitle){ pageSubtitle.addEventListener('input', e=>{ state.header.subtitle=e.target.value||''; refreshHeader(); }); }
  if(headerPreset){ headerPreset.addEventListener('change', e=>{ state.header.preset=e.target.value; refreshHeader(); }); }
  if(headerColor){ headerColor.addEventListener('input', e=>{ state.header.color=e.target.value; refreshHeader(); }); }
  if(pageSlug){ pageSlug.addEventListener('input', e=>{ state.slug=sanitizeSlug(e.target.value); }); }

  if(saveDraftBtn){ saveDraftBtn.addEventListener('click', saveToDatabase); }
  if(publishBtn){ publishBtn.addEventListener('click', publishPage); }
  if(copyLinkBtn){ copyLinkBtn.addEventListener('click', copyPublicLink); }

  var list=qs('#buttonsList'); if(list){ enableDragSort(list); }

  // Filtros projetos
  const fltStatus=qs('#fltStatus'), fltMonth=qs('#fltMonth'), btnReload=qs('#btnReloadProjects');
  if(fltStatus) fltStatus.addEventListener('change', ()=>renderProjects(_projectsCache));
  if(fltMonth)  fltMonth.addEventListener('change',  ()=>renderProjects(_projectsCache));
  if(btnReload) btnReload.addEventListener('click', ()=>initProjectsView(true));
}

function refreshUI(){
  var list=qs('#buttonsList');
  if(list){
    list.innerHTML='';
    state.buttons.forEach(function(b,idx){
      var li=document.createElement('li'); li.draggable=true;
      li.innerHTML='<div class="item-left"><span class="item-handle">≡</span><span>'+escapeHtml(b.label)+'</span></div><div class="item-actions"><button class="btn small">Editar</button></div>';
      li.querySelector('.btn').addEventListener('click', function(){ state.selectedIndex=idx; loadToForm(); });
      li.setAttribute('data-index', String(idx));
      list.appendChild(li);
    });
  }
  var pv=qs('#pvButtons');
  if(pv){
    pv.innerHTML='';
    state.buttons.forEach(function(b){
      var a=document.createElement('a');
      a.className='card-btn'; a.href=b.link||'#'; a.target='_blank'; a.style.borderRadius=(b.radius||14)+'px';
      a.setAttribute('data-style', b.style||'solid'); a.setAttribute('data-size', b.size||'md'); a.setAttribute('data-shadow', b.shadow?'true':'false');
      a.style.setProperty('--grad-a', b.color||'#2b7a78'); a.style.setProperty('--grad-b', shade(b.color||'#2b7a78',0.6));
      if(b.style==='solid'){ a.style.background=b.color||'#2b7a78'; a.style.border='0'; }
      else if(b.style==='outline'){ a.style.background='transparent'; }
      a.innerHTML='<div class="card-inner"><div class="card-icon" style="background:'+ (b.color||'#2b7a78') +'"></div><div class="card-label" style="color:'+ (b.textColor||'#111827') +'">'+escapeHtml(b.label)+'</div></div>';
      pv.appendChild(a);
    });
  }
  loadToForm(); refreshHeader();
}
function loadToForm(){
  var i=state.selectedIndex;
  var btnText=qs('#btnText'), btnLink=qs('#btnLink'), btnColor=qs('#btnColor'), btnTextColor=qs('#btnTextColor'), btnStyle=qs('#btnStyle'), btnSize=qs('#btnSize'), btnRadius=qs('#btnRadius'), btnShadow=qs('#btnShadow');
  if(i<0 || !state.buttons[i]){
    if(btnText) btnText.value=''; if(btnLink) btnLink.value=''; if(btnColor) btnColor.value='#2b7a78'; if(btnTextColor) btnTextColor.value='#111827'; if(btnStyle) btnStyle.value='solid'; if(btnSize) btnSize.value='md'; if(btnRadius) btnRadius.value=14; if(btnShadow) btnShadow.checked=true; return;
  }
  var b=state.buttons[i];
  if(btnText) btnText.value=b.label||''; if(btnLink) btnLink.value=b.link||''; if(btnColor) btnColor.value=b.color||'#2b7a78'; if(btnTextColor) btnTextColor.value=b.textColor||'#111827'; if(btnStyle) btnStyle.value=b.style||'solid'; if(btnSize) btnSize.value=b.size||'md'; if(btnRadius) btnRadius.value=(typeof b.radius==='number')?b.radius:14; if(btnShadow) btnShadow.checked=!!b.shadow;
}
function refreshHeader(){
  var header=qs('#phoneHeader'); var t=qs('#pvTitle'); var s=qs('#pvSubtitle');
  if(t) t.textContent=state.header.title||'Título da Página';
  if(s) s.textContent=state.header.subtitle||'';
  if(header){
    if(state.header.preset==='solid'){ header.style.background=state.header.color||'#e5e7eb'; }
    else if(state.header.preset==='pattern2'){ header.style.background='linear-gradient(135deg,#cbd5e1,#94a3b8)'; }
    else { header.style.background='var(--phone-header-default)'; }
  }
}
function enableDragSort(list){
  var dragEl=null;
  list.addEventListener('dragstart', function(e){ dragEl=e.target.closest('li'); if(e.dataTransfer) e.dataTransfer.effectAllowed='move'; });
  list.addEventListener('dragover', function(e){ e.preventDefault(); var li=e.target.closest('li'); if(!li||li===dragEl) return; var rect=li.getBoundingClientRect(); var next=(e.clientY-rect.top)/rect.height>0.5; list.insertBefore(dragEl, next?li.nextSibling:li); });
  list.addEventListener('drop', function(){ var items=Array.prototype.slice.call(list.querySelectorAll('li')); var newOrder=items.map(li=>state.buttons[Number(li.getAttribute('data-index'))]); state.buttons=newOrder; state.selectedIndex=-1; refreshUI(); });
}
function copyPublicLink(){
  if(!state.slug){ alert('Defina o slug antes (ex.: "lucyana").'); return; }
  var url=location.origin + '/page.html#' + state.slug;
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(url).then(()=>alert('Link copiado:\n'+url),()=>window.prompt('Copie o link:', url)); }
  else { window.prompt('Copie o link:', url); }
}

/* ============ INICIALIZAÇÃO ============ */
document.addEventListener('DOMContentLoaded', async ()=>{
  if(!location.hash){ location.hash='#criar'; }
  initTheme(); bindEditor(); setScreenFromHash();

  // Modelos
  qsa('.model-card button').forEach(btn=>{
    btn.addEventListener('click', e=>{
      var card=e.currentTarget.closest('.model-card'); var modelName=card?card.getAttribute('data-model'):''; var model=presetModels[modelName];
      if(model){ state.buttons=model.map(b=>Object.assign({},b)); state.selectedIndex=-1; location.hash='#criar'; refreshUI(); }
    });
  });

  // Auth
  ensureSupa();
  const u=await getCurrentUser(); setAuthUI(u); if(u) loadMyProfileIntoUI();

  qs('#btnSignUp').addEventListener('click', handleSignUp);
  qs('#btnSignIn').addEventListener('click', handleSignIn);
  qs('#btnSignOut').addEventListener('click', handleSignOut);

  qs('#savePrefs').addEventListener('click', savePreferences);

  // Barra de teste
  const btnInit=qs('#btnInitSupa'), btnTest=qs('#btnTestSupa');
  if(btnInit && btnTest){
    btnInit.addEventListener('click', ()=>{ alert('O cliente já está inicializado neste build. Use "Testar conexão".'); btnTest.disabled=false; });
    btnTest.addEventListener('click', async ()=>{ try{ const { data, error } = await ensureSupa().from('profiles').select('*').limit(1); if(error) alert('Erro: '+error.message); else alert('Conectado! Retorno da tabela profiles: '+data.length+' registro(s).'); }catch(e){ alert('Falha: '+e.message); } });
  }
});
window.addEventListener('hashchange', setScreenFromHash);
