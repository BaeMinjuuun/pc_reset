import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Pagination,
  Skeleton,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config/constants";
import dayjs from "dayjs";
// import SearchBar from "./SearchBar";
import { useSnackbar } from "notistack";

const Monitoring = () => {
  const { id } = useParams();
  const [pcData, setPcData] = useState([]);
  const [filteredPcData, setFilteredPcData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editedPc, setEditedPc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const [itemsPerPage] = useState(100); // 페이지당 보여줄 항목 수
  const [totalPages, setTotalPages] = useState(0); // 총 페이지 수 상태
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const user_id = useSelector((state) => state.auth.user_id);
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false); // 검색 중인지 확인하는 상태 추가
  const [searchQuery, setSearchQuery] = useState(""); // 검색어 상태 추가
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGroupDepth = async () => {
      try {
        const response = await axios.get(`${API_URL}/getGroupDepth/${id}`);
        const depth = response.data.depth;
        if (depth === 1) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 2) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 3) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 4) {
          navigate(`/monitoring4/${id}`);
        }
      } catch (error) {
        console.error("Error fetching group depth:", error);
      }
    };

    checkGroupDepth();

    const eventSource = new EventSource(`${API_URL}/getPcListWithGroup/${id}`);

    eventSource.onmessage = (event) => {
      setIsLoading(true);
      const receivedData = JSON.parse(event.data);

      const sortedData = receivedData.sort((a, b) => {
        if (a.status === "Shutdown" && b.status !== "Shutdown") return -1;
        if (b.status === "Shutdown" && a.status !== "Shutdown") return 1;

        if (a.status === "Warning" && b.status !== "Warning") return -1;
        if (b.status === "Warning" && a.status !== "Warning") return 1;

        if (a.status === "Normal" && b.status !== "Normal") return -1;
        if (b.status === "Normal" && a.status !== "Normal") return 1;

        if (a.status === "Unknown" && b.status !== "Unknown") return -1;
        if (b.status === "Unknown" && a.status !== "Unknown") return 1;

        return 0;
      });
      setPcData(sortedData);
      setIsLoading(false);

      // 검색 중이라면 필터링을 유지하면서 새 데이터 적용
      if (isSearching && searchQuery.length > 0) {
        const filtered = sortedData.filter((pc) =>
          pc.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPcData(pcData);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      } else {
        // 검색 중이 아니면 전체 데이터를 표시
        setFilteredPcData(sortedData);
        setTotalPages(Math.ceil(sortedData.length / itemsPerPage));
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close(); // 컴포넌트 언마운트 시 연결 종료
    };
  }, [id, isSearching, searchQuery]);

  useEffect(() => {
    if (!isSearching) {
      // 검색 중이 아닐 때만 전체 데이터로 리셋
      setFilteredPcData(pcData); // 필터링된 데이터를 상태로 설정
      setTotalPages(Math.ceil(pcData.length / itemsPerPage)); // 총 페이지 수 계산
    }
  }, [pcData]);

  // const handleSearch = (query) => {
  //   setSearchQuery(query); // 검색어 상태 업데이트
  //   const filtered = pcData.filter((pc) =>
  //     pc.name.toLowerCase().includes(query.toLowerCase())
  //   );
  //   setFilteredPcData(filtered); // 필터링된 데이터를 저장
  //   setTotalPages(Math.ceil(filtered.length / itemsPerPage)); // 필터링된 데이터에 따른 총 페이지 수 계산
  //   setCurrentPage(1); // 검색 시 첫 페이지로 이동
  //   setIsSearching(query.length > 0); // 검색어가 있을 때만 검색 중으로 상태 변경
  // };

  // 현재 페이지에 맞는 데이터를 추출하는 함수
  const paginatedData = filteredPcData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value); // 페이지 상태 업데이트
  };

  const handleRowClick = (pc) => {
    setEditedPc({ ...pc });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditedPc(null);
  };

  const handleSubmit = async () => {
    if (!editedPc) {
      alert("존재하지 않는 pc 입니다.");
      return;
    }

    if (editedPc.status === "Shutdown") {
      setOpenConfirmDialog(true); // 다이얼로그 열기
      return;
    }

    await sendResetSignal();
  };

  const sendResetSignal = async () => {
    let SN = editedPc.serial_number;
    let IP = editedPc.ip;
    let PC_ID = editedPc.id;
    let ID = user_id;
    console.log(SN, ID, IP, PC_ID);
    try {
      await axios.post(`${API_URL}/reset`, {
        SN,
        ID,
        IP,
        PC_ID,
      });
      enqueueSnackbar("Reset 신호를 보냈습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("Reset error:", error);
      enqueueSnackbar("오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
    handleClose();
  };

  const handleConfirm = async (confirm) => {
    setOpenConfirmDialog(false);
    if (confirm) {
      await sendResetSignal();
    } else {
      handleClose();
    }
  };

  const getElapsedTime = (timestamp) => {
    const startTime = dayjs(timestamp);
    const now = dayjs();
    const diff = now.diff(startTime);

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hourString = hours > 0 ? `${hours}시간 ` : "";
    const minuteString = minutes > 0 ? `${minutes}분 ` : "";
    const secondString = `${seconds}초 경과`;

    return `${hourString}${minuteString}${secondString}`.trim();
  };

  return (
    <div>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" gutterBottom>
          모니터링
        </Typography>
        {/* <SearchBar onSearch={handleSearch} /> */}
      </Box>
      <TableContainer component={Paper}>
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
              <TableCell sx={{ width: "50px" }}>No</TableCell>
              <TableCell sx={{ width: "100px" }}>PC</TableCell>
              <TableCell sx={{ width: "100px" }}>SN</TableCell>
              <TableCell sx={{ width: "100px" }}>Period</TableCell>
              <TableCell sx={{ width: "100px" }}>Status</TableCell>
              <TableCell sx={{ width: "100px" }}>TimeStamp</TableCell>
              <TableCell sx={{ width: "100px" }}>TimeOver</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // 로딩 중일 때 스켈레톤 표시
              <>
                {[...Array(5)].map((_, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {[...Array(7)].map((_, colIndex) => (
                      <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                        <Skeleton
                          sx={{ display: "inline-block", width: "50px" }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : paginatedData.length === 0 ? (
              // 데이터가 없을 때 메시지 표시
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    데이터가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((pc, index) => (
                <TableRow
                  key={pc.id}
                  sx={{
                    backgroundColor: "inherit",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  onClick={() => {
                    if (pc.status === "Shutdown") {
                      handleRowClick(pc);
                    }
                  }}
                >
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>{pc.name}</TableCell>
                  <TableCell>{pc.serial_number}</TableCell>
                  <TableCell>{pc.period}</TableCell>
                  <TableCell
                    sx={{
                      color:
                        pc.status === "Shutdown"
                          ? "red"
                          : pc.status === "Warning"
                          ? "orange"
                          : pc.status === "Unknown"
                          ? "gray"
                          : pc.status === "Normal"
                          ? "#2ec200"
                          : "inherit",
                    }}
                  >
                    {pc.status}
                  </TableCell>
                  <TableCell>
                    {dayjs(pc.ts).format("YYYY-MM-DD HH:mm:ss")}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {pc.status === "Shutdown" || pc.status === "Unknown"
                      ? getElapsedTime(pc.ts)
                      : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" marginTop="20px">
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>PC Control</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            <strong>PC : </strong>
            {editedPc?.name}
          </Typography>
          <Typography variant="body1">
            <strong>Period : </strong>
            {editedPc?.period} sec
          </Typography>
          <Typography variant="body1">
            <strong>Status : </strong>
            {editedPc?.status}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={handleSubmit} color="error" variant="contained">
            PC Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmDialog} onClose={() => handleConfirm(false)}>
        <Box
          sx={{
            backgroundImage: "url(/warningImg.png)",
            backgroundSize: "cover",
            width: "400px",
            height: "330px",
          }}
        ></Box>
        <Box sx={{}}>
          <DialogContent>
            <Typography component="span" fontWeight="bold">
              [{editedPc?.name}]
            </Typography>{" "}
            PC 를 리셋 하시겠습니까?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleConfirm(false)} color="primary">
              취소
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              color="primary"
              variant="contained"
              autoFocus
            >
              확인
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </div>
  );
};

export default Monitoring;
