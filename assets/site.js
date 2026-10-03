/* CarDodger site behaviour. No framework, no scroll listeners.
   1) Reveal-on-scroll via IntersectionObserver (hierarchy: content arrives in reading order).
   2) Magnetic primary CTA on fine pointers (feedback: the button leans toward the cursor).
   Both are skipped under prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
