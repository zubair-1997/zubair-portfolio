const root = document.documentElement;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => motionPreference.matches ? "instant" : "smooth";
const header = document.querySelector("header");
if (header && "ResizeObserver" in window) {
  new ResizeObserver(() => {
    root.style.setProperty("--header-offset", `${header.getBoundingClientRect().height + 16}px`);
  }).observe(header);
}
const projectView = document.querySelector("main > #projects");
if (projectView) {
  const syncPageView = () => {
    const target = document.getElementById(window.location.hash.slice(1));
    const projectsActive = target === projectView || Boolean(target && projectView.contains(target));
    const publicationsActive = Boolean(target?.closest("#publications"));
    document.querySelectorAll("main > section").forEach(section => {
      section.hidden = projectsActive && section !== projectView;
    });
    document.body.classList.toggle("home-page", !projectsActive);
    document.body.classList.toggle("projects-page", projectsActive);
    document.body.classList.toggle("publications-view", publicationsActive);
    const activeHref = projectsActive ? "#projects" : publicationsActive ? "#publications" : "#about";
    document.querySelectorAll('nav a[href^="#"]').forEach(link => {
      if (link.getAttribute("href") === activeHref) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title = projectsActive ? "Projects | Mohd Zubair" : "Mohd Zubair | XR, CAD & Tangible Interfaces";
    const skip = document.querySelector(".skip");
    if (skip) skip.href = projectsActive ? "#projects" : "#about";
    requestAnimationFrame(() => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
      window.dispatchEvent(new Event("resize"));
    });
  };
  window.addEventListener("hashchange", syncPageView);
  syncPageView();
}
const toggle = document.querySelector("#theme");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const key = "mohd-zubair-theme";
let saved = null;

document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});
try { saved = localStorage.getItem(key); } catch {}
function apply(theme, persist = false) {
  const dark = theme === "dark";
  root.dataset.theme = dark ? "dark" : "light";
  toggle.setAttribute("aria-pressed", String(dark));
  toggle.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
  if (persist) { saved = root.dataset.theme; try { localStorage.setItem(key, saved); } catch {} }
}
apply(saved || (systemTheme.matches ? "dark" : "light"));
let changingTheme = false;
toggle.addEventListener("click", () => {
  if (changingTheme) return;
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  if (motionPreference.matches || !document.startViewTransition) {
    apply(nextTheme, true);
    if (!motionPreference.matches && toggle.animate) {
      toggle.animate([{ transform: "rotate(-35deg) scale(.8)" }, { transform: "rotate(0) scale(1)" }], { duration: 280, easing: "ease-out" });
    }
    return;
  }
  const bounds = toggle.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty("--theme-x", `${x}px`);
  root.style.setProperty("--theme-y", `${y}px`);
  root.style.setProperty("--theme-radius", `${Math.ceil(radius)}px`);
  root.classList.add("theme-changing");
  changingTheme = true;
  try {
    const transition = document.startViewTransition(() => apply(nextTheme, true));
    transition.ready.catch(() => {});
    transition.finished.catch(() => {}).finally(() => {
      root.classList.remove("theme-changing");
      changingTheme = false;
    });
  } catch {
    root.classList.remove("theme-changing");
    changingTheme = false;
    apply(nextTheme, true);
  }
});
systemTheme.addEventListener("change", event => { if (!saved) apply(event.matches ? "dark" : "light"); });

const lensCopy = document.querySelector(".lens-copy");
const lensButtons = document.querySelectorAll(".lens-button");
const lensText = {
  cad: "I explore how tangible and extended-reality tools can make computer-aided design more intuitive, approachable, and learnable.",
  xr: "I design and evaluate extended-reality experiences that connect physical action with digital models, spaces, and learning.",
  tui: "I investigate tangible interfaces that let people think through their hands, objects, and embodied interaction."
};

lensButtons.forEach(button => {
  button.addEventListener("click", () => {
    lensButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    lensCopy.textContent = lensText[button.dataset.lens];
  });
});

