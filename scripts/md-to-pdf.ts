import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { marked } from 'marked';

/**
 * Renders a Markdown file to PDF using Playwright's bundled Chromium.
 *
 * Usage:
 *   npx tsx scripts/md-to-pdf.ts <input.md> [output.pdf]
 *
 * If the output path is omitted, the PDF is written next to the input file
 * with the `.pdf` extension swapped in.
 */
async function main(): Promise<void> {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg) {
    console.error('Usage: npx tsx scripts/md-to-pdf.ts <input.md> [output.pdf]');
    process.exit(1);
  }

  const inputPath = resolve(inputArg);
  const outputPath = outputArg ? resolve(outputArg) : inputPath.replace(/\.md$/i, '.pdf');

  const markdown = readFileSync(inputPath, 'utf-8');
  const bodyHtml = marked.parse(markdown, { async: false }) as string;
  const title = basename(inputPath, '.md');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      --fg: #1f2328;
      --muted: #57606a;
      --border: #d0d7de;
      --code-bg: #f6f8fa;
      --link: #0969da;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: var(--fg);
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }
    h1 { font-size: 26pt; margin-top: 0; padding-bottom: 0.3em; border-bottom: 1px solid var(--border); }
    h2 { font-size: 18pt; margin-top: 1.6em; padding-bottom: 0.2em; border-bottom: 1px solid var(--border); page-break-after: avoid; }
    h3 { font-size: 13pt; margin-top: 1.4em; page-break-after: avoid; }
    h4 { font-size: 11pt; margin-top: 1.2em; }
    p { margin: 0.6em 0; }
    a { color: var(--link); text-decoration: none; }
    code {
      background: var(--code-bg);
      padding: 0.15em 0.35em;
      border-radius: 3px;
      font-family: 'Cascadia Code', Consolas, 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre { background: var(--code-bg); padding: 0.8em 1em; border-radius: 6px; overflow-x: auto; font-size: 9.5pt; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.92em; }
    th, td { border: 1px solid var(--border); padding: 0.45em 0.6em; text-align: left; vertical-align: top; }
    th { background: var(--code-bg); font-weight: 600; }
    tr { page-break-inside: avoid; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.2em 0; }
    li > p { margin: 0.2em 0; }
    blockquote { border-left: 4px solid var(--border); padding-left: 1em; color: var(--muted); margin: 1em 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMedia({ media: 'screen' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
  } finally {
    await browser.close();
  }

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
