/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const {issueOpenHandler, issueCommentHandler} = require('./webhook_handlers/issueOpenHandler');
const redis = require('redis');
const cassandra = require('cassandra-driver');
module.exports = async(app) => {
  const client = redis.createClient({
    url: 'redis://127.0.0.1:9000'         
  });

  
  const cclient = new cassandra.Client({
    contactPoints: ['localhost'], 
    localDataCenter: 'datacenter1', 
  });

  await client.connect();
  app.log.info("Yay, the app was loaded!");
  app.on("issues.opened", async (context) => {
    await issueOpenHandler(context, client);
  });
  app.on('issue_comment.created', async (context) => {
    await issueCommentHandler(context, client, cclient);
  });
};
