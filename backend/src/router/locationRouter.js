const express = require("express");
const { prisma } = require("../../utils/prisma");
const dayjs = require("dayjs");
const { TIME_OVER } = require("../../data/config");

const router = express.Router();

let previousShutdownPcs = [];
let previousUnknownPcs = [];

const logCreate = async () => {
  // console.log("TIME_OVER => ", TIME_OVER);
  try {
    const currentTime = dayjs();
    const pcs = await prisma.pc.findMany();

    // 1. 설정한 시간이 지난 PC 데이터만 필터링
    const filteredPcs = pcs.filter((item) => {
      const timeOverDate = dayjs(item.ts).add(TIME_OVER, "seconds");
      return currentTime.isAfter(timeOverDate);
    });

    // Shutdown 상태인 PC만 로그로 남김
    const shutdownFilteredPcs = filteredPcs.filter(
      (item) => item.status === "Shutdown"
    );
    for (const item of shutdownFilteredPcs) {
      const existingLog = await prisma.log.findFirst({
        where: {
          pc_id: item.id,
          timestamp: item.ts,
          status: "Shutdown",
        },
      });
      if (!existingLog) {
        // console.log("existingLog item:", item);
        await prisma.log.create({
          data: {
            pc_id: item.id,
            status: "Shutdown",
            timestamp: item.ts,
          },
        });
        // console.log(`PC: ${item.name} PC가 Shutdown 상태로 기록됨.`);
      }
    }

    // Unknown 상태인 PC만 로그로 남김
    const unknownFilteredPcs = filteredPcs.filter(
      (item) => item.status === "Unknown"
    );
    // console.log("unknownFilteredPcs:", unknownFilteredPcs);
    for (const item of unknownFilteredPcs) {
      const existingUnknownLog = await prisma.log.findFirst({
        where: {
          pc_id: item.id,
          timestamp: item.ts,
          status: "Unknown",
        },
      });
      if (!existingUnknownLog) {
        // console.log("existingUnknownLog item:", item);
        await prisma.log.create({
          data: {
            pc_id: item.id,
            status: "Unknown",
            timestamp: item.ts,
          },
        });
        // console.log(`PC: ${item.name} PC가 Unknown 상태로 기록됨.`);
      }
    }

    // 2. Shutdown -> Normal 상태로 변경된 PC 데이터만 필터링
    const shutdownPcs = pcs.filter((item) => item.status === "Shutdown");
    for (const previousPc of previousShutdownPcs) {
      const updatedPc = pcs.find(
        (item) => item.id === previousPc.id && item.status === "Normal"
      );
      if (updatedPc) {
        await prisma.log.create({
          data: {
            pc_id: updatedPc.id,
            status: "Normal",
            timestamp: updatedPc.ts,
          },
        });
        console.log(`PC: ${updatedPc.name} Shutdown PC가 정상 상태로 변경됨.`);
      }
    }
    previousShutdownPcs = shutdownPcs;

    // 3. Unknown -> Normal 상태로 변경된 PC 데이터만 필터링
    const unknownPcs = pcs.filter((item) => item.status === "Unknown");
    for (const previousPc of previousUnknownPcs) {
      const updatedPc = pcs.find(
        (item) => item.id === previousPc.id && item.status === "Normal"
      );
      if (updatedPc) {
        await prisma.log.create({
          data: {
            pc_id: updatedPc.id,
            status: "Normal",
            timestamp: updatedPc.ts,
          },
        });
        console.log(`PC: ${updatedPc.name} Unknown PC가 정상 상태로 변경됨.`);
      }
    }
    previousUnknownPcs = unknownPcs;
  } catch (error) {
    console.error("서버 오류:", error);
  }
};

const pcUpdate = async () => {
  try {
    const currentTime = dayjs();
    const pcs = await prisma.pc.findMany();

    // 1. 설정한 시간이 지난 PC 데이터만 필터링
    const filteredTimeOverPcs = pcs.filter((item) => {
      const timeOverDate = dayjs(item.ts).add(TIME_OVER, "seconds");

      // 처리할 상태 목록
      const validStatuses = [
        "Normal",
        "Shutdown",
        "Unknown",
        "Warning",
        "",
        null,
      ];

      // 설정한 시간이 지난 경우 + 해당 상태들 중 하나일 경우
      return (
        currentTime.isAfter(timeOverDate) && validStatuses.includes(item.status)
      );
    });

    // console.log("filteredTimeOverPcs:", filteredTimeOverPcs);

    // 2. 필터링된 PC 데이터의 상태를 변경
    const pcUpdatePromises = filteredTimeOverPcs.map(async (item) => {
      // console.log("item:", item.name, item.status, item.ts);
      switch (item.status) {
        case "Normal":
          await prisma.pc.update({
            where: { id: item.id },
            data: { status: "Shutdown" },
          });
          console.log(
            "PC: ",
            item.name,
            "PC 상태 Normal -> Shutdown 업데이트 됨"
          );
          break;
        case "":
        case null:
          await prisma.pc.update({
            where: { id: item.id },
            data: { status: "Unknown" },
          });
          console.log(
            "PC: ",
            item.name,
            'PC 상태 "" -> Unknown 업데이트 됨',
            currentTime
          );
          break;
        case "Warning":
          // console.log("PC: ", item.name, "현재 Warning 상태 유지중");
          break;
        default:
          break;
      }
    });

    await Promise.all(pcUpdatePromises);
  } catch (error) {
    console.error(error);
  }
};

setInterval(() => {
  logCreate();
  pcUpdate();
}, 5000);

module.exports = router;