const filters = document.querySelectorAll(".filter");
const papers = document.querySelectorAll(".paper");
const matchesTopic = (paper, topic) => (paper.dataset.topics || "").split(/\s+/).includes(topic);

filters.forEach(button => {
  button.addEventListener("click", () => {
    const topic = button.dataset.filter;
    filters.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    papers.forEach(paper => {
      paper.hidden = topic !== "all" && !matchesTopic(paper, topic);
    });
  });
});

const researchProcess = document.querySelector(".research-process");
if (researchProcess) {
  const processSteps = [...researchProcess.querySelectorAll("[data-process]")];
  const relatedWork = researchProcess.querySelector(".research-process-link");
  const processVisual = researchProcess.querySelector(".research-process-visual");
  const selectProcess = topic => {
    researchProcess.dataset.active = topic;
    processSteps.forEach(step => step.setAttribute("aria-pressed", String(step.dataset.process === topic)));
    relatedWork.setAttribute("aria-label", `Explore ${topic.toUpperCase()} publications`);
  };
  processSteps.forEach(step => step.addEventListener("click", () => selectProcess(step.dataset.process)));
  const selectAt = clientX => {
    const bounds = processVisual.getBoundingClientRect();
    const position = (clientX - bounds.left) / bounds.width;
    selectProcess(position < 1 / 3 ? "tui" : position < 2 / 3 ? "xr" : "cad");
  };
  processVisual.addEventListener("pointerdown", event => {
    processVisual.setPointerCapture(event.pointerId);
    selectAt(event.clientX);
  });
  processVisual.addEventListener("pointermove", event => {
    if (processVisual.hasPointerCapture(event.pointerId)) selectAt(event.clientX);
  });
  relatedWork.addEventListener("click", () => {
    document.querySelector(`.filter[data-filter="${researchProcess.dataset.active}"]`)?.click();
  });
  selectProcess("tui");
}

