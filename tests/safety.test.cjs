const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../public/safety-core.js');
const now = Date.parse('2026-09-24T12:00:00Z');
test('eligibility separates a balance threshold from verified reward entitlement', () => {
  assert.match(core.eligibility(25,true,now)[0], /Below/);
  assert.match(core.eligibility(300,true,now)[0], /not verified/);
  assert.match(core.eligibility(60000,true,now)[1], /50,000/);
  assert.match(core.eligibility(null,true,now)[0], /unavailable/);
  assert.match(core.eligibility(900,false,now)[0], /Connect/);
  assert.match(core.eligibility(900,true,Date.parse('2026-10-24'))[0], /ended/);
});
test('activity links only accept actual transaction hashes', () => {
  assert.equal(core.txUrl('op_123'),null);
  assert.equal(core.txUrl('javascript:alert(1)'),null);
  assert.match(core.txUrl('0x'+'a'.repeat(64)), /^https:\/\/basescan.org\/tx\//);
  assert.equal(core.escape('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
test('malformed or blocked local storage does not break activity', () => {
  assert.deepEqual(core.read({getItem:()=>'{bad'},'key'),[]);
  assert.deepEqual(core.read({getItem:()=>'{"type":"x"}'},'key'),[]);
  assert.deepEqual(core.read({getItem:()=>{throw Error('blocked');}},'key'),[]);
});
test('withdrawal review is bound to exact amount asset portfolio chain and recipient', () => {
  const owner='0x'+'1'.repeat(40);
  const expected={owner,portfolioId:'p1',assetId:'eip155:8453/erc20:0x'+'2'.repeat(40),amountRaw:'1000000'};
  const data={domain:{chainId:8453},message:{portfolioId:'p1',recipientAccountId:`eip155:8453:${owner}`,assets:[{assetId:expected.assetId,amountRaw:'1000000'}]}};
  assert.equal(core.withdrawalMatches(data,expected),true);
  for(const field of ['amountRaw','assetId','portfolioId','owner']) assert.equal(core.withdrawalMatches(data,{...expected,[field]:'wrong'}),false);
  assert.equal(core.withdrawalMatches({...data,domain:{chainId:1}},expected),false);
  assert.equal(core.withdrawalMatches({...data,message:{...data.message,assets:[...data.message.assets,...data.message.assets]}},expected),false);
});
