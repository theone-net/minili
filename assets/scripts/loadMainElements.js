async function loadHTML(id, url) {
    const res = await fetch(url);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
}

async function init() {
    // Wait for header and footer to load
    await loadHTML('header', '/assets/pages/header.html');
    await loadHTML('footer', '/assets/pages/footer.html');

    // Now the footer exists, append your script safely
    const script = document.createElement('script');
    script.src = '/assets/scripts/toggletheme.js';
    document.getElementById('footer').appendChild(script);

    document.body.classList.add('loaded');
}

// Run the initializer
init();