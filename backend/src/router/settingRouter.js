const express = require("express");
const path = require("path");
const fs = require("fs");
const { prisma } = require("../../utils/prisma");
const bcryptjs = require("bcryptjs");
const axios = require("axios");
const csv = require("csv-parser");
const { AGENT_URL, MODULE_BATCH_SIZE } = require("../../data/config");

const router = express.Router();

const findGroupIdByPath = async (groupPath) => {
  const groups = groupPath.split("/");
  let parentId = null;

  for (let groupName of groups) {
    // 현재 그룹의 이름과 부모 ID로 그룹을 찾음
    const group = await prisma.group.findFirst({
      where: {
        name: groupName,
        parent_id: parentId,
      },
    });
    if (!group) {
      throw new Error(`그룹 ${groupName}을(를) 찾을 수 없습니다.`);
    }
    parentId = group.id;
  }
  return parentId;
};

/**
 * @swagger
 * tags:
 *   name: Module
 *   description: 모듈 관련 API
 *
 * /api/module-upload-csv:
 *   post:
 *     summary: 모듈 CSV 파일 업로드
 *     description: CSV 파일을 통해 여러 PC 모듈 데이터를 업로드합니다. 그�� 경로를 통해 그룹 ID를 찾아 모듈에 할당합니다.
 *     tags: [Module]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 group_name:
 *                   type: string
 *                   description: "그룹 경로 (예: 그룹1/그룹2)"
 *                 pc_name:
 *                   type: string
 *                   description: PC 이름
 *                   example: "PC1"
 *                 ip:
 *                   type: string
 *                   description: IP 주소
 *                   example: "192.168.0.1"
 *                 mac:
 *                   type: string
 *                   description: MAC 주소
 *                   example: "00:0A:E6:3E:FD:E1"
 *                 period:
 *                   type: integer
 *                   description: 주기 값
 *                   example: 10
 *                 serial_number:
 *                   type: string
 *                   description: 시리얼 번호
 *                   example: "SN123456"
 *     responses:
 *       200:
 *         description: 데이터베이스 저장 완료 메시지
 *       400:
 *         description: 유효하지 않거나 중복된 데이터가 있는 경우 오류 반환
 *       500:
 *         description: 서버 오류
 */
