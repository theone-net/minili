const webname = "minili";

const routes = {
  "/": async () => (await fetch("/main-content.html")).text(),
  "/editor": async () => (await fetch("/editor.html")).text(),
  "/legal/tos": async () => (await fetch("/legal/tos.html")).text(),
  "/legal/privacy": async () => (await fetch("/legal/privacy.html")).text(),
  "/legal/credits": async () => (await fetch("/legal/credits.html")).text(),
};

const titles = {
  "/": "home",
  "/editor": "editor",
  "/legal/privacy": "privacy",
  "/legal/tos": "terms of service",
  "/legal/credits": "credits",
};

function setTitle(path, is404 = false) {
  if (is404) {
    document.title = `404 • ${webname}`;
    return;
  }

  document.title = titles[path]
    ? `${titles[path]} • ${webname}`
    : webname;
}


const app = document.getElementById("app");

let firstRender = true;

window.hasUnsavedChanges = false;

function getPathFromHash() {
  let hash = location.hash || "#";

  hash = hash.replace("/#", "");

  // extract path
  const path = hash.slice(1) || "/";
  return path;
}


async function render() {
  const path = getPathFromHash();
  const is404 = !routes[path];

  const handler = is404
    ? async () => (await fetch("/404.html")).text()
    : routes[path];

  setTitle(path, is404);

  if (!firstRender) {
    app.classList.add("fade-out");
    await new Promise(r => setTimeout(r, 200));
  }

  app.innerHTML = await handler();

  if (!firstRender) {
    app.classList.remove("fade-out");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  firstRender = false;

  if (path === "/editor") {
    window.initDraw?.();
  }
  window.applyTransitions?.();
}

function navigate(path) {
  if (window.hasUnsavedChanges === true) {
    const ok = confirm("you have unsaved changes. leave anyway?");
    if (!ok){return;}
    if (ok){window.hasUnsavedChanges = false;}
  }
  location.hash = path;
  render();
}

document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  e.preventDefault();

  // works for both "#/..." and "/..."
  const href = link.getAttribute("href");
  navigate(href.startsWith("#") ? href.slice(1) : href);
});

window.addEventListener("hashchange", render);
render();
