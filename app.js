// ======= Configurações simuladas =======
var assinaturaStatus = 'ativa'; // mude para 'inativa' para testar bloqueio

// ======= Estado do editor =======
var state = {
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

// ======= Modelos prontos =======
var presetModels = {
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

// ======= Utilidades =======
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

// Escurece cor (0..1)
function shade(hex, factor){
  if(!hex){ hex = '#2b7a78'; }
  if(typeof factor !== 'number'){ factor = 0.6; }
  var c = (hex||'').replace('#','');
  if(c.length !== 6){ return hex; }
  var n = parseInt(c,16);
  var r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  function s(v){ var x = Math.round(v*factor); if(x<0)x=0; if(x>255)x=255; return x; }
  var out = (s(r)<<16) | (s(g)<<8) | s(b);
  var hexOut = out.toString(16);
  while(hexOut.length<6) hexOut='0'+hexOut;
  return '#'+hexOut;
}

function sanitizeSlug(s){
  s = (s||'').toLowerCase();
  s = s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,'') : s;
  s = s.replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  return s;
}

// ======= Abas =======
function setScreenFromHash(){
  var hash = (location.hash||'').replace('#','');
  if(!hash){ hash = 'criar'; }
  qsa('.screen').forEach(function(s){ s.classList.add('hidden'); });
  var el = qs('#view-' + hash);
  if(el){ el.classList.remove('hidden'); }
  qsa('.tab').forEach(function(a){
    a.classList.toggle('active', a.getAttribute('href') === '#'+hash);
  });
}

// ======= Init =======
window.addEventListener('DOMContentLoaded', function(){
  bindEditor();
  setScreenFromHash();
  refreshUI();
  // modelos
  qsa('.model-card button').forEach(function(btn){
    btn.addEventListener('click', function(e){
      var card = e.currentTarget.closest('.model-card');
      var modelName = card ? card.getAttribute('data-model') : '';
      applyModel(modelName);
    });
  });
  // rascunho
  loadDraft();
});
window.addEventListener('hashchange', setScreenFromHash);

// ======= Editor =======
function bindEditor(){
  var addBtn = qs('#addBtn');
  var applyBtn = qs('#applyBtn');
  var deleteBtn = qs('#deleteBtn');

  var btnText = qs('#btnText');
  var btnLink = qs('#btnLink');
  var btnColor = qs('#btnColor');
  var btnTextColor = qs('#btnTextColor');
  var btnStyle = qs('#btnStyle');
  var btnSize = qs('#btnSize');
  var btnRadius = qs('#btnRadius');
  var btnShadow = qs('#btnShadow');

  var pageTitle = qs('#pageTitle');
  var pageSubtitle = qs('#pageSubtitle');
  var headerPreset = qs('#headerPreset');
  var headerColor = qs('#headerColor');
  var pageSlug = qs('#pageSlug');

  var saveDraftBtn = qs('#saveDraft');
  var publishBtn = qs('#publish');
  var copyLinkBtn = qs('#copyLink');
  var publishHint = qs('#publishHint');

  if(publishBtn){
    publishBtn.disabled = (assinaturaStatus !== 'ativa');
  }
  if(publishHint){
    publishHint.textContent = (assinaturaStatus !== 'ativa')
      ? 'Sua assinatura está inativa. Regularize em Meus Pagamentos para publicar.'
      : '';
  }

  if(addBtn){
    addBtn.addEventListener('click', function(){
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
  }

  if(applyBtn){
    applyBtn.addEventListener('click', function(){
      if(state.selectedIndex < 0) return;
      var b = state.buttons[state.selectedIndex];
      b.label = btnText && btnText.value ? btnText.value : 'Botão';
      b.link  = btnLink && btnLink.value ? btnLink.value : 'https://';
      b.color = btnColor && btnColor.value ? btnColor.value : '#2b7a78';
      b.textColor = btnTextColor && btnTextColor.value ? btnTextColor.value : '#ffffff';
      b.style = btnStyle && btnStyle.value ? btnStyle.value : 'solid';
      b.size = btnSize && btnSize.value ? btnSize.value : 'md';
      b.radius = btnRadius && btnRadius.value ? Number(btnRadius.value) : 14;
      b.shadow = btnShadow ? !!btnShadow.checked : true;
      refreshUI();
    });
  }

  if(deleteBtn){
    deleteBtn.addEventListener('click', function(){
      if(state.selectedIndex < 0) return;
      state.buttons.splice(state.selectedIndex, 1);
      state.selectedIndex = -1;
      refreshUI();
    });
  }

  if(pageTitle){ pageTitle.addEventListener('input', function(e){ state.header.title = e.target.value || 'Título da Página'; refreshHeader(); }); }
  if(pageSubtitle){ pageSubtitle.addEventListener('input', function(e){ state.header.subtitle = e.target.value || 'Subtítulo opcional'; refreshHeader(); }); }
  if(headerPreset){ headerPreset.addEventListener('change', function(e){ state.header.preset = e.target.value; refreshHeader(); }); }
  if(headerColor){ headerColor.addEventListener('input', function(e){ state.header.color = e.target.value; refreshHeader(); }); }
  if(pageSlug){ pageSlug.addEventListener('input', function(e){ state.slug = sanitizeSlug(e.target.value); }); }

  if(saveDraftBtn){ saveDraftBtn.addEventListener('click', saveDraft); }
  if(publishBtn){ publishBtn.addEventListener('click', publishPage); }
  if(copyLinkBtn){ copyLinkBtn.addEventListener('click', copyPublicLink); }

  var list = qs('#buttonsList');
  if(list){ enableDragSort(list); }
}

// ======= Modelos =======
function applyModel(name){
  var model = presetModels[name];
  if(!model) return;
  state.buttons = model.map(function(b){ return Object.assign({}, b); });
  state.selectedIndex = -1;
  location.hash = '#criar';
  refreshUI();
}

// ======= Persistência (localStorage) =======
var DRAFT_KEY = 'anoig-current-draft';

function saveDraft(){
  try{
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    var ok = validateDraft({ silent: true });
    alert(ok ? 'Rascunho salvo!' : 'Rascunho salvo (com campos pendentes).');
  }catch(e){
    alert('Não foi possível salvar o rascunho.');
  }
}

function loadDraft(){
  try{
    var raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    var data = JSON.parse(raw);
    if(data && typeof data === 'object'){
      state.slug = data.slug || '';
      state.buttons = Array.isArray(data.buttons) ? data.buttons : [];
      state.selectedIndex = -1;
      state.header = Object.assign({}, state.header, (data.header || {}));
      refreshUI();
      var pageSlug = qs('#pageSlug');
      if(pageSlug){ pageSlug.value = state.slug || ''; }
    }
  }catch(e){}
}

function publishPage(){
  if(assinaturaStatus !== 'ativa'){
    alert('Assinatura inativa. Vá em Meus Pagamentos.');
    return;
  }
  var valid = validateDraft();
  if(!valid) return;
  try{
    var KEY = 'anoig-public-' + state.slug;
    localStorage.setItem(KEY, JSON.stringify({
      slug: state.slug,
      header: state.header,
      buttons: state.buttons
    }));
    alert('Página publicada!');
  }catch(e){
    alert('Falha ao publicar.');
  }
}

function copyPublicLink(){
  if(!state.slug){
    alert('Defina o slug antes (ex.: "lucyana").');
    return;
  }
  var url = location.origin + '/page.html#' + state.slug;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      alert('Link copiado:\n' + url);
    }, function(){
      window.prompt('Copie o link:', url);
    });
  }else{
    window.prompt('Copie o link:', url);
  }
}

