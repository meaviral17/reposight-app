const selectQueryFromIssues = `SELECT * FROM reposight.issues WHERE repo_id = ? AND issue_id = ?`;

const updateQueryFromIssuesForStatus = `UPDATE reposight.issues SET status = ? WHERE repo_id = ? AND issue_id = ?`;

const insertQueryFromRatings = `INSERT INTO reposight.ratings (repo_id, user_id, community_rating, issue_classification_rating, rating) VALUES (?, ?, ?, ?, ?)`;

const updateQueryFromReposForRepoRating = `UPDATE reposight.repos SET sum_of_community_ratings = sum_of_community_ratings + ?, sum_of_issue_classification_ratings = sum_of_issue_classification_ratings + ?, total_community_ratings = total_community_ratings + 1, total_issue_classification_ratings = total_issue_classification_ratings + 1, avg_ratings = (sum_of_community_ratings + sum_of_issue_classification_ratings) / (total_community_ratings + total_issue_classification_ratings) WHERE repo_id = ?`;

const updateQueryFromRatingsForUserTextRating = `UPDATE reposight.ratings SET rating = ? WHERE repo_id = ? AND user_id = ?`;


module.exports = { selectQueryFromIssues, updateQueryFromIssuesForStatus, insertQueryFromRatings, updateQueryFromReposForRepoRating, updateQueryFromRatingsForUserTextRating };