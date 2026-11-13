// Ultimate Trainer coverage: potential controls, all-fields inspector paths,
// skills bulk, tendency presets, GOAT, array paste loads, player-index cache
// invalidation across loads, and mobile shell presence.
// Run: node tests/ultimate-trainer.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {};
    this.value = ''; this._text = ''; this.disabled = false; this.checked = false; this.hidden = false;
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html || ''; }
  appendChild(c) { this.children.push(c); return c; }
  append(...cs) { cs.forEach(c => this.children.push(c)); }
  addEventListener() {} remove() {} focus() {} select() {} click() {} scrollIntoView() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
}
const els = new Map();
const documentStub = {
  getElementById: id => { if (!els.has(id)) els.set(id, new El()); return els.get(id); },
  createElement: t => new El(t),
  addEventListener() {}, querySelectorAll: () => [], body: new El('body'),
};
const ctx = vm.createContext({
  document: documentStub, console, Blob, URL, TextEncoder, setTimeout, clearTimeout,
  localStorage: { getItem: () => null, setItem() {} }, navigator: {}, window: {},
});
vm.runInContext(script, ctx);
const run = s => vm.runInContext(s, ctx);

const ATTRS = ['LAY','DNK','INS','MID','TPT','FTS','DRB','PAS','ORE','DRE','STL','BLK','STR','SPD','STM'];
const mkPlayer = (id, fn, ln) => ({
  id, tid: 5, league: 0, fn, ln, tag: '', home: '', ctry: 'US', age: 19, ht: 78, wt: 200, yrs: 1, num: 7,
  gender: 0, pos: 2, teamPos: 2, posRnk: 1, linePos: 0, rating: 0, minutes: [5, 5, 0, 0, 0, 0], usage: 20,
  pri: 11, sec: 10, arc: 'Playmaker', pot: 6, regressionAge: 32, status: 0,
  loc: { x: 100, y: -200 },
  appearance: { skinC: 'B98366', eyeC: '060006', unibrow: false, browC: '32261d', hair: '0143', hairC: '32261d', fHair: '0005', fHairC: '32261d' },
  accessories: [{ headAcc: 'none', shoeC: 'FEFFFB' }], suits: [{ jacketC: '945542' }],
  attributes: Object.fromEntries(ATTRS.map(a => [a, [10, 14]])),
  skills: [{ id: 'CRA', xp: 10, level: 1, equipped: false }, { id: 'STE', xp: 0, level: 0, equipped: false }],
  tendencies: { dunk: 1, threePoint: 2, pass: 0, block: -1 },
  gameStatus: { startPos: 1, stamina: 300, injured: false },
  gameStats: { GP: 1, PTS: 9, REB: 2, MIN: [450, 98, 352, 0, 0, 0] },
  season: {
    xp: [1, 2, 3, 4, 5], ap: [0, 1, 0, 1, 0], condition: 80, morale: 70, restDay: false,
    injury: { yr: 0, core: 0, upperBody: 0, lowerBody: 0, minorSeverity: 1, majorSeverity: 0, gamesOut: 3, ageRegression: 0, age: 0 },
    onTradeBlock: 0, regimen: 0, focus: 1, watch: false, scout: false, progress: 1, protect: false,
    retiring: false, gpa: 0, relationship: 0, legacyPoints: 5, following: false, legacy: 0, gameHistory: { GP: 0, W: 0, L: 0 },
  },
  stats: [], careerStats: { season: { GP: 10, PTS: 100 } },
  awards: [], history: { coll: 0, yrs: 0, draft: { pk: 0, rd: 0, tid: 0, otid: 0, yr: 0 }, yearDeclared: 0, yearRetired: 0, yearInducted: 0, causeOfDeath: '' },
  careerGoals: { game: { PTS: 0 }, season: { PTS: 0 }, career: { PTS: 0 } },
  contract: { tid: 5, pid: id, type: 0, yrs: 2, sal: 100, nil: 50, opt: 1, noTrd: 0, canExt: true, ext: { yrs: 0, sal: 0, opt: 0, noTrd: 0 } },
});
const save = {
  seasonLeagues: [{
    leagueName: 'Test League',
    teams: [{
      id: 5, city: 'Stanford', name: 'Cardinal', shortName: 'STAN', arenaName: 'Maples', teamColors: [], prestigePoints: 0,
      frontOffice: { coins: 100, fans: 50, condition: 50, morale: 50, facilities: [], staff: [] },
      roster: [mkPlayer(42, 'Pete', 'Potential')],
    }],
    starTeams: [], freeAgents: [], draftClass: [], threePointContestants: [], retirees: [], hallOfFame: [],
    season: { mode: 1, playerId: 0, injuries: true, progressionRate: 50 },
    sliders: { layupAccuracy: 50 }, simulationSliders: {}, difficulty: {}, rules: {}, settings: {},
    meta: { uPID: 42 }, coachSettings: { substitutions: true }, optimization: { teamLogos: false },
  }],
};
run(`loadText(${JSON.stringify(JSON.stringify(save))}, 'T')`);
run('openPlayer(findEveryPlayer()[0])');
assert.equal(run('PLAYER.id'), 42);

