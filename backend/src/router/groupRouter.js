const express = require("express");
const { prisma } = require("../../utils/prisma");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Group
 *   description: 그룹 관리 API
 */

/**
 * @swagger
 * /api/getGroup:
 *   get:
 *     summary: 모든 그룹 조회
 *     description: 그룹 목록을 조회합니다.
 *     tags: [Group]
 *     responses:
 *       200:
 *         description: 그룹 목록을 반환합니다.
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
 *                   name:
 *                     type: string
 *                     example: "그룹1"
 *                   parent_id:
 *                     type: integer
 *                     example: null
 */
router.get("/getGroup", async (req, res) => {
  try {
    const groups = await prisma.group.findMany();
    res.json(groups);
  } catch (error) {
    console.error(error);
  }
});

/**
 * @swagger
 * /api/getGroupById/{id}:
 *   get:
 *     summary: 특정 그룹 조회
 *     description: 그룹 ID로 특정 그룹을 조회합니다.
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 그룹 ID
 *     responses:
 *       200:
 *         description: 해당 그룹 정보를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "그룹1"
 *                 parent_id:
 *                   type: integer
 *                   example: null
 */
router.get("/getGroupById/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const group = await prisma.group.findUnique({
      where: {
        id: Number(id),
      },
    });
    res.json(group);
  } catch (error) {
    console.error(error);
  }
});

/**
 * @swagger
 * /api/addGroup:
 *   post:
 *     summary: 그룹 추가
 *     description: 새로운 그룹을 추가합니다.
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 추가할 그룹의 이름
 *                 example: "새 그룹"
 *               parent_id:
 *                 type: integer
 *                 description: 상위 그룹 ID (최상위 그룹일 경우 null)
 *                 example: null
 *     responses:
 *       200:
 *         description: 그룹이 성공적으로 추가되었습니다.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Group 추가완료"
 */
router.post("/addGroup", async (req, res) => {
  const { name, parent_id } = req.body;
  console.log(name, parent_id);
  try {
    await prisma.group.create({
      data: {
        name: name,
        parent_id: parent_id,
      },
    });
    res.send("Group 추가완료");
  } catch (error) {
    console.error(error);
  }
});

/**
 * @swagger
 * /api/updateGroup:
 *   put:
 *     summary: 그룹명 수정
 *     description: 그룹명을 수정합니다.
 *     tags: [Group]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 수정할 그룹의 ID
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: 수정할 그룹명
 *                 example: "수정된 그룹명"
 *     responses:
 *       200:
 *         description: 그룹명이 성공적으로 수정되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "그룹명 수정 완료"
 */
router.put("/updateGroup", async (req, res) => {
  const { id, name } = req.body;
  console.log(id, name);
  try {
    await prisma.group.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name,
      },
    });
    res.status(200).json("그룹명 수정 완료");
  } catch (error) {
    console.error(error);
  }
});

/**
 * @swagger
 * /api/deleteGroup/{id}:
 *   delete:
 *     summary: 그룹 삭제
 *     description: 특정 그룹을 삭제합니다.
 *     tags: [Group]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 그룹 ID
 *     responses:
 *       200:
 *         description: 그룹이 성공적으로 삭제되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "그룹 삭제 완료"
 */
router.delete("/deleteGroup/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  // try {
  //   await prisma.group.delete({
  //     where: {
  //       id: Number(id),
  //     },
  //   });
  //   res.status(200).json("그룹 삭제 완료");
  // } catch (error) {
  //   console.error(error);
  // }
  res.status(200).json("그룹 삭제 완료");
});

module.exports = router;
