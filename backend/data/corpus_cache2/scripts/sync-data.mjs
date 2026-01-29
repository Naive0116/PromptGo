
import fs from 'fs/promises';
import path from 'path';

// Helper to remove control characters and BOM
const cleanString = (str) => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, '');
};

// Helper to generate superPrompt
const generateSuperPrompt = (prompt) => {
  if (!prompt) return '';
  let i = 1;
  return prompt.replace(/\[(.*?)\]/g, (_match, p1) => `{{ field${i++} || ${p1} }}`);
};

async function main() {
  // 1. Parse CLI arguments
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    acc[key.replace('--', '')] = value;
    return acc;
  }, {});

  const config = {
    srcEn: args['src-en'] || 'crawler/out',
    srcZh: args['src-zh'] || 'crawler/out_zh',
    dest: args['dest'] || 'public/data',
    fillMissing: args['fill-missing'] || 'none',
    pretty: args['pretty'] ? parseInt(args['pretty'], 10) : 2,
  };

  console.log('Starting data sync with config:', config);

  // Ensure destination directories exist
  const destEn = path.join(config.dest, 'en');
  const destZh = path.join(config.dest, 'zh-TW');
  await fs.mkdir(destEn, { recursive: true });
  await fs.mkdir(destZh, { recursive: true });

  const report = {
    generated_at: new Date().toISOString(),
    counts: {
      en: { categories: 0, items: 0 },
      'zh-TW': { categories: 0, items: 0 },
    },
    missing: {
      'zh-TW': [],
      en: [],
    },
    versions: { max_scraped_at: '' },
  };

  let maxScrapedAt = '';

  const processLanguage = async (lang, srcDir, destDir) => {
    const langKey = lang === 'en' ? 'en' : 'zh-TW';
    const files = await fs.readdir(srcDir);

    // Process prompt.json first
    const promptFileName = files.find(f => f.includes('prompt'));
    if (promptFileName) {
      const filePath = path.join(srcDir, promptFileName);
      const content = await fs.readFile(filePath, 'utf-8');
      const cleanedContent = cleanString(content);
      const data = JSON.parse(cleanedContent);

      // Sort keys
      const sortedData = Object.keys(data).sort().reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

      const destPath = path.join(destDir, 'prompt.json');
      await fs.writeFile(destPath, JSON.stringify(sortedData, null, config.pretty));
      console.log(`Processed and wrote ${destPath}`);
    }

    // Process category files
    const categoryFiles = files.filter(f => f.startsWith('ChatGPT_for_'));
    report.counts[langKey].categories = categoryFiles.length;

    let processedFileNames = [];
    for (const file of categoryFiles) {
      const filePath = path.join(srcDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const cleanedContent = cleanString(content);
      const data = JSON.parse(cleanedContent);

      // Process items
      if (data.items && Array.isArray(data.items)) {
        report.counts[langKey].items += data.items.length;
        data.items.forEach(item => {
          if (!item.superPrompt) {
            item.superPrompt = generateSuperPrompt(item.prompt);
          }
        });
      }

      // Update max_scraped_at
      if (data.scraped_at && data.scraped_at > maxScrapedAt) {
        maxScrapedAt = data.scraped_at;
      }
      
      const outFileName = file;
      processedFileNames.push(outFileName);
      const destPath = path.join(destDir, outFileName);
      await fs.writeFile(destPath, JSON.stringify(data, null, config.pretty));
      console.log(`Processed and wrote ${destPath}`);
    }
    return processedFileNames;
  };

  const enFiles = await processLanguage('en', config.srcEn, destEn);
  const zhFiles = await processLanguage('zh', config.srcZh, destZh);

  report.versions.max_scraped_at = maxScrapedAt;

  // Find missing files
  const enFileSet = new Set(enFiles);
  const zhFileSet = new Set(zhFiles);

  report.missing['zh-TW'] = enFiles.filter(f => !zhFileSet.has(f));
  report.missing['en'] = zhFiles.filter(f => !enFileSet.has(f));

  if (config.fillMissing === 'fallback-en') {
      console.log('`--fill-missing=fallback-en` is not fully implemented, only reporting missing files.');
  }

  // Write report
  const reportPath = path.join(config.dest, '_report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, config.pretty));
  console.log(`Sync complete. Report generated at ${reportPath}`);
}

main().catch(console.error);
