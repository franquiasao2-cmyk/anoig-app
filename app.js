// Simulação de status da assinatura
let assinaturaStatus = 'ativa';

// Estado do editor
const state = {
  slug: '',
  buttons: [],
  selectedIndex: -1,
  header: {
    title: 'Título da Página',
    subtitle: 'Subtítulo opcional',
    preset: 'pattern1',
    color: '#1f2937'
  }
};

// Modelos prontos (exemplos)
const presetModels = {
  essencial: [
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#ffffff', style:'solid', size:'md', radius:14, shadow:true },
    { label: 'Instagram', link: 'https://instagram.com/seucliente', color: '#E1306C', textColor:'#ffffff', style:'gradient', size:'md', radius:14, shadow:true },
    { label: 'Site', link: 'https://exemplo.com', color: '#2b7a78', textColor:'#ffffff', style:'outline', size:'md', radius:14, shadow:false }
  ],
  promo: [
    { label: 'Cupom -20%', link: 'https://exemplo.com/cupom', color: '#f59e0b', textColor:'#0b1220', style:'solid', size:'lg', radius:16, shadow:true },
    { label: 'Compre agora', link: 'https://loja.com/produto', color: '#ef4444', textColor:'#ffffff', style:'gradient', size:'md', radius:16, shadow:true },
    { label: 'WhatsApp Vendas', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0b1220', style:'glass', size:'md', radius:14, shadow:false }
  ],
  servicos: [
    { label: 'Agendar consulta', link: 'https://agenda.com', color: '#3b82f6', textColor:'#ffffff', style:'solid', size:'md', radius:14, shadow:true },
    { label: 'Orçamento', link: 'https://formulario.com', color: '#9333ea', textColor:'#ffffff', style:'outline', size:'md', radius:14, shadow:false },
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0b1220', style:'glass', size:'md', radius:14, shadow:false }
  ],
  restaurante: [
    { label: 'Cardápio', link: 'https://menu.delivery', color: '#ef4444', textColor:'#ffffff', style:'fantasy', size:'lg', radius:18, shadow:true },
    { label: 'Peça no iFood', link: 'https://ifood.com', color: '#f97316', textColor:'#0b1220', style:'solid', size:'md', radius:16, shadow:true },
    { label: 'WhatsApp', link: 'https://wa.me/5591...', color: '#25D366', textColor:'#0b1220', style:'outline', size:'md', radius:14, shadow:false }
  ]
};

// ========= Navegação por abas =========
function setScreenFromHash(){
  const hash = location.hash.replace('#','') || 'criar';
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(`view-${hash}`);
  if(el) el.classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === `#${hash}`);
  });
}

window.addEventListener('hashchange', setScreenFromHash);
window.addEventListener('load', () => {
  bindEditor();
  setScreenFromHash();
  refreshUI();

  // Botões "Aplicar" dos modelos prontos
  document.querySelectorAll('.model-card button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.model-card');
      const modelName = card?.dataset?.model;
      applyModel(modelName);
    });
  });

  // Tenta carregar último rascunho salvo
  loadDraft();
});

