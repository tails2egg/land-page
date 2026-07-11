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
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(
  ".hero-copy, .hero-visual, .section-wrap, .booking, .step-card, .subject-card, .level-advisor, .plan-card, .faq-item"
);

function smoothScrollTo(selector) {
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
  link.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
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

document.querySelectorAll(".subject-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".subject-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    if (subjectSelect) {
      subjectSelect.value = card.dataset.subject || "";
    }
    smoothScrollTo("#resources");
  });
});

levelAdvisor?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(levelAdvisor);
  const goal = data.get("goal");
  const confidence = data.get("confidence");

  let level = "A1 - مبتدئ";
  let note = "ابدأ من الأساسيات حتى تبني قاعدة واضحة.";

  if (goal === "conversation" && confidence === "low") {
    level = "A2 - أساسي";
    note = "ابدأ بمحادثات بسيطة وتصحيح مستمر.";
  } else if (goal === "conversation") {
    level = "B1 - متوسط";
    note = "مستوى مناسب لتطوير المحادثة اليومية بثقة.";
  } else if (goal === "academic" && confidence === "high") {
    level = "B2 - فوق المتوسط";
    note = "ابدأ بنقاشات أطول وكتابة عملية أو أكاديمية.";
  } else if (goal === "academic") {
    level = "B1 - متوسط";
    note = "مستوى مناسب لبناء الكتابة والفهم قبل التقدم.";
  } else if (goal === "ielts" && confidence === "high") {
    level = "C1 - متقدم";
    note = "ابدأ بتحضير متقدم ومفردات احترافية.";
  } else if (goal === "ielts") {
    level = "B2 - فوق المتوسط";
    note = "مستوى مناسب قبل الدخول في تدريب IELTS المكثف.";
  }

  document.querySelectorAll(".subject-card").forEach((item) => {
    item.classList.toggle("selected", item.dataset.subject === level);
  });

  if (subjectSelect) {
    subjectSelect.value = level;
  }

  if (advisorResult) {
    advisorResult.textContent = `نقترح لك: ${level}. ${note}`;
  }

  if (formNote) {
    formNote.textContent = `تم اختيار ${level} بناءً على إجاباتك.`;
  }
});

document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    smoothScrollTo("#resources");
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

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });
