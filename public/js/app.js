document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

document.querySelectorAll('[data-chart]').forEach((chart) => {
  const bars = chart.querySelectorAll('span');
  bars.forEach((bar, index) => {
    bar.style.transition = 'height 420ms ease';
    bar.style.transitionDelay = `${index * 45}ms`;
  });
});
