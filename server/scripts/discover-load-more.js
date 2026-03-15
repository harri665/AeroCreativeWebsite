// Discover what GraphQL queries fire when clicking "Show more" on the profile page
const ApiExtractor = require('websession-api-client');

(async () => {
  const client = new ApiExtractor();
  await client.init({ headless: false }); // visible so we can see what's happening

  const page = await client.browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setRequestInterception(true);

  const captured = [];

  page.on('request', (req) => {
    if (req.url().includes('api.printables.com/graphql')) {
      try {
        const body = JSON.parse(req.postData());
        captured.push({
          operationName: body.operationName,
          variables: body.variables,
          query: body.query,
        });
        console.log(`>> Captured: ${body.operationName} | vars: ${JSON.stringify(body.variables)}`);
      } catch {}
    }
    req.continue();
  });

  console.log('Loading profile page...');
  await page.goto('https://www.printables.com/@Aerocreative', {
    waitUntil: 'networkidle2',
    timeout: 45000,
  });

  // Try clicking "Show all" or "Models" tab or scroll
  console.log('\nLooking for "show more" / "show all" links...');

  // Look for any clickable element that loads more models
  const buttons = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a, button'));
    return allLinks
      .filter(el => {
        const text = el.textContent.toLowerCase();
        return text.includes('show') || text.includes('more') || text.includes('all') || text.includes('model');
      })
      .map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 80),
        href: el.href || null,
        classes: el.className,
      }));
  });

  console.log('\nFound clickable elements:');
  buttons.forEach(b => console.log(`  <${b.tag}> "${b.text}" href=${b.href}`));

  // Try clicking "Show all" for models
  const clicked = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      const text = link.textContent.toLowerCase().trim();
      if (text.includes('show all') || text.includes('see all') || text.includes('all models')) {
        link.click();
        return link.textContent.trim();
      }
    }
    // Try models tab
    for (const link of links) {
      if (link.href && link.href.includes('/models')) {
        link.click();
        return link.textContent.trim();
      }
    }
    return null;
  });

  if (clicked) {
    console.log(`\nClicked: "${clicked}"`);
    await new Promise(r => setTimeout(r, 5000));

    // Scroll down to trigger more loads
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n=== Total captured: ${captured.length} operations ===`);
  for (const op of captured) {
    console.log(`\n--- ${op.operationName} ---`);
    console.log('Variables:', JSON.stringify(op.variables, null, 2));
    // Only print first 500 chars of query
    console.log('Query:', op.query?.substring(0, 500));
  }

  await page.close();
  await client.browser.close();
})();
