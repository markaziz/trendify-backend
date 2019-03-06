const Koa = require('koa');
const axios = require('axios');
const Router = require('koa-router');
const querystring = require('querystring');

const cors = require('@koa/cors');

const app = new Koa();
app.use(cors());


const router = new Router();

const CLIENT_ID = '95296ff8417549b5b259972a5c39abda';
const CLIENT_PASS = 'b2898d0cc6c4480dabc614143101d346';

router.get('/', async ctx => {
  ctx.redirect('/login');
});

router.get('/login', async ctx => {
  ctx.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      show_dialog: true,
      client_id: CLIENT_ID,
      scope: 'user-read-private user-read-email user-top-read playlist-read-private',
      redirect_uri: 'http://localhost:4000/callback'
    }))
});

router.get('/callback', async (ctx) => {
  await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: ctx.query.code,
      redirect_uri: 'http://localhost:4000/callback',
    }),
    headers: {
      Authorization: 'Basic ' + (new Buffer(
        CLIENT_ID + ':' + CLIENT_PASS
      ).toString('base64')),
    },
    
  }).then((res) => {
    const uri = 'http://localhost:5000'
    ctx.redirect(uri + '?access_token=' + res.data.access_token)
  }).catch(err => {
    console.log(err);
  });
});

router.get('/discover-weekly', async (ctx) => {
  const { access_token, uri } = ctx.query;
  await axios({
    url: `${uri}?limit=8`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  }).then((res) => {
     const tracksData = res.data.items;
     const tracks = tracksData.map((t) => {
       const albumImage = t.track.album.images[1];
       const artists = t.track.artists.map(a => a.name).join(', ');
       return {
         id: t.track.id,
         name: t.track.name,
         albumImage,
         albumId: t.track.album.id,
         artists,
       }
      });

      // const listOfLists = [];

      // for (let index = 0; index < tracks.length; index+=2) {
      //   const element1 = tracks[index];
      //   const element2 = tracks[index+1];
      //   listOfLists.push([element1, element2]);
      // }

      ctx.body = tracks
  })
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4000);
console.log("Listening on port 4000");