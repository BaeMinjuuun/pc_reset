const express = require("express");
const { prisma } = require("../../utils/prisma");

const router = express.Router();

/**
 * @swagger
 * tags:
 *  name: Log
 * description: 로그 관리 API
 */

/**
 * @swagger
 * /api/getLog:
 *   post:
 *     summary: 로그 조회
 *     tags: [Log]
 *     description: 그룹, 기간, 상태와 같은 필터를 기반으로 로그를 조회합니다. 조회된 로그에는 관련된 PC와 그룹 정보가 포함됩니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 type: object
 *                 properties:
 *                   groupId:
 *                     type: integer
 *                     description: 로그를 필터링할 그룹의 ID
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     description: "로그 조회 시작 날짜 예: '2024-01-01'"
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     description: "로그 조회 종료 날짜 예: '2024-12-31'"
 *                   status:
 *                     type: string
 *                     description: "로그 상태를 필터링합니다. 특정 상태 예: 'Normal', 'Shutdown', 'Warning' 또는 비정상 상태 'NOT Normal'을 선택할 수 있습니다."
 *     responses:
 *       200:
 *         description: 필터링된 로그 목록을 반환합니다.
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
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-10-24T10:48:08.000Z"
 *                   status:
 *                     type: string
 *                     example: "Shutdown"
 *                   pc:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "PC22"
 *                       serial_number:
 *                         type: string
 *                         example: "SN000022"
 *                       group:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "장비1"
 *       500:
 *         description: "로그 조회 중 서버 오류가 발생했을 때의 응답"
 */
router.post("/getLog", async (req, res) => {
  let { filters, logsPerPage } = req.body;
  const { page } = req.query;
  // console.log("page:", page);
  const limit = logsPerPage;
  const currentPage = parseInt(page) || 1;

  try {
    const where = {};

    // 그룹 ID 필터 추가
    if (filters.groupId) {
      const groupIds = await prisma.$queryRaw`
        WITH RECURSIVE GroupHierarchy AS (
          SELECT id, parent_id
          FROM \`Group\`
          WHERE id = ${parseInt(filters.groupId)}

          UNION ALL

          SELECT g.id, g.parent_id
          FROM \`Group\` g
          INNER JOIN GroupHierarchy gh ON g.parent_id = gh.id
        )
        SELECT id FROM GroupHierarchy;
      `;

      const groupIdsArray = groupIds.map((group) => group.id);

      where.pc = {
        group_id: { in: groupIdsArray },
      };
    }

    // 기간 필터 추가
    if (filters.startDate && filters.endDate) {
      where.timestamp = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    // 상태 필터 추가
    if (filters.status && filters.status !== "전체") {
      if (filters.status === "NOT Normal") {
        where.status = {
          notIn: ["Normal"],
        };
      } else if (Array.isArray(filters.status)) {
        where.status = {
          in: filters.status,
        };
      } else {
        where.status = filters.status;
      }
    }

    // 검색어 필터 추가
    if (filters.searchQuery) {
      where.OR = [
        { pc: { name: { contains: filters.searchQuery } } }, // PC 이름 검색
        { pc: { serial_number: { contains: filters.searchQuery } } }, // 시리얼 번호 검색
      ];
    }

    // 전체 로그 수를 구함
    const totalLogs = await prisma.log.count({ where });

    // 필터링된 모든 로그 가져오기
    const logs = await prisma.log.findMany({
      where,
      include: {
        pc: {
          include: {
            group: true, // 그룹 정보를 포함
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip: (currentPage - 1) * limit, // 페이지네이션: 현재 페이지에 맞는 로그 스킵
      take: limit, // 현재 페이지에 해당하는 로그 수 제한
    });
    // console.log("logs:", logs);
    res.json({ logs, totalLogs }); // 필터링된 전체 데이터를 반환
  } catch (error) {
    console.error("Error fetching filtered logs:", error);
    res.status(500).send("서버 오류가 발생했습니다.");
  }
});

router.get("/getPcLogs/:pcId", async (req, res) => {
  const { pcId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // PC 정보 조회
    const pcInfo = await prisma.pc.findUnique({
      where: { id: parseInt(pcId) },
    });

    // 시작 날짜와 종료 날짜에 시간을 추가
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // 해당 PC의 로그 데이터 조회 (날짜 필터 적용)
    const logs = await prisma.log.findMany({
      where: {
        pc_id: parseInt(pcId),
        timestamp: {
          gte: startDateTime, // 시작 날짜의 00:00:00
          lte: endDateTime, // 종료 날짜의 23:59:59
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    res.json({ logs, pcInfo });
  } catch (error) {
    console.error("Error fetching PC logs:", error);
    res.status(500).send("서버 오류가 발생했습니다.");
  }
});

module.exports = router;
