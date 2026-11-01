import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('both repository scopes and normal Git mutations are allowed while force remains denied',()=>{
 const s=readFileSync(new URL('../scripts/invoke-opencode.ps1',import.meta.url),'utf8');
 assert.ok(s.includes('@($cfg.siteRepo,$cfg.stateDir,$repoRoot,'));
 for(const verb of ['add','commit','push origin'])assert.ok(s.includes("resource='git -C * "+verb+" *'; effect='allow'"));
 assert.ok(s.includes("resource='git -C * push *--force*'; effect='deny'"));
});
