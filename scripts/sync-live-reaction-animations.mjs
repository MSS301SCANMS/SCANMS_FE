// Download only from Google's published Noto Emoji asset endpoints.
// Run manually: node scripts/sync-live-reaction-animations.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

// Optional offline optimiser, installed outside the app's dependencies.
// Set SCANMS_EMOJI_SHARP to the absolute path of a local sharp installation.
const sharp = process.env.SCANMS_EMOJI_SHARP ? createRequire(import.meta.url)(process.env.SCANMS_EMOJI_SHARP) : null;

const definitions = [
  ['heart', '2764_fe0f'], ['like', '1f44d'], ['haha', '1f602'],
  ['wow', '1f62e'], ['sad', '1f622'], ['angry', '1f621'],
  ['fire', '1f525'], ['gift', '1f381'], ['party', '1f389'],
  ['hundred', '1f4af'], ['star', '1f31f'],
];
const results = await Promise.allSettled(definitions.map(async ([id, codepoint]) => {
  const url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.webp`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 4).toString() !== 'RIFF' || bytes.subarray(8, 12).toString() !== 'WEBP'
    || !bytes.includes(Buffer.from('ANIM')) || bytes.length > 2_000_000) throw new Error(`${id}: invalid animated WebP`);
  return { id, codepoint, url, bytes };
}));
const failures = results.filter(result => result.status === 'rejected');
if (failures.length) throw new AggregateError(failures.map(result => result.reason), 'No assets written: download failed');
const directory = new URL('../public/assets/live-reactions/animated/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = [];
for (const { value } of results) {
  const bytes = sharp ? await sharp(value.bytes, { animated: true }).resize({ width: 128 }).webp({ quality: 80, effort: 4 }).toBuffer() : value.bytes;
  if (sharp) await writeFile(new URL(`${value.id}.png`, directory), await sharp(value.bytes).resize(128, 128).png().toBuffer());
  await writeFile(new URL(`${value.id}.webp`, directory), bytes);
  manifest.push({ id: value.id, codepoint: value.codepoint, source: value.url,
    originalBytes: value.bytes.length, bytes: bytes.length, resizedTo: sharp ? 128 : 512,
    sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(new URL('manifest.json', directory), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Downloaded ${manifest.length} animated Noto Emoji (${Math.round(manifest.reduce((sum, item) => sum + item.bytes, 0) / 1024)} KB).`);
