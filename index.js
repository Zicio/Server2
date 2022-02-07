const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const router = new Router();
const WS = require('ws');

const app = new Koa();

const options = {
  origin: '*'
};
app.use(cors(options));

app.use(koaBody({
  urlencoded: true,
  multipart: true,
  json: true
}));

/* data */
const sockets = [];

const users = [
  // { id: '1', name: 'AAA' },
  // { id: '2', name: 'BBB' }
];

const messages = [
  // { name: 'AAA 19:20, 20.12.21', text: 'Hello!!!' },
  // { name: 'BBB 19:21, 20.12.21', text: 'Hi' }
];

router.get('/users/:name', async ctx => {
  const index = users.findIndex(({ name }) => name === ctx.params.name);
  if (index === -1) {
    const { v4: uuidv4 } = require('uuid');
    const newId = uuidv4();
    users.push({ id: newId, name: ctx.params.name });
    ctx.response.status = 200;
    ctx.response.body = users;
    return;
  }
  ctx.response.status = 400;
  ctx.response.body = `Имя пользователя "${ctx.params.name}" уже занято!`;
});

app.use(router.routes()).use(router.allowedMethods());
const port = process.env.PORT || 7000;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

function requestHandler(msg, ws) {
  const response = {
    users,
    messages
  };
  if (!JSON.parse(msg)) {
    console.log(sockets.length);
    ws.send(JSON.stringify(response));
    for (const socket of sockets) {
      socket.send(JSON.stringify([users[users.length - 1]]));
    }
    sockets.push(ws);
    console.log(sockets.length);
  } else {
    messages.push(JSON.parse(msg));
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify([messages[messages.length - 1]])));
  }
}

wsServer.on('connection', ws => {
  ws.on('message', msg => requestHandler(msg, ws));
  console.log('OPEN');
  ws.on('close', () => {
    const index = sockets.indexOf(ws);
    console.log(index);
    sockets.splice(index, 1);
    const userOffline = users[index];
    users.splice(index, 1);
    console.log(userOffline);
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify(userOffline)));
  });
});

server.listen(port);
