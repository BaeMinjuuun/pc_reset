import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetPath, setPath } from "../redux/store/pathSlice"; // resetPath와 setPath 액션 임포트
import { useMemo } from "react";
import { API_URL } from "../../config/constants";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const Breadcrumb = ({ additionalPath }) => {
  const path = useSelector((state) => state.path.path);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [pcStatus, setPcStatus] = useState({
    total: 0,
    normal: 0,
    shutdown: 0,
    warning: 0,
    unknown: 0,
    status: "idle", // 로딩 상태 관리
    error: null, // 에러 상태 관리
  });

  useEffect(() => {
    // EventSource 객체 생성
    const eventSource = new EventSource(`${API_URL}/getPCStatus`);

    // 메시지가 수신될 때마다 실행
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPcStatus({
        total: data.total,
        normal: data.normal,
        shutdown: data.shutdown,
        warning: data.warning,
        unknown: data.unknown,
        status: "loaded",
      });
    };

    // 에러 처리
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setPcStatus((prev) => ({
        ...prev,
        status: "failed",
        error: "SSE connection failed",
      }));
      eventSource.close(); // 에러 발생 시 연결을 닫음
    };

    // 컴포넌트가 언마운트되면 SSE 연결 해제
    return () => {
      eventSource.close();
    };
  }, []);

  // specialRoutes를 useMemo로 메모이제이션
  const specialRoutes = useMemo(() => ["user", "home", "login"], []);

  const currentRoute = location.pathname.split("/")[1];

  // 브레드크럼이 표시되지 않아야 하는 경우
  React.useEffect(() => {
    if (specialRoutes.includes(currentRoute)) {
      dispatch(resetPath()); // 경로 초기화
    }
  }, [currentRoute, dispatch, specialRoutes]);

  // 해당 경로에 브레드크럼이 표시되지 않도록 early return
  if (specialRoutes.includes(currentRoute)) {
    return null;
  }

  // 각 경로를 클릭할 때 해당 경로로 이동시키기 및 경로 업데이트
  const handleClick = (index) => {
    const selectedPath = path[index]; // 선택된 경로의 객체
    if (selectedPath) {
      // 현재 경로에서 id를 포함한 경로 생성
      const targetPath = `/${currentRoute}/${selectedPath.id}`;

      // 선택된 경로까지의 리스트만 남기고 나머지는 제거
      const newPath = path.slice(0, index + 1);
      dispatch(setPath(newPath));

      navigate(targetPath);
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Box
        sx={{
          mb: 2,
          border: "solid 2px gray",
          width: "50%",
          height: "50px",
          maxHeight: "50px",
          borderEndStartRadius: 5,
          borderTopLeftRadius: 5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "gray",
            ml: 2,
            mt: 1.8,
          }}
        >
          {path.map((part, index) => (
            <span key={index}>
              {index > 0 && <ArrowForwardIcon sx={{ fontSize: 13, mx: 0.5 }} />}
              <Button
                sx={{
                  color: "gray",
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  alignItems: "center",
                }}
                onClick={() => handleClick(index)}
              >
                <Typography sx={{ fontSize: 15, fontWeight: "bold" }}>
                  {part.name}
                </Typography>
              </Button>
            </span>
          ))}
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 2,
          border: "solid 2px gray",
          borderLeft: "none",
          width: "50%",
          maxHeight: "50px",
          borderEndEndRadius: 5,
          borderTopRightRadius: 5,
        }}
      >
        <Typography sx={{ fontSize: 13, ml: "40%" }}>
          PC Status All [ {pcStatus.total} ]
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            ml: 3,
            mr: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "#2ec200", fontSize: 20 }}>■</span>Normal
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "red", fontSize: 20 }}>■</span>Shutdown
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "orange", fontSize: 20 }}>■</span>Warning
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "gray", fontSize: 20 }}>■</span>Unknown
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            ml: 3,
            mr: 3,
          }}
        >
          <Typography sx={{ fontSize: 13, lineHeight: 0.7 }}>
            {pcStatus.normal}
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 0.7 }}>
            {pcStatus.shutdown}
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 0.7 }}>
            {pcStatus.warning}
          </Typography>
          <Typography sx={{ fontSize: 13, lineHeight: 0.7 }}>
            {pcStatus.unknown}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Breadcrumb;