// ========= Editor =========
function bindEditor(){
  const addBtn = document.getElementById('addBtn');
  const applyBtn = document.getElementById('applyBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const btnText = document.getElementById('btnText');
  const btnLink = document.getElementById('btnLink');
  const btnColor = document.getElementById('btnColor');
  const btnTextColor = document.getElementById('btnTextColor');
  const btnStyle = document.getElementById('btnStyle');
  const btnSize = document.getElementById('btnSize');
  const btnRadius = document.getElementById('btnRadius');
  const btnShadow = document.getElementById('btnShadow');

  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const headerPreset = document.getElementById('headerPreset');
  const headerColor = document.getElementById('headerColor');
  const pageSlug = document.getElementById('pageSlug');

  const saveDraftBtn = document.getElementById('saveDraft');
  const publishBtn = document.getElementById('publish');
  const copyLinkBtn = document.getElementById('copyLink');
  const publishHint = document.getElementById('publishHint');

  publishBtn.disabled = (assinaturaStatus !== 'ativa');
  publishHint.textContent = publishBtn.disabled
    ? 'Sua assinatura está inativa. Regularize em Meus Pagamentos para publicar.'
    : '';

  addBtn.addEventListener('click', ()=>{
    state.buttons.push({
      label: 'Novo botão',
      link: 'https://',
      color: '#2b7a78',
      textColor: '#ffffff',
      style: 'solid',
      size: 'md',
      radius: 14,
      shadow: true
    });
    state.selectedIndex = state.buttons.length - 1;
    refreshUI();
  });

  applyBtn.addEventListener('click', ()=>{
    if(state.selectedIndex < 0) return;
    const b = state.buttons[state.selectedIndex];
    b.label = btnText.value || 'Botão';
    b.link  = btnLink.value || 'https://';
    b.color = btnColor.value || '#2b7a78';
    b.textColor = btnTextColor.value || '#ffffff';
    b.style = btnStyle.value;
    b.size = btnSize.value;
    b.radius = Number(btnRadius.value) || 14;
    b.shadow = !!btnShadow.checked;
    refreshUI();
  });

  deleteBtn.addEventListener('click', ()=>{
    if(state.selectedIndex < 0) return;
    state.buttons.splice(state.selectedIndex, 1);
    state.selectedIndex = -1;
    refreshUI();
  });

  pageTitle.addEventListener('input', e=>{
    state.header.title = e.target.value || 'Título da Página';
    refreshHeader();
  });
  pageSubtitle.addEventListener('input', e=>{
    state.header.subtitle = e.target.value || 'Subtítulo opcional';
    refreshHeader();
  });
  headerPreset.addEventListener('change', e=>{
    state.header.preset = e.target.value;
    refreshHeader();
  });
  headerColor.addEventListener('input', e=>{
    state.header.color = e.target.value;
    refreshHeader();
  });
  pageSlug.addEventListener('input', e=>{
    state.slug = sanitizeSlug(e.target.value);
  });

  saveDraftBtn.addEventListener('click', saveDraft);
  publishBtn.addEventListener('click', publishPage);
  copyLinkBtn.addEventListener('click', copyPublicLink);

  enableDragSort(document.getElementById('buttonsList'));
}

// ========= Modelos =========
function applyModel(name){
  const model = presetModels[name];
  if(!model) return;
  state.buttons = model.map(b => ({ ...b }));
  state.selectedIndex = -1;
  location.hash = '#criar';
  refreshUI();
}

// ========= Persistência (localStorage) =========
const DRAFT_KEY = 'anoig-current-draft';

function saveDraft(){
  const ok = validateDraft({ silent: true });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  alert(ok ? 'Rascunho salvo!' : 'Rascunho salvo (com campos pendentes).');
}

function loadDraft(){
  const raw = localStorage.getItem(DRAFT_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    if(data && typeof data === 'object'){
      state.slug = data.slug || '';
      state.buttons = Array.isArray(data.buttons) ? data.buttons : [];
      state.selectedIndex = -1;
      state.header = { ...state.header, ...(data.header || {}) };
      refreshUI();
      const pageSlug = document.getElementById('pageSlug');
      pageSlug.value = state.slug || '';
    }
  }catch(e){}
}

function publishPage(){
  if(assinaturaStatus !== 'ativa'){
    alert('Assinatura inativa. Vá em Meus Pagamentos.');
    return;
  }
  const valid = validateDraft();
  if(!valid) return;

  const KEY = `anoig-public-${state.slug}`;
  localStorage.setItem(KEY, JSON.stringify({
    slug: state.slug,
    header: state.header,
    buttons: state.buttons
  }));
  alert('Página publicada!');
}

function copyPublicLink(){
  if(!state.slug){
    alert('Defina o slug antes (ex.: "lucyana").');
    return;
  }
  const url = `${location.origin}/page.html#${state.slug}`;
  navigator.clipboard.writeText(url).then(()=>{
    alert(`Link copiado:\n${url}`);
  }, ()=>{
    prompt('Copie o link:', url);
  });
}

function validateDraft(opts={}){
  const errs = [];
  if(!state.slug || state.slug.length < 2) errs.push('Slug inválido (mínimo 2 caracteres).');
  if(!state.header.title || state.header.title.trim().length < 2) errs.push('Título obrigatório.');
  if(!Array.isArray(state.buttons) || state.buttons.length === 0) errs.push('Crie ao menos 1 botão.');
  state.buttons.forEach((b, i)=>{
    if(!b.label || !b.link) errs.push(`Botão ${i+1}: texto e link são obrigatórios.`);
    if(b.link && !/^https?:\/\//i.test(b.link)) errs.push(`Botão ${i+1}: link deve começar com http(s)://`);
  });
  if(errs.length){
    if(!opts.silent) alert('Antes de publicar, corrija:\n\n- ' + errs.join('\n- '));
    return false;
  }
  return true;
}

function sanitizeSlug(s=''){
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9-]/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'');
}

