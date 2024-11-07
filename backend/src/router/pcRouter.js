const express = require("express");
const SSE = require("express-sse");
const sse = new SSE();
const { prisma } = require("../../utils/prisma");
const { AGENT_URL } = require("../../data/config");
const axios = require("axios");

const router = express.Router();

/**
 * @swagger
 * /api/getPc:
 *   get:
 *     summary: 페이지 기반 PC 데이터 조회
 *     tags: [PC]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           example: 100
 *         description: 한 페이지에 보여줄 데이터 수
 *     responses:
 *       200:
 *         description: 페이지 기반 PC 목록과 총 페이지 수 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pcList:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "PC1"
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: 서버 오류
 */
router.get("/getPc", async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  try {
    const skip = (page - 1) * limit;
    const [pcList, totalCount] = await prisma.$transaction([
      prisma.pc.findMany({
        skip,
        take: Number(limit),
      }),
      prisma.pc.count(), // 전체 PC 수를 조회
    ]);

    res.json({
      pcList,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch PC data" });
  }
});

// 그룹별 PC 수를 조회하는 엔드포인트
router.get("/getPcCountsByGroupHierarchy", async (req, res) => {
  try {
    // 모든 그룹 조회
    const groups = await prisma.group.findMany();

    // 그룹의 모든 하위 그룹 ID를 찾는 함수
    const getDescendantGroupIds = (groupId) => {
      const descendants = [];
      const stack = [groupId];

      while (stack.length > 0) {
        const currentId = stack.pop();
        descendants.push(currentId);

        // 현재 그룹의 직계 하위 그룹들을 찾아서 스택에 추가
        const children = groups.filter((g) => g.parent_id === currentId);
        stack.push(...children.map((c) => c.id));
      }

      return descendants;
    };

    // 각 그룹별 PC 수 계산
    const groupCounts = await Promise.all(
      groups.map(async (group) => {
        const descendantIds = getDescendantGroupIds(group.id);

        const count = await prisma.pc.count({
          where: {
            group_id: {
              in: descendantIds,
            },
          },
        });

        return {
          group_id: group.id,
          count,
        };
      })
    );

    res.json(groupCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * tags:
 *   name: Group
 *   description: 그룹 관련 API
 *
 * /api/getPcListWithGroup/{id}:
 *   get:
 *     summary: 특정 그룹과 하위 그룹의 PC 목록을 조회합니다 (SSE 적용)
 *     tags: [PC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹의 PC 목록을 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "PC1"
 */
router.get("/getPcListWithGroup/:id", async (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const groupIds = await getGroupAndDescendantIds(Number(id));

    // 그룹에 해당하는 모든 PC 정보를 가져옴
    const pcs = await prisma.pc.findMany({
      where: {
        group_id: { in: groupIds },
      },
    });
    res.write(`data: ${JSON.stringify(pcs)}\n\n`);

    const interval = setInterval(async () => {
      const updatedPcs = await prisma.pc.findMany({
        where: {
          group_id: { in: groupIds },
        },
      });

      res.write(`data: ${JSON.stringify(updatedPcs)}\n\n`);
    }, 3000);

    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

/**
 * @swagger
 * /api/getPcModuleListWithGroup/{id}:
 *   get:
 *     summary: 특정 그룹과 하위 그룹에 속한 PC 정보를 조회합니다
 *     tags: [Module]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹 및 하위 그룹의 PC 목록을 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "PC1"
 *       500:
 *         description: 서버 오류
 */
router.get("/getPcModuleListWithGroup/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const groupIds = await getGroupAndDescendantIds(Number(id));

    // 그룹에 해당하는 모든 PC 정보를 가져옴
    const pcs = await prisma.pc.findMany({
      where: {
        group_id: { in: groupIds },
      },
    });
    res.status(200).send(pcs);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// 모니터링 페이지 sse 적용
router.get("/getPCStatus", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendStatusUpdate = async () => {
    try {
      const pcStatuses = await prisma.pc.findMany({
        include: { group: true },
      });
      const statusCount = {
        normal: 0,
        shutdown: 0,
        warning: 0,
        unknown: 0,
      };

      // 상태 카운트 계산
      pcStatuses.forEach((pc) => {
        if (pc.status === "Normal") statusCount.normal++;
        else if (pc.status === "Shutdown") statusCount.shutdown++;
        else if (pc.status === "Warning") statusCount.warning++;
        else if (pc.status === "Unknown") statusCount.unknown++;
      });

      const response = {
        total: pcStatuses.length,
        ...statusCount,
      };

      res.write(`data: ${JSON.stringify(response)}\n\n`);
    } catch (error) {
      console.error("PC 상태 가져오기 오류:", error.message);
      res.write(`data: ${JSON.stringify({ message: "서버 오류" })}\n\n`);
    }
  };

  await sendStatusUpdate();

  const interval = setInterval(sendStatusUpdate, 5000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

/**
 * @swagger
 * /api/deletePc/{id}:
 *   delete:
 *     summary: 특정 PC 데이터를 삭제합니다
 *     tags: [PC]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 PC의 ID
 *     responses:
 *       200:
 *         description: PC 삭제 성공
 *       404:
 *         description: PC를 찾을 수 없음
 *       500:
 *         description: 서버 오류 발생
 */
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPc = await prisma.pc.delete({
      where: { id: Number(id) },
    });

    res
      .status(200)
      .json({ message: "PC가 성공적으로 삭제되었습니다.", deletedPc });
  } catch (error) {
    if (error.code === "P2025") {
      // Prisma의 "Record not found" 오류 코드
      res.status(404).json({ error: "해당 PC를 찾을 수 없습니다." });
    } else {
      console.error("PC 삭제 중 오류 발생:", error);
      res.status(500).json({ error: "PC 삭제 중 서버 오류 발생" });
    }
  }
});

/**
 * @swagger
 * /api/update:
 *   post:
 *     summary: PC 모듈 정보 업데이트
 *     tags: [Module]
 *     description: 주어진 SN을 기반으로 특정 PC의 정보를 업데이트하고, 에이전트 서버로 설정 데이터를 전송합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 sn:
 *                   type: string
 *                   description: PC의 시리얼 번호
 *                   example: "SN000001"
 *                 period:
 *                   type: integer
 *                   description: 업데이트할 기간 값
 *                   example: 5
 *                 name:
 *                   type: string
 *                   description: PC의 이름
 *                   example: "PC1"
 *     responses:
 *       200:
 *         description: 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 period:
 *                   type: integer
 *                   example: 5
 *                 name:
 *                   type: string
 *                   example: "PC1"
 *       500:
 *         description: 서버 오류 발생
 */

router.post("/update", async (req, res) => {
  const data = req.body.data;
  const user_id = req.body.user_id;
  // console.log("수신된 데이터:", data, user_id);
  // console.log("수신된 데이터:", data[0].sn);
  const SN = data[0].sn;
  const period = data[0].period;
  const name = data[0].name;
  const id = data[0].id;
  const ip = data[0].ip;
  const sendData = { SN, period };
  const numberPeriod = Number(period);
  const updateTransaction = async () => {
    // PC 정보를 업데이트
    const updateModule = await prisma.pc.update({
      where: { id: id },
      data: { period: numberPeriod, serial_number: SN, name: name },
    });

    // 설정 메시지를 에이전트 서버로 전송
    const response = await axios.put(`http://${ip}:8130/setting`, sendData);
    console.log("Agent 서버 응답:", response.data);

    return updateModule;
  };

  try {
    // 트랜잭션 실행
    const result = await prisma.$transaction(async (tx) => {
      const prevPC = await prisma.pc.findFirst({
        where: { id: id },
      });
      console.log("prevPC", prevPC);

      await updateTransaction(tx);

      console.log(
        `PC명: ${prevPC.name}, SN: ${prevPC.serial_number}, 주기: ${prevPC.period} → \n PC명: ${name}, SN: ${SN}, 주기: ${period}`
      );

      await prisma.changesLog.create({
        data: {
          item: "모듈수정",
          description: `PC명: ${prevPC.name}, SN: ${prevPC.serial_number}, 주기: ${prevPC.period} → \n PC명: ${name}, SN: ${SN}, 주기: ${period}`,
          timestamp: new Date(),
          user_id: user_id || "",
        },
      });
    });

    return res.status(200).json(result);
  } catch (error) {
    // 오류 처리
    if (error.response) {
      console.error(
        "Agent 서버 응답 오류:",
        error.response.status,
        error.response.data
      );
      return res
        .status(error.response.status)
        .json({ error: error.response.data });
    } else if (error.request) {
      console.error("Agent 서버로부터 응답을 받지 못했습니다:", error.request);
      return res
        .status(500)
        .json({ error: "Agent 서버로부터 응답을 받지 못했습니다." });
    } else {
      console.error("요청 설정 오류:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }
});

// 하위 그룹들을 재귀적으로 찾는 함수
async function findAllSubGroups(prisma, group_id) {
  const subGroups = await prisma.group.findMany({
    where: { parent_id: group_id },
    select: { id: true },
  });

  let allGroupIds = subGroups.map((group) => group.id);

  for (const group of subGroups) {
    const childGroupIds = await findAllSubGroups(prisma, group.id);
    allGroupIds = allGroupIds.concat(childGroupIds);
  }

  return allGroupIds;
}

// 사용중인 그룹 업데이트
router.post("/updateGroup", async (req, res) => {
  const group_id = req.body.sendData[0].group_id;
  const period = req.body.sendData[0].period;
  const user_id = req.body.user_id;
  const prevPeriod = req.body.prevPeriod;
  const groupHierarchy = req.body.groupHierarchy;

  try {
    const updateModule = await prisma.$transaction(async (prisma) => {
      const groupIds = await findAllSubGroups(prisma, Number(group_id));
      groupIds.push(Number(group_id));

      const pcData = await prisma.pc.findMany({
        where: { group_id: { in: groupIds } },
        select: { serial_number: true, ip: true },
      });

      const updateResult = await prisma.pc.updateMany({
        where: { group_id: { in: groupIds } },
        data: { period: period },
      });

      await prisma.changesLog.create({
        data: {
          item: "모듈일괄수정",
          description: `[${groupHierarchy}] 그룹의 주기 ${prevPeriod} → ${period}`,
          timestamp: new Date(),
          user_id: user_id || "",
        },
      });

      return { updateResult, pcData };
    });

    // 트랜잭션 이후에 외부 API 호출 처리
    const sendPromises = updateModule.pcData.map(async (pc) => {
      const ip = pc.ip;
      const sendData = {
        SN: pc.serial_number,
        period: period,
      };
      console.log("sendData:", sendData);
      const response = await axios.put(`http://${ip}:8130/setting`, sendData);
      console.log("Agent 서버 응답:", response.data);
    });

    await Promise.all(sendPromises);

    return res.status(200).json(updateModule.updateResult);
  } catch (error) {
    console.error("Error updating periods:", error);
    return res.status(500).json({ error: "Failed to update periods" });
  }
});

/**
 * @swagger
 * tags:
 *   name: Group
 *   description: 그룹 관련 API
 *
 * /api/getGroupStatusWithDescendants/{id}:
 *   get:
 *     summary: 그룹 및 하위 그룹의 PC 상태를 조회합니다 (SSE 적용)
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹 및 하위 그룹의 PC 상태를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusSummary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: integer
 *                         example: 1
 *                       groupName:
 *                         type: string
 *                         example: "Group1"
 *                       statusCount:
 *                         type: object
 *                         properties:
 *                           Normal:
 *                             type: integer
 *                             example: 10
 *                           Shutdown:
 *                             type: integer
 *                             example: 2
 *                           Warning:
 *                             type: integer
 *                             example: 1
 *                           Unknown:
 *                             type: integer
 *                             example: 0
 */

router.get("/getGroupStatusWithDescendants/:id", async (req, res) => {
  // SSE 헤더 설정
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // 헤더 전송 및 SSE 스트림 시작

  try {
    // 주어진 그룹 ID의 하위 그룹 ID 목록을 가져옴
    const groupIds = await subgroupIds(Number(req.params.id));

    // 상태 요약을 클라이언트에 전송하는 함수
    const sendStatusSummary = async () => {
      const statusSummary = [];
      let totalPcCount = 0; // PC의 총 개수를 저장할 변수

      // 주어진 그룹 ID에 대한 상태 요약을 계산하는 함수
      const calculateStatusForGroup = async (groupId) => {
        // 주어진 그룹 ID에 속한 모든 하위 그룹 ID를 가져옴
        const descendantGroups = await getGroupAndDescendantIds(groupId);

        const start = Date.now();
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { name: true },
        });

        if (!group) {
          return {
            groupId,
            groupName: `Unknown Group ${groupId}`,
            statusCount: {},
            pcCount: 0,
          };
        }

        // 하위 그룹들과 현재 그룹에 속한 PC들의 상태를 가져옴
        const pcs = await prisma.pc.findMany({
          where: {
            group_id: { in: descendantGroups },
          },
          orderBy: {
            id: "asc",
          },
        });
        const durationPcs = Date.now() - start;
        // console.log("pcs 조회 시간:", durationPcs, "ms");

        // 상태별 카운트 초기화
        const statusCount = {
          Normal: 0,
          Shutdown: 0,
          Warning: 0,
          Unknown: 0,
        };

        const pcDetails = {
          normalPcs: [],
          shutdownPcs: [],
          warningPcs: [],
          unknownPcs: [],
        };

        // PC들의 상태를 집계
        pcs.forEach((pc) => {
          if (pc.status === "Normal") {
            statusCount.Normal++;
            pcDetails.normalPcs.push({
              id: pc.id,
              name: pc.name,
              groupId: pc.group_id,
              status: "Normal",
            });
          } else if (pc.status === "Shutdown") {
            statusCount.Shutdown++;
            pcDetails.shutdownPcs.push({
              id: pc.id,
              name: pc.name,
              groupId: pc.group_id,
              status: "Shutdown",
            });
          } else if (pc.status === "Warning") {
            statusCount.Warning++;
            pcDetails.warningPcs.push({
              id: pc.id,
              name: pc.name,
              groupId: pc.group_id,
              status: "Warning",
            });
          } else if (pc.status === "Unknown") {
            statusCount.Unknown++;
            pcDetails.unknownPcs.push({
              id: pc.id,
              name: pc.name,
              groupId: pc.group_id,
              status: "Unknown",
            });
          }
        });

        const pcCount = pcs.length; // PC 개수 저장
        totalPcCount += pcCount; // 총 PC 개수 갱신

        // 그룹 상태 요약
        return {
          groupId,
          groupName: group.name,
          statusCount,
          pcCount,
          pcDetails,
        };
      };

      // 주어진 그룹 ID 목록에 대해 상태 요약을 계산
      for (const groupId of groupIds) {
        const groupStatus = await calculateStatusForGroup(groupId);
        statusSummary.push(groupStatus);
      }

      // SSE 데이터 전송 (데이터는 'data:'로 시작해야 함)
      res.write(`data: ${JSON.stringify(statusSummary)}\n\n`);
    };

    // 처음 상태 전송
    await sendStatusSummary();

    // 5초마다 상태 요약을 다시 계산하여 전송
    const interval = setInterval(async () => {
      await sendStatusSummary(); // 상태를 갱신하여 클라이언트로 전송
    }, 5000); // 5초마다 갱신

    // 클라이언트가 연결을 끊으면 interval을 정리
    req.on("close", () => {
      clearInterval(interval); // 주기적인 상태 전송 중단
    });
  } catch (error) {
    console.error("상태 데이터를 가져오는 중 오류 발생:", error);
    res.status(500).send("서버 오류 발생");
  }
});

// 하위 그룹의 ID를 모두 가져오는 함수
async function getGroupAndDescendantIds(groupId) {
  const result = await prisma.$queryRaw`
    WITH RECURSIVE group_hierarchy AS (
      SELECT id FROM \`Group\` WHERE id = ${groupId}
      UNION ALL
      SELECT g.id 
      FROM \`Group\` g
      INNER JOIN group_hierarchy gh ON g.parent_id = gh.id
    )
    SELECT id FROM group_hierarchy;
  `;
  return result.map((r) => Number(r.id));
}

// 그룹 ID를 받아 해당 그룹과 하위 그룹의 ID 목록을 반환하는 함수
async function subgroupIds(groupId) {
  const groups = await prisma.group.findMany({
    where: { parent_id: groupId },
    select: { id: true },
  });

  const descendantIds = groups.map((group) => group.id);

  return descendantIds;
}

router.get("/getGroupDepth/:id", async (req, res) => {
  const groupId = Number(req.params.id);

  try {
    const depth = await getGroupDepth(groupId);
    res.json({ groupId, depth });
  } catch (error) {
    console.error("그룹 뎁스를 가져오는 중 오류 발생:", error);
    res.status(500).json({ error: "그룹 뎁스를 가져오지 못했습니다." });
  }
});

async function getGroupDepth(groupId, depth = 1) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { parent_id: true },
  });

  if (!group || !group.parent_id) {
    return depth;
  }

  return getGroupDepth(group.parent_id, depth + 1);
}

router.post("/addOneModule", async (req, res) => {
  const { name, sn, group_id, user_id } = req.body;
  console.log("수신된 데이터:", name, sn, group_id, user_id);
  try {
    const existedSn = await prisma.pc.findFirst({
      where: { serial_number: sn },
    });
    // SN이 이미 존재하는 경우
    if (existedSn) {
      return res
        .status(400)
        .json({ message: `이미 등록된 SN입니다. SN: ${sn}` });
    }
    const [newModule, newChangesLog] = await prisma.$transaction([
      prisma.pc.create({
        data: {
          name,
          serial_number: sn,
          group_id,
          ts: new Date(),
        },
      }),
      prisma.changesLog.create({
        data: {
          description: `모듈 등록[${sn}]`,
          item: "모듈등록",
          user_id,
          timestamp: new Date(),
        },
      }),
    ]);

    res.status(201).json({
      message: `[${sn}]모듈이 성공적으로 등록되었습니다.`,
    });
  } catch (error) {
    console.error("모듈 등록중 오류 발생:", error);
    return res.status(500).json({ error: "모듈 등록중 오류 발생" });
  }
});

module.exports = router;
