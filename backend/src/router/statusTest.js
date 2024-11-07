const express = require("express");
const { prisma } = require("../../utils/prisma");
const { UpdateQueue } = require("../../utils/queue");

const router = express.Router();
const shutdownSN = new Set();
const processSN = new Set();
const updateQueue = new UpdateQueue();

// PC 상태 업데이트 함수 - 배치 처리
async function processBatchUpdates(updates) {
  try {
    await prisma.$transaction(async (tx) => {
      const serialNumbers = updates.map((update) => update.SN);

      // 존재하는 PC 확인을 한 번에 수행
      const existingPCs = await tx.pc.findMany({
        where: {
          serial_number: {
            in: serialNumbers,
          },
        },
        select: {
          serial_number: true,
        },
      });

      const existingSNs = new Set(existingPCs.map((pc) => pc.serial_number));
      const validUpdates = updates.filter((update) =>
        existingSNs.has(update.SN)
      );

      // 배치 업데이트 수행
      await Promise.all(
        validUpdates.map((update) =>
          tx.pc.update({
            where: { serial_number: update.SN },
            data: {
              status: update.status,
              ts: new Date(),
              ip: update.ip,
            },
          })
        )
      );
    });
  } catch (error) {
    console.error("배치 업데이트 중 오류:", error);
    throw error;
  }
}

router.put("/reportTest", async (req, res) => {
  const data = req.body;
  const devidedData = [];
  console.log("data:", data);

  try {
    // 데이터 전처리
    devidedData.push({
      SN: data.SN,
      status: data.status,
      ip: data.ip,
    });

    if (data.sub && Array.isArray(data.sub)) {
      data.sub.forEach((subItem) => {
        devidedData.push({
          SN: subItem.SN,
          status: subItem.status,
          ip: subItem.ip,
        });
      });
    }

    // process 데이터 처리
    if (data.process) {
      const { SN, process } = data;
      if (!processSN.has(SN)) {
        processSN.add(SN);
        console.log("'process':", { SN, process, ts: new Date() });
      }
      return res.status(200).json({ message: "프로세스 데이터 처리 완료" });
    }

    // 상태 업데이트 처리
    const updates = devidedData
      .map((item) => ({
        SN: item.SN,
        ip: item.ip,
        status: calculateStatus(item.status),
        result: calculateResult(item.status),
      }))
      .filter((item) => {
        // Shutdown 상태 필터링
        console.log("item.SN:", item.SN, "item.result:", item.result);
        if (shutdownSN.has(item.SN) && item.result !== 3) {
          return false;
        }
        return true;
      });

    // 큐에 업데이트 추가
    updateQueue.add(updates);

    // 즉시 응답 반환
    res.status(200).json({
      message: "데이터가 처리 큐에 추가되었습니다.",
      queueSize: updateQueue.size(),
    });
  } catch (error) {
    console.error("요청 처리 중 오류:", error);
    res.status(500).json({ error: "데이터 처리 중 오류가 발생했습니다." });
  }
});

// 상태 계산 함수
function calculateStatus(status) {
  const result = calculateResult(status);
  switch (result) {
    case 3:
      return "Normal";
    case 2:
    case 1:
      return "Shutdown";
    default:
      return "Unknown";
  }
}

// 결과 계산 함수
function calculateResult(item) {
  const boardStatus = item.BOARD === "OK" ? 1 : 0;
  const pcStatus = item.PC === "OK" ? 1 : 0;

  if (boardStatus === 1 && pcStatus === 1) return 3;
  if (boardStatus === 0 && pcStatus === 1) return 2;
  if (boardStatus === 1 && pcStatus === 0) return 1;
  return 0;
}

module.exports = router;
