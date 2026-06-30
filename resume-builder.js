const fieldIds = [
  "resumeTemplate",
  "resumeName",
  "resumeTitle",
  "resumeEmail",
  "resumePhone",
  "resumeLocation",
  "resumeLinkedin",
  "resumePortfolio",
  "resumeSummary",
  "resumeSkills",
  "expCompany",
  "expTitle",
  "expLocation",
  "expDates",
  "expBullets",
  "resumeProjects",
  "resumeEducation",
  "resumeCerts",
];

const preview = document.querySelector("#resumePreview");
const printResume = document.querySelector("#printResume");
const copyResumeText = document.querySelector("#copyResumeText");
const loadSample = document.querySelector("#loadSample");

const getValue = (id) => document.querySelector(`#${id}`).value.trim();
const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const splitList = (value) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const bulletList = (items) =>
  items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

const section = (title, content) =>
  content ? `<section class="resume-section"><h3>${title}</h3>${content}</section>` : "";

const getResumeData = () => ({
  template: getValue("resumeTemplate") || "ats",
  name: getValue("resumeName") || "Your Name",
  title: getValue("resumeTitle") || "Target Role",
  email: getValue("resumeEmail"),
  phone: getValue("resumePhone"),
  location: getValue("resumeLocation"),
  linkedin: getValue("resumeLinkedin"),
  portfolio: getValue("resumePortfolio"),
  summary: getValue("resumeSummary"),
  skills: splitList(getValue("resumeSkills")),
  expCompany: getValue("expCompany"),
  expTitle: getValue("expTitle"),
  expLocation: getValue("expLocation"),
  expDates: getValue("expDates"),
  expBullets: splitList(getValue("expBullets")),
  projects: splitList(getValue("resumeProjects")),
  education: getValue("resumeEducation"),
  certs: getValue("resumeCerts"),
});

const buildPlainText = (data) => {
  const contact = [data.location, data.phone, data.email, data.linkedin, data.portfolio]
    .filter(Boolean)
    .join(" | ");
  return [
    data.name,
    data.title,
    contact,
    "",
    "PROFESSIONAL SUMMARY",
    data.summary,
    "",
    "CORE SKILLS",
    data.skills.join(", "),
    "",
    "EXPERIENCE",
    `${data.expTitle} | ${data.expCompany} | ${data.expLocation} | ${data.expDates}`,
    ...data.expBullets.map((item) => `- ${item}`),
    "",
    "PROJECTS",
    ...data.projects.map((item) => `- ${item}`),
    "",
    "EDUCATION",
    data.education,
    "",
    "CERTIFICATIONS",
    data.certs,
  ]
    .filter((line, index, arr) => line || arr[index - 1])
    .join("\n");
};

const renderResume = () => {
  const data = getResumeData();
  const contactItems = [
    data.location,
    data.phone,
    data.email,
    data.linkedin,
    data.portfolio,
  ].filter(Boolean);
  const hasContent =
    data.summary ||
    data.skills.length ||
    data.expCompany ||
    data.expBullets.length ||
    data.projects.length ||
    data.education ||
    data.certs;

  preview.className = `resume-preview resume-template-${data.template}`;
  if (!hasContent && data.name === "Your Name") {
    preview.innerHTML = '<div class="resume-empty">Fill in the form to preview your resume.</div>';
    return;
  }

  const skills = data.skills.length
    ? `<div class="skill-pills">${data.skills
        .map((skill) => `<span>${escapeHtml(skill)}</span>`)
        .join("")}</div>`
    : "";
  const experienceTitle = [data.expTitle, data.expCompany].filter(Boolean).join(" | ");
  const experienceMeta = [data.expLocation, data.expDates].filter(Boolean).join(" | ");
  const experience =
    experienceTitle || experienceMeta || data.expBullets.length
      ? `<div class="resume-role"><strong>${escapeHtml(experienceTitle)}</strong><span>${escapeHtml(
          experienceMeta,
        )}</span></div>${bulletList(data.expBullets)}`
      : "";
  const extras = [data.education, data.certs]
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  preview.innerHTML = `
    <header class="resume-header">
      <h2>${escapeHtml(data.name)}</h2>
      <p class="resume-title">${escapeHtml(data.title)}</p>
      <p class="resume-contact">${contactItems.map(escapeHtml).join(" | ")}</p>
    </header>
    <div class="resume-body">
      <div class="resume-main">
        ${section("Professional Summary", data.summary ? `<p>${escapeHtml(data.summary)}</p>` : "")}
        ${section("Experience", experience)}
        ${section("Projects", bulletList(data.projects))}
      </div>
      <aside class="resume-side">
        ${section("Core Skills", skills)}
        ${section("Education", data.education ? `<p>${escapeHtml(data.education)}</p>` : "")}
        ${section("Certifications", data.certs ? `<p>${escapeHtml(data.certs)}</p>` : "")}
      </aside>
    </div>
  `;
};

fieldIds.forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("input", renderResume);
});

document.querySelector("#resumeTemplate").addEventListener("change", renderResume);

printResume.addEventListener("click", () => {
  window.print();
});

copyResumeText.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildPlainText(getResumeData()));
    const original = copyResumeText.textContent;
    copyResumeText.textContent = "Copied";
    window.setTimeout(() => {
      copyResumeText.textContent = original;
    }, 1200);
  } catch (error) {
    copyResumeText.textContent = "Select and copy manually";
  }
});

loadSample.addEventListener("click", () => {
  const sample = {
    resumeName: "Jane Chen",
    resumeTitle: "Product Manager",
    resumeEmail: "jane.chen@email.com",
    resumePhone: "(555) 123-4567",
    resumeLocation: "Austin, TX",
    resumeLinkedin: "linkedin.com/in/janechen",
    resumePortfolio: "janechen.com",
    resumeSummary:
      "Product manager with 4+ years of experience improving onboarding, activation, and retention for B2B SaaS products. Strong background in customer research, A/B testing, roadmap planning, and cross-functional execution.",
    resumeSkills:
      "Product strategy, SQL, A/B testing, onboarding, user research, stakeholder management, roadmap planning, SaaS metrics",
    expCompany: "Acme SaaS",
    expTitle: "Product Manager",
    expLocation: "Remote",
    expDates: "Jan 2021 - Present",
    expBullets:
      "Improved onboarding completion by 18% by redesigning activation emails and first-run product prompts.\nPartnered with engineering and sales to launch a self-serve trial motion that generated 240 qualified leads in one quarter.\nReduced support tickets related to setup by 22% by shipping clearer in-product guidance and help center content.",
    resumeProjects:
      "Built a customer health dashboard used by sales and success teams to prioritize expansion accounts.\nCreated a churn-risk segmentation model using product usage, support tickets, and renewal dates.",
    resumeEducation: "B.S. Business Analytics, University of Texas",
    resumeCerts: "Google Analytics Certification, Certified Scrum Product Owner",
  };

  Object.entries(sample).forEach(([id, value]) => {
    document.querySelector(`#${id}`).value = value;
  });
  renderResume();
  document.querySelector("#resume-builder").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  const original = loadSample.textContent;
  loadSample.textContent = "Sample Loaded";
  window.setTimeout(() => {
    loadSample.textContent = original;
  }, 1200);
});

renderResume();
