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
    window.addEventListener("popstate", () => requestAnimationFrame(updateControls));
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
  imageDialog.setAttribute("data-lenis-prevent", "");
  imageDialog.setAttribute("aria-label", "Enlarged project image");
  const prevImageButton = document.createElement("button");
  prevImageButton.type = "button";
  prevImageButton.className = "project-image-nav project-image-prev";
  prevImageButton.textContent = "‹";
  prevImageButton.setAttribute("aria-label", "Previous image");
  const nextImageButton = document.createElement("button");
  nextImageButton.type = "button";
  nextImageButton.className = "project-image-nav project-image-next";
  nextImageButton.textContent = "›";
  nextImageButton.setAttribute("aria-label", "Next image");
  const imageClose = document.createElement("button");
  imageClose.type = "button";
  imageClose.className = "project-image-close";
  imageClose.textContent = "Close image";
  const enlargedImage = document.createElement("img");
  const imageCaption = document.createElement("p");
  imageCaption.className = "project-image-caption";
  imageCaption.setAttribute("aria-live", "polite");
  imageDialog.append(prevImageButton, nextImageButton, imageClose, enlargedImage);
  imageDialog.append(imageCaption);
  dialog.append(imageDialog);
  let imageOpener;
  let activeGallery = [];
  let activeGalleryIndex = -1;
  const showGalleryImage = (index) => {
    if (!activeGallery.length) return;
    if (index < 0) index = activeGallery.length - 1;
    if (index >= activeGallery.length) index = 0;
    activeGalleryIndex = index;
    const item = activeGallery[index];
    if (!item) return;
    enlargedImage.src = item.src;
    enlargedImage.alt = item.alt;
    imageCaption.textContent = `${activeGalleryIndex + 1} / ${activeGallery.length} \u00b7 ${item.caption || item.alt}`;
    prevImageButton.disabled = activeGallery.length <= 1;
    nextImageButton.disabled = activeGallery.length <= 1;
  };
  prevImageButton.addEventListener("click", () => showGalleryImage(activeGalleryIndex - 1));
  nextImageButton.addEventListener("click", () => showGalleryImage(activeGalleryIndex + 1));
  imageDialog.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showGalleryImage(activeGalleryIndex + (event.key === "ArrowRight" ? 1 : -1));
  });
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
  window.addEventListener("popstate", () => { if (dialog.open) dialog.close(); });

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
    const destination = original.matches("a[href]") ? original.getAttribute("href") : original.dataset.video || null;
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
    if (destination) label?.remove();
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `View details: ${copy.querySelector("h3").textContent}`);
    const openDetails = () => {
      opener = card;
      const isNaadvriksha = card.id === "project-naadvriksha";
      dialog.classList.add("naadvriksha-details");
      dialog.classList.remove("project-expanded");
      imageDialog.classList.add("naadvriksha-image");
      imageCaption.hidden = false;
      dialog.setAttribute("data-lenis-prevent", "");
      body.replaceChildren();
      const data = window.projectDetails?.[card.id] || {};
      const heading = element("h2", data.title || copy.querySelector("h3").textContent, body);
      heading.id = "project-details-title";
      const summary = document.createElement("p");
      summary.className = "project-details-summary";
      summary.textContent = isNaadvriksha
        ? "A responsive sound installation that turns wind and motion into ambient music. It makes everyday environmental signals feel tangible, expressive, and alive."
        : (data.intro || copy.querySelector("p").textContent || "");
      body.append(summary);

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
      if (!isNaadvriksha) {
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
      }

      const gallery = document.createElement("div");
      gallery.className = "project-details-gallery";
      const images = Array.isArray(data.images) ? data.images : [];
      const galleryItems = [];
      images.forEach(item => {
        if (!item) return;
        const src = safeUrl(item.src);
        if (!src) return;
        galleryItems.push({ src, alt: item.alt || heading.textContent, caption: item.caption || "" });
        const figure = document.createElement("figure");
        const fullImage = document.createElement("button");
        fullImage.type = "button";
        fullImage.setAttribute("aria-haspopup", "dialog");
        fullImage.setAttribute("aria-label", `Enlarge image: ${item.alt || heading.textContent}`);
        fullImage.title = "View full-size image";
        fullImage.addEventListener("click", () => {
          imageOpener = fullImage;
          activeGallery = galleryItems;
          activeGalleryIndex = galleryItems.findIndex(item => item.src === src);
          showGalleryImage(activeGalleryIndex);
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
      if (gallery.childElementCount) {
        const galleryHead = element("div", "", body);
        galleryHead.className = "project-gallery-heading";
        element("h3", isNaadvriksha ? "Prototype & fieldwork" : "Project gallery", galleryHead);
        element("p", `${gallery.childElementCount} photographs / Click to enlarge`, galleryHead);
        if (isNaadvriksha) {
          gallery.querySelectorAll("figure").forEach((figure, index) => {
            const captions = ["The prototype", "Field demonstration", "System setup", "Wind input", "Electronics & interface", "Outdoor testing"];
            if (!figure.querySelector("figcaption")) element("figcaption", captions[index] || galleryItems[index].alt, figure);
          });
        }
        body.append(gallery);
      }

      const detailsSection = document.createElement("div");
      detailsSection.id = "project-full-description";
      detailsSection.className = "project-full-description";
      detailsSection.hidden = true;
      for (const [key, label] of [["overview", "Overview"], ["process", "Process"], ["outcomes", "Outcomes & reflections"]]) {
        const paragraphs = (Array.isArray(data[key]) ? data[key] : [data[key]]).filter(text => typeof text === "string" && text.trim());
        if (!paragraphs.length) continue;
        const section = document.createElement("section");
        element("h3", label, section);
        paragraphs.forEach(text => element("p", text, section));
        detailsSection.append(section);
      }

      const presentationUrl = data.presentationEmbed || (isNaadvriksha ? "https://www.canva.com/design/DAHWSoVXxvU/k7pYdvq6d76bj_cAUaHcfw/view?embed" : "");
      if (presentationUrl) {
        const presentationLabel = document.createElement("h3");
        presentationLabel.className = "project-presentation-label";
        presentationLabel.textContent = "Project presentation";
        detailsSection.append(presentationLabel);

        const presentation = document.createElement("div");
        presentation.className = "project-presentation-embed";
        const embedFrame = document.createElement("div");
        Object.assign(embedFrame.style, {
          position: "relative",
          width: "100%",
          height: "0",
          paddingTop: "56.25%",
          paddingBottom: "0",
          boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
          marginTop: "0",
          marginBottom: "0.9em",
          overflow: "hidden",
          borderRadius: "8px",
          willChange: "transform"
        });
        const iframe = document.createElement("iframe");
        Object.assign(iframe.style, {
          position: "absolute",
          width: "100%",
          height: "100%",
          top: "0",
          left: "0",
          border: "none",
          padding: "0",
          margin: "0"
        });
        iframe.loading = "lazy";
        iframe.title = `${heading.textContent.trim()} project presentation`;
        iframe.src = presentationUrl;
        iframe.allowFullscreen = true;
        iframe.setAttribute("allow", "fullscreen");
        iframe.setAttribute("mozallowfullscreen", "true");
        iframe.setAttribute("webkitallowfullscreen", "true");
        embedFrame.append(iframe);

        presentation.append(embedFrame);
        detailsSection.append(presentation);
      }

      if (card.id === "project-mtech-thesis" && data.thesisPdf) {
        const thesisLabel = document.createElement("h3");
        thesisLabel.className = "project-presentation-label";
        thesisLabel.textContent = "Thesis";
        detailsSection.append(thesisLabel);

        const thesisCard = document.createElement("div");
        thesisCard.className = "project-thesis-card";

        const thesisCover = document.createElement("img");
        const thesisCoverSrc = safeUrl(data.thesisCover || "assets/Thesis Project/thesis_file_thumbnail.webp");
        thesisCover.src = thesisCoverSrc || "assets/Thesis Project/thesis_file_thumbnail.webp";
        thesisCover.alt = data.thesisTitle || "Thesis cover";
        thesisCover.loading = "lazy";
        Object.assign(thesisCover.style, {
          display: "block",
          width: "100%",
          height: "180px",
          objectFit: "cover",
          borderRadius: "8px",
          border: "1px solid rgba(17,17,17,0.08)"
        });

        const thesisBody = document.createElement("div");
        thesisBody.style.display = "grid";
        thesisBody.style.gap = "0.5rem";

        const thesisTitle = document.createElement("h4");
        thesisTitle.textContent = data.thesisTitle || "Alteration of Aesthetic Properties of CAD Model Using Virtual Reality Technology";
        Object.assign(thesisTitle.style, {
          margin: "0",
          fontSize: "1.15rem",
          lineHeight: "1.35",
          color: "var(--text)"
        });

        const thesisDescription = document.createElement("p");
        thesisDescription.textContent = data.thesisDescription || "A thesis examining how virtual reality can reshape the aesthetic perception and manipulation of CAD models through embodied interaction.";
        Object.assign(thesisDescription.style, {
          margin: "0",
          color: "var(--muted)",
          fontSize: ".96rem",
          lineHeight: "1.55",
          textAlign: "left"
        });

        const thesisLink = document.createElement("a");
        thesisLink.href = data.thesisPdf;
        thesisLink.target = "_blank";
        thesisLink.rel = "noopener noreferrer";
        thesisLink.textContent = "Read Thesis";
        Object.assign(thesisLink.style, {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "fit-content",
          marginTop: ".2rem",
          padding: ".6rem 1rem",
          borderRadius: "8px",
          background: "#111827",
          color: "#fff",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: ".92rem"
        });

        thesisBody.append(thesisTitle, thesisDescription, thesisLink);
        thesisCard.append(thesisCover, thesisBody);
        detailsSection.append(thesisCard);
      }

      const projectLinks = Array.isArray(data.resources) ? data.resources : [];
      if (projectLinks.length) {
        const resourcesHeading = document.createElement("h3");
        resourcesHeading.className = "project-presentation-label";
        resourcesHeading.textContent = "Project links";
        resourcesHeading.style.display = "block";
        resourcesHeading.style.color = "var(--text)";
        resourcesHeading.style.visibility = "visible";
        resourcesHeading.style.opacity = "1";
        detailsSection.append(resourcesHeading);

        const resourcesWrapper = document.createElement("div");
        resourcesWrapper.className = "project-detail-resources";
        resourcesWrapper.style.display = "flex";
        resourcesWrapper.style.flexWrap = "wrap";
        resourcesWrapper.style.gap = "0 1.2rem";
        resourcesWrapper.style.alignItems = "center";
        resourcesWrapper.style.visibility = "visible";
        resourcesWrapper.style.opacity = "1";
        projectLinks.forEach(item => {
          if (!item || !item.label) return;
          const url = safeUrl(item.url);
          if (!url) return;
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = item.label;
          link.style.display = "inline";
          link.style.color = "var(--link)";
          link.style.visibility = "visible";
          link.style.opacity = "1";
          link.style.fontSize = "1.05rem";
          link.style.lineHeight = "1.5";
          link.style.textDecoration = "none";
          resourcesWrapper.append(link);
        });
        if (resourcesWrapper.childElementCount) detailsSection.append(resourcesWrapper);
      }

      const hideRevealButton = ["project-ar-lab-directory", "project-cad-interaction", "project-3d-models"].includes(card.id);
      if (!hideRevealButton && detailsSection.childElementCount) {
        const reveal = document.createElement("button");
        reveal.type = "button";
        reveal.textContent = "Explore the work ↓";
        reveal.className = "project-read-more";
        reveal.setAttribute("aria-expanded", "false");
        reveal.setAttribute("aria-controls", detailsSection.id);
        reveal.addEventListener("click", () => {
          detailsSection.hidden = !detailsSection.hidden;
          dialog.classList.toggle("project-expanded", !detailsSection.hidden);
          reveal.setAttribute("aria-expanded", String(!detailsSection.hidden));
          reveal.textContent = detailsSection.hidden ? "Explore the work ↓" : "Back to overview ↑";
          if (!detailsSection.hidden) detailsSection.scrollIntoView({ block: "start", behavior: "auto" });
          else body.scrollTop = 0;
        });
        body.append(reveal);
      } else {
        detailsSection.hidden = false;
      }
      if (detailsSection.childElementCount) body.append(detailsSection);

      const overview = document.createElement("div");
      overview.className = "project-overview-media";
      const demo = document.createElement("div");
      demo.className = "project-overview-demo";
      const galleryVideo = body.querySelector(".project-details-video");
      if (galleryVideo) {
        demo.append(galleryVideo);
        overview.append(demo);
      }
      const photos = document.createElement("div");
      photos.className = "project-overview-photos";
      const galleryHead = body.querySelector(".project-gallery-heading");
      if (galleryHead) photos.append(galleryHead);
      if (gallery.childElementCount) {
        photos.append(gallery);
        overview.append(photos);
      }
      if (galleryVideo || gallery.childElementCount) {
        body.querySelector(".project-details-summary").after(overview);
      }

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
