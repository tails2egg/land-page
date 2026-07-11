const navLinks = document.querySelectorAll(".nav-links a");
const navMenu = document.querySelector("#navLinks");
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const loginModal = document.querySelector("#loginModal");
const form = document.querySelector("#bookingForm");
const formNote = document.querySelector("#formNote");
const levelAdvisor = document.querySelector("#levelAdvisor");
const advisorResult = document.querySelector("#advisorResult");
const subjectSelect = form?.querySelector('select[name="subject"]');
const timeSelect = form?.querySelector('select[name="time"]');
const subjectCards = document.querySelectorAll(".subject-card");
const planButtons = document.querySelectorAll("[data-plan]");
const faqItems = document.querySelectorAll(".faq-item");
const STORAGE_KEY = "tutorings-booking-draft";
const selectedChoices = {
  level: "",
  plan: "",
};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(
  ".hero-copy, .hero-visual, .section-wrap, .booking, .step-card, .subject-card, .level-advisor, .plan-card, .faq-item"
);

const levelNotes = {
  "A1 - مبتدئ": "ابدأ من الأساسيات حتى تبني قاعدة واضحة.",
  "A2 - أساسي": "ابدأ بمحادثات بسيطة وتصحيح مستمر.",
  "B1 - متوسط": "مستوى مناسب لتطوير المحادثة اليومية بثقة.",
  "B2 - فوق المتوسط": "ابدأ بنقاشات أطول وكتابة عملية أو أكاديمية.",
  "C1 - متقدم": "ابدأ بتحضير متقدم ومفردات احترافية.",
};

const levels = Object.keys(levelNotes);
const goalScores = {
  basics: 0,
  conversation: 1.15,
  academic: 2.1,
  ielts: 3.15,
};
const confidenceOffsets = {
  low: -0.35,
  medium: 0,
  high: 0.6,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getRecommendation(goal, confidence) {
  const levelIndex = clamp(Math.round((goalScores[goal] ?? 0) + (confidenceOffsets[confidence] ?? 0)), 0, levels.length - 1);
  const level = levels[levelIndex];
  let plan = "خطة شهرية";

  if (goal === "ielts") {
    plan = "تحضير اختبار";
  } else if (confidence === "low" || levelIndex <= 1) {
    plan = "جلسة واحدة";
  }

  return {
    level,
    plan,
    note: levelNotes[level],
  };
}

function normalizePhone(value) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const easternDigits = "۰۱۲۳۴۵۶۷۸۹";
  const normalized = String(value || "")
    .replace(/[٠-٩]/g, (digit) => arabicDigits.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => easternDigits.indexOf(digit))
    .replace(/[^\d+]/g, "");

  if (normalized.startsWith("+9665")) return `05${normalized.slice(5)}`;
  if (normalized.startsWith("9665")) return `05${normalized.slice(4)}`;
  if (normalized.startsWith("5") && normalized.length === 9) return `0${normalized}`;
  return normalized;
}

function getField(name) {
  return form?.querySelector(`[name="${name}"]`);
}

function updateBookingNote(message) {
  if (!formNote) return;

  if (message) {
    formNote.textContent = message;
    return;
  }

  const parts = [];
  if (selectedChoices.level) parts.push(`المستوى ${selectedChoices.level}`);
  if (selectedChoices.plan) parts.push(`الخطة ${selectedChoices.plan}`);
  if (timeSelect?.value) parts.push(`الوقت ${timeSelect.value}`);

  formNote.textContent = parts.length ? `اختياراتك الحالية: ${parts.join("، ")}. أكمل البيانات لتثبيت الحجز.` : "";
}

function updateFormReadyState() {
  if (!form) return;

  const name = String(getField("name")?.value || "").trim();
  const phone = normalizePhone(getField("phone")?.value || "");
  const isReady = name.split(/\s+/).filter(Boolean).length >= 2 && /^05\d{8}$/.test(phone) && Boolean(subjectSelect?.value) && Boolean(timeSelect?.value);

  form.classList.toggle("is-ready", isReady);
}

