const navLinks = document.querySelectorAll(".nav-links a");
const navMenu = document.querySelector("#navLinks");
const menuToggle = document.querySelector(".menu-toggle");
const loginModal = document.querySelector("#loginModal");
const form = document.querySelector("#bookingForm");
const formNote = document.querySelector("#formNote");
const subjectSelect = form?.querySelector('select[name="subject"]');

function closeMenu() {
  navMenu?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closeMenu();
  });
});

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#resources")?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.querySelector("input")?.focus({ preventScroll: true });
  });
});

document.querySelectorAll("[data-open-login]").forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof loginModal?.showModal === "function") {
      loginModal.showModal();
      document.body.classList.add("modal-open");
    }
  });
});

document.querySelector(".close-modal")?.addEventListener("click", () => {
  loginModal?.close();
});

loginModal?.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
});

loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    loginModal.close();
  }
});

document.querySelectorAll(".subject-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".subject-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    if (subjectSelect) {
      subjectSelect.value = card.dataset.subject || "";
    }
    document.querySelector("#resources")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    document.querySelector("#resources")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (formNote) {
      formNote.textContent = `تم اختيار ${plan}. أكمل البيانات لتثبيت الحجز.`;
    }
  });
});

document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    const isExpanded = item.getAttribute("aria-expanded") === "true";
    item.setAttribute("aria-expanded", String(!isExpanded));
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const isComplete = ["name", "phone", "subject", "time"].every((field) => {
    const value = String(data.get(field) || "").trim();
    return value.length > 0;
  });

  if (!isComplete) {
    formNote.textContent = "يرجى تعبئة كل الحقول قبل تأكيد الحجز.";
    form.reportValidity();
    return;
  }

  formNote.textContent = "تم استلام طلبك. سنتواصل معك لتأكيد المحاضرة المجانية.";
  form.reset();
  document.querySelectorAll(".subject-card").forEach((item) => item.classList.remove("selected"));
});
