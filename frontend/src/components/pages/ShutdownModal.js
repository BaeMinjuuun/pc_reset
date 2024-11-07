import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Backdrop,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setPath } from "../redux/store/pathSlice";
import { useDispatch, useSelector } from "react-redux";


const ShutdownModal = ({ open, onClose, shutdownPcIds, groupData }) => {
  const dispatch = useDispatch(); // 
  const path = useSelector((state) => state.path.path); // 현재 path를 가져오기 위한 Redux selector
  const navigate = useNavigate();
  // const groupedIds = [];

  const formattedPcIds = shutdownPcIds.map((pc) => ({
    id: pc.id,
    name: pc.name,
    group_id: pc.groupId, // groupId로 수정
  }));
  
  const handleClick = (group_id, name) => {
    // 그룹 계층을 찾아서 경로 생성
    const hierarchy = findGroupHierarchy(group_id, groupData);
  
    // 계층 정보를 배열로 나눔 (사업장 > 캠퍼스 > 공장 등 순차적으로 경로를 나누기 위해)
    const hierarchyArray = hierarchy.split(' > ');
  
    // 기존 path에서 중복된 그룹을 제외하고 계층 경로 추가
    const newPath = hierarchyArray.map((groupName, index) => {
      // 그룹 이름을 기준으로 groupData에서 해당 그룹을 찾아서 경로 설정
      const foundGroup = groupData.find((g) => g.name === groupName);
      return foundGroup ? { id: foundGroup.id, name: foundGroup.name } : null;
    }).filter(Boolean);
  
    // 중복된 경로를 제거 (현재 path에 포함된 그룹들은 제외)
    const uniquePath = newPath.filter((newItem) => !path.some((p) => p.id === newItem.id));
  
    // 중복을 제거한 경로로 업데이트
    dispatch(setPath([...path, ...uniquePath])); 
    navigate(`/monitoringList/${group_id}`); // 마지막 그룹으로 이동
  };  

  // 그룹 계층을 재귀적으로 찾는 함수
  const findGroupHierarchy = (groupId, groupData) => {
    const group = groupData.find((g) => g.id === groupId);
    if (!group) return ""; // 그룹을 찾지 못한 경우
    if (!group.parent_id) return group.name; // 최상위 부모 그룹

    // 부모 그룹을 재귀적으로 찾음
    const parentHierarchy = findGroupHierarchy(group.parent_id, groupData);
    return `${parentHierarchy} > ${group.name}`; // 부모 이름 > 현재 그룹 이름 형식으로 반환
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropComponent={Backdrop}
      BackdropProps={{
        style: { backgroundColor: "rgba(255, 0, 0, 0.5)" }, // 붉은색 배경 적용
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Shutdown PC 발생
        </Typography>
        <Typography variant="body1">
          버튼을 누르면 해당 PC가 속한 페이지로 이동합니다.
        </Typography>
        <Typography sx={{ fontSize: 12, color: "gray" }}>
          해당 PC에 마우스를 올리면 해당 그룹을 확인할 수 있습니다.
        </Typography>

        {/* Material UI List for a more stylish display */}
        <List>
          {formattedPcIds.map((item) => {
            const groupHierarchy = findGroupHierarchy(item.group_id, groupData);
            return (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      handleClick(item.group_id, item.name);
                    }}
                  >
                    해당 PC Reset
                  </Button>
                }
              >
                <Tooltip
                  title={`${groupHierarchy}`}
                  placement="top"
                  PopperProps={{
                    modifiers: [
                      {
                        name: "offset",
                        options: {
                          offset: [-60, -10], // 툴팁 위치 미세 조정 (텍스트 위쪽)
                        },
                      },
                    ],
                  }}
                >
                  <ListItemText primary={`🔴${item.name}`} />
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          <Button onClick={onClose} variant="">
            닫기
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ShutdownModal;
