// Printables fetcher — reusable module for pulling projects from a Printables user profile.
const ApiExtractor = require('websession-api-client');
const fs = require('fs');

const PRINTABLES_GQL = 'https://api.printables.com/graphql/';

// The real paginated query used by printables.com/@user/models page
const USER_MODELS_QUERY = `
query UserModels($id: ID!, $paid: PaidEnum, $limit: Int!, $cursor: String, $ordering: String, $search: String) {
  userModels(
    userId: $id
    paid: $paid
    limit: $limit
    cursor: $cursor
    ordering: $ordering
    query: $search
  ) {
    cursor
    items {
      id name slug ratingAvg likesCount downloadCount
      datePublished dateFeatured firstPublish modified
      mmu imagesCount
      category {
        id
        path { id name __typename }
        __typename
      }
      image {
        id filePath rotation imageHash imageWidth imageHeight __typename
      }
      user {
        id handle publicUsername avatarFilePath __typename
      }
      __typename
    }
    __typename
  }
}
`;

// Detail query for individual model (description + all images + files)
const MODEL_DETAIL_QUERY = `
query ModelDetail($id: ID!) {
  print(id: $id) {
    id name slug description summary
    ratingAvg likesCount downloadCount
    datePublished firstPublish modified
    category { id path { id name __typename } __typename }
    images { id filePath rotation imageHash imageWidth imageHeight __typename }
    tags { id name __typename }
    user { id handle publicUsername avatarFilePath __typename }
    stls { id name fileSize filePreviewPath __typename }
    filesType __typename
  }
}
`;

const DOWNLOAD_LINK_MUTATION = `
mutation GetDownloadLink($id: ID!, $modelId: ID!, $fileType: DownloadFileTypeEnum!, $source: DownloadSourceEnum!) {
  getDownloadLink(id: $id, printId: $modelId, fileType: $fileType, source: $source) {
    ok
    output { link ttl __typename }
    __typename
  }
}
`;

// Helper: run a GraphQL query inside the browser page context
async function browserGQL(page, operationName, query, variables) {
  return page.evaluate(async (gqlUrl, opName, q, vars) => {
    try {
      const res = await fetch(gqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ operationName: opName, query: q, variables: vars }),
      });
      if (!res.ok) return { error: res.status };
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }, PRINTABLES_GQL, operationName, query, variables);
}

async function fetchPrintablesProjects(handle, onProgress) {
  const client = new ApiExtractor();
  await client.init({ headless: true });

  try {
    // Navigate to printables.com so browser context is on the right origin
    const page = await client.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    if (onProgress) onProgress('Navigating to Printables...');
    await page.goto('https://www.printables.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    }).catch(() => {});

    // Phase 1: Paginate through all models using userModels query
    if (onProgress) onProgress('Fetching model list...');
    const allModels = [];
    let cursor = null;
    let pageNum = 0;

    while (true) {
      pageNum++;
      if (onProgress) onProgress(`Fetching model list (page ${pageNum}, ${allModels.length} so far)...`);

      const result = await browserGQL(page, 'UserModels', USER_MODELS_QUERY, {
        id: `@${handle}`,
        paid: 'free',
        limit: 36,
        cursor: cursor,
        ordering: '-first_publish',
        search: null,
      });

      if (!result?.data?.userModels?.items) {
        if (allModels.length === 0) {
          throw new Error(`Failed to fetch models: ${JSON.stringify(result?.error || result)}`);
        }
        break; // Got some models from previous pages, stop here
      }

      const items = result.data.userModels.items;
      allModels.push(...items);

      const nextCursor = result.data.userModels.cursor;
      if (!nextCursor || items.length < 36) {
        break; // No more pages
      }
      cursor = nextCursor;

      // Small delay between pages
      await new Promise(r => setTimeout(r, 1000));
    }

    if (onProgress) onProgress(`Found ${allModels.length} models. Fetching details...`);

    // Phase 2: Fetch full details for each model (description + all images + STL files)
    const projects = [];

    for (let i = 0; i < allModels.length; i++) {
      const model = allModels[i];
      if (onProgress) onProgress(`Fetching details ${i + 1}/${allModels.length}: ${model.name}`);

      const detailResult = await browserGQL(page, 'ModelDetail', MODEL_DETAIL_QUERY, { id: model.id });

      if (detailResult?.data?.print) {
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
            previewUrl: stl.filePreviewPath ? `https://media.printables.com/${stl.filePreviewPath}` : null,
          })),
          user: {
            id: d.user?.id,
            handle: d.user?.handle,
            username: d.user?.publicUsername,
            avatar: d.user?.avatarFilePath ? `https://media.printables.com/${d.user.avatarFilePath}` : null,
          },
        });
      } else {
        // Fallback: use list data
        projects.push({
          id: model.id, name: model.name, slug: model.slug,
          description: '', summary: '',
          url: `https://www.printables.com/model/${model.id}-${model.slug}`,
          datePublished: model.datePublished, modified: model.modified,
          ratingAvg: model.ratingAvg, likesCount: model.likesCount, downloadCount: model.downloadCount,
          category: model.category?.path?.map(p => p.name).join(' > ') || '',
          tags: [],
          images: model.image ? [{ id: model.image.id, url: `https://media.printables.com/${model.image.filePath}`, filePath: model.image.filePath }] : [],
          stlFiles: [],
          user: { id: model.user?.id, handle: model.user?.handle, username: model.user?.publicUsername, avatar: model.user?.avatarFilePath ? `https://media.printables.com/${model.user.avatarFilePath}` : null },
        });
      }

      // Delay between detail requests
      await new Promise(r => setTimeout(r, 1000));
    }

    await page.close();
    return projects;
  } finally {
    await client.browser.close();
  }
}

async function downloadSTLFile(stlFileId, modelId, outputPath) {
  const client = new ApiExtractor();
  await client.init({ headless: true });

  try {
    const page = await client.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.goto('https://www.printables.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

    // Printables API requires numeric IDs — parse strings to integers
    const linkResult = await browserGQL(page, 'GetDownloadLink', DOWNLOAD_LINK_MUTATION, {
      id: parseInt(stlFileId, 10),
      modelId: parseInt(modelId, 10),
      fileType: 'stl',
      source: 'model_detail',
    });

    await page.close();

    const downloadUrl = linkResult?.data?.getDownloadLink?.output?.link;
    if (!downloadUrl) {
      throw new Error(`Failed to get download link: ${JSON.stringify(linkResult)}`);
    }

    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

    return { success: true, size: arrayBuffer.byteLength };
  } finally {
    await client.browser.close();
  }
}

module.exports = { fetchPrintablesProjects, downloadSTLFile };