router.post("/module-upload-csv", async (req, res) => {
  const { csvData, user_id } = req.body;
  if (req.body.length === 0) {
    return res.status(400).json({ message: "선택된 csv 데이터가 없습니다." });
  }
  try {
    const filteredData = csvData.filter(
      (item) => item.group_name && item.group_name.trim() !== ""
    );
    // console.log("filteredData => ", filteredData);

    if (filteredData.length === 0) {
      return res.status(400).json({ message: "유효한 그룹이 없습니다." });
    }
    const data = await Promise.all(
      filteredData.map(async (item) => {
        const groupId = await findGroupIdByPath(item.group_name);
        // console.log("groupId", groupId);
        if (!groupId) {
          throw new Error("그룹을 찾을 수 없습니다.");
        }

        return {
          name: item.pc_name,
          ip: item.ip || "",
          mac: item.mac || "",
          period: Number(item.period) || 10,
          // status: item.status || "",
          status: "Unknown",
          group_id: groupId,
          serial_number: item.serial_number,
          ts: new Date(),
        };
      })
    );
    // console.log("data", data);
    // 1. 업로드된 데이터 내에서 중복된 serial_number 찾기
    const serialNumberSet = new Set();
    const duplicatesInData = [];

    for (const item of data) {
      if (serialNumberSet.has(item.serial_number)) {
        duplicatesInData.push(item.serial_number);
      } else {
        serialNumberSet.add(item.serial_number);
      }
    }

    if (duplicatesInData.length > 0) {
      console.log(duplicatesInData);
      return res.status(400).json({
        message: "업로드된 데이터 내에 중복된 시리얼 넘버가 있습니다.",
        duplicatesInData: duplicatesInData,
      });
    }

    // 2. 데이터베이스에 이미 존재하는 serial_number 찾기
    const serialNumbers = data
      .map((item) => item.serial_number)
      .filter(Boolean);

    const existingPcs = await prisma.pc.findMany({
      where: {
        serial_number: {
          in: serialNumbers,
        },
      },
      select: {
        serial_number: true,
      },
    });

    const existingSerialNumbers = existingPcs.map((pc) => pc.serial_number);

    // 중복된 시리얼 넘버가 있는지 확인
    if (duplicatesInData.size > 0 || existingSerialNumbers.length > 0) {
      return res.status(400).json({
        message:
          "중복된 시리얼 넘버가 ��견되었습니다. \n수정 후 다시 업로드 해주세요.",
        duplicatesInData: Array.from(duplicatesInData),
        duplicatesInDB: existingSerialNumbers,
      });
    }

    await prisma.$transaction(async (prisma) => {
      // 3. 중복이 없는 경우 데이터베이스에 저장
      await prisma.pc.createMany({
        data: data,
      });

      // 4. 데이터베이스에 저장과 동시에 changesLog 테이블에 기록
      await prisma.changesLog.create({
        data: {
          item: "모듈일괄등록",
          description: `[${data.length}]개의 데이터 추가`,
          timestamp: new Date(),
          user_id: user_id || "",
        },
      });
    });

    return res.status(200).json("데이터베이스 저장 완료");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 사용자 관련 API
 *
 * /api/user-upload-csv:
 *   post:
 *     summary: 사용자 CSV 파일 업로드
 *     description: CSV 파일을 통해 여러 사용자를 등록합니다. 중복된 아이디나 이메일이 있는지 검증 후 저장합니다.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   description: 사용자 ID
 *                   example: "user01"
 *                 password:
 *                   type: string
 *                   description: 비밀번호
 *                   example: "password123"
 *                 name:
 *                   type: string
 *                   description: 사용자 이름
 *                   example: "홍길동"
 *                 authority:
 *                   type: integer
 *                   description: 권한 값
 *                   example: 1
 *                 email:
 *                   type: string
 *                   description: 이메일 주소
 *                   example: "user01@example.com"
 *                 phone:
 *                   type: string
 *                   description: 전화번호
 *                   example: "010-1234-5678"
 *     responses:
 *       200:
 *         description: 데이터베이스 저장 완료 메시지
 *       400:
 *         description: 유효하지 않거나 중복된 데이터가 있는 경우 오류 반환
 *       500:
 *         description: 서버 오���
 */
router.post("/user-upload-csv", async (req, res) => {
  if (req.body.length === 0) {
    return res.status(400).json({ message: "선택된 csv 데이터가 없습니다." });
  }
  try {
    const data = req.body.map((item) => {
      return {
        user_id: item.user_id,
        password: bcryptjs.hashSync(item.password, 10) || "",
        name: item.name || "",
        authority: Number(item.authority) || 1,
        email: item.email || "",
        phone: item.phone || "",
      };
    });

    // 1. 업로드된 데이터 내에서 중복된 ID 및 이메일 찾기
    const userIdSet = new Set();
    const emailSet = new Set();
    const duplicatesInData = [];
    const duplicatesInEmail = [];

    for (const item of data) {
      if (userIdSet.has(item.user_id)) {
        duplicatesInData.push(item.user_id);
      } else {
        userIdSet.add(item.user_id);
      }

      if (emailSet.has(item.email)) {
        duplicatesInEmail.push(item.email);
      } else {
        emailSet.add(item.email);
      }
    }

    // 중복된 ID 확인
    if (duplicatesInData.length > 0) {
      console.log(duplicatesInData);
      return res.status(400).json({
        message: "업로드된 데이터 내에 중복된 아이디가 있습니다.",
        duplicates: duplicatesInData,
      });
    }

    // 중복된 이메일 확인
    if (duplicatesInEmail.length > 0) {
      console.log(duplicatesInEmail);
      return res.status(400).json({
        message: "업로드된 데이터 내에 중복된 이메일이 있습니다.",
        duplicates: duplicatesInEmail,
      });
    }

    // 2. 데이터베이스에 이미 존재하는 ID 및 이메일 찾기
    const user_ids = data.map((item) => item.user_id);
    const emails = data.map((item) => item.email);

    const existingIds = await prisma.user.findMany({
      where: {
        user_id: {
          in: user_ids,
        },
      },
      select: {
        user_id: true,
      },
    });

    const existingEmails = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    });

    const existingUserId = existingIds.map((user) => user.user_id);
    const existingEmailList = existingEmails.map((user) => user.email);

    // 중복된 아이디 및 이메일이 있는지 확인
    if (
      duplicatesInData.length > 0 ||
      existingUserId.length > 0 ||
      existingEmailList.length > 0
    ) {
      return res.status(400).json({
        message:
          "중복된 아이디나 이메일이 발견되었습니다. \n수정 후 다시 업로드 해주세요.",
        duplicatesInData: Array.from(duplicatesInData),
        duplicatesInDB: existingUserId,
        duplicatesInEmail: existingEmailList,
      });
    }

    // 3. 중복이 없는 경우 데이터베이스에 저장
    await prisma.user.createMany({
      data: data,
    });

    return res.status(200).json("데이터베이스 저장 완료");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 * /api/download-format/{type}:
 *   get:
 *     summary: CSV 포맷 파일 다운로드
 *     description: 모듈 및 사용자 CSV 포맷 파일을 다운로드할 수 있습니다.
 *     tags: [Module, User]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reset-module, user]
 *         description: 다운로드할 파일 유형 (모듈 또는 사용자)
 *     responses:
 *       200:
 *         description: CSV 파일 다운로드 성공
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 파일을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/download-format/:type", (req, res) => {
  const { type } = req.params;
  let filePath;

  if (type === "reset-module") {
    filePath = path.join(__dirname, "../../files/reset_module_format.csv");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    const bom = Buffer.from("\uFEFF", "utf-8");
    const fileStream = fs.createReadStream(filePath);
    res.write(bom);
    fileStream.pipe(res);
  } else if (type === "user") {
    filePath = path.join(__dirname, "../../files/user_format.csv");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    const bom = Buffer.from("\uFEFF", "utf-8");
    const fileStream = fs.createReadStream(filePath);
    res.write(bom);
    fileStream.pipe(res);
  } else if (type === "board") {
    filePath = path.join(__dirname, "../../files/board_test.txt");
    const bom = Buffer.from("\uFEFF", "utf-8");
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment; filename=board_test.txt");
    const fileStream = fs.createReadStream(filePath);
    res.write(bom);
    fileStream.pipe(res);
  } else {
    return res.status(404).send("파일을 찾을 수 없습니다.");
  }
});

/**
 * @swagger
 * /api/setting:
 *   get:
 *     summary: PC 설정 정보 조회
 *     description: 주어진 시리얼 번호를 통해 PC 설정 정보를 조회하고 에이전트 서버로부터 데이터를 가져옵니다.
 *     tags: [PC]
 *     parameters:
 *       - in: query
 *         name: sn
 *         required: true
 *         schema:
 *           type: string
 *           example: "SN123456"
 *         description: PC의 시리얼 번호
 *     responses:
 *       200:
 *         description: PC 설정 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 SN:
 *                   type: string
 *                   example: "SN123456"
 *                 period:
 *                   type: integer
 *                   example: 10
 *       500:
 *         description: 서버 오류
 */
router.get("/setting", async (req, res) => {
  const SN = req.query.SN;
  const IP = req.query.IP;
  const period = req.query.period;
  try {
    const sendData = { SN: SN, period: period };
    console.log("보내는곳 : ", `http://${IP}:8130/setting`, sendData);
    const response = await axios.put(`http://${IP}:8130/setting`, sendData);
    res.status(200).json(response.data);
  } catch (error) {
    // Axios 에러 처리
    if (error.response) {
      console.error(
        "Agent 서버 응답 오류:",
        error.response.status,
        error.response.data
      );
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      console.error("Agent 서버로부터 응답을 받지 못했습니다:", error.request);
      res.status(500).json({
        error: "서버 연결에 실패했습니다. 서버가 실행 중인지 확인하세요.",
      });
    } else {
      console.error("요청 설정 오류:", error.message);
      res.status(500).json({ error: error.message });
    }
  }
});

router.post("/csvUpload/:type", async (req, res) => {
  const type = req.params.type;
  const inputValueArray = req.body.inputValueArray;

  if (type === "module") {
    try {
      let totalSavedCount = 0;
      for (const item of inputValueArray) {
        const filePath = path.join(
          __dirname,
          `../../data/files/module${item}.csv`
        );
        let batch = []; // 배치 저장 배열
        let isFirstRow = true;

        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath, { encoding: "utf8" })
            .pipe(
              csv({
                headers: ["group_name", "pc_name", "mac", "serial_number"],
              })
            )
            .on("data", async (row) => {
              if (isFirstRow) {
                isFirstRow = false; // 첫 번째 줄은 무시
                return;
              }
              try {
                const groupId = await findGroupIdByPath2(row.group_name);

                if (!groupId) {
                  throw new Error(
                    `그룹을 찾을 수 없습니다: ${row["group_name"]}`
                  );
                }
                batch.push({
                  name: row.pc_name,
                  ip: row.ip || "",
                  mac: "",
                  period: Number(row.period) || 10,
                  status: "Unknown",
                  group_id: groupId, // 비동기 결과 대입
                  serial_number: row.serial_number,
                  ts: new Date(),
                });
                // console.log("batch", batch);
              } catch (error) {
                console.error("group ID 처리 중 오류:", error);
              }
            })
            .on("end", async () => {
              if (batch.length > 0) {
                try {
                  const batchSize = 1000;
                  for (let i = 0; i < batch.length; i += batchSize) {
                    const batchSlice = batch.slice(i, i + batchSize);
                    const result = await prisma.pc.createMany({
                      data: batchSlice,
                    });
                    totalSavedCount += result.count; // 저장된 개수 누적
                    console.log(`저장된 데이터 수: ${result.count}`);
                  }
                } catch (error) {
                  if (error.code === "P2002") {
                    res
                      .status(400)
                      .json({ message: "중복된 시리얼 넘버가 있습니다." });
                  } else {
                    console.error("데이터 저장 중 오류 발생:", error);
                  }
                }
              }
              resolve();
            })
            .on("error", (error) => {
              console.error("CSV 파일 읽기 오류:", error);
              reject(error);
            });
        });
      }
      res.status(200).json({
        message: `${totalSavedCount}개의 모듈이 성공적으로 등록되었습니다.`,
      });
    } catch (error) {
      console.error("CSV 파일 처리 중 오류:", error);
      res.status(500).json({ error: "CSV 파일 처리 중 오류가 발생했습니다." });
    }
  }
});