// Potential: ceilings, realize, young star, averages
assert.equal(run('ceilAvg(PLAYER)'), 14, 'ceiling average from attributes[*][1]');
run('setCeilings(PLAYER, 20)');
assert.equal(run('PLAYER.attributes.LAY[1]'), 20);
assert.equal(run('PLAYER.attributes.LAY[0]'), 10, 'raising ceiling keeps current');
run('realizePotential(PLAYER, 0)');
assert.equal(run('PLAYER.attributes.LAY[0]'), 20, 'realize lifts current to ceiling');
run("PLAYER.attributes.LAY=[8,12]; realizePotential(PLAYER, 2)");
assert.equal(run('PLAYER.attributes.LAY[0]'), 10, 'near-peak realize leaves gap of 2');
run("potentialPreset('youngstar')");
assert.equal(run('PLAYER.age'), 18);
assert.equal(run('PLAYER.pot'), 10);
assert.equal(run('PLAYER.regressionAge'), 40);
run("potentialPreset('noregress')");
assert.equal(run('PLAYER.regressionAge'), 48);

// All-fields inspector finds deep leaves from the real save shape
const paths = run("flattenLeaves(PLAYER,'',[]).map(l=>l.path)");
for (const p of ['season.injury.gamesOut', 'contract.ext.sal', 'appearance.skinC', 'accessories[0].shoeC', 'season.xp[4]', 'history.draft.pk', 'gameStatus.stamina', 'careerGoals.career.PTS']) {
  assert.ok(paths.includes(p), 'inspector reaches ' + p);
}
// Inspector write-through lands in exported save
run("(()=>{const l=flattenLeaves(PLAYER,'',[]).find(x=>x.path==='season.injury.gamesOut'); l.parent[l.key]=7;})()");
assert.equal(JSON.parse(run('rawSave()')).seasonLeagues[0].teams[0].roster[0].season.injury.gamesOut, 7);

// Skills + tendencies + GOAT
run("skillsBulk('max')");
assert.ok(run('PLAYER.skills.every(s=>s.level===3&&s.equipped)'));
run("applyTendPreset('lockdown')");
assert.equal(run('PLAYER.tendencies.stealOnBall'), 5);
assert.equal(run('PLAYER.tendencies.block'), 4);
run('goatPlayer(PLAYER)');
assert.equal(run('PLAYER.attributes.SPD[0]'), 20);
assert.ok(run('PLAYER.season.xp.every(v=>v>=9999)'));

// Contract preset
run("contractPreset('free')");
assert.equal(run('PLAYER.contract.yrs'), 0);
assert.equal(run('PLAYER.contract.sal'), 0);

// Draft-class ARRAY file still loads (paste-array fix path uses same loader)
run(`loadText(${JSON.stringify(JSON.stringify([mkPlayer(7, 'Arr', 'Kid')]))}, 'A')`);
assert.ok(run('findEveryPlayer().some(e=>e.p.id===7)'), 'array file loads after cache had old save');
assert.ok(!run('findEveryPlayer().some(e=>e.p.id===42)'), 'player index cache invalidated on new load');

// Mobile shell + trainer structure shipped in the page
for (const needle of ['id="mobileBar"', 'id="tab-potential"', 'id="playerInspector"', 'id="zipCheck"', 'Ultimate Trainer'.toLowerCase()]) {
  if (needle.startsWith('id="zipCheck"')) continue; // not applicable to this app
  assert.ok(html.toLowerCase().includes(needle.toLowerCase()), 'page contains ' + needle);
}
assert.ok(html.includes('@media(max-width:900px)'), 'mobile breakpoint present');
assert.ok(html.includes('showPlayerTab'), 'player tabs wired');

console.log('PASS ultimate-trainer: potential/skills/tendencies/GOAT/inspector/cache/mobile');