const sketchToFormTrigger = document.querySelector(".sketch-to-form-trigger");
if (sketchToFormTrigger) {
  const dialog = document.createElement("dialog");
  dialog.className = "sketch-to-form-dialog";
  dialog.setAttribute("aria-labelledby", "sketch-to-form-title");
  dialog.innerHTML = '<div class="sketch-to-form-head"><div><h2 id="sketch-to-form-title">Sketch to form</h2><p>Illustrative XR/CAD interaction concept. Draw on the left and adjust the depth.</p></div><button type="button" class="sketch-to-form-close" aria-label="Close sketch to form">&times;</button></div><canvas class="sketch-to-form-canvas" aria-label="Draw a closed outline in the left panel to see a 3D form on the right"></canvas><div class="sketch-to-form-controls"><button type="button" data-shape="rectangle" aria-pressed="true">Rectangle</button><button type="button" data-shape="circle" aria-pressed="false">Circle</button><button type="button" data-shape="freehand" aria-pressed="false">Freehand</button><label for="sketch-depth">Depth</label><input id="sketch-depth" type="range" min="20" max="130" value="70"><output for="sketch-depth">70</output></div>';
  document.body.appendChild(dialog);
  const canvas = dialog.querySelector("canvas");
  const context = canvas.getContext("2d");
  const shapeButtons = [...dialog.querySelectorAll("[data-shape]")];
  const depthInput = dialog.querySelector("input");
  const depthOutput = dialog.querySelector("output");
  const closeButton = dialog.querySelector(".sketch-to-form-close");
  const rectangle = [{ x: .18, y: .2 }, { x: .82, y: .2 }, { x: .82, y: .8 }, { x: .18, y: .8 }];
  let points = rectangle;
  let drawing = false;
  let previousPoints = rectangle;

  const setShape = shape => {
    shapeButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.shape === shape)));
    if (shape === "rectangle") points = rectangle;
    if (shape === "circle") points = Array.from({ length: 32 }, (_, index) => {
      const angle = index * Math.PI * 2 / 32;
      return { x: .5 + .33 * Math.cos(angle), y: .5 + .33 * Math.sin(angle) };
    });
    draw();
  };

  const trace = vertices => {
    context.beginPath();
    vertices.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
  };

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const half = width / 2;
    const pad = Math.min(34, width * .055);
    const top = 48;
    const bottom = 28;
    const depth = Number(depthInput.value);
    const dx = depth * Math.min(.3, half / 400);
    const dy = depth * .17;
    const style = getComputedStyle(root);
    const accent = style.getPropertyValue("--link").trim();
    const line = style.getPropertyValue("--line").trim();
    const textColor = style.getPropertyValue("--muted").trim();
    context.clearRect(0, 0, width, height);

    context.strokeStyle = line;
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 24) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
    context.beginPath(); context.moveTo(half, 0); context.lineTo(half, height); context.stroke();
    context.fillStyle = textColor;
    context.font = '13px "Segoe UI", sans-serif';
    context.fillText("2D sketch", pad, 25);
    context.fillText("3D form", half + pad, 25);
    if (points.length < 2) return;

    const sketch = points.map(point => ({ x: pad + point.x * (half - 2 * pad), y: top + point.y * (height - top - bottom) }));
    trace(sketch);
    context.fillStyle = accent;
    context.globalAlpha = .12;
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.stroke();
    if (points.length < 3) return;

    const front = points.map(point => ({ x: half + pad + point.x * (half - 2 * pad - dx), y: top + dy + point.y * (height - top - bottom - dy) }));
    const back = front.map(point => ({ x: point.x + dx, y: point.y - dy }));
    trace(back);
    context.globalAlpha = .35;
    context.stroke();
    context.globalAlpha = 1;
    front.forEach((point, index) => {
      const next = (index + 1) % front.length;
      trace([point, front[next], back[next], back[index]]);
      context.globalAlpha = index % 2 ? .12 : .2;
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
    });
    trace(front);
    context.globalAlpha = .16;
    context.fill();
    context.globalAlpha = 1;
    context.stroke();
  }

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  const pointAt = event => {
    const bounds = canvas.getBoundingClientRect();
    const pad = Math.min(34, bounds.width * .055);
    const top = 48;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left - pad) / (bounds.width / 2 - 2 * pad))),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top - top) / (bounds.height - top - 28)))
    };
  };

  sketchToFormTrigger.addEventListener("click", () => {
    dialog.showModal();
    resize();
    closeButton.focus();
  });
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  shapeButtons.forEach(button => button.addEventListener("click", () => setShape(button.dataset.shape)));
  depthInput.addEventListener("input", () => { depthOutput.value = depthInput.value; draw(); });
  canvas.addEventListener("pointerdown", event => {
    const bounds = canvas.getBoundingClientRect();
    if (event.clientX - bounds.left >= bounds.width / 2) return;
    canvas.setPointerCapture(event.pointerId);
    previousPoints = points;
    points = [pointAt(event)];
    drawing = true;
    setShape("freehand");
  });
  canvas.addEventListener("pointermove", event => {
    if (!drawing || !canvas.hasPointerCapture(event.pointerId)) return;
    const point = pointAt(event);
    const last = points[points.length - 1];
    if (points.length < 120 && Math.hypot(point.x - last.x, point.y - last.y) > .02) {
      points.push(point);
      draw();
    }
  });
  const stopDrawing = () => {
    if (!drawing) return;
    drawing = false;
    if (points.length < 3) points = previousPoints;
    draw();
  };
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  window.addEventListener("resize", () => { if (dialog.open) resize(); });
  new MutationObserver(() => { if (dialog.open) draw(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}

const mapTrigger = document.querySelector(".research-map-trigger");
if (mapTrigger && papers.length) {
  const mapDialog = document.createElement("dialog");
  mapDialog.className = "research-map-dialog";
  mapDialog.setAttribute("aria-labelledby", "research-map-title");
  mapDialog.innerHTML = '<div class="research-map-head"><h2 id="research-map-title">Research map</h2><button type="button" class="research-map-close" aria-label="Close research map">&times;</button></div><div class="research-map-layout"><div class="research-map-visual"><svg class="research-map-lines" viewBox="0 0 300 290" preserveAspectRatio="none" aria-hidden="true"><line x1="150" y1="145" x2="150" y2="40"/><line x1="150" y1="145" x2="265" y2="237"/><line x1="150" y1="145" x2="35" y2="237"/></svg><span class="research-map-center">TXR+CAD</span><button type="button" class="research-map-node" data-topic="cad" aria-pressed="false">CAD</button><button type="button" class="research-map-node" data-topic="xr" aria-pressed="false">XR</button><button type="button" class="research-map-node" data-topic="tui" aria-pressed="false">TUI</button></div><div class="research-map-detail"><h3></h3><p></p><ul class="research-map-results"></ul></div></div>';
  document.body.appendChild(mapDialog);

  const mapNodes = [...mapDialog.querySelectorAll(".research-map-node")];
  const results = mapDialog.querySelector(".research-map-results");
  const labels = { cad: "Computer-Aided Design", xr: "Extended Reality", tui: "Tangible User Interfaces" };
  const renderMap = topic => {
    mapNodes.forEach(node => node.setAttribute("aria-pressed", String(node.dataset.topic === topic)));
    mapDialog.querySelector(".research-map-detail h3").textContent = labels[topic];
    mapDialog.querySelector(".research-map-detail p").textContent = lensText[topic];
    results.replaceChildren();

    papers.forEach(paper => {
      if (!matchesTopic(paper, topic)) return;
      const item = document.createElement("li");
      const link = document.createElement("button");
      link.type = "button";
      link.textContent = paper.querySelector("h3").textContent.trim();
      link.addEventListener("click", () => {
        mapDialog.close();
        document.querySelector(`.filter[data-filter="${topic}"]`).click();
        paper.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
        paper.tabIndex = -1;
        paper.focus({ preventScroll: true });
      });
      item.appendChild(link);
      results.appendChild(item);
    });
  };

  mapNodes.forEach(node => node.addEventListener("click", () => renderMap(node.dataset.topic)));
  mapDialog.querySelector(".research-map-close").addEventListener("click", () => mapDialog.close());
  mapDialog.addEventListener("click", event => { if (event.target === mapDialog) mapDialog.close(); });
  const openResearchMap = topic => {
    renderMap(topic);
    mapDialog.showModal();
    mapNodes.find(node => node.dataset.topic === topic).focus();
  };
  mapTrigger.addEventListener("click", () => openResearchMap("cad"));
  document.querySelectorAll(".research-topic").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      openResearchMap(link.dataset.topic);
    });
  });
}

