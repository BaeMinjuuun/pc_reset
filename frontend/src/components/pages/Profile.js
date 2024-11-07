import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config/constants";
import { login, logout } from "../redux/store/authSlice";
import { useSnackbar } from "notistack";

const Profile = () => {
  const user_id = useSelector((state) => state.auth.user_id);
  const [myInfo, setMyInfo] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});
  const [switches, setSwitches] = useState({
    kakao: true,
    email: false,
    sms: false,
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/getMyInfo/${user_id}`);
        setMyInfo(response.data.user);
        setEditedInfo(response.data.user); // 처음 로드 시 수정할 데이터도 설정
      } catch (error) {
        console.error(error);
      }
    };
    fetchMyInfo();
  }, [user_id]);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo({ ...editedInfo, [name]: value });
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/updateMyInfo/${user_id}`,
        editedInfo
      );
      setMyInfo(response.data.user);
      setOpenModal(false); // 저장 후 모달 닫기
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      dispatch(logout()); // 로그아웃 상태로 변경
      enqueueSnackbar("프로필 수정이 완료되었습니다. 로그인이 필요합니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      navigate("/login");
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.error) {
        enqueueSnackbar(error.response.data.error, {
          variant: "error",
          autoHideDuration: 3000,
        });
      } else {
        // 다른 오류 처리
        enqueueSnackbar("프로필 수정이 실패하였습니다.", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    }
  };

  if (!myInfo) {
    return <div>로딩 중...</div>;
  }

  const handleChange = (event) => {
    setSwitches({
      ...switches,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Box>
      <Box sx={{ padding: 2, display: "flex" }}>
        <Card variant="outlined" sx={{ width: "100%", maxWidth: 350 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5" gutterBottom>
                프로필 정보
              </Typography>
              <Button onClick={handleOpenModal}>수정</Button>
            </Box>
            <Divider sx={{ marginBottom: 2 }} />

            {/* 프로필 정보 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex" }}>
                <Typography
                  variant="body1"
                  sx={{ width: "100px", fontWeight: "bold" }}
                >
                  아이디:
                </Typography>
                <Typography variant="body1">{myInfo.user_id}</Typography>
              </Box>
              <Box sx={{ display: "flex" }}>
                <Typography
                  variant="body1"
                  sx={{ width: "100px", fontWeight: "bold" }}
                >
                  이름:
                </Typography>
                <Typography variant="body1">{myInfo.name}</Typography>
              </Box>
              <Box sx={{ display: "flex" }}>
                <Typography
                  variant="body1"
                  sx={{ width: "100px", fontWeight: "bold" }}
                >
                  권한:
                </Typography>
                <Typography variant="body1">
                  {myInfo.authority === 1 ? "사용자" : "관리자"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex" }}>
                <Typography
                  variant="body1"
                  sx={{ width: "100px", fontWeight: "bold" }}
                >
                  이메일:
                </Typography>
                <Typography variant="body1">{myInfo.email}</Typography>
              </Box>
              <Box sx={{ display: "flex" }}>
                <Typography
                  variant="body1"
                  sx={{ width: "100px", fontWeight: "bold" }}
                >
                  전화번호:
                </Typography>
                <Typography variant="body1">{myInfo.phone}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 프로필 수정 모달 */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          sx={{
            width: 400,
            ml: "35%",
          }}
        >
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogContent>
            <TextField
              label="아이디"
              fullWidth
              margin="normal"
              name="user_id"
              value={editedInfo.user_id || ""}
              onChange={handleInputChange}
            />
            <TextField
              label="이름"
              fullWidth
              margin="normal"
              name="name"
              value={editedInfo.name || ""}
              onChange={handleInputChange}
            />
            <TextField
              label="이메일 (중복처리필요)"
              fullWidth
              margin="normal"
              name="email"
              value={editedInfo.email || ""}
              onChange={handleInputChange}
            />
            <TextField
              label="전화번호"
              fullWidth
              margin="normal"
              name="phone"
              value={editedInfo.phone || ""}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Link to="/board">
        <Button variant="contained" color="primary" size="small" sx={{ ml: 3 }}>
          게시판 (파킹페이지)
        </Button>
      </Link>

      <Box sx={{ display: "flex" }}>
        <Box
          sx={{ padding: 2, border: "solid 1px gray", width: "200px", m: 2 }}
        >
          <Typography sx={{ fontWeight: "bold", mb: 2 }}>
            알림 온오프 (구현보류)
          </Typography>
          <FormGroup>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{}}>카카오톡</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={switches.kakao}
                    onChange={handleChange}
                    name="kakao"
                    color="primary"
                    size="small"
                  />
                }
                sx={{ ml: 2 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{}}>이메일</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={switches.email}
                    onChange={handleChange}
                    name="email"
                    color="primary"
                    size="small"
                  />
                }
                sx={{ ml: 2 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{}}>SMS</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={switches.sms}
                    onChange={handleChange}
                    name="sms"
                    color="primary"
                    size="small"
                  />
                }
                sx={{ ml: 2 }}
              />
            </Box>
          </FormGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
