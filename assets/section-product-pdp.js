document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     GALLERY – THUMBNAILS
     ========================= */
  const mainImage = document.querySelector(".pdp-gallery__main-image");
  const thumbButtons = document.querySelectorAll(".pdp-thumb");

  if (mainImage && thumbButtons.length > 0) {
    thumbButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const img = btn.querySelector("img");
        if (!img) return;

        mainImage.src = img.src;
        mainImage.srcset = img.srcset || "";
        mainImage.alt = img.alt || "";

        thumbButtons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
  }

  /* =========================
     ACCORDION – PRODUCT DETAILS
     ========================= */
  const accordionItems = document.querySelectorAll(".pdp-accordion__item");

  accordionItems.forEach((item) => {
    const header = item.querySelector(".pdp-accordion__header");
    if (!header) return;

    header.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Stäng alla först
      accordionItems.forEach((i) => i.classList.remove("is-open"));

      // Öppna bara den klickade om den inte redan var öppen
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });

  /* =========================
     QUANTITY STEPPER
     ========================= */
  const qtyContainer = document.querySelector(".pdp-qty__controls");
  if (qtyContainer) {
    const btns = qtyContainer.querySelectorAll(".pdp-qty__btn");
    const valueEl = qtyContainer.querySelector(".pdp-qty__value");
    const qtyInput = document.getElementById("PdpQtyInput");
    let current = 1;

    const render = () => {
      if (valueEl) valueEl.textContent = String(current);
      if (qtyInput) qtyInput.value = String(current);
    };

    if (btns.length === 2) {
      const minusBtn = btns[0];
      const plusBtn = btns[1];

      minusBtn.addEventListener("click", () => {
        if (current > 1) {
          current -= 1;
          render();
        }
      });

      plusBtn.addEventListener("click", () => {
        current += 1;
        render();
      });
    }

    render();
  }

  /* =========================
     VARIANT-LOGIK (Color/Size)
     ========================= */
  const variantsEl = document.getElementById("PdpVariantsJSON");
  const optionsEl = document.getElementById("PdpOptionsJSON");
  const priceEl = document.querySelector(".pdp-buy__price");
  const colorLabelEl = document.querySelector(".pdp-color-label");
  const variantIdInput = document.getElementById("PdpVariantId");
  const buyButton = document.getElementById("PdpBuyButton");

  if (!variantsEl || !optionsEl || !priceEl) {
    // Om något saknas, hoppa över variant-logiken
    return;
  }

  let variants = [];
  let optionNames = [];

  try {
    variants = JSON.parse(variantsEl.textContent || "[]");
    optionNames = JSON.parse(optionsEl.textContent || "[]");
  } catch (e) {
    console.warn("[PDP] Could not parse variant JSON", e);
    return;
  }

  if (!variants.length) return;

  // Håller koll på valda options, t.ex. { Color: 'Black', Talla: 'M' }
  const selectedOptions = {};

  // 1) Läs av knappar som redan har .is-active (Color / Size / Talla)
  document
    .querySelectorAll(".pdp-color-swatch.is-active, .pdp-size-pill.is-active")
    .forEach((btn) => {
      const optionName = btn.getAttribute("data-option"); // t.ex. "Color" eller "Talla"
      const value = btn.getAttribute("data-value");
      if (optionName && value) {
        selectedOptions[optionName] = value;
      }
    });

  // 2) Fyll på saknade värden med första varianten som fallback
  const firstVariant = variants[0];
  optionNames.forEach((name, idx) => {
    const key = "option" + (idx + 1); // option1, option2, ...
    if (!selectedOptions[name] && firstVariant[key]) {
      selectedOptions[name] = firstVariant[key];
    }
  });

  // Hjälpare: hitta matchande variant utifrån selectedOptions
  const findMatchingVariant = () => {
    return variants.find((variant) => {
      return optionNames.every((name, idx) => {
        const key = "option" + (idx + 1);
        const wanted = selectedOptions[name];

        if (!wanted) return true; // ej valt ännu – ignorera
        return variant[key] === wanted;
      });
    });
  };

  const updateUIForVariant = (variant) => {
    if (!variant) return;

    // Uppdatera pris
    if (variant.price_formatted) {
      priceEl.textContent = variant.price_formatted;
    } else if (variant.price) {
      priceEl.textContent = (variant.price / 100).toFixed(2);
    }

    // Uppdatera hidden variant-id i formuläret
    if (variantIdInput && variant.id) {
      variantIdInput.value = variant.id;
    }

    // ⭐ Hantera Buy Now utifrån lager
    if (buyButton) {
      if (variant.available) {
        buyButton.disabled = false;
        buyButton.classList.remove("is-disabled");
      } else {
        buyButton.disabled = true;
        buyButton.classList.add("is-disabled");
      }
    }
  };

  // Kolla vilka kombinationer som finns i lager och disable knappar därefter
  const updateOptionButtonsAvailability = () => {
    optionButtons.forEach((btn) => {
      const optionName = btn.getAttribute("data-option");
      const value = btn.getAttribute("data-value");
      if (!optionName || !value) return;

      // Testa om det finns någon variant i lager med denna kombination
      const tempSelection = { ...selectedOptions, [optionName]: value };

      const hasAvailableVariant = variants.some((variant) => {
        // Alla valda options måste matcha varianten
        const matchesSelection = optionNames.every((name, idx) => {
          const key = "option" + (idx + 1);
          const wanted = tempSelection[name];
          if (!wanted) return true; // inte valt än → ignorera
          return variant[key] === wanted;
        });

        return matchesSelection && variant.available;
      });

      if (!hasAvailableVariant) {
        btn.classList.add("is-disabled");
        btn.setAttribute("aria-disabled", "true");
      } else {
        btn.classList.remove("is-disabled");
        btn.removeAttribute("aria-disabled");
      }
    });

    // ----- Uppdatera färg-label (pdp-color-label) -----
    if (colorLabelEl) {
      const selectedColor = selectedOptions["Color"];

      const selectedColorAvailable = variants.some((variant) => {
        const matchesColor =
          variant.option1 === selectedColor ||
          variant.option2 === selectedColor ||
          variant.option3 === selectedColor;

        const matchesOtherOptions = optionNames.every((name, idx) => {
          const key = "option" + (idx + 1);
          const wanted = selectedOptions[name];
          if (!wanted) return true;
          return variant[key] === wanted;
        });

        return matchesColor && matchesOtherOptions && variant.available;
      });

      if (!selectedColorAvailable) {
        colorLabelEl.classList.add("is-disabled");
      } else {
        colorLabelEl.classList.remove("is-disabled");
      }
    }
  };

  const updateColorLabelFromSelection = () => {
    if (!colorLabelEl) return;

    const selectedColorBtn = document.querySelector(
      ".pdp-color-swatch.is-active[data-option='Color']"
    );

    const text =
      selectedColorBtn?.getAttribute("data-value") ||
      colorLabelEl.dataset.defaultLabel ||
      "";

    colorLabelEl.textContent = text;
  };

  // Knappar för Color & Size
  const optionButtons = document.querySelectorAll(
    ".pdp-color-swatch[data-option], .pdp-size-pill[data-option]"
  );

  optionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("is-disabled")) return;

      const optionName = btn.getAttribute("data-option");
      const value = btn.getAttribute("data-value");
      if (!optionName || !value) return;

      // Sätt aktiv klass på den valda, ta bort från syskon
      optionButtons.forEach((b) => {
        if (b.getAttribute("data-option") === optionName) {
          b.classList.remove("is-active");
        }
      });
      btn.classList.add("is-active");

      // Uppdatera state
      selectedOptions[optionName] = value;

      // Hitta variant + uppdatera UI
      const match = findMatchingVariant();
      updateUIForVariant(match);

      if (optionName === "Color") {
        updateColorLabelFromSelection();
      }

      // Lägg till:
      updateOptionButtonsAvailability();
    });
  });

  const colorSwatches = document.querySelectorAll(
    ".pdp-color-swatch[data-option='Color']"
  );

  if (colorLabelEl && colorSwatches.length) {
    colorSwatches.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const value = btn.getAttribute("data-value");
        if (value) {
          colorLabelEl.textContent = value;
        }
      });

      btn.addEventListener("mouseleave", () => {
        // Gå tillbaka till vald färg (eller default) när man lämnar
        updateColorLabelFromSelection();
      });
    });

    // Sätt initial text baserat på aktiv knapp direkt vid load
    updateColorLabelFromSelection();
  }

  // Initialt: uppdatera UI för första varianten
  updateUIForVariant(firstVariant);
  updateColorLabelFromSelection();
  updateOptionButtonsAvailability();

  /* =========================
     BUY NOW – FORCE FORM SUBMIT
     ========================= */
  const pdpForm = document.getElementById("PdpForm");
  const pdpBuyButton = document.getElementById("PdpBuyButton");

  if (pdpForm && pdpBuyButton) {
    pdpBuyButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pdpForm.submit();
    });
  }
});
