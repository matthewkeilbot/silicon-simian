#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const url = process.argv[2];
  const outArg = process.argv[3] || 'shot.png';

  if (!url) {
    console.error('Usage: node screenshot.js <url> [output.png]');
    process.exit(1);
  }

  const outputPath = path.resolve(process.cwd(), outArg);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: outputPath, fullPage: true });

  await browser.close();
  console.log(`Saved screenshot: ${outputPath}`);
}

main().catch((err) => {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
});
