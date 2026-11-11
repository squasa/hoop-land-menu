// Regression test: editor must find + edit ANY player, not just team rosters.
// Covers HS showcase (starTeams), draftClass, freeAgents, MyPlayer (season.playerId),
// and standalone player / single-league files. Run: node tests/any-player.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.style = {}; this.dataset = {};
    this.value = ''; this._text = ''; this.disabled = false; this.checked = false;
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
const mkPlayer = (id, fn, ln, age) => ({
  id, tid: 0, league: 0, fn, ln, age, ht: 74, wt: 180, num: 1, pot: 8, regressionAge: 35, arc: 'Playmaker',
  attributes: Object.fromEntries(ATTRS.map(a => [a, [10, 15]])),
  skills: [{ level: 1, equipped: false }], tendencies: { shoot: 1 },
  season: { condition: 90, morale: 80, gpa: 0, xp: [1], ap: [2] },
  contract: { yrs: 0, sal: 0, nil: 0 }, gameStatus: {},
});
const showcaseKid = mkPlayer(9001, 'Case', 'Showcase', 16);   // MY PLAYER — HS showcase
const draftKid = mkPlayer(9002, 'Dre', 'Draftclass', 17);
const save = {
  seasonLeagues: [{
    leagueName: 'College', leagueType: 1,
    teams: [{
      id: 5, city: 'Stanford', name: 'Cardinal', shortName: 'STAN', arenaName: 'Maples',
      teamColors: [], prestigePoints: 0,
      frontOffice: { coins: 100, fans: 50, condition: 50, morale: 50, facilities: [], staff: [] },
      roster: [mkPlayer(1, 'Reg', 'Roster', 20)],
    }],
    starTeams: [{
      id: 1, city: 'USA', name: 'Supernovas', shortName: 'USA', arenaName: 'Showcase',
      teamColors: [], prestigePoints: 0,
      frontOffice: { coins: 0, fans: 0, condition: 0, morale: 0, facilities: [], staff: [] },
      roster: [showcaseKid],
    }],
    freeAgents: [mkPlayer(2, 'Fred', 'Agent', 25)],
    draftClass: [draftKid],
    threePointContestants: [], retirees: [], hallOfFame: [],
    coaches: [{ id: 3, fn: 'Coach', ln: 'Man', age: 50, attributes: { development: [10, 10] } }],
    currentGame: { homeTeam: { roster: [mkPlayer(4, 'Ghost', 'Copy', 22)] }, roadTeam: { roster: [] } },
    season: { mode: 2, teamId: 0, playerId: 9001 },
    sliders: { layupAccuracy: 50 }, simulationSliders: {}, difficulty: {}, rules: {}, settings: {},
    meta: { uPID: 9002 },
  }],
};

run(`loadText(${JSON.stringify(JSON.stringify(save))}, 'TEST')`);
assert.equal(run('typeof findEveryPlayer'), 'function', 'findEveryPlayer exists');
const all = run('findEveryPlayer()');
const byName = n => all.find(e => (e.p.fn + ' ' + e.p.ln) === n);

assert.ok(byName('Reg Roster'), 'team roster player found');
assert.ok(byName('Case Showcase'), 'HS showcase (star team) player found');
assert.ok(byName('Dre Draftclass'), 'draft class player found');
assert.ok(byName('Fred Agent'), 'free agent found');
assert.ok(!byName('Ghost Copy'), 'currentGame copy excluded');
assert.ok(!byName('Coach Man'), 'coach-attrs object excluded');
assert.match(byName('Case Showcase').poolLabel, /showcase|star/i, 'showcase pool labeled');
assert.ok(byName('Case Showcase').arr.indexOf(byName('Case Showcase').p) >= 0, 'entry owns source array');

const mine = run('myPlayers()');
assert.equal(mine.length, 1, 'exactly one MyPlayer');
assert.equal(mine[0].p.id, 9001, 'MyPlayer resolved via season.playerId to the showcase kid');

run('openPlayer(myPlayers()[0])');
assert.equal(run('PLAYER && PLAYER.id'), 9001, 'player editor opened on showcase kid');
run('maxPlayer(PLAYER)');
const out = JSON.parse(run('rawSave()'));
assert.deepEqual(out.seasonLeagues[0].starTeams[0].roster[0].attributes.LAY, [20, 20],
  'edits land on the real showcase object in the exported save');

const teamOpts = documentStub.getElementById('teamSel').children.map(o => o.textContent);
assert.ok(teamOpts.some(t => /Supernovas/.test(t)), 'showcase/star team selectable in team picker: ' + teamOpts);

// Standalone single-player file (no seasonLeagues at all)
run(`loadText(${JSON.stringify(JSON.stringify(mkPlayer(77, 'Solo', 'Player', 15)))}, 'P')`);
assert.ok(run('findEveryPlayer().some(e=>e.p.id===77)'), 'standalone player file loads + found');
const soloOut = JSON.parse(run('rawSave()'));
assert.equal(soloOut.fn, 'Solo', 'standalone export keeps original player shape');
assert.ok(!soloOut.seasonLeagues, 'no wrapper leaked into export');

// Single-league file
run(`loadText(${JSON.stringify(JSON.stringify(save.seasonLeagues[0]))}, 'L')`);
assert.ok(run('findEveryPlayer().some(e=>e.p.id===9001)'), 'single-league file finds showcase kid');
assert.equal(JSON.parse(run('rawSave()')).leagueName, 'College', 'single-league export keeps league shape');

console.log('PASS any-player: showcase/draft/FA/MyPlayer/standalone all findable + editable');
