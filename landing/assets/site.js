const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.dataset.copy;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      const original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; }, 1600);
    } catch {
      button.textContent = 'Select + copy';
    }
  });
});

const tabs = [...document.querySelectorAll('[data-console-tab]')];
const consoleFrame = document.querySelector('.console-frame');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    const target = document.querySelector('[data-console-content="' + tab.dataset.consoleTab + '"]');
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    if (consoleFrame) {
      consoleFrame.animate(
        [{ borderColor: '#d92a2e' }, { borderColor: '#4e4b51' }],
        { duration: 520, easing: 'ease-out' }
      );
    }
  });
});

const runButton = document.querySelector('[data-run-demo]');
const runStatus = document.querySelector('[data-run-status]');
const runOutput = document.querySelector('[data-run-output]');
if (runButton && runStatus && runOutput) {
  runButton.addEventListener('click', () => {
    runButton.disabled = true;
    runButton.textContent = 'Running';
    runStatus.textContent = 'Calling…';
    runOutput.textContent = '> validating workspace ownership\n> hydrating encrypted credentials\n> calling filesystem.read_file';
    setTimeout(() => {
      runStatus.textContent = '200 OK · 42ms';
      runOutput.textContent = '# MCP Hub\n\nOpen-source command center for connecting MCP servers, discovering tools, and testing calls.\n\nPreview complete. No live server was contacted.';
      runButton.disabled = false;
      runButton.textContent = 'Run again';
    }, 900);
  });
}

const sections = [...document.querySelectorAll('.doc-section[id]')];
const sidebarLinks = [...document.querySelectorAll('.docs-sidebar a')];
if (sections.length && sidebarLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sidebarLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach((section) => observer.observe(section));
}