function validateDraft(opts){
  opts = opts || {};
  var errs = [];
  if(!state.slug || state.slug.length < 2) errs.push('Slug inválido (mínimo 2 caracteres).');
  if(!state.header.title || state.header.title.replace(/\s+/g,'').length < 2) errs.push('Título obrigatório.');
  if(!Array.isArray(state.buttons) || state.buttons.length === 0) errs.push('Crie ao menos 1 botão.');
  state.buttons.forEach(function(b, i){
    if(!b.label || !b.link) errs.push('Botão ' + (i+1) + ': texto e link são obrigatórios.');
    if(b.link && !/^https?:\/\//i.test(b.link)) errs.push('Botão ' + (i+1) + ': link deve começar com http(s)://');
  });
  if(errs.length){
    if(!opts.silent) alert('Antes de publicar, corrija:\n\n- ' + errs.join('\n- '));
    return false;
  }
  return true;
}

// ======= UI / Preview =======
function refreshUI(){
  // lista de botões
  var list = qs('#buttonsList');
  if(list){
    list.innerHTML = '';
    state.buttons.forEach(function(b, idx){
      var li = document.createElement('li');
      li.draggable = true;
      li.innerHTML =
        '<div class="item-left">' +
          '<span class="item-handle">≡</span>' +
          '<span>'+ escapeHtml(b.label) +'</span>' +
        '</div>' +
        '<div class="item-actions">' +
          '<button class="btn small">Editar</button>' +
        '</div>';
      li.querySelector('.btn').addEventListener('click', function(){
        state.selectedIndex = idx;
        loadToForm();
      });
      li.setAttribute('data-index', String(idx));
      list.appendChild(li);
    });
  }

  // preview
  var pv = qs('#pvButtons');
  if(pv){
    pv.innerHTML = '';
    state.buttons.forEach(function(b){
      var a = document.createElement('a');
      a.className = 'card-btn';
      a.href = b.link || '#';
      a.target = '_blank';
      a.style.borderRadius = (b.radius || 14) + 'px';
      a.setAttribute('data-style', b.style || 'solid');
      a.setAttribute('data-size',  b.size || 'md');
      a.setAttribute('data-shadow', b.shadow ? 'true' : 'false');
      a.style.setProperty('--grad-a', b.color || '#2b7a78');
      a.style.setProperty('--grad-b', shade(b.color || '#2b7a78', 0.6));

      if(b.style === 'solid'){
        a.style.background = b.color || '#2b7a78';
        a.style.border = '0';
      } else if(b.style === 'outline'){
        a.style.background = 'transparent';
      } // vidro, fantasia, gradiente já cobertos no CSS

      a.innerHTML =
        '<div class="card-inner">' +
          '<div class="card-icon" style="background:'+ (b.color || '#2b7a78') +'"></div>' +
          '<div class="card-label" style="color:'+ (b.textColor || '#ffffff') +'">'+ escapeHtml(b.label) +'</div>' +
        '</div>';
      pv.appendChild(a);
    });
  }

  loadToForm();
  refreshHeader();
}

function loadToForm(){
  var i = state.selectedIndex;
  var btnText = qs('#btnText');
  var btnLink = qs('#btnLink');
  var btnColor = qs('#btnColor');
  var btnTextColor = qs('#btnTextColor');
  var btnStyle = qs('#btnStyle');
  var btnSize = qs('#btnSize');
  var btnRadius = qs('#btnRadius');
  var btnShadow = qs('#btnShadow');

  if(i < 0 || !state.buttons[i]){
    if(btnText) btnText.value = '';
    if(btnLink) btnLink.value = '';
    if(btnColor) btnColor.value = '#2b7a78';
    if(btnTextColor) btnTextColor.value = '#ffffff';
    if(btnStyle) btnStyle.value = 'solid';
    if(btnSize) btnSize.value = 'md';
    if(btnRadius) btnRadius.value = 14;
    if(btnShadow) btnShadow.checked = true;
    return;
  }
  var b = state.buttons[i];
  if(btnText) btnText.value = b.label || '';
  if(btnLink) btnLink.value = b.link || '';
  if(btnColor) btnColor.value = b.color || '#2b7a78';
  if(btnTextColor) btnTextColor.value = b.textColor || '#ffffff';
  if(btnStyle) btnStyle.value = b.style || 'solid';
  if(btnSize) btnSize.value = b.size || 'md';
  if(btnRadius) btnRadius.value = (typeof b.radius==='number') ? b.radius : 14;
  if(btnShadow) btnShadow.checked = !!b.shadow;
}

function refreshHeader(){
  var header = qs('#phoneHeader');
  var t = qs('#pvTitle');
  var s = qs('#pvSubtitle');
  if(t) t.textContent = state.header.title || 'Título da Página';
  if(s) s.textContent = state.header.subtitle || '';
  if(header){
    if(state.header.preset === 'solid'){
      header.style.background = state.header.color || '#1f2937';
    } else if(state.header.preset === 'pattern2'){
      header.style.background = 'linear-gradient(135deg,#283552,#1b2740)';
    } else {
      header.style.background = 'linear-gradient(135deg,#1f2937,#111827)';
    }
  }
}

// Drag & Drop
function enableDragSort(list){
  var dragEl = null;
  list.addEventListener('dragstart', function(e){
    dragEl = e.target.closest('li');
    if(e.dataTransfer){ e.dataTransfer.effectAllowed = 'move'; }
  });
  list.addEventListener('dragover', function(e){
    e.preventDefault();
    var li = e.target.closest('li');
    if(!li || li === dragEl) return;
    var rect = li.getBoundingClientRect();
    var next = (e.clientY - rect.top) / (rect.height) > 0.5;
    list.insertBefore(dragEl, next ? li.nextSibling : li);
  });
  list.addEventListener('drop', function(){
    var items = Array.prototype.slice.call(list.querySelectorAll('li'));
    var newOrder = items.map(function(li){ return state.buttons[Number(li.getAttribute('data-index'))]; });
    state.buttons = newOrder;
    state.selectedIndex = -1;
    refreshUI();
  });
}

// Segurança simples para texto
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}
