// server.js
// Backend untuk website download video/audio dari sosial media.
// Pakai yt-dlp (harus sudah terinstall di server) buat ambil videonya.

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Domain sosial media yang didukung. Dipakai buat validasi link sebelum diproses.
const ALLOWED_HOST_KEYWORDS = [
  "tiktok.com",
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "fb.watch",
];

function isSupportedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return ALLOWED_HOST_KEYWORDS.some((host) => parsed.hostname.includes(host));
  } catch {
    return false;
  }
}

// Jalanin yt-dlp dan kumpulin output-nya sebagai string.
function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => (stdout += chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `yt-dlp keluar dengan kode ${code}`));
      }
    });
  });
}

// Ambil info video: judul, thumbnail, durasi, daftar resolusi yang tersedia.
app.post("/api/info", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Link video belum diisi." });
  }
  if (!isSupportedUrl(url)) {
    return res.status(400).json({
      error: "Link ini belum didukung. Coba link dari TikTok, Instagram, YouTube, atau Facebook.",
    });
  }

  try {
    const output = await runYtDlp(["--dump-json", "--no-playlist", url]);
    const data = JSON.parse(output);

    // Kumpulin daftar resolusi video yang tersedia dari format yang dilaporkan yt-dlp.
    const heights = new Set();
    if (Array.isArray(data.formats)) {
      data.formats.forEach((f) => {
        if (f.height) heights.add(f.height);
      });
    }
    const availableResolutions = Array.from(heights).sort((a, b) => a - b);

    res.json({
      title: data.title || "video",
      thumbnail: data.thumbnail || null,
      duration: data.duration || null,
      uploader: data.uploader || null,
      availableResolutions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Gagal mengambil info video. Pastikan link masih aktif dan tidak private.",
    });
  }
});

// Bikin nama file aman dari karakter yang bisa bikin masalah di sistem file.
function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

// Proses download: format = "mp4" atau "mp3".
// quality untuk mp4 = tinggi resolusi (mis. 720), untuk mp3 = bitrate (mis. 192).
app.get("/api/download", async (req, res) => {
  const { url, format, quality } = req.query;

  if (!url || typeof url !== "string" || !isSupportedUrl(url)) {
    return res.status(400).json({ error: "Link tidak valid atau belum didukung." });
  }
  if (format !== "mp4" && format !== "mp3") {
    return res.status(400).json({ error: "Format harus mp4 atau mp3." });
  }

  const tempId = crypto.randomBytes(8).toString("hex");
  const tempDir = path.join(os.tmpdir(), `dl-${tempId}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const outputTemplate = path.join(tempDir, "%(title)s.%(ext)s");

  let args;
  if (format === "mp4") {
    const height = parseInt(quality, 10) || 720;
    args = [
      "-f",
      `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`,
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "-o",
      outputTemplate,
      url,
    ];
  } else {
    const bitrate = parseInt(quality, 10) || 128;
    args = [
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      `${bitrate}k`,
      "--no-playlist",
      "-o",
      outputTemplate,
      url,
    ];
  }

  try {
    await runYtDlp(args);

    const files = fs.readdirSync(tempDir);
    if (files.length === 0) {
      throw new Error("File hasil download tidak ditemukan.");
    }
    const resultFile = path.join(tempDir, files[0]);
    const ext = format === "mp4" ? "mp4" : "mp3";
    const downloadName = `${sanitizeFilename(path.parse(files[0]).name)}.${ext}`;

    res.download(resultFile, downloadName, (err) => {
      // Bersihin file sementara setelah selesai dikirim, berhasil atau gagal.
      fs.rm(tempDir, { recursive: true, force: true }, () => {});
      if (err) console.error("Gagal mengirim file:", err);
    });
  } catch (err) {
    console.error(err);
    fs.rm(tempDir, { recursive: true, force: true }, () => {});
    res.status(500).json({ error: "Gagal memproses video. Coba lagi atau pakai link lain." });
  }
});

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});
