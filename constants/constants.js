const selectQueryFromIssues = `
    SELECT status FROM issues WHERE repo_id = ? AND issue_id = ?
  `;

const updateQueryFromIssuesForStatus = `
  UPDATE issues SET status = ? WHERE repo_id = ? AND issue_id = ?
`;

module.exports = { selectQueryFromIssues, updateQueryFromIssuesForStatus };