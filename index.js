/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const { issueOpenHandler, issueCommentHandler } = require('./webhook_handlers/issueOpenHandler');
const { pullRequestCloseHandler, pullRequestCommentHandler } = require("./webhook_handlers/pullrequesthandler");
const redis = require('redis');
const cassandra = require('cassandra-driver');
module.exports = async (app) => {
  const client = redis.createClient({
    url: 'redis://127.0.0.1:6379'
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
    const issueComment = context.payload;
    
    const pullRequestPattern = /https:\/\/github\.com\/.*\/pull\/\d+/;
    if (pullRequestPattern.test(context.payload.comment.html_url)) {
      
      await pullRequestCommentHandler(cclient, context, client);
    } else {
      
      await issueCommentHandler(context, client, cclient);
    }
  });
  app.on('pull_request.closed', async (context) => {
    await pullRequestCloseHandler(cclient, context, client);
  });
};