const connectionTriggers = document.querySelectorAll(".research-connections-trigger");
if (connectionTriggers.length) {
  const connections = [
    ["project-boxcraft", "paper-boxcraft"],
    ["project-virtual-prototyping", "paper-virtual-prototyping"],
    ["project-tangible-xr", "paper-tangible-xr"],
    ["project-physical-digital", "paper-mixed-reality-demo"]
  ];
  const dialog = document.createElement("dialog");
  dialog.className = "research-connections-dialog";
  dialog.setAttribute("aria-labelledby", "research-connections-title");
  dialog.innerHTML = '<div class="research-connections-head"><div><h2 id="research-connections-title">Research connections</h2><p>Explore the publications and prototypes behind each project.</p></div><button type="button" class="research-connections-close" aria-label="Close research connections">&times;</button></div><ul class="research-connections-list"></ul>';
  document.body.appendChild(dialog);
  const list = dialog.querySelector(".research-connections-list");

  const goTo = (target, section) => {
    dialog.close();
    if (section === "publications") document.querySelector('.filter[data-filter="all"]')?.click();
    window.location.hash = section;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (section === "publications") target.tabIndex = -1;
      target.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      target.focus({ preventScroll: true });
    }));
  };

  connections.forEach(([projectId, paperId]) => {
    const project = document.getElementById(projectId);
    const paper = document.getElementById(paperId);
    if (!project || !paper) return;
    const item = document.createElement("li");
    const image = document.createElement("img");
    image.src = project.querySelector("img").getAttribute("src");
    image.alt = "";
    const detail = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = project.querySelector("h3").textContent.trim();
    const publication = document.createElement("p");
    publication.textContent = `${paper.querySelector("h3").textContent.trim()} · ${paper.querySelector("em").textContent.trim()}`;
    const actions = document.createElement("div");
    actions.className = "research-connections-actions";
    const paperButton = document.createElement("button");
    paperButton.type = "button";
    paperButton.textContent = "View publication";
    paperButton.addEventListener("click", () => goTo(paper, "publications"));
    const projectButton = document.createElement("button");
    projectButton.type = "button";
    projectButton.textContent = "View project";
    projectButton.addEventListener("click", () => goTo(project, "projects"));
    actions.append(paperButton, projectButton);
    if (project.matches("a[href]")) {
      const demo = document.createElement("a");
      demo.href = project.href;
      demo.target = "_blank";
      demo.rel = "noopener noreferrer";
      demo.textContent = "Watch demo ↗";
      actions.appendChild(demo);
    }
    detail.append(title, publication, actions);
    item.append(image, detail);
    list.appendChild(item);
  });

  const close = dialog.querySelector(".research-connections-close");
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  connectionTriggers.forEach(trigger => trigger.addEventListener("click", () => {
    dialog.showModal();
    close.focus();
  }));
}

