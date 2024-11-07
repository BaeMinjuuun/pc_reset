const express = require("express");
const { prisma } = require("../../utils/prisma");
const axios = require("axios");
const dgram = require("dgram");
const {
  UDP_PORT,
  UDP_HOST,
  AGENT_URL,
  RESET_COUNT,
} = require("../../data/config");

const router = express.Router();

// reset 메시지 보내는 함수
const sendResetMessage = async (res, endpoint, data) => {
  const { SN, IP, ID } = data;
  const sendData = { SN, ID };
  console.log("Agent 서버로 reset 메시지 전송:", sendData);
  try {
    const response = await axios.post(`${IP}/${endpoint}`, sendData);
    console.log("Agent 서버 응답:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(
        "Agent 서버 응답 오류:",
        error.response.status,
        error.response.data
      );
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      console.error("Agent 서버로부터 응답을 받지 못했습니다:", error.request);
      res
        .status(500)
        .json({ error: "Agent 서버로부터 응답을 받지 못했습니다." });
    } else {
      console.error("요청 설정 오류:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

// UDP 메시지를 보내는 함수
const sendUdpMessage = (data) => {
  const message = Buffer.from(JSON.stringify(data)); // 데이터는 JSON 형식으로 전송
  const client = dgram.createSocket("udp4");

  const sendMessage = (attemptsLeft) => {
    client.send(message, 0, message.length, UDP_PORT, UDP_HOST, (err) => {
      if (err) {
        console.error(
          `UDP 메시지 전송 오류 (시도 ${RESET_COUNT - attemptsLeft + 1}):`,
          err
        );
        if (attemptsLeft > 1) {
          console.log(`재시도 중. 남은 시도 횟수: ${attemptsLeft - 1}`);
          sendMessage(attemptsLeft - 1);
        } else {
          console.error("메시지 전송 실패.");
        }
      } else {
        console.log("UDP 메시지 전송 성공:", data);
      }
      client.close();
    });
  };

  sendMessage(RESET_COUNT);
};

/**
 * @swagger
 * tags:
 *   name: PC
 *   description: PC 관련 API
 *
 * /api/reset/{id}:
 *   post:
 *     summary: 특정 PC에 reset 메시지 전송
 *     description: 지정된 SN(PC)의 reset 명령을 에이전트 서버로 전송하고, 관련 로그를 생성합니다.
 *     tags: [PC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PC의 Serial Number (SN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: reset 명령을 요청한 사용자 ID
 *     responses:
 *       200:
 *         description: PC에 reset 메시지가 성공적으로 전송되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Agent 서버 응답 메시지"
 *       500:
 *         description: 서버에서 오류가 발생하거나 에이전트 서버로부터 응답이 없을 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "서버에서 오류가 발생했습니다."
 */

router.post("/reset", async (req, res) => {
  const { SN, ID, IP, PC_ID } = req.body;
  const data = { SN, IP, ID };
  const date = new Date();
  console.log("Reset data:", data);
  try {
    await prisma.log.create({
      data: {
        timestamp: date,
        status: "Reset",
        pc_id: PC_ID,
      },
    });

    // HTTP 메시지 전송
    sendResetMessage(res, "reset", data);

    // UDP 메시지 전송
    sendUdpMessage(data);
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({ error: "서버에서 오류가 발생했습니다." });
  }
});

module.exports = router;
