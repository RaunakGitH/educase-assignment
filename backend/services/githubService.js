const axios = require("axios");
require("dotenv").config();

const GITHUB_API = "https://api.github.com";

const getHeaders = () => {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-analyzer",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

const fetchUserProfile = async (username) => {
  try {
    const { data } = await axios.get(`${GITHUB_API}/users/${username}`, {
      headers: getHeaders(),
    });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`Github user ${username} not found`);
    }
    if (err.response?.status === 403) {
      throw new Error(`Github API rate limit exceeded.`);
    }
    throw new Error(`Github API error: ${err.message}`);
  }
};

const fetchUserRepos = async (username) => {
  let repos = [];
  let page = 1;
  while (true) {
    const { data } = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
      headers: getHeaders(),
      params: { per_page: 100, page, sort: "updated" },
    });
    repos = repos.concat(data);
    if (data.length < 100) break;
    page++;
  }
  return repos;
};

const calculateScore = ({
  followers,
  public_repos,
  total_stars,
  total_forks,
  account_age_days,
}) => {
  let score = 0;

  score += Math.min(30, Math.floor(Math.log10(followers + 1) * 12));
  score += Math.min(30, Math.floor(Math.log10(total_stars + 1) * 12));
  score += Math.min(15, Math.floor(public_repos / 5));
  score += Math.min(15, Math.floor(Math.log10(total_forks + 1) * 6));
  const years = account_age_days / 365;
  score += Math.min(10, Math.floor(years * 2));

  return Math.min(100, score);
};

const analyzeProfile = async (username) => {
  const [user, repos] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepos(username),
  ]);
  const total_stars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const total_forks = repos.reduce((sum, r) => sum + r.forks_count, 0);

  const langMap = {};
  repos.forEach((r) => {
    if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
  });

  const sortedLangs = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const top_language = sortedLangs[0]?.[0] || null;
  const languages_used = JSON.stringify(sortedLangs.map(([lang]) => lang));

  const createdAt = new Date(user.created_at);
  const account_age_days = Math.floor(
    (Date.now() - createdAt) / (1000 * 60 * 60 * 24),
  );
  const avg_stars_per_repo =
    repos.length > 0 ? parseFloat((total_stars / repos.length).toFixed(2)) : 0;

  const has_readme_profile = repos.some(
    (r) => r.name.toLowerCase() === username.toLowerCase() && !r.private,
  );

  const top_repos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      repo_name: r.name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      watchers: r.watchers_count,
      repo_url: r.html_url,
    }));
  const github_score = calculateScore({
    followers: user.followers,
    public_repos: user.public_repos,
    total_stars,
    total_forks,
    account_age_days,
  });

  return {
    username: user.login,
    name: user.name,
    bio: user.bio,
    company: user.company,
    location: user.location,
    email: user.email,
    blog: user.blog,
    twitter_username: user.twitter_username,
    avatar_url: user.avatar_url,
    github_url: user.html_url,
    public_repos: user.public_repos,
    public_gists: user.public_gists,
    followers: user.followers,
    following: user.following,
    total_stars,
    total_forks,
    top_language,
    languages_used,
    account_age_days,
    avg_stars_per_repo,
    has_readme_profile,
    github_score,
    top_repos,
  };
};

module.exports = { analyzeProfile };