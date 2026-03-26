// routes/about.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: "Tubombe",
    mission: "Bridge the gap between opportunity and talent...",
    team: [
      { name: "Mattityahu", role: "Founder & Full-Stack Developer" },
      { name: "Grace N.", role: "Career Advisor" },
      { name: "Chanda K.", role: "UX/UI Lead" }
    ]
  });
});

module.exports = router;