function saveDraft() {
  if (!form) return;

  const draft = {
    name: getField("name")?.value || "",
    phone: getField("phone")?.value || "",
    subject: subjectSelect?.value || "",
    time: timeSelect?.value || "",
    plan: selectedChoices.plan,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Local storage can be unavailable in strict privacy modes.
  }
}

function setSelectedSubject(level, options = {}) {
  selectedChoices.level = level || "";
  subjectCards.forEach((item) => {
    item.classList.toggle("selected", item.dataset.subject === selectedChoices.level);
  });

  if (subjectSelect) {
    subjectSelect.value = selectedChoices.level;
  }

  if (options.scroll) {
    smoothScrollTo("#resources");
  }

  if (!options.silent) {
    updateBookingNote(options.note);
    saveDraft();
  }

  updateFormReadyState();
}

function setSelectedPlan(plan, options = {}) {
  selectedChoices.plan = plan || "";
  planButtons.forEach((button) => {
    const card = button.closest(".plan-card");
    card?.classList.toggle("selected", button.dataset.plan === selectedChoices.plan);
    button.textContent = button.dataset.plan === selectedChoices.plan ? "تم اختيار الخطة" : "اختر هذه الخطة";
  });

  if (options.scroll) {
    smoothScrollTo("#resources");
  }

  if (!options.silent) {
    updateBookingNote(options.note);
    saveDraft();
  }

  updateFormReadyState();
}

function validateBookingForm() {
  if (!form) return false;

  const nameInput = getField("name");
  const phoneInput = getField("phone");
  const requiredFields = [nameInput, phoneInput, subjectSelect, timeSelect].filter(Boolean);
  let firstInvalid = null;

  requiredFields.forEach((field) => {
    field.setCustomValidity("");
    field.classList.remove("field-invalid");
  });

  const name = String(nameInput?.value || "").trim();
  if (nameInput && name.split(/\s+/).filter(Boolean).length < 2) {
    nameInput.setCustomValidity("اكتب الاسم الكامل من كلمتين على الأقل.");
  }

  if (phoneInput) {
    const phone = normalizePhone(phoneInput.value);
    phoneInput.value = phone;
    if (!/^05\d{8}$/.test(phone)) {
      phoneInput.setCustomValidity("اكتب رقم جوال سعودي صحيح بصيغة 05xxxxxxxx.");
    }
  }

  requiredFields.forEach((field) => {
    if (!field.value.trim() && !field.validationMessage) {
      field.setCustomValidity("هذا الحقل مطلوب.");
    }
    const isInvalid = !field.checkValidity();
    field.classList.toggle("field-invalid", isInvalid);
    if (isInvalid && !firstInvalid) {
      firstInvalid = field;
    }
  });

  if (firstInvalid) {
    updateBookingNote(firstInvalid.validationMessage || "يرجى تعبئة كل الحقول قبل تأكيد الحجز.");
    firstInvalid.focus({ preventScroll: true });
    return false;
  }

  return true;
}

function restoreDraft() {
  if (!form) return;

  try {
    const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const nameInput = getField("name");
    const phoneInput = getField("phone");
    if (draft.name && nameInput) nameInput.value = draft.name;
    if (draft.phone && phoneInput) phoneInput.value = draft.phone;
    if (draft.time && timeSelect) timeSelect.value = draft.time;
    if (draft.subject) setSelectedSubject(draft.subject);
    if (draft.plan) setSelectedPlan(draft.plan);
    updateBookingNote();
    updateFormReadyState();
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
}

function smoothScrollTo(selector) {
  if (selector === "#top") {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
    return;
  }

  document.querySelector(selector)?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
}

function closeMenu() {
  navMenu?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

function updateHeaderState() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 10);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  siteHeader?.style.setProperty("--scroll-progress", progress.toFixed(4));
}

menuToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = link.getAttribute("href");
    if (target?.startsWith("#")) {
      event.preventDefault();
      smoothScrollTo(target);
    }

    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    closeMenu();
  });
});

document.querySelectorAll('.brand, .ghost-btn[href^="#"], .site-footer a[href^="#"], .support-panel a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = link.getAttribute("href");
    if (!target?.startsWith("#")) return;
    event.preventDefault();
    smoothScrollTo(target);
    closeMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!navMenu?.classList.contains("open")) return;
  if (navMenu.contains(event.target) || menuToggle?.contains(event.target)) return;
  closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.bookIntent === "specialist") {
      setSelectedPlan("جلسة واحدة", {
        note: "رائع. احجز جلستك المجانية الآن، وسنحدد مستواك وخطتك مع متخصص قبل أي اشتراك.",
      });
    }

    smoothScrollTo("#resources");
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

subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    setSelectedSubject(card.dataset.subject || "", {
      scroll: true,
      note: `تم اختيار ${card.dataset.subject}. أكمل البيانات لتثبيت الحجز.`,
    });
  });
});

levelAdvisor?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(levelAdvisor);
  const goal = data.get("goal");
  const confidence = data.get("confidence");

  const recommendation = getRecommendation(goal, confidence);
  setSelectedSubject(recommendation.level);
  setSelectedPlan(recommendation.plan);

  if (advisorResult) {
    advisorResult.textContent = `نقترح لك: ${recommendation.level}. ${recommendation.note} والخطة الأنسب: ${recommendation.plan}.`;
  }

  updateBookingNote(`تم اختيار ${recommendation.level} وخطة ${recommendation.plan} بناءً على إجاباتك.`);
});

planButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedPlan(button.dataset.plan || "", {
      scroll: true,
      note: `تم اختيار ${button.dataset.plan}. أكمل البيانات لتثبيت الحجز.`,
    });
  });
});

faqItems.forEach((item) => {
  item.addEventListener("click", () => {
    const isExpanded = item.getAttribute("aria-expanded") === "true";
    faqItems.forEach((faq) => {
      if (faq !== item) {
        faq.setAttribute("aria-expanded", "false");
      }
    });
    item.setAttribute("aria-expanded", String(!isExpanded));
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateBookingForm()) {
    return;
  }

  const summary = [
    subjectSelect?.value ? `مستوى ${subjectSelect.value}` : "",
    selectedChoices.plan ? `خطة ${selectedChoices.plan}` : "",
    timeSelect?.value ? `موعد ${timeSelect.value}` : "",
  ].filter(Boolean);

  formNote.textContent = `تم استلام طلبك${summary.length ? ` (${summary.join("، ")})` : ""}. سنتواصل معك لتأكيد المحاضرة المجانية.`;
  form.reset();
  setSelectedSubject("", { silent: true });
  setSelectedPlan("", { silent: true });
  updateFormReadyState();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
});

form?.addEventListener("input", (event) => {
  event.target?.classList?.remove("field-invalid");
  saveDraft();
  updateFormReadyState();
});

form?.addEventListener("change", (event) => {
  if (event.target === subjectSelect) {
    setSelectedSubject(subjectSelect.value);
  } else {
    updateBookingNote();
    saveDraft();
  }
  updateFormReadyState();
});

revealItems.forEach((item) => item.classList.add("reveal"));

if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -70px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sectionLinks = Array.from(navLinks)
  .map((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    return section ? { link, section } : null;
  })
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const current = sectionLinks.find((item) => item.section === visible.target);
      if (!current) return;

      navLinks.forEach((link) => link.classList.remove("active"));
      current.link.classList.add("active");
    },
    { threshold: [0.18, 0.32, 0.5], rootMargin: "-18% 0px -58% 0px" }
  );

  sectionLinks.forEach(({ section }) => navObserver.observe(section));
}

restoreDraft();
updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });
