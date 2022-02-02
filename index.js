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
const users = [
  { id: '1', name: 'AAA' },
  { id: '2', name: 'BBB' }
];

const messages = [
  { name: 'AAA', text: 'Hello!!! 19:20, 20.12.21' },
  { name: 'BBB', text: 'Hi 19:21, 20.12.21' }
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

function requestHandler(msg) {
  const response = {
    users,
    messages
  };
  if (!JSON.parse(msg)) {
    console.log('ok');
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify(response)));
  } else {
    messages.push(JSON.parse(msg));
    [...wsServer.clients]
      .filter(o => o.readyState === WS.OPEN)
      .forEach(o => o.send(JSON.stringify([messages[messages.length - 1]])));
  }
}

wsServer.on('connection', (ws, req) => {
  ws.on('message', msg => requestHandler(msg));
  console.log('OPEN');
});

server.listen(port);
