const { pool } = require("../config/db");

const upsertProfile = async (profileData) => {
  const {
    username, name, bio, company, location, email, blog, twitter_username,
    avatar_url, github_url, public_repos, public_gists, followers, following,
    total_stars, total_forks, top_language, languages_used, account_age_days,
    avg_stars_per_repo, has_readme_profile, github_score, top_repos,
  } = profileData;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO github_profiles
        (username, name, bio, company, location, email, blog, twitter_username,
         avatar_url, github_url, public_repos, public_gists, followers, following,
         total_stars, total_forks, top_language, languages_used, account_age_days,
         avg_stars_per_repo, has_readme_profile, github_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), bio = VALUES(bio), company = VALUES(company),
         location = VALUES(location), email = VALUES(email), blog = VALUES(blog),
         twitter_username = VALUES(twitter_username), avatar_url = VALUES(avatar_url),
         github_url = VALUES(github_url), public_repos = VALUES(public_repos),
         public_gists = VALUES(public_gists), followers = VALUES(followers),
         following = VALUES(following), total_stars = VALUES(total_stars),
         total_forks = VALUES(total_forks), top_language = VALUES(top_language),
         languages_used = VALUES(languages_used), account_age_days = VALUES(account_age_days),
         avg_stars_per_repo = VALUES(avg_stars_per_repo),
         has_readme_profile = VALUES(has_readme_profile),
         github_score = VALUES(github_score),
         updated_at = CURRENT_TIMESTAMP`,
      [username, name, bio, company, location, email, blog, twitter_username,
       avatar_url, github_url, public_repos, public_gists, followers, following,
       total_stars, total_forks, top_language, languages_used, account_age_days,
       avg_stars_per_repo, has_readme_profile ? 1 : 0, github_score]
    );

    const profileId = result.insertId || (await conn.execute(
      "SELECT id FROM github_profiles WHERE username = ?", [username]
    ))[0][0].id;

    await conn.execute("DELETE FROM top_repositories WHERE username = ?", [username]);

    if (top_repos?.length) {
      const repoValues = top_repos.map((r) => [
        profileId, username, r.repo_name, r.description, r.language,
        r.stars, r.forks, r.watchers, r.repo_url,
      ]);
      await conn.query(
        `INSERT INTO top_repositories
          (profile_id, username, repo_name, description, language, stars, forks, watchers, repo_url)
         VALUES ?`,
        [repoValues]
      );
    }

    await conn.commit();
    return profileId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


const getAllProfiles = async ({
  page = 1,
  limit = 10,
  sort = "analyzed_at",
} = {}) => {
  const validSorts = [
    "analyzed_at",
    "github_score",
    "followers",
    "total_stars",
    "public_repos",
  ];

  const sortCol = validSorts.includes(sort)
    ? sort
    : "analyzed_at";

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const offset = Math.max(0, (pageNum - 1) * limitNum);

  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM github_profiles"
  );

  const total = countRows[0].total;

  // IMPORTANT: Use query() instead of execute()
  const [rows] = await pool.query(
    `SELECT * FROM github_profiles
     ORDER BY ${sortCol} DESC
     LIMIT ${limitNum} OFFSET ${offset}`
  );

  return {
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.ceil(total / limitNum),
    profiles: rows.map(formatProfile),
  };
};
const getProfileByUsername = async (username) => {
  const [[profile]] = await pool.execute(
    "SELECT * FROM github_profiles WHERE username = ?",
    [username]
  );
  if (!profile) return null;

  const [repos] = await pool.execute(
    "SELECT * FROM top_repositories WHERE username = ? ORDER BY stars DESC",
    [username]
  );

  return { ...formatProfile(profile), top_repositories: repos };
};

const isStale = async (username) => {
  const [[row]] = await pool.execute(
    "SELECT updated_at FROM github_profiles WHERE username = ?",
    [username]
  );
  if (!row) return true;

  const cacheMins = parseInt(process.env.CACHE_DURATION_MINUTES || 60);
  const ageMs = Date.now() - new Date(row.updated_at).getTime();
  return ageMs > cacheMins * 60 * 1000;
};
const compareProfiles = async (user1, user2) => {
  const [p1, p2] = await Promise.all([
    getProfileByUsername(user1),
    getProfileByUsername(user2),
  ]);
  return { profile1: p1, profile2: p2 };
};

const formatProfile = (profile) => ({
  ...profile,
  languages_used: (() => {
    try { return JSON.parse(profile.languages_used || "[]"); }
    catch { return []; }
  })(),
  has_readme_profile: Boolean(profile.has_readme_profile),
});

module.exports = { upsertProfile, getAllProfiles, getProfileByUsername, isStale, compareProfiles };
