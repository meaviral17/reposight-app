const classifyIssue = async (cclient, repoId, repoDesc, repoName, repoUrl, tags, issueId, difficulty, issueUrl, issueStatus, issueTitle) => {
    const selectQuery = 'SELECT * FROM reposight.repos WHERE repo_id = ?';
    const result = await cclient.execute(selectQuery, [repoId]);
    if (result.rows.length > 0) {
        const existingRepo = result.rows[0];
        
    } else {
        const insertQuery = 'INSERT INTO reposight.repos (repo_id, avg_ratings, repo_desc, repo_name, repo_url, sum_of_community_ratings, sum_of_issue_classification_ratings, total_community_ratings, total_issue_classification_ratings, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [
            repoId, 5.0, repoDesc, repoName, repoUrl, 0, 0, 0, 0, tags
        ];

        await cclient.execute(insertQuery, params, { prepare: true });
    }
    const insertQueryToIssues = `
      INSERT INTO reposight.issues (
        repo_id, issue_id, issue_title, difficulty, issue_url, status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        repoId, issueId, issueTitle, difficulty, issueUrl, issueStatus
    ];
    await cclient.execute(insertQueryToIssues, params, { prepare: true });
}

module.exports = { classifyIssue };