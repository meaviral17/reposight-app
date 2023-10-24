const { selectQueryFromIssues, updateQueryFromIssuesForStatus, insertQueryFromRatings, updateQueryFromReposForRepoRating, updateQueryFromRatingsForUserTextRating, selectQueryFromReposForUpdatingRating } = require("../constants/constants");
const { setToHashMap, returnFromHashMap, deleteFromHashMap } = require("../dbhandlers/redishandler");
const pullRequestCloseHandler = async (cclient, context, client) => {
    if (context.payload.pull_request.merged) {
        // Extract the issue ID from the pull request title (you might need to adjust the regex)
        const pullRequestTitle = context.payload.pull_request.title;
        const pullRequestCreatorId = context.payload.pull_request.user.id;
        const pullRequestId = context.payload.pull_request.id;
        const repositoryId = context.payload.repository.id;
        const { issueId, issueNumber } = await findAssociatedIssueId(context);
        //console.log(pullRequestTitle, issueId, issueNumber, " Details");
        if (issueId) {
            const res = await cclient.execute(selectQueryFromIssues, [repositoryId.toString(), issueId.toString()], { prepare: true });
            if (res.rows.length > 0) {
                try {
                    await cclient.execute(updateQueryFromIssuesForStatus, ["closed", repositoryId.toString(), issueId.toString()], { prepare: true });

                    await setToHashMap(client, context.payload.pull_request.html_url.toString(), "rating", pullRequestCreatorId.toString());
                    const commentText = `Thank you for being a valuable part of Open Source. Please rate this. On Issue Classification from 1-5`;
                    await context.octokit.issues.createComment({
                        owner: context.payload.repository.owner.login,
                        repo: context.payload.repository.name,
                        issue_number: context.payload.pull_request.number,
                        body: commentText,
                    });


                } catch (e) {
                    console.error('Error updating issue status in Cassandra:', e);
                }

            }
        }
    }
}

const pullRequestCommentHandler = async (cclient, context, client) => {
    const pullRequestId = context.payload.issue.html_url; // Pull Request ID
    const creatorId = context.payload.sender.id; // Pull Request Creator ID
    const commentBody = context.payload.comment.body;
    const repositoryId = context.payload.repository.id;
    let numericValue = parseFloat(commentBody);

    const data = await returnFromHashMap(client, pullRequestId.toString());
    console.log(data, pullRequestId, creatorId, commentBody, repositoryId, " Details");
    if (data != null) {
        const dataPartition = data.split(" ");
        if (dataPartition[0] == "rating") {
            if (isNaN(numericValue) || numericValue > 5) {
                return;
            }
            if (dataPartition[1] != creatorId.toString()) {
                return;
            }
            await setToHashMap(client, pullRequestId.toString(), `ratingCommunity ${numericValue}`, creatorId.toString());
            const commentText = `Thank you for being a valuable part of Open Source. Please rate this. On Community from 1-5`;
            await context.octokit.issues.createComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                issue_number: context.payload.issue.number,
                body: commentText,
            });
        }
        else if (dataPartition[0] == "ratingCommunity") {
            if (isNaN(numericValue) || numericValue > 5) {
                return;
            }
            if (dataPartition[2] != creatorId.toString()) {
                return;
            }
            await setToHashMap(client, pullRequestId.toString(), `ratingText ${dataPartition[1]} ${numericValue}`, creatorId.toString());
            const commentText = `Thank you for being a valuable part of Open Source. Your rating has been market. Write any textual review.`;
            await context.octokit.issues.createComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                issue_number: context.payload.issue.number,
                body: commentText,
            });
            await cclient.execute(insertQueryFromRatings, [repositoryId.toString(), creatorId.toString(), parseFloat(dataPartition[1]), numericValue, ""], { prepare: true });
            const selectRes = await cclient.execute(selectQueryFromReposForUpdatingRating, [repositoryId.toString()], { prepare: true });
            const row = selectRes.first();
            console.log(row);
            // Calculate the new values
            const newSumCommunityRatings = row.sum_of_community_ratings + parseFloat(dataPartition[2]);
            const newSumIssueClassificationRatings = row.sum_of_issue_classification_ratings + parseFloat(dataPartition[1]);
            const newTotalCommunityRatings = row.total_community_ratings + 1;
            const newTotalIssueClassificationRatings = row.total_issue_classification_ratings + 1;

            const newAvgRatings = (newSumCommunityRatings + newSumIssueClassificationRatings) / (newTotalCommunityRatings + newTotalIssueClassificationRatings);
            const resStuff = await cclient.execute(updateQueryFromReposForRepoRating, [newSumCommunityRatings, newSumIssueClassificationRatings, newTotalCommunityRatings, newTotalIssueClassificationRatings, newAvgRatings, repositoryId.toString()], { prepare: true });
            console.log(resStuff);
        }
        else if (dataPartition[0] == "ratingText") {
            if (dataPartition[3] != creatorId.toString()) {
                return;
            }
            await cclient.execute(updateQueryFromRatingsForUserTextRating, [commentBody.toString(), repositoryId.toString(), creatorId.toString()], { prepare: true });
            await deleteFromHashMap(client, pullRequestId);
            const commentText = `Thank you. Hope you have a good day.`;
            await context.octokit.issues.createComment({
                owner: context.payload.repository.owner.login,
                repo: context.payload.repository.name,
                issue_number: context.payload.issue.number,
                body: commentText,
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


module.exports = { pullRequestCloseHandler, pullRequestCommentHandler };