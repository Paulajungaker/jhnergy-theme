document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("CategoryFilterToggle");
  const panel = document.querySelector(".category-filters-panel");
  const backdrop = document.getElementById("CategoryFiltersBackdrop");
  const closeBtn = document.getElementById("CategoryFiltersClose");

  // Om vi inte är på category-sidan: avbryt
  if (!toggleBtn || !panel || !backdrop) {
    console.log("[category] Filter UI not found, aborting.");
    return;
  }

  /* =============================
     OPEN/CLOSE FILTER PANEL
     ============================= */
  const openPanel = () => {
    panel.classList.add("is-open");
    backdrop.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };

  const closePanel = () => {
    panel.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    document.body.style.overflow = "";
  };

  toggleBtn.addEventListener("click", () => {
    if (panel.classList.contains("is-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  backdrop.addEventListener("click", closePanel);
  if (closeBtn) {
    closeBtn.addEventListener("click", closePanel);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      closePanel();
    }
  });

  /* =============================
     PRICE RANGE – PROGRESS FILL
     ============================= */
  const ranges = document.querySelectorAll(".category-filter-price__range");

  ranges.forEach((range) => {
    const updateTrack = () => {
      const percent =
        ((range.value - range.min) / (range.max - range.min)) * 100;

      range.style.background = `
        linear-gradient(
          to right,
          var(--color-primary-600) 0%,
          var(--color-primary-600) ${percent}%,
          #e5e5e5 ${percent}%,
          #e5e5e5 100%
        )
      `;
    };

    updateTrack();
    range.addEventListener("input", updateTrack);
  });

  /* =============================
     CATEGORY CHECKBOX FILTERING
     ============================= */
  const categoryCheckboxes = document.querySelectorAll(
    ".category-filter-checkbox input[data-filter-category]"
  );
  const productCards = document.querySelectorAll(".category-product-card");
  const applyBtn = document.querySelector(".category-filter-apply");

  console.log("[category] checkboxes:", categoryCheckboxes.length);
  console.log("[category] product cards:", productCards.length);

  const applyCategoryFilter = () => {
    const activeValues = Array.from(categoryCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    console.log("[category] active values:", activeValues);

    if (!productCards.length) return;

    // Inga valda → visa allt
    if (activeValues.length === 0) {
      productCards.forEach((card) => {
        card.style.display = "";
      });
      return;
    }

    productCards.forEach((card) => {
      const cardCategory = card.dataset.category;

      if (!cardCategory) {
        card.style.display = "";
        return;
      }

      if (activeValues.includes(cardCategory)) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  };

  // Lyssna på förändring + apply-knapp
  categoryCheckboxes.forEach((cb) => {
    cb.addEventListener("change", applyCategoryFilter);
  });

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      applyCategoryFilter();
      if (window.innerWidth < 768) {
        closePanel(); // stäng panelen på mobil efter Apply
      }
    });
  }

  // Initialt läge
  applyCategoryFilter();
});
