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

for (const mount of document.querySelectorAll('[data-nav="main"]')) {
  const root = mount.getAttribute('data-nav-root') || '..';
  mount.replaceWith(buildNav(root));
}
