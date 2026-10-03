import { chromium } from 'playwright';
import { passGate, playLesson, signUp } from './scripts/kidslang-driver.mjs';
const b = await chromium.launch();
for (const h of [480, 560]) {
  const page = await (await b.newContext({ viewport: { width: 360, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, baseURL: 'http://localhost:4173' })).newPage();
  const check = async (name, loc) => {
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const bx = await loc.boundingBox();
    const ok = bx && bx.y >= 0 && bx.y + bx.height <= h + 0.5;
    console.log(h, ok ? 'OK  ' : 'FAIL', name, bx && Math.round(bx.y + bx.height));
    if (!ok) await page.screenshot({ path: `/tmp/claude-0/shots/fail-${h}-${name}.png` });
  };
  await page.goto('/');
  await check('welcome-letsgo', page.getByRole('button', { name: /Let's go/ }));
  await check('welcome-grownups', page.getByRole('button', { name: /Grown-ups/ }));
  await page.getByRole('button', { name: /Let's go/ }).click();
  await signUp(page);
  await passGate(page);
  await page.getByLabel('Nickname').fill('Sara');
  await check('create-profile', page.getByRole('button', { name: 'Create profile' }));
  await page.getByRole('button', { name: 'Create profile' }).click();
  await page.getByTestId('child-Sara').click();
  await page.getByTestId('course-ar').click();
  await check('meet-alphabet', page.getByRole('button', { name: /Meet the alphabet/i }));
  await page.getByRole('button', { name: /Meet the alphabet/i }).click();
  await check('start-lessons', page.getByRole('button', { name: /Start the lessons/i }));
  await page.getByRole('button', { name: /Start the lessons/i }).click();
  await page.getByTestId('node-ar-l1-u1-l1').click();
  console.log(h, 'first try:', await playLesson(page, { failCheck: true }));
  const practice = page.getByRole('button', { name: /Let's practice/ });
  await check('help-letspractice', practice);
  if (h === 480) await page.screenshot({ path: '/tmp/claude-0/shots/help-480.png' });
  await practice.click();
  console.log(h, 'after help:', await playLesson(page));
  const next = page.getByRole('button', { name: /map|Next/i }).last();
  await check('reward-buttons', next);
  if (h === 480) await page.screenshot({ path: '/tmp/claude-0/shots/reward-480.png' });
}
await b.close();
