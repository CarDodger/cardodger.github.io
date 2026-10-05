/* CarDodger site behaviour. No framework, no scroll listeners.
   1) Reveal-on-scroll via IntersectionObserver (hierarchy: content arrives in reading order).
   2) Magnetic primary CTA on fine pointers (feedback: the button leans toward the cursor).
   3) Theme switch. Starts on the system theme. A click flips to the other theme
      and remembers it; flipping back to the system theme clears the override.
   Motion is skipped under prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---- theme ---- */
  var KEY = "cd-theme";
  var sysDark = window.matchMedia("(prefers-color-scheme: dark)");
  var buttons = document.querySelectorAll("[data-theme-toggle]");
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  var BG = { light: "#eceef0", dark: "#0e1012" };

  function current() {
    return root.getAttribute("data-theme") || (sysDark.matches ? "dark" : "light");
  }
  function sync() {
    var t = current();
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", t === "dark" ? "true" : "false"); });
    var forced = root.getAttribute("data-theme");
    metas.forEach(function (m) {
      /* Manual choice: both tags carry that theme's color. System: back to light/dark by media. */
      var isDarkTag = (m.getAttribute("media") || "").indexOf("dark") > -1;
      m.setAttribute("content", forced ? BG[forced] : (isDarkTag ? BG.dark : BG.light));
    });
  }
  function apply(next) {
    /* next equals the system theme -> drop the override and follow the system again. */
    var system = sysDark.matches ? "dark" : "light";
    try {
      if (next === system) { root.removeAttribute("data-theme"); localStorage.removeItem(KEY); }
      else { root.setAttribute("data-theme", next); localStorage.setItem(KEY, next); }
    } catch (e) {
      root.setAttribute("data-theme", next);
    }
    sync();
  }
  function toggle(btn) {
    var next = current() === "dark" ? "light" : "dark";
    if (reduce || !document.startViewTransition) { apply(next); return; }
    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-vt");
    var vt = document.startViewTransition(function () { apply(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] },
        { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
    vt.finished.finally(function () { root.classList.remove("theme-vt"); });
  }
  buttons.forEach(function (b) { b.addEventListener("click", function () { toggle(b); }); });
  /* Follow live system changes while there is no manual override. */
  (sysDark.addEventListener ? sysDark.addEventListener.bind(sysDark, "change") : sysDark.addListener.bind(sysDark))(sync);
  sync();

  /* ---- reveal on scroll ---- */
  var items = document.querySelectorAll("[data-reveal]");
  if (items.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- magnetic CTA ---- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduce && fine) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1) + "px");
        el.style.setProperty("--my", ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }
})();