const newsList = document.querySelector(".news-list");
const newsArticles = [...document.querySelectorAll(".news article")];
if (newsList && newsArticles.length) {
  newsArticles.forEach(article => article.querySelector("time").setAttribute("datetime", article.dataset.date.slice(0, 7)));
  newsArticles.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
  newsArticles.forEach(article => newsList.appendChild(article));

  const updateNewsView = () => {
    if (!newsList.getClientRects().length) return;
    const visibleArticles = newsArticles.slice(0, 5);
    const totalHeight = visibleArticles.reduce((sum, article) => sum + article.getBoundingClientRect().height, 0);
    newsList.style.maxHeight = `${totalHeight + 8}px`;
  };

  updateNewsView();
  window.addEventListener("resize", updateNewsView);
}

const publicationCovers = document.querySelectorAll(".paper .cover");
if (publicationCovers.length) {
  const preview = document.createElement("dialog");
  preview.className = "image-preview";
  preview.setAttribute("aria-label", "Publication image preview");
  preview.innerHTML = '<button type="button" class="image-preview-close" aria-label="Close image preview">&times;</button><div class="image-preview-image" role="img"></div><p class="image-preview-title"></p><button type="button" class="image-preview-play" hidden>Play animation</button>';
  document.body.appendChild(preview);

  const closeButton = preview.querySelector(".image-preview-close");
  const playButton = preview.querySelector(".image-preview-play");
  const previewImage = preview.querySelector(".image-preview-image");
  let activeCover;
  let stillImage;
  let playing = false;
  playButton.addEventListener("click", () => {
    playing = !playing;
    previewImage.style.backgroundImage = playing ? `url("${activeCover.dataset.animation}")` : stillImage;
    playButton.textContent = playing ? "Show still image" : "Play animation";
    playButton.setAttribute("aria-pressed", String(playing));
  });
  preview.addEventListener("close", () => {
    previewImage.style.backgroundImage = "none";
    playing = false;
  });
  closeButton.addEventListener("click", () => preview.close());
  preview.addEventListener("click", event => {
    if (event.target === preview) preview.close();
  });

  publicationCovers.forEach(cover => {
    const title = cover.closest(".paper").querySelector("h3").textContent.trim();
    cover.tabIndex = 0;
    cover.setAttribute("role", "button");
    cover.setAttribute("aria-label", `Enlarge image for ${title}`);

    const openPreview = () => {
      activeCover = cover;
      playing = false;
      stillImage = getComputedStyle(cover).backgroundImage;
      playButton.hidden = !cover.dataset.animation;
      playButton.textContent = "Play animation";
      playButton.setAttribute("aria-pressed", "false");
      const image = preview.querySelector(".image-preview-image");
      image.style.backgroundImage = stillImage;
      image.setAttribute("aria-label", title);
      image.style.backgroundColor = getComputedStyle(cover).backgroundColor;
      preview.querySelector(".image-preview-title").textContent = title;
      preview.showModal();
      closeButton.focus();
    };

    cover.addEventListener("click", openPreview);
    cover.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPreview();
      }
    });
  });
}

