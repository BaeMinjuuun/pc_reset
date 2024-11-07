require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { prisma } = require("../../utils/prisma");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");

const app = express();
app.use(cookieParser());

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관련 API
 */

/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 생성합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: 사용자 ID
 *                 example: "user123"
 *               email:
 *                 type: string
 *                 description: 사용자 이메일
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: 사용자 비밀번호
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *                 example: "홍길동"
 *               phone:
 *                 type: string
 *                 description: 사용자 전화번호
 *                 example: "010-1234-5678"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "회원가입이 완료되었습니다."
 *       400:
 *         description: 잘못된 입력값
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "모든 항목을 채워주세요!"
 */
router.post("/signup", async (req, res) => {
  const { id, email, password, name, phone } = req.body;
  // 입력 값 검증
  if (!id || !email || !password || !name || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "모든 항목을 채워주세요!" });
  }

  try {
    // 비밀번호 해시화
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // 사용자 생성
    await prisma.user.create({
      data: {
        user_id: id,
        email,
        password: hashedPassword,
        name,
        phone,
        authority: 1,
      },
    });

    // 성공적으로 생성된 경우 응답
    res
      .status(201)
      .json({ success: true, message: "회원가입이 완료되었습니다." });
  } catch (error) {
    console.error("Error creating user:", error); // 에러 로그 추가
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "이메일이나 ID가 이미 존재합니다." });
    }
    res.status(500).json({ success: false, message: "서버 에러입니다." });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 로그인
 *     description: 사용자가 로그인하고 JWT 토큰을 발급받습니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: 사용자 ID
 *                 example: "user123"
 *               password:
 *                 type: string
 *                 description: 사용자 비밀번호
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT 토큰
 *                 name:
 *                   type: string
 *                   example: "홍길동"
 *                 user_id:
 *                   type: string
 *                   example: "user123"
 *                 message:
 *                   type: string
 *                   example: "로그인 성공!"
 *       400:
 *         description: 아이디 또는 비밀번호가 잘못됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "아이디 또는 비밀번호가 잘못되었습니다."
 */
router.post("/login", async (req, res) => {
  const { id, password } = req.body;

  try {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { user_id: id },
    });

    // 사용자가 존재하지 않을 때
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "아이디 또는 비밀번호가 잘못되었습니다.",
      });
    }

    // 비밀번호 비교
    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "아이디 또는 비밀번호가 잘못되었습니다.",
      });
    }

    const token = jwt.sign(
      { userId: user.user_id, authority: user.authority },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // 쿠키에 JWT 토큰 저장
    res.cookie("token", token, {
      httpOnly: true, // 클라이언트에서 접근 불가
      // secure: process.env.NODE_ENV === "production", // HTTPS에서만 전송
      secure: false,
      maxAge: 3600000, // 1시간
    });

    // 로그인 성공 시 유저 이름과 함께 응답
    res.status(200).json({
      success: true,
      token,
      name: user.name,
      user_id: user.user_id,
      assigned_group: user.assigned_group,
      message: "로그인 성공!",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "서버 에러입니다." });
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 사용자가 로그아웃하고 JWT 토큰을 제거합니다.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "로그아웃 되었습니다."
 */

router.post("/logout", (req, res) => {
  res.clearCookie("token"); // 'token' 쿠키를 삭제
  res.status(200).json({ success: true, message: "로그아웃 되었습니다." });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 회원 목록 조회
 *     description: 현재 사용자와 함께 모든 회원의 목록을 조회합니다.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 회원 목록을 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "user123"
 *                       email:
 *                         type: string
 *                         example: "user@example.com"
 *                       name:
 *                         type: string
 *                         example: "홍길동"
 *                       phone:
 *                         type: string
 *                         example: "010-1234-5678"
 *                       authority:
 *                         type: integer
 *                         example: 1
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "서버 에러입니다."
 */
router.get("/users", async (req, res) => {
  try {
    const token = req.cookies.token;
    // console.log("token:", token); // 디버깅용 로그 추가
    let currentUser = null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      currentUser = await prisma.user.findUnique({
        where: { user_id: decoded.userId },
        select: {
          user_id: true,
          email: true,
          name: true,
          phone: true,
          authority: true,
          assigned_group: true,
        },
      });
    }

    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        email: true,
        name: true,
        phone: true,
        authority: true,
      },
    });

    res.status(200).json({ success: true, users, currentUser });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "서버 에러입니다." });
  }
});

// 사용자 정보 수정
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { email, name, phone, authority } = req.body;

  try {
    console.log("Received data:", { id, email, name, phone, authority }); // 디버깅용 로그 추가
    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: {
        email,
        name,
        phone,
        authority: parseInt(authority, 10), // authority 값을 Int로 변환
      },
    });
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error); // 오류 로그
    if (error.code === "P2025") {
      // 업데이트하려는 유저가 존재하지 않을 경우 발생하는 오류 코드
      return res
        .status(404)
        .json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }
    res.status(500).json({ success: false, message: "서버 에러입니다." });
  }
});

// 사용자 삭제
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { user_id: id } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "서버 에러입니다." });
  }
});

// 내 정보 가져오기
router.get("/getMyInfo/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: id },
    });

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "서버 에러입니다." });
  }
});

// 내 정보 수정
router.put("/updateMyInfo/:id", async (req, res) => {
  const { id } = req.params;
  const { user_id, email } = req.body;

  if (user_id) {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: user_id, email: email },
    });

    if (existingUser && existingUser.user_id !== id) {
      return res.status(400).json({ error: "해당 아이디는 이미 존재합니다." });
    } else if (existingUser && existingUser.email !== email) {
      return res.status(400).json({ error: "해당 이메일은 이미 존재합니다." });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: req.body,
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
