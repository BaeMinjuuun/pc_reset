const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger 설정 옵션
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "PReM API Documentation",
      version: "1.0.0",
      description: "API documentation",
    },
    servers: [
      {
        url: "http://localhost:8130", // 당신의 서버 URL
        description: "Local server",
      },
    ],
  },
  // API 파일 경로, 실제 API가 정의된 곳
  apis: ["./src/router/*.js"],
};

// Swagger JSDoc 설정으로 스펙 생성
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Swagger 설정을 내보내기
module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
