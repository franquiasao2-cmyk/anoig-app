/* ===== Boot ===== */
__devlog && __devlog('boot: iniciando app.js');

const SUPABASE_URL = "https://tyhoonmssqxbtktiuwtd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5aG9vbm1zc3F4YnRrdGl1d3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjg5MTgsImV4cCI6MjA3MzAwNDkxOH0.e-vVW5CSihmFlYGpvms0KLCrhqxdCqujJxhT6a-nBpI";

if (typeof supabase === "undefined") {
  console.error("Supabase SDK nÃ£o carregou. Confira a <script src='@supabase/supabase-js@2'> no index.html");
}
let supa = typeof supabase !== "undefined" ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON) : null;

const THEME_KEY = 'anoig-theme';
var assinaturaStatus = 'ativa';

var state = {
  header: {
    title: 'TÃ­tulo da PÃ¡gina',
    titleColor: '#111827',
    titleFont: 'Inter, Arial, sans-serif',
    subtitle: 'SubtÃ­tulo opcional',
    subtitleColor: '#4b5563',
    bgType: 'solid',
    color: '#e5e7eb',
    grad1: '#6366f1',
    grad2: '#ec4899',
    preset: 'pattern1',
    logoDataUrl: ''
  },
  buttons: [],
  selectedIndex: -1,
  slug: ''
};

function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function escapeHtml(s){
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(s || '').replace(/[&<>"']/g, ch => map[ch]);
}
// Loading overlay helpers (expects #loadingOverlay in DOM)
function showLoading(){ var el=qs('#loadingOverlay'); if(el) el.classList.remove('hidden-soft'); }
function hideLoading(){ var el=qs('#loadingOverlay'); if(el) el.classList.add('hidden-soft'); }
function sanitizeSlug (s){
  s=(s||'').toLowerCase();
  if(s.normalize) s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  s=s.replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  return s;
}

function applyTheme(theme){
  var t=(theme==='dark')?'dark':'light';
  document.documentElement.setAttribute('data-theme',t);
  try{ localStorage.setItem(THEME_KEY,t); }catch(e){}
  var sel=qs('#themeSelect'); if(sel) sel.value=t;
}

function initTheme(){
  var saved=null; try{ saved=localStorage.getItem(THEME_KEY);}catch(e){}
  applyTheme(saved||'light');
}

function setScreenFromHash(){
  var hash=(location.hash||'').replace('#','')||'criar';
  __devlog && __devlog('nav:', hash);
  qsa('.screen').forEach(s=>s.classList.add('hidden'));
  var el=qs('#view-'+hash); if(el) el.classList.remove('hidden');
  qsa('.tab').forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+hash));
  if(hash==='projetos'){ initProjectsView(); }
}

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
    { label:'OrÃ§amento', link:'https://formulario.com', color:'#9333ea', textColor:'#ffffff', size:'md', radius:14, shadow:false }
  ],
  restaurante: [
    { label:'CardÃ¡pio', link:'https://menu.delivery', color:'#ef4444', textColor:'#ffffff', size:'lg', radius:18, shadow:true },
    { label:'PeÃ§a no iFood', link:'https://ifood.com', color:'#f97316', textColor:'#111827', size:'md', radius:16, shadow:true }
  ]
};

async function getCurrentUser(){
  if(!supa) return null;
  const { data:{ user } = { user:null } } = await supa.auth.getUser();
  return user||null;
}

