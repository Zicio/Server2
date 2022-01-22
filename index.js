const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const router = new Router();
const WS = require('ws');

const app = new Koa();

// app.use(async(ctx, next) => {
//   const origin = ctx.request.get('Origin');
//   if (!origin) {
//     return await next();
//   }

//   const headers = { 'Access-Control-Allow-Origin': '*', };

//   if (ctx.request.method !== 'OPTIONS') {
//     ctx.response.set({ ...headers });
//     try {
//       return await next();
//     } catch (e) {
//       e.headers = { ...e.headers, ...headers };
//       throw e;
//     }
//   }

//   if (ctx.request.get('Access-Control-Request-Method')) {
//     ctx.response.set({
//       ...headers,
//       'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
//     });

//     if (ctx.request.get('Access-Control-Request-Headers')) {
//       ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
//     }

//     ctx.response.status = 204;
//   }
// });

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

const format = date => {
  if (date < 10) {
    date = '0' + date;
  }
  return date;
};

const getDate = () => {
  const date = new Date();
  const month = format(date.getMonth() + 1);
  const day = format(date.getDate());
  let hour = format(date.getHours() + 4);
  if (hour === 24) {
    hour = 0;
  }
  const minute = format(date.getMinutes());
  const year = +date.getFullYear().toString().slice(2);
  return {
    month,
    day,
    hour,
    minute,
    year
  };
};

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

wsServer.on('connection', (ws, req) => {
  // TODO доделать обработчик приема сообщений
  // ws.on('message', msg => {
  //   [...wsServer.clients]
  //     .filter(o => o.readyState === WS.OPEN)
  //     .forEach(o => o.send(msg));
  // });
  [...wsServer.clients]
    .filter(o => o.readyState === WS.OPEN)
    .forEach(o => o.send(users));
});

server.listen(port);
