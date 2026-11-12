/* Studio Dentistico Dott. Samuele Sanna — pagina Contatti
   Modulo dimostrativo (nessun invio) e mappa Google caricata solo su richiesta. */

(function () {
  "use strict";

  /* ---------- Modulo richiesta appuntamento (statico) ---------- */
  const form = document.getElementById("booking-form");
  const status = document.getElementById("booking-status");
  if (form && status) {
    // L'evento submit parte solo se la validazione nativa del browser è superata.
    form.addEventListener("submit", e => {
      e.preventDefault();
      // TODO: collegare al servizio scelto (email, CRM o gestionale) prima della messa online.
      const nome = (form.elements.nome.value || "").trim().split(" ")[0];
      status.textContent = "Grazie" + (nome ? ", " + nome : "") + ". Questa è un'anteprima: la richiesta non è stata inviata. Sul sito definitivo la segreteria ti richiamerà al numero indicato.";
      status.classList.add("is-ok");
      form.reset();
    });
  }

  /* ---------- Mappa a due clic ---------- */
  const mapBox = document.querySelector(".map-box[data-map-src]");
  const loadBtn = mapBox && mapBox.querySelector("[data-map-load]");
  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = mapBox.dataset.mapSrc;
      iframe.title = "Mappa: Studio Dentistico Dott. Samuele Sanna, Via Cagliari 259, Oristano";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.setAttribute("allowfullscreen", "");
      mapBox.querySelector(".map-consent").remove();
      mapBox.appendChild(iframe);
      iframe.focus();
    });
  }
})();
