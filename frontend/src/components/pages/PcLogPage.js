import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip as MuiTooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ComputerIcon from "@mui/icons-material/Computer";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { Line } from "react-chartjs-2";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";
import { API_URL } from "../../config/constants";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const PcLogPage = () => {
  const { pcId } = useParams();
  const [pcInfo, setPcInfo] = useState(null);
  const [logData, setLogData] = useState({
    labels: [],
    datasets: [],
  });

  const [startDate, setStartDate] = useState(dayjs().subtract(30, "day"));
  const [endDate, setEndDate] = useState(dayjs());

  const fetchPcLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/getPcLogs/${pcId}`, {
        params: {
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        },
      });
      const { logs, pcInfo } = response.data;

      setPcInfo(pcInfo);

      const dateGroups = {};
      logs.forEach((log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!dateGroups[date]) {
          dateGroups[date] = {
            Normal: 0,
            Warning: 0,
            Shutdown: 0,
            Unknown: 0,
          };
        }
        dateGroups[date][log.status]++;
      });

      const dates = Object.keys(dateGroups).sort();
      setLogData({
        labels: dates,
        datasets: [
          {
            label: "Normal",
            data: dates.map((date) => dateGroups[date].Normal),
            borderColor: "#28a745",
            tension: 0.1,
          },
          {
            label: "Warning",
            data: dates.map((date) => dateGroups[date].Warning),
            borderColor: "#ffc107",
            tension: 0.1,
          },
          {
            label: "Shutdown",
            data: dates.map((date) => dateGroups[date].Shutdown),
            borderColor: "#dc3545",
            tension: 0.1,
          },
          {
            label: "Unknown",
            data: dates.map((date) => dateGroups[date].Unknown),
            borderColor: "#6c757d",
            tension: 0.1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching PC logs:", error);
    }
  };

  useEffect(() => {
    fetchPcLogs();
  }, [pcId, startDate, endDate]);

  const handleRefresh = () => {
    fetchPcLogs();
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `PC 상태 로그 (${pcInfo?.name || "Loading..."})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "발생 횟수",
        },
      },
      x: {
        title: {
          display: true,
          text: "날짜",
        },
      },
    },
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* 상단 정보 카드 */}
      <Card
        sx={{
          mb: 3,
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  backgroundColor: "#e3f2fd",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ComputerIcon sx={{ fontSize: 45, color: "#1976d2" }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#1a237e",
                    mb: 0.5,
                  }}
                >
                  {pcInfo?.name || "Loading..."}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>시리얼 번호:</span>
                  {pcInfo?.serial_number}
                </Typography>
              </Box>
            </Stack>
            <MuiTooltip title="새로고침">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  backgroundColor: "#f5f5f5",
                  "&:hover": {
                    backgroundColor: "#e0e0e0",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* 날짜 선택 섹션 */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                p: 1,
                display: "flex",
              }}
            >
              <DateRangeIcon color="primary" />
            </Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ width: "100%" }}
              >
                <DatePicker
                  label="시작 날짜"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      },
                    },
                  }}
                />
                <DatePicker
                  label="종료 날짜"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  format="YYYY-MM-DD"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        backgroundColor: "white",
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      },
                    },
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Stack>
        </CardContent>
      </Card>

      {/* 그래프 카드 */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          transition: "transform 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Box sx={{ height: 450, position: "relative" }}>
          <Line
            options={{
              ...options,
              plugins: {
                ...options.plugins,
                legend: {
                  ...options.plugins.legend,
                  labels: {
                    usePointStyle: true,
                    padding: 25,
                    font: {
                      size: 13,
                      weight: "500",
                    },
                  },
                },
              },
              scales: {
                ...options.scales,
                y: {
                  ...options.scales.y,
                  grid: {
                    color: "rgba(0, 0, 0, 0.04)",
                    drawBorder: false,
                  },
                  ticks: {
                    font: {
                      size: 12,
                    },
                  },
                },
                x: {
                  ...options.scales.x,
                  grid: {
                    color: "rgba(0, 0, 0, 0.04)",
                    drawBorder: false,
                  },
                  ticks: {
                    font: {
                      size: 12,
                    },
                  },
                },
              },
            }}
            data={logData}
          />
        </Box>
      </Card>
    </Box>
  );
};

export default PcLogPage;
