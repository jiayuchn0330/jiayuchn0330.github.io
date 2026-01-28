/* Shared JS for jiayuchn0330.github.io (no build step). */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-")) node.setAttribute(k, String(v));
    else if (k === "html") node.innerHTML = String(v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) node.append(child);
  return node;
}

function ensureImageModal() {
  let dialog = document.getElementById("image-modal");
  if (dialog) return dialog;

  dialog = el("dialog", { id: "image-modal", class: "image-modal" });
  const inner = el("div", { class: "image-modal__inner" });
  const closeBtn = el("button", { class: "image-modal__close", type: "button", "aria-label": "Close" }, [
    document.createTextNode("Close"),
  ]);
  const img = el("img", { class: "image-modal__img", alt: "" });
  const caption = el("div", { class: "image-modal__caption" });
  inner.append(closeBtn, img, caption);
  dialog.append(inner);
  document.body.append(dialog);

  function close() {
    if (dialog.open) dialog.close();
  }
  closeBtn.addEventListener("click", close);
  dialog.addEventListener("click", (e) => {
    // Click on backdrop closes
    if (e.target === dialog) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return dialog;
}

function openImageModal({ src, alt }) {
  const dialog = ensureImageModal();
  const img = dialog.querySelector(".image-modal__img");
  const caption = dialog.querySelector(".image-modal__caption");
  img.src = src;
  img.alt = alt || "";
  caption.textContent = alt || "";
  if (!dialog.open) dialog.showModal();
}

async function renderCalvinGallery(container) {
  const manifestUrl = container.dataset.manifest || "calvin/manifest.json";

  container.classList.add("gallery");
  container.setAttribute("aria-live", "polite");
  container.textContent = "Loading photos…";

  let manifest;
  try {
    const res = await fetch(manifestUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = await res.json();
  } catch (err) {
    container.textContent =
      "No Calvin photo manifest found yet. Add images to /calvin and create calvin/manifest.json.";
    container.classList.add("gallery--empty");
    return;
  }

  const images = Array.isArray(manifest?.images) ? manifest.images : [];
  if (images.length === 0) {
    container.textContent = "No images listed in calvin/manifest.json yet.";
    container.classList.add("gallery--empty");
    return;
  }

  container.textContent = "";
  for (const item of images) {
    const src = typeof item?.src === "string" ? item.src : "";
    const alt = typeof item?.alt === "string" ? item.alt : "Photo";
    if (!src) continue;

    const thumb = el("button", { class: "gallery__item", type: "button" });
    const img = el("img", {
      class: "gallery__img",
      src: `calvin/${src}`.replaceAll("//", "/"),
      alt,
      loading: "lazy",
      decoding: "async",
    });
    img.addEventListener("error", () => {
      thumb.classList.add("is-missing");
      thumb.disabled = true;
      thumb.setAttribute("aria-disabled", "true");
      img.remove();
      thumb.append(el("div", { class: "gallery__missing", text: "Missing file" }));
    });
    thumb.append(img);
    thumb.addEventListener("click", () => openImageModal({ src: img.src, alt }));
    container.append(thumb);
  }
}

function wireUp() {
  document.querySelectorAll("[data-calvin-gallery]").forEach((container) => {
    renderCalvinGallery(container);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wireUp);
} else {
  wireUp();
}