const copyCitation = async text => {
  const previousFocus = document.activeElement;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  (document.querySelector("dialog[open]") || document.body).appendChild(field);
  field.select();
  try { return document.execCommand("copy"); }
  catch { return false; }
  finally { field.remove(); previousFocus?.focus({ preventScroll: true }); }
};

const citationDialog = document.createElement("dialog");
citationDialog.className = "citation-dialog";
citationDialog.setAttribute("aria-labelledby", "citation-dialog-title");
citationDialog.innerHTML = '<div class="citation-dialog-head"><h2 id="citation-dialog-title">Cite</h2><button type="button" class="citation-dialog-close" aria-label="Close citations">&times;</button></div><div class="citation-formats"></div>';
document.body.appendChild(citationDialog);
citationDialog.querySelector(".citation-dialog-close").addEventListener("click", () => citationDialog.close());
citationDialog.addEventListener("click", event => {
  if (event.target === citationDialog) citationDialog.close();
});

const asCitationAuthor = name => {
  const parts = name.trim().split(/\s+/);
  const family = parts.pop();
  const initials = parts.map(part => `${part[0].toUpperCase()}.`).join(" ");
  return `${family}, ${initials}`;
};

const citationFormats = ({ authors, title, venue, year, doi, accepted = false }) => {
  const apaAuthors = authors.map(asCitationAuthor);
  const apaNames = apaAuthors.length > 1
    ? `${apaAuthors.slice(0, -1).join(", ")}, & ${apaAuthors.at(-1)}`
    : apaAuthors[0];
  const firstAuthor = authors[0].trim().split(/\s+/);
  const family = firstAuthor.pop();
  const mlaAuthor = `${family}, ${firstAuthor.join(" ")}${authors.length > 1 ? ", et al." : ""}`;
  const fullAuthors = authors.length > 1
    ? `${authors.slice(0, -1).join(", ")}, and ${authors.at(-1)}`
    : authors[0];
  const doiSuffix = doi ? ` ${doi}` : "";
  const bibKey = `${family.replace(/[^a-zA-Z]/g, "")}${year}${title.split(/\s+/).find(word => word.length > 4)?.replace(/[^a-zA-Z]/g, "") || "Work"}`;
  const bibAuthors = authors.map(name => {
    const parts = name.trim().split(/\s+/);
    return `${parts.pop()}, ${parts.join(" ")}`;
  }).join(" and ");
  const bibDoi = doi ? `,\n  doi = {${doi.replace("https://doi.org/", "")}}` : "";

  return {
    APA: `${apaNames} (${year}). ${title}. ${venue}.${doiSuffix}`,
    MLA: `${mlaAuthor} "${title}." ${venue}, ${year}.${doiSuffix}`,
    Chicago: `${fullAuthors}. "${title}." ${venue} (${year}).${doiSuffix}`,
    Harvard: `${apaNames.replace(", & ", " and ")} (${year}) '${title}', ${venue}.${doiSuffix}`,
    BibTeX: `@${accepted ? "misc" : "inproceedings"}{${bibKey},\n  author = {${bibAuthors}},\n  title = {${title}},\n  ${accepted ? "howpublished" : "booktitle"} = {${venue}},\n  year = {${year}}${accepted ? ',\n  note = {Accepted}' : ""}${bibDoi}\n}`
  };
};

