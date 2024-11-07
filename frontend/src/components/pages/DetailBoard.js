import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/constants";

const DetailBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const userResponse = await axios.get(`${API_URL}/users`, {
          withCredentials: true,
        });
        setCurrentUser(userResponse.data.currentUser);

        const response = await axios.get(`${API_URL}/detailBoard/${id}`, {
          params: {
            userId: userResponse.data.currentUser?.user_id,
          },
        });
        setPost(response.data);
      } catch (error) {
        console.error("게시글 상세 조회 실패:", error);
        alert("게시글을 불러올 수 없습니다.");
      }
    };
    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await axios.delete(`${API_URL}/deleteBoard/${id}`);
        navigate("/board");
      } catch (error) {
        console.error("게시글 삭제 실패:", error);
        alert("게시글 삭제에 실패했습니다.");
      }
    }
  };

  if (!post || !currentUser) return null;

  // 작성자이거나 admin인 경우에만 수정/삭제 버튼 표시
  const isAuthorized =
    post.user_id === currentUser.user_id || currentUser.authority === 2;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {post.title}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            작성자: {post.user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            작성일: {new Date(post.time_stamp).toLocaleString()} | 조회수:{" "}
            {post.view_cnt}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ minHeight: "300px", whiteSpace: "pre-wrap" }}>
          {post.content}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => navigate("/board")}>
            목록
          </Button>
          {isAuthorized && (
            <Button
              variant="contained"
              onClick={() => navigate(`/editBoard/${id}`)}
            >
              수정
            </Button>
          )}
          {isAuthorized && (
            <Button variant="outlined" color="error" onClick={handleDelete}>
              삭제
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DetailBoard;
