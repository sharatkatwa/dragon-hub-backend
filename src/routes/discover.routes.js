const express = require("express");
const { getDiscoverFeed } = require("../controllers/discover.controller");

const router = express.Router();

router.get("/", getDiscoverFeed);

module.exports = router;
