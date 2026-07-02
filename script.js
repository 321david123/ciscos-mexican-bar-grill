/* =========================================================
   Cisco's Mexican Bar & Grill — interactions
   GSAP + ScrollTrigger, Lenis smooth scroll, Swiper
   Degrades gracefully + respects reduced motion.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- current year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = "2026";

  /* ---------- Highlight today's row ONLY when actually open now ---------- */
  (function () {
    var rows = $$(".hours tbody tr");
    if (!rows.length) return;
    // open/close in minutes from midnight; close > 1440 = runs past midnight into next day
    var HRS = {
      0: { o: 660, c: 1080 }, // Sun 11:00am – 6:00pm
      1: { o: 660, c: 1260 }, // Mon 11:00am – 9:00pm
      2: { o: 660, c: 1260 }, // Tue 11:00am – 9:00pm
      3: { o: 660, c: 1260 }, // Wed 11:00am – 9:00pm
      4: { o: 660, c: 1260 }, // Thu 11:00am – 9:00pm
      5: { o: 660, c: 1320 }, // Fri 11:00am – 10:00pm
      6: { o: 660, c: 1320 }  // Sat 11:00am – 10:00pm
    };
    var d = new Date();
    var day = d.getDay();                      // 0 Sun .. 6 Sat
    var now = d.getHours() * 60 + d.getMinutes();
    var open = false;
    var rowIndex = day;                        // table order: Sun..Sat
    var t = HRS[day];
    if (t && now >= t.o && now < Math.min(t.c, 1440)) open = true;  // today's shift, up to midnight
    var yDay = (day + 6) % 7;
    var yt = HRS[yDay];                                             // yesterday's late shift
    if (!open && yt && yt.c > 1440 && now < (yt.c - 1440)) { open = true; rowIndex = yDay; }
    if (!open) return;                         // closed → no highlight, no "Open now"
    if (rows[rowIndex]) rows[rowIndex].classList.add("is-now");
  })();

  /* ---------- nav: solidify on scroll ---------- */
  var nav = $("#nav");
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile overlay ---------- */
  var burger = $("#burger");
  var overlay = $("#overlay");
  if (burger && overlay) {
    var toggleMenu = function (open) {
      var isOpen = open != null ? open : !overlay.classList.contains("is-open");
      overlay.classList.toggle("is-open", isOpen);
      burger.classList.toggle("is-open", isOpen);
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      overlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    burger.addEventListener("click", function () { toggleMenu(); });
    $$("#overlay a").forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) toggleMenu(false);
    });
  }

  /* ---------- menu tabs ---------- */
  (function () {
    var tabs = $$(".menu__tab");
    var panels = $$(".menu__panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach(function (p) {
          var match = p.getAttribute("data-panel") === name;
          p.classList.toggle("is-active", match);
          if (match) { p.hidden = false; } else { p.hidden = true; }
        });
        // re-trigger reveal on freshly shown items
        var visible = panels.filter(function (p) { return !p.hidden; })[0];
        if (visible) {
          $$("[data-reveal]", visible).forEach(function (el) { el.classList.add("is-visible"); });
        }
      });
    });
  })();

  /* ---------- Swiper: gallery ---------- */
  if (window.Swiper && $(".gallery__swiper")) {
    new Swiper(".gallery__swiper", {
      slidesPerView: 1.15,
      spaceBetween: 18,
      centeredSlides: false,
      grabCursor: true,
      speed: 600,
      loop: true,
      navigation: { nextEl: ".gallery__swiper .swiper-button-next", prevEl: ".gallery__swiper .swiper-button-prev" },
      pagination: { el: ".gallery__pag", clickable: true },
      breakpoints: {
        600:  { slidesPerView: 2.2, spaceBetween: 22 },
        900:  { slidesPerView: 3,   spaceBetween: 26 },
        1200: { slidesPerView: 3.4, spaceBetween: 30 }
      }
    });
  }

  /* ---------- Swiper: reviews ---------- */
  if (window.Swiper && $(".reviews__swiper")) {
    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      speed: 700,
      loop: true,
      autoplay: reduceMotion ? false : { delay: 5500, disableOnInteraction: false },
      pagination: { el: ".reviews__pag", clickable: true },
      grabCursor: true
    });
  }

  /* =========================================================
     REVEAL — IntersectionObserver fallback (always runs)
     ========================================================= */
  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* =========================================================
     MOTION (skipped under reduced-motion)
     ========================================================= */
  if (reduceMotion) return;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    // anchor links through lenis
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -88 });
      });
    });
  }

  /* ---------- GSAP scroll effects ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
    }

    /* hero Ken-Burns + parallax */
    var heroImg = $("#heroImg");
    if (heroImg) {
      gsap.to(heroImg, { scale: 1.16, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(heroImg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    }

    /* hero title lines stagger in */
    gsap.from(".hero__line", { yPercent: 110, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 });

    /* parallax media blocks */
    $$("[data-parallax] img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: img.closest("[data-parallax]"), start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* animated stat counters */
    $$(".stat__num").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.8, ease: "power2.out",
            onUpdate: function () {
              el.textContent = (decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString("en-US")) + suffix;
            }
          });
        }
      });
    });
  }
})();
