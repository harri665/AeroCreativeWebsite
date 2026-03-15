// Fetch all projects from Printables @Aerocreative by intercepting page responses.
// This navigates the actual site and captures the data the page loads.
// Run: node scripts/fetch-printables.js

const ApiExtractor = require('websession-api-client');
const fs = require('fs');
const path = require('path');

const PRINTABLES_GQL = 'https://api.printables.com/graphql/';
const USER_HANDLE = 'Aerocreative';
const USER_ID = '1354394';

// Detail query for individual model (description + all images)
const MODEL_DETAIL_QUERY = `
query ModelDetail($id: ID!) {
  print(id: $id) {
    id
    name
    slug
    description
    summary
    ratingAvg
    likesCount
    downloadCount
    datePublished
    firstPublish
    modified
    category {
      id
      path { id name __typename }
      __typename
    }
    images {
      id
      filePath
      rotation
      imageHash
      imageWidth
      imageHeight
      __typename
    }
    tags { id name __typename }
    user {
      id handle publicUsername avatarFilePath __typename
    }
    stls {
      id name fileSize filePreviewPath __typename
    }
    filesType
    __typename
  }
}
`;

async function main() {
  const client = new ApiExtractor();
  await client.init({ headless: true });

  // Phase 1: Navigate to the profile page and capture the model list from the page's own requests
  console.log('Phase 1: Loading @Aerocreative profile to capture model list...\n');

  const page = await client.browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  let modelListData = null;

  // Intercept responses (not requests) to capture the actual data
  page.on('response', async (response) => {
    if (response.url().includes('api.printables.com/graphql')) {
      try {
        const json = await response.json();
        if (json.data && json.data.models && json.data.models.items) {
          modelListData = json.data.models.items;
        }
      } catch {}
    }
  });

  await page.goto(`https://www.printables.com/@${USER_HANDLE}`, {
    waitUntil: 'networkidle2',
    timeout: 45000,
  });

  // Wait a bit for any deferred requests
  await new Promise(r => setTimeout(r, 2000));

  if (!modelListData || modelListData.length === 0) {
    console.error('Failed to capture model list from profile page.');
    // Try scraping the page directly as fallback
    console.log('Trying fallback: scraping model info from page HTML...');

    modelListData = await page.evaluate(() => {
      // Try to find model data in the page's __NEXT_DATA__ or similar
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent;
        if (text.includes('morePrints') || text.includes('"models"')) {
          try {
            const match = text.match(/"items":\s*(\[[\s\S]*?\])\s*,\s*"__typename"/);
            if (match) return JSON.parse(match[1]);
          } catch {}
        }
      }
      return null;
    });
  }

  await page.close();

  if (!modelListData || modelListData.length === 0) {
    console.error('Could not get any model data. Exiting.');
    await client.browser.close();
    process.exit(1);
  }

  console.log(`Found ${modelListData.length} models from profile page.\n`);

  // Phase 2: For each model, fetch full details (description + all images)
  // Use the browser page for API calls to avoid rate limiting
  console.log('Phase 2: Fetching details for each model...\n');

  const detailPage = await client.browser.newPage();
  await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  // Navigate to printables first so we're on the right origin
  await detailPage.goto('https://www.printables.com/', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  }).catch(() => {});

  const projects = [];

  for (const model of modelListData) {
    console.log(`  Fetching: ${model.name} (id: ${model.id})...`);

    try {
      // Use page.evaluate to make the fetch from within the browser context
      const detailResult = await detailPage.evaluate(async (gqlUrl, query, modelId) => {
        try {
          const res = await fetch(gqlUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              operationName: 'ModelDetail',
              query: query,
              variables: { id: modelId },
            }),
          });
          if (!res.ok) return { error: res.status };
          return await res.json();
        } catch (e) {
          return { error: e.message };
        }
      }, PRINTABLES_GQL, MODEL_DETAIL_QUERY, model.id);

      if (detailResult && detailResult.data && detailResult.data.print) {
        const d = detailResult.data.print;
        projects.push({
          id: d.id,
          name: d.name,
          slug: d.slug,
          description: d.description || '',
          summary: d.summary || '',
          url: `https://www.printables.com/model/${d.id}-${d.slug}`,
          datePublished: d.datePublished,
          modified: d.modified,
          ratingAvg: d.ratingAvg,
          likesCount: d.likesCount,
          downloadCount: d.downloadCount,
          category: d.category?.path?.map(p => p.name).join(' > ') || '',
          tags: (d.tags || []).map(t => t.name),
          images: (d.images || []).map(img => ({
            id: img.id,
            url: `https://media.printables.com/${img.filePath}`,
            filePath: img.filePath,
            width: img.imageWidth,
            height: img.imageHeight,
          })),
          stlFiles: (d.stls || []).map(stl => ({
            id: stl.id,
            name: stl.name,
            fileSize: stl.fileSize,
            previewUrl: stl.filePreviewPath
              ? `https://media.printables.com/${stl.filePreviewPath}`
              : null,
          })),
          user: {
            id: d.user?.id,
            handle: d.user?.handle,
            username: d.user?.publicUsername,
            avatar: d.user?.avatarFilePath
              ? `https://media.printables.com/${d.user.avatarFilePath}`
              : null,
          },
        });
        console.log(`    -> ${d.images?.length || 0} images, ${d.stls?.length || 0} STL files`);
      } else {
        // Fallback: use the data we already have from the list
        console.log(`    -> Detail fetch failed (${detailResult?.error || 'unknown'}), using list data`);
        projects.push({
          id: model.id,
          name: model.name,
          slug: model.slug,
          description: '',
          summary: '',
          url: `https://www.printables.com/model/${model.id}-${model.slug}`,
          datePublished: model.datePublished,
          modified: model.modified,
          ratingAvg: model.ratingAvg,
          likesCount: model.likesCount,
          downloadCount: model.downloadCount,
          category: model.category?.path?.map(p => p.name).join(' > ') || '',
          tags: [],
          images: model.image ? [{
            id: model.image.id,
            url: `https://media.printables.com/${model.image.filePath}`,
            filePath: model.image.filePath,
          }] : [],
          stlFiles: [],
          user: {
            id: model.user?.id,
            handle: model.user?.handle,
            username: model.user?.publicUsername,
            avatar: model.user?.avatarFilePath
              ? `https://media.printables.com/${model.user.avatarFilePath}`
              : null,
          },
        });
      }

      // Delay between requests
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`    -> Error: ${err.message}`);
    }
  }

  await detailPage.close();

  // Save output
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, 'printables-projects.json');
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2));

  console.log(`\nDone! Saved ${projects.length} projects to ${outputPath}`);

  console.log('\n=== Summary ===');
  for (const p of projects) {
    console.log(`\n  ${p.name}`);
    console.log(`    Description: ${(p.description || '').substring(0, 80)}${p.description?.length > 80 ? '...' : ''}`);
    console.log(`    Images: ${p.images.length} | STLs: ${p.stlFiles.length}`);
    p.images.forEach((img, i) => console.log(`      img[${i}]: ${img.url}`));
  }

  await client.browser.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