function setAuthUI(user){
  __devlog && __devlog('auth ui:', !!user);
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
    if(!signed) hint.textContent='FaÃ§a login para salvar e publicar.';
    else if(assinaturaStatus!=='ativa') hint.textContent='Assinatura inativa.';
    else hint.textContent='';
  }
  const meuEmail=qs('#meuEmail'); if(meuEmail) meuEmail.value=user?(user.email||''):'';
  // Status de verificação de e-mail
  const emailStatus=qs('#emailStatus'); const resendBtn=qs('#resendConfirm');
  const isVerified = !!(user && (user.email_confirmed_at || user.confirmed_at));
  if(emailStatus){ emailStatus.textContent = isVerified ? 'E-mail verificado.' : 'E-mail não verificado.'; }
  if(resendBtn){ resendBtn.style.display = isVerified ? 'none' : 'inline-block'; }
  const verifyBanner=qs('#verifyBanner'); if(verifyBanner){ verifyBanner.classList.toggle('hidden-soft', isVerified); }
  // Preenche campos do perfil (Meus Dados)
  const meta = (user && user.user_metadata) || {};
  const meuNome=qs('#meuNome'); if(meuNome) meuNome.value = meta.full_name || '';
  const meuWhats=qs('#meuWhatsapp'); if(meuWhats) meuWhats.value = meta.whatsapp || '';
  const meuEnd=qs('#meuEndereco'); if(meuEnd) meuEnd.value = meta.address || '';
  // Avatar e nome no header
  const avatarUrl = meta.avatar_url || '';
  const avPrev = qs('#userAvatarPreview'); if(avPrev){ avPrev.innerHTML = avatarUrl?('<img src="'+escapeHtml(avatarUrl)+'" alt="avatar">'):'<span>+</span>'; }
  const brandAv = qs('#brandUserAvatar'); if(brandAv){ brandAv.innerHTML = avatarUrl?('<img src="'+escapeHtml(avatarUrl)+'" alt="avatar">'):'<span style="font-size:.9em">+</span>'; }
  const first = (meta.full_name||'').trim().split(/\s+/)[0]||''; const brandNm = qs('#brandUserName'); if(brandNm) brandNm.textContent = first;
  // Status + plano
  const status = (meta.status || assinaturaStatus || 'ativa');
  const plan = (meta.plan || 'mensal');
  const badge = qs('#assStatusBadge'); if(badge){ badge.textContent = status==='ativa'?'Ativo':'Inativo'; badge.classList.toggle('ok', status==='ativa'); badge.classList.toggle('off', status!=='ativa'); }
  const planLine = qs('#assPlanLine'); const planText = qs('#assPlanText'); const upBtn = qs('#btnUpgradeRecorrente');
  if(planLine){ planLine.classList.toggle('hidden-soft', status!=='ativa'); }
  if(planText){ planText.textContent = plan==='recorrente'?'Recorrente':'Mensal'; }
  if(upBtn){ upBtn.classList.toggle('hidden-soft', !(status==='ativa' && plan!=='recorrente')); }
}

