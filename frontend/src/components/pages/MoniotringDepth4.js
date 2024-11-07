import React, { useState, useEffect } from "react";
import { Typography, Box, Grid2 } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/constants";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux"; // Redux 사용
import { setPath } from "../redux/store/pathSlice"; // Redux action 불러오기

// 육각형 스타일 컴포넌트
const Hexagon = ({ status }) => {
  const getColor = (status) => {
    switch (status) {
      case "Normal":
        return "#28a745"; // 초록색 : Normal
      case "Shutdown":
        return "#dc3545"; // 빨간색 : Shutdown
      case "Warning":
        return "#ffc107"; // 주황색 : Warning
      case "Unknown":
        return "#6c757d"; // 회색 : Unknown
      default:
        return "#6c757d"; // 회색 : Unknown
    }
  };

  return (
    <Box
      sx={{
        width: "30px",
        height: "30px",
        backgroundColor: getColor(status),
        clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
        margin: "-1px",
        transform: "rotate(90deg)",
      }}
    />
  );
};

const MonitoringDepth4 = () => {
  const [groupStatusData, setGroupStatusData] = useState([]);
  const navigate = useNavigate(); // navigate 함수 정의
  const { id } = useParams();
  const dispatch = useDispatch(); // Redux dispatch
  const path = useSelector((state) => state.path.path); // 현재 path를 가져오기 위한 Redux selector

  // 그룹 클릭 시 해당 그룹 ID에 맞는 페이지로 이동하는 함수
  const handleGroupClick = (group) => {
    const newPath = [...path, { name: group.groupName, id: group.groupId }];
    dispatch(setPath(newPath)); // 클릭한 그룹을 Redux 스토어에 업데이트
    navigate(`/monitoringList/${group.groupId}`); // 해당 그룹 ID로 페이지 이동
  };

  useEffect(() => {
    const checkGroupDepth = async () => {
      try {
        const response = await axios.get(`${API_URL}/getGroupDepth/${id}`);
        const depth = response.data.depth;

        // 뎁스에 따라 다른 페이지로 이동
        if (depth === 1) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 2) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 3) {
          navigate(`/monitoring/${id}`);
        } else if (depth === 5) {
          navigate(`/monitoringList/${id}`);
        }
      } catch (error) {
        console.error("Error fetching group depth:", error);
      }
    };

    checkGroupDepth(); // 그룹의 깊이를 확인하여 페이지 이동

    // 그룹의 상태 데이터 실시간 가져오기
    const eventSource = new EventSource(
      `${API_URL}/getGroupStatusWithDescendants/${id}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setGroupStatusData(data);
    };

    eventSource.onerror = (error) => {
      console.error("SSE 연결에 문제가 발생했습니다:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [id, navigate]); // navigate를 의존성 배열에 추가

  const renderGroupStatus = (group) => {
    const pcCount = group.pcCount;
    console.log("group:", group);

    // 모든 상태의 PC들을 합쳐서 하나의 배열로 만듦
    const allPcs = [
      ...group.pcDetails.normalPcs,
      ...group.pcDetails.shutdownPcs,
      ...group.pcDetails.warningPcs,
      ...group.pcDetails.unknownPcs,
    ];

    // PC ID 기준으로 정렬
    const sortedPcs = allPcs.sort((a, b) => a.id - b.id);

    // 정렬된 PC 상태 배열 생성 (최대 42개까지)
    const pcStatuses = sortedPcs.map((pc) => pc.status).slice(0, 42); // 42개까지만 자름

    // 7개씩 그룹화해서 줄 단위로 묶기
    const rows = Array.from(
      { length: Math.ceil(pcStatuses.length / 7) },
      (_, i) => pcStatuses.slice(i * 7, i * 7 + 7)
    );

    return (
      <Box
        key={group.groupId}
        sx={{
          border: "1px solid gray",
          borderColor: group.statusCount.Shutdown > 0 ? "red" : "#ddd",
          padding: "20px",
          margin: "10px",
          width: "250px",
          height: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor:
            group.statusCount.Shutdown > 0 ? "rgba(255, 0, 0, 0.2)" : "#f5f5f5",
          "&:hover": {
            backgroundColor:
              group.statusCount.Shutdown > 0
                ? "rgba(255, 0, 0, 0.3)"
                : "#eaeaea",
          },
        }}
        onClick={() => handleGroupClick(group)}
      >
        <Typography variant="h6">
          {group.groupName} ({group.pcCount})
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          {/* 줄 단위로 렌더링 */}
          {rows.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: "flex",
                justifyContent: "center",
                marginLeft:
                  (rowIndex % 2 === 1 && row.length % 2 === 0) ||
                  (rowIndex % 2 === 0 && row.length % 2 === 1)
                    ? "28px"
                    : "0px",
                marginBottom: "-4px", // 위아래 간격 좁힘
              }}
            >
              {row.map((status, index) => (
                <Hexagon key={index} status={status} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Monitoring - Depth 4
      </Typography>
      <Grid2 container spacing={2} justifyContent="center">
        {groupStatusData.map((group) => (
          <Grid2 item key={group.groupId}>
            {renderGroupStatus(group)}
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
};

export default MonitoringDepth4;
