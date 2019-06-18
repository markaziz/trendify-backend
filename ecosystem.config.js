module.exports = {
  apps: [{
    name: 'spotify-backend',
    script: './index.js',
    watch: true,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
    
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-13-239-6-208.ap-southeast-2.compute.amazonaws.com',
      key: '~/.ssh/spotify-app-node.pem',
      ref: 'origin/master',
      repo: 'git@github.com:m-aziz/spotify-backend.git',
      path: '/home/ubuntu/spotify-backend',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}