import React, { useState, useEffect } from "react";
import { Typography, Box, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 hook
import { API_URL } from "../../config/constants";
import { useDispatch, useSelector } from "react-redux"; // useSelector 추가
import { setPath } from "../redux/store/pathSlice"; // setPath 액션 임포트
import { useParams } from "react-router-dom";
import ShutdownModal from "./ShutdownModal";
import axios from "axios";

const Monitoring = ({ groupData }) => {
  const [cache, setCache] = useState(new Map());
  const [groupStatusData, setGroupStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [shutdownPcIds, setShutdownPcIds] = useState([]);
  const [previousShutdownPcIds, setPreviousShutdownPcIds] = useState([]);
  const navigate = useNavigate(); // 페이지 이동을 위한 변수
  const dispatch = useDispatch(); //
  const path = useSelector((state) => state.path.path); // 현재 path를 가져오기 위한 Redux selector
  const { id } = useParams(); // 그룹 ID를 받아옴

  useEffect(() => {
    // 그룹의 뎁스를 확인하여 페이지 이동
    const checkGroupDepth = async () => {
      try {
        const response = await axios.get(`${API_URL}/getGroupDepth/${id}`);
        const depth = response.data.depth;
        // console.log("depth(모니터링):", depth);

        // 뎁스에 따라 다른 페이지로 이동
        if (depth === 4) {
          navigate(`/monitoring4/${id}`);
        } else if (depth === 5) {
          navigate(`/monitoringList/${id}`);
        }
      } catch (error) {
        console.error("Error fetching group depth:", error);
      }
    };

    checkGroupDepth(); // 그룹 뎁스를 확인
    // SSE로 상태 데이터 실시간 가져오기

    setLoading(true);
    const eventSource = new EventSource(
      `${API_URL}/getGroupStatusWithDescendants/${id}`
    );

    // 서버로부터 데이터를 받았을 때 처리하는 부분
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data); // 서버로부터 받은 데이터를 JSON으로 변환
      setGroupStatusData(data); // 받아온 데이터를 state에 저장
      setLoading(false);
      // console.log("data:", data);

      let shutdownPcs = []; // shutdown PC 정보를 저장하는 배열

      data.forEach((group) => {
        if (group.pcDetails && group.pcDetails.shutdownPcs.length > 0) {
          shutdownPcs = shutdownPcs.concat(group.pcDetails.shutdownPcs); // shutdownPcs 정보를 배열에 추가
        }
      });

      // 최신 순으로 정렬
      shutdownPcs.sort((a, b) => b.timestamp - a.timestamp);

      // 최대 5개로 제한
      const limitedShutdownPcs = shutdownPcs.slice(0, 5);
      console.log("limitedShutdownPcs => ", limitedShutdownPcs);

      // 새로운 shutdownPcIds가 이전 shutdownPcIds와 다르면 모달을 띄우기
      if (
        limitedShutdownPcs.length > 0 &&
        !arraysEqual(
          limitedShutdownPcs.map((pc) => pc.id),
          previousShutdownPcIds.map((pc) => pc.id)
        )
      ) {
        setShutdownPcIds(limitedShutdownPcs); // 새로운 shutdownPcIds 상태 업데이트
        setOpenModal(true); // 모달 열기
        setPreviousShutdownPcIds(limitedShutdownPcs); // 이전 shutdownPcIds 상태 업데이트
      }
    };

    // 에러가 발생했을 때
    eventSource.onerror = (error) => {
      console.error("SSE 연결에 문제가 발생했습니다:", error);
      eventSource.close(); // 에러가 발생하면 SSE 연결을 종료
    };

    // 컴포넌트가 언마운트 될 때 SSE 연결 종료
    return () => {
      eventSource.close();
    };
  }, [id, navigate, previousShutdownPcIds]);

  // 그룹 클릭 시 해당 그룹 ID에 맞는 페이지로 이동하는 함수
  const handleGroupClick = (group) => {
    const newPath = [...path, { name: group.groupName, id: group.groupId }];
    dispatch(setPath(newPath)); // 클릭한 그룹을 Redux 스토어에 업데이트
    navigate(`/monitoring/${group.groupId}`); // 해당 그룹 ID로 페이지 이동
  };

  const handleCloseModal = () => {
    setOpenModal(false); // 모달 닫기
    setShutdownPcIds([]); // PC ID 초기화
  };

  // 두 배열이 같은지 확인하는 함수
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  // 그룹 개수에 따른 width 계산 함수
  const getWidthBasedOnGroupCount = (groupCount) => {
    if (groupCount <= 4) {
      return "40%"; // 그룹이 4개 이하일 때는 큰 크기
    } else if (groupCount <= 5) {
      return "15%"; // 그룹이 5개일 때 중간 크기
    } else {
      return "14%"; // 그룹이 6개 이상일 때 작은 크기
    }
  };

  const groupCount = groupStatusData.length;

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        모니터링
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {loading ? (
          // 로딩 중일 때 스켈레톤 박스 표시
          [...Array(4)].map((_, index) => (
            <Box
              key={`skeleton-${index}`}
              sx={{
                backgroundColor: "#f5f5f5",
                border: "1px solid gray",
                width: "40%",
                padding: "20px",
                margin: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Skeleton variant="text" width={120} height={40} /> {/* 그룹명 */}
              <Box sx={{ textAlign: "center", mt: 2, width: "100%" }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={40}
                  sx={{ mx: "auto", mb: 2 }}
                />{" "}
                {/* Total */}
                <Skeleton
                  variant="text"
                  width="50%"
                  height={30}
                  sx={{ mx: "auto", mb: 1 }}
                />{" "}
                {/* Normal */}
                <Skeleton
                  variant="text"
                  width="50%"
                  height={30}
                  sx={{ mx: "auto", mb: 1 }}
                />{" "}
                {/* Shutdown */}
                <Skeleton
                  variant="text"
                  width="50%"
                  height={30}
                  sx={{ mx: "auto", mb: 1 }}
                />{" "}
                {/* Warning */}
                <Skeleton
                  variant="text"
                  width="50%"
                  height={30}
                  sx={{ mx: "auto" }}
                />{" "}
                {/* Unknown */}
              </Box>
            </Box>
          ))
        ) : groupStatusData.length === 0 ? (
          <Typography variant="h6" sx={{ my: 3 }}>
            데이터가 없습니다.
          </Typography>
        ) : (
          // 데이터 표시
          groupStatusData.map((group) => (
            <Box
              key={group.groupId}
              onClick={() => handleGroupClick(group)} // 클릭 이벤트
              sx={{
                backgroundColor:
                  group.statusCount.Shutdown > 0
                    ? "rgba(255, 0, 0, 0.2)"
                    : "#f5f5f5", // Shutdown이 있으면 빨간 배경
                border: "1px solid gray",
                width: getWidthBasedOnGroupCount(groupCount), // 그룹 개수에 따라 width 조정
                padding: "20px",
                margin: "10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer", // 마우스 포인터 추가
                boxShadow:
                  group.statusCount.Shutdown > 0
                    ? "0px 0px 15px rgba(255, 0, 0, 0.5)"
                    : "0px 0px 5px rgba(0, 0, 0, 0.1)", // Shutdown이 있으면 그림자 추가
                transition: "transform 0.3s", // 애니메이션 효과 추가
                "&:hover": {
                  transform: "scale(1.05)", // 호버 시 상자가 커지게 함
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: group.statusCount.Shutdown > 0 ? "red" : "inherit", // Shutdown이 있으면 빨간 텍스트
                  fontWeight:
                    group.statusCount.Shutdown > 0 ? "bold" : "normal",
                }}
              >
                {group.groupName}
              </Typography>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography
                  sx={{
                    fontSize: "20px", // PC 수의 글자 크기를 더 크게 설정
                    fontWeight: "bold", // 굵게 설정
                    color: "#1976d2", // 색상을 파란색으로 강조
                    mb: 2, // 하단 여백 추가
                  }}
                >
                  💻 Total:{" "}
                  {loading ? (
                    <Skeleton width={30} sx={{ display: "inline-block" }} />
                  ) : (
                    group.pcCount
                  )}
                </Typography>
                {/* 상태별 아이콘 */}
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <span style={{ fontSize: "24px", color: "green" }}>🟢</span>{" "}
                  Normal:{" "}
                  {loading ? (
                    <Skeleton width={30} sx={{ display: "inline-block" }} />
                  ) : (
                    group.statusCount.Normal
                  )}
                </Typography>
                <Typography
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: group.statusCount.Shutdown > 0 ? "18px" : "16px", // Shutdown 상태일 경우 글자 크기 확대
                    fontWeight:
                      group.statusCount.Shutdown > 0 ? "bold" : "normal", // 강조
                  }}
                >
                  <span style={{ fontSize: "28px", color: "red" }}>🔴</span>{" "}
                  Shutdown:{" "}
                  {loading ? (
                    <Skeleton width={30} sx={{ display: "inline-block" }} />
                  ) : (
                    group.statusCount.Shutdown
                  )}
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <span style={{ fontSize: "24px", color: "orange" }}>🟠</span>{" "}
                  Warning:{" "}
                  {loading ? (
                    <Skeleton width={30} sx={{ display: "inline-block" }} />
                  ) : (
                    group.statusCount.Warning
                  )}
                </Typography>
                <Typography
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <span style={{ fontSize: "24px", color: "gray" }}>⚪</span>{" "}
                  Unknown:{" "}
                  {loading ? (
                    <Skeleton width={30} sx={{ display: "inline-block" }} />
                  ) : (
                    group.statusCount.Unknown
                  )}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <ShutdownModal
        open={openModal}
        onClose={handleCloseModal}
        shutdownPcIds={shutdownPcIds}
        groupData={groupData}
      />
    </div>
  );
};

export default Monitoring;
