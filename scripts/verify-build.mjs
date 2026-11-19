import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SITE_DIR = path.join(ROOT, '_site');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CATALOG_PATH = path.join(ROOT, '_data', 'catalog.json');
const LEGACY_COMMIT = '63464e5d83f38d79e6f41bb7bc6540bd7fa2ce4d';

// Pinned SHA-256 digests & exact byte lengths for preserved site-root verification/hosting files.
// Allows byte-exact verification in shallow/single-branch CI checkouts where commit 63464e5 is not fetched.
const ROOT_INFRA_MANIFEST = [
  {
    path: 'google96fbb76f00681fc4.html',
    bytes: 53,
    sha256: 'fff011478c86617ba7294c6266c93fba90871774dd864d94869554cbc7ff4a7b'
  },
  {
    path: '.nojekyll',
    bytes: 0,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function hasLocalGitCommit(commitHash) {
  try {
    execFileSync('git', ['cat-file', '-e', `${commitHash}^{commit}`], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function collectHtmlFiles(dirPath, list = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, list);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

function resolveSiteUrlToFile(urlPath) {
  let clean = urlPath.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  const rel = clean.replace(/^\/+/, '');
  const candidate = path.join(SITE_DIR, rel);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  const indexCandidate = path.join(candidate, 'index.html');
  if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
    return indexCandidate;
  }
  return null;
}

function extractTagsAttr(html, tagRegex, attrName) {
  const results = [];
  const attrRegex = new RegExp(`${attrName}=["']([^"']+)["']`, 'i');
  let m;
  while ((m = tagRegex.exec(html)) !== null) {
    const tag = m[0];
    const am = tag.match(attrRegex);
    if (am) results.push(am[1]);
  }
  return results;
}

function checkSyntaxAndBuild() {
  const jsFiles = [
    'eleventy.config.mjs',
    'scripts/verify-build.mjs',
    'assets/js/nodes-data.js',
    'assets/js/text-fx.js',
    'assets/js/subhud-controller.js',
    'assets/js/scene-engine.js',
    '_site/assets/js/catalog-data.js'
  ];

  for (const rel of jsFiles) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `Missing JS file for syntax check: ${rel}`);
    execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
  }

  assert.ok(fs.existsSync(SITE_DIR), '_site directory does not exist. Run npm run build first.');
  return jsFiles.length;
}

function checkDataAndLayoutSeparation() {
  const catalog = JSON.parse(readText(CATALOG_PATH));
  const nodes = catalog.nodes;
  assert.equal(nodes.length, 13, `Expected 13 nodes, got ${nodes.length}`);
  assert.equal(catalog.legacyUrls, undefined, 'Deprecated catalog.legacyUrls should not exist');
  assert.equal(catalog.site.favicon, '/assets/favicon.svg', 'Expected native SVG favicon path');
  assert.equal(catalog.site.ogImage, `${catalog.site.url}/assets/images/og-cover.png`, 'Expected native OG cover image URL');
  assert.equal(catalog.author.latentId, undefined, 'Unused author.latentId should not exist');
  assert.equal(catalog.witness.overviewKaomoji, undefined, 'Separate witness.overviewKaomoji should not exist');
  assert.equal(catalog.witness.contactKaomoji, undefined, 'Separate witness.contactKaomoji should not exist');

  const ids = new Set();
  const slugs = new Set();
  const permalinks = new Set();
  let sheets = 0;
  let drives = 0;
  let youtubes = 0;

  nodes.forEach((node, idx) => {
    assert.equal(node.code, String(idx).padStart(2, '0'), `Unexpected node code order at index ${idx}`);
    assert.ok(node.id && !ids.has(node.id), `Duplicate or missing node id: ${node.id}`);
    assert.ok(node.slug && /^[a-z0-9-]+$/.test(node.slug) && !slugs.has(node.slug), `Invalid or duplicate slug: ${node.slug}`);
    assert.equal(node.permalink, `/work/${node.slug}/`, `Unexpected permalink for ${node.id}`);
    assert.ok(!permalinks.has(node.permalink), `Duplicate permalink: ${node.permalink}`);
    assert.equal(node.routes, undefined, `Legacy routes field should not exist on ${node.id}`);
    assert.equal(node.link, undefined, `Duplicate link field should not exist on ${node.id}`);
    assert.equal(node.kaomoji, undefined, `Separate node.kaomoji field should not exist on ${node.id}`);

    ids.add(node.id);
    slugs.add(node.slug);
    permalinks.add(node.permalink);

    if (node.mediaType === 'sheet') sheets += 1;
    else if (node.mediaType === 'drive') drives += 1;
    else if (node.mediaType === 'youtube') youtubes += 1;
    else assert.fail(`Unexpected mediaType ${node.mediaType} on ${node.id}`);
  });

  assert.equal(sheets, 2, `Expected 2 sheet nodes, got ${sheets}`);
  assert.equal(drives, 6, `Expected 6 drive nodes, got ${drives}`);
  assert.equal(youtubes, 5, `Expected 5 youtube nodes, got ${youtubes}`);
  assert.ok(ids.has('ThaiLong-card') && ids.has('PhongNguaDotQuy-card'), 'Case-sensitive legacy IDs missing');

  assert.ok(Array.isArray(catalog.witness.overviewChoices) && catalog.witness.overviewChoices.length === 4);
  for (const choice of catalog.witness.overviewChoices) {
    assert.ok(ids.has(choice.nodeId), `Witness choice references unknown nodeId: ${choice.nodeId}`);
  }

  // Verify Witness kaomoji expressions live strictly in dialogueExpressions, NOT inside editorial copy/metadata
  const exprs = catalog.witness.dialogueExpressions;
  assert.ok(exprs && typeof exprs.overview === 'string' && exprs.overview.trim().length > 0, 'Missing witness.dialogueExpressions.overview');
  assert.ok(typeof exprs.contact === 'string' && exprs.contact.trim().length > 0, 'Missing witness.dialogueExpressions.contact');
  assert.ok(exprs.byNodeId && typeof exprs.byNodeId === 'object', 'Missing witness.dialogueExpressions.byNodeId');
  assert.ok(!catalog.witness.overviewGreeting.includes(exprs.overview), 'overviewGreeting must stay pure text without kaomoji');
  assert.ok(!catalog.witness.contactPromptReply.includes(exprs.contact), 'contactPromptReply must stay pure text without kaomoji');

  for (const node of nodes) {
    const nodeExpr = exprs.byNodeId[node.id];
    assert.ok(nodeExpr, `Missing witness.dialogueExpressions.byNodeId["${node.id}"]`);
    for (const field of ['greeting', 'roleDetail', 'techDetail']) {
      assert.ok(typeof nodeExpr[field] === 'string' && nodeExpr[field].trim().length > 0, `Missing ${field} kaomoji for ${node.id}`);
      assert.ok(!node[field].includes(nodeExpr[field]), `${node.id}.${field} must stay pure editorial text without inline kaomoji`);
    }
  }

  // Verify base layout separation on _site/404.html vs portfolio layout on _site/work/harmony-2025/index.html
  const notFoundHtml = readText(path.join(SITE_DIR, '404.html'));
  assert.match(notFoundHtml, /<meta name="robots" content="noindex">/i);
  assert.match(notFoundHtml, /href="\/assets\/css\/tokens\.css"/);
  assert.match(notFoundHtml, /Be\+Vietnam\+Pro/);
  assert.match(notFoundHtml, /Newsreader/);
  assert.match(notFoundHtml, /G-7LSEN9HJPK/);
  for (const forbidden of [
    'rel="canonical"',
    'application/ld+json',
    'stage-nodes.css',
    'chrome-hud.css',
    'three.min.js',
    'catalog-data.js',
    'nodes-data.js',
    'scene-engine.js',
    'id="viewport"',
    'id="chat-dock"',
    'id="overview-labels-layer"'
  ]) {
    assert.ok(!notFoundHtml.includes(forbidden), `404.html must not contain portfolio asset/markup: ${forbidden}`);
  }

  const harmonyHtml = readText(path.join(SITE_DIR, 'work', 'harmony-2025', 'index.html'));
  for (const required of [
    'rel="canonical"',
    'application/ld+json',
    'Be+Vietnam+Pro',
    'Newsreader',
    'tokens.css',
    'stage-nodes.css',
    'chrome-hud.css',
    'three.min.js',
    'scene-engine.js',
    'id="viewport"',
    'id="chat-dock"',
    'id="overview-labels-layer"'
  ]) {
    assert.ok(harmonyHtml.includes(required), `Portfolio work page missing expected asset/markup: ${required}`);
  }

  const eligibleVideoNodes = nodes.filter((n) => n.id !== 'genesis-node' && n.video && n.video.exportVideoObject === true);
  assert.ok(eligibleVideoNodes.length > 0, 'Expected at least 1 eligible VideoObject record in catalog');
  let videoObjectsCount = 0;

  // Validate home page JSON-LD and head metadata
  const homeHtml = readText(path.join(SITE_DIR, 'index.html'));
  assert.match(homeHtml, /<html[^>]+lang="vi"/i);
  assert.match(homeHtml, /G-7LSEN9HJPK/);
  assert.match(homeHtml, /<link rel="canonical" href="https:\/\/minato-makoto\.github\.io\/">/);
  const homeLdMatches = [...homeHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  assert.equal(homeLdMatches.length, 1, 'Expected 1 JSON-LD block on /');
  const homeLd = JSON.parse(homeLdMatches[0][1]);
  assert.ok(Array.isArray(homeLd) && homeLd[0]['@type'] === 'Person' && homeLd[1]['@type'] === 'CollectionPage');
  assert.equal(homeLd[1].mainEntity.itemListElement.length, 13);

  const homeBubbleMatch = homeHtml.match(/<div class="chat-bubble">([\s\S]*?)<\/div>/);
  assert.ok(homeBubbleMatch && homeBubbleMatch[1].includes(`class="witness-kaomoji" aria-hidden="true">${exprs.overview}</span>`), 'Home chat bubble missing decorative kaomoji span');
  const homeFallbackMatch = homeHtml.match(/<section class="seo-fallback-shell"[\s\S]*?<\/section>/);
  assert.ok(homeFallbackMatch && !homeFallbackMatch[0].includes(exprs.overview), 'Home editorial fallback shell must not contain overview kaomoji');

  // Validate all 13 work pages
  for (const node of nodes) {
    const filePath = path.join(SITE_DIR, 'work', node.slug, 'index.html');
    assert.ok(fs.existsSync(filePath), `Missing generated HTML page for ${node.slug}`);
    const html = readText(filePath);

    assert.match(html, /<html[^>]+lang="vi"/i);
    assert.match(html, /G-7LSEN9HJPK/);
    assert.match(html, /<h1 class="seo-h1">.+?<\/h1>/s);
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)">/i);
    assert.ok(canonicalMatch, `Missing canonical on ${node.permalink}`);
    assert.equal(canonicalMatch[1], `${catalog.site.url}${node.permalink}`);

    const ogUrlMatch = html.match(/<meta property="og:url" content="([^"]+)">/i);
    assert.ok(ogUrlMatch && ogUrlMatch[1] === canonicalMatch[1], `og:url mismatch on ${node.permalink}`);

    const nodeExpr = exprs.byNodeId[node.id];
    const bubbleMatch = html.match(/<div class="chat-bubble">([\s\S]*?)<\/div>/);
    assert.ok(
      bubbleMatch && bubbleMatch[1].includes(`class="witness-kaomoji" aria-hidden="true">${nodeExpr.greeting}</span>`),
      `Chat bubble missing atomic decorative kaomoji span on ${node.permalink}`
    );
    const fallbackMatch = html.match(/<section class="seo-fallback-shell"[\s\S]*?<\/section>/);
    assert.ok(fallbackMatch, `Missing seo-fallback-shell on ${node.permalink}`);
    for (const field of ['greeting', 'roleDetail', 'techDetail']) {
      assert.ok(
        !fallbackMatch[0].includes(nodeExpr[field]),
        `Editorial fallback HTML on ${node.permalink} must not contain kaomoji from ${field}`
      );
    }

    const iframeTags = html.match(/<iframe\b[^>]*>/gi) || [];
    if (node.video) {
      assert.equal(iframeTags.length, 1, `Expected exactly 1 static iframe player on ${node.permalink}, got ${iframeTags.length}`);
      assert.ok(iframeTags[0].includes(`src="${node.video.embedUrl}"`), `Static player iframe src mismatch on ${node.permalink}`);
    } else {
      assert.equal(iframeTags.length, 0, `Unexpected iframe on non-video page ${node.permalink}`);
    }

    const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    assert.equal(ldMatches.length, 1, `Expected 1 JSON-LD block on ${node.permalink}`);
    const ld = JSON.parse(ldMatches[0][1]);

    if (node.id === 'genesis-node') {
      assert.equal(ld['@type'], 'ProfilePage');
      assert.equal(ld.mainEntity['@type'], 'Person');
      assert.equal(ld.mainEntity.sameAs.length, 5);
    } else if (node.video && node.video.exportVideoObject === true) {
      assert.equal(ld['@type'], 'VideoObject');
      assert.equal(ld.name, node.video.name, `VideoObject.name mismatch on ${node.id}`);
      assert.equal(ld.description, node.video.description, `VideoObject.description mismatch on ${node.id}`);
      assert.equal(ld.thumbnailUrl, node.video.thumbnailUrl, `VideoObject.thumbnailUrl mismatch on ${node.id}`);
      assert.equal(ld.uploadDate, node.video.uploadDate, `VideoObject.uploadDate mismatch on ${node.id}`);
      assert.equal(ld.embedUrl, node.video.embedUrl, `VideoObject.embedUrl mismatch on ${node.id}`);
      assert.equal(ld.url, `${catalog.site.url}${node.permalink}`, `VideoObject.url mismatch on ${node.id}`);
      assert.equal(ld.sameAs, node.video.sourceUrl, `VideoObject.sameAs mismatch on ${node.id}`);
      assert.ok(/^https:\/\//.test(ld.thumbnailUrl), `VideoObject.thumbnailUrl must be HTTPS on ${node.id}`);
      assert.notEqual(ld.thumbnailUrl, catalog.site.ogImage, `VideoObject.thumbnailUrl must not reuse generic site OG image on ${node.id}`);
      assert.ok(/^https:\/\//.test(ld.embedUrl), `VideoObject.embedUrl must be HTTPS on ${node.id}`);
      assert.equal(ld.contentUrl, undefined, 'contentUrl must not be emitted without direct media stream URL');
      assert.match(ld.uploadDate, /^\d{4}-\d{2}-\d{2}(?:T.+)?$/, `uploadDate must be a full ISO date (not just a year) on ${node.id}`);
      assert.ok(!Array.isArray(node.video.missingSeoFields) || node.video.missingSeoFields.length === 0, `Eligible VideoObject ${node.id} still lists missingSeoFields`);
      videoObjectsCount += 1;
    } else {
      assert.equal(ld['@type'], 'CreativeWork');
    }
  }

  assert.equal(
    videoObjectsCount,
    eligibleVideoNodes.length,
    `Expected ${eligibleVideoNodes.length} VideoObject pages derived from eligible catalog records, got ${videoObjectsCount}`
  );
  return { catalog, nodesCount: nodes.length, sheets, drives, youtubes, videoObjectsCount };
}

function checkStaticArtifact(catalog) {
  const siteUrl = catalog.site.url.replace(/\/+$/, '');

  // 1. Extensible Sitemap XML validation
  const sitemapXml = readText(path.join(SITE_DIR, 'sitemap.xml'));
  assert.match(sitemapXml, /^<\?xml version="1\.0" encoding="utf-8"\?>/);
  assert.match(sitemapXml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);

  const urlBlocks = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  assert.ok(urlBlocks.length > 0, 'Sitemap contains no <url> entries');

  const seenLocs = new Set();
  for (const block of urlBlocks) {
    const inner = block[1];
    const locMatch = inner.match(/<loc>([^<]+)<\/loc>/);
    assert.ok(locMatch, 'Sitemap <url> block missing <loc>');
    const loc = locMatch[1].trim();
    assert.ok(loc.startsWith(`${siteUrl}/`), `Sitemap URL outside site origin: ${loc}`);
    assert.ok(!seenLocs.has(loc), `Duplicate sitemap <loc>: ${loc}`);
    seenLocs.add(loc);

    const relPath = loc.slice(siteUrl.length) || '/';
    const resolvedFile = resolveSiteUrlToFile(relPath);
    assert.ok(resolvedFile && resolvedFile.endsWith('.html'), `Sitemap URL does not resolve to HTML file: ${loc}`);

    const targetHtml = readText(resolvedFile);
    const canonicalMatch = targetHtml.match(/<link rel="canonical" href="([^"]+)">/i);
    assert.ok(canonicalMatch, `Sitemap target HTML missing canonical: ${loc}`);
    assert.equal(canonicalMatch[1], loc, `Canonical mismatch on sitemap target: ${loc}`);

    const lastmodMatch = inner.match(/<lastmod>([^<]+)<\/lastmod>/);
    if (lastmodMatch) {
      assert.match(lastmodMatch[1].trim(), /^\d{4}-\d{2}-\d{2}(?:T.+)?$/, `Invalid lastmod date: ${lastmodMatch[1]}`);
    }
  }

  const requiredLocs = [
    `${siteUrl}/`,
    ...catalog.nodes.map((n) => `${siteUrl}${n.permalink}`)
  ];
  for (const reqLoc of requiredLocs) {
    assert.ok(seenLocs.has(reqLoc), `Required canonical URL missing from sitemap.xml: ${reqLoc}`);
  }
  assert.ok(!seenLocs.has(`${siteUrl}/blog/`), 'Unpublished legacy /blog/ must not appear in sitemap.xml');
  assert.ok(!seenLocs.has(`${siteUrl}/mobile.html`), 'Unpublished legacy /mobile.html must not appear in sitemap.xml');
  assert.ok(!seenLocs.has(`${siteUrl}/404.html`), '404.html must not appear in sitemap.xml');

  // 2. robots.txt & 404.html
  const robotsTxt = readText(path.join(SITE_DIR, 'robots.txt'));
  assert.match(robotsTxt, /Sitemap:\s*https:\/\/minato-makoto\.github\.io\/sitemap\.xml/);

  const notFoundHtml = readText(path.join(SITE_DIR, '404.html'));
  assert.doesNotMatch(notFoundHtml, /http-equiv="refresh"|location\.replace/i);

  // 3. Excluded authoring/source & non-published legacy files must not enter _site
  for (const excluded of [
    'Portfolio_LuongBaoHuy_EN.pdf',
    'portfolio-design-research.md',
    'docs',
    'legacy',
    'mobile.html',
    'blog',
    'styles.css',
    'src'
  ]) {
    assert.ok(!fs.existsSync(path.join(SITE_DIR, excluded)), `Excluded item leaked into _site: ${excluded}`);
  }

  // 3b. Verify site-native favicon SVG & 1200x630 PNG OG cover
  const faviconSvg = readText(path.join(SITE_DIR, 'assets', 'favicon.svg'));
  assert.match(faviconSvg, /<svg\b[^>]*viewBox="0 0 64 64"/i, 'Invalid site-native favicon.svg');
  const ogPng = fs.readFileSync(path.join(SITE_DIR, 'assets', 'images', 'og-cover.png'));
  assert.ok(ogPng.length > 24 && ogPng.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'Invalid PNG signature on og-cover.png');
  assert.equal(ogPng.readUInt32BE(16), 1200, 'Expected og-cover.png width to be 1200');
  assert.equal(ogPng.readUInt32BE(20), 630, 'Expected og-cover.png height to be 630');

  // 4. Scan ALL HTML files inside _site (except Google verification token file) for valid local refs
  const allHtmlFiles = collectHtmlFiles(SITE_DIR).filter(
    (f) => path.basename(f) !== 'google96fbb76f00681fc4.html'
  );

  let checkedLinksCount = 0;
  for (const htmlFile of allHtmlFiles) {
    const relFromSite = path.posix.join('/', path.relative(SITE_DIR, htmlFile).split(path.sep).join('/'));
    const urlDir = path.posix.dirname(relFromSite);
    const html = readText(htmlFile);
    const htmlNoScripts = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

    const refs = [
      ...extractTagsAttr(htmlNoScripts, /<(?:a|link)\b[^>]*>/gi, 'href'),
      ...extractTagsAttr(htmlNoScripts, /<img\b[^>]*>/gi, 'src'),
      ...extractTagsAttr(html, /<script\b[^>]*\bsrc=[^>]*>/gi, 'src'),
      ...extractTagsAttr(htmlNoScripts, /<meta\b[^>]+property=["'](?:og:image|og:url)["'][^>]*>/gi, 'content')
    ];

    for (const ref of refs) {
      if (!ref || ref.startsWith('#') || ref.startsWith('mailto:') || ref.startsWith('tel:') || ref.startsWith('data:')) {
        continue;
      }

      if (/^https?:\/\//i.test(ref)) {
        if (ref.startsWith(siteUrl)) {
          const pathOnly = ref.slice(siteUrl.length) || '/';
          assert.ok(resolveSiteUrlToFile(pathOnly), `Broken site-origin URL ${ref} in ${htmlFile}`);
          checkedLinksCount += 1;
        }
        continue;
      }

      const resolvedUrl = ref.startsWith('/')
        ? ref
        : path.posix.normalize(path.posix.join(urlDir, ref));
      assert.ok(
        resolveSiteUrlToFile(resolvedUrl),
        `Broken local reference "${ref}" (resolved "${resolvedUrl}") in ${htmlFile}`
      );
      checkedLinksCount += 1;
    }
  }

  // 5. Byte-exact SHA-256 verification for preserved site-root hosting/verification files in public/ -> _site/
  //    (works in shallow single-branch CI checkouts; also cross-checks git blob if 63464e5 is present locally)
  const canCrossCheckGit = hasLocalGitCommit(LEGACY_COMMIT);
  for (const entry of ROOT_INFRA_MANIFEST) {
    const sourceBuf = fs.readFileSync(path.join(PUBLIC_DIR, entry.path));
    assert.equal(sourceBuf.length, entry.bytes, `Public source size mismatch for ${entry.path}`);
    assert.equal(sha256Hex(sourceBuf), entry.sha256, `Public source SHA-256 mismatch for ${entry.path}`);

    const builtBuf = fs.readFileSync(path.join(SITE_DIR, entry.path));
    assert.equal(builtBuf.length, entry.bytes, `Built site-root size mismatch for ${entry.path}`);
    assert.equal(sha256Hex(builtBuf), entry.sha256, `Built site-root SHA-256 mismatch for ${entry.path}`);
    assert.equal(Buffer.compare(builtBuf, sourceBuf), 0, `Built site-root byte mismatch vs public/ for ${entry.path}`);

    if (canCrossCheckGit) {
      const gitBuf = execFileSync('git', ['cat-file', 'blob', `${LEGACY_COMMIT}:${entry.path}`], { maxBuffer: 20 * 1024 * 1024 });
      assert.equal(Buffer.compare(builtBuf, gitBuf), 0, `Built site-root byte mismatch vs git ${LEGACY_COMMIT} for ${entry.path}`);
    }
  }
  assert.equal(fs.statSync(path.join(SITE_DIR, 'google96fbb76f00681fc4.html')).size, 53);

  return {
    sitemapCount: seenLocs.size,
    htmlScanned: allHtmlFiles.length,
    checkedLinksCount,
    rootInfraCount: ROOT_INFRA_MANIFEST.length,
    rootInfraVerificationMode: canCrossCheckGit ? 'sha256+git-63464e5' : 'sha256-pinned-manifest'
  };
}

async function checkHttpServing() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg'
  };

  const server = http.createServer((req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    const resolved = resolveSiteUrlToFile(reqPath);
    if (!resolved) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(SITE_DIR, '404.html')));
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(resolved));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const probes = [
    { path: '/', expectedStatus: 200 },
    { path: '/work/harmony-2025/', expectedStatus: 200 },
    { path: '/work/doraemon-lipice-sheer-color/', expectedStatus: 200 },
    { path: '/assets/css/tokens.css', expectedStatus: 200 },
    { path: '/assets/css/stage-nodes.css', expectedStatus: 200 },
    { path: '/assets/css/chrome-hud.css', expectedStatus: 200 },
    { path: '/assets/js/catalog-data.js', expectedStatus: 200 },
    { path: '/assets/js/nodes-data.js', expectedStatus: 200 },
    { path: '/assets/js/scene-engine.js', expectedStatus: 200 },
    { path: '/assets/vendor/three-r128/three.min.js', expectedStatus: 200 },
    { path: '/assets/vendor/three-r128/CSS3DRenderer.js', expectedStatus: 200 },
    { path: '/assets/favicon.svg', expectedStatus: 200 },
    { path: '/assets/images/og-cover.png', expectedStatus: 200 },
    { path: '/google96fbb76f00681fc4.html', expectedStatus: 200 },
    { path: '/robots.txt', expectedStatus: 200 },
    { path: '/sitemap.xml', expectedStatus: 200 },
    { path: '/blog/', expectedStatus: 404 },
    { path: '/mobile.html', expectedStatus: 404 },
    { path: '/duong-dan-sai-kiem-tra-404', expectedStatus: 404 }
  ];

  const httpResults = [];
  try {
    for (const probe of probes) {
      const response = await fetch(`${baseUrl}${probe.path}`);
      const buf = Buffer.from(await response.arrayBuffer());
      assert.equal(response.status, probe.expectedStatus, `HTTP ${probe.path} expected ${probe.expectedStatus}, got ${response.status}`);
      if (probe.path === '/google96fbb76f00681fc4.html') {
        assert.equal(buf.length, 53, 'Verification file size mismatch via HTTP');
      }
      if (probe.expectedStatus === 404) {
        const html404 = buf.toString('utf8');
        assert.match(html404, /noindex/i);
        assert.doesNotMatch(html404, /stage-nodes\.css|scene-engine\.js/);
      }
      httpResults.push({ path: probe.path, status: response.status, bytes: buf.length });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  return httpResults;
}

const syntaxCount = checkSyntaxAndBuild();
const dataSummary = checkDataAndLayoutSeparation();
const artifactSummary = checkStaticArtifact(dataSummary.catalog);
const httpResults = await checkHttpServing();

console.log(JSON.stringify({
  syntaxCheckedFiles: syntaxCount,
  nodes: dataSummary.nodesCount,
  sheets: dataSummary.sheets,
  drives: dataSummary.drives,
  youtubes: dataSummary.youtubes,
  videoObjectsEmitted: dataSummary.videoObjectsCount,
  sitemapUrls: artifactSummary.sitemapCount,
  htmlFilesScanned: artifactSummary.htmlScanned,
  internalRefsVerified: artifactSummary.checkedLinksCount,
  rootInfraFiles: artifactSummary.rootInfraCount,
  rootInfraVerificationMode: artifactSummary.rootInfraVerificationMode,
  httpProbesPassed: httpResults.length,
  httpResults
}, null, 2));
