function buildNav(root) {
  const nav = document.createElement('div');
  nav.style.position = 'sticky';
  nav.style.top = '0';
  nav.style.zIndex = '10';
  nav.style.background = '#f6f4f1';
  nav.style.borderBottom = '1px solid #e3e1db';
  nav.style.padding = '10px 16px';
  nav.style.fontFamily = "'Merriweather', serif";
  nav.style.display = 'flex';
  nav.style.gap = '12px';
  nav.style.alignItems = 'center';

  const demos = document.createElement('a');
  demos.href = `${root}/demos/index.html`;
  demos.textContent = 'Demos';
  demos.style.color = '#2c3e50';
  demos.style.textDecoration = 'none';
  demos.style.fontWeight = '600';

  const tools = document.createElement('a');
  tools.href = `${root}/tools/index.html`;
  tools.textContent = 'Tools';
  tools.style.color = '#2c3e50';
  tools.style.textDecoration = 'none';
  tools.style.fontWeight = '600';

  nav.appendChild(demos);
  nav.appendChild(tools);
  return nav;
}

function buildToolTabs(root) {
  const wrap = document.createElement('div');
  wrap.style.position = 'sticky';
  wrap.style.top = '0';
  wrap.style.zIndex = '20';
  wrap.style.display = 'grid';
  wrap.style.justifyItems = 'start';
  wrap.style.margin = '0 20px 14px';

  const tabs = document.createElement('div');
  tabs.style.display = 'flex';
  tabs.style.gap = '8px';
  tabs.style.alignItems = 'start';

  const makeTab = (href, label, title) => {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    link.title = title;
    link.style.border = '1px solid rgba(66, 76, 96, 0.28)';
    link.style.borderBottom = 'none';
    link.style.background = 'rgba(255, 255, 255, 0.94)';
    link.style.color = '#233044';
    link.style.borderRadius = '0 0 12px 12px';
    link.style.padding = '8px 11px 9px';
    link.style.font = '700 15px/1 serif';
    link.style.textDecoration = 'none';
    link.style.cursor = 'pointer';
    link.style.boxShadow = '0 8px 20px rgba(20, 30, 60, 0.12)';
    return link;
  };

  tabs.appendChild(makeTab(`${root}/tools/index.html`, '🔧', 'Back to tools home'));
  tabs.appendChild(makeTab(`${root}/demos/index.html`, '🎞', 'Browse demos'));
  wrap.appendChild(tabs);
  return wrap;
}

for (const mount of document.querySelectorAll('[data-nav="main"]')) {
  if (window.location.pathname.includes('/tools/')) {
    const root = mount.getAttribute('data-nav-root') || '..';
    mount.replaceWith(buildToolTabs(root));
    continue;
  }
  const root = mount.getAttribute('data-nav-root') || '..';
  mount.replaceWith(buildNav(root));
}
