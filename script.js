const navLinks = document.querySelectorAll(".nav-links a");
const navMenu = document.querySelector("#navLinks");
const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const loginModal = document.querySelector("#loginModal");
const loginForm = loginModal?.querySelector(".modal-card");
const form = document.querySelector("#bookingForm");
const formNote = document.querySelector("#formNote");
const levelAdvisor = document.querySelector("#levelAdvisor");
const advisorResult = document.querySelector("#advisorResult");
const subjectSelect = form?.querySelector('select[name="subject"]');
const timeSelect = form?.querySelector('select[name="time"]');
const subjectCards = document.querySelectorAll(".subject-card");
const planButtons = document.querySelectorAll("[data-plan]");
const faqItems = document.querySelectorAll(".faq-item");
const quickBook = document.querySelector(".quick-book");
const statsPanel = document.querySelector(".stats-panel");
const statCards = document.querySelectorAll(".stats-panel article");
const statValues = document.querySelectorAll(".stats-panel strong");
const STORAGE_KEY = "tutorings-booking-draft";
const selectedChoices = {
  level: "",
  plan: "",
};
let toastTimer;
let statCycleTimer;
let statCycleIndex = 0;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(
  ".hero-copy, .hero-visual, .section-wrap, .booking, .step-card, .subject-card, .level-advisor, .plan-card, .faq-item"
);

