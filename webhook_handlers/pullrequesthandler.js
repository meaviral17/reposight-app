const { selectQueryFromIssues, updateQueryFromIssuesForStatus } = require("../constants/constants");
const { setToHashMap, returnFromHashMap, deleteFromHashMap } = require("../dbhandlers/redishandler");
const pullRequestCloseHandler = async (cclient, context, client) => {
    if (context.payload.pull_request.merged) {
        // Extract the issue ID from the pull request title (you might need to adjust the regex)
        const pullRequestTitle = context.payload.pull_request.title;
        const pullRequestCreatorId = context.payload.pull_request.user.id;
        const pullRequestId = context.payload.pull_request.id;
        const repositoryId = context.payload.repository.id;
        const { issueId, issueNumber } = await findAssociatedIssueId(context);
        console.log(pullRequestTitle);
        if (issueId) {
            cclient.execute(selectQueryFromIssues, [repositoryId, issueId], { prepare: true }, (selectError, selectResult) => {
                if (selectResult.rows.length > 0) {
                    cclient.execute(updateQueryFromIssuesForStatus, ["closed", repositoryId, issueId], { prepare: true }, async (updateError) => {
                        if (!updateError) {
                            await setToHashMap(client, pullRequestId, "rating", pullRequestCreatorId);
                            const commentText = `Thank you for being a valuable part of Open Source. Please rate this. On Issue Classification from 1-5`;
                            await context.octokit.issues.createComment({
                                owner: context.payload.repository.owner.login,
                                repo: context.payload.repository.name,
                                issue_number: context.payload.pull_request.number,
                                body: commentText,
                            });
                        } else {
                            console.error('Error updating issue status in Cassandra:', updateError);
                        }
                    });
                }
            });
        }
    }
}


async function findAssociatedIssueId(context) {
    const pullRequestBody = context.payload.pull_request.body;
    const issueReferenceMatch = pullRequestBody.match(/(?:\s|^)(?:Fixes|Closes|Resolves) #(\d+)(?=\s|$)/);

    if (issueReferenceMatch) {
        const issue = await context.octokit.issues.get({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            issue_number: issueReferenceMatch[1],
        });
        const issueId = issue.data.id;
        return { issueNumber: issueReferenceMatch[1], issueId };
    }
    return null;
}


module.exports = { pullRequestCloseHandler };