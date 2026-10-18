import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cfg=JSON.parse((await readFile(join(root,'config.local.json'),'utf8')).replace(/^\uFEFF/,''));
const terms=['cannabis grow journal','cannabis plant diagnosis','grow journal','Grow with Jane','BudLabs','GrowDoc','HiGrade','GrowBuddy'];
const apps=new Map(), failures=[];
for(const term of terms){
  const url=new URL('https://itunes.apple.com/search');
  for(const [k,v] of Object.entries({term,country:'us',entity:'software',limit:'50'}))url.searchParams.set(k,v);
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    const data=await response.json();
    for(const a of data.results??[]){
      if(!a.trackId)continue;
      const existing=apps.get(a.trackId);
      apps.set(a.trackId,{id:a.trackId,name:a.trackName,developer:a.sellerName??a.artistName,url:a.trackViewUrl,usRatingCount:a.userRatingCount??null,stars:a.averageUserRating??null,price:a.formattedPrice??null,version:a.version??null,updatedAt:a.currentVersionReleaseDate??null,description:a.description??'',terms:[...new Set([...(existing?.terms??[]),term])]});
    }
  }catch(e){failures.push({term,error:e.message});}
}
const sorted=[...apps.values()].sort((a,b)=>(b.usRatingCount??-1)-(a.usRatingCount??-1));
const report={checkedAt:new Date().toISOString(),storefront:'US',source:'Apple iTunes Search API',limitations:'Search sample, not exhaustive market ranking. Rating count is not written-review count, downloads, active users or search volume. Human relevance filtering and current listing verification required before publication.',terms,failures,apps:sorted};
await mkdir(cfg.stateDir,{recursive:true});
await writeFile(join(cfg.stateDir,'us-ios-competitor-census.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checkedAt:report.checkedAt,count:sorted.length,failures,candidates:sorted.filter(a=>/cannabis|grow journal|growlog|budlabs|growdoc|higrade|growbuddy/i.test(a.name+' '+a.description)).slice(0,25).map(({description,...a})=>a)},null,2));
if(!sorted.length)process.exitCode=1;
