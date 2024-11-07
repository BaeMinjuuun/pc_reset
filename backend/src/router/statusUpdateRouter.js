const express = require("express");
const { prisma } = require("../../utils/prisma");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const shutdownSN = new Set();
const processSN = new Set();
const now = new Date();

const successLogFilePath = path.join(
  __dirname,
  "../../logs/report_requests_success.log"
);
const failLogFilePath = path.join(
  __dirname,
  "../../logs/report_requests_fail.log"
);
const LOG_INTERVAL_NUM = 1000; // 초마다 반복
let successRequestCount = 0; // 받은 성공 개수
let failRequestCount = 0;

// 성공 로그 남기는 함수
function successLog() {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] 받은 요청 개수: ${successRequestCount} \n`;

  fs.appendFile(successLogFilePath, logMessage, (err) => {
    if (err) console.error("로그 기록 중 오류:", err);
  });
}

// 실패 로그 남기는 함수
function failLog() {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] 실패한 요청 개수: ${failRequestCount} \n`;

  fs.appendFile(failLogFilePath, logMessage, (err) => {
    if (err) console.error("로그 기록 중 오류:", err);
  });
}

// 로그 기록
// setInterval(() => {
//   successLog();
//   // failLog();
// setInterval(() => {
//   successLog();
//   // failLog();

//   // 카운터 초기화
//   successRequestCount = 0;
//   failRequestCount = 0;
// }, INTERVAL_NUM);

router.put("/report", async (req, res) => {
  const data = req.body;
  const devidedData = [];
  // console.log("data:", data);

  devidedData.push({
    SN: data.SN,
    status: data.status,
    ip: data.ip,
  });

  // sub가 존재하면 각 sub 데이터를 추가
  if (data.sub && Array.isArray(data.sub)) {
    data.sub.forEach((subItem) => {
      devidedData.push({
        SN: subItem.SN,
        status: subItem.status,
        ip: subItem.ip,
      });
    });
  }

  // process 필드가 존재하는 경우 필터링 후 기록
  if (data.process) {
    const { SN, process } = data;
    const processData = { SN, process, ts: now };
    if (!processSN.has(SN)) {
      console.log("'process':", processData);
      processSN.add(SN); // 중복 방지를 위해 로그를 찍은 SN 추가
    }
  } else {
    const results = devidedData.map((item) => ({
      SN: item.SN,
      ip: item.ip,
      result: calculateResult(item.status),
    }));

    // PC 상태 업데이트 함수
    async function updatePcStatus(SN, status, ip) {
      try {
        await prisma.pc.update({
          where: { serial_number: SN },
          data: { status, ts: new Date(), ip },
        });
      } catch (error) {
        // 데이터베이스에 등록되지 않은 SN일 경우
        if (error.code === "P2025") {
          // console.error(`SN: ${SN} 레코드를 찾을 수 없습니다.`);
        } else {
          console.error(`SN: ${SN} 처리 중 오류 발생: ${error.message}`);
        }
      }
    }

    async function pcUpdate(results) {
      for (const item of results) {
        // Shutdown 상태인 경우 업데이트를 건너뜀
        if (shutdownSN.has(item.SN) && item.result !== 3) {
          // console.log("shutdownSN:", item.SN);
          continue;
        }
        switch (item.result) {
          case 3:
            // PC OK, BOARD OK
            await updatePcStatus(item.SN, "Normal", item.ip);
            shutdownSN.delete(item.SN);
            break;
          case 2:
            // PC OK, BOARD NG
            await updatePcStatus(item.SN, "Shutdown", item.ip);
            console.log("case 2");
            shutdownSN.add(item.SN);
            break;
          case 1:
            // PC NG, BOARD OK
            await updatePcStatus(item.SN, "Shutdown", item.ip);
            console.log("case 1");
            shutdownSN.add(item.SN);
            break;
          case 0:
            // PC NG, BOARD NG
            await updatePcStatus(item.SN, "Unknown", item.ip);
            break;
        }
      }
    }
    try {
      successRequestCount++;
      await pcUpdate(results);
      res
        .status(200)
        .json({ message: "데이터가 성공적으로 처리되었습니다.", results });
    } catch (error) {
      failRequestCount++;
      console.error("결과 처리 중 오류 발생:", error);
      res.status(500).json({ error: "데이터 처리 중 오류가 발생했습니다." });
    }
  }
});

// 상태 분류 함수
function calculateResult(item) {
  const boardStatus = item.BOARD === "OK" ? 1 : 0;
  const pcStatus = item.PC === "OK" ? 1 : 0;

  if (boardStatus === 1 && pcStatus === 1) {
    return 3; // PC OK, BOARD OK
  } else if (boardStatus === 0 && pcStatus === 1) {
    return 2; // PC OK, BOARD NG
  } else if (boardStatus === 1 && pcStatus === 0) {
    return 1; // PC NG, BOARD OK
  } else {
    return 0; // PC NG, BOARD NG
  }
}

module.exports = router;