// ========= UI/Preview =========
function refreshUI(){
  // lista de botões
  const list = document.getElementById('buttonsList');
  list.innerHTML = '';
  state.buttons.forEach((b, idx)=>{
    const li = document.createElement('li');
    li.draggable = true;
    li.innerHTML = `
      <div class="item-left">
        <span class="item-handle">≡</span>
        <span>${b.label}</span>
      </div>
      <div class="item-actions">
        <button class="btn small">Editar</button>
      </div>
    `;
    li.querySelector('.btn').addEventListener('click', ()=>{
      state.selectedIndex = idx;
      loadToForm();
    });
    li.dataset.index = idx;
    list.appendChild(li);
  });

  // preview
  const pv = document.getElementById('pvButtons');
  pv.innerHTML = '';
  state.buttons.forEach((b)=>{
    const a = document.createElement('a');
    a.className = 'card-btn';
    a.href = b.link || '#';
    a.target = '_blank';
    a.style.borderRadius = `${b.radius || 14}px`;
    a.dataset.style = b.style || 'solid';
    a.dataset.size  = b.size || 'md';
    a.dataset.shadow = b.shadow ? 'true' : 'false';
    a.style.setProperty('--grad-a', b.color || '#2b7a78');
    a.style.setProperty('--grad-b', shade(b.color || '#2b7a78', 0.6));

    // base solid / text color
    if(b.style === 'solid'){
      a.style.background = b.color || '#2b7a78';
      a.style.border = '0';
    } else if(b.style === 'outline'){
      a.style.background = 'transparent';
    } else if(b.style === 'glass'){
      // já estilizado via CSS
    } else if(b.style === 'fantasy'){
      // já estilizado via CSS
    } else if(b.style === 'gradient'){
      // já via CSS com --grad-a/b
    }

    a.innerHTML = `
      <div class="card-inner">
        <div class="card-icon" style="background:${b.color || '#2b7a78'}"></div>
        <div class="card-label" style="color:${b.textColor || '#ffffff'}">${b.label}</div>
      </div>
    `;
    pv.appendChild(a);
  });

  loadToForm();
  refreshHeader();
}

function loadToForm(){
  const i = state.selectedIndex;
  const btnText = document.getElementById('btnText');
  const btnLink = document.getElementById('btnLink');
  const btnColor = document.getElementById('btnColor');
  const btnTextColor = document.getElementById('btnTextColor');
  const btnStyle = document.getElementById('btnStyle');
  const btnSize = document.getElementById('btnSize');
  const btnRadius = document.getElementById('btnRadius');
  const btnShadow = document.getElementById('btnShadow');

  if(i < 0){
    btnText.value = '';
    btnLink.value = '';
    btnColor.value = '#2b7a78';
    btnTextColor.value = '#ffffff';
    btnStyle.value = 'solid';
    btnSize.value = 'md';
    btnRadius.value = 14;
    btnShadow.checked = true;
    return;
  }
  const b = state.buttons[i];
  btnText.value = b.label || '';
  btnLink.value = b.link || '';
  btnColor.value = b.color || '#2b7a78';
  btnTextColor.value = b.textColor || '#ffffff';
  btnStyle.value = b.style || 'solid';
  btnSize.value = b.size || 'md';
  btnRadius.value = b.radius ?? 14;
  btnShadow.checked = !!b.shadow;
}

