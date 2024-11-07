const express = require("express");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const swaggerSetup = require("./swagger");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// 환경에 따른 .env 파일 로드
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.development" });
}

if (cluster.isPrimary) {
  console.log(`마스터 프로세스 ${process.pid} 실행 중`);

  // 워커 수 제한
  const workerCount = Math.max(2, Math.min(Math.floor(numCPUs / 2), 4));

  for (let i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`워커 ${worker.process.pid} 종료됨`);
    console.log("새로운 워커 생성 중...");
    cluster.fork();
  });

  cluster.on("online", (worker) => {
    console.log(`워커 ${worker.process.pid} 온라인`);
  });
} else {
  const app = express();

  app.use(cookieParser());
  app.use(
    cors({
      origin: true, // 모든 도메인에서의 요청 허용
      credentials: true, // 쿠키 허용
    })
  );

  const PORT = process.env.PORT || 3000;
  const PROJECT_ROOT = path.join(__dirname, "..");
  const REACT_BUILD_PATH = path.join(PROJECT_ROOT, "frontend", "build");
  // const REACT_404_BUILD_PATH = path.join(PROJECT_ROOT, "frontend", "public");

  app.use(express.static(REACT_BUILD_PATH));

  // app.use(express.json());
  app.use(express.json({ limit: "10mb" })); // 요청 크기를 10MB로 설정
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // 라우터 명시
  const groupRouter = require("./src/router/groupRouter");
  const pcRouter = require("./src/router/pcRouter");
  const userRouter = require("./src/router/userRouter");
  const logRouter = require("./src/router/logRouter");
  const locationRotuer = require("./src/router/locationRouter");
  const statusUpdateRouter = require("./src/router/statusUpdateRouter");
  const sendMessageRouter = require("./src/router/sendMessageRouter");
  const settingRouter = require("./src/router/settingRouter");
  const configRouter = require("./src/router/configRouter");
  const changesLogRouter = require("./src/router/changesLogRouter");
  const noticeRouter = require("./src/router/noticeRouter");
  const statusTest = require("./src/router/statusTest");

  // 라우터 등록
  app.use("/api", groupRouter);
  app.use("/api", pcRouter);
  app.use("/api", locationRotuer);
  app.use("/api", statusUpdateRouter);
  app.use("/api", sendMessageRouter);
  app.use("/api", settingRouter);
  app.use("/api", configRouter);
  app.use("/api", changesLogRouter);
  app.use("/api", statusTest);

  // 대원 유저 작업
  app.use("/api", userRouter);

  // 관현 라우터
  app.use("/api", logRouter);
  app.use("/api", noticeRouter);
  swaggerSetup(app);

  app.get("*", (req, res) => {
    res.sendFile(path.join(REACT_BUILD_PATH, "index.html"));
  });

  // 잘못된 경로 처리
  // app.get("*", (req, res) => {
  //   res.sendFile(path.join(REACT_404_BUILD_PATH, "404.html"));
  // });
  app.listen(PORT, () => {
    console.log(`
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃   Server listening on port: ${PORT}    ┃
  ┃     http://localhost:${PORT}           ┃
  ┃     PID:${process.pid}           ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `);
  });

  // 프로세스 종료 시 Prisma 연결 정리
  process.on("SIGTERM", async () => {
    console.log("서버 종료 중...");
    await prisma.$disconnect();
    process.exit(0);
  });
}
