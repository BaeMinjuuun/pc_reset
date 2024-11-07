const { argv } = require("process");
const axios = require("axios");

const NUM_EMULATORS = 360; // 에뮬레이터 수
const SEND_INTERVAL = 5000;
const retryCount = 0;
const SERVER_URL = "http://himsr2.iptime.org:48130/api/report"; // 서버 엔드포인트 (실제 주소로 변경 필요)

const NUM = Number(process.argv[2]);
const PROCESS_ID = process.pid;
console.log(`PID: ${PROCESS_ID} NUM: ${NUM} `);

const INTERVAL_NUM = 5000; // 초마다 반복
let failCount = 0; // 전송 실패 개수

// 실패 로그 기록 함수
const failLog = (message, error) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${PROCESS_ID}] 실패: ${failCount}\n`;

  try {
    fs.appendFileSync(failLogFilePath, logMessage);
  } catch (err) {
    console.error("로그 기록 중 오류:", err);
  }
};

function padNumber(num, size) {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
}

// 에뮬레이터 데이터 생성
function createData(emulatorId) {
  const mainSN = `SN${padNumber(emulatorId, 6)}`;
  const mainIP = `192.168.0.${emulatorId}`;

  const subSN = `SN${padNumber(emulatorId + 1, 6)}`;
  const subIP = `192.168.0.${emulatorId + 1}`;

  const data = {
    SN: mainSN,
    status: { BOARD: "OK", PC: "OK" },
    ip: mainIP,
    sub: [
      {
        SN: subSN,
        status: { BOARD: "OK", PC: "OK" },
        ip: subIP,
      },
    ],
  };

  return data;
}

function show_message(data, response) {
  process.stdout.write(
    `PID: [${process.pid}] Emulator ${emulatorId} sent: ${JSON.stringify(
      data
    )} | Res[${response.status}]\n`
    // '.'
  );
}
// 데이터를 서버로 전송
async function sendData(data, emulatorId) {
  try {
    const response = await axios.put(SERVER_URL, data);
    console.log(`PID: [${process.pid}] Emulator ${emulatorId}`);
  } catch (error) {
    console.error(`Emulator ${emulatorId} error: ${error.message}`);
    if (retryCount < 3) {
      // console.log(`Emulator ${emulatorId} retrying... (${retryCount + 1})`);
      process.stdout.write("X");
      setTimeout(() => {
        sendData(data, emulatorId, retryCount + 1);
      }, 2000); // 2초 후 재시도
    } else {
      failCount++;
      console.error(
        `Emulator ${emulatorId} failed to send data after 3 retries.`
      );
    }
  }
}

for (let i = 1; i <= NUM_EMULATORS; i++) {
  const data = createData(i);

  sendData(data, i);

  setInterval(() => {
    sendData(data, i);
  }, SEND_INTERVAL);
}

setInterval(failLog, INTERVAL_NUM);
