// components/LoginPage.js
import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_URL } from "../../config/constants";
import { login } from "../redux/store/authSlice";
import { useSnackbar } from "notistack";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    id: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!loginData.id || !loginData.password) {
      setErrorMessage("ID와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_URL}/login`, loginData, {
        withCredentials: true,
      });
      if (response.status === 200) {
        // 리덕스 상태 업데이트
        dispatch(
          login({
            userName: response.data.name,
            user_id: response.data.user_id,
            assigned_group: response.data.assigned_group,
          })
        ); // 서버 응답에서 유저 이름을 받아 상태 업데이트

        // 로그인 성공 시 모니터링페이지로 리다이렉트
        enqueueSnackbar("로그인 되었습니다.", {
          variant: "success",
          autoHideDuration: 3000,
        });
        navigate("/monitoring/1");
      } else {
        enqueueSnackbar("로그인에 실패했습니다.", {
          variant: "error",
          autoHideDuration: 3000,
        });
      }
    } catch (error) {
      enqueueSnackbar("서버와의 통신중 오류가 발생하였습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const activeEnter = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Box
        sx={{
          width: 300,
          p: 3,
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h6" align="center" gutterBottom>
          로그인
        </Typography>
        <TextField
          label="ID"
          name="id"
          value={loginData.id}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errorMessage}
          onKeyDown={(e) => activeEnter(e)}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={loginData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errorMessage}
          onKeyDown={(e) => activeEnter(e)}
        />
        {errorMessage && (
          <Typography color="error" align="center" marginTop={2}>
            {errorMessage}
          </Typography>
        )}
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
            sx={{ mr: 1 }}
            disabled={loading}
          >
            {loading ? "로딩 중..." : "로그인"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ ml: 1 }}
            onClick={() => setLoginData({ id: "", password: "" })}
          >
            취소
          </Button>
        </Box>
        <Link to="/register" style={{ textDecoration: "none" }}>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 2, color: "#1976d2", fontWeight: "bold" }}
          >
            회원가입 (MASTER)
          </Button>
        </Link>
      </Box>
    </Box>
  );
};

export default LoginPage;
