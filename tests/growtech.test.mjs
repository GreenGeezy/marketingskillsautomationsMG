import test from 'node:test';
import assert from 'node:assert/strict';
import {cadence,productReady,discoveryDue} from '../scripts/growtech-pilot.mjs';
import {publicationVerified} from '../scripts/growtech-release.mjs';
const now = new Date('2026-11-09T18:00:00Z');
test('spacing is global and crosses the Mexico City week boundary',()=>{
  const ledger=[{url:'https://www.mastergrowbot.com/old',publishedAt:'2026-11-08T18:01:00Z'}];
  assert.ok(cadence(ledger,[],now).blocks.includes('48-hour-spacing'));
  assert.equal(cadence(ledger,[],new Date('2026-11-10T18:01:00Z')).blocks.length,0);
});
test('weekly and campaign ceilings deduplicate URLs and pending pushes block',()=>{
  const rows=[1,2,3].map(i=>({url:'https://www.mastergrowbot.com/'+i,publishedAt:'2026-11-09T06:00:00Z'}));
  assert.ok(cadence(rows,[],now).blocks.includes('weekly-cap'));
  const releases=[1,2,3,4,5].map(i=>({url:'https://www.mastergrowbot.com/'+i,publishedAt:'2026-10-01T06:00:00Z',status:'production-verified'}));
  assert.ok(cadence([],releases,now).blocks.includes('campaign-cap'));
  assert.ok(cadence([],[{...releases[0],status:'push-pending'}],now).blocks.includes('pending-deployment'));
});
test('unknown costs, stale evidence, wrong SKU checkout or insufficient margins block product',()=>{
  const e={verified:true,verifiedAt:now.toISOString(),saleEnabled:false,priceUsd:199,inStock:true,
    checkoutVerified:true,planId:'plan_abc',hostedUrl:'https://whop.com/checkout/plan_abc',checkoutPath:'/grow-tech/checkout/grow-light',
    sku:'AG1000',dimensions:'verified fixture',contents:'panel',supplierSource:'verified source',
    fulfillmentTerms:'verified handling and transit',supplierDeliveredUsd:100,merchantFeesUsd:10};
  assert.equal(productReady('grow-light',e,now),true);
  for (const patch of [{supplierDeliveredUsd:null},{supplierDeliveredUsd:170},{verifiedAt:'2026-10-01'},
    {checkoutPath:'/grow-tech/checkout/wrong'},{checkoutVerified:false},{saleEnabled:true}])
    assert.equal(productReady('grow-light',{...e,...patch},now),false);
});
test('queued discovery is due any day and ambiguous attempts are excluded',()=>{
  assert.equal(discoveryDue({queue:[{url:'https://www.mastergrowbot.com/a',requestStatus:'queued'}]},now),true);
  assert.equal(discoveryDue({queue:[{url:'https://www.mastergrowbot.com/a',requestStatus:'ambiguous'}]},now),false);
});
test('live verification requires the article, canonical, sitemap and exact hub link',()=>{
  const r={slug:'test',url:'https://www.mastergrowbot.com/grow-guides/test',intro:'Verified buyer introduction'};
  const html='<link rel="canonical" href="'+r.url+'"><h1>Title</h1>'+r.intro;
  const hub='<a href="/grow-guides/test">Title</a>';
  const sitemap='<loc>'+r.url+'</loc>';
  assert.equal(publicationVerified(html,hub,sitemap,r),true);
  assert.equal(publicationVerified(html,hub.replace('test','other'),sitemap,r),false);
  assert.equal(publicationVerified(html+html,hub,sitemap,r),false);
});
