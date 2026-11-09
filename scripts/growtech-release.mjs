import {execFileSync} from 'node:child_process';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {atomicJson} from './runtime-state.mjs';
import {baseUrl, campaignId, cadence, pilotState, productReady, queue, readJson} from './growtech-pilot.mjs';
import {localClock} from './policy.mjs';

function command(file, args, cwd, timeout = 25000) {
  return execFileSync(file, args, {cwd, timeout, encoding:'utf8', windowsHide:true, env:{...process.env,GIT_TERMINAL_PROMPT:'0'}}).trim();
}

function visible(html) {
  return html.replace(/<[^>]*>/g,' ').replace(/&(?:quot|#34);/g,'"')
    .replace(/&(?:apos|#39|#x27);/gi,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}

export function publicationVerified(article, hub, sitemap, release) {
  const canonical = [...article.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
  return canonical.length === 1 && canonical[0][0].includes('href="' + release.url + '"') &&
    !/<meta\b[^>]*content=["'][^"']*\bnoindex\b/i.test(article) &&
    /<h1\b/i.test(article) && visible(article).includes(release.intro) &&
    (hub.includes('href="/grow-guides/' + release.slug + '"') || hub.includes('href="' + release.url + '"')) &&
    sitemap.includes('<loc>' + release.url + '</loc>');
}

async function live(path) {
  const response = await fetch(baseUrl + path, {signal:AbortSignal.timeout(15000), redirect:'error'});
  if (!response.ok) throw new Error('Production HTTP ' + response.status + ' for ' + path);
  return response.text();
}

export async function verifyReleases(dir) {
  const file = join(dir,'growtech-releases.json');
  const releases = await readJson(file, []);
  const pending = releases.find(row => row.status !== 'production-verified');
  if (!pending) return null;
  if (pending.status === 'push-pending') return {status:'push-reconcile-required',slug:pending.slug};
  const pages = await Promise.all(['/grow-guides/' + pending.slug,'/grow-guides','/sitemap.xml'].map(live)).catch(() => null);
  if (!pages || !publicationVerified(...pages,pending)) return {status:'deployment-pending',slug:pending.slug};
  const timestamp = new Date().toISOString();
  const queueFile = join(dir,'gsc-url-queue.json');
  const ledger = await readJson(queueFile,{schemaVersion:1,queue:[]});
  if (!ledger.queue.some(row => row.url === pending.url)) {
    ledger.queue.push({url:pending.url,deployedRevision:pending.revision,queuedAt:timestamp,
      requestStatus:'queued',priority:'high',campaignId,reason:'Production article and exact Grow Guides card verified'});
    await atomicJson(queueFile,ledger);
  }
  Object.assign(pending,{status:'production-verified',publishedAt:timestamp,hubCardVerified:true,indexingState:'queued'});
  await atomicJson(file,releases);
  return pending;
}

export function validDraft(draft, item, evidence) {
  const review = draft?.review;
  const article = draft?.article;
  if (review?.eligible !== true || review.distinctIntent !== true ||
      !review.demandEvidence?.trim() || !Array.isArray(review.sources) || review.sources.length < 2 ||
      !review.sources.every(source => /^https:\/\//.test(source.url) && Number.isFinite(Date.parse(source.checkedAt))) ||
      article?.slug !== item.slug || !article.title?.trim() || !article.metaDescription?.trim() ||
      typeof article.intro !== 'string' || article.intro.length < 80 ||
      !Array.isArray(article.sections) || article.sections.length < 3 ||
      !article.h1?.trim() || !article.metaTitle?.trim() || !article.shortDescription?.trim() ||
      !Array.isArray(article.faqs) || !Array.isArray(article.relatedSlugs))
    throw new Error('Draft lacks required editorial evidence or article fields');
  const body = JSON.stringify(article);
  const checkoutPaths = Object.values(evidence).map(entry => entry?.checkoutPath).filter(Boolean);
  const links = [...body.matchAll(/\]\((\/grow-tech\/checkout\/[a-z0-9-]+)([^)]*)\)/g)];
  if (!links.some(link => item.productIds.some(id => evidence[id]?.checkoutPath === link[1])) ||
      links.some(link => !checkoutPaths.includes(link[1]) || link[2]) ||
      /utm_(?:source|campaign)|https?:[^" ]*whop\.com\/checkout/i.test(body))
    throw new Error('Article requires a verified first-party checkout CTA without campaign tags');
}

export async function publishDraft(config, root, task, deadline) {
  const {item,draftPath} = task;
  if (!queue.includes(item) || task.action !== 'publish') throw new Error('No authorized release candidate');
  const dir = config.stateDir;
  const releaseFile = join(dir,'growtech-releases.json');
  const evidence = await readJson(join(dir,'growtech-product-evidence.json'));
  if (!item.productIds.every(id => productReady(id,evidence[id]))) throw new Error('Product evidence is incomplete');
  const draft = await readJson(draftPath);
  validDraft(draft,item,Object.fromEntries(item.productIds.map(id => [id,evidence[id]])));

  const git = (args, cwd = config.siteRepo) => command('git',args,cwd);
  const origin = git(['remote','get-url','origin']);
  if (!/^(https:\/\/github\.com\/|git@github\.com:)GreenGeezy\/mastergrowbot(?:\.git)?$/i.test(origin))
    throw new Error('Unexpected storefront remote');
  const remoteMain = () => git(['ls-remote','--exit-code','origin','refs/heads/main']).split(/\s+/)[0];
  const base = remoteMain();
  git(['fetch','origin','refs/heads/main']);
  const worktrees = join(dir,'growtech-worktrees');
  await mkdir(worktrees,{recursive:true});
  const worktree = join(worktrees,item.slug + '-' + Date.now());
  git(['worktree','add','--detach',worktree,base]);
  const registry = 'src/data/growGuides.ts';
  const sitemap = 'public/sitemap.xml';
  const routing = 'vercel.json';
  const module = 'src/data/' + item.slug + '.ts';
  const url = baseUrl + '/grow-guides/' + item.slug;
  const today = localClock().day;
  const article = {...draft.article,publishedDate:today+'T00:00:00Z',modifiedDate:today+'T00:00:00Z'};
  await writeFile(join(worktree,module),"import type { GrowGuide } from './growGuides';\n\nexport const growtechPilotGuide: GrowGuide = " + JSON.stringify(article,null,2) + ';\n',{flag:'wx'});
  const index = await readFile(join(worktree,registry),'utf8');
  const marker = 'export const growGuides: GrowGuide[] = [';
  if (!index.includes(marker) || index.includes(item.slug)) throw new Error('Unexpected guide registry or duplicate slug');
  await writeFile(join(worktree,registry),"import { growtechPilotGuide as "+item.slug.replaceAll('-','_')+" } from './"+item.slug+"';\n"+
    index.replace(marker,marker+'\n  '+item.slug.replaceAll('-','_')+','));
  const xml = await readFile(join(worktree,sitemap),'utf8');
  if (xml.includes(url) || !xml.includes('</urlset>')) throw new Error('Unexpected sitemap or duplicate URL');
  await writeFile(join(worktree,sitemap),xml.replace('</urlset>','  <url><loc>'+url+'</loc><lastmod>'+today+'</lastmod></url>\n</urlset>'));

  const configText = await readFile(join(worktree,routing),'utf8');
  const routeMarker = /("rewrites"\s*:\s*\[)/;
  if (!routeMarker.test(configText) || configText.includes('/grow-guides/'+item.slug)) throw new Error('Unexpected deployment routing');
  await writeFile(join(worktree,routing),configText.replace(routeMarker,
    '$1\n    '+JSON.stringify({source:'/grow-guides/'+item.slug,destination:'/seo/grow-guides/'+item.slug+'.html'})+','));

  command(process.execPath,[join(root,'scripts','check-content-quality.mjs'),'--min-words','550','--require-cta',join(worktree,module)],worktree);
  const npm = (args, timeout) => {
    if (process.platform === 'win32') return command('cmd.exe',['/d','/c','npm',...args],worktree,timeout);
    return command('npm',args,worktree,timeout);
  };
  const timeLeft = () => {
    const left = deadline.getTime() - Date.now() - 90000;
    if (left <= 0) throw new Error('Release deferred: insufficient verification time');
    return Math.min(left, 300000);
  };
  npm(['ci','--no-audit','--no-fund'],timeLeft());
  npm(['run','build'],timeLeft());
  command(process.execPath,[join(worktree,'node_modules','eslint','bin','eslint.js'),module],worktree,timeLeft());
  const intro = visible(article.intro).slice(0,80);
  const candidate = {slug:item.slug,url,intro};
  const built = await Promise.all(['dist/seo/grow-guides/'+item.slug+'.html','dist/seo/grow-guides.html','dist/sitemap.xml'].map(p => readFile(join(worktree,p),'utf8')));
  if (!publicationVerified(...built,candidate)) throw new Error('Built article, canonical, sitemap or hub evidence failed');
  const paths = [registry,sitemap,module,routing];
  git(['add','--',...paths],worktree);
  const staged = git(['diff','--cached','--name-only'],worktree).split(/\r?\n/);
  if (staged.length !== paths.length || staged.some(path => !paths.includes(path))) throw new Error('Unexpected staged paths');
  git(['commit','-m','Publish GrowTech guide: '+item.slug],worktree);
  const revision = git(['rev-parse','HEAD'],worktree);
  const releases = await readJson(releaseFile,[]);
  const ledger = await readJson(join(dir,'new-page-ledger.json'));
  const guard = cadence(ledger.weeks.flatMap(week => week.published),releases);
  if (guard.blocks.length || remoteMain() !== base) throw new Error('Release deferred: cadence changed or remote main advanced. Draft is retained for a clean rebuild.');
  timeLeft();
  const record = {...candidate,campaignId,intent:item.intent,productIds:item.productIds,revision,base,
    rollback:'git revert '+revision,status:'push-pending',pushAttemptedAt:new Date().toISOString(),worktree};
  releases.push(record);
  await atomicJson(releaseFile,releases);
  git(['push','origin','HEAD:refs/heads/main'],worktree);
  record.status = 'pushed';
  await atomicJson(releaseFile,releases);
  return record;
}
