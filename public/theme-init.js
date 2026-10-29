(() => {
  let theme = 'dark';
  try {
    const saved = localStorage.getItem('polytech-theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
  } catch {
    /* A blocked storage must not prevent rendering. */
  }
  document.documentElement.dataset.theme = theme;
})();
