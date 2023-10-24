const { setToHashMap, returnFromHashMap, deleteFromHashMap } = require("../dbhandlers/redishandler");
const { classifyIssue } = require("../dbhandlers/cassandrahandler");


const issueOpenHandler = async (context, client) => {
    if (await checkIfWritePermissions(context)) {
        const issueComment = context.issue({ body: "How will you classify this issue? \n ❤️ Beginner \n 👀 Intermediate \n 🚀 Advanced" });
        const createComment = await context.octokit.issues.createComment(issueComment);
        
        await setToHashMap(client, context.payload.issue.id.toString(), "issuecomment", "issueclassify");
    }
}

const issueCommentHandler = async (context, client, cclient) => {
    if (await checkIfWritePermissions(context)) {
        const data = await returnFromHashMap(client, context.payload.issue.id.toString());
        if (data != null) {
            const dataPartition = data.split(" ");
            if (dataPartition[1] == "issueclassify") {
                const commentData = context.payload.comment.body;
                if (commentData === "❤️") {

                    const { repoName, repoDescription, repoUrl, repoId, repoTags } = await getRepoInformation(context);
                    const { issueId, issueDifficulty, issueUrl, issueStatus, issueTitle } = await getIssueInformation(context, 'beginner');

                    await classifyIssue(cclient, repoId.toString(), repoDescription.toString(), repoName.toString(), repoUrl.toString(), repoTags, issueId.toString(), issueDifficulty, issueUrl.toString(), issueStatus, issueTitle.toString());
                    await createIssueClassifiedComment(context);
                    await deleteFromHashMap(client, context.payload.issue.id.toString());
                }
                else if (commentData === "👀") {

                    const { repoName, repoDescription, repoUrl, repoId, repoTags } = await getRepoInformation(context);
                    const { issueId, issueDifficulty, issueUrl, issueStatus, issueTitle } = await getIssueInformation(context, 'intermediate');

                    await classifyIssue(cclient, repoId.toString(), repoDescription.toString(), repoName.toString(), repoUrl.toString(), repoTags, issueId.toString(), issueDifficulty, issueUrl.toString(), issueStatus, issueTitle.toString());
                    await createIssueClassifiedComment(context);
                    await deleteFromHashMap(client, context.payload.issue.id.toString());
                }
                else if (commentData === "🚀") {

                    const { repoName, repoDescription, repoUrl, repoId, repoTags } = await getRepoInformation(context);
                    const { issueId, issueDifficulty, issueUrl, issueStatus, issueTitle } = await getIssueInformation(context, 'advanced');

                    await classifyIssue(cclient, repoId.toString(), repoDescription.toString(), repoName.toString(), repoUrl.toString(), repoTags, issueId.toString(), issueDifficulty, issueUrl.toString(), issueStatus, issueTitle.toString());
                    await createIssueClassifiedComment(context);
                    await deleteFromHashMap(client, context.payload.issue.id.toString());
                }

            }
        }
    }
}

const getRepoInformation = async (context) => {
    // Repository Information
    const repository = context.payload.repository;
    const repoName = repository.name;
    const repoDescription = repository.description;
    const repoUrl = repository.html_url;
    const repoId = repository.id;
    const repoOwner = repository.owner.login;
    const topics = await context.octokit.repos.getAllTopics({
        owner: repoOwner,
        repo: repoName,
    });
    const languages = await context.octokit.repos.listLanguages({
        owner: repoOwner,
        repo: repoName,
      });
      const repoLanguages = Object.keys(languages.data);
    let repoTags = [];
    if (topics && topics.data.names) {
        repoTags = topics.data.names.map((label) => label.name);
    }
    if(repoLanguages.length > 0){
        repoLanguages.forEach((lang) => repoTags.push(lang));
    }
    
    return {
        repoName, repoDescription, repoUrl, repoId, repoTags
    };
}

const getIssueInformation = async (context, diff) => {
    // Issue Information
    const issue = context.payload.issue;
    const issueId = issue.id;
    const issueDifficulty = diff;
    const issueUrl = issue.html_url;
    const issueStatus = 'open';
    const issueTitle = issue.title; // Get the issue title

    return { issueId, issueDifficulty, issueUrl, issueStatus, issueTitle};
}

const createIssueClassifiedComment = async(context) => {
    const classifiedComment = context.issue({ body: "The issue has been successfully classified." });
    await context.octokit.issues.createComment(classifiedComment);
}

const checkIfWritePermissions = async (context) => {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const issue = context.payload.issue;
    const username = issue.user.login;

    const response = await context.octokit.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
    });

    // Check the permission level
    const permissionLevel = response.data.permission;

    if (permissionLevel === 'write' || permissionLevel === 'admin') {
        context.log.info(`${username} (the issue opener) has write or admin permission.`);
        return true;
    } else {
        context.log.info(`${username} (the issue opener) does not have write or admin permission.`);
        return false;
    }
}

module.exports = { issueOpenHandler, issueCommentHandler };