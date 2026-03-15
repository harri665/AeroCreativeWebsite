/**
 * imgproxy URL builder
 *
 * Generates URLs that route through the Express /api/img proxy to imgproxy.
 * For local files (e.g. /uploads/foo.jpg), uses the local:// scheme so
 * imgproxy reads from its mounted filesystem.
 * For remote URLs (https://...), passes them through directly.
 */

const IMGPROXY_BASE = process.env.IMGPROXY_URL || 'http://localhost:8081';

// Presets for common sizes used in the frontend
const PRESETS = {
  card: 'rs:fill:680:480/q:80',         // ModelCard thumbnail (2x for retina)
  cover: 'rs:fit:900:600/q:85',         // Project detail cover image
  gallery: 'rs:fill:400:300/q:80',      // Gallery grid thumbnails
  galleryFull: 'rs:fit:1600:1200/q:90', // Lightbox full-size
  portrait: 'rs:fill:560:0/q:85',       // About photo (2x for 280px)
};

/**
 * Build an imgproxy path for a given source image.
 *
 * @param {string} src - Original image path or URL
 *   - Local: "/uploads/foo.jpg" or "/models/bar.jpg"
 *   - Remote: "https://cdn.printables.com/..."
 * @param {string} [preset] - One of the PRESETS keys, or a raw processing string
 * @returns {string} Path like /api/img/insecure/rs:fill:400:300/plain/local:///uploads/foo.jpg
 */
function imgproxyUrl(src, preset = 'card') {
  if (!src) return src;

  const processing = PRESETS[preset] || preset;

  // Determine source URL for imgproxy
  let sourceUrl;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // External URL — pass through directly
    sourceUrl = src;
  } else {
    // Local file — use local:// filesystem scheme
    // imgproxy mounts server/public at /images, so /uploads/foo.jpg → local:///uploads/foo.jpg
    sourceUrl = `local://${src}`;
  }

  return `/api/img/insecure/${processing}/plain/${sourceUrl}`;
}

/**
 * Transform an images array (from Printables or custom projects)
 * adding proxied URL variants.
 */
function transformImages(images, preset = 'gallery') {
  if (!images || !Array.isArray(images)) return images;

  return images.map(img => ({
    ...img,
    url: img.url ? imgproxyUrl(img.url, preset) : img.url,
    originalUrl: img.url,
  }));
}

module.exports = { imgproxyUrl, transformImages, PRESETS, IMGPROXY_BASE };
