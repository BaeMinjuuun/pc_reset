import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_URL } from "../../config/constants";
import { login, logout } from "../redux/store/authSlice";
import { useSnackbar } from "notistack";

const Navbar = ({ toggleDrawer, open }) => {
  const userName = useSelector((state) => state.auth.userName);
  const user_id = useSelector((state) => state.auth.user_id);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  // 현재 경로에서 ID 추출
  const match = location.pathname.match(/\/(\d+)/);
  const id = match ? match[1] : null;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/users`, {
          withCredentials: true,
        });
        if (
          response.status === 200 &&
          response.data.success &&
          response.data.currentUser
        ) {
          dispatch(
            login({
              userName: response.data.currentUser.name,
              user_id: response.data.currentUser.user_id,
              assigned_group: response.data.currentUser.assigned_group,
            })
          ); // 로그인 상태 설정 및 사용자 이름 저장
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    if (!isLoggedIn) {
      fetchUserData();
    }
  }, [dispatch, isLoggedIn, location]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      enqueueSnackbar("로그아웃 되었습니다.", {
        variant: "success",
        autoHideDuration: 3000,
      });
      dispatch(logout()); // 로그아웃 상태로 변경
      navigate("/login"); // 로그아웃 후 로그인 페이지로 리다이렉트
    } catch (error) {
      console.error("Logout error:", error);
      enqueueSnackbar("로그아웃에 실패했습니다.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  const buttonItems = [
    { text: "Monitoring", path: id ? `/monitoring/${id}` : "/monitoring/1" },
    {
      text: "PC Reset Module Setting",
      path: id ? `/pc-reset/${id}` : "/pc-reset/1",
    },
    { text: "Log", path: id ? `/log/${id}` : "/log/1" },
    { text: "Setting", path: id ? `/setting/${id}` : "/setting/1" },
  ];

  const rightButtonItems = [
    {
      text: "User",
      path:
        user_id === ""
          ? "/login"
          : user_id === "admin"
          ? "/userManage"
          : "/user",
    },
  ];

  return (
    <AppBar position="fixed">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={toggleDrawer}>
          <MenuIcon />
        </IconButton>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: 15 }}>
            PC Reset Manager
          </Typography>
        </Link>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            transition: "margin 0.3s",
            marginLeft: open ? "5%" : "60px",
          }}
        >
          {buttonItems.map((item) => (
            <Link key={item.text} to={item.path}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
                size="small"
              >
                {item.text}
              </Button>
            </Link>
          ))}
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ height: "60px", mx: 2, borderWidth: "2px" }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          {rightButtonItems.map((item) => (
            <Link key={item.text} to={item.path}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
                size="small"
              >
                {item.text}
              </Button>
            </Link>
          ))}
        </Box>
        <Box sx={{ flexGrow: 1 }} />{" "}
        {/* 빈 공간을 차지하여 로그아웃 부분을 오른쪽으로 밀기 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isLoggedIn ? (
            <>
              <Typography variant="body1" sx={{ color: "white" }}>
                {userName ? userName : "Loading..."}
              </Typography>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
                size="small"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
                size="small"
              >
                로그인
              </Button>
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
