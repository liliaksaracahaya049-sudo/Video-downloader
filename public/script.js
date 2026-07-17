const form = document.getElementById("download-form");
const urlInput = document.getElementById("video-url");
const formatSelect = document.getElementById("format-select");
const resolutionField = document.getElementById("resolution-field");
const resolutionSelect = document.getElementById("resolution-select");
const bitrateField = document.getElementById("bitrate-field");
const bitrateSelect = document.getElementById("bitrate-select");
const submitButton = document.getElementById("submit-button");
const statusEl = document.getElementById("status");
const videoInfoSection = document.getElementById("video-info");
const videoTitleEl = document.getElementById("video-title");
const videoUploaderEl = document.getElementById("video-uploader");

// Tampilkan menu resolusi kalau format = mp4, atau menu bitrate kalau format = mp3.
function updateFormatFields() {
  const isVideo = formatSelect.value === "mp4";
  resolutionField.hidden = !isVideo;
  bitrateField.hidden = isVideo;
}

formatSelect.addEventListener("change", updateFormatFields);
updateFormatFields();

function setStatus(message, state) {
  statusEl.textContent = message;
  if (state) {
    statusEl.setAttribute("data-state", state);
  } else {
    statusEl.removeAttribute("data-state");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();
  if (!url) {
    setStatus("Isi link video dulu, ya.", "error");
    urlInput.focus();
    return;
  }

  const format = formatSelect.value;
  const quality = format === "mp4" ? resolutionSelect.value : bitrateSelect.value;

  submitButton.disabled = true;
  videoInfoSection.hidden = true;
  setStatus("Sedang mengambil info video, tunggu sebentar...", null);

  try {
    const infoResponse = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const infoData = await infoResponse.json();

    if (!infoResponse.ok) {
      setStatus(infoData.error || "Gagal mengambil info video.", "error");
      submitButton.disabled = false;
      return;
    }

    videoTitleEl.textContent = `Judul: ${infoData.title}`;
    videoUploaderEl.textContent = infoData.uploader ? `Pengunggah: ${infoData.uploader}` : "";
    videoInfoSection.hidden = false;

    setStatus(`Video ditemukan: ${infoData.title}. Mulai mengunduh...`, "success");

    const params = new URLSearchParams({ url, format, quality });
    window.location.href = `/api/download?${params.toString()}`;

    // Beri jeda supaya pembaca layar sempat mengumumkan status sebelum tombol aktif lagi.
    setTimeout(() => {
      setStatus("Unduhan dimulai. Cek folder unduhan di perangkatmu.", "success");
      submitButton.disabled = false;
    }, 1500);
  } catch (err) {
    console.error(err);
    setStatus("Terjadi kesalahan jaringan. Coba lagi.", "error");
    submitButton.disabled = false;
  }
});
