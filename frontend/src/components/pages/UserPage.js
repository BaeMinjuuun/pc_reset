import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Pagination,
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config/constants";
import UserModal from "./UserModal"; // 새로 만든 모달 컴포넌트
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";

const ITEMS_PER_PAGE = 100; // 한 페이지에 보여줄 사용자 수 설정

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const [totalPages, setTotalPages] = useState(0); // 총 페이지 수 상태
  const [searchQuery, setSearchQuery] = useState(""); // 검색어 상태 추가

  // 사용자를 불러오는 함수 (페이지와 페이지당 항목 수에 맞게)
  const fetchUsers = async (page = 1, search = "") => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        params: {
          page,
          size: ITEMS_PER_PAGE,
          search, // 검색어를 요청 파라미터로 추가
        },
        withCredentials: true,
      });
      if (response.status === 200 && response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages); // 총 페이지 수 업데이트
      } else {
        console.error("Failed to fetch users:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // 페이지가 변경될 때 호출되는 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value); // 페이지 상태 업데이트
    fetchUsers(value, searchQuery); // 해당 페이지의 데이터 가져오기
  };

  // 검색어가 변경될 때 호출되는 핸들러
  const handleSearchQuery = (query) => {
    setSearchQuery(query); // 검색어 상태 업데이트
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchUsers(1, query); // 검색어에 맞는 데이터를 첫 페이지에서 불러옴
  };

  useEffect(() => {
    fetchUsers(currentPage, searchQuery); // 컴포넌트가 마운트될 때 및 페이지나 검색어가 변경될 때 데이터 불러오기
  }, [currentPage, searchQuery]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (updatedUser) => {
    console.log("Sending data:", updatedUser); // 디버깅용 로그 추가
    try {
      const response = await axios.put(
        `${API_URL}/users/${updatedUser.user_id}`,
        updatedUser,
        { withCredentials: true }
      );
      if (response.status === 200 && response.data.success) {
        setUsers(
          users.map((user) =>
            user.user_id === updatedUser.user_id ? updatedUser : user
          )
        );
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`, {
        withCredentials: true,
      });
      if (response.status === 200 && response.data.success) {
        setUsers(users.filter((user) => user.user_id !== userId)); // 삭제된 사용자를 목록에서 제거
        setIsModalOpen(false); // 모달 닫기
      } else {
        console.error("Failed to delete user:", response.data.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <Box p={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between", // 양쪽 끝에 배치
          alignItems: "center",
          mb: 2, // margin-bottom for spacing
        }}
      >
        <Typography variant="h6" gutterBottom>
          회원 목록
        </Typography>
        <Box
          sx={{
            display: "flex",
          }}
        >
          <Link to="/board">
            <Button variant="contained" color="primary" size="small">
              게시판
            </Button>
          </Link>
          <SearchBar onSearch={handleSearchQuery} /> {/* 검색어 처리 */}
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>권한</TableCell>
              <TableCell>액션</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.user_id}>
                <TableCell>{(currentPage - 1) * 100 + index + 1}</TableCell>{" "}
                {/* 현재 페이지의 No 계산 */}
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.authority}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleEditClick(user)}
                  >
                    수정
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 컴포넌트 */}
      <Box display="flex" justifyContent="center" marginTop="20px">
        <Pagination
          count={totalPages} // 총 페이지 수
          page={currentPage} // 현재 페이지
          onChange={handlePageChange} // 페이지 변경 핸들러
          color="primary"
        />
      </Box>

      <UserModal
        open={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
      />
    </Box>
  );
};

export default UserPage;
