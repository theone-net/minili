const toggleButton = document.getElementById('theme-toggle');
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const manualToggle = localStorage.getItem('manualToggle');
function toggle(){
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll(".transparent-button")
      .forEach(el => el.classList.toggle('dark'));
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    localStorage.setItem('manualToggle', 'true');
};
toggleButton.addEventListener('click', () => {
    toggle();
});
if (isDarkMode === true && manualToggle === null) {
    document.documentElement.classList.add('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', 'dark');
};
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // Only change if user hasn't manually toggled
    if (localStorage.getItem('theme') === 'dark' && manualToggle === null) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    else if (localStorage.getItem('theme') === 'light' && manualToggle === null){
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});