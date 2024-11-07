import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/constants";

const EditBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API_URL}/detailBoard/${id}`);
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (error) {
        console.error("게시글 정보를 불러오는데 실패했습니다:", error);
        alert("게시글 정보를 불러올 수 없습니다.");
      }
    };
    fetchPost();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/editBoard/${id}`, {
        title,
        content,
        user_id: localStorage.getItem("user_id"),
      });
      navigate(`/detailBoard/${id}`);
    } catch (error) {
      console.error("게시글 수정 실패:", error);
      alert("게시글 수정에 실패했습니다.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        게시글 수정
      </Typography>
      <TextField
        label="제목"
        fullWidth
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label="내용"
        fullWidth
        multiline
        rows={10}
        variant="outlined"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleUpdate}>
        수정 완료
      </Button>
    </Box>
  );
};

export default EditBoard;
