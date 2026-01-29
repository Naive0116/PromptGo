// Node 18+；Playwright 取得渲染後 DOM；輸出 out/prompt.json + out/ChatGPT_for_*.json（扁平 items）
import fs from 'fs-extra';
import path from 'node:path';
import { chromium } from 'playwright';

/* ---------- args（--k=v / --k v） ---------- */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    let t = argv[i];
    if (!t.startsWith('--')) continue;
    let [k, v] = t.split('=');
    k = k.replace(/^--/, '');
    if (v === undefined) {
      const n = argv[i + 1];
      if (n && !n.startsWith('--')) { v = n; i++; } else v = true;
    }
    out[k] = v;
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const CFG = {
  tagUrl: args.tag || 'https://academy.openai.com/public/tags/prompt-packs-6849a0f98c613939acef841c',
  singleUrl: args.single || '',
  outDir: args.out || './crawler/out',
  delayMs: Number(args.delayMs ?? 350),
  headless: String(args.headless ?? '1') !== '0',
  requiredTags: (args.requiredTags || 'WORK USERS,PROMPT PACKS')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
  debug: String(args.debug || '0') === '1'
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) SBH-AcademyCrawler/1.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = (t='') => t.replace(/\s+/g, ' ').trim();
const toKey = t => clean(t).replace(/\s+/g, '_').replace(/[^\w]/g, '');
async function saveJSON(p, data) { await fs.ensureDir(path.dirname(p)); await fs.writeJson(p, data, { spaces: 2 }); }

/* ---------- superPrompt 生成：把 [xxx] 依序替換成 {{ fieldN || xxx}} ---------- */
function makeSuperPrompt(promptText = '') {
  let n = 1;
  return String(promptText).replace(/\[([^\]]+)\]/g, (_m, label) => {
    const def = String(label).trim();
    return `{{ field${n++} || ${def}}}`;
  });
}

/* ---------- 扁平化：把 sections 攤成 items，並附上 superPrompt ---------- */
function toFlatDoc(d, tags = []) {
  const items = (d.sections || [])
    .flatMap(s => s.items || [])
    .filter(x => x && (x.use_case || x.prompt || x.chatgpt_url))
    .map(x => ({
      use_case: x.use_case || '',
      prompt: x.prompt || '',
      superPrompt: makeSuperPrompt(x.prompt || ''),
      chatgpt_url: x.chatgpt_url || ''
    }));
  return {
    title: d.title,
    page_url: d.page_url,
    tags,
    items,
    scraped_at: d.scraped_at
  };
}

/* ---------- 共用：自動捲動 ---------- */
async function autoScroll(page, { step = 900, times = 24 }) {
  for (let i = 0; i < times; i++) {
    await page.evaluate(y => window.scrollBy(0, y), step);
    await sleep(120);
  }
}

