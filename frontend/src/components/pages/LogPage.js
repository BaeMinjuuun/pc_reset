import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Pagination,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config/constants";
import dayjs from "dayjs";
import ReportSearchFilter from "./ReportSearchFilter";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const LogPage = () => {
  const [logData, setLogData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  const { id } = useParams();

  // 필터 상태를 하나의 객체로 통합하여 관리
  const [filters, setFilters] = useState([]);
  // 그룹 ID가 변경될 때 필터 초기화
  useEffect(() => {
    setFilters({
      groupId: id,
      period: "3개월",
      status: "전체",
      startDate: dayjs().subtract(3, "month"),
      endDate: dayjs(),
      searchQuery: "",
      filterBy: "PC",
    });
    setCurrentPage(1); // 페이지 초기화
  }, [id]);

  // 필터링된 데이터를 백엔드에서 가져오는 함수

  const fetchLogData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/getLog`,
        { filters, logsPerPage },
        { params: { page: currentPage } }
      );
      console.log("response:", response);
      setLogData(response.data.logs);
      setTotalLogs(response.data.totalLogs);
      setIsLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // 필터나 페이지가 변경될 때마다 데이터를 다시 가져옴
  useEffect(() => {
    fetchLogData();
  }, [filters, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // `ReportSearchFilter`에서 필터와 검색어 변경 시 호출되는 핸들러
  const handleSearch = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const navigate = useNavigate();

  return (
    <div>
      <ReportSearchFilter onSearch={handleSearch} />

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table
          sx={{
            "& .MuiTableCell-root": {
              textAlign: "center",
              padding: "3px",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>PC Name</TableCell>
              <TableCell>SN</TableCell>
              <TableCell>Group Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // 로딩 중일 때 스켈레톤 표시
              <>
                {[...Array(5)].map((_, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {[...Array(6)].map((_, colIndex) => (
                      <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                        <Skeleton
                          sx={{ display: "inline-block", width: "50px" }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : logData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: "center" }}>
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              logData.map((log, index) => (
                <TableRow
                  key={log.id}
                  hover
                  onClick={() => navigate(`/pcLog/${log.pc_id}`)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <TableCell>
                    {(currentPage - 1) * logsPerPage + index + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      color:
                        log.status === "Shutdown"
                          ? "red"
                          : log.status === "Warning"
                          ? "orange"
                          : log.status === "Unknown"
                          ? "gray"
                          : log.status === "Normal"
                          ? "#2ec200"
                          : "inherit",
                    }}
                  >
                    {log.status}
                  </TableCell>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.pc?.name || "N/A"}</TableCell>
                  <TableCell>{log.pc?.serial_number || "N/A"}</TableCell>
                  <TableCell>{log.pc?.group?.name || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" marginTop="20px">
        <Pagination
          count={Math.ceil(totalLogs / logsPerPage)} // 페이지 수 계산
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </div>
  );
};

export default LogPage;
