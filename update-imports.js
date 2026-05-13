import fs from 'fs';
import path from 'path';

const files = [
  'src/types/jobs.ts',
  'src/types/integrations.ts',
  'src/types/database.ts',
  'src/types/api-responses.ts',
  'src/tests/jobs.smoke.test.ts',
  'src/routes/api/public/make-callback.ts',
  'src/__tests__/auth.test.ts',
  'src/modules/prospecting/types.ts',
  'src/lib/leads-parser.ts',
  'src/lib/market-research.functions.ts',
  'src/lib/duediligence.functions.ts',
  'src/lib/auth-audit.functions.ts',
  'src/lib/places-bulk.functions.ts',
  'src/lib/leads-import.functions.ts',
  'src/lib/cnpj.functions.ts',
  'src/lib/jobs.functions.ts',
  'src/lib/make-integration.functions.ts',
  'src/modules/market-research/types.ts',
  'src/modules/crm/types.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/@\/server\/market-research\//g, '@/lib/market-research-server/');
    content = content.replace(/src\/server\/market-research\//g, 'src/lib/market-research-server/');
    content = content.replace(/@\/server\//g, '@/lib/');
    content = content.replace(/src\/server\//g, 'src/lib/');
    content = content.replace(/\.\.\/server\//g, '../lib/');
    content = content.replace(/\.\/server\//g, './lib/');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