document.querySelectorAll(".paper").forEach(paper => {
  const links = paper.querySelector(".paper-links");
  const title = paper.querySelector("h3")?.textContent.trim();
  const details = paper.querySelectorAll("p");
  if (!links || !title || details.length < 2) return;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Cite";
  button.setAttribute("aria-label", `Show citations for ${title}`);
  links.appendChild(button);

  button.addEventListener("click", () => {
    const authorText = details[0].textContent.trim();
    const authors = authorText.replace(/,?\s+and\s+/i, ", ").split(/,\s*/);
    const venue = details[1].textContent.trim();
    const year = venue.match(/\b(?:19|20)\d{2}\b/)?.[0] || "n.d.";
    const doi = paper.querySelector('a[href^="https://doi.org/"]')?.href || "";
    const accepted = [...links.querySelectorAll("span")].some(item => item.textContent.trim().toLowerCase() === "accepted");
    const formats = citationFormats({ authors, title, venue, year, doi, accepted });
    const container = citationDialog.querySelector(".citation-formats");
    container.replaceChildren();

    Object.entries(formats).forEach(([name, citation]) => {
      const row = document.createElement("div");
      row.className = "citation-format";
      const heading = document.createElement("h3");
      heading.textContent = name;
      const content = document.createElement("p");
      content.textContent = citation;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy";
      copy.setAttribute("aria-label", `Copy ${name} citation`);
      copy.addEventListener("click", async () => {
        const copied = await copyCitation(citation);
        copy.textContent = copied ? "Copied" : "Try again";
      });
      row.append(heading, content, copy);
      container.appendChild(row);
    });

    citationDialog.showModal();
    citationDialog.querySelector(".citation-dialog-close").focus();
  });
});

