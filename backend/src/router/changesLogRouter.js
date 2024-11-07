require("dotenv").config();
const express = require("express");
const { prisma } = require("../../utils/prisma");
const router = express.Router();

router.get("/getChangesLog", async (req, res) => {
  const { page = 1, limit = 20 } = req.query; // page와 limit 파라미터를 쿼리로 받음, 기본값 설정
  const offset = (page - 1) * limit;

  try {
    const totalLogs = await prisma.changesLog.count(); // 전체 로그 수를 계산
    const changesLog = await prisma.changesLog.findMany({
      orderBy: {
        timestamp: "desc",
      },
      skip: offset,
      take: parseInt(limit),
    });
    
    res.status(200).json({ changesLog, totalLogs }); // 페이지 데이터와 전체 로그 수를 함께 반환
  } catch (error) {
    console.error("Error in getChangesLog:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
