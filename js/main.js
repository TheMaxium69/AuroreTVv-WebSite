/* AuroreTVv — scripts du site (conception Tyrolium) */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  // Menu mobile
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    var closeMenu = function () {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
    };
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    });
    document.querySelectorAll(".main-nav a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Ombre de l'en-tête au défilement
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Apparition progressive des blocs
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Année courante
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Petit message temporaire
  var toast = document.querySelector(".toast");
  var toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2800);
  }

  // Filtres des montages longs
  document.querySelectorAll("[data-filter-for]").forEach(function (group) {
    var grid = document.getElementById(group.getAttribute("data-filter-for"));
    if (!grid) return;
    var buttons = group.querySelectorAll(".filter");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        grid.querySelectorAll(".work-card").forEach(function (card) {
          card.hidden = kind !== "all" && card.getAttribute("data-cat") !== kind;
        });
      });
    });
  });

  // Vidéos : miniatures YouTube et lecteur (chargé seulement au clic)
  var player = document.getElementById("player");
  var frame = player ? player.querySelector(".player-frame") : null;
  var YT_ID = /^[\w-]{11}$/;

  document.querySelectorAll(".work-media").forEach(function (media) {
    var yt = (media.getAttribute("data-youtube") || "").trim();
    var poster = media.getAttribute("data-poster");
    var title = media.getAttribute("data-title") || "la vidéo";
    var hasVideo = YT_ID.test(yt) || !!media.getAttribute("data-video");

    media.setAttribute("aria-label", hasVideo ? "Lire : " + title : title + " (vidéo bientôt en ligne)");
    if (poster) {
      media.style.backgroundImage = "url(\"" + poster + "\")";
      media.classList.add("has-thumb");
    } else if (YT_ID.test(yt)) {
      media.style.backgroundImage = "url(\"https://i.ytimg.com/vi/" + yt + "/hqdefault.jpg\")";
      media.classList.add("has-thumb");
    }

    media.addEventListener("click", function () {
      if (!hasVideo || !player || typeof player.showModal !== "function") {
        if (!hasVideo) showToast("Cette vidéo arrive très bientôt ✦");
        return;
      }
      var tall = media.classList.contains("media-tall");
      var file = media.getAttribute("data-video");
      var el;
      if (file) {
        el = document.createElement("video");
        el.src = file;
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
        if (poster) el.poster = poster;
      } else {
        el = document.createElement("iframe");
        el.src = "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0";
        el.title = title;
        el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        el.allowFullscreen = true;
        el.referrerPolicy = "strict-origin-when-cross-origin";
      }
      frame.innerHTML = "";
      frame.appendChild(el);
      player.classList.toggle("is-tall", tall);
      player.showModal();
    });
  });

  if (player) {
    var closePlayer = function () { if (player.open) player.close(); };
    player.querySelector(".player-close").addEventListener("click", closePlayer);
    player.addEventListener("click", function (e) {
      if (e.target === player) closePlayer();
    });
    player.addEventListener("close", function () { frame.innerHTML = ""; });
  }

  // Formulaire de contact : validation puis ouverture de la messagerie
  var form = document.getElementById("contact-form");
  if (!form) return;

  // Pré-sélection du format via ?format=...
  var formatParam = new URLSearchParams(window.location.search).get("format");
  if (formatParam && form.format) {
    Array.prototype.forEach.call(form.format.options, function (opt) {
      if (opt.value === formatParam) form.format.value = formatParam;
    });
  }

  function setInvalid(el, invalid) {
    var wrap = el.closest(".field") || el.closest(".consent");
    if (wrap) wrap.classList.toggle("invalid", invalid);
    el.setAttribute("aria-invalid", invalid ? "true" : "false");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    var first = null;

    form.querySelectorAll("[required]").forEach(function (el) {
      var ok = el.type === "checkbox" ? el.checked : el.value.trim() !== "";
      if (ok && el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      setInvalid(el, !ok);
      if (!ok) {
        valid = false;
        if (!first) first = el;
      }
    });

    if (!valid) {
      first.focus();
      return;
    }

    var d = form.elements;
    var body = [
      "Pseudo / nom : " + d.nom.value.trim(),
      "E-mail : " + d.email.value.trim(),
      "Chaîne : " + (d.chaine.value.trim() || "—"),
      "Type de montage : " + d.format.value,
      "Rythme : " + (d.volume.value || "—"),
      "Délai : " + (d.delai.value.trim() || "—"),
      "",
      d.message.value.trim()
    ].join("\n");

    var subject = "[Portfolio] " + d.format.value + " — " + d.nom.value.trim();
    var to = form.getAttribute("data-to");
    window.location.href = "mailto:" + to +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    var status = form.querySelector(".form-status");
    if (status) status.classList.add("show");
  });

  form.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener("input", function () { setInvalid(el, false); });
    el.addEventListener("change", function () { setInvalid(el, false); });
  });
})();
