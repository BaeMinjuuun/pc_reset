import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/constants";
import { useSelector } from "react-redux";

const WriteBoard = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();
  const user_id = useSelector((state) => state.auth.user_id);

  const handleSubmit = async () => {
    try {
      if (!title.trim() || !content.trim()) {
        alert("제목과 내용을 모두 입력해주세요.");
        return;
      }

      await axios.post(`${API_URL}/writeBoard`, {
        title,
        content,
        user_id,
      });
      navigate("/board");
    } catch (error) {
      console.error("게시글 작성 실패:", error);
      alert("게시글 작성에 실패했습니다.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          글쓰기
        </Typography>
        <TextField
          label="제목"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="내용"
          fullWidth
          multiline
          rows={15}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => navigate("/board")}>
            취소
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            등록
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default WriteBoard;