/* ---------- 列表頁：抓 {url,title,tags[]}；tags 可能是 span/div，且常在卡片附近 ---------- */
async function getCardsFromTag(browser, tagUrl) {
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();
  try {
    await page.goto(tagUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('a[href*="/public/"]', { timeout: 30000 }).catch(() => {});
    await autoScroll(page, { times: 24 });
    await page.waitForTimeout(1200); // 讓 CSR/圖片載入完

    const cards = await page.evaluate(() => {
      const clean = (t='') => t.replace(/\s+/g, ' ').trim();
      const WANT = new Set(['WORK USERS', 'PROMPT PACKS']);

      // 在「目標節點附近」找 tag pills（往上 3 層 + 前 3 個兄弟 + 各自 subtree）
      function findPillsNear(node) {
        const found = new Set();
        function harvest(scope) {
          if (!scope) return;
          const els = scope.querySelectorAll('a, span, div, p, li');
          for (const el of els) {
            const txt = clean(el.textContent).toUpperCase();
            const m = txt.match(/^#\s*([A-Z\s]+)$/);
            if (m && WANT.has(m[1])) found.add(m[1]);
          }
        }
        let cur = node;
        for (let i = 0; i < 3 && cur; i++) {
          harvest(cur);
          let sib = cur.previousElementSibling;
          for (let j = 0; j < 3 && sib; j++) { harvest(sib); sib = sib.previousElementSibling; }
          cur = cur.parentElement;
        }
        return [...found];
      }

      const anchors = Array.from(document.querySelectorAll('a[href]'))
        .filter(a => /\/public\/(resources\/|clubs\/[^/]+\/resources\/)/.test(a.href)
                  && !/\/events\//.test(a.href)
                  && !/\/resources\/?$/.test(a.href));

      const map = new Map(); // url -> {url,title,tags}
      for (const a of anchors) {
        const url = a.href.split('#')[0];
        const container = a.closest('article, li, section, .card, .grid, .row, .col, div') || a;

        let titleEl = container.querySelector('h2, h3, h1, a[href*="/resources/"]') || a;
        let title = clean(titleEl.textContent || '');
        if (!/^ChatGPT for /i.test(title)) {
          const up = container.parentElement;
          const upTitle = up?.querySelector?.('h2, h3, h1');
          if (upTitle) title = clean(upTitle.textContent || title);
        }

        const tags = findPillsNear(container);

        const prev = map.get(url);
        if (!prev) map.set(url, { url, title, tags });
        else {
          const betterTitle = prev.title.length >= title.length ? prev.title : title;
          const mergedTags = [...new Set([...(prev.tags || []), ...tags])];
          map.set(url, { url, title: betterTitle, tags: mergedTags });
        }
      }
      return [...map.values()];
    });

    if (CFG.debug) {
      console.log('[cards.count]', cards.length);
      cards.forEach(c => console.log('  -', c.title, '::', c.url, '::', c.tags));
    }
    return cards;
  } finally {
    await page.close(); await ctx.close();
  }
}

/* ---------- 單篇解析：Title / Sections（在 H2 範圍內深層搜尋 table） ---------- */
async function parseResourcePage(browser, url) {
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('h1', { timeout: 25000 });
    await autoScroll(page, { times: 24 });
    await page.waitForTimeout(1200);

    await page.waitForSelector('table', { timeout: 30000 }).catch(() => {});

    const data = await page.evaluate(() => {
      const clean = (t='') => t.replace(/\s+/g, ' ').trim();
      const title = clean(document.querySelector('h1')?.textContent || '');

      const sections = [];
      const h2s = Array.from(document.querySelectorAll('h2'));

      const rangeTables = (start, next) => {
        const out = [];
        let el = start.nextElementSibling;
        while (el && el !== next) {
          if (el.matches('table')) out.push(el);
          out.push(...el.querySelectorAll('table'));
          el = el.nextElementSibling;
        }
        return out;
      };

      for (let i = 0; i < h2s.length; i++) {
        const h2 = h2s[i], next = h2s[i+1] || null;
        const heading = clean(h2.textContent || '');
        const tables = rangeTables(h2, next);
        const items = [];

        for (const table of tables) {
          // 表頭
          let headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => clean(th.textContent).toLowerCase());
          if (headers.length === 0) {
            const first = table.querySelector('tr');
            if (first) headers = Array.from(first.querySelectorAll('th,td'))
              .map(x => clean(x.textContent).toLowerCase());
          }

          let idxUse = headers.findIndex(h => /use\s*case/.test(h));
          let idxPrompt = headers.findIndex(h => /prompt/.test(h));
          let idxUrl = headers.findIndex(h => /\burl\b/.test(h));

          // 退場：2~3 欄推測
          if (idxUse === -1 && idxPrompt === -1 && headers.length && headers.length <= 3) {
            idxUse = 0; idxPrompt = 1; idxUrl = headers.length >= 3 ? 2 : -1;
          }

          const bodyRows = table.querySelectorAll('tbody tr');
          const rows = bodyRows.length ? Array.from(bodyRows)
            : Array.from(table.querySelectorAll('tr')).slice(1);

          for (const tr of rows) {
            const tds = Array.from(tr.querySelectorAll('td'));
            if (!tds.length) continue;

            const use_case = idxUse >= 0 ? clean(tds[idxUse]?.textContent || '') : '';
            const promptHtml = idxPrompt >= 0 ? (tds[idxPrompt]?.innerHTML || '') : '';
            const prompt = clean(
              promptHtml.replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<\/p>\s*<p>/gi, '\n')
                        .replace(/<[^>]+>/g, ' ')
            );

            let chatgpt_url = '';
            if (idxUrl >= 0 && tds[idxUrl]) {
              const a = tds[idxUrl].querySelector('a[href]');
              if (a) chatgpt_url = a.href;
            } else {
              const a = tr.querySelector('a[href]');
              if (a && /try it in chatgpt/i.test(clean(a.textContent || ''))) {
                chatgpt_url = a.href;
              }
            }

            if (use_case || prompt) items.push({ use_case, prompt, chatgpt_url });
          }
        }

        if (items.length) sections.push({ heading, items });
      }

      return { title, sections };
    });

    data.page_url = url;
    data.scraped_at = new Date().toISOString();
    return data;
  } finally {
    await page.close(); await ctx.close();
  }
}

