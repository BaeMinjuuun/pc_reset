import { useState, useEffect } from "react";
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Grid2,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  DialogContentText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import Papa from "papaparse";
import { API_URL } from "../../config/constants";
import { useSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";
import { findGroupHierarchy } from "../utils/groupHierarchy";
import { useSelector } from "react-redux";

const Setting = ({ groupData }) => {
  const [csvData, setCsvData] = useState([]);
  const [userCsvData, setUserCsvData] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [updateGroupName, setUpdateGroupName] = useState("");
  const [timeOverData, setTimeOverData] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]); // 선택된 그룹들의 ID 배열
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [openDeleteConfirmModal, setOpenDeleteConfirmModal] = useState(false);
  const { id } = useParams();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const user_id = useSelector((state) => state.auth.user_id);
  const [open, setOpen] = useState({
    nextGroupAddModal: false,
    rootGroupAddModal: false,
    groupUpdateModal: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/getTimeOverOfConfig`);
        setTimeOverData(response.data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!id) {
      return;
    }
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/getGroupById/${id}`);
        setSelectedGroups(response.data.name);
        setSelectedGroupId(response.data.id);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    fetchData();
  }, [id]);

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // 모듈 CSV 데이터 설정
  const handleFileUpload = (event) => {
    const files = event.target.files;

    const handleParseComplete = (result) => {
      setCsvData((prevData) => [...prevData, ...result.data]);
    };

    // CSV 파일을 파싱하는 함수
    const parseFile = (file) => {
      Papa.parse(file, {
        complete: handleParseComplete,
        header: true,
      });
    };

    // 파일 배열을 순회하며 파싱
    Array.from(files).forEach(parseFile);
  };

  // 사용자 CSV 데이터 설정
  const handleUserFileUpload = (event) => {
    const files = event.target.files;

    const handleParseCompleteForUser = (result) => {
      setUserCsvData((prevData) => [...prevData, ...result.data]);
    };

    // CSV 파일을 파싱하는 함수
    const parseFile = (file) => {
      Papa.parse(file, {
        complete: handleParseCompleteForUser,
        header: true,
      });
    };

    // 파일 배열을 순회하며 파싱
    Array.from(files).forEach(parseFile);
  };

  // 서버로 CSV 데이터를 전송
  const handleSubmit = async () => {
    setUploading(true);
    setProgress(0);
    try {
      const response = await axios.post(
        `${API_URL}/module-upload-csv`,
        { csvData, user_id },
        {
          headers: {
            "Content-Type": "application/json",
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const current = progressEvent.loaded;
            const percent = Math.floor((current / total) * 100);
            setProgress(percent); // 진행률 업데이트
          },
        }
      );

      if (response.status === 200) {
        // console.log("모듈 등록이 완료되었습니다.");
        setCsvData([]);
        enqueueSnackbar("모듈 등록이 완료되었습니다.", {
          variant: "success",
          autoHideDuration: 3000,
        });
      } else {
        console.log("오류가 발생했습니다.");
        enqueueSnackbar("오류가 발생했습니다.", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const { duplicatesInData, duplicatesInDB, message } =
          error.response.data;
        let toastMessage = message + "\n\n";

        if (duplicatesInData && duplicatesInData.length > 0) {
          toastMessage +=
            "업로드된 데이터 내 중복 시리얼 넘버:\n" +
            duplicatesInData.join(", ") +
            "\n\n";
        }

        if (duplicatesInDB && duplicatesInDB.length > 0) {
          toastMessage +=
            "데이터베이스에 이미 존재하는 시리얼 넘버:\n" +
            duplicatesInDB.join(", ");
        }

        enqueueSnackbar(toastMessage, {
          variant: "warning",
          autoHideDuration: 3000,
        });
      } else {
        console.error("서버 오류", error);
        enqueueSnackbar("파일 업로드 중 오류가 발생했습니다.", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    } finally {
      setUploading(false); // 업로드 종료
      setProgress(0); // 진행률 초기화
    }
  };

  // 사용자 CSV 데이터를 서버로 전송
  const handleUserSubmit = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/user-upload-csv`,
        userCsvData,
        {
          // 사용자 업로드 경로 수정
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // console.log("사용자 등록이 완료되었습니다.");
        enqueueSnackbar("사용자 등록이 완료되었습니다.", {
          variant: "success",
          autoHideDuration: 3000,
        });
        setUserCsvData([]);
        window.location.href = "/setting";
      } else {
        console.log("오류가 발생했습니다.");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const { duplicatesInData, duplicatesInDB, duplicatesInEmail, message } =
          error.response.data;
        let toastMessage = message + "\n\n";
        if (duplicatesInData && duplicatesInData.length > 0) {
          toastMessage +=
            "업로드된 데이터 내 중복 아이디:\n" +
            duplicatesInData.join(", ") +
            "\n\n";
        }

        if (duplicatesInDB && duplicatesInDB.length > 0) {
          toastMessage +=
            "데이터베이스에 이미 존재하는 아이디:\n" +
            duplicatesInDB.join(", ");
        }

        if (duplicatesInEmail && duplicatesInEmail.length > 0) {
          toastMessage +=
            "데이터베이스에 이미 존재하는 이메일:\n" +
            duplicatesInEmail.join(", ");
        }

        enqueueSnackbar(toastMessage, {
          variant: "warning",
          autoHideDuration: 5000,
        });
      } else {
        console.error("서버 오류", error);
        enqueueSnackbar("파일 업로드 중 오류가 발생했습니다.", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    }
  };

  // 포맷 다운로드
  const downloadFormat = async (type) => {
    try {
      const response = await axios.get(`${API_URL}/download-format/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_format.csv`); // 다운로드 파일명 설정
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("파일 다운로드 중 오류 발생", error);
      alert("파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 모달 열기
  const handleClickOpen = (modal) => {
    setOpen((prevState) => ({
      ...prevState,
      [modal]: true,
    }));
  };

  // 삭제 confirm 모달 열기
  const groupDeleteHandle = async () => {
    if (!id) {
      enqueueSnackbar("삭제할 그룹을 선택해주세요.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } else {
      setOpenDeleteConfirmModal(true);
    }
  };

  // 모달 닫기
  const handleClose = (modal) => {
    setOpen((prevState) => ({
      ...prevState,
      [modal]: false,
    }));
    setNewGroupName("");
    if (modal === "nextGroupAddModal") {
      setSelectedGroups([]);
    }
  };

  // 그룹 추가 함수
  const handleAddGroup = async () => {
    const newGroup = {
      name: newGroupName,
      parent_id: selectedGroups[selectedGroups.length - 1] || null,
    };
    console.log(newGroup.name, newGroup.parent_id);
    if (newGroup.name === "") {
      enqueueSnackbar("그룹 이름을 입력해주세요.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    } else if (newGroup.parent_id === "장") {
      enqueueSnackbar("상위 그룹을 선택해주세요.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/addGroup`, newGroup);
      console.log("그룹 추가 결과:", response);
      if (response.status === 200) {
        enqueueSnackbar("그룹 추가 완료", {
          variant: "success",
          autoHideDuration: 3000,
        });
        handleClose("nextGroupAddModal");
        setTimeout(() => {
          navigate("/setting");
        }, 1000);
      }
    } catch (error) {
      console.error("그룹 추가 오류:", error);
      enqueueSnackbar("오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      handleClose("nextGroupAddModal");
    }
  };

  // 그룹 선택 변경 함수
  const handleGroupChange = (level, value) => {
    const newSelectedGroups = [...selectedGroups];
    newSelectedGroups[level] = value;
    // 선택한 레벨 이후의 선택을 초기화
    newSelectedGroups.splice(level + 1);
    setSelectedGroups(newSelectedGroups);
  };

  // 선택된 그룹에 해당하는 하위 그룹을 찾아주는 함수
  const getSubGroups = (parentId) => {
    return groupData.filter((group) => group.parent_id === parentId);
  };

  // 그룹 수정 버튼 핸들러
  const groupUpdateHandle = async () => {
    try {
      const response = await axios.put(`${API_URL}/updateGroup`, {
        name: updateGroupName,
        id: selectedGroupId,
      });
      if (response.status === 200) {
        enqueueSnackbar("그룹 수정 완료", {
          variant: "success",
          autoHideDuration: 3000,
        });
        handleClose("groupUpdateModal");
        setTimeout(() => {
          navigate("/setting");
        }, 1000);
      }
    } catch (error) {
      console.error("그룹 수정 오류:", error);
      enqueueSnackbar("오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
      handleClose("groupUpdateModal");
    }
  };

  // 그룹 삭제 버튼 핸들러
  const confirmGroupDelete = async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/deleteGroup/${selectedGroupId}`
      );
      if (response.status === 200) {
        enqueueSnackbar("그룹 삭제 완료", {
          variant: "success",
          autoHideDuration: 3000,
        });
        setOpenDeleteConfirmModal(false);
        setTimeout(() => {
          navigate("/setting");
        }, 1000);
      }
    } catch (error) {
      console.error("그룹 삭제 오류:", error);
      enqueueSnackbar("그룹 삭제 오류 발생", {
        variant: "error",
        autoHideDuration: 3000,
      });
      setOpenDeleteConfirmModal(false);
    }
  };

  // shutdown 주기 변경 함수
  const handleSave = async () => {
    console.log("timeOverData", { timeOverData: timeOverData });
    try {
      const response = await axios.post(`${API_URL}/updateTimeOverOfConfig`, {
        newTimeOverData: Number(timeOverData),
        user_id: user_id,
      });

      if (response.status === 200) {
        enqueueSnackbar("주기 설정이 저장되었습니다.", {
          variant: "success",
          autoHideDuration: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating config:", error);
      enqueueSnackbar("저장 오류가 발생했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  // 그룹 수정 모달 열기
  const openGroupUpdateModal = () => {
    if (!id) {
      enqueueSnackbar("수정할 그룹을 선택해주세요.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } else {
      setUpdateGroupName(selectedGroups);
      handleClickOpen("groupUpdateModal");
    }
  };

  // 동적으로 Select 컴포넌트 생성 함수
  const renderGroupSelectors = () => {
    const selectors = [];
    let parentId = null; // 최상위 그룹부터 시작

    for (let level = 0; ; level++) {
      const subGroups = getSubGroups(parentId);
      if (subGroups.length === 0) break; // 더 이상 하위 그룹이 없으면 중단

      selectors.push(
        <Box key={level} sx={{ mt: 2, minWidth: 100 }}>
          <FormControl fullWidth>
            <InputLabel>{level === 0 ? "최상위 그룹" : "하위 그룹"}</InputLabel>
            <Select
              value={selectedGroups[level] || ""}
              onChange={(e) => handleGroupChange(level, e.target.value)}
              label={level === 0 ? "최상위 그룹" : "하위 그룹"}
            >
              {subGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      );

      // 다음 레벨의 부모 ID 설정
      if (selectedGroups[level]) {
        parentId = selectedGroups[level];
      } else {
        break;
      }
    }

    return selectors;
  };

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center", // 수직 중앙 정렬
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            mt: 5,
            mb: 2,
            width: "70%",
            boxShadow: 3,
          }}
        >
          {/* 모듈 등록 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>모듈 등록</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={2} sx={{ maxWidth: 1000, mb: 2 }}>
                <Grid2 item xs={12}>
                  <Typography variant="body2" color="gray">
                    단일 또는 여러개의 리셋 모듈을 등록할 수 있습니다.
                  </Typography>
                  <Typography variant="body2" color="gray">
                    총합 10MB 이하의 CSV 파일만 업로드 가능합니다.
                  </Typography>
                </Grid2>
                <Grid2 item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      color="info"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      업로드
                    </Button>
                    <Button
                      onClick={() => downloadFormat("reset-module")}
                      variant="outlined"
                      color="info"
                      size="small"
                    >
                      포맷 다운로드
                    </Button>
                  </Box>
                </Grid2>
              </Grid2>
              {uploading && (
                <LinearProgress variant="determinate" value={progress} />
              )}
            </AccordionDetails>
          </Accordion>

          {/* 사용자 등록 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>사용자 등록</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={2} sx={{ maxWidth: 500, mb: 2 }}>
                <Grid2 item xs={12}>
                  <Typography variant="body2" color="gray">
                    단일 또는 여러명의 사용자를 등록할 수 있습니다.
                  </Typography>
                </Grid2>
                <Grid2 item xs={12}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUserFileUpload}
                    multiple
                  />
                  <Button
                    onClick={handleUserSubmit}
                    variant="contained"
                    color="info"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    업로드
                  </Button>
                  <Button
                    onClick={() => downloadFormat("user")}
                    variant="outlined"
                    color="info"
                    size="small"
                  >
                    포맷 다운로드
                  </Button>
                </Grid2>
              </Grid2>
            </AccordionDetails>
          </Accordion>

          {/* 그룹 설정 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>그룹 설정</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={2} sx={{ mb: 2, display: "block" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Grid2 item xs={12}>
                    <Typography variant="body2" color="gray">
                      그룹을 추가할 수 있습니다.
                    </Typography>
                  </Grid2>
                  <Grid2 item xs={12} sx={{ ml: 3 }}>
                    <Button
                      variant="contained"
                      color="info"
                      onClick={() => handleClickOpen("nextGroupAddModal")}
                      // sx={{ width: "30%" }}
                      fullWidth
                    >
                      추가
                    </Button>
                  </Grid2>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 3,
                    borderBottom: "1px solid #e0e0e0",
                  }}
                >
                  <Grid2 item xs={12}>
                    <Typography variant="body2" color="gray">
                      좌측 사이드바에 해당하는 그룹을 수정 또는 삭제 할 수
                      있습니다.
                    </Typography>
                  </Grid2>
                  <Grid2 item xs={12} sx={{ display: "flex", ml: 3 }}>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => openGroupUpdateModal()}
                      sx={{ mr: 1 }}
                    >
                      수정
                    </Button>

                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => groupDeleteHandle()}
                    >
                      삭제
                    </Button>
                  </Grid2>
                </Box>
              </Grid2>
            </AccordionDetails>
          </Accordion>

          {/* 판단 기준 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>
                시스템 Shutdown 판단 기준
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2
                container
                spacing={2}
                sx={{ maxWidth: 500, mb: 2, display: "block" }}
              >
                <Grid2 item xs={12}>
                  <Typography variant="body2" color="gray">
                    Shutdown 판단 기준을 설정할 수 있습니다.
                  </Typography>
                </Grid2>
                <Grid2 item xs={12} sx={{ mt: 3 }}>
                  <Box sx={{ marginBottom: 1, display: "flex", ml: 2 }}>
                    <TextField
                      label="주기(sec)"
                      value={timeOverData}
                      onChange={(e) => setTimeOverData(e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                    <Button
                      variant="contained"
                      color="info"
                      onClick={handleSave}
                      sx={{ m: "auto", width: "20%", ml: 2 }}
                      fullWidth
                    >
                      저장
                    </Button>
                  </Box>
                </Grid2>
              </Grid2>
            </AccordionDetails>
          </Accordion>

          {/* 변경사항 로그 */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: "bold" }}>
                시스템 변동 내역
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2
                container
                spacing={2}
                sx={{ maxWidth: "100%", mb: 2, display: "block" }}
              >
                <Grid2 item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="gray">
                      버튼 클릭시 시스템 변경사항 내역을 확인할 수 있는 페이지로
                      이동합니다.
                    </Typography>
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={() => {
                        navigate("/setting-log");
                      }}
                    >
                      이동
                    </Button>
                  </Box>
                </Grid2>
                {/* <Grid2 item xs={12} sx={{ mt: 3 }}>
                  <Box sx={{ marginBottom: 1, display: "flex", ml: 2 }}>
                    <SettingLog groupData={groupData} />
                  </Box>
                </Grid2> */}
              </Grid2>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Button
          variant="outlined"
          color="info"
          sx={{ mt: 3 }}
          onClick={() => {
            navigate("/db-interface");
          }}
        >
          DB 등록 Interface
        </Button>
      </Box>

      {/* 하위 그룹 추가 모달 */}
      <Dialog
        open={open.nextGroupAddModal}
        onClose={() => handleClose("nextGroupAddModal")}
        disableEnforceFocus
      >
        <DialogTitle>그룹 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", width: "100%" }}>
            {/* 동적으로 생성되는 그룹 선택 부분 */}
            {renderGroupSelectors()}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="그룹 이름"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{ width: " 150px" }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleClose("nextGroupAddModal")}
            variant="outlined"
          >
            닫기
          </Button>
          <Button onClick={handleAddGroup} variant="contained" color="primary">
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 그룹 수정 모달 */}
      <Dialog
        open={open.groupUpdateModal}
        onClose={() => handleClose("groupUpdateModal")}
      >
        <DialogTitle>그룹 수정</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="그룹 이름"
            fullWidth
            variant="outlined"
            value={updateGroupName}
            onChange={(e) => setUpdateGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleClose("groupUpdateModal")}
            variant="outlined"
          >
            취소
          </Button>
          <Button
            onClick={() => {
              groupUpdateHandle();
            }}
            variant="outlined"
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 모달 */}
      <Dialog
        open={openDeleteConfirmModal}
        onClose={() => setOpenDeleteConfirmModal(false)}
      >
        <DialogTitle>그룹 삭제</DialogTitle>
        <DialogTitle>
          {findGroupHierarchy(selectedGroupId, groupData)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            1. 해당 그룹의 하위 그룹과 PC 정보를 모두 삭제한다.
          </DialogContentText>
          <DialogContentText>
            2. 해당 그룹의 하위 그룹과 PC 정보는 유지된다.
          </DialogContentText>
          <DialogContentText>
            삭제하시겠습니까? 삭제하면 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteConfirmModal(false)}
            variant="outlined"
          >
            취소
          </Button>
          <Button onClick={confirmGroupDelete} variant="outlined" color="error">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Setting;
