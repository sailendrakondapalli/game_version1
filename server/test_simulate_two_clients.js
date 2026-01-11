const io = require('socket.io-client');

const SERVER = 'http://localhost:3001';

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

async function run() {
  console.log('Starting test clients...');

  const a = io(SERVER, { transports: ['websocket'] });
  const b = io(SERVER, { transports: ['websocket'] });

  a.on('connect', () => console.log('A connected', a.id));
  b.on('connect', () => console.log('B connected', b.id));
  a.on('connect_error', (err) => console.log('A connect_error', err && err.message));
  b.on('connect_error', (err) => console.log('B connect_error', err && err.message));
  a.on('disconnect', (reason) => console.log('A disconnected', reason));
  b.on('disconnect', (reason) => console.log('B disconnected', reason));

  a.on('matchCreated', (data) => {
    console.log('A matchCreated', data.match.code, data.match.players.length);
  });

  a.on('matchUpdate', (m) => {
    console.log('A matchUpdate:', m.code, 'players=', m.players.length, 'status=', m.status);
  });

  b.on('matchUpdate', (m) => {
    console.log('B matchUpdate:', m.code, 'players=', m.players.length, 'status=', m.status);
  });

  a.on('matchStart', (d) => console.log('A matchStart', d));
  b.on('matchStart', (d) => console.log('B matchStart', d));

  // create private match by A (listener already set above)
  await wait(200);
  let createdCode = null;
  a.once('matchCreated', (data) => { createdCode = data.code || data.match.code; console.log('createdCode captured', createdCode); });
  a.emit('createMatch', { playerData: { playerId: 'A', username: 'Alice' }, maxPlayers: 2 });

  // wait a bit then B joins using the captured code
  await wait(800);
  if (!createdCode) {
    console.log('Could not capture created code, exiting');
    process.exit(1);
  }
  b.emit('joinMatch', { matchCode: createdCode, playerData: { playerId: 'B', username: 'Bob' } });

  // wait to observe matchUpdate and matchStart
  await wait(3000);
  a.disconnect(); b.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
