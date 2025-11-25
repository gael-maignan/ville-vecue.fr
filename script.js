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





    // Sélectionner tous les éléments avec la classe "appear"
  const elements = document.querySelectorAll(".appear");

  const observer2 = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("appear-visible"); // Ajout de la classe pour l'animation
        obs.unobserve(entry.target); // Empêche l'animation de rejouer
      }
    });
  }, {
    threshold: 0.2 // Déclenchement lorsque 20% de l'élément est visible
  });

  elements.forEach(element => observer2.observe(element)); // Observer chaque élément "appear"
});

