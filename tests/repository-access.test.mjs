import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('diagnostic commands and Git dry runs are scoped, while agent Git mutations are unavailable',()=>{
  const source=readFileSync(new URL('../scripts/invoke-opencode.ps1',import.meta.url),'utf8');
  for (const command of ['node --version','git --version','git -C * push --dry-run origin HEAD:main'])
    assert.ok(source.includes("resource='"+command+"'; effect='allow'"));
  assert.doesNotMatch(source,/resource='git .*?(?:commit|push origin) .*?'; effect='allow'/);
  assert.ok(source.includes("resource='git -C * push *--force*'; effect='deny'"));
});
