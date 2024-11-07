const express = require("express");
const fs = require("fs");
const path = require("path");
const { prisma } = require("../../utils/prisma");
const dayjs = require("dayjs");
const { TIME_OVER } = require("../../data/config");

const configFilePath = path.join(
  path.dirname(require.main.filename),
  "data",
  "config.js"
);
// console.log("Config file path:", configFilePath);
const router = express.Router();

// config 파일 수정 함수
const updateConfigFile = async (timeOverData) => {
  try {
    // config.js 파일을 읽음
    const configFileContent = fs.readFileSync(configFilePath, "utf8");

    // config.js는 자바스크립트 모듈이므로 eval로 처리할 수 있음
    let config = require(configFilePath);

    // timeOverData를 수정
    config.TIME_OVER = timeOverData;

    // 수정된 내용을 다시 config.js 파일에 덮어쓰기
    const newConfigContent = `module.exports = ${JSON.stringify(
      config,
      null,
      2
    )};`;

    fs.writeFileSync(configFilePath, newConfigContent, "utf8");
    console.log("config.js 파일이 성공적으로 업데이트되었습니다.");
  } catch (error) {
    console.error("config.js 파일 수정 중 오류 발생:", error);
  }
};

/**
 * @swagger
 * /api/getTimeOverOfConfig:
 *   get:
 *     summary: TIME_OVER 설정값 조회
 *     description: config.js 파일에서 현재 TIME_OVER 설정값을 가져옵니다.
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: 현재 TIME_OVER 값을 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: number
 *               example: 300
 */
router.get("/getTimeOverOfConfig", async (req, res) => {
  res.json(TIME_OVER);
});

/**
 * @swagger
 * /api/updateTimeOverOfConfig:
 *   post:
 *     summary: TIME_OVER 설정값 수정
 *     description: config.js 파일의 TIME_OVER 값을 수정합니다.
 *     tags: [Config]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timeOverData:
 *                 type: number
 *                 description: 새로 설정할 TIME_OVER 값
 *                 example: 600
 *     responses:
 *       200:
 *         description: TIME_OVER 값이 성공적으로 수정되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 구성 설정이 저장되었습니다.
 *       500:
 *         description: TIME_OVER 값 수정 중 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 저장 오류가 발생했습니다.
 */
router.post("/updateTimeOverOfConfig", async (req, res) => {
  try {
    const { newTimeOverData, user_id } = req.body;
    let config = require(configFilePath);
    const prevTimeOverData = config.TIME_OVER;

    // 트랜잭션으로 처리
    await prisma.$transaction(async (prisma) => {
      // 설정 파일 업데이트
      await updateConfigFile(newTimeOverData);

      // 변경 로그 기록
      await prisma.changesLog.create({
        data: {
          item: "시스템",
          description: `${prevTimeOverData} → ${newTimeOverData} 변경`,
          timestamp: new Date(),
          user_id: user_id || "",
        },
      });
    });

    res.status(200).send({ message: "구성 설정이 저장되었습니다." });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send({ message: "저장 오류가 발생했습니다." });
  }
});

module.exports = router;