const levelNotes = {
  "A1 - مبتدئ": "بداية لطيفة من الأساسيات لتبني قاعدة مريحة.",
  "A2 - أساسي": "مناسب لمحادثات بسيطة وتوجيه هادئ خطوة بخطوة.",
  "B1 - متوسط": "بداية جيدة لتطوير المحادثة اليومية بثقة وراحة.",
  "B2 - فوق المتوسط": "مسار مناسب لنقاشات أعمق وكتابة أوضح.",
  "C1 - متقدم": "مسار راق للطلاقة والتحضير المتقدم بثبات.",
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

function getSuggestedPlanForLevel(level) {
  if (level === "C1 - متقدم") return "تحضير اختبار";
  if (level === "B2 - فوق المتوسط" || level === "B1 - متوسط") return "خطة شهرية";
  if (level) return "جلسة واحدة";
  return "";
}

function getSuggestedLevelForPlan(plan) {
  if (plan === "تحضير اختبار") return "B2 - فوق المتوسط";
  if (plan === "خطة شهرية") return "B1 - متوسط";
  if (plan === "جلسة واحدة") return "A1 - مبتدئ";
  return "";
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

function parseMetric(value) {
  const match = String(value).trim().match(/^([\d,.]+)(.*)$/);
  if (!match) return null;

  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;

  return {
    numeric,
    decimals: match[1].includes(".") ? 1 : 0,
    suffix: match[2] || "",
    original: value,
  };
}

function formatMetric(value, decimals, suffix) {
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
  return `${formatted}${suffix}`;
}

function showToast(message, tone = "info") {
  let toast = document.querySelector(".app-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }

  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function animateMetric(element, index) {
  const metric = parseMetric(element.dataset.metricOriginal || element.textContent);
  if (!metric) return;

  const duration = prefersReducedMotion.matches ? 0 : 1300 + index * 120;
  const startTime = performance.now();

  if (duration === 0) {
    element.textContent = metric.original;
    return;
  }

  function tick(now) {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatMetric(metric.numeric * eased, metric.decimals, metric.suffix);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = metric.original;
    }
  }

  requestAnimationFrame(tick);
}

function activateStatCard(card) {
  statCycleIndex = Array.from(statCards).indexOf(card);
  statCards.forEach((item) => item.classList.toggle("is-active", item === card));
}

function startStatsCycle() {
  if (!statsPanel?.classList.contains("has-counted")) return;
  if (prefersReducedMotion.matches || statCards.length < 2) return;

  clearInterval(statCycleTimer);
  statCycleTimer = setInterval(() => {
    statCycleIndex = (statCycleIndex + 1) % statCards.length;
    activateStatCard(statCards[statCycleIndex]);
  }, 2600);
}

function stopStatsCycle() {
  clearInterval(statCycleTimer);
}

function runStats() {
  if (!statsPanel || statsPanel.classList.contains("has-counted")) return;

  statsPanel.classList.add("has-counted");
  statValues.forEach((value, index) => animateMetric(value, index));
  activateStatCard(statCards[0]);
  startStatsCycle();
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
  const name = String(getField("name")?.value || "").trim().split(/\s+/).filter(Boolean)[0];
  const greeting = name ? `${name}، ` : "";
  if (selectedChoices.level) parts.push(`مستواك ${selectedChoices.level}`);
  if (selectedChoices.plan) parts.push(`مسارك ${selectedChoices.plan}`);
  if (timeSelect?.value) parts.push(`الوقت ${timeSelect.value}`);

  const missing = getMissingBookingFields();
  const hasStarted = Boolean(
    String(getField("name")?.value || "").trim() ||
      String(getField("phone")?.value || "").trim() ||
      subjectSelect?.value ||
      timeSelect?.value ||
      selectedChoices.level ||
      selectedChoices.plan
  );

  if (parts.length && missing.length) {
    formNote.textContent = `${greeting}اختياراتك محفوظة: ${parts.join("، ")}. الخطوة التالية بلطف: ${missing[0]}.`;
  } else if (parts.length) {
    formNote.textContent = `${greeting}اختياراتك مكتملة: ${parts.join("، ")}. يمكنك إرسال طلب جلستك الخاصة براحة.`;
  } else if (hasStarted && missing.length) {
    formNote.textContent = `${greeting}الخطوة التالية بلطف: ${missing[0]}. سنرتب لك تجربة واضحة ومريحة.`;
  } else {
    formNote.textContent = "";
  }
}

function getMissingBookingFields() {
  if (!form) return [];

  const name = String(getField("name")?.value || "").trim();
  const phone = normalizePhone(getField("phone")?.value || "");
  const missing = [];

  if (name.split(/\s+/).filter(Boolean).length < 2) missing.push("اكتب اسمك الكريم كاملاً");
  if (!/^05\d{8}$/.test(phone)) missing.push("أدخل رقم تواصل صحيح");
  if (!subjectSelect?.value) missing.push("حدد المستوى الأقرب لك");
  if (!timeSelect?.value) missing.push("حدد الوقت الألطف ليومك");

  return missing;
}

function updateFormReadyState() {
  if (!form) return;

  const name = String(getField("name")?.value || "").trim();
  const phone = normalizePhone(getField("phone")?.value || "");
  const fields = [
    { field: getField("name"), done: name.split(/\s+/).filter(Boolean).length >= 2 },
    { field: getField("phone"), done: /^05\d{8}$/.test(phone) },
    { field: subjectSelect, done: Boolean(subjectSelect?.value) },
    { field: timeSelect, done: Boolean(timeSelect?.value) },
  ];
  const completed = fields.filter((item) => item.done).length;
  const isReady = completed === fields.length;

  form.classList.toggle("is-ready", isReady);
  form.classList.toggle("has-progress", completed > 0);
  form.style.setProperty("--booking-progress", `${(completed / fields.length) * 100}%`);

  fields.forEach(({ field, done }) => {
    field?.closest("label")?.classList.toggle("is-complete", done);
  });
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

  if (selectedChoices.level && !selectedChoices.plan && !options.skipPlanSuggestion) {
    setSelectedPlan(getSuggestedPlanForLevel(selectedChoices.level), { silent: true });
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
    button.dataset.defaultLabel ||= button.textContent.trim();
    const card = button.closest(".plan-card");
    card?.classList.toggle("selected", button.dataset.plan === selectedChoices.plan);
    button.textContent = button.dataset.plan === selectedChoices.plan ? "مسارك محدد بلطف" : button.dataset.defaultLabel;
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
    nameInput.setCustomValidity("اكتب اسمك الكريم من كلمتين على الأقل.");
  }

  if (phoneInput) {
    const phone = normalizePhone(phoneInput.value);
    phoneInput.value = phone;
    if (!/^05\d{8}$/.test(phone)) {
      phoneInput.setCustomValidity("اكتب رقم تواصل سعودي صحيح بصيغة 05xxxxxxxx.");
    }
  }

  requiredFields.forEach((field) => {
    if (!field.value.trim() && !field.validationMessage) {
      field.setCustomValidity("هذا الحقل يساعدنا على ترتيب تجربتك.");
    }
    const isInvalid = !field.checkValidity();
    field.classList.toggle("field-invalid", isInvalid);
    if (isInvalid && !firstInvalid) {
      firstInvalid = field;
    }
  });

  if (firstInvalid) {
    updateBookingNote(firstInvalid.validationMessage || "أكمل الحقول بهدوء حتى نرتب جلستك بشكل أفضل.");
    showToast("أكمل البيانات الناقصة بهدوء.", "warning");
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
    if (draft.subject) setSelectedSubject(draft.subject, { skipPlanSuggestion: true });
    if (draft.plan) setSelectedPlan(draft.plan);
    updateBookingNote();
    updateFormReadyState();
    if (draft.name || draft.phone || draft.subject || draft.time || draft.plan) {
      showToast("استعدنا اختياراتك السابقة لتكمل براحة.", "info");
    }
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
  quickBook?.classList.toggle("is-visible", window.scrollY > 520);
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
        note: "جميل. أرسل طلب جلستك الخاصة الآن، وسنحدد مستواك ومسارك مع متخصص بهدوء قبل أي اشتراك.",
      });
    } else if (button.dataset.bookIntent === "quick") {
      setSelectedPlan("جلسة واحدة", {
        note: "تم تحديد الجلسة الخاصة المجانية. أضف بياناتك براحة وسنرتب الموعد المناسب لك باهتمام.",
      });
    }

    smoothScrollTo("#resources");
    form?.querySelector("input")?.focus({ preventScroll: true });
    showToast("انتقلنا لنموذج الجلسة الخاصة براحة.", "info");
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

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = loginForm.querySelector('input[type="email"]');
  const password = loginForm.querySelector('input[type="password"]');
  const emailValue = String(email?.value || "").trim();
  const passwordValue = String(password?.value || "");
  let firstInvalid = null;

  [email, password].forEach((field) => {
    field?.classList.remove("field-invalid");
    field?.setCustomValidity("");
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    email?.setCustomValidity("اكتب بريدك الإلكتروني بشكل صحيح.");
    email?.classList.add("field-invalid");
    firstInvalid = email;
  }

  if (passwordValue.length < 6) {
    password?.setCustomValidity("كلمة المرور تحتاج 6 أحرف على الأقل.");
    password?.classList.add("field-invalid");
    if (!firstInvalid) {
      firstInvalid = password;
    }
  }

  if (firstInvalid) {
    firstInvalid.classList.add("field-invalid");
    firstInvalid.focus();
    showToast(firstInvalid.validationMessage, "warning");
    return;
  }

  loginModal?.close();
  loginForm.reset();
  showToast("تم الدخول إلى مساحتك بنجاح.", "success");
});

loginForm?.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("field-invalid");
    input.setCustomValidity("");
  });
});

