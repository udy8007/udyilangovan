const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const glow = document.querySelector(".cursor-glow");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setHeaderState = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.classList.toggle("active");
  mobileMenu.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("menu-open", isOpen);
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("active");
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px" }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min((index % 5) * 65, 260)}ms`;
  revealObserver.observe(element);
});

const animateCount = (element) => {
  const target = Number(element.dataset.count);
  const duration = 1300;
  const start = performance.now();

  const tick = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.floor(target * eased);

    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.7 }
);

document.querySelectorAll("[data-count]").forEach((counter) => {
  countObserver.observe(counter);
});

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  },
  { rootMargin: "-35% 0px -55%", threshold: 0 }
);

sections.forEach((section) => navObserver.observe(section));

if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      glow.style.opacity = "1";
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    },
    { passive: true }
  );

  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });

  const portrait = document.querySelector(".hero-portrait");
  window.addEventListener(
    "pointermove",
    (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 8;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;
      portrait.style.transform = `translate(${x}px, ${y}px)`;
    },
    { passive: true }
  );
}

document.getElementById("year").textContent = new Date().getFullYear();

const NTFY_TOPIC = "https://ntfy.sh/udyilangovan";
const VISIT_KEY = "portfolio_visit_notified";

const getVisitorInfo = async () => {
  try {
    const response = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (!response.ok) throw new Error("Geo lookup failed");

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Geo lookup failed");

    const city = data.city || "Unknown";
    const region = data.region || "";
    const country = data.country || "Unknown";
    const ip = data.ip || "Unknown";
    const lat = data.latitude;
    const lon = data.longitude;
    const maps =
      lat && lon
        ? `https://www.google.com/maps?q=${lat},${lon}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${city}, ${country}`
          )}`;

    return {
      city,
      region,
      country,
      ip,
      maps,
      org: data.connection?.org || data.isp || "Unknown",
    };
  } catch {
    return {
      city: "Unknown",
      region: "",
      country: "Unknown",
      ip: "Unknown",
      maps: "https://www.google.com/maps",
      org: "Unknown",
    };
  }
};

const sendNtfy = async ({ title, message, tags = "globe_with_meridians", priority = "default" }) => {
  const response = await fetch(NTFY_TOPIC, {
    method: "POST",
    headers: {
      Title: title,
      Priority: priority,
      Tags: tags,
    },
    body: message,
  });

  if (!response.ok) throw new Error("Notification failed");
};

const notifyProfileVisit = async () => {
  if (sessionStorage.getItem(VISIT_KEY)) return;

  try {
    const visitor = await getVisitorInfo();
    const locationLine = [visitor.city, visitor.region, visitor.country]
      .filter(Boolean)
      .join(", ");
    const page = window.location.href;
    const when = new Date().toLocaleString();

    await sendNtfy({
      title: "Portfolio Visit",
      tags: "eyes,globe_with_meridians",
      message: [
        "Someone visited your portfolio.",
        "",
        `City: ${visitor.city}`,
        `Country: ${visitor.country}`,
        `Location: ${locationLine}`,
        `IP Address: ${visitor.ip}`,
        `ISP: ${visitor.org}`,
        `Google Map: ${visitor.maps}`,
        `Page: ${page}`,
        `Time: ${when}`,
      ].join("\n"),
    });

    sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    // Silent fail — visit tracking should never break the site.
  }
};

const enquiryForm = document.getElementById("enquiry-form");
const enquiryStatus = document.getElementById("enquiry-status");
const enquirySubmit = document.getElementById("enquiry-submit");

enquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(enquiryForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const project = String(formData.get("project") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) {
    enquiryStatus.textContent = "Please fill in name, email, and message.";
    enquiryStatus.className = "form-status is-error";
    return;
  }

  enquirySubmit.disabled = true;
  enquiryStatus.textContent = "Sending enquiry...";
  enquiryStatus.className = "form-status";

  try {
    const visitor = await getVisitorInfo();
    const locationLine = [visitor.city, visitor.region, visitor.country]
      .filter(Boolean)
      .join(", ");
    const when = new Date().toLocaleString();

    await sendNtfy({
      title: "New Portfolio Enquiry",
      tags: "email,handshake",
      priority: "high",
      message: [
        "New enquiry from your portfolio website.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Project: ${project}`,
        `Message: ${message}`,
        "",
        "— Visitor info —",
        `City: ${visitor.city}`,
        `Country: ${visitor.country}`,
        `Location: ${locationLine}`,
        `IP Address: ${visitor.ip}`,
        `Google Map: ${visitor.maps}`,
        `Time: ${when}`,
      ].join("\n"),
    });

    enquiryForm.reset();
    enquiryStatus.textContent = "Enquiry sent. I'll get back to you soon.";
    enquiryStatus.className = "form-status is-success";
  } catch {
    enquiryStatus.textContent = "Could not send right now. Please email me instead.";
    enquiryStatus.className = "form-status is-error";
  } finally {
    enquirySubmit.disabled = false;
  }
});

notifyProfileVisit();
