// Adds an /Author entry to a generated PDF's document-info dictionary
// without touching a single byte of the file Playwright's `page.pdf()`
// already wrote.
//
// Chromium's print-to-PDF pipeline (scripts/generate-pdfs.mjs) already sets
// /Title (from the live page's own <title>) and the document catalog's
// /Lang (from the page's <html lang>) automatically - both verified correct,
// per-language, with no code needed here. But it has no equivalent for
// /Author: every one of the 700 downloadable PDFs shipped with a completely
// empty document-info dictionary on that front, unlike every other place
// this site names itself (`og:site_name`, the <title> suffix every page
// already carries - see BaseLayout.astro - and the browser tab/window title
// a reader sees while the PDF is open in most viewers' UI).
//
// Playwright's `page.pdf()` (a thin wrapper over Chromium's
// `Page.printToPDF` CDP command) exposes no metadata options beyond the
// document itself, so this can only be done by editing the already-written
// file afterward. A full re-serialize with a PDF-editing library was tried
// first and rejected: `pdf-lib@1.17.1` loading one of this repo's own
// tagged PDFs and calling `setAuthor()` shrank a 513,927-byte file to
// 279,375 bytes and silently dropped `/StructTreeRoot`, `/MarkInfo`,
// `/Marked true`, `/Lang` and `/Outlines` entirely - exactly the PDF/UA
// accessibility structure `generate-pdfs.mjs`'s own `tagged: true, outline:
// true` was added specifically to produce (see that file's own comment).
// Losing it silently to fix a cosmetic metadata gap would be a strictly
// worse trade.
//
// Instead this performs a standard PDF *incremental update* (the same
// append-only mechanism Adobe Acrobat itself uses to edit an existing PDF's
// properties): appends a new revision of the existing Info object (object
// number taken from the trailer's own /Info entry, not assumed to be 1)
// carrying the extra /Author key, followed by a minimal xref section for
// just that one object and a new trailer whose /Prev points at the
// original file's own xref offset. Every byte of the original file -
// including the entire tagged/outline structure - stays untouched; every
// PDF 1.4+ reader (Chrome, Adobe Reader, pdf.js, and the screen readers
// built on them) resolves the newest trailer first and falls back to
// /Prev for any object (here, every object except Info) it doesn't
// override. Verified against a real generated PDF: the patched file grew by
// exactly the appended bytes, `/StructTreeRoot`/`/MarkInfo`/`/Marked
// true`/`/Lang`/`/Outlines` counts stayed byte-for-byte identical to the
// original, and the new `/Author` appears exactly once.
//
// Only handles the classic (plain-text) xref-table shape Chromium's own PDF
// writer (Skia/PDF) currently produces, confirmed by every one of this
// site's own generated PDFs having a literal `trailer` keyword rather than
// a compressed cross-reference stream. Throws rather than silently
// no-op-ing if a future Chromium version changes that shape, or if the Info
// dictionary already somehow carries an /Author (defensive - can't happen
// from this script's own output, since every PDF is rendered fresh, but a
// silent double-write would be worse than a loud failure).

function escapePdfLiteralString(value) {
  // PDF literal strings (`(...)`) require backslash, and the two
  // parentheses themselves, to be backslash-escaped - see PDF 32000-1:2008
  // 7.3.4.2. `author` is always this file's own ASCII-only site name today,
  // but the escaping is applied unconditionally rather than assumed
  // unnecessary, the same defensive posture `escapeHtml()` in
  // src/pages/compare.astro takes for its own always-currently-safe inputs.
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Returns a new Buffer: `pdfBuffer` plus an appended incremental-update
 * revision of its Info object that adds `/Author (<author>)`. Returns
 * `pdfBuffer` unchanged (a no-op, not an error) if the Info dictionary
 * already has an /Author key. Throws if the file's trailer doesn't have the
 * classic plain-text xref shape this function knows how to extend.
 */
export function addAuthorMetadata(pdfBuffer, author) {
  const text = pdfBuffer.toString('latin1');

  const trailerIdx = text.lastIndexOf('trailer');
  if (trailerIdx === -1) {
    throw new Error('addAuthorMetadata: no "trailer" keyword found - not a classic-xref PDF');
  }
  const trailerText = text.slice(trailerIdx);

  const rootMatch = trailerText.match(/\/Root\s+(\d+)\s+0\s+R/);
  const infoMatch = trailerText.match(/\/Info\s+(\d+)\s+0\s+R/);
  const sizeMatch = trailerText.match(/\/Size\s+(\d+)/);
  const startxrefMatch = trailerText.match(/startxref\s+(\d+)/);
  if (!rootMatch || !infoMatch || !sizeMatch || !startxrefMatch) {
    throw new Error('addAuthorMetadata: trailer is missing /Root, /Info, /Size or startxref');
  }
  const rootNum = rootMatch[1];
  const infoNum = infoMatch[1];
  const size = Number(sizeMatch[1]);
  const prevXrefOffset = Number(startxrefMatch[1]);

  const infoObjRe = new RegExp(`\\n${infoNum} 0 obj\\s*\\n?(<<[\\s\\S]*?>>)\\s*\\nendobj`);
  const infoObjMatch = text.match(infoObjRe);
  if (!infoObjMatch) {
    throw new Error(`addAuthorMetadata: could not locate Info object ${infoNum} 0 obj`);
  }
  const dictBody = infoObjMatch[1];
  const inner = dictBody.slice(2, -2);
  if (inner.includes('/Author')) {
    return pdfBuffer;
  }
  const newDict = `<<${inner}/Author (${escapePdfLiteralString(author)})>>`;

  const appendText = `\n${infoNum} 0 obj\n${newDict}\nendobj\n`;
  const appendBuf = Buffer.from(appendText, 'latin1');
  // The leading "\n" above lands at pdfBuffer.length; the object itself
  // (what the new xref entry must point at) starts one byte after that.
  const infoObjOffset = pdfBuffer.length + 1;
  const xrefOffset = pdfBuffer.length + appendBuf.length;

  const xrefEntry = `${String(infoObjOffset).padStart(10, '0')} 00000 n \n`;
  const xrefSection = `xref\n${infoNum} 1\n${xrefEntry}`;
  const newTrailer =
    `trailer\n<</Size ${size}\n/Root ${rootNum} 0 R\n/Info ${infoNum} 0 R\n` +
    `/Prev ${prevXrefOffset}>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.concat([
    pdfBuffer,
    appendBuf,
    Buffer.from(xrefSection, 'latin1'),
    Buffer.from(newTrailer, 'latin1'),
  ]);
}

// The one site name used everywhere else a PDF/page names itself -
// og:site_name (BaseLayout.astro), every page's own <title> suffix, and the
// Croatian pages too (the brand name is deliberately left untranslated
// there, same as og:site_name not varying by locale).
export const PDF_AUTHOR = 'The Ultimate Football Reference';