/* ---------- 主流程 ---------- */
(async function main() {
  await fs.ensureDir(CFG.outDir);
  const browser = await chromium.launch({ headless: CFG.headless });

  // A) 單頁（debug/驗證）
  if (CFG.singleUrl) {
    const d = await parseResourcePage(browser, CFG.singleUrl);
    const key = toKey(d.title || 'ChatGPT_for_unknown');
    const flat = toFlatDoc(d, []); // ★ 只留 items，並加 superPrompt
    await saveJSON(path.join(CFG.outDir, `${key}.json`), flat);
    await saveJSON(path.join(CFG.outDir, 'prompt.json'), {
      [key]: { title: d.title, page_url: d.page_url, tags: [] }
    });
    console.log('Saved single:', key);
    await browser.close();
    return;
  }

  // B) 列表頁抓卡片（含 title + 兩個 tag）
  const cards = await getCardsFromTag(browser, CFG.tagUrl);

  // C) 在列表頁就過濾：標題以 ChatGPT for 開頭 + 同時存在兩個 tag
  const filtered = cards.filter(c => {
    const okTitle = /^ChatGPT for /i.test(c.title || '');
    const tagSet = new Set((c.tags || []).map(t => t.toUpperCase()));
    const okTags = CFG.requiredTags.every(t => tagSet.has(t));
    return okTitle && okTags;
  });

  if (CFG.debug) {
    console.log('[filtered.count]', filtered.length);
    filtered.forEach(c => console.log('  ✓', c.title, '::', c.url, '::', c.tags));
  }

  // D) 逐篇解析（只針對過濾後的）→ 寫扁平檔（含 superPrompt）
  const picked = [];
  for (const card of filtered) {
    try {
      const d = await parseResourcePage(browser, card.url);
      if ((d.sections?.length || 0) > 0) {
        const key = toKey(d.title);
        const flat = toFlatDoc(d, card.tags);
        picked.push(flat);
        await saveJSON(path.join(CFG.outDir, `${key}.json`), flat);
        if (CFG.debug) console.log(' + saved', key);
      } else if (CFG.debug) {
        console.log(' - no sections', d.title || card.url);
      }
    } catch (e) {
      console.warn('[fail]', card.url, e.message);
    }
    await sleep(CFG.delayMs);
  }

  // E) 列表 prompt.json（key 對應各別檔名）
  const promptObj = {};
  for (const d of picked) {
    const key = toKey(d.title);
    promptObj[key] = { title: d.title, page_url: d.page_url, tags: d.tags || [] };
  }
  await saveJSON(path.join(CFG.outDir, 'prompt.json'), promptObj);

  console.log(`\nDone. Total pages: ${picked.length}`);
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