function refreshHeader(){
  const header = document.getElementById('phoneHeader');
  const t = document.getElementById('pvTitle');
  const s = document.getElementById('pvSubtitle');
  t.textContent = state.header.title || 'Título da Página';
  s.textContent = state.header.subtitle || '';
  if(state.header.preset === 'solid'){
    header.style.background = state.header.color;
  } else if(state.header.preset === 'pattern2'){
    header.style.background = 'linear-gradient(135deg,#283552,#1b2740)';
  } else {
    header.style.background = 'linear-gradient(135deg,#1f2937,#111827)';
  }
}

// util: escurecer cor (0..1)
function shade(hex='#2b7a78', factor=0.6){
  const c = hex.replace('#','');
  const n = parseInt(c,16);
  const r = (n>>16)&255, g=(n>>8)&255, b=n&255;
  const s = (v)=>Math.max(0, Math.min(255, Math.round(v*factor)));
  const out = (s(r)<<16) | (s(g)<<8) | s(b);
  return '#'+out.toString(16).padStart(6,'0');
}

// drag & drop
function enableDragSort(list){
  let dragEl = null;
  list.addEventListener('dragstart', (e)=>{ dragEl = e.target.closest('li'); e.dataTransfer.effectAllowed = 'move'; });
  list.addEventListener('dragover', (e)=>{
    e.preventDefault();
    const li = e.target.closest('li');
    if(!li || li === dragEl) return;
    const rect = li.getBoundingClientRect();
    const next = (e.clientY - rect.top) / rect.height > 0.5;
    list.insertBefore(dragEl, next ? li.nextSibling : li);
  });
  list.addEventListener('drop', ()=>{
    const items = Array.from(list.querySelectorAll('li'));
    const newOrder = items.map(li => state.buttons[Number(li.dataset.index)]);
    state.buttons = newOrder;
    state.selectedIndex = -1;
    refreshUI();
  });
}

// ======= Publicação (localStorage) =======
const DRAFT_KEY = 'anoig-current-draft';

function saveDraft(){
  const ok = validateDraft({ silent: true });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  alert(ok ? 'Rascunho salvo!' : 'Rascunho salvo (com campos pendentes).');
}

function loadDraft(){
  const raw = localStorage.getItem(DRAFT_KEY);
  if(!raw) return;
  try{
    const data = JSON.parse(raw);
    if(data && typeof data === 'object'){
      state.slug = data.slug || '';
      state.buttons = Array.isArray(data.buttons) ? data.buttons : [];
      state.selectedIndex = -1;
      state.header = { ...state.header, ...(data.header || {}) };
      refreshUI();
      const pageSlug = document.getElementById('pageSlug');
      pageSlug.value = state.slug || '';
    }
  }catch(e){}
}

function publishPage(){
  if(assinaturaStatus !== 'ativa'){
    alert('Assinatura inativa. Vá em Meus Pagamentos.');
    return;
  }
  const valid = validateDraft();
  if(!valid) return;

  const KEY = `anoig-public-${state.slug}`;
  localStorage.setItem(KEY, JSON.stringify({
    slug: state.slug,
    header: state.header,
    buttons: state.buttons
  }));
  alert('Página publicada!');
}

function copyPublicLink(){
  if(!state.slug){
    alert('Defina o slug antes (ex.: "lucyana").');
    return;
  }
  const url = `${location.origin}/page.html#${state.slug}`;
  navigator.clipboard.writeText(url).then(()=>{
    alert(`Link copiado:\n${url}`);
  }, ()=>{
    prompt('Copie o link:', url);
  });
}

function validateDraft(opts={}){
  const errs = [];
  if(!state.slug || state.slug.length < 2) errs.push('Slug inválido (mínimo 2 caracteres).');
  if(!state.header.title || state.header.title.trim().length < 2) errs.push('Título obrigatório.');
  if(!Array.isArray(state.buttons) || state.buttons.length === 0) errs.push('Crie ao menos 1 botão.');
  state.buttons.forEach((b, i)=>{
    if(!b.label || !b.link) errs.push(`Botão ${i+1}: texto e link são obrigatórios.`);
    if(b.link && !/^https?:\/\//i.test(b.link)) errs.push(`Botão ${i+1}: link deve começar com http(s)://`);
  });
  if(errs.length){
    if(!opts.silent) alert('Antes de publicar, corrija:\n\n- ' + errs.join('\n- '));
    return false;
  }
  return true;
}
