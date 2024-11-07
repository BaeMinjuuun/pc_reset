const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8150;

app.use(bodyParser.json());

// reset message를 받는 엔드포인트
app.post("/reset", (req, res) => {
  try {
    const resetData = req.body;
    // console.log("resetData", resetData);
    res.status(200).json({
      action: "[" + resetData.SN + `] 리셋`,
      resetData: resetData,
    });
  } catch (error) {
    console.error("Error processing /reset_message:", error);
    res.status(500).json({ action: "서버 오류로 인한 리셋 불가" });
  }
});

// setting message를 받는 엔드포인트
app.put("/setting", (req, res) => {
  const settingData = req.body;
  // console.log("settingData", settingData);
  res.status(200).json({ message: "설정 데이터 수신 완료", settingData });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃   Agent Server listening on port: ${PORT}    ┃
  ┃           http://localhost:${PORT}           ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `);
});