/* ---------- Header (Etapa 1) ---------- */
function bindHeaderUI(){
  __devlog && __devlog('bindHeaderUI');
  const title=qs('#pageTitle'), subtitle=qs('#pageSubtitle');
  const titleColor=qs('#titleColor'), subtitleColor=qs('#subtitleColor');
  const titleFont=qs('#titleFont'), titleFontSample=qs('#titleFontSample');
  const bgType=qs('#headerBgType'), headerColor=qs('#headerColor');
  const grad1=qs('#gradColor1'), grad2=qs('#gradColor2');
  const bgSolidRow=qs('#bgSolidRow'), bgGradientRow=qs('#bgGradientRow'), bgPresetRow=qs('#bgPresetRow');
  const goButtons=qs('#goButtons');
  const logoInput=qs('#logoInput');

  title && title.addEventListener('input', e=>{ state.header.title=e.target.value||'TÃ­tulo da PÃ¡gina'; refreshHeader(); });
  subtitle && subtitle.addEventListener('input', e=>{ state.header.subtitle=e.target.value||''; refreshHeader(); });

  titleColor && titleColor.addEventListener('input', e=>{ state.header.titleColor=e.target.value||'#111827'; refreshHeader(); });
  subtitleColor && subtitleColor.addEventListener('input', e=>{ state.header.subtitleColor=e.target.value||'#4b5563'; refreshHeader(); });

  if(titleFont){
    titleFont.addEventListener('change', e=>{
      state.header.titleFont=e.target.value;
      if(titleFontSample) titleFontSample.style.fontFamily=state.header.titleFont;
      refreshHeader();
    });
    if(titleFontSample) titleFontSample.style.fontFamily=state.header.titleFont;
  }

  bgType && bgType.addEventListener('change', ()=>{
    state.header.bgType=bgType.value;
    bgSolidRow && bgSolidRow.classList.toggle('hidden', state.header.bgType!=='solid');
    bgGradientRow && bgGradientRow.classList.toggle('hidden', state.header.bgType!=='gradient');
    bgPresetRow && bgPresetRow.classList.toggle('hidden', state.header.bgType!=='preset');
    refreshHeader();
  });

  headerColor && headerColor.addEventListener('input', e=>{ state.header.color=e.target.value||'#e5e7eb'; refreshHeader(); });
  grad1 && grad1.addEventListener('input', e=>{ state.header.grad1=e.target.value||'#6366f1'; refreshHeader(); });
  grad2 && grad2.addEventListener('input', e=>{ state.header.grad2=e.target.value||'#ec4899'; refreshHeader(); });

  const presetsGrid = qs('#headerPresetsGrid');
  presetsGrid && presetsGrid.addEventListener('click', e=>{
    const card = e.target.closest('.model-card'); if(!card) return;
    const preset = card.getAttribute('data-hpreset');
    state.header.preset = preset || 'pattern1';
    refreshHeader();
  });

  logoInput && logoInput.addEventListener('change', ()=>{
    const f=logoInput.files && logoInput.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload = ()=>{ state.header.logoDataUrl = String(r.result); refreshHeader(); };
    r.readAsDataURL(f);
  });

  goButtons && goButtons.addEventListener('click', ()=>{
    const wrap=qs('#createNewWrap'); wrap && wrap.classList.remove('hidden-soft');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function refreshHeader(){
  const header=qs('#phoneHeader'); const t=qs('#pvTitle'); const s=qs('#pvSubtitle');
  const avatar=qs('#avatarBox');

  if(t){ t.textContent=state.header.title||'TÃ­tulo da PÃ¡gina'; t.style.color=state.header.titleColor||'#111827'; t.style.fontFamily=state.header.titleFont; }
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
}

/* ---------- BotÃµes (Etapa 2) ---------- */
function bindButtonsUI(){
  __devlog && __devlog('bindButtonsUI');
  const optCreateNew=qs('#optCreateNew');
  const optUseModel=qs('#optUseModel');
  const createNewWrap=qs('#createNewWrap');
  const useModelWrap=qs('#useModelWrap');
  const addBtn=qs('#addBtn'), applyBtn=qs('#applyBtn'), deleteBtn=qs('#deleteBtn');
  const btnText=qs('#btnText'), btnLink=qs('#btnLink');
  const btnColor=qs('#btnColor'), btnTextColor=qs('#btnTextColor');
  const btnSize=qs('#btnSize'), btnRadius=qs('#btnRadius'), btnShadow=qs('#btnShadow');

  optCreateNew && optCreateNew.addEventListener('click', ()=>{
    createNewWrap && createNewWrap.classList.remove('hidden-soft');
    useModelWrap && useModelWrap.classList.add('hidden-soft');
  });
  optUseModel && optUseModel.addEventListener('click', ()=>{
    useModelWrap && useModelWrap.classList.remove('hidden-soft');
    createNewWrap && createNewWrap.classList.add('hidden-soft');
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
            size:m.size||'md', radius: (typeof m.radius==='number'?m.radius:14), shadow: !!m.shadow
          });
          state.selectedIndex = state.buttons.length-1;
          refreshButtonsUI();
        });
        grid.appendChild(card);
      });
    });
  }

  addBtn && addBtn.addEventListener('click', ()=>{
    const b = {
      label: (btnText?.value||'Novo botÃ£o'),
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

  applyBtn && applyBtn.addEventListener('click', ()=>{
    if(state.selectedIndex<0 || !state.buttons[state.selectedIndex]) return;
    const b=state.buttons[state.selectedIndex];
    b.label = btnText?.value||'BotÃ£o';
    b.link  = btnLink?.value||'https://';
    b.color = btnColor?.value||'#2b7a78';
    b.textColor = btnTextColor?.value||'#ffffff';
    b.size  = btnSize?.value||'md';
    b.radius= Number(btnRadius?.value||14);
    b.shadow= !!(btnShadow?.checked);
    refreshButtonsUI();
  });

  deleteBtn && deleteBtn.addEventListener('click', ()=>{
    if(state.selectedIndex<0) return;
    state.buttons.splice(state.selectedIndex,1);
    state.selectedIndex=-1;
    refreshButtonsUI();
  });

  const list = qs('#buttonsList'); if(list){ enableDragSort(list); }
}

function refreshButtonsUI(){
  var list=qs('#buttonsList');
  if(list){
    list.innerHTML='';
    state.buttons.forEach(function(b,idx){
      var li=document.createElement('li'); li.draggable=true;
      li.innerHTML='<div class="item-left"><span class="item-handle">â‰¡</span><span>'+escapeHtml(b.label)+'</span></div><div class="item-actions"><button class="btn small">Editar</button></div>';
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
}

function loadButtonToForm(){
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

/* ---------- Identidade & PublicaÃ§Ã£o (Etapa 3) ---------- */
function bindIdentity(){
  __devlog && __devlog('bindIdentity');
  const pageSlug=qs('#pageSlug');
  const saveDraftBtn=qs('#saveDraft'), publishBtn=qs('#publish'), copyLinkBtn=qs('#copyLink');

  pageSlug && pageSlug.addEventListener('input', e=>{ state.slug = sanitizeSlug(e.target.value); });
  saveDraftBtn && saveDraftBtn.addEventListener('click', saveToDatabase);
  publishBtn && publishBtn.addEventListener('click', publishPage);
  copyLinkBtn && copyLinkBtn.addEventListener('click', copyPublicLink);
}

function validateDraft(){
  var errs=[];
  if(!state.header.title||state.header.title.replace(/\s+/g,'').length<2) errs.push('TÃ­tulo obrigatÃ³rio.');
  if(!Array.isArray(state.buttons)||state.buttons.length===0) errs.push('Crie ao menos 1 botÃ£o.');
  if(!state.slug||state.slug.length<2) errs.push('Escolha o link (slug) invÃ¡lido.');
  state.buttons.forEach(function(b,i){
    if(!b.label||!b.link) errs.push('BotÃ£o '+(i+1)+': texto e link sÃ£o obrigatÃ³rios.');
    if(b.link&&!/^https?:\/\//i.test(b.link)) errs.push('BotÃ£o '+(i+1)+': link deve comeÃ§ar com http(s)://');
  });
  if(errs.length){ alert('Antes de salvar/publicar:\n\n- '+errs.join('\n- ')); return false; }
  return true;
}


// Salva uma cópia pública mínima no localStorage
function savePublicToLocal(){
  try{
    const data={
      header:{
        title: state.header.title,
        subtitle: state.header.subtitle||'',
        bgType: state.header.bgType||'solid',
        color: state.header.color||'#1f2937',
        grad1: state.header.grad1||'#6366f1',
        grad2: state.header.grad2||'#ec4899',
        preset: state.header.preset||'pattern1'
      },
      buttons: (state.buttons||[]).map(b=>({
        label: b.label,
        link: b.link,
        color: b.color||'#2b7a78',
        textColor: b.textColor||'#ffffff',
        size: b.size||'md',
        radius: (typeof b.radius==='number'?b.radius:14),
        shadow: !!b.shadow
      }))
    };
    localStorage.setItem('anoig-public-'+state.slug, JSON.stringify(data));
  }catch(e){
    console.warn('Falha ao salvar público local', e);
  }
}
async function saveToDatabase(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para salvar.'); return; }
  if(!supa){ alert('Supabase indisponÃ­vel'); return; }
  if(!validateDraft()) return;

  __devlog && __devlog('db: salvar rascunho');

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
  if(selErr){ console.error(selErr); alert('Erro lendo pÃ¡gina: '+selErr.message); return; }
  let pageId=null;
  if(ex && ex.length){
    pageId=ex[0].id;
    const { error: upErr } = await supa.from('pages').update(base).eq('id',pageId).eq('owner_id',user.id);
    if(upErr){ console.error(upErr); alert('Erro atualizando pÃ¡gina: '+upErr.message); return; }
  } else {
    const { data: ins, error: insErr } = await supa.from('pages').insert(base).select('id').single();
    if(insErr){ console.error(insErr); alert('Erro criando pÃ¡gina: '+insErr.message); return; }
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
  if(btnErr){ console.error(btnErr); alert('Erro salvando botÃµes: '+btnErr.message); return; }

  alert('Rascunho salvo no banco!');
}

async function publishPage(){
  const user=await getCurrentUser(); if(!user){ alert('Entre na conta para publicar.'); return; }
  if(!(user.email_confirmed_at||user.confirmed_at)){ alert('Confirme seu e-mail antes de publicar.'); return; }
  if(assinaturaStatus!=='ativa'){ alert('Assinatura inativa.'); return; }
  if(!supa){ alert('Supabase indisponÃ­vel'); return; }
  if(!validateDraft()) return;

  __devlog && __devlog('db: publicar');

  await saveToDatabase();
  const { data: pg, error: selErr } = await supa.from('pages').select('id').eq('owner_id',user.id).eq('slug',state.slug).single();
  if(selErr){ console.error(selErr); alert('Erro localizando pÃ¡gina: '+selErr.message); return; }
  const { error: pubErr } = await supa.from('pages').update({ is_published:true, published_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',pg.id).eq('owner_id',user.id);
  if(pubErr){ console.error(pubErr); alert('Erro ao publicar: '+pubErr.message); return; }
  try{ savePublicToLocal(); }catch(_){ }
  alert('PÃ¡gina publicada!');
}

function copyPublicLink(){
  if(!state.slug){ alert('Defina â€œEscolha o linkâ€ antes.'); return; }
  var url=location.origin + '/page.html#' + state.slug;
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(url).then(()=>alert('Link copiado:\n'+url),()=>window.prompt('Copie o link:', url)); }
  else { window.prompt('Copie o link:', url); }
}

/* ---------- Projetos ---------- */
let _projectsCache = [];
async function fetchMyPages(){
  const user=await getCurrentUser(); if(!user || !supa) return [];
  const { data, error } = await supa.from('pages')
    .select('id, slug, title, is_published, created_at, updated_at, published_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending:false });
  if(error){ console.error(error); alert('Erro ao carregar projetos: '+error.message); return []; }
  return data||[];
}
function monthKey(iso){ const d=new Date(iso); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function monthLabel(key){ const [y,m]=key.split('-'); const d=new Date(Number(y), Number(m)-1, 1); return d.toLocaleDateString('pt-BR',{month:'long', year:'numeric'}); }
function fmtDate(iso){ try{ const d=new Date(iso); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return '-';} }

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
    const pubInfo = p.is_published ? `â€¢ publicado em ${fmtDate(p.published_at)}` : '';
    card.innerHTML = `
      <div class="proj-top">
        <div class="proj-title">${escapeHtml(p.title||'(sem tÃ­tulo)')}</div>
        ${badge}
      </div>
      <div class="small-muted">Slug: <code>${escapeHtml(p.slug)}</code> â€¢ atualizado em ${fmtDate(p.updated_at||p.created_at)} ${pubInfo}</div>
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
  if(!user){ alert('FaÃ§a login para ver seus projetos.'); return; }
  if(forceRefresh || !_projectsCache.length){ _projectsCache = await fetchMyPages(); }
  populateMonthFilter(_projectsCache);
  renderProjects(_projectsCache);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async ()=>{
  __devlog && __devlog('dom: carregado');

  // Exigir autenticação: se não logado, enviar para a página de login
  try {
    const u0 = await getCurrentUser();
    if(!u0){ location.href = 'login.html'; return; }
  } catch(_) { /* se falhar, continua */ }

  if(!location.hash){ location.hash='#criar'; }
  initTheme();
  setScreenFromHash();

  // Garante navegação por abas com feedback visual de carregamento
  try {
    qsa('.tabs a.tab').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const h = a.getAttribute('href') || '#criar';
        showLoading();
        const apply = ()=>{ setScreenFromHash(); setTimeout(hideLoading, 200); };
        if(location.hash !== h) {
          location.hash = h;
          setTimeout(apply, 10);
        } else {
          apply();
        }
      });
    });
  } catch(_) {}

  // Limpa o parâmetro ?authed=1 da URL após autenticação
  try {
    if(location.search && /(?:^|[?&])authed=1(?:&|$)/.test(location.search)){
      history.replaceState(null, '', location.pathname + (location.hash||''));
    }
  } catch(_) {}

  try { bindHeaderUI(); refreshHeader(); } catch(e){ console.error(e); __devlog && __devlog('FALHOU EM: bindHeaderUI'); }
  try { bindButtonsUI(); refreshButtonsUI(); } catch(e){ console.error(e); __devlog && __devlog('FALHOU EM: bindButtonsUI'); }
  
  try { bindAccountPrefs(); } catch(e){ console.error(e); __devlog && __devlog('FALHOU EM: bindAccountPrefs'); }

  // Vitrine da aba Modelos (se existir)
  qsa('.model-card button').forEach(btn=>{
    btn.addEventListener('click', e=>{
      var card=e.currentTarget.closest('.model-card'); var modelName=card?card.getAttribute('data-model'):'';
      var model=presetModels[modelName];
      if(model){ state.buttons=model.map(b=>Object.assign({},b)); state.selectedIndex=-1; location.hash='#criar'; refreshButtonsUI(); }
    });
  });

  // Auth
  try {
    const u=await getCurrentUser(); setAuthUI(u); enforcePublishGuard(u);
    const up=qs('#btnSignUp'), si=qs('#btnSignIn'), so=qs('#btnSignOut');
    // Direciona para páginas dedicadas de auth
    up && up.addEventListener('click', ()=>{ location.href='signup.html'; });
    si && si.addEventListener('click', ()=>{ location.href='login.html'; });
    so && so.addEventListener('click', handleSignOut);
  } catch(e){ console.error(e); __devlog && __devlog('FALHOU EM: auth init'); }
});

window.addEventListener('hashchange', ()=>{ try{ showLoading(); }catch(_){ } setScreenFromHash(); setTimeout(()=>{ try{ hideLoading(); }catch(_){ } }, 200); });

// Garante regras para publicar (login, assinatura, e-mail verificado)
function enforcePublishGuard(user){
  const pubBtn=qs('#publish'), hint=qs('#publishHint');
  const verifyBanner=qs('#verifyBanner');
  const resendBtn=qs('#resendConfirm');
  const emailStatus=qs('#emailStatus');
  const signed=!!user;
  const isVerified = !!(user && (user.email_confirmed_at || user.confirmed_at));
  if(pubBtn) pubBtn.disabled = !signed || (assinaturaStatus!=='ativa') || !isVerified;
  if(hint){
    if(!signed) hint.textContent='Faça login para salvar e publicar.';
    else if(assinaturaStatus!=='ativa') hint.textContent='Assinatura inativa.';
    else if(!isVerified) hint.textContent='Confirme seu e-mail para publicar.';
    else hint.textContent='';
  }
  if(verifyBanner) verifyBanner.classList.toggle('hidden-soft', isVerified);
  if(resendBtn) resendBtn.style.display = isVerified ? 'none' : 'inline-block';
  if(emailStatus) emailStatus.textContent = isVerified ? 'E-mail verificado.' : 'E-mail não verificado.';
}

/* ---------- Preferências / Dados ---------- */
function bindAccountPrefs(){
  __devlog && __devlog('bindAccountPrefs');
  const themeSel = qs('#themeSelect');
  const saveBtn = qs('#savePrefs');
  const resendBtn = qs('#resendConfirm');
  const avatarFile = qs('#userAvatarFile');
  const upBtn = qs('#btnUpgradeRecorrente');
  if(themeSel){ themeSel.addEventListener('change', ()=> applyTheme(themeSel.value)); }
  if(saveBtn){
    saveBtn.addEventListener('click', async ()=>{
      try{
        if(themeSel) applyTheme(themeSel.value);
        const full_name = (qs('#meuNome')?.value||'').trim();
        const whatsapp  = (qs('#meuWhatsapp')?.value||'').trim();
        const address   = (qs('#meuEndereco')?.value||'').trim();
        // preserva status/plan/avatar existentes
        const user=await getCurrentUser();
        const meta=(user&&user.user_metadata)||{};
        const avatar_url = (qs('#userAvatarPreview')?.querySelector('img')?.getAttribute('src')) || meta.avatar_url || '';
        const status = meta.status || assinaturaStatus || 'ativa';
        const plan = meta.plan || 'mensal';
        if(supa){
          const { error } = await supa.auth.updateUser({ data: { full_name, whatsapp, address, avatar_url, status, plan } });
          if(error){ alert('Erro ao salvar dados: '+error.message); return; }
        }
        alert('Preferências salvas.');
      }catch(e){ console.error(e); alert('Falha ao salvar preferências.'); }
    });
  }
  if(avatarFile){
    avatarFile.addEventListener('change', ()=>{
      const f=avatarFile.files&&avatarFile.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=async()=>{
        const dataUrl=String(r.result||'');
        const prev=qs('#userAvatarPreview'); if(prev){ prev.innerHTML='<img src="'+escapeHtml(dataUrl)+'" alt="avatar">'; }
        const brandAv=qs('#brandUserAvatar'); if(brandAv){ brandAv.innerHTML='<img src="'+escapeHtml(dataUrl)+'" alt="avatar">'; }
        if(supa){ const { error } = await supa.auth.updateUser({ data: { avatar_url: dataUrl } }); if(error){ alert('Erro ao atualizar foto: '+error.message); } }
      };
      r.readAsDataURL(f);
    });
  }
  if(upBtn){
    upBtn.addEventListener('click', async ()=>{
      try{
        if(!supa){ alert('Indisponível no momento.'); return; }
        const { error } = await supa.auth.updateUser({ data: { plan: 'recorrente', status: 'ativa' } });
        if(error){ alert('Erro ao atualizar plano: '+error.message); return; }
        const planText=qs('#assPlanText'); if(planText) planText.textContent='Recorrente';
        upBtn.classList.add('hidden-soft');
        alert('Plano atualizado para recorrente!');
      }catch(e){ console.error(e); alert('Falha ao atualizar plano.'); }
    });
  }
  const resendTopBtn = qs('#resendConfirmTop');
  if(resendTopBtn){
    resendTopBtn.addEventListener('click', async ()=>{
      try{
        resendTopBtn.disabled = true;
        const u = await getCurrentUser();
        const email = u && u.email;
        if(!email){ alert('Faça login novamente.'); return; }
        if(!supa || !supa.auth || typeof supa.auth.resend !== 'function'){
          alert('Reenvio de confirmação indisponível no momento.'); return;
        }
        const { error } = await supa.auth.resend({ type:'signup', email });
        if(error){ alert('Erro ao reenviar: '+error.message); return; }
        alert('Enviamos um novo e-mail de confirmação.');
      } catch(e){ console.error(e); alert('Falha ao reenviar.'); }
      finally { resendTopBtn.disabled = false; }
    });
  }
  if(resendBtn){
    resendBtn.addEventListener('click', async ()=>{
      try{
        resendBtn.disabled = true;
        const u = await getCurrentUser();
        const email = u && u.email;
        if(!email){ alert('Faça login novamente.'); return; }
        if(!supa || !supa.auth || typeof supa.auth.resend !== 'function'){
          alert('Reenvio de confirmação indisponível no momento.'); return;
        }
        const { error } = await supa.auth.resend({ type:'signup', email });
        if(error){ alert('Erro ao reenviar: '+error.message); return; }
        alert('Enviamos um novo e-mail de confirmação.');
      } catch(e){ console.error(e); alert('Falha ao reenviar.'); }
      finally { resendBtn.disabled = false; }
    });
  }
}

// Handlers mínimos de autenticação no app principal
async function handleSignOut(){
  try {
    showLoading();
    if(supa) await supa.auth.signOut();
  } catch(_) {}
  location.href='login.html';
}