subjectCards.forEach((card) => {
  card.addEventListener("click", () => {
    const suggestedPlan = getSuggestedPlanForLevel(card.dataset.subject || "");
    setSelectedSubject(card.dataset.subject || "", {
      scroll: true,
      note: `تم تحديد ${card.dataset.subject}${suggestedPlan ? ` واقتراح مسار ${suggestedPlan}` : ""}. أكمل البيانات براحة وسنرتب لك تجربة تناسب هدفك.`,
    });
    showToast("تم تحديث النموذج حسب مستواك بلطف.", "success");
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
    advisorResult.textContent = `البداية المقترحة لك: ${recommendation.level}. ${recommendation.note} والمسار الأقرب لك: ${recommendation.plan}.`;
  }

  updateBookingNote(`اخترنا لك ${recommendation.level} ومسار ${recommendation.plan} بناءً على إجاباتك. سنبني التجربة حول هدفك بهدوء.`);
  showToast("المساعد اقترح بداية مناسبة لك.", "success");
});

planButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const suggestedLevel = !selectedChoices.level ? getSuggestedLevelForPlan(button.dataset.plan || "") : "";
    if (suggestedLevel) {
      setSelectedSubject(suggestedLevel, { silent: true, skipPlanSuggestion: true });
    }

    setSelectedPlan(button.dataset.plan || "", {
      scroll: true,
      note: `تم تحديد ${button.dataset.plan}${suggestedLevel ? ` واقتراح مستوى ${suggestedLevel}` : ""}. أكمل البيانات براحة وسنجهز لك بداية واضحة.`,
    });
    showToast(`تم تحديد ${button.dataset.plan} بلطف.`, "success");
  });
});

statCards.forEach((card) => {
  card.tabIndex = 0;
  card.addEventListener("mouseenter", () => {
    stopStatsCycle();
    activateStatCard(card);
  });
  card.addEventListener("mouseleave", startStatsCycle);
  card.addEventListener("focus", () => {
    stopStatsCycle();
    activateStatCard(card);
  });
  card.addEventListener("blur", startStatsCycle);
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

  item.addEventListener("keydown", (event) => {
    const currentIndex = Array.from(faqItems).indexOf(item);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % faqItems.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + faqItems.length) % faqItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = faqItems.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    faqItems[nextIndex]?.focus();
  });
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validateBookingForm()) {
    return;
  }

  const summary = [
    subjectSelect?.value ? `مستوى ${subjectSelect.value}` : "",
    selectedChoices.plan ? `مسار ${selectedChoices.plan}` : "",
    timeSelect?.value ? `موعد ${timeSelect.value}` : "",
  ].filter(Boolean);

  formNote.textContent = `تم استلام طلبك${summary.length ? ` (${summary.join("، ")})` : ""}. سنتواصل معك لتأكيد جلستك الخاصة بكل احترام وهدوء.`;
  showToast("تم إرسال طلب الجلسة بلطف.", "success");
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
  updateBookingNote();
});

getField("phone")?.addEventListener("blur", (event) => {
  event.target.value = normalizePhone(event.target.value);
  saveDraft();
  updateFormReadyState();
  updateBookingNote();
});

form?.addEventListener("change", (event) => {
  if (event.target === subjectSelect) {
    setSelectedSubject(subjectSelect.value);
  } else {
    updateBookingNote();
    saveDraft();
  }
  updateFormReadyState();
  updateBookingNote();
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

if (statsPanel) {
  statValues.forEach((value) => {
    value.dataset.metricOriginal = value.textContent.trim();
  });

  if ("IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver(
      (entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        runStats();
        observer.disconnect();
      },
      { threshold: 0.42 }
    );

    statsObserver.observe(statsPanel);
  } else {
    runStats();
  }
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