const findGroupIdByPath2 = async (groupPath) => {
  if (groupPath === "") {
    return null;
  }
  const groups = groupPath.split("/");
  let parentId = null;

  for (let groupName of groups) {
    // 현재 그룹의 이름과 부모 ID로 그룹을 찾음
    const group = await prisma.group.findFirst({
      where: {
        name: groupName,
        parent_id: parentId,
      },
    });
    if (!group) {
      continue;
      throw new Error(`그룹 ${groupName}을(를) 찾을 수 없습니다.`);
    }
    parentId = group.id;
  }
  return parentId;
};

const configFilePath = path.join(
  path.dirname(require.main.filename),
  "data",
  "config.js"
);
const dataFilePath = path.join(
  path.dirname(require.main.filename),
  "data",
  "files"
);

const getSortedFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir(dataFilePath, (err, files) => {
      if (err) {
        console.error("파일을 읽는 중 오류가 발생했습니다:", err);
        reject(err);
        return;
      }
      const sortedFiles = files
        .filter((file) => file.startsWith("module") && file.endsWith(".csv")) // 파일 필터링
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      resolve(sortedFiles);
    });
  });
};

router.get("/getDatafiles", async (req, res) => {
  getSortedFiles().then((files) => {
    console.log(files);
    res.send(files);
  });
});

// config 파일 수정 함수
const configFile = async (fileNum) => {
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

module.exports = router;
