(() => {
  const cards = document.querySelectorAll(".project-grid .project-card");
  if (!cards.length) return;
  const grid = document.querySelector(".project-grid");
  const previous = document.querySelector(".project-carousel-prev");
  const next = document.querySelector(".project-carousel-next");
  if (grid && previous && next) {
    const updateControls = () => {
      previous.disabled = grid.scrollLeft <= 1;
      next.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1;
    };
    const move = direction => {
      const cardWidth = grid.querySelector(".project-card")?.getBoundingClientRect().width || 240;
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      grid.scrollBy({ left: direction * (cardWidth + gap), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    grid.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    window.addEventListener("hashchange", () => requestAnimationFrame(updateControls));
    requestAnimationFrame(updateControls);
  }
  const dialog = document.createElement("dialog");
  dialog.className = "project-details-dialog";
  dialog.setAttribute("aria-labelledby", "project-details-title");
  const bar = document.createElement("div");
  bar.className = "project-details-bar";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.setAttribute("aria-label", "Close project details");
  const body = document.createElement("div");
  body.className = "project-details-body";
  bar.append(close);
  dialog.append(bar, body);
  document.body.append(dialog);
  const imageDialog = document.createElement("dialog");
  imageDialog.className = "project-image-dialog";
  imageDialog.setAttribute("aria-label", "Enlarged project image");
  const imageClose = document.createElement("button");
  imageClose.type = "button";
  imageClose.textContent = "Close image";
  const enlargedImage = document.createElement("img");
  imageDialog.append(imageClose, enlargedImage);
  dialog.append(imageDialog);
  let imageOpener;
  imageClose.addEventListener("click", () => imageDialog.close());
  imageDialog.addEventListener("click", event => {
    if (event.target === imageDialog || event.target === enlargedImage) imageDialog.close();
  });
  imageDialog.addEventListener("close", () => {
    if (dialog.open && imageOpener?.isConnected) imageOpener.focus();
    enlargedImage.removeAttribute("src");
  });
  let opener;
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    if (imageDialog.open) imageDialog.close();
    body.replaceChildren();
    if (opener?.isConnected && !opener.closest("[hidden]")) opener.focus();
  });
  window.addEventListener("hashchange", () => { if (dialog.open) dialog.close(); });

  const element = (tag, text, parent) => {
    const node = document.createElement(tag);
    node.textContent = text;
    parent.append(node);
    return node;
  };
  const safeUrl = value => {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ["https:", "http:"].includes(url.protocol) || (location.protocol === "file:" && url.protocol === "file:") ? url.href : null;
    } catch { return null; }
  };
  const youtubeVideo = value => {
    if (!value) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) return null;
      const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null;
      if (!/^[\w-]{11}$/.test(id || "")) return null;
      const start = Number.parseInt(url.searchParams.get("t") || "0", 10);
      return { id, start: Number.isFinite(start) && start > 0 ? start : 0 };
    } catch { return null; }
  };

  cards.forEach(original => {
    const destination = original.matches("a[href]") ? original.getAttribute("href") : null;
    let card = original;
    if (destination) {
      card = document.createElement("article");
      card.className = original.className;
      card.id = original.id;
      card.append(...original.childNodes);
      original.replaceWith(card);
    }
    const copy = card.querySelector(".project-card-copy");
    const label = copy.querySelector("span");
    const resourceLabel = destination ? label.textContent : null;
    if (destination) label.remove();
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `View details: ${copy.querySelector("h3").textContent}`);
    const openDetails = () => {
      opener = card;
      body.replaceChildren();
      const data = window.projectDetails?.[card.id] || {};
      const heading = element("h2", copy.querySelector("h3").textContent, body);
      heading.id = "project-details-title";
      element("p", data.intro || copy.querySelector("p").textContent, body).className = "project-details-summary";
      const videoInfo = youtubeVideo(destination);
      let playVideo;
      if (videoInfo) {
        const video = document.createElement("div");
        video.className = "project-details-video";
        const player = document.createElement("iframe");
        player.src = `https://www.youtube.com/embed/${videoInfo.id}?playsinline=1&start=${videoInfo.start}`;
        player.title = `${heading.textContent} video`;
        player.loading = "lazy";
        player.referrerPolicy = "strict-origin-when-cross-origin";
        player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        player.allowFullscreen = true;
        video.append(player);
        body.append(video);
        playVideo = () => {
          player.src = `https://www.youtube.com/embed/${videoInfo.id}?playsinline=1&start=${videoInfo.start}&autoplay=1`;
          video.scrollIntoView({ block: "center", behavior: "instant" });
          player.focus();
        };
      }
      const meta = document.createElement("dl");
      meta.className = "project-details-meta";
      for (const [key, label] of [["role", "My role"], ["year", "Year"], ["tools", "Tools & methods"]]) {
        if (data[key] == null || !String(data[key]).trim()) continue;
        const row = document.createElement("div");
        element("dt", label, row);
        element("dd", data[key], row);
        meta.append(row);
      }
      if (meta.childElementCount) body.append(meta);
      for (const [key, label] of [["overview", "Overview"], ["process", "Process"], ["outcomes", "Outcomes & reflections"]]) {
        const paragraphs = (Array.isArray(data[key]) ? data[key] : [data[key]]).filter(text => typeof text === "string" && text.trim());
        if (!paragraphs.length) continue;
        const section = document.createElement("section");
        element("h3", label, section);
        paragraphs.forEach(text => element("p", text, section));
        body.append(section);
      }
      const gallery = document.createElement("div");
      gallery.className = "project-details-gallery";
      const images = Array.isArray(data.images) ? data.images : [];
      images.forEach(item => {
        if (!item) return;
        const src = safeUrl(item.src);
        if (!src) return;
        const figure = document.createElement("figure");
        const fullImage = document.createElement("button");
        fullImage.type = "button";
        fullImage.setAttribute("aria-haspopup", "dialog");
        fullImage.setAttribute("aria-label", `Enlarge image: ${item.alt || heading.textContent}`);
        fullImage.title = "View full-size image";
        fullImage.addEventListener("click", () => {
          imageOpener = fullImage;
          enlargedImage.src = src;
          enlargedImage.alt = item.alt || heading.textContent;
          imageDialog.showModal();
          imageClose.focus();
        });
        const image = document.createElement("img");
        image.src = src;
        image.alt = item.alt || "";
        image.loading = "lazy";
        image.decoding = "async";
        fullImage.append(image);
        figure.append(fullImage);
        if (item.caption) element("figcaption", item.caption, figure);
        gallery.append(figure);
      });
      if (gallery.childElementCount) body.append(gallery);
      const resources = document.createElement("div");
      resources.className = "project-detail-resources";
      if (playVideo) {
        const play = element("button", "Watch video", resources);
        play.type = "button";
        play.addEventListener("click", playVideo);
      }
      const links = [...(destination && !videoInfo ? [{label: resourceLabel, url: destination}] : []), ...(Array.isArray(data.resources) ? data.resources : [])];
      links.forEach(item => {
        if (!item || !item.label) return;
        const url = safeUrl(item.url);
        if (!url) return;
        const link = element("a", item.label, resources);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      });
      if (resources.childElementCount) body.append(resources);
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus();
    };
    card.addEventListener("click", openDetails);
    card.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openDetails();
    });
  });
})();
