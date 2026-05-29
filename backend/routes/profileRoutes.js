const express = require("express");
const router = express.Router();
const { analyze, listProfiles, getProfile, compare } = require("../controllers/profileController");

router.post("/analyze/:username", analyze);

router.get("/profiles", listProfiles);

router.get("/profiles/:username", getProfile);

router.get("/compare/:user1/:user2", compare);

module.exports = router;
