import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  TextField,
  Box,
  Pagination,
  Tooltip,
  Skeleton,
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config/constants";
import SearchBar from "./SearchBar";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { findGroupHierarchy } from "../utils/groupHierarchy";

const PcResetModule = ({ groupData }) => {
  const { id } = useParams();
  const [pcData, setPcData] = useState([]);
  const [filteredPcData, setFilteredPcData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState(null);
  const [editedPc, setEditedPc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const itemsPerPage = 50; // 페이지당 항목 수
  const [totalPages, setTotalPages] = useState(0);
  const [thisGroupData, setThisGroupData] = useState(null);
  const path = useSelector((state) => state.path.path);
  const [changeBtn, setChangeBtn] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [groupHierarchy, setGroupHierarchy] = useState([]);
  const user_id = useSelector((state) => state.auth.user_id);
  const [isLoading, setIsLoading] = useState(true);

  // 전체 주기변경 모달 관련 상태
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [bulkPeriod, setBulkPeriod] = useState("");
  const [bulkError, setBulkError] = useState("");

  // 모듈 개별 추가 모달 관련 상태
  const [openAddModuleModal, setOpenAddModuleModal] = useState(false);
  const [addModuleName, setAddModuleName] = useState("");
  const [addModuleSN, setAddModuleSN] = useState("");
  const [depth, setDepth] = useState(0);

  // 그룹 추가 모달 관련 상태
  const [openGroupAddModal, setOpenGroupAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/getPcModuleListWithGroup/${id}`
        );
        const receivedData = response.data;

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

        // 소팅한 데이터를 상태에 업데이트
        setPcData(sortedData);
      } catch (error) {
        console.error("Error fetching PC data:", error);
      } finally {
        setIsLoading(false); // 데이터 로딩 완료
      }
    };

    fetchData(); // 컴포넌트가 마운트될 때 데이터 fetch

    // 컴포넌트가 마운트될 때마다 fetchData 호출
  }, [id]);

  useEffect(() => {
    if (groupData && id) {
      const groupId = parseInt(id, 10); // id가 숫자형인지 확인
      const group = groupData.find((g) => g.id === groupId);
      setThisGroupData(group || "");
    }
  }, [groupData, id]);

  useEffect(() => {
    setFilteredPcData(pcData); // 처음엔 전체 데이터로 초기화
    setTotalPages(Math.ceil(pcData.length / itemsPerPage)); // 총 페이지 수 계산
  }, [pcData]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(`${API_URL}/getGroupDepth/${id}`);
      setDepth(response.data.depth);
    };
    fetchData();
  }, [id]);

  const handleSearch = (searchQuery, filterBy) => {
    let filtered = [];

    // 필터에 따라 검색 기준을 변경
    if (filterBy === "PC") {
      filtered = pcData.filter((pc) =>
        pc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (filterBy === "SN") {
      filtered = pcData.filter((pc) =>
        pc.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (filterBy === "IP") {
      filtered = pcData.filter((pc) =>
        pc.ip?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPcData(filtered); // 필터링된 데이터를 저장
    setTotalPages(Math.ceil(filtered.length / itemsPerPage)); // 필터링된 데이터에 따른 총 페이지 수 계산
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event, value) => {
    setCurrentPage(value); // 페이지 상태 업데이트
  };

  // 현재 페이지에 맞는 데이터를 추출하는 함수
  const paginatedData = filteredPcData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (pc) => {
    const groupHierarchyData = findGroupHierarchy(pc.group_id, groupData);
    setGroupHierarchy(groupHierarchyData);
    setSelectedPc(pc);
    setEditedPc({ ...pc });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPc(null);
    setEditedPc(null);
    setChangeBtn(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPc((prev) => ({ ...prev, [name]: value }));
  };

  // 삭제 핸들러
  const handleDelete = async (pcId) => {
    try {
      await axios.delete(`${API_URL}/delete/${pcId}`);
      setPcData((prevData) => prevData.filter((pc) => pc.id !== pcId));
      enqueueSnackbar("PC가 성공적으로 삭제되었습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      handleClose(); // 삭제 후 모달 닫기
    } catch (error) {
      console.error("PC 삭제 중 오류 발생:", error);
      enqueueSnackbar("삭제 중 오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  // 수정 제출 핸들러
  const handleSubmit = async () => {
    const data = [
      {
        id: editedPc.id,
        sn: editedPc.serial_number,
        period: editedPc.period,
        name: editedPc.name,
        ip: editedPc.ip,
      },
    ];
    try {
      await axios.post(`${API_URL}/update`, { data, user_id });
      enqueueSnackbar("모듈 정보가 성공적으로 수정되었습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error(error);
      enqueueSnackbar("수정 중 오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
    handleClose();
  };

  // 전체 주기변경 모달 핸들러
  const handleOpenBulkModal = () => {
    setBulkPeriod("");
    setBulkError("");
    setOpenBulkModal(true);
  };

  const handleCloseBulkModal = () => {
    setOpenBulkModal(false);
    setBulkPeriod("");
    setBulkError("");
  };

  // 모듈 개별 추가 모달 핸들러
  const handleOpenAddModuleModal = () => {
    setOpenAddModuleModal(true);
  };

  const handleCloseAddModuleModal = () => {
    setOpenAddModuleModal(false);
  };

  // 모듈 개별 추가 제출 핸들러
  const handleAddModuleSubmit = async () => {
    try {
      await axios.post(`${API_URL}/addOneModule`, {
        name: addModuleName,
        sn: addModuleSN,
        group_id: thisGroupData.id,
        user_id: user_id,
      });
      enqueueSnackbar("모듈이 성공적으로 등록되었습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      handleCloseAddModuleModal();
    } catch (error) {
      console.error("모듈 등록 중 오류:", error);
      enqueueSnackbar(error.response.data.message, {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  // 전체 주기변경 핸들러
  const handleGroupSubmit = async () => {
    // 주기가 숫자인지 확인
    const periodNumber = parseInt(bulkPeriod, 10);
    if (isNaN(periodNumber) || periodNumber <= 0) {
      setBulkError("유효한 주기를 입력하세요.");
      return;
    }
    const groupHierarchy = findGroupHierarchy(thisGroupData.id, groupData);

    const sendData = [{ group_id: thisGroupData.id, period: periodNumber }];
    const prevPeriod = pcData[0].period;
    try {
      // 모든 PC의 주기를 업데이트하는 API 호출
      await axios.post(`${API_URL}/updateGroup`, {
        sendData,
        user_id,
        prevPeriod,
        groupHierarchy,
      });
      enqueueSnackbar("모든 PC의 주기가 성공적으로 업데이트되었습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      handleCloseBulkModal();
    } catch (error) {
      console.error("전체 주기 변경 오류:", error);
      enqueueSnackbar("전체 주기 수정 중 오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleRequestSetting = async (data) => {
    const SN = data.serial_number;
    const IP = data.ip;
    const period = data.period;
    console.log("Setting 요청 데이터:", SN, IP, period);
    try {
      await axios.get(`${API_URL}/setting`, {
        params: {
          SN,
          IP,
          period,
        },
      });
      enqueueSnackbar("Setting 요청 신호를 보냈습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("Setting 요청 중 오류 발생:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "알 수 없는 오류가 발생했습니다.";

      enqueueSnackbar(errorMessage, {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const handleOpenGroupAddModal = () => {
    setOpenGroupAddModal(true);
  };

  const handleCloseGroupAddModal = () => {
    setOpenGroupAddModal(false);
    setNewGroupName("");
  };

  const handleAddGroup = async () => {
    const newGroup = {
      name: newGroupName,
      parent_id: parseInt(id),
    };

    if (newGroup.name === "") {
      enqueueSnackbar("그룹 이름을 입력해주세요.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/addGroup`, newGroup);
      if (response.status === 200) {
        enqueueSnackbar("그룹 추가 완료", {
          variant: "success",
          autoHideDuration: 3000,
        });
        handleCloseGroupAddModal();
        window.location.reload(); // 페이지 새로고침
      }
    } catch (error) {
      console.error("그룹 추가 오류:", error);
      enqueueSnackbar("오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      handleCloseGroupAddModal();
    }
  };

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between", // 양쪽 끝에 배치
          alignItems: "center",
          mb: 2, // margin-bottom for spacing
        }}
      >
        <Typography variant="h6" gutterBottom>
          모듈 설정
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {
            // 깊이가 5인 그룹일 때만 추가, 설정 버튼 표시
            depth > 4 ? (
              <Button
                color="primary"
                variant="outlined"
                size="small"
                onClick={handleOpenAddModuleModal}
              >
                추가
              </Button>
            ) : null
          }

          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={handleOpenBulkModal}
          >
            설정
          </Button>
          <SearchBar onSearch={handleSearch} />
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenGroupAddModal}
        >
          하위 그룹 추가
        </Button>
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
              <TableCell sx={{ width: "50px" }}>No</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>PC</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>IP</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>SN</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>Period</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>Status</TableCell>{" "}
              <TableCell sx={{ width: "100px" }}>Group</TableCell>{" "}
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
              paginatedData.map((pc, index) => {
                const group = groupData.find((g) => g.id === pc.group_id);
                return (
                  <TableRow
                    key={pc.id}
                    onClick={() => handleRowClick(pc)}
                    sx={{
                      backgroundColor: "inherit",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{pc.name}</TableCell>
                    <TableCell>{pc.ip ? pc.ip : "N/A"}</TableCell>
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
                      <Tooltip
                        title={findGroupHierarchy(pc.group_id, groupData)}
                        placement="top"
                      >
                        {group ? group.name : "N/A"}
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" marginTop="20px">
        <Pagination
          count={totalPages} // 총 페이지 수
          page={currentPage} // 현재 페이지
          onChange={handlePageChange} // 페이지 변경 핸들러
          color="primary"
        />
      </Box>

      {/* 개별 PC 수정 Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>수정</DialogTitle>
        <DialogContent>
          {selectedPc && (
            <form>
              <Typography variant="body1">
                <strong>Group:</strong>{" "}
                {path.length > 0 ? (
                  <Tooltip title={groupHierarchy} placement="top">
                    {groupData.find((g) => g.id === selectedPc.group_id)
                      ?.name || "N/A"}
                  </Tooltip>
                ) : (
                  groupData.find((g) => g.id === selectedPc.group_id)?.name ||
                  "N/A"
                )}
              </Typography>
              <Typography variant="body1">
                <strong>Name:</strong> {selectedPc.name} <br />
                <strong>SN:</strong> {selectedPc.serial_number}
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => setChangeBtn((prev) => !prev)}
                >
                  {changeBtn ? "취소" : "교체"}
                </Button>
              </Typography>
              <Typography variant="body1">
                <TextField
                  fullWidth
                  margin="normal"
                  label="Name"
                  name="name"
                  value={editedPc.name}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Typography>
              <Typography variant="body1">
                <TextField
                  fullWidth
                  margin="normal"
                  label="Period (초)"
                  name="period"
                  value={editedPc.period}
                  onChange={handleInputChange}
                  variant="outlined"
                />
                {changeBtn ? (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="SN"
                    name="serial_number"
                    value={editedPc.serial_number}
                    onChange={handleInputChange}
                    variant="outlined"
                    sx={{
                      display: changeBtn ? "block" : "none",
                      backgroundColor: "lightgray",
                    }}
                  />
                ) : null}
              </Typography>
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            닫기
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            수정
          </Button>
        </DialogActions>
        <DialogActions>
          <Button
            onClick={() => handleDelete(selectedPc.id)}
            color="error"
            variant="contained"
          >
            삭제
          </Button>
          <Button size="small" onClick={() => handleRequestSetting(editedPc)}>
            설정 정보 요청 테스트
          </Button>
        </DialogActions>
      </Dialog>

      {/* 전체 주기변경 Dialog */}
      <Dialog open={openBulkModal} onClose={handleCloseBulkModal}>
        <DialogTitle>전체 주기 변경</DialogTitle>
        <Typography variant="body1" sx={{ ml: 3 }}>
          대상 그룹:
          {path.length > 0 ? (
            <Tooltip
              title={path.map((part, index) => (
                <span key={index}>
                  {index > 0 && ">"} {part.name}{" "}
                </span>
              ))}
              placement="top"
            >
              {thisGroupData?.name}
            </Tooltip>
          ) : (
            thisGroupData?.name
          )}
          <Typography sx={{ mr: 3, mt: 1, color: "gray", fontSize: 12 }}>
            대상 그룹의 모듈 주기를 일괄 변경합니다.
          </Typography>
        </Typography>

        <DialogContent>
          <TextField
            margin="dense"
            label="주기 (초)"
            type="number"
            fullWidth
            variant="outlined"
            value={bulkPeriod}
            onChange={(e) => setBulkPeriod(e.target.value)}
            error={!!bulkError}
            helperText={bulkError}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseBulkModal}
            color="black"
            variant="contained"
          >
            취소
          </Button>
          <Button
            onClick={handleGroupSubmit}
            color="primary"
            variant="contained"
          >
            변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 모듈 개별 등록 모달 */}
      <Dialog open={openAddModuleModal} onClose={handleCloseAddModuleModal}>
        <DialogTitle>모듈 등록</DialogTitle>
        <Typography variant="body1" sx={{ ml: 3 }}>
          대상 그룹:
          {path.length > 0 ? (
            <Tooltip
              title={path.map((part, index) => (
                <span key={index}>
                  {index > 0 && ">"} {part.name}{" "}
                </span>
              ))}
              placement="top"
            >
              {thisGroupData?.name}
            </Tooltip>
          ) : (
            thisGroupData?.name
          )}
          <Typography sx={{ mr: 3, mt: 1, color: "gray", fontSize: 12 }}>
            대상 그룹에 모듈을 등록합니다.
          </Typography>
        </Typography>

        <DialogContent>
          <TextField
            margin="dense"
            label="PC명"
            name="name"
            fullWidth
            onChange={(e) => {
              setAddModuleName(e.target.value);
            }}
          />
          <TextField
            margin="dense"
            label="SN"
            name="sn"
            fullWidth
            onChange={(e) => {
              setAddModuleSN(e.target.value);
            }}
          />
          <input
            type="hidden"
            value={thisGroupData?.group_id || ""}
            name="group_id"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseAddModuleModal}
            color="black"
            variant="contained"
          >
            취소
          </Button>
          <Button
            onClick={handleAddModuleSubmit}
            color="primary"
            variant="contained"
          >
            등록
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openGroupAddModal} onClose={handleCloseGroupAddModal}>
        <DialogTitle>하위 그룹 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="그룹 이름"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupAddModal} color="primary">
            취소
          </Button>
          <Button onClick={handleAddGroup} color="primary" variant="contained">
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PcResetModule;
