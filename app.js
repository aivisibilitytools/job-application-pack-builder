const { PDFDocument } = window.PDFLib || {};

const pdfFilesInput = document.querySelector("#pdfFiles");
const fileList = document.querySelector("#fileList");
const mergeForm = document.querySelector("#mergeForm");
const mergeStatus = document.querySelector("#mergeStatus");
const downloadMerged = document.querySelector("#downloadMerged");

const splitForm = document.querySelector("#splitForm");
const splitFile = document.querySelector("#splitFile");
const pageRanges = document.querySelector("#pageRanges");
const splitStatus = document.querySelector("#splitStatus");
const downloadSplit = document.querySelector("#downloadSplit");
const filenameForm = document.querySelector("#filenameForm");
const filenameOutput = document.querySelector("#filenameOutput");
const copyFilenames = document.querySelector("#copyFilenames");
const atsForm = document.querySelector("#atsForm");
const atsOutput = document.querySelector("#atsOutput");
const coverForm = document.querySelector("#coverForm");
const coverOutput = document.querySelector("#coverOutput");
const copyCoverLetter = document.querySelector("#copyCoverLetter");

let selectedFiles = [];
let activeUrls = [];

const revokeUrls = () => {
  activeUrls.forEach((url) => URL.revokeObjectURL(url));
  activeUrls = [];
};

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const updateFileList = () => {
  if (!selectedFiles.length) {
    fileList.innerHTML = '<p class="empty-state">No PDFs added yet.</p>';
    return;
  }

  fileList.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `
      <div>
        <strong>${index + 1}. ${file.name}</strong>
        <small>${formatBytes(file.size)}</small>
      </div>
      <div class="mini-buttons">
        <button type="button" data-action="up" data-index="${index}" aria-label="Move up">Up</button>
        <button type="button" data-action="down" data-index="${index}" aria-label="Move down">Down</button>
        <button type="button" data-action="remove" data-index="${index}" aria-label="Remove">X</button>
      </div>
    `;
    fileList.appendChild(row);
  });
};

const moveFile = (index, direction) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= selectedFiles.length) return;
  const copy = [...selectedFiles];
  const [item] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, item);
  selectedFiles = copy;
  updateFileList();
};

pdfFilesInput.addEventListener("change", () => {
  selectedFiles = [...selectedFiles, ...Array.from(pdfFilesInput.files)];
  pdfFilesInput.value = "";
  updateFileList();
});

fileList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "up") moveFile(index, -1);
  if (action === "down") moveFile(index, 1);
  if (action === "remove") {
    selectedFiles.splice(index, 1);
    updateFileList();
  }
});

const createDownload = (anchor, bytes, fileName) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  activeUrls.push(url);
  anchor.href = url;
  anchor.download = fileName;
  anchor.classList.remove("disabled");
};

mergeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  revokeUrls();
  downloadMerged.classList.add("disabled");

  if (!PDFDocument) {
    mergeStatus.textContent =
      "PDF library did not load. Check your internet connection and refresh.";
    return;
  }

  if (selectedFiles.length < 2) {
    mergeStatus.textContent = "Please add at least two PDF files to merge.";
    return;
  }

  try {
    mergeStatus.textContent = "Merging PDFs in your browser...";
    const mergedPdf = await PDFDocument.create();

    for (const file of selectedFiles) {
      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const pages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      );
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const packName =
      document.querySelector("#packName").value.trim() || "job-application-pack";
    createDownload(downloadMerged, mergedBytes, `${packName}.pdf`);
    mergeStatus.textContent = `Done. Merged ${selectedFiles.length} PDFs into one application pack.`;
  } catch (error) {
    mergeStatus.textContent =
      "Could not merge these PDFs. Encrypted or damaged PDFs may not work.";
  }
});

const parseRanges = (value, totalPages) => {
  const pages = new Set();
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((num) => Number(num.trim()));
        if (!Number.isInteger(start) || !Number.isInteger(end)) return;
        for (let page = start; page <= end; page += 1) {
          if (page >= 1 && page <= totalPages) pages.add(page - 1);
        }
        return;
      }

      const page = Number(part);
      if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
        pages.add(page - 1);
      }
    });

  return [...pages].sort((a, b) => a - b);
};

splitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  revokeUrls();
  downloadSplit.classList.add("disabled");

  if (!PDFDocument) {
    splitStatus.textContent =
      "PDF library did not load. Check your internet connection and refresh.";
    return;
  }

  const file = splitFile.files[0];
  if (!file) {
    splitStatus.textContent = "Please upload one PDF to split.";
    return;
  }

  try {
    splitStatus.textContent = "Extracting selected pages...";
    const sourcePdf = await PDFDocument.load(await file.arrayBuffer());
    const selectedPages = parseRanges(pageRanges.value, sourcePdf.getPageCount());

    if (!selectedPages.length) {
      splitStatus.textContent = `No valid pages selected. This PDF has ${sourcePdf.getPageCount()} pages.`;
      return;
    }

    const outputPdf = await PDFDocument.create();
    const copiedPages = await outputPdf.copyPages(sourcePdf, selectedPages);
    copiedPages.forEach((page) => outputPdf.addPage(page));

    const splitBytes = await outputPdf.save();
    const splitName =
      document.querySelector("#splitName").value.trim() || "selected-pages";
    createDownload(downloadSplit, splitBytes, `${splitName}.pdf`);
    splitStatus.textContent = `Done. Extracted ${selectedPages.length} page(s).`;
  } catch (error) {
    splitStatus.textContent =
      "Could not split this PDF. Encrypted or damaged PDFs may not work.";
  }
});

updateFileList();

const slugPart = (value) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "Your-Name";

const copyText = async (text, button, label) => {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = label;
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch (error) {
    button.textContent = "Select and copy manually";
  }
};

filenameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = slugPart(document.querySelector("#candidateName").value);
  const role = slugPart(document.querySelector("#targetRole").value);
  const company = slugPart(document.querySelector("#targetCompany").value);

  filenameOutput.textContent = [
    `${name}-${role}-Resume.pdf`,
    `${name}-${company}-${role}-Cover-Letter.pdf`,
    `${name}-${company}-Application-Pack.pdf`,
    `${name}-${role}-Portfolio.pdf`,
  ].join("\n");
});

copyFilenames.addEventListener("click", () => {
  copyText(filenameOutput.textContent, copyFilenames, "Copied");
});

atsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const checked = [...atsForm.querySelectorAll("input[name='ats']:checked")];
  const total = atsForm.querySelectorAll("input[name='ats']").length;
  const score = Math.round((checked.length / total) * 100);
  const missing = [...atsForm.querySelectorAll("input[name='ats']:not(:checked)")].map(
    (item) => `- ${item.value}`,
  );

  atsOutput.textContent = [
    `ATS readiness score: ${score}/100`,
    "",
    checked.length === total
      ? "Strong basics. Now tailor keywords to each job description."
      : "Fix these before sending your resume:",
    ...(missing.length ? missing : []),
    "",
    "Tip: after improving your resume, rebuild the PDF pack with your resume first.",
  ].join("\n");
});

coverForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const company = document.querySelector("#letterCompany").value.trim() || "[Company]";
  const role = document.querySelector("#letterRole").value.trim() || "[Role]";
  const proof =
    document.querySelector("#letterProof").value.trim() ||
    "I can bring relevant experience, careful execution, and clear communication to the team.";

  coverOutput.textContent = `Dear ${company} hiring team,

I am excited to apply for the ${role} role at ${company}. I am interested in this opportunity because it matches the kind of work where I can contribute quickly, communicate clearly, and keep improving the details that matter.

One relevant example from my background: ${proof}

I would welcome the chance to discuss how my experience can support the team. Thank you for your time and consideration.

Best regards,
[Your Name]`;
});

copyCoverLetter.addEventListener("click", () => {
  copyText(coverOutput.textContent, copyCoverLetter, "Copied");
});
