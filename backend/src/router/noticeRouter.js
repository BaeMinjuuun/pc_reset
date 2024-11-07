const express = require("express");
const { prisma } = require("../../utils/prisma");
const router = express.Router();

// 게시글 목록 조회
router.get("/Board", async (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    searchQuery = "",
    searchType = "title",
  } = req.query;

  try {
    // 검색 조건 설정
    const where = {};
    if (searchQuery) {
      if (searchType === "writer") {
        where.user = {
          name: {
            contains: searchQuery,
          },
        };
      } else {
        where[searchType] = {
          contains: searchQuery,
        };
      }
    }

    // 게시글 조회
    const notices = await prisma.notice.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { time_stamp: "desc" },
      include: { user: true },
    });

    // 전체 게시글 수 조회
    const total = await prisma.notice.count({ where });

    res.json({ notices, total });
  } catch (error) {
    console.error("게시글 목록 조회 오류:", error);
    res.status(500).json({ error: "게시글 목록을 가져오는데 실패했습니다." });
  }
});

// 게시글 작성
router.post("/writeBoard", async (req, res) => {
  const { title, content, user_id } = req.body;
  try {
    // 입력값 검증
    if (!title || !content || !user_id) {
      return res.status(400).json({ error: "필수 입력값이 누락되었습니다." });
    }

    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        user_id: user_id,
        time_stamp: new Date(), // 현재 시간 추가
        view_cnt: 0, // 초기 조회수
      },
      include: {
        // 생성된 게시글의 사용자 정보도 함께 반환
        user: true,
      },
    });

    res.status(201).json(newNotice);
  } catch (error) {
    console.error("게시글 작성 오류:", error);
    res.status(400).json({ error: "게시글 작성 중 오류가 발생했습니다." });
  }
});

// 게시글 상세 조회
router.get("/detailBoard/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // 현재 조회하는 사용자의 ID

  try {
    // 먼저 게시글 조회
    const notice = await prisma.notice.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!notice) {
      return res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
    }

    // 현재 사용자가 작성자가 아닌 경우에만 조회수 증가
    if (notice.user_id !== userId) {
      const updatedNotice = await prisma.notice.update({
        where: { id: parseInt(id) },
        data: { view_cnt: { increment: 1 } },
        include: { user: true },
      });
      return res.json(updatedNotice);
    }

    // 작성자인 경우 조회수 증가 없이 반환
    res.json(notice);
  } catch (error) {
    console.error("게시글 상세 조회 오류:", error);
    res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
  }
});

// 게시글 수정
router.put("/editBoard/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, user_id } = req.body;
  try {
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
    res.json(notice);
  } catch (error) {
    res.status(400).json({ error: "게시글 수정 오류" });
  }
});

// 게시글 삭제
router.delete("/deleteBoard/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notice.delete({ where: { id: parseInt(id) } });
    res.json({ message: "게시글이 삭제되었습니다." });
  } catch (error) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다" });
  }
});

module.exports = router;
