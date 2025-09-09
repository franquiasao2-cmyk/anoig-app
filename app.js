// Simulação de status da assinatura (troque para 'inativa' para ver o botão publicar desabilitado)
let assinaturaStatus = 'ativa';

// Estado simples do editor
const state = {
  buttons: [],
  selectedIndex: -1,
  header: {
    title: 'Título da Página',
    subtitle: 'Subtítulo opcional',
    preset: 'pattern1',
    color: '#1f2937'
  }
};

// Navegação por abas (hash)
function setScreenFromHash(){
  const hash = location.hash.replace('#','') || 'criar';
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(`view-${hash}`);
  if(el) el.classList.remove('hidden');

  // marcar aba ativa (só estilo simples)
  document.querySelectorAll('.tab').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === `#${hash}`);
  });
}
window.addEventListener('hashchange', setScreenFromHash);
window.addEventListener('load', () => {
  bindEditor();
  setScreenFromHash();
  refreshUI();
});

// ====== Editor ======
function bindEditor(){
  const addBtn = document.getElementById('addBtn');
  const applyBtn = document.getElementById('applyBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  const btnText = document.getElementById('btnText');
  const btnLink = document.getElementById('btnLink');
  const btnColor = document.getElementById('btnColor');

  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const headerPreset = document.getElementById('headerPreset');
  const headerColor = document.getElementById('headerColor');

  const saveDraft = document.getElementById('saveDraft');
  const publish = document.getElementById('publish');
  const publishHint = document.getElementById('publishHint');

  // status da assinatura controla o botão Publicar
  publish.disabled = (assinaturaStatus !== 'ativa');
  publishHint.textContent = publish.disabled
    ? 'Sua assinatura está inativa. Regularize em Meus Pagamentos para publicar.'
    : '';

  addBtn.addEventListener('click', ()=>{
    state.buttons.push({
      label: 'Novo botão',
      link: 'https://',
      color: '#2b7a78'
    });
    state.selectedIndex = state.buttons.length - 1;
    refreshUI();
  });

  applyBtn.addEventListener('click', ()=>{
    if(state.selectedIndex < 0) return;
    state.buttons[state.selectedIndex].label = btnText.value || 'Botão';
    state.buttons[state.selectedIndex].link  = btnLink.value || 'https://';
    state.buttons[state.selectedIndex].color = btnColor.value || '#2b7a78';
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

  saveDraft.addEventListener('click', ()=>{
    alert('Rascunho salvo (simulação).');
  });
  publish.addEventListener('click', ()=>{
    if(assinaturaStatus !== 'ativa'){
      alert('Assinatura inativa. Vá em Meus Pagamentos.');
      return;
    }
    alert('Página publicada (simulação).');
  });

  // drag and drop simples para reordenar
  enableDragSort(document.getElementById('buttonsList'));
}

function refreshUI(){
  // lista de botões (editor)
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
    const div = document.createElement('div');
    div.className = 'card-btn';
    div.style.background = '#0f1a31';
    div.style.borderColor = 'rgba(255,255,255,0.06)';
    div.innerHTML = `
      <div class="card-inner">
        <div class="card-icon" style="background:${b.color}"></div>
        <div class="card-label">${b.label}</div>
      </div>
    `;
    pv.appendChild(div);
  });

  loadToForm();
  refreshHeader();
}

function loadToForm(){
  const i = state.selectedIndex;
  const btnText = document.getElementById('btnText');
  const btnLink = document.getElementById('btnLink');
  const btnColor = document.getElementById('btnColor');

  if(i < 0){
    btnText.value = '';
    btnLink.value = '';
    btnColor.value = '#2b7a78';
    return;
  }
  const b = state.buttons[i];
  btnText.value = b.label;
  btnLink.value = b.link;
  btnColor.value = b.color;
}

function refreshHeader(){
  const header = document.getElementById('phoneHeader');
  const t = document.getElementById('pvTitle');
  const s = document.getElementById('pvSubtitle');

  t.textContent = state.header.title || 'Título da Página';
  s.textContent = state.header.subtitle || 'Subtítulo opcional';

  if(state.header.preset === 'solid'){
    header.style.background = state.header.color;
  } else if(state.header.preset === 'pattern2'){
    header.style.background = 'linear-gradient(135deg,#283552,#1b2740)';
  } else {
    header.style.background = 'linear-gradient(135deg,#1f2937,#111827)';
  }
}

// drag & drop para reordenar
function enableDragSort(list){
  let dragEl = null;

  list.addEventListener('dragstart', (e)=>{
    dragEl = e.target.closest('li');
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragover', (e)=>{
    e.preventDefault();
    const li = e.target.closest('li');
    if(!li || li === dragEl) return;
    const rect = li.getBoundingClientRect();
    const next = (e.clientY - rect.top) / (rect.height) > 0.5;
    list.insertBefore(dragEl, next ? li.nextSibling : li);
  });

  list.addEventListener('drop', ()=>{
    // atualizar ordem no estado
    const items = Array.from(list.querySelectorAll('li'));
    const newOrder = items.map(li => state.buttons[Number(li.dataset.index)]);
    state.buttons = newOrder;
    state.selectedIndex = -1;
    refreshUI();
  });
}
