const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.querySelector("html").classList.add('dark');
} else {
  document.querySelector("html").classList.remove('dark');
}
// Apply the transition class to relevant elements
async function applyTransitions() {
    document.documentElement.classList.add('transition');

    document.querySelectorAll("a, p, input.sizeSelect")
      .forEach(el => el.classList.add('transition'));
}

// Run when the initial DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  await new Promise(r => setTimeout(r, 100)); // slight delay to ensure DOM is ready
  applyTransitions();
});