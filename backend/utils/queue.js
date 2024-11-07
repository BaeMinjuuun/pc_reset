const { prisma } = require("./prisma");

class UpdateQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.BATCH_SIZE = 100; // 한 번에 처리할 항목 수
    this.PROCESS_INTERVAL = 1000; // 처리 간격
    this.startProcessing();
    this.MAX_QUEUE_SIZE = 10000; // 최대 큐 크기 제한
  }

  add(items) {
    if (Array.isArray(items)) {
      this.queue.push(...items);
    } else {
      this.queue.push(items);
    }
    if (this.queue.length + items.length > this.MAX_QUEUE_SIZE) {
      console.warn("큐 크기 제한 초과");
    }
  }

  size() {
    return this.queue.length;
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.BATCH_SIZE);

        await prisma.$transaction(async (tx) => {
          const serialNumbers = batch.map((item) => item.SN);

          // 존재하는 PC 확인
          const existingPCs = await tx.pc.findMany({
            where: {
              serial_number: {
                in: serialNumbers,
              },
            },
            select: {
              serial_number: true,
            },
          });

          const existingSNs = new Set(
            existingPCs.map((pc) => pc.serial_number)
          );
          const validUpdates = batch.filter((update) =>
            existingSNs.has(update.SN)
          );

          console.log("validUpdates:", validUpdates);

          // 배치 업데이트 수행
          await Promise.all(
            validUpdates.map((update) =>
              tx.pc.update({
                where: { serial_number: update.SN },
                data: {
                  status: update.status,
                  ts: new Date(),
                  ip: update.ip,
                },
              })
            )
          );
        });

        console.log(`${batch.length}개의 업데이트 처리 완료`);
      }
    } catch (error) {
      console.error("큐 처리 중 오류:", error);
    } finally {
      this.processing = false;
    }
  }

  startProcessing() {
    setInterval(() => {
      this.process();
    }, this.PROCESS_INTERVAL);
  }
}

module.exports = { UpdateQueue };
