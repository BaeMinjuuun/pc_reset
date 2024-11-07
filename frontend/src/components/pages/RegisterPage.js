import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 리다이렉트를 위한 훅
import { useDispatch } from "react-redux"; // 로그인 상태를 업데이트하기 위해 리덕스 디스패치를 사용
import { login } from "../redux/store/authSlice"; // login 액션 임포트
import { API_URL } from "../../config/constants";

const SignupPage = () => {
  const [signupData, setSignupData] = useState({
    id: "",
    password: "",
    name: "",
    phone: "",
    email: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validate = () => {
    const errors = {};
  
    // ID: 최소 3자 이상, 알파벳과 숫자만 허용
    const idRegex = /^[a-zA-Z0-9]{3,}$/;
    if (!idRegex.test(signupData.id)) {
      errors.id = "ID는 3자 이상, 알파벳과 숫자만 가능합니다.";
    }
  
    // Password: 최소 8자 이상, 숫자, 대문자, 소문자, 특수문자 포함
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(signupData.password)) {
      errors.password = "비밀번호는 최소 8자, 숫자, 대문자, 소문자, 특수문자를 포함해야 합니다.";
    }
  
    // Name: 최소 2자 이상, 알파벳과 한글 허용
    const nameRegex = /^[a-zA-Z가-힣]{2,}$/;
    if (!nameRegex.test(signupData.name)) {
      errors.name = "이름은 2자 이상, 영문 또는 한글만 가능합니다.";
    }
  
    // Phone: 전화번호 형식 검증, 숫자와 하이픈만 허용
    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(signupData.phone)) {
      errors.phone = "전화번호 형식이 올바르지 않습니다. (예: 010-xxxx-xxxx)";
    }
  
    // Email: 올바른 이메일 형식인지 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      errors.email = "유효한 이메일 주소를 입력하세요.";
    }
  
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_URL}/signup`, signupData);
      if (response.status === 201) {
        // 회원가입이 성공하면, 로그인 상태를 업데이트하고 모니터링으로 리다이렉트
        dispatch(login({ userName: signupData.name }));
        navigate("/monitoring");
      } else {
        setErrorMessage(response.data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || "회원가입에 실패했습니다.");
      } else {
        setErrorMessage("서버와의 통신 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
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
          회원가입
        </Typography>
        <TextField
          label="ID"
          name="id"
          value={signupData.id}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.id}
          helperText={errors.id}
        />
        <TextField
          label="PW"
          name="password"
          type="password"
          value={signupData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.password}
          helperText={errors.password}
        />
        <TextField
          label="Name"
          name="name"
          value={signupData.name}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Phone"
          name="phone"
          value={signupData.phone}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.phone}
          helperText={errors.phone}
        />
        <TextField
          label="Email"
          name="email"
          value={signupData.email}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required
          error={!!errors.email}
          helperText={errors.email}
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
            {loading ? "로딩 중..." : "확인"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ ml: 1 }}
          >
            취소
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SignupPage;
