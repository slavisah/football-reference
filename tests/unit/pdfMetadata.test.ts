import { describe, expect, it } from 'vitest';
import { addAuthorMetadata, PDF_AUTHOR } from '../../scripts/pdf-metadata.mjs';

// A minimal but structurally accurate stand-in for the classic-xref PDFs
// Chromium's Skia/PDF print-to-PDF writer actually produces (confirmed by
// hand against a real generated PDF while building this fixture) - just
// enough of a document-info object, one other object, an xref table and a
// trailer to exercise addAuthorMetadata()'s own parsing, without needing a
// real multi-hundred-KB PDF as a test fixture.
function buildFakePdf({ infoNum = 1, extraInfoKeys = '' } = {}) {
  const header = '%PDF-1.7\n';
  const infoObj = `${infoNum} 0 obj\n<</Title (Test Page)\n/Producer (Skia/PDF m141)${extraInfoKeys}>>\nendobj\n`;
  const rootObj = '2 0 obj\n<</Type /Catalog>>\nendobj\n';
  const beforeXref = header + infoObj + rootObj;
  const xrefOffset = Buffer.byteLength(beforeXref, 'latin1');
  const xref =
    `xref\n0 3\n0000000000 65535 f \n` +
    `${String(Buffer.byteLength(header, 'latin1')).padStart(10, '0')} 00000 n \n` +
    `${String(Buffer.byteLength(header + infoObj, 'latin1')).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<</Size 3\n/Root 2 0 R\n/Info ${infoNum} 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(beforeXref + xref + trailer, 'latin1');
}

describe('addAuthorMetadata', () => {
  it('appends an incremental-update revision of the Info object carrying the new /Author', () => {
    const original = buildFakePdf();
    const patched = addAuthorMetadata(original, PDF_AUTHOR);

    expect(patched.length).toBeGreaterThan(original.length);
    // Every byte of the original file is preserved untouched - the patch is
    // a pure append, never an in-place edit.
    expect(patched.subarray(0, original.length)).toEqual(original);

    const patchedText = patched.toString('latin1');
    expect(patchedText.match(/\/Author/g)).toHaveLength(1);
    expect(patchedText).toContain(`/Author (${PDF_AUTHOR})`);
    // The original (now-superseded) Info revision has no /Author of its
    // own - only the newly appended one does.
    expect(original.toString('latin1')).not.toContain('/Author');
  });

  it('the appended trailer /Prev points at the original xref offset, and the new xref entry resolves to the new Info object', () => {
    const original = buildFakePdf();
    const patched = addAuthorMetadata(original, PDF_AUTHOR);
    const patchedText = patched.toString('latin1');

    const originalStartxref = Number(original.toString('latin1').match(/startxref\s+(\d+)/)![1]);
    expect(patchedText).toContain(`/Prev ${originalStartxref}>>`);

    const newXrefOffset = Number(patchedText.match(/startxref\s+(\d+)(?!.*startxref)/s)![1]);
    // The byte at the new xref's recorded offset for object 1 is the start
    // of a well-formed "1 0 obj" - i.e. the offset genuinely resolves.
    const entryMatch = patchedText.match(/xref\n1 1\n(\d{10}) 00000 n/);
    expect(entryMatch).not.toBeNull();
    const infoOffset = Number(entryMatch![1]);
    expect(patchedText.slice(infoOffset, infoOffset + 7)).toBe('1 0 obj');
    expect(newXrefOffset).toBeGreaterThan(infoOffset);
  });

  it('honors a non-1 Info object number taken from the trailer, not a hardcoded "1 0 obj" assumption', () => {
    const original = buildFakePdf({ infoNum: 7 });
    const patched = addAuthorMetadata(original, PDF_AUTHOR);
    const patchedText = patched.toString('latin1');

    expect(patchedText).toContain('7 0 obj');
    expect(patchedText).toContain('/Info 7 0 R');
    expect(patchedText).toMatch(/xref\n7 1\n/);
  });

  it('is a no-op that returns the same buffer when the Info dictionary already has an /Author', () => {
    const original = buildFakePdf({ extraInfoKeys: '\n/Author (Someone Else)' });
    const patched = addAuthorMetadata(original, PDF_AUTHOR);
    expect(patched).toBe(original);
  });

  it('escapes backslashes and parentheses in the author string as a PDF literal string', () => {
    const original = buildFakePdf();
    const patched = addAuthorMetadata(original, 'Weird (Name) \\ Co.');
    expect(patched.toString('latin1')).toContain('/Author (Weird \\(Name\\) \\\\ Co.)');
  });

  it('throws when the file has no "trailer" keyword at all', () => {
    const bogus = Buffer.from('%PDF-1.7\nnot a real pdf', 'latin1');
    expect(() => addAuthorMetadata(bogus, PDF_AUTHOR)).toThrow(/trailer/i);
  });

  it('throws when the trailer is missing /Root, /Info, /Size or startxref', () => {
    const bogus = Buffer.from('%PDF-1.7\ntrailer\n<</Size 1>>\n%%EOF\n', 'latin1');
    expect(() => addAuthorMetadata(bogus, PDF_AUTHOR)).toThrow(/trailer is missing/i);
  });

  it('throws when the Info object the trailer points at cannot be located', () => {
    const bogus = Buffer.from(
      '%PDF-1.7\ntrailer\n<</Size 3\n/Root 2 0 R\n/Info 9 0 R>>\nstartxref\n0\n%%EOF\n',
      'latin1',
    );
    expect(() => addAuthorMetadata(bogus, PDF_AUTHOR)).toThrow(/could not locate Info object/i);
  });
});
