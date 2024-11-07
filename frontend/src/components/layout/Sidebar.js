import { useState, useEffect, useRef } from "react";
import axios from "axios"; // 데이터 요청을 위한 Axios 임포트
import { API_URL } from "../../config/constants"; // API URL 가져오기
import {
  Drawer,
  List,
  ListItem,
  IconButton,
  Divider,
  Typography,
  Box,
  Skeleton,
} from "@mui/material"; // Material UI 컴포넌트 사용
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Link as RouterLink, useLocation } from "react-router-dom"; // 라우터 관련 훅 사용
import { useDispatch, useSelector } from "react-redux"; // Redux를 사용하기 위한 훅 임포트
import { setPath } from "../redux/store/pathSlice"; // 경로 관리 slice 임포트

const Sidebar = ({ open, toggleDrawer, groupData, isLoading }) => {
  const [data, setData] = useState([]); // 그룹 데이터를 저장하기 위한 상태 변수
  const [openItems, setOpenItems] = useState({}); // 열려 있는 항목들을 관리하기 위한 상태
  const [selectedId, setSelectedId] = useState(null); // 선택된 항목의 ID를 저장하기 위한 상태
  const location = useLocation(); // 현재 라우트의 경로를 가져오기 위한 훅
  const dispatch = useDispatch(); // Redux dispatch 함수
  const user_id = useSelector((state) => state.auth.user_id);
  const [groupPcCounts, setGroupPcCounts] = useState({});

  // URL에서 현재 경로의 ID를 추출하는 함수
  const extractIdFromPath = () => {
    const match = location.pathname.match(/\/(\d+)/);
    return match ? Number(match[1]) : null; // URL에서 숫자(그룹 ID) 추출
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(groupData);

        const currentId = extractIdFromPath();
        if (currentId) {
          const currentItem = groupData.find((item) => item.id === currentId);
          if (currentItem) {
            openItemsForPath(currentItem);
            setSelectedId(currentItem.id);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [groupData, location]);

  useEffect(() => {
    const fetchGroupPcCounts = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/getPcCountsByGroupHierarchy`
        );
        const countsMap = response.data.reduce((acc, item) => {
          acc[item.group_id] = item.count;
          return acc;
        }, {});
        setGroupPcCounts(countsMap);
      } catch (error) {
        console.error("Error fetching PC counts:", error);
      }
    };

    fetchGroupPcCounts();
  }, []);

  // 그룹 데이터를 트리 구조로 변환하는 함수
  const buildCategoryTree = (categories) => {
    const categoryMap = {};
    const tree = [];

    // 각 카테고리의 ID를 키로 하는 맵을 만듬
    categories.forEach((category) => {
      categoryMap[category.id] = {
        ...category,
        children: [], // 하위 그룹을 저장할 배열 추가
      };
    });

    // 부모 ID를 기준으로 그룹을 트리 형태로 변환
    categories.forEach((category) => {
      if (category.parent_id === null) {
        tree.push(categoryMap[category.id]); // 최상위 그룹을 트리에 추가
      } else {
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(
            categoryMap[category.id]
          ); // 하위 그룹을 부모 그룹의 children에 추가
        }
      }
    });

    return tree; // 트리 구조 반환
  };

  const sidebarItems = buildCategoryTree(groupData); // 그룹 데이터를 트리 형태로 변환

  // 선택된 경로에 맞는 아이템을 열어주는 함수
  const openItemsForPath = (item) => {
    const fullPath = getFullPath(item, groupData); // 선택된 그룹까지의 전체 경로 계산
    const newOpenItems = {};
    fullPath.forEach((pathItem) => {
      newOpenItems[pathItem.id] = true; // 해당 경로에 있는 모든 그룹을 열기
    });
    setOpenItems(newOpenItems); // 열려 있는 항목 상태 업데이트
  };

  // 항목 클릭 시 열기/닫기 상태 및 Redux에 경로 저장
  const handleItemClick = (item) => {
    setOpenItems((prev) => ({
      ...prev,
      [item.id]: !prev[item.id], // 클릭한 아이템의 상태를 반전시킴
    }));
    setSelectedId(item.id); // 선택된 ID를 상태에 저장
    dispatch(setPath(getFullPath(item, data))); // 전체 경로를 Redux에 저장
  };

  // 클릭한 항목의 전체 경로를 재귀적으로 계산하는 함수
  const getFullPath = (item, categories) => {
    let path = [];

    // 클로저로 경로를 재귀적으로 빌드
    (function buildPath(currentItem) {
      if (!currentItem) return;
      path.unshift({ name: currentItem.name, id: currentItem.id }); // 경로의 맨 앞에 추가
      const parent = categories.find((cat) => cat.id === currentItem.parent_id); // 부모 그룹을 찾음
      buildPath(parent); // 부모 그룹에 대해 재귀 호출
    })(item);

    return path; // 경로 반환
  };

  // 트리 구조를 렌더링하는 함수 (재귀적 호출)
  const renderItems = (items, level = 0) => {
    if (isLoading) {
      if (level === 0) {
        // 최상위 레벨 스켈레톤
        return Array(3)
          .fill(0)
          .map((_, index) => (
            <div key={`top-skeleton-${index}`}>
              {/* 최상위 항목 스켈레톤 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  marginLeft: level * 2,
                  padding: "4px",
                  margin: "4px 8px",
                }}
              >
                <Skeleton
                  variant="circular"
                  width={20}
                  height={20}
                  sx={{ mr: 1 }}
                />
                <Skeleton variant="rectangular" width="80%" height={24} />
              </Box>

              {/* 각 최상위 항목 아래 하위 항목 스켈레톤 */}
              {index === 0 && ( // 첫 번째 최상위 항목에만 하위 항목 표시
                <Box sx={{ ml: 4 }}>
                  {Array(4)
                    .fill(0)
                    .map((_, subIndex) => (
                      <Box
                        key={`sub-skeleton-${subIndex}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          padding: "4px",
                          margin: "4px 8px",
                        }}
                      >
                        <Skeleton
                          variant="circular"
                          width={20}
                          height={20}
                          sx={{ mr: 1 }}
                        />
                        <Skeleton
                          variant="rectangular"
                          width="70%"
                          height={20}
                          sx={{ opacity: 0.7 }} // 하위 항목은 약간 흐리게
                        />
                      </Box>
                    ))}
                </Box>
              )}
            </div>
          ));
      }
      return null; // 하위 레벨에서는 스켈레톤을 추가로 렌더링하지 않음
    }

    return items.map((item) => (
      <div key={item.id}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginLeft: level * 2,
            height: "30px",
          }}
        >
          {/* 아이콘 ListItem - 펼침/접힘만 담당 */}
          <ListItem
            sx={{
              width: "auto",
              p: 0,
              minWidth: "30px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenItems((prev) => ({
                ...prev,
                [item.id]: !prev[item.id],
              }));
            }}
          >
            {item.children.length > 0 ? (
              openItems[item.id] ? (
                <ExpandMoreIcon sx={{ fontSize: 20 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              )
            ) : (
              <div style={{ width: 20 }} />
            )}
          </ListItem>

          {/* 텍스트 ListItem - 페이지 이동 담당 */}
          <ListItem
            sx={{
              flex: 1,
              p: 0.5,
              cursor: "pointer",
              color: selectedId === item.id ? "white" : "black",
              backgroundColor:
                selectedId === item.id ? "#2E64FE" : "transparent",
              "&:hover": {
                backgroundColor:
                  selectedId === item.id ? "#2E64FE" : "rgba(0, 0, 0, 0.1)",
              },
              borderRadius: "4px",
            }}
            onClick={() => handleItemClick(item)}
            component={RouterLink}
            to={`${location.pathname.replace(/\/\d+$/, "")}/${item.id}`}
          >
            <Typography>
              {item.name}{" "}
              <Typography component="span" sx={{ fontSize: 13, ml: 1 }}>
                [{groupPcCounts[item.id] || 0}]
              </Typography>
            </Typography>
          </ListItem>
        </Box>

        {openItems[item.id] && (
          <List component="div" disablePadding>
            {renderItems(item.children, level + 1)}
          </List>
        )}
      </div>
    ));
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: "240px",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: "240px",
          overflowX: "hidden", // 스크롤바 없애기
        },
      }}
    >
      <div style={{ display: "flex" }}>
        <IconButton onClick={toggleDrawer}>
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            color: "black",
            ml: "15px",
            fontWeight: "bold",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <RouterLink
              to="/"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Box sx={{ mt: 1, fontSize: 15 }}>PC Reset Manager</Box>
            </RouterLink>
          </Box>
        </Typography>
      </div>
      <Divider />
      <List>{renderItems(sidebarItems)}</List> {/* 사이드바 아이템 렌더링 */}
    </Drawer>
  );
};

export default Sidebar;
