# workstation
The process is for developers and designers to get involved is:


Always pull the main branch locally to start every time you are starting a new project so you have all others commits cloned.
Cut a new branch out of main branch say: invoices-improvements-branch
Clone your new branch
Work on that branch and test it locally
Once all working raise Pull Request (PR) to merge into main branch and I will check and resolve conflicts and merge it

If you need mongo dump with sample data let me know for your industry sector, below jobshout_dev mongo dump is relevant for running blog and job board.
I will create a simple technote of this process asap but for now just whatsapp me when you are working and when you want to start working and then stop and merge.

We are looking for node.js, iOS, Android and native OS application developers. Please email your interests to us at balinder.walia <AT> gmail DOT com

Quick Installation steps

Clone above repo to /YourlocalpathTo-github-project folder

cd /YourlocalpathTo-github-project/workstation-dashboard/

### Mongo

Workstation requires mongo db for storing documents and other business information as mongo collections. There is a demo mongodumps dir in mongo in the repo which has some sample data.

Create two mongo databases jobshout_dev and jobshout_dev_history

In config/init.js file mongo db database names are already preset. You can override these config using env variables as shown below

### Node.js

export MONGO_DB="jobshout_live"
export MONGO_URL="mongodb://mongo-prod.tenthmatrix.co.uk:27017/jobshout_dev_dev"
export WORKSTATION_DASHBOARD_DIR="dashboard-dev"

#node server.js
for dev if using nodemon type solution run
nodemon ./server.js

Now goto views directory and look for dashboard-dev folder and start with index.ejs and list/ folder and other node.js files to see how the Workstation Control Panel Dasboard works!

### Every commit to main branch automatically updates code to linux instance running live system at https://my.workstation.co.uk/dashboard/index via our CICD system.


