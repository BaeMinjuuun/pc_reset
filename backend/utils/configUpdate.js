const { prisma } = require("./prisma");

const getTimeOverValue = async (key) => {
  const setting = await prisma.config.findFirst({
    where: { key: key },
  });
  return setting ? parseInt(setting.value) : 300;
};

module.exports = { getTimeOverValue };
