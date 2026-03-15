// Discover the exact GraphQL queries Printables uses when loading a user profile.
// Run: node scripts/discover-printables-queries.js

const ApiExtractor = require('websession-api-client');

(async () => {
  const client = new ApiExtractor();
  await client.init({ headless: true });

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
      } catch {}
    }
    req.continue();
  });

  console.log('Navigating to Printables @Aerocreative profile...');
  await page.goto('https://www.printables.com/@Aerocreative', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Click "Models" tab or scroll to trigger full model list
  await page.evaluate(() => window.scrollBy(0, 3000));
  await new Promise((r) => setTimeout(r, 3000));
  await page.evaluate(() => window.scrollBy(0, 3000));
  await new Promise((r) => setTimeout(r, 3000));

  console.log(`\n=== Captured ${captured.length} GraphQL operations ===\n`);

  for (const op of captured) {
    console.log('========================================');
    console.log('Operation:', op.operationName);
    console.log('Variables:', JSON.stringify(op.variables, null, 2));
    console.log('FULL Query:');
    console.log(op.query);
    console.log('========================================\n');
  }

  await page.close();
  await client.browser.close();
})();
