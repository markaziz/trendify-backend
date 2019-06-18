module.exports = {
  apps: [{
    name: 'spotify-backend',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-13-239-6-208.ap-southeast-2.compute.amazonaws.com',
      key: '~/.ssh/spotify-app-node.pem',
      ref: 'origin/master',
      repo: 'git@github.com:m-aziz/spotify-backend.git',
      path: '/var/www/spotify-app/spotify-backend',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}