import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Pagination,
  Container,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/constants";
import AttachFileIcon from "@mui/icons-material/AttachFile";

const BoardPage = () => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/Board`, {
          params: {
            page: currentPage,
            pageSize: itemsPerPage,
            searchQuery,
            searchType,
          },
        });
        setPosts(response.data.notices);
        setTotalPosts(response.data.total);
      } catch (error) {
        console.error("게시글을 가져오는데 실패했습니다:", error);
      }
    };
    fetchPosts();
  }, [currentPage, searchQuery, searchType]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFileClick = async (e) => {
    e.stopPropagation();
    try {
      const response = await axios.get(`${API_URL}/download-format/board`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "board_test.txt");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5">게시판</Typography>
          <Button variant="contained" onClick={() => navigate("/writeBoard")}>
            글쓰기
          </Button>
        </Box>

        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            alignItems: "center",
          }}
        >
          <Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{ width: 120 }}
          >
            <MenuItem value="title">제목</MenuItem>
            <MenuItem value="content">내용</MenuItem>
            <MenuItem value="writer">작성자</MenuItem>
          </Select>
          <TextField
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            sx={{ flexGrow: 1 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50%">제목</TableCell>
                <TableCell align="center">작성자</TableCell>
                <TableCell align="center">작성일</TableCell>
                <TableCell align="center">조회수</TableCell>
                <TableCell align="center">첨부파일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  hover
                  onClick={() => navigate(`/detailBoard/${post.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{post.title}</TableCell>
                  <TableCell align="center">{post.user?.name}</TableCell>
                  <TableCell align="center">
                    {formatDate(post.time_stamp)}
                  </TableCell>
                  <TableCell align="center">{post.view_cnt}</TableCell>
                  <TableCell align="center">
                    <AttachFileIcon
                      onClick={(e) => {
                        handleFileClick(e);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={Math.ceil(totalPosts / itemsPerPage)}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default BoardPage;
