module.exports = {
    apps : [{
        name: 'Workstation Dashboard',
        script: 'server.js',
      watch: '.',
                env: {
              "MONGO_DB": "jobshout_live"
          },
          env_production: {
             "MONGO_DB": "jobshout_live"
          }
  
    }],
  
    deploy : {
      production : {
        user : 'SSH_USERNAME',
        host : 'SSH_HOSTMACHINE',
        ref  : 'origin/master',
        repo : 'GIT_REPOSITORY',
        path : 'DESTINATION_PATH',
        'pre-deploy-local': '',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
        'pre-setup': ''
      }
    }
  };
  