import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTableBlocks() {
  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, title, body');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${pages?.length} pages`);

  const pagesWithTables = pages?.filter(page => {
    const body = page.body as any;
    if (!Array.isArray(body)) return false;
    return body.some((block: any) => block.type === 'table');
  });

  console.log(`\nPages with tables: ${pagesWithTables?.length}`);

  pagesWithTables?.forEach(page => {
    const body = page.body as any[];
    const tables = body.filter(b => b.type === 'table');
    console.log(`\n=== Page: ${page.title} (${page.id}) ===`);
    console.log(`Tables: ${tables.length}`);
    tables.forEach((table, i) => {
      console.log(`\nTable ${i + 1}:`);
      console.log(JSON.stringify(table, null, 2));
    });
  });
}

findTableBlocks();
