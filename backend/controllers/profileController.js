const { analyzeProfile } = require("../services/githubService");
const {
  upsertProfile,
  getAllProfiles,
  getProfileByUsername,
  isStale,
  compareProfiles,
} = require("../models/profileModel");

const analyze = async (req, res) => {
  try {
    const { username } = req.params;
    const { force } = req.query; // ?force=true to bypass cache

    if (!/^[a-zA-Z0-9-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub username format",
      });
    }

    if (force !== "true") {
      const stale = await isStale(username);
      if (!stale) {
        const cached = await getProfileByUsername(username);
        return res.status(200).json({
          success: true,
          message: "Returning cached profile (analyzed recently)",
          cached: true,
          data: cached,
        });
      }
    }

    const profileData = await analyzeProfile(username);

    await upsertProfile(profileData);

    const saved = await getProfileByUsername(username);

    res.status(200).json({
      success: true,
      message: `Profile for "${username}" analyzed and stored successfully`,
      cached: false,
      data: saved,
    });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

const listProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "analyzed_at" } = req.query;

    const result = await getAllProfiles({
      page,
      limit,
      sort,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("LIST PROFILE ERROR");
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
    });
  }
};
const getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile for "${username}" not found. Analyze it first via POST /api/analyze/${username}`,
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const compare = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const result = await compareProfiles(user1, user2);

    if (!result.profile1) {
      return res.status(404).json({ success: false, message: `Profile "${user1}" not found. Analyze it first.` });
    }
    if (!result.profile2) {
      return res.status(404).json({ success: false, message: `Profile "${user2}" not found. Analyze it first.` });
    }

    const p1 = result.profile1;
    const p2 = result.profile2;
    const comparison = {
      github_score:      { winner: p1.github_score >= p2.github_score ? user1 : user2,      [user1]: p1.github_score,      [user2]: p2.github_score },
      followers:         { winner: p1.followers >= p2.followers ? user1 : user2,             [user1]: p1.followers,         [user2]: p2.followers },
      total_stars:       { winner: p1.total_stars >= p2.total_stars ? user1 : user2,         [user1]: p1.total_stars,       [user2]: p2.total_stars },
      public_repos:      { winner: p1.public_repos >= p2.public_repos ? user1 : user2,       [user1]: p1.public_repos,      [user2]: p2.public_repos },
      account_age_days:  { winner: p1.account_age_days >= p2.account_age_days ? user1 : user2, [user1]: p1.account_age_days, [user2]: p2.account_age_days },
    };

    res.status(200).json({ success: true, data: { ...result, comparison } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { analyze, listProfiles, getProfile, compare };
