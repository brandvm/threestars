/** Keep Webflow's native form handling; its public API cannot yet write
 * placeholders or select choices. Their values remain editable attributes. */
export function initContactForm(): void {
  document.querySelectorAll<HTMLElement>("[data-contact-section]").forEach((section) => {
    section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-contact-placeholder]")
      .forEach((input) => {
        input.placeholder = input.dataset.contactPlaceholder || "";
      });

    section.querySelectorAll<HTMLSelectElement>("select[data-contact-subject]").forEach((select) => {
      const subjects = (select.dataset.contactSubject || "").split("|").map((value) => value.trim()).filter(Boolean);
      if (!subjects.length) return;
      const selected = select.value;
      const placeholder = new Option(`Select — ${subjects.join(" · ")}`, "");
      select.replaceChildren(placeholder, ...subjects.map((subject) => new Option(subject, subject)));
      select.value = subjects.includes(selected) ? selected : "";
      const syncEmptyState = () => select.toggleAttribute("data-empty", select.value === "");
      if (!select.dataset.contactInitialized) select.addEventListener("change", syncEmptyState);
      select.dataset.contactInitialized = "true";
      syncEmptyState();
    });
  });
}
