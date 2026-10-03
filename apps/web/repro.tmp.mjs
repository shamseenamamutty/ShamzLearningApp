import { chromium } from 'playwright';
import { passGate, playLesson, signUp } from './scripts/kidslang-driver.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 480 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, baseURL: 'http://localhost:4173' });
const page = await ctx.newPage();
await page.goto('/');
await page.getByRole('button', { name: /Let's go/ }).click();
await signUp(page);
await passGate(page);
await page.getByLabel('Nickname').fill('Sara');
await page.getByRole('button', { name: 'Create profile' }).click();
await page.getByTestId('child-Sara').click();
await page.getByTestId('course-ar').click();
await page.getByRole('button', { name: /Meet the alphabet/i }).click();
await page.getByRole('button', { name: /Start the lessons/i }).click();
await page.getByTestId('node-ar-l1-u1-l1').click();
try { console.log(await playLesson(page, { failCheck: true })); } catch (e) {
  console.log('stuck at', await page.getByTestId('stage').getAttribute('data-stage').catch(()=>'?'), '|', await page.getByTestId('caption').textContent().catch(()=>'?'));
  await page.screenshot({ path: '/tmp/claude-0/shots/stuck.png' }); await b.close(); process.exit(0); }
const box = await page.getByRole('button', { name: /Let's practice/ }).boundingBox();
console.log('button box', box);
await page.screenshot({ path: '/tmp/claude-0/shots/help-small.png' });
await b.close();
