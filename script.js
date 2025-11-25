document.addEventListener("DOMContentLoaded", () => {
  const titles = document.querySelectorAll("h2");

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("h2-visible");
        obs.unobserve(entry.target); // Empêche l'animation de rejouer
      }
    });
  }, {
    threshold: 0.2 // déclenche quand 20% du titre est visible
  });

  titles.forEach(h2 => observer.observe(h2));
});
