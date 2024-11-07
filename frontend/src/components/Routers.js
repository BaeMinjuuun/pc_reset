import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import Setting from "./pages/Setting";
import PcResetModule from "./pages/PcResetModule";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MonitoringBox from "./pages/MonitoringBox";
import MonitoringList from "./pages/MonitoringList";
import MonitoringDepth4 from "./pages/MoniotringDepth4";
import { Box } from "@mui/material";
import LogPage from "./pages/LogPage";
import UserPage from "./pages/UserPage";
import UserModal from "./pages/UserModal";
import Breadcrumb from "./pages/Breadcrumb";
import { API_URL } from "../config/constants";
import BoardPage from "./pages/BoardPage";
import WriteBoard from "./pages/WriteBoard";
import EditBoard from "./pages/EditBoard";
import DetailBoard from "./pages/DetailBoard";
import Profile from "./pages/Profile";
import DbInterface from "./pages/DbInterface";
import SettingLog from "./pages/SettingLog";
import PcLogPage from "./pages/PcLogPage";

const Routers = () => {
  const [open, setOpen] = useState(true);
  const [groupData, setGroupData] = useState([]);
  const [pcData, setPcData] = useState([]);
  const [pcList, setPcList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [groupCounts, setGroupCounts] = useState([]);
  const [groupPcCounts, setGroupPcCounts] = useState({});
  const [totalPcCount, setTotalPcCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [groups, pcData, groupCounts] = await Promise.all([
          axios.get(`${API_URL}/getGroup`),
          axios.get(`${API_URL}/getPC`, {
            params: { page: 1, limit: 50 },
          }),
          axios.get(`${API_URL}/getPcCountByGroup`),
        ]);

        setPcData(pcData.data.pcList);
        setTotalPcCount(pcData.data.totalCount);
        setGroupData(groups.data);

        // 그룹별 PC 수를 객체로 변환
        const countsMap = groupCounts.data.reduce((acc, item) => {
          acc[item.group_id] = item._count.id;
          return acc;
        }, {});
        setGroupPcCounts(countsMap);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDrawer = () => {
    setOpen((cur) => !cur);
  };

  const loadMorePCs = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/getPC`, {
        params: { page: page + 1, limit: 50 },
      });

      setPcData((prev) => [...prev, ...response.data.pcList]);
      setPage(page + 1);
    } catch (error) {
      console.error("추가 데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, clientHeight, scrollHeight } = e.target;
      if (scrollHeight - scrollTop === clientHeight) {
        loadMorePCs();
      }
    },
    [page, isLoading]
  );

  return (
    <div onScroll={handleScroll}>
      <Navbar toggleDrawer={toggleDrawer} groupData={groupData} open={open} />
      <Box sx={{ display: "flex" }}>
        <Sidebar
          open={open}
          toggleDrawer={toggleDrawer}
          groupData={groupData}
          pcData={pcData}
          pcList={pcList}
          isLoading={isLoading}
          totalPcs={totalPcCount}
          groupPcCounts={groupPcCounts}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 7,
            transition: "margin 0.3s",
            marginLeft: open ? 0 : -30,
          }}
        >
          <Breadcrumb groupData={groupData} />
          <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<MainPage />} />
            <Route
              path="/setting"
              element={<Setting groupData={groupData} />}
            />
            <Route
              path="/setting/:id"
              element={<Setting groupData={groupData} />}
            />
            <Route
              path="/pc-reset/:id"
              element={<PcResetModule groupData={groupData} />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/monitoring/:id"
              element={<MonitoringBox groupData={groupData} />}
            />
            <Route path="/monitoringList/:id" element={<MonitoringList />} />
            <Route
              path="/monitoring4/:id"
              element={<MonitoringDepth4 groupData={groupData} />}
            />
            <Route path="/log/:id" element={<LogPage />} />
            <Route path="/pcLog/:pcId" element={<PcLogPage />} />
            <Route path="/user" element={<Profile />} />
            <Route path="/userManage" element={<UserPage />} />
            <Route path="/user/:id" element={<UserPage />} />
            <Route path="/users/:id" element={<UserModal />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/writeBoard" element={<WriteBoard />} />
            <Route path="/editBoard/:id" element={<EditBoard />} />
            <Route path="/detailBoard/:id" element={<DetailBoard />} />
            <Route path="/db-interface" element={<DbInterface />} />
            <Route path="/setting-log" element={<SettingLog />} />
          </Routes>
        </Box>
      </Box>
    </div>
  );
};

export default Routers;
