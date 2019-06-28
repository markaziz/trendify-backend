const Koa = require('koa');
const axios = require('axios');
const Router = require('koa-router');
const querystring = require('querystring');
require('dotenv').config()

const cors = require('koa-cors');

const app = new Koa();
app.use(cors());


const router = new Router();

const CLIENT_ID = '95296ff8417549b5b259972a5c39abda';
const CLIENT_PASS = 'b2898d0cc6c4480dabc614143101d346';

router.get('/', async ctx => {
  ctx.redirect('/login');
});

router.get('/login', async (ctx) => {
  ctx.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      show_dialog: true,
      client_id: CLIENT_ID,
      scope: 'user-library-read',
      redirect_uri: `${process.env.BACKEND_URL}/callback`
    }))
});

router.get('/getToken', async (ctx) => {
  await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    params: {
      grant_type: 'client_credentials'
    },
    headers: {
      Authorization: 'Basic ' + (new Buffer(
        CLIENT_ID + ':' + CLIENT_PASS
      ).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => {
    ctx.body = res.data;
  }).catch(err => {
    throw(err.message)
  });
})

router.get('/callback', async (ctx) => {
  await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: ctx.query.code,
      redirect_uri: `${process.env.BACKEND_URL}/callback`,
    }),
    headers: {
      Authorization: 'Basic ' + (new Buffer(
        CLIENT_ID + ':' + CLIENT_PASS
      ).toString('base64')),
    },
  }).then((res) => {
    const uri = `${process.env.FRONTEND_URL}`
    ctx.state.accessToken = res.data.access_token;
    ctx.redirect(uri + '/token/?access_token=' + res.data.access_token)
  }).catch(err => {
    throw(err.message)
  });
});

router.get('/getRecommendations', async (ctx) => {
  const { access_token, genres } = ctx.query;
  const limit = '100'
  const recommendationsRes = await axios({
    url: `https://api.spotify.com/v1/recommendations?limit=${limit}&seed_genres=${genres}&min_popularity=0&max_popularity=100`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  });
  ctx.body = recommendationsRes.data.tracks
});

router.get('/toptracks', async (ctx) => {
  const { access_token } = ctx.query;
  const limit = ctx.query.limit || '10'
  await axios({
    url: `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=short_term`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  }).then((res) => {
    ctx.body = res.data.items;
  })
  .catch((err) => {
    ctx.throw(err.response.status, err.message);
  });
})

router.get('/mySongs', async (ctx) => {
  const { access_token } = ctx.query;
  const limit = ctx.query.limit || '10'
  let offset;
  let total;
  await axios({
    url: `https://api.spotify.com/v1/me/tracks`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  }).then((res) => {
    total = res.data.total
    const min = Math.ceil(0);
    const max = Math.floor(total);
    const randNum = Math.floor(Math.random() * (max - min + 1)) + min;

    offset = (randNum + total) % total;
  })
  .catch((err) => {
    ctx.throw(err.response.status, err.message);
  });



  await axios({
    url: `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
  }).then((res) => {
    ctx.body = res.data.items.map(t => t.track);;
  })
  .catch((err) => {
    ctx.throw(err.response.status, err.message);
  });
})

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

      ctx.body = tracks
  })
});


app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(4040);
console.log("Listening on port 4040");