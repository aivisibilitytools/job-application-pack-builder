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
  "resumeProjects",
  "resumeEducation",
  "resumeCerts",
];

const preview = document.querySelector("#resumePreview");
const printResume = document.querySelector("#printResume");
const copyResumeText = document.querySelector("#copyResumeText");
const loadSample = document.querySelector("#loadSample");
const experienceList = document.querySelector("#experienceList");
const addExperience = document.querySelector("#addExperience");

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

const createExperienceItem = (index) => {
  const wrapper = document.createElement("div");
  wrapper.className = "experience-item";
  wrapper.dataset.index = index;
  wrapper.innerHTML = `
    <div class="experience-item-header">
      <h4>Experience ${index + 1}</h4>
      <button class="button secondary small remove-experience" type="button">Remove</button>
    </div>
    <div class="inline-fields">
      <label>
        Company
        <input id="expCompany${index}" type="text" placeholder="Acme SaaS" />
      </label>
      <label>
        Job title
        <input id="expTitle${index}" type="text" placeholder="Product Manager" />
      </label>
    </div>
    <div class="inline-fields">
      <label>
        Location
        <input id="expLocation${index}" type="text" placeholder="Remote" />
      </label>
      <label>
        Dates
        <input id="expDates${index}" type="text" placeholder="Jan 2021 - Present" />
      </label>
    </div>
    <label>
      Bullet points, one per line
      <textarea
        id="expBullets${index}"
        rows="5"
        placeholder="Improved onboarding completion by 18% by redesigning activation emails and first-run product prompts."
      ></textarea>
    </label>
  `;
  return wrapper;
};

const renumberExperienceItems = () => {
  experienceList.querySelectorAll(".experience-item").forEach((item, index) => {
    item.dataset.index = index;
    item.querySelector("h4").textContent = `Experience ${index + 1}`;
    item.querySelector("[id^='expCompany']").id = `expCompany${index}`;
    item.querySelector("[id^='expTitle']").id = `expTitle${index}`;
    item.querySelector("[id^='expLocation']").id = `expLocation${index}`;
    item.querySelector("[id^='expDates']").id = `expDates${index}`;
    item.querySelector("[id^='expBullets']").id = `expBullets${index}`;
  });
};

const getExperienceData = () =>
  Array.from(experienceList.querySelectorAll(".experience-item"))
    .map((item) => {
      const index = item.dataset.index;
      return {
        company: getValue(`expCompany${index}`),
        title: getValue(`expTitle${index}`),
        location: getValue(`expLocation${index}`),
        dates: getValue(`expDates${index}`),
        bullets: splitList(getValue(`expBullets${index}`)),
      };
    })
    .filter(
      (item) =>
        item.company || item.title || item.location || item.dates || item.bullets.length,
    );

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
  experiences: getExperienceData(),
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
    ...data.experiences.flatMap((item) => [
      `${item.title} | ${item.company} | ${item.location} | ${item.dates}`,
      ...item.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
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
    data.experiences.length ||
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
  const experience = data.experiences
    .map((item) => {
      const experienceTitle = [item.title, item.company].filter(Boolean).join(" | ");
      const experienceMeta = [item.location, item.dates].filter(Boolean).join(" | ");
      return `<div class="resume-job"><div class="resume-role"><strong>${escapeHtml(
        experienceTitle,
      )}</strong><span>${escapeHtml(experienceMeta)}</span></div>${bulletList(
        item.bullets,
      )}</div>`;
    })
    .join("");
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
experienceList.addEventListener("input", renderResume);

addExperience.addEventListener("click", () => {
  const index = experienceList.querySelectorAll(".experience-item").length;
  experienceList.appendChild(createExperienceItem(index));
  renderResume();
});

experienceList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove-experience")) return;
  event.target.closest(".experience-item").remove();
  renumberExperienceItems();
  renderResume();
});

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
    experiences: [
      {
        company: "Acme SaaS",
        title: "Product Manager",
        location: "Remote",
        dates: "Jan 2021 - Present",
        bullets:
          "Improved onboarding completion by 18% by redesigning activation emails and first-run product prompts.\nPartnered with engineering and sales to launch a self-serve trial motion that generated 240 qualified leads in one quarter.\nReduced support tickets related to setup by 22% by shipping clearer in-product guidance and help center content.",
      },
      {
        company: "Northstar Analytics",
        title: "Associate Product Manager",
        location: "Austin, TX",
        dates: "Jun 2019 - Dec 2020",
        bullets:
          "Interviewed 45 customers to identify reporting gaps and prioritize dashboard improvements.\nLaunched a weekly usage report that increased account manager follow-up speed by 30%.",
      },
    ],
    resumeProjects:
      "Built a customer health dashboard used by sales and success teams to prioritize expansion accounts.\nCreated a churn-risk segmentation model using product usage, support tickets, and renewal dates.",
    resumeEducation: "B.S. Business Analytics, University of Texas",
    resumeCerts: "Google Analytics Certification, Certified Scrum Product Owner",
  };

  experienceList.innerHTML = "";
  sample.experiences.forEach((experience, index) => {
    experienceList.appendChild(createExperienceItem(index));
    document.querySelector(`#expCompany${index}`).value = experience.company;
    document.querySelector(`#expTitle${index}`).value = experience.title;
    document.querySelector(`#expLocation${index}`).value = experience.location;
    document.querySelector(`#expDates${index}`).value = experience.dates;
    document.querySelector(`#expBullets${index}`).value = experience.bullets;
  });

  Object.entries(sample).forEach(([id, value]) => {
    if (id === "experiences") return;
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
