(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const dom = {
    projectName: $('#projectName'), saveStatus: $('#saveStatus'),
    mobileLibraryBtn: $('#mobileLibraryBtn'), mobilePropertiesBtn: $('#mobilePropertiesBtn'), mobilePanelBackdrop: $('#mobilePanelBackdrop'),
    newProjectBtn: $('#newProjectBtn'), saveProjectBtn: $('#saveProjectBtn'), openProjectBtn: $('#openProjectBtn'),
    projectFileInput: $('#projectFileInput'), exportMenuBtn: $('#exportMenuBtn'), exportMenu: $('#exportMenu'),
    undoBtn: $('#undoBtn'), redoBtn: $('#redoBtn'), selectToolBtn: $('#selectToolBtn'), handToolBtn: $('#handToolBtn'),
    duplicateBtn: $('#duplicateBtn'), deleteBtn: $('#deleteBtn'), bringFrontBtn: $('#bringFrontBtn'), sendBackBtn: $('#sendBackBtn'),
    zoomOutBtn: $('#zoomOutBtn'), zoomInBtn: $('#zoomInBtn'), zoomSelect: $('#zoomSelect'), fitBtn: $('#fitBtn'),
    gridToggle: $('#gridToggle'), snapToggle: $('#snapToggle'), pageSizeSelect: $('#pageSizeSelect'), previewBtn: $('#previewBtn'),
    componentSearch: $('#componentSearch'), componentLibrary: $('#componentLibrary'),
    pagesList: $('#pagesList'), addPageBtn: $('#addPageBtn'), duplicatePageBtn: $('#duplicatePageBtn'), deletePageBtn: $('#deletePageBtn'),
    pageNameInput: $('#pageNameInput'), pageBackgroundInput: $('#pageBackgroundInput'),
    templateList: $('#templateList'),
    workspace: $('#workspace'), workspaceInner: $('#workspaceInner'), artboardStage: $('#artboardStage'), artboard: $('#artboard'),
    canvasSizeStatus: $('#canvasSizeStatus'), selectionStatus: $('#selectionStatus'), coordinateStatus: $('#coordinateStatus'),
    emptyProperties: $('#emptyProperties'), propertiesForm: $('#propertiesForm'), imageField: $('#imageField'), urlField: $('#urlField'),
    imageUpload: $('#imageUpload'), removeImageBtn: $('#removeImageBtn'), lockBtn: $('#lockBtn'), hideBtn: $('#hideBtn'),
    layersList: $('#layersList'), clearCanvasBtn: $('#clearCanvasBtn'),
    customSizeModal: $('#customSizeModal'), customWidth: $('#customWidth'), customHeight: $('#customHeight'), applyCustomSizeBtn: $('#applyCustomSizeBtn'),
    previewModal: $('#previewModal'), previewBody: $('#previewBody'), toastContainer: $('#toastContainer')
  };

  const pageSizes = {
    desktop: [1440, 900], laptop: [1366, 768], tablet: [768, 1024], mobile: [390, 844],
    a4portrait: [794, 1123], a4landscape: [1123, 794]
  };

  const catalog = [
    { group: 'Text & Basic', items: [
      ['text','T','Text'], ['heading','H','Heading'], ['paragraph','¶','Paragraph'], ['button','BTN','Button'],
      ['link','↗','Link'], ['box','□','Box'], ['card','▣','Card'], ['divider','—','Divider'],
      ['image','IMG','Image'], ['icon','★','Icon'], ['avatar','●','Avatar'], ['badge','TAG','Badge'], ['note','N','Sticky Note']
    ]},
    { group: 'Forms', items: [
      ['input','IN','Text Input'], ['textarea','TA','Textarea'], ['select','⌄','Select'], ['search','⌕','Search Bar'],
      ['date','31','Date Input'], ['checkbox','✓','Checkbox'], ['radio','○','Radio Button'], ['switch','◉','Switch'], ['file','↑','File Upload']
    ]},
    { group: 'Navigation', items: [
      ['navbar','NAV','Navigation Bar'], ['sidebar','SIDE','Sidebar'], ['tabs','TAB','Tabs'], ['breadcrumbs','›','Breadcrumbs'],
      ['pagination','123','Pagination'], ['bottomnav','⌂','Bottom Navigation']
    ]},
    { group: 'Data & Feedback', items: [
      ['table','GRID','Table'], ['list','≡','List'], ['stat','123','Stat Card'], ['progress','%','Progress Bar'],
      ['chart','▥','Bar Chart'], ['toast','!','Notification'], ['accordion','+','Accordion']
    ]},
    { group: 'Frames & Overlays', items: [
      ['browser','WEB','Browser Window'], ['phone','APP','Mobile Device'], ['modal','MOD','Modal Dialog']
    ]},
    { group: 'Flowchart', items: [
      ['flow-start','◯','Start / End'], ['flow-process','▭','Process'], ['flow-decision','◇','Decision'],
      ['flow-database','DB','Database'], ['connector','→','Connector Arrow']
    ]}
  ];

  const templates = [
    { id: 'blank', name: 'Blank Canvas', description: 'Start from an empty desktop canvas.', preview: '' },
    { id: 'mobile-login', name: 'Mobile Login App', description: 'Mobile sign-in screen with common controls.', preview: 'mobile login' },
    { id: 'dashboard', name: 'Admin Dashboard', description: 'Sidebar, top navigation, statistics, chart, and table.', preview: 'dashboard' },
    { id: 'app-listing', name: 'App Store Listing', description: 'Responsive application product/detail layout.', preview: 'mobile' },
    { id: 'flowchart', name: 'System Process Flow', description: 'Starter process diagram for system planning.', preview: 'flow' }
  ];

  let project;
  let selectedId = null;
  let clipboard = null;
  let zoom = 1;
  let currentTool = 'select';
  let interaction = null;
  let history = [];
  let historyIndex = -1;
  let autosaveTimer = null;
  let dirty = false;

  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const currentPage = () => project.pages.find(page => page.id === project.currentPageId) || project.pages[0];
  const selectedElement = () => currentPage().elements.find(element => element.id === selectedId) || null;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const snap = value => dom.snapToggle.checked ? Math.round(value / 10) * 10 : Math.round(value);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const isTypingTarget = target => ['INPUT','TEXTAREA','SELECT'].includes(target.tagName) || target.isContentEditable;

  function blankProject() {
    const pageId = uid('page');
    return {
      app: 'Brainstorming Mockup Generator', version: 1, name: 'Untitled Mockup',
      currentPageId: pageId,
      pages: [{ id: pageId, name: 'Page 1', width: 1440, height: 900, background: '#ffffff', elements: [] }]
    };
  }

  function defaultElement(type, x = 80, y = 80) {
    const base = {
      id: uid('el'), type, name: labelForType(type), x, y, w: 180, h: 48, rotation: 0, opacity: 100,
      z: nextZ(), locked: false, hidden: false,
      props: {
        text: labelForType(type), url: '', imageSrc: '', background: '#ffffff', color: '#293142', borderColor: '#7b8492',
        borderWidth: 1, radius: 6, shadow: 'none', fontSize: 16, fontWeight: '400', textAlign: 'left', lineHeight: 1.3
      }
    };

    const p = base.props;
    switch (type) {
      case 'text': base.w=180; base.h=36; p.text='Text label'; p.background='#ffffff'; p.borderWidth=0; break;
      case 'heading': base.w=320; base.h=58; p.text='Page Heading'; p.borderWidth=0; p.fontSize=32; p.fontWeight='700'; break;
      case 'paragraph': base.w=340; base.h=100; p.text='Add supporting copy or a short paragraph here. Use the properties panel to edit this text.'; p.borderWidth=0; p.fontSize=15; p.lineHeight=1.5; break;
      case 'button': base.w=140; base.h=44; p.text='Primary Button'; p.background='#6d5dfc'; p.color='#ffffff'; p.borderColor='#6d5dfc'; p.fontWeight='600'; p.textAlign='center'; p.radius=8; break;
      case 'link': base.w=130; base.h=32; p.text='Text link →'; p.background='#ffffff'; p.color='#5a4be7'; p.borderWidth=0; p.fontWeight='500'; break;
      case 'box': base.w=240; base.h=160; p.text=''; p.background='#f8fafc'; p.borderColor='#8c95a3'; break;
      case 'card': base.w=300; base.h=190; p.text='Card title\nSupporting information can be placed inside this card.'; p.background='#ffffff'; p.borderColor='#d2d7df'; p.shadow='soft'; p.radius=12; p.fontWeight='500'; break;
      case 'divider': base.w=300; base.h=12; p.text=''; p.borderWidth=0; p.color='#aab1bc'; break;
      case 'image': base.w=300; base.h=190; p.text='Image placeholder'; p.background='#eef1f5'; p.borderColor='#9da5b2'; p.radius=8; break;
      case 'icon': base.w=48; base.h=48; p.text='★'; p.background='#eeeaff'; p.color='#5c4ee6'; p.borderWidth=0; p.fontSize=24; p.textAlign='center'; p.radius=10; break;
      case 'avatar': base.w=72; base.h=72; p.text='👤'; p.background='#e8ebf0'; p.borderWidth=0; p.fontSize=30; p.textAlign='center'; p.radius=100; break;
      case 'badge': base.w=95; base.h=30; p.text='New'; p.background='#e9f8ef'; p.color='#197547'; p.borderWidth=0; p.fontSize=13; p.fontWeight='600'; p.textAlign='center'; p.radius=99; break;
      case 'note': base.w=200; base.h=150; p.text='Write an idea, question, or reminder here.'; p.background='#fff3a6'; p.borderColor='#ead676'; p.radius=2; p.shadow='soft'; break;
      case 'input': base.w=280; base.h=44; p.text='Enter text…'; p.color='#777f8c'; p.borderColor='#9aa2af'; p.radius=6; break;
      case 'textarea': base.w=300; base.h=110; p.text='Enter a longer message…'; p.color='#777f8c'; p.borderColor='#9aa2af'; p.radius=6; break;
      case 'select': base.w=260; base.h=44; p.text='Select an option     ▾'; p.color='#596170'; p.borderColor='#9aa2af'; break;
      case 'search': base.w=300; base.h=44; p.text='⌕  Search…'; p.color='#777f8c'; p.borderColor='#9aa2af'; p.radius=99; break;
      case 'date': base.w=230; base.h=44; p.text='mm/dd/yyyy       ▣'; p.color='#777f8c'; p.borderColor='#9aa2af'; break;
      case 'checkbox': base.w=180; base.h=32; p.text='Checkbox label'; p.borderWidth=0; p.background='#ffffff'; break;
      case 'radio': base.w=180; base.h=32; p.text='Radio option'; p.borderWidth=0; p.background='#ffffff'; break;
      case 'switch': base.w=175; base.h=32; p.text='Enable setting'; p.borderWidth=0; p.background='#ffffff'; break;
      case 'file': base.w=300; base.h=100; p.text='Drop file here or browse'; p.borderColor='#8e97a4'; p.radius=8; p.textAlign='center'; break;
      case 'navbar': base.w=900; base.h=64; p.text='Brand'; p.background='#ffffff'; p.borderColor='#cfd5dd'; p.fontWeight='700'; break;
      case 'sidebar': base.w=230; base.h=600; p.text='Brainstorming'; p.background='#202938'; p.color='#ffffff'; p.borderWidth=0; p.radius=0; break;
      case 'tabs': base.w=430; base.h=48; p.text=''; p.background='#ffffff'; p.borderColor='#d2d7df'; p.radius=0; break;
      case 'breadcrumbs': base.w=330; base.h=36; p.text='Home  /  Projects  /  Current Page'; p.borderWidth=0; p.color='#667085'; break;
      case 'pagination': base.w=260; base.h=42; p.text='‹   1   2   3   …   10   ›'; p.borderColor='#cfd5dd'; p.textAlign='center'; p.radius=6; break;
      case 'bottomnav': base.w=390; base.h=72; p.text=''; p.borderColor='#d2d7df'; p.shadow='medium'; break;
      case 'table': base.w=650; base.h=250; p.text=''; p.borderWidth=0; p.radius=0; break;
      case 'list': base.w=320; base.h=190; p.text='List item one\nList item two\nList item three\nList item four'; p.borderColor='#d2d7df'; p.radius=8; p.lineHeight=2.1; break;
      case 'stat': base.w=230; base.h=120; p.text='Total Users\n12,480'; p.borderColor='#d2d7df'; p.shadow='soft'; p.radius=10; p.fontWeight='600'; break;
      case 'progress': base.w=340; base.h=36; p.text=''; p.borderWidth=0; p.color='#6d5dfc'; break;
      case 'chart': base.w=440; base.h=260; p.text=''; p.background='#ffffff'; p.color='#6d5dfc'; p.borderColor='#d2d7df'; p.radius=10; break;
      case 'toast': base.w=340; base.h=70; p.text='Your changes were saved successfully.'; p.background='#1f2937'; p.color='#ffffff'; p.borderWidth=0; p.radius=8; p.shadow='medium'; break;
      case 'accordion': base.w=380; base.h=150; p.text='Section title                                +\n\nSection title                                +\n\nSection title                                +'; p.borderColor='#d2d7df'; p.lineHeight=1.8; break;
      case 'browser': base.w=760; base.h=500; p.text='Web page content'; p.background='#ffffff'; p.borderColor='#788190'; p.radius=10; p.shadow='medium'; break;
      case 'phone': base.w=300; base.h=620; p.text='Mobile screen'; p.background='#ffffff'; p.borderWidth=0; p.radius=34; p.shadow='strong'; break;
      case 'modal': base.w=440; base.h=230; p.text='Modal title\nAdd a description or confirmation message here.'; p.background='#ffffff'; p.borderColor='#d0d5dd'; p.radius=12; p.shadow='strong'; break;
      case 'flow-start': base.w=180; base.h=70; p.text='START'; p.background='#e9f8ef'; p.color='#175f3c'; p.borderColor='#258b5b'; p.fontWeight='700'; p.textAlign='center'; p.radius=99; break;
      case 'flow-process': base.w=230; base.h=85; p.text='Role: Process action.'; p.background='#edf3ff'; p.color='#253a63'; p.borderColor='#5d7db8'; p.fontWeight='500'; p.textAlign='center'; p.radius=3; break;
      case 'flow-decision': base.w=150; base.h=150; p.text='Decision?'; p.background='#fff5dc'; p.color='#75551c'; p.borderColor='#c69a3a'; p.fontWeight='600'; p.textAlign='center'; p.radius=2; break;
      case 'flow-database': base.w=190; base.h=115; p.text='Database'; p.background='#f3edff'; p.color='#5b367a'; p.borderColor='#8b63ad'; p.fontWeight='600'; p.textAlign='center'; break;
      case 'connector': base.w=170; base.h=20; p.text=''; p.borderWidth=0; p.color='#4a5360'; break;
    }
    return base;
  }

  function labelForType(type) {
    for (const group of catalog) {
      const item = group.items.find(entry => entry[0] === type);
      if (item) return item[2];
    }
    return type;
  }

  function nextZ() {
    if (!project || !project.pages?.length) return 1;
    const page = currentPage();
    return page.elements.length ? Math.max(...page.elements.map(element => Number(element.z) || 1)) + 1 : 1;
  }

  function shadowValue(name) {
    return ({ none: 'none', soft: '0 4px 12px rgba(17,24,39,.10)', medium: '0 10px 24px rgba(17,24,39,.16)', strong: '0 18px 45px rgba(17,24,39,.25)' })[name] || 'none';
  }

  function componentMarkup(element) {
    const p = element.props;
    const text = escapeHtml(p.text).replace(/\n/g, '<br>');
    switch (element.type) {
      case 'image':
        return p.imageSrc ? `<div class="element-content" style="background-image:url('${p.imageSrc.replace(/'/g,"%27")}');background-size:cover;background-position:center"></div>` : `<div class="element-content"><div class="image-placeholder"><div><span class="image-symbol">▧</span>${text}</div></div></div>`;
      case 'checkbox': return `<div class="element-content"><span class="fake-check"></span><span>${text}</span></div>`;
      case 'radio': return `<div class="element-content"><span class="fake-radio"></span><span>${text}</span></div>`;
      case 'switch': return `<div class="element-content"><span class="fake-switch"></span><span>${text}</span></div>`;
      case 'navbar': return `<div class="element-content"><strong>${text || 'Brand'}</strong><div class="nav-links"><span>Home</span><span>Features</span><span>About</span><span>Contact</span></div></div>`;
      case 'sidebar': return `<div class="element-content"><div class="sidebar-logo">${text || 'Brand'}</div><div class="sidebar-item active">⌂ Dashboard</div><div class="sidebar-item">▣ Records</div><div class="sidebar-item">♟ Users</div><div class="sidebar-item">⚙ Settings</div></div>`;
      case 'tabs': return `<div class="element-content"><span class="tab-item active">Overview</span><span class="tab-item">Details</span><span class="tab-item">Activity</span></div>`;
      case 'table': return `<div class="element-content"><table class="fake-table"><thead><tr><th>Name</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody><tr><td>Sample record</td><td>Active</td><td>Aug 3, 2026</td><td>View</td></tr><tr><td>Another record</td><td>Pending</td><td>Aug 2, 2026</td><td>Edit</td></tr><tr><td>Third record</td><td>Complete</td><td>Aug 1, 2026</td><td>View</td></tr></tbody></table></div>`;
      case 'chart': return `<div class="element-content"><span class="chart-bar" style="height:42%"></span><span class="chart-bar" style="height:68%"></span><span class="chart-bar" style="height:52%"></span><span class="chart-bar" style="height:88%"></span><span class="chart-bar" style="height:74%"></span><span class="chart-bar" style="height:96%"></span><span class="chart-bar" style="height:63%"></span></div>`;
      case 'progress': return `<div class="element-content"><div class="progress-track"><div class="progress-fill"></div></div></div>`;
      case 'browser': return `<div class="element-content"><div class="browser-bar"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-address"></span></div><div class="browser-content">${text}</div></div>`;
      case 'phone': return `<div class="element-content"><div class="phone-speaker"></div><div class="phone-content">${text}</div></div>`;
      case 'modal': {
        const lines = String(p.text || '').split('\n');
        return `<div class="element-content"><div class="modal-title">${escapeHtml(lines.shift() || 'Modal title')}</div><div>${escapeHtml(lines.join(' ') || 'Modal message')}</div><div class="modal-actions"><span class="modal-mini-btn">Cancel</span><span class="modal-mini-btn">Confirm</span></div></div>`;
      }
      case 'toast': return `<div class="element-content"><span class="toast-icon">✓</span><span>${text}</span></div>`;
      case 'flow-decision': return `<div class="element-content"><span class="decision-label">${text}</span></div>`;
      case 'flow-database': return `<div class="element-content"><span>${text}</span></div>`;
      case 'connector': return `<div class="element-content"><div class="connector-line"></div></div>`;
      case 'divider': return `<div class="element-content"><div class="divider-line"></div></div>`;
      case 'bottomnav': return `<div class="element-content"><span class="bottom-nav-item"><b>⌂</b>Home</span><span class="bottom-nav-item"><b>⌕</b>Search</span><span class="bottom-nav-item"><b>＋</b>Add</span><span class="bottom-nav-item"><b>♟</b>Profile</span></div>`;
      default: return `<div class="element-content">${text}</div>`;
    }
  }

  function renderLibrary() {
    dom.componentLibrary.innerHTML = catalog.map(group => `
      <section class="component-group" data-group="${escapeHtml(group.group.toLowerCase())}">
        <div class="component-group-title">${escapeHtml(group.group)}<span>${group.items.length}</span></div>
        <div class="component-grid">
          ${group.items.map(([type, icon, label]) => `<div class="component-item" draggable="true" data-component="${type}" data-search="${escapeHtml(`${label} ${group.group}`.toLowerCase())}" title="Drag to canvas or click to add"><span class="component-icon">${escapeHtml(icon)}</span><span class="component-label">${escapeHtml(label)}</span></div>`).join('')}
        </div>
      </section>`).join('');

    $$('.component-item', dom.componentLibrary).forEach(item => {
      item.addEventListener('dragstart', event => {
        event.dataTransfer.setData('application/x-brainstorming-component', item.dataset.component);
        event.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('click', () => addComponent(item.dataset.component));
    });
  }

  function renderTemplates() {
    dom.templateList.innerHTML = templates.map(template => `
      <article class="template-card" data-template="${template.id}">
        <div class="template-preview ${template.preview}"></div>
        <div class="template-info"><strong>${escapeHtml(template.name)}</strong><span>${escapeHtml(template.description)}</span></div>
      </article>`).join('');
    $$('.template-card', dom.templateList).forEach(card => card.addEventListener('click', () => applyTemplate(card.dataset.template)));
  }

  function renderProject() {
    dom.projectName.value = project.name;
    renderPages();
    renderCanvas();
    updateHistoryButtons();
    updateSaveStatus();
  }

  function renderCanvas() {
    const page = currentPage();
    dom.artboard.style.width = `${page.width}px`;
    dom.artboard.style.height = `${page.height}px`;
    dom.artboard.style.backgroundColor = page.background || '#ffffff';
    dom.artboard.style.transform = `scale(${zoom})`;
    dom.artboard.classList.toggle('grid-enabled', dom.gridToggle.checked);
    dom.artboard.innerHTML = '';
    [...page.elements].sort((a,b) => a.z-b.z).forEach(element => dom.artboard.appendChild(renderElementNode(element)));
    dom.canvasSizeStatus.textContent = `${page.width} × ${page.height}`;
    dom.artboardStage.style.minWidth = `${Math.max(page.width * zoom + 160, dom.workspaceInner.clientWidth)}px`;
    dom.artboardStage.style.minHeight = `${Math.max(page.height * zoom + 160, dom.workspaceInner.clientHeight)}px`;
    updatePageSizeSelect(page.width, page.height);
    renderLayers();
    updateSelectionUI();
  }

  function renderElementNode(element) {
    const node = document.createElement('div');
    node.className = `mock-element wf-${element.type}`;
    node.dataset.id = element.id;
    node.dataset.name = element.name;
    node.style.left = `${element.x}px`;
    node.style.top = `${element.y}px`;
    node.style.width = `${element.w}px`;
    node.style.height = `${element.h}px`;
    node.style.transform = `rotate(${element.rotation || 0}deg)`;
    node.style.opacity = `${(element.opacity ?? 100) / 100}`;
    node.style.zIndex = element.z;
    node.classList.toggle('locked', !!element.locked);
    node.classList.toggle('hidden-element', !!element.hidden);
    node.classList.toggle('selected', element.id === selectedId);
    node.innerHTML = componentMarkup(element) + ['nw','n','ne','e','se','s','sw','w'].map(dir => `<span class="resize-handle" data-dir="${dir}"></span>`).join('');

    const content = $('.element-content', node);
    if (content) {
      const p = element.props;
      content.style.backgroundColor = p.background || '#ffffff';
      content.style.color = p.color || '#293142';
      content.style.border = `${Number(p.borderWidth) || 0}px solid ${p.borderColor || '#7b8492'}`;
      content.style.borderRadius = `${Number(p.radius) || 0}px`;
      content.style.boxShadow = shadowValue(p.shadow);
      content.style.fontSize = `${Number(p.fontSize) || 16}px`;
      content.style.fontWeight = p.fontWeight || '400';
      content.style.textAlign = p.textAlign || 'left';
      content.style.lineHeight = String(p.lineHeight || 1.3);
      if (['text','heading','paragraph','card','note','list','stat','accordion'].includes(element.type)) content.style.padding = element.type === 'text' || element.type === 'heading' ? '2px 4px' : '12px';
      if (p.textAlign === 'center' && !['textarea','note','paragraph'].includes(element.type)) content.style.justifyContent = 'center';
      if (p.textAlign === 'right') content.style.justifyContent = 'flex-end';
      if (element.type === 'phone') {
        content.style.border = '8px solid #252a34';
        content.style.borderRadius = `${Number(p.radius) || 34}px`;
      }
    }

    node.addEventListener('pointerdown', onElementPointerDown);
    node.addEventListener('dblclick', () => {
      selectElement(element.id);
      const textField = $('#propText');
      if (!textField.closest('[hidden]')) { textField.focus(); textField.select(); }
    });
    return node;
  }

  function refreshElement(id) {
    const element = currentPage().elements.find(item => item.id === id);
    const oldNode = dom.artboard.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!element || !oldNode) return renderCanvas();
    oldNode.replaceWith(renderElementNode(element));
    renderLayers();
    updateSelectionUI();
  }

  function renderPages() {
    dom.pagesList.innerHTML = project.pages.map((page, index) => `
      <div class="page-item ${page.id === project.currentPageId ? 'active' : ''}" data-page-id="${page.id}">
        <div class="page-thumb">${page.width}×${page.height}</div>
        <div class="page-meta"><strong>${escapeHtml(page.name)}</strong><span>${page.elements.length} object${page.elements.length === 1 ? '' : 's'}</span></div>
        <span class="page-number">${index + 1}</span>
      </div>`).join('');
    $$('.page-item', dom.pagesList).forEach(item => item.addEventListener('click', () => switchPage(item.dataset.pageId)));
    dom.pageNameInput.value = currentPage().name;
    dom.pageBackgroundInput.value = safeColor(currentPage().background, '#ffffff');
  }

  function renderLayers() {
    const elements = [...currentPage().elements].sort((a,b) => b.z-a.z);
    if (!elements.length) {
      dom.layersList.innerHTML = '<div class="empty-state"><div class="empty-icon">▱</div><strong>No layers yet</strong><p>Drag components onto the canvas to create layers.</p></div>';
      return;
    }
    dom.layersList.innerHTML = elements.map(element => `
      <div class="layer-item ${element.id === selectedId ? 'active' : ''}" data-layer-id="${element.id}">
        <span class="layer-icon">${escapeHtml(componentIcon(element.type))}</span>
        <span class="layer-name" title="${escapeHtml(element.name)}">${escapeHtml(element.name)}</span>
        <button class="layer-control" data-layer-action="lock" title="${element.locked ? 'Unlock' : 'Lock'}">${element.locked ? '🔒' : '🔓'}</button>
        <button class="layer-control" data-layer-action="visibility" title="${element.hidden ? 'Show' : 'Hide'}">${element.hidden ? '◌' : '●'}</button>
      </div>`).join('');
    $$('.layer-item', dom.layersList).forEach(item => {
      item.addEventListener('click', event => {
        const element = currentPage().elements.find(el => el.id === item.dataset.layerId);
        const action = event.target.closest('[data-layer-action]')?.dataset.layerAction;
        if (action === 'lock') { element.locked = !element.locked; markChanged(); pushHistory(); refreshElement(element.id); return; }
        if (action === 'visibility') { element.hidden = !element.hidden; markChanged(); pushHistory(); refreshElement(element.id); return; }
        selectElement(item.dataset.layerId);
      });
    });
  }

  function componentIcon(type) {
    for (const group of catalog) {
      const item = group.items.find(entry => entry[0] === type);
      if (item) return item[1];
    }
    return '◇';
  }

  function selectElement(id) {
    selectedId = id;
    $$('.mock-element.selected', dom.artboard).forEach(node => node.classList.remove('selected'));
    if (id) dom.artboard.querySelector(`[data-id="${CSS.escape(id)}"]`)?.classList.add('selected');
    updateSelectionUI();
    renderLayers();
  }

  function updateSelectionUI() {
    const element = selectedElement();
    dom.emptyProperties.hidden = !!element;
    dom.propertiesForm.hidden = !element;
    dom.duplicateBtn.disabled = !element;
    dom.deleteBtn.disabled = !element;
    dom.bringFrontBtn.disabled = !element;
    dom.sendBackBtn.disabled = !element;
    if (!element) {
      dom.selectionStatus.textContent = 'No selection';
      return;
    }
    dom.selectionStatus.textContent = `${element.name} · ${Math.round(element.w)} × ${Math.round(element.h)}`;
    dom.coordinateStatus.textContent = `X: ${Math.round(element.x)}, Y: ${Math.round(element.y)}`;

    const values = {
      propName: element.name, propX: element.x, propY: element.y, propW: element.w, propH: element.h,
      propRotation: element.rotation, propOpacity: element.opacity,
      propText: element.props.text, propUrl: element.props.url, propBackground: safeColor(element.props.background, '#ffffff'),
      propColor: safeColor(element.props.color, '#293142'), propBorderColor: safeColor(element.props.borderColor, '#7b8492'),
      propBorderWidth: element.props.borderWidth, propRadius: element.props.radius, propShadow: element.props.shadow,
      propFontSize: element.props.fontSize, propFontWeight: element.props.fontWeight, propTextAlign: element.props.textAlign,
      propLineHeight: element.props.lineHeight
    };
    Object.entries(values).forEach(([id,value]) => { const field = document.getElementById(id); if (field && document.activeElement !== field) field.value = value ?? ''; });
    dom.lockBtn.textContent = element.locked ? 'Unlock' : 'Lock';
    dom.hideBtn.textContent = element.hidden ? 'Show' : 'Hide';
    dom.imageField.hidden = element.type !== 'image';
    dom.urlField.hidden = !['button','link','image'].includes(element.type);
    $('#typographySection').hidden = ['image','divider','chart','progress','connector'].includes(element.type);
    $('#contentSection').hidden = ['divider','chart','progress','connector','table','tabs','bottomnav'].includes(element.type);
  }

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
  }

  function addComponent(type, x, y, overrides = {}) {
    const page = currentPage();
    const prototype = defaultElement(type, 0, 0);
    const boardRect = dom.artboard.getBoundingClientRect();
    const workspaceRect = dom.workspaceInner.getBoundingClientRect();
    const centerX = (workspaceRect.left + workspaceRect.width / 2 - boardRect.left) / zoom;
    const centerY = (workspaceRect.top + workspaceRect.height / 2 - boardRect.top) / zoom;
    prototype.x = snap(x ?? clamp(centerX - prototype.w / 2, 0, page.width - prototype.w));
    prototype.y = snap(y ?? clamp(centerY - prototype.h / 2, 0, page.height - prototype.h));
    Object.assign(prototype, overrides);
    if (overrides.props) prototype.props = { ...prototype.props, ...overrides.props };
    page.elements.push(prototype);
    selectedId = prototype.id;
    if (window.matchMedia('(max-width: 900px)').matches) document.body.classList.remove('show-library','show-properties');
    markChanged();
    pushHistory();
    renderCanvas();
    toast(`${prototype.name} added`, 'success');
    return prototype;
  }

  function onElementPointerDown(event) {
    if (currentTool !== 'select') return;
    event.stopPropagation();
    const node = event.currentTarget;
    const element = currentPage().elements.find(item => item.id === node.dataset.id);
    if (!element) return;
    selectElement(element.id);
    if (element.locked) return;
    const handle = event.target.closest('.resize-handle');
    interaction = {
      mode: handle ? 'resize' : 'move', dir: handle?.dataset.dir || '', id: element.id,
      startX: event.clientX, startY: event.clientY,
      original: { x: element.x, y: element.y, w: element.w, h: element.h }, moved: false
    };
    node.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event) {
    const pageRect = dom.artboard.getBoundingClientRect();
    if (event.clientX >= pageRect.left && event.clientX <= pageRect.right && event.clientY >= pageRect.top && event.clientY <= pageRect.bottom) {
      dom.coordinateStatus.textContent = `X: ${Math.round((event.clientX-pageRect.left)/zoom)}, Y: ${Math.round((event.clientY-pageRect.top)/zoom)}`;
    }
    if (!interaction) return;
    if (interaction.mode === 'pan') {
      const dx = event.clientX - interaction.startX;
      const dy = event.clientY - interaction.startY;
      dom.workspaceInner.scrollLeft = interaction.scrollLeft - dx;
      dom.workspaceInner.scrollTop = interaction.scrollTop - dy;
      dom.workspaceInner.classList.add('panning');
      return;
    }
    const element = currentPage().elements.find(item => item.id === interaction.id);
    if (!element) return;
    const dx = (event.clientX - interaction.startX) / zoom;
    const dy = (event.clientY - interaction.startY) / zoom;
    interaction.moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (interaction.mode === 'move') {
      element.x = clamp(snap(interaction.original.x + dx), 0, currentPage().width - element.w);
      element.y = clamp(snap(interaction.original.y + dy), 0, currentPage().height - element.h);
    } else {
      resizeElement(element, interaction.dir, dx, dy, interaction.original);
    }
    const node = dom.artboard.querySelector(`[data-id="${CSS.escape(element.id)}"]`);
    if (node) {
      node.style.left = `${element.x}px`; node.style.top = `${element.y}px`;
      node.style.width = `${element.w}px`; node.style.height = `${element.h}px`;
    }
    dom.selectionStatus.textContent = `${element.name} · ${Math.round(element.w)} × ${Math.round(element.h)}`;
    dom.coordinateStatus.textContent = `X: ${Math.round(element.x)}, Y: ${Math.round(element.y)}`;
    updatePropertiesPosition(element);
  }

  function resizeElement(element, dir, dx, dy, original) {
    const minW = 20, minH = 20;
    let x = original.x, y = original.y, w = original.w, h = original.h;
    if (dir.includes('e')) w = Math.max(minW, snap(original.w + dx));
    if (dir.includes('s')) h = Math.max(minH, snap(original.h + dy));
    if (dir.includes('w')) { w = Math.max(minW, snap(original.w - dx)); x = snap(original.x + (original.w - w)); }
    if (dir.includes('n')) { h = Math.max(minH, snap(original.h - dy)); y = snap(original.y + (original.h - h)); }
    if (x < 0) { w += x; x = 0; }
    if (y < 0) { h += y; y = 0; }
    if (x + w > currentPage().width) w = currentPage().width - x;
    if (y + h > currentPage().height) h = currentPage().height - y;
    Object.assign(element, { x, y, w, h });
  }

  function updatePropertiesPosition(element) {
    [['propX',element.x],['propY',element.y],['propW',element.w],['propH',element.h]].forEach(([id,value]) => {
      const field = document.getElementById(id); if (document.activeElement !== field) field.value = Math.round(value);
    });
  }

  function endInteraction() {
    if (!interaction) return;
    const changed = interaction.moved;
    interaction = null;
    dom.workspaceInner.classList.remove('panning');
    if (changed) { markChanged(); pushHistory(); renderLayers(); }
  }

  function duplicateSelected(offset = 20) {
    const element = selectedElement();
    if (!element) return;
    const copy = JSON.parse(JSON.stringify(element));
    copy.id = uid('el'); copy.name = `${element.name} Copy`; copy.x = clamp(element.x + offset, 0, currentPage().width - element.w); copy.y = clamp(element.y + offset, 0, currentPage().height - element.h); copy.z = nextZ();
    currentPage().elements.push(copy); selectedId = copy.id; markChanged(); pushHistory(); renderCanvas();
  }

  function deleteSelected() {
    if (!selectedId) return;
    const index = currentPage().elements.findIndex(element => element.id === selectedId);
    if (index < 0) return;
    currentPage().elements.splice(index, 1); selectedId = null; normalizeZ(); markChanged(); pushHistory(); renderCanvas();
  }

  function normalizeZ() {
    [...currentPage().elements].sort((a,b)=>a.z-b.z).forEach((element,index)=>element.z=index+1);
  }

  function arrangeSelected(direction) {
    const element = selectedElement(); if (!element) return;
    const page = currentPage();
    if (direction === 'front') element.z = nextZ();
    else { const min = Math.min(...page.elements.map(item=>item.z)); element.z = min - 1; }
    normalizeZ(); markChanged(); pushHistory(); renderCanvas();
  }

  function alignSelected(align) {
    const element = selectedElement(); if (!element) return;
    const page = currentPage();
    if (align === 'left') element.x = 0;
    if (align === 'center') element.x = (page.width-element.w)/2;
    if (align === 'right') element.x = page.width-element.w;
    if (align === 'top') element.y = 0;
    if (align === 'middle') element.y = (page.height-element.h)/2;
    if (align === 'bottom') element.y = page.height-element.h;
    element.x = snap(element.x); element.y = snap(element.y);
    markChanged(); pushHistory(); refreshElement(element.id);
  }

  function setZoom(value) {
    zoom = clamp(Number(value) || 1, .25, 2);
    dom.zoomSelect.value = String(zoom);
    renderCanvas();
  }

  function fitCanvas() {
    const page = currentPage();
    const availableW = dom.workspaceInner.clientWidth - 140;
    const availableH = dom.workspaceInner.clientHeight - 140;
    const fit = Math.min(availableW/page.width, availableH/page.height, 1);
    const options = [.25,.5,.75,1,1.25,1.5,2];
    setZoom(options.reduce((best,value) => Math.abs(value-fit)<Math.abs(best-fit)?value:best, options[0]));
    dom.workspaceInner.scrollTo({left:0,top:0});
  }

  function setTool(tool) {
    currentTool = tool;
    dom.selectToolBtn.classList.toggle('active', tool === 'select');
    dom.handToolBtn.classList.toggle('active', tool === 'hand');
    dom.workspaceInner.classList.toggle('hand-mode', tool === 'hand');
  }

  function switchPage(pageId) {
    if (!project.pages.some(page => page.id === pageId)) return;
    project.currentPageId = pageId; selectedId = null; renderCanvas(); renderPages(); autosave();
  }

  function addPage() {
    const id = uid('page');
    project.pages.push({ id, name: `Page ${project.pages.length+1}`, width: currentPage().width, height: currentPage().height, background: '#ffffff', elements: [] });
    project.currentPageId = id; selectedId = null; markChanged(); pushHistory(); renderProject();
  }

  function duplicatePage() {
    const original = currentPage();
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = uid('page'); copy.name = `${original.name} Copy`;
    copy.elements.forEach(element => element.id = uid('el'));
    project.pages.splice(project.pages.indexOf(original)+1,0,copy); project.currentPageId=copy.id; selectedId=null; markChanged(); pushHistory(); renderProject();
  }

  function deletePage() {
    if (project.pages.length === 1) { toast('A project must contain at least one page.', 'error'); return; }
    const index = project.pages.findIndex(page => page.id === project.currentPageId);
    if (!confirm(`Delete ${currentPage().name}?`)) return;
    project.pages.splice(index,1); project.currentPageId = project.pages[Math.max(0,index-1)].id; selectedId=null; markChanged(); pushHistory(); renderProject();
  }

  function resizePage(width, height) {
    const page = currentPage(); page.width=Number(width); page.height=Number(height);
    page.elements.forEach(element => { element.x = clamp(element.x,0,Math.max(0,page.width-element.w)); element.y=clamp(element.y,0,Math.max(0,page.height-element.h)); });
    markChanged(); pushHistory(); renderCanvas(); renderPages();
  }

  function updatePageSizeSelect(width,height) {
    const match = Object.entries(pageSizes).find(([,size]) => size[0]===width && size[1]===height);
    dom.pageSizeSelect.value = match ? match[0] : 'custom';
  }

  function applyTemplate(templateId) {
    const page = currentPage();
    if (page.elements.length && !confirm('Replace the current page with this template?')) return;
    page.elements = [];
    selectedId = null;
    if (templateId === 'blank') { page.width=1440; page.height=900; }
    if (templateId === 'mobile-login') {
      page.width=390; page.height=844;
      templateElement(page,'heading',45,130,{w:300,h:55,props:{text:'Welcome Back',fontSize:30,textAlign:'center'}});
      templateElement(page,'paragraph',50,190,{w:290,h:55,props:{text:'Sign in to continue to your account.',textAlign:'center',color:'#667085'}});
      templateElement(page,'input',45,285,{w:300,props:{text:'Email address'}});
      templateElement(page,'input',45,350,{w:300,props:{text:'Password'}});
      templateElement(page,'checkbox',45,412,{w:180,props:{text:'Remember me'}});
      templateElement(page,'link',235,412,{w:115,props:{text:'Forgot password?',textAlign:'right'}});
      templateElement(page,'button',45,470,{w:300,h:48,props:{text:'Sign In'}});
      templateElement(page,'divider',45,550,{w:300});
      templateElement(page,'paragraph',45,580,{w:300,h:40,props:{text:'No account? Create one',textAlign:'center'}});
    }
    if (templateId === 'dashboard') {
      page.width=1440; page.height=900;
      templateElement(page,'sidebar',0,0,{w:240,h:900});
      templateElement(page,'navbar',240,0,{w:1200,h:70,props:{text:'Admin Dashboard'}});
      templateElement(page,'heading',285,105,{w:430,h:50,props:{text:'Dashboard Overview',fontSize:28}});
      ['Total Users\n12,480','New Orders\n1,204','Revenue\n₱284,000','Open Tasks\n36'].forEach((text,index)=>templateElement(page,'stat',285+index*270,180,{w:235,h:125,props:{text}}));
      templateElement(page,'chart',285,345,{w:600,h:300});
      templateElement(page,'card',915,345,{w:440,h:300,props:{text:'Recent Activity\n• New user registration\n• Payment received\n• Report generated\n• Record updated'}});
      templateElement(page,'table',285,680,{w:1070,h:180});
    }
    if (templateId === 'app-listing') {
      page.width=1440; page.height=900;
      templateElement(page,'navbar',0,0,{w:1440,h:70,props:{text:'Brainstorming Apps'}});
      templateElement(page,'image',120,150,{w:180,h:180,props:{text:'App Icon',radius:30}});
      templateElement(page,'heading',340,150,{w:640,h:55,props:{text:'Application Name',fontSize:36}});
      templateElement(page,'paragraph',340,215,{w:600,h:36,props:{text:'Developed by Your Company',color:'#5a4be7'}});
      templateElement(page,'badge',340,270,{w:110,props:{text:'Version 1.0'}});
      templateElement(page,'badge',465,270,{w:130,props:{text:'Android App',background:'#e9f2ff',color:'#285b9a'}});
      templateElement(page,'button',340,330,{w:200,h:50,props:{text:'Download APK'}});
      templateElement(page,'heading',120,430,{w:420,h:42,props:{text:'About this app',fontSize:25}});
      templateElement(page,'paragraph',120,485,{w:880,h:130,props:{text:'Provide the complete application description, key features, compatibility details, and update information here.',fontSize:17,lineHeight:1.6}});
      templateElement(page,'card',1050,150,{w:270,h:465,props:{text:'App Information\n\nVersion: 1.0\nSize: 24 MB\nUpdated: Aug 3, 2026\nDeveloper: Your Name\nCategory: Productivity'}});
    }
    if (templateId === 'flowchart') {
      page.width=1400; page.height=900;
      templateElement(page,'heading',420,35,{w:560,h:55,props:{text:'SYSTEM PROCESS FLOW',textAlign:'center',fontSize:30}});
      templateElement(page,'flow-start',610,120,{props:{text:'START'}});
      templateElement(page,'connector',615,205,{w:170,rotation:90});
      templateElement(page,'flow-process',585,275,{props:{text:'User: Opens the system.'}});
      templateElement(page,'connector',615,380,{w:170,rotation:90});
      templateElement(page,'flow-decision',625,450,{props:{text:'Valid account?'}});
      templateElement(page,'connector',615,625,{w:170,rotation:90});
      templateElement(page,'flow-process',585,695,{props:{text:'System: Shows dashboard.'}});
      templateElement(page,'flow-start',610,810,{props:{text:'END',background:'#ffe9eb',color:'#8a2632',borderColor:'#c94c5a'}});
    }
    markChanged(); pushHistory(); renderProject(); toast(`${templates.find(t=>t.id===templateId)?.name || 'Template'} applied`, 'success');
  }

  function templateElement(page,type,x,y,overrides={}) {
    const el = defaultElement(type,x,y); Object.assign(el,overrides); if (overrides.props) el.props={...el.props,...overrides.props}; el.z=page.elements.length+1; page.elements.push(el); return el;
  }

  function applyProperty(prop, rawValue) {
    const element = selectedElement(); if (!element) return;
    const numericTop = ['x','y','w','h','rotation','opacity'];
    const numericProps = ['borderWidth','radius','fontSize','lineHeight'];
    let value = rawValue;
    if (numericTop.includes(prop) || numericProps.includes(prop)) value = Number(rawValue);
    if (prop === 'name') element.name = String(value || labelForType(element.type));
    else if (numericTop.includes(prop)) {
      if (prop==='x') element.x=clamp(value,0,currentPage().width-element.w);
      else if (prop==='y') element.y=clamp(value,0,currentPage().height-element.h);
      else if (prop==='w') element.w=clamp(value,10,currentPage().width-element.x);
      else if (prop==='h') element.h=clamp(value,10,currentPage().height-element.y);
      else if (prop==='opacity') element.opacity=clamp(value,0,100);
      else element[prop]=value;
    } else element.props[prop]=value;
    markChanged(); refreshElement(element.id);
  }

  function bindProperties() {
    $$('[data-prop]', dom.propertiesForm).forEach(field => {
      field.addEventListener('input', () => applyProperty(field.dataset.prop, field.value));
      field.addEventListener('change', pushHistory);
    });
    dom.lockBtn.addEventListener('click', () => { const el=selectedElement(); if(!el)return; el.locked=!el.locked; markChanged(); pushHistory(); refreshElement(el.id); });
    dom.hideBtn.addEventListener('click', () => { const el=selectedElement(); if(!el)return; el.hidden=!el.hidden; markChanged(); pushHistory(); refreshElement(el.id); });
    dom.imageUpload.addEventListener('change', event => {
      const file=event.target.files[0], el=selectedElement(); if(!file||!el||el.type!=='image')return;
      if (!file.type.startsWith('image/')) { toast('Please select a valid image file.','error'); return; }
      const reader=new FileReader(); reader.onload=()=>{el.props.imageSrc=reader.result; markChanged(); pushHistory(); refreshElement(el.id);}; reader.readAsDataURL(file); event.target.value='';
    });
    dom.removeImageBtn.addEventListener('click',()=>{const el=selectedElement();if(!el)return;el.props.imageSrc='';markChanged();pushHistory();refreshElement(el.id);});
    $$('.align-grid [data-align]').forEach(button=>button.addEventListener('click',()=>alignSelected(button.dataset.align)));
  }

  function markChanged() {
    dirty = true;
    updateSaveStatus();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autosave, 350);
  }

  function updateSaveStatus() {
    dom.saveStatus.textContent = dirty ? 'Unsaved changes' : 'Saved locally';
  }

  function autosave() {
    try {
      project.name = dom.projectName.value.trim() || 'Untitled Mockup';
      localStorage.setItem('brainstorming_mockup_project', JSON.stringify(project));
      dirty = false; updateSaveStatus();
    } catch (error) {
      dom.saveStatus.textContent = 'Local save failed';
      console.warn(error);
    }
  }

  function pushHistory() {
    if (!project) return;
    const snapshot = JSON.stringify(project);
    if (history[historyIndex] === snapshot) return;
    history = history.slice(0,historyIndex+1);
    history.push(snapshot);
    if (history.length > 60) history.shift();
    historyIndex = history.length-1;
    updateHistoryButtons();
  }

  function restoreHistory(index) {
    if (index < 0 || index >= history.length) return;
    historyIndex=index; project=JSON.parse(history[index]); selectedId=null; markChanged(); renderProject(); updateHistoryButtons();
  }

  function updateHistoryButtons() {
    dom.undoBtn.disabled=historyIndex<=0; dom.redoBtn.disabled=historyIndex>=history.length-1;
  }

  function normalizeProjectData(data) {
    if (!data || !Array.isArray(data.pages) || !data.pages.length) throw new Error('Invalid project structure');
    data.name = String(data.name || 'Untitled Mockup');
    data.app = data.app || 'Brainstorming Mockup Generator';
    data.version = Number(data.version) || 1;
    data.pages.forEach((page, pageIndex) => {
      page.id = page.id || uid('page');
      page.name = String(page.name || `Page ${pageIndex + 1}`);
      page.width = clamp(Number(page.width) || 1440, 200, 5000);
      page.height = clamp(Number(page.height) || 900, 200, 5000);
      page.background = safeColor(page.background, '#ffffff');
      if (!Array.isArray(page.elements)) page.elements = [];
      page.elements.forEach((element, index) => {
        element.id = element.id || uid('el');
        element.type = element.type || 'box';
        element.name = String(element.name || labelForType(element.type));
        element.x = Number(element.x) || 0;
        element.y = Number(element.y) || 0;
        element.w = clamp(Math.max(10, Number(element.w) || 180), 10, page.width);
        element.h = clamp(Math.max(10, Number(element.h) || 48), 10, page.height);
        element.rotation = Number(element.rotation) || 0;
        element.opacity = clamp(Number(element.opacity ?? 100), 0, 100);
        element.z = Number(element.z) || index + 1;
        element.locked = !!element.locked;
        element.hidden = !!element.hidden;
        element.props = {
          text: '', url: '', imageSrc: '', background: '#ffffff', color: '#293142', borderColor: '#7b8492',
          borderWidth: 1, radius: 6, shadow: 'none', fontSize: 16, fontWeight: '400', textAlign: 'left', lineHeight: 1.3,
          ...(element.props || {})
        };
        element.x = clamp(element.x, 0, Math.max(0, page.width - element.w));
        element.y = clamp(element.y, 0, Math.max(0, page.height - element.h));
      });
    });
    if (!data.currentPageId || !data.pages.some(page => page.id === data.currentPageId)) data.currentPageId = data.pages[0].id;
    return data;
  }

  function saveProjectFile() {
    autosave();
    const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});
    downloadBlob(blob,`${fileSafe(project.name)}.brainstorming.json`);
    toast('Project file downloaded.','success');
  }

  function openProjectFile(file) {
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const parsed=normalizeProjectData(JSON.parse(reader.result));
        project=parsed; selectedId=null; history=[];historyIndex=-1;pushHistory();markChanged();renderProject();toast('Project opened successfully.','success');
      } catch(error) { toast(`Unable to open project: ${error.message}`,'error'); }
    };
    reader.readAsText(file);
  }

  function downloadBlob(blob, filename) {
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function loadExternalScript(urls, isReady) {
    if (isReady()) return;
    let lastError = null;
    for (const url of urls) {
      try {
        await new Promise((resolve, reject) => {
          let script = document.querySelector(`script[data-dynamic-src="${url}"]`);
          if (script && isReady()) return resolve();
          if (script) script.remove();
          script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.dataset.dynamicSrc = url;
          const timer = setTimeout(() => {
            script.remove();
            reject(new Error(`Timed out while loading ${url}`));
          }, 12000);
          script.onload = () => { clearTimeout(timer); resolve(); };
          script.onerror = () => {
            clearTimeout(timer);
            script.remove();
            reject(new Error(`Unable to load ${url}`));
          };
          document.head.appendChild(script);
        });
        if (isReady()) return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Required export library could not be loaded.');
  }

  async function ensureHtml2Canvas() {
    await loadExternalScript([
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
    ], () => typeof window.html2canvas === 'function');
  }

  async function ensureJsPdf() {
    await loadExternalScript([
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
    ], () => !!window.jspdf?.jsPDF);
  }

  function fileSafe(name) { return String(name||'mockup').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'') || 'mockup'; }

  async function canvasSnapshot(scale=2) {
    await ensureHtml2Canvas();
    const previous=selectedId;
    const previousTransform=dom.artboard.style.transform;
    selectElement(null);
    dom.artboard.classList.add('exporting');
    dom.artboard.style.transform='none';
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    try {
      return await window.html2canvas(dom.artboard,{backgroundColor:currentPage().background||'#ffffff',scale,useCORS:true,logging:false,width:currentPage().width,height:currentPage().height,windowWidth:currentPage().width,windowHeight:currentPage().height});
    } finally {
      dom.artboard.style.transform=previousTransform;
      dom.artboard.classList.remove('exporting');
      if(previous)selectElement(previous);
    }
  }

  async function exportPNG() {
    try { const canvas=await canvasSnapshot(2); canvas.toBlob(blob=>downloadBlob(blob,`${fileSafe(project.name)}-${fileSafe(currentPage().name)}.png`),'image/png'); toast('High-resolution PNG exported.','success'); }
    catch(error){toast(error.message,'error');}
  }

  async function exportPDF() {
    try {
      await ensureJsPdf();
      const canvas=await canvasSnapshot(2); const page=currentPage(); const mm=0.264583; const pw=page.width*mm, ph=page.height*mm;
      const pdf=new window.jspdf.jsPDF({orientation:pw>ph?'landscape':'portrait',unit:'mm',format:[pw,ph],compress:true});
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,pw,ph,undefined,'FAST');
      pdf.save(`${fileSafe(project.name)}-${fileSafe(page.name)}.pdf`); toast('PDF exported.','success');
    } catch(error){toast(error.message,'error');}
  }

  async function printCurrentPage() {
    try {
      const canvas=await canvasSnapshot(2); const data=canvas.toDataURL('image/png'); const win=window.open('','_blank','width=1100,height=800');
      if(!win)throw new Error('The print window was blocked. Allow pop-ups and try again.');
      win.document.write(`<!doctype html><html><head><title>${escapeHtml(project.name)} — ${escapeHtml(currentPage().name)}</title><style>@page{margin:0;size:auto}html,body{margin:0;padding:0;background:white}img{display:block;width:100%;height:auto;page-break-inside:avoid}</style></head><body><img src="${data}" alt="Mockup"></body></html>`);
      win.document.close(); win.focus(); win.onload=()=>setTimeout(()=>{win.print();},200);
    } catch(error){toast(error.message,'error');}
  }

  function showPreview() {
    const clone=dom.artboard.cloneNode(true); clone.removeAttribute('id'); clone.classList.add('previewing'); clone.classList.remove('grid-enabled'); clone.style.transform='none';
    $$('.mock-element',clone).forEach(node=>node.classList.remove('selected'));
    dom.previewBody.innerHTML=''; dom.previewBody.appendChild(clone); dom.previewModal.hidden=false;
  }

  function toast(message,type='') {
    const node=document.createElement('div');node.className=`app-toast ${type}`;node.textContent=message;dom.toastContainer.appendChild(node);setTimeout(()=>node.remove(),3200);
  }

  function filterComponents(query) {
    const value=query.trim().toLowerCase();
    $$('.component-group',dom.componentLibrary).forEach(group=>{
      let visible=0;
      $$('.component-item',group).forEach(item=>{const match=!value||item.dataset.search.includes(value);item.classList.toggle('filtered-out',!match);if(match)visible++;});
      group.classList.toggle('filtered-out',!visible);
    });
  }

  function setupTabs() {
    $$('[data-left-tab]').forEach(button=>button.addEventListener('click',()=>{
      $$('[data-left-tab]').forEach(btn=>btn.classList.toggle('active',btn===button));
      $$('.left-tab-content').forEach(tab=>tab.classList.remove('active'));
      document.getElementById(`${button.dataset.leftTab}Tab`).classList.add('active');
    }));
    $$('[data-right-tab]').forEach(button=>button.addEventListener('click',()=>{
      $$('[data-right-tab]').forEach(btn=>btn.classList.toggle('active',btn===button));
      $$('.right-tab-content').forEach(tab=>tab.classList.remove('active'));
      document.getElementById(`${button.dataset.rightTab}Tab`).classList.add('active');
    }));
  }

  function setupEvents() {
    setupTabs(); bindProperties();
    const closeMobilePanels=()=>document.body.classList.remove('show-library','show-properties');
    dom.mobileLibraryBtn.addEventListener('click',()=>{
      const open=!document.body.classList.contains('show-library');
      closeMobilePanels();
      if(open)document.body.classList.add('show-library');
    });
    dom.mobilePropertiesBtn.addEventListener('click',()=>{
      const open=!document.body.classList.contains('show-properties');
      closeMobilePanels();
      if(open)document.body.classList.add('show-properties');
    });
    dom.mobilePanelBackdrop.addEventListener('click',closeMobilePanels);
    dom.componentSearch.addEventListener('input',()=>filterComponents(dom.componentSearch.value));
    dom.artboard.addEventListener('pointerdown',event=>{if(event.target===dom.artboard&&currentTool==='select')selectElement(null);});
    dom.artboard.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-brainstorming-component')){event.preventDefault();dom.artboard.classList.add('drag-over');}});
    dom.artboard.addEventListener('dragleave',()=>dom.artboard.classList.remove('drag-over'));
    dom.artboard.addEventListener('drop',event=>{
      event.preventDefault();dom.artboard.classList.remove('drag-over');const type=event.dataTransfer.getData('application/x-brainstorming-component');if(!type)return;
      const rect=dom.artboard.getBoundingClientRect();const prototype=defaultElement(type);addComponent(type,(event.clientX-rect.left)/zoom-prototype.w/2,(event.clientY-rect.top)/zoom-prototype.h/2);
    });
    dom.workspaceInner.addEventListener('pointerdown',event=>{
      if(currentTool!=='hand'||event.button!==0)return;interaction={mode:'pan',startX:event.clientX,startY:event.clientY,scrollLeft:dom.workspaceInner.scrollLeft,scrollTop:dom.workspaceInner.scrollTop};event.preventDefault();
    });
    window.addEventListener('pointermove',onPointerMove);window.addEventListener('pointerup',endInteraction);window.addEventListener('pointercancel',endInteraction);

    dom.selectToolBtn.addEventListener('click',()=>setTool('select'));dom.handToolBtn.addEventListener('click',()=>setTool('hand'));
    dom.undoBtn.addEventListener('click',()=>restoreHistory(historyIndex-1));dom.redoBtn.addEventListener('click',()=>restoreHistory(historyIndex+1));
    dom.duplicateBtn.addEventListener('click',()=>duplicateSelected());dom.deleteBtn.addEventListener('click',deleteSelected);
    dom.bringFrontBtn.addEventListener('click',()=>arrangeSelected('front'));dom.sendBackBtn.addEventListener('click',()=>arrangeSelected('back'));
    dom.zoomSelect.addEventListener('change',()=>setZoom(dom.zoomSelect.value));dom.zoomInBtn.addEventListener('click',()=>setZoom(zoom+.25));dom.zoomOutBtn.addEventListener('click',()=>setZoom(zoom-.25));dom.fitBtn.addEventListener('click',fitCanvas);
    dom.gridToggle.addEventListener('change',()=>dom.artboard.classList.toggle('grid-enabled',dom.gridToggle.checked));
    dom.pageSizeSelect.addEventListener('change',()=>{const value=dom.pageSizeSelect.value;if(value==='custom'){dom.customWidth.value=currentPage().width;dom.customHeight.value=currentPage().height;dom.customSizeModal.hidden=false;}else resizePage(...pageSizes[value]);});
    dom.applyCustomSizeBtn.addEventListener('click',()=>{resizePage(clamp(Number(dom.customWidth.value),200,5000),clamp(Number(dom.customHeight.value),200,5000));dom.customSizeModal.hidden=true;});
    $$('[data-close-modal]').forEach(btn=>btn.addEventListener('click',()=>dom.customSizeModal.hidden=true));
    dom.previewBtn.addEventListener('click',showPreview);$$('[data-close-preview]').forEach(btn=>btn.addEventListener('click',()=>dom.previewModal.hidden=true));
    dom.previewModal.addEventListener('click',event=>{if(event.target===dom.previewModal)dom.previewModal.hidden=true;});

    dom.addPageBtn.addEventListener('click',addPage);dom.duplicatePageBtn.addEventListener('click',duplicatePage);dom.deletePageBtn.addEventListener('click',deletePage);
    dom.pageNameInput.addEventListener('input',()=>{currentPage().name=dom.pageNameInput.value.trim()||'Untitled Page';markChanged();renderPages();});
    dom.pageNameInput.addEventListener('change',pushHistory);
    dom.pageBackgroundInput.addEventListener('input',()=>{currentPage().background=dom.pageBackgroundInput.value;markChanged();dom.artboard.style.backgroundColor=currentPage().background;});
    dom.pageBackgroundInput.addEventListener('change',()=>{pushHistory();renderPages();});
    dom.clearCanvasBtn.addEventListener('click',()=>{if(!currentPage().elements.length)return;if(confirm('Remove every object from this page?')){currentPage().elements=[];selectedId=null;markChanged();pushHistory();renderCanvas();renderPages();}});
    dom.projectName.addEventListener('input',()=>{project.name=dom.projectName.value;markChanged();});dom.projectName.addEventListener('change',pushHistory);
    dom.newProjectBtn.addEventListener('click',()=>{if(dirty&&!confirm('Create a new project and discard unsaved changes?'))return;project=blankProject();selectedId=null;history=[];historyIndex=-1;pushHistory();markChanged();renderProject();fitCanvas();});
    dom.saveProjectBtn.addEventListener('click',saveProjectFile);dom.openProjectBtn.addEventListener('click',()=>dom.projectFileInput.click());dom.projectFileInput.addEventListener('change',event=>{const file=event.target.files[0];if(file)openProjectFile(file);event.target.value='';});
    dom.exportMenuBtn.addEventListener('click',event=>{event.stopPropagation();dom.exportMenu.hidden=!dom.exportMenu.hidden;dom.exportMenuBtn.setAttribute('aria-expanded',String(!dom.exportMenu.hidden));});
    dom.exportMenu.addEventListener('click',event=>{const action=event.target.dataset.export;if(!action)return;dom.exportMenu.hidden=true;if(action==='png')exportPNG();if(action==='pdf')exportPDF();if(action==='print')printCurrentPage();});
    document.addEventListener('click',event=>{if(!dom.exportMenu.contains(event.target)&&event.target!==dom.exportMenuBtn)dom.exportMenu.hidden=true;});
    window.addEventListener('resize',()=>{renderCanvas();});
    window.addEventListener('beforeunload',autosave);
    document.addEventListener('keydown',onKeyDown);
  }

  function onKeyDown(event) {
    if (isTypingTarget(event.target)) return;
    const ctrl=event.ctrlKey||event.metaKey;
    if(ctrl&&event.key.toLowerCase()==='z'){event.preventDefault();restoreHistory(event.shiftKey?historyIndex+1:historyIndex-1);return;}
    if(ctrl&&event.key.toLowerCase()==='y'){event.preventDefault();restoreHistory(historyIndex+1);return;}
    if(ctrl&&event.key.toLowerCase()==='s'){event.preventDefault();saveProjectFile();return;}
    if(ctrl&&event.key.toLowerCase()==='c'){const el=selectedElement();if(el)clipboard=JSON.parse(JSON.stringify(el));return;}
    if(ctrl&&event.key.toLowerCase()==='v'){if(clipboard){const copy=JSON.parse(JSON.stringify(clipboard));copy.id=uid('el');copy.name=`${copy.name} Copy`;copy.x=clamp(copy.x+20,0,currentPage().width-copy.w);copy.y=clamp(copy.y+20,0,currentPage().height-copy.h);copy.z=nextZ();currentPage().elements.push(copy);selectedId=copy.id;clipboard=JSON.parse(JSON.stringify(copy));markChanged();pushHistory();renderCanvas();}return;}
    if(ctrl&&event.key.toLowerCase()==='d'){event.preventDefault();duplicateSelected();return;}
    if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();deleteSelected();return;}
    if(event.key.toLowerCase()==='v'){setTool('select');return;}
    if(event.key.toLowerCase()==='h'){setTool('hand');return;}
    if(event.key==='Escape'){selectElement(null);dom.previewModal.hidden=true;dom.customSizeModal.hidden=true;return;}
    const el=selectedElement(); if(!el||el.locked)return;
    const amount=event.shiftKey?10:1;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();if(event.key==='ArrowLeft')el.x=clamp(el.x-amount,0,currentPage().width-el.w);if(event.key==='ArrowRight')el.x=clamp(el.x+amount,0,currentPage().width-el.w);if(event.key==='ArrowUp')el.y=clamp(el.y-amount,0,currentPage().height-el.h);if(event.key==='ArrowDown')el.y=clamp(el.y+amount,0,currentPage().height-el.h);markChanged();pushHistory();refreshElement(el.id);
    }
  }

  function initialize() {
    renderLibrary();renderTemplates();setupEvents();
    try { const saved=localStorage.getItem('brainstorming_mockup_project');project=saved?normalizeProjectData(JSON.parse(saved)):blankProject(); }
    catch { project=blankProject(); }
    pushHistory();renderProject();setTimeout(fitCanvas,80);
  }

  initialize();
})();
