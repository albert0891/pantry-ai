require('dotenv').config({ path: '.env.local' });
const { parseVoiceInput } =
  require('./.next/server/app/actions/ai.js') || require('./.next/server/app/page.js'); // Not easy to require Next.js server actions this way.