const prototypeCard = document.querySelector(".project-card-static");
if (prototypeCard) {
  prototypeCard.tabIndex = 0;
  prototypeCard.setAttribute("role", "button");
  prototypeCard.setAttribute("aria-label", "Open interactive CAD sketch for Physical-to-Digital Modelling");
  prototypeCard.title = "Open interactive CAD sketch";

  const sketch = document.createElement("dialog");
  sketch.className = "cad-sketch";
  sketch.setAttribute("aria-labelledby", "cad-sketch-title");
  sketch.innerHTML = '<div class="cad-sketch-head"><div><h2 id="cad-sketch-title">Physical-to-Digital Modelling</h2><p>Illustrative CAD interaction sketch</p></div><button type="button" class="cad-sketch-close" aria-label="Close interactive CAD sketch">&times;</button></div><canvas class="cad-sketch-canvas" tabindex="0" aria-label="Rotatable 3D CAD form. Drag or use arrow keys to rotate it."></canvas><div class="cad-sketch-controls"><label for="cad-extrusion">Extrusion height</label><input id="cad-extrusion" type="range" min="40" max="180" value="105"><output for="cad-extrusion">105</output></div><p class="cad-sketch-hint">Drag to rotate. Use arrow keys when the sketch is focused.</p>';
  document.body.appendChild(sketch);

  const canvas = sketch.querySelector("canvas");
  const context = canvas.getContext("2d");
  const heightControl = sketch.querySelector("input");
  const heightOutput = sketch.querySelector("output");
  const closeSketch = sketch.querySelector(".cad-sketch-close");
  let yaw = -0.55;
  let pitch = -0.3;
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };

  const drawSketch = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const extrusion = Number(heightControl.value);
    const scale = Math.min(width / 340, height / 280);
    const lineColor = getComputedStyle(root).getPropertyValue("--line").trim();
    const accent = getComputedStyle(root).getPropertyValue("--link").trim();
    context.clearRect(0, 0, width, height);

    const project = ([x, y, z]) => {
      const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
      const turnedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const turnedY = y * Math.cos(pitch) - turnedZ * Math.sin(pitch);
      const depth = y * Math.sin(pitch) + turnedZ * Math.cos(pitch);
      const perspective = 520 / (520 + depth);
      return { x: width / 2 + turnedX * scale * perspective, y: height / 2 - turnedY * scale * perspective, depth };
    };

    context.strokeStyle = lineColor;
    context.lineWidth = 1;
    for (let position = -240; position <= 240; position += 40) {
      for (const axis of ["x", "z"]) {
        const from = project(axis === "x" ? [position, -extrusion / 2 - 20, -240] : [-240, -extrusion / 2 - 20, position]);
        const to = project(axis === "x" ? [position, -extrusion / 2 - 20, 240] : [240, -extrusion / 2 - 20, position]);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
    }

    const points = [
      [-95, -extrusion / 2, -70], [95, -extrusion / 2, -70], [95, extrusion / 2, -70], [-95, extrusion / 2, -70],
      [-95, -extrusion / 2, 70], [95, -extrusion / 2, 70], [95, extrusion / 2, 70], [-95, extrusion / 2, 70]
    ].map(project);
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 4, 7, 3], [1, 5, 6, 2], [3, 2, 6, 7], [0, 1, 5, 4]];
    faces.sort((a, b) => b.reduce((sum, i) => sum + points[i].depth, 0) - a.reduce((sum, i) => sum + points[i].depth, 0));
    faces.forEach((face, index) => {
      context.beginPath();
      face.forEach((pointIndex, pointPosition) => {
        const point = points[pointIndex];
        if (pointPosition === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.globalAlpha = index % 2 ? 0.19 : 0.11;
      context.fillStyle = accent;
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = accent;
      context.lineWidth = 1.5;
      context.stroke();
    });

    const dimensionTop = project([145, extrusion / 2, 0]);
    const dimensionBottom = project([145, -extrusion / 2, 0]);
    context.strokeStyle = accent;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(dimensionTop.x, dimensionTop.y);
    context.lineTo(dimensionBottom.x, dimensionBottom.y);
    context.stroke();
    for (const point of [dimensionTop, dimensionBottom]) {
      context.beginPath();
      context.moveTo(point.x - 5, point.y);
      context.lineTo(point.x + 5, point.y);
      context.stroke();
    }
    context.fillStyle = accent;
    context.font = '14px "Segoe UI", sans-serif';
    context.fillText(String(extrusion), dimensionTop.x + 10, (dimensionTop.y + dimensionBottom.y) / 2);
  };

  const resizeSketch = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawSketch();
  };

  const openSketch = () => {
    sketch.showModal();
    resizeSketch();
    closeSketch.focus();
  };
  prototypeCard.addEventListener("click", openSketch);
  prototypeCard.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSketch();
    }
  });
  closeSketch.addEventListener("click", () => sketch.close());
  sketch.addEventListener("click", event => { if (event.target === sketch) sketch.close(); });
  heightControl.addEventListener("input", () => {
    heightOutput.value = heightControl.value;
    drawSketch();
  });
  canvas.addEventListener("pointerdown", event => {
    dragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    if (!dragging) return;
    yaw += (event.clientX - lastPointer.x) * 0.012;
    pitch = Math.max(-1.1, Math.min(1.1, pitch + (event.clientY - lastPointer.y) * 0.012));
    lastPointer = { x: event.clientX, y: event.clientY };
    drawSketch();
  });
  const stopDragging = () => { dragging = false; };
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  canvas.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") yaw -= 0.12;
    if (event.key === "ArrowRight") yaw += 0.12;
    if (event.key === "ArrowUp") pitch = Math.max(-1.1, pitch - 0.12);
    if (event.key === "ArrowDown") pitch = Math.min(1.1, pitch + 0.12);
    drawSketch();
  });
  window.addEventListener("resize", () => { if (sketch.open) resizeSketch(); });
  new MutationObserver(() => { if (sketch.open) drawSketch(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
}
