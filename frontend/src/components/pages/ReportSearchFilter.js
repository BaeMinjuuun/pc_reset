// ReportSearchFilter.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { styled, alpha } from "@mui/material/styles";

const Search = styled("div")(({ theme, hasQuery }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: hasQuery
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.common.white, 0.15),
  border: "1px solid gray",
  "&:hover": {
    backgroundColor: hasQuery
      ? alpha(theme.palette.primary.main, 0.25)
      : alpha(theme.palette.common.white, 0.25),
  },
  width: "100%",
  maxWidth: "300px",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "100%",
  },
}));

const ReportSearchFilter = ({ onSearch }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("3개월");
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [startDate, setStartDate] = useState(dayjs().subtract(3, "month"));
  const [endDate, setEndDate] = useState(dayjs());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("PC");

  useEffect(() => {
    onSearch({
      period: selectedPeriod,
      status: selectedStatus === "전체" ? null : selectedStatus,
      startDate,
      endDate,
      searchQuery,
      filterBy,
    });
  }, [
    selectedPeriod,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
    filterBy,
  ]);

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod) {
      setSelectedPeriod(newPeriod);

      // "직접입력"을 선택할 때는 날짜 변경을 사용자가 지정하도록 하고, 다른 경우 자동 설정
      if (newPeriod === "직접입력") {
        return;
      }

      const dateMap = {
        전체: [dayjs().subtract(2, "year"), dayjs()],
        오늘: [dayjs().startOf("day"), dayjs()],
        "1개월": [dayjs().subtract(1, "month"), dayjs()],
        "3개월": [dayjs().subtract(3, "month"), dayjs()],
        "1년": [dayjs().subtract(1, "year"), dayjs()],
      };

      const [newStart, newEnd] = dateMap[newPeriod] || [startDate, endDate];
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };

  // 날짜를 직접 변경할 때 "직접입력" 선택 활성화
  const handleStartDateChange = (newValue) => {
    setStartDate(dayjs(newValue).startOf("day"));
    setSelectedPeriod("직접입력"); // 날짜 변경 시 "직접입력" 자동 선택
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(dayjs(newValue).endOf("day"));
    setSelectedPeriod("직접입력"); // 날짜 변경 시 "직접입력" 자동 선택
  };

  const handleStatusChange = (event, newStatus) => {
    if (newStatus) setSelectedStatus(newStatus);
  };

  const handleFilterChange = (event) => setFilterBy(event.target.value);
  const handleSearchQueryChange = (event) => setSearchQuery(event.target.value);

  console.log(
    "start => ",
    dayjs(startDate).format("MM-DD HH:mm:ss"),
    "end => ",
    dayjs(endDate).format("MM-DD HH:mm:ss")
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          boxShadow: 1,
          padding: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: 1.5,
          // width: "73%",
        }}
      >
        {/* 기간 선택 */}

        <Box display="block" flexDirection="row" gap={2}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography
              variant="h6"
              sx={{
                fontSize: "1rem",
                mb: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              기간
              <ToggleButtonGroup
                value={selectedPeriod}
                exclusive
                onChange={handlePeriodChange}
                aria-label="기간 선택"
                size="small"
                sx={{ ml: 3, height: "55px" }}
              >
                <ToggleButton value="전체">전체</ToggleButton>
                <ToggleButton value="오늘">오늘</ToggleButton>
                <ToggleButton value="1개월">1개월</ToggleButton>
                <ToggleButton value="3개월">3개월</ToggleButton>
                <ToggleButton value="1년">1년</ToggleButton>
                <ToggleButton value="직접입력">직접입력</ToggleButton>
              </ToggleButtonGroup>
              <Box display="flex" gap={1} sx={{ ml: 7 }}>
                <DesktopDatePicker
                  label="시작일"
                  inputFormat="YYYY-MM-DD"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
                <DesktopDatePicker
                  label="종료일"
                  inputFormat="YYYY-MM-DD"
                  value={endDate}
                  onChange={handleEndDateChange}
                />
              </Box>
            </Typography>
          </Box>
          <Box
            sx={{ borderBottom: "solid 1px lightGray", width: "100%", my: 1 }}
          ></Box>
          {/* 상태 선택 */}
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6" sx={{ fontSize: "1rem", mr: 1 }}>
              상태
              <ToggleButtonGroup
                value={selectedStatus}
                exclusive
                onChange={handleStatusChange}
                aria-label="상태 선택"
                size="small"
                sx={{ ml: 3 }}
              >
                <ToggleButton value="전체">전체</ToggleButton>
                <ToggleButton value="Normal">Normal</ToggleButton>
                <ToggleButton value="NOT Normal">NOT Normal</ToggleButton>
                <ToggleButton value="Shutdown">Shutdown</ToggleButton>
                <ToggleButton value="Unknown">Unknown</ToggleButton>
                <ToggleButton value="Reset">Reset</ToggleButton>
              </ToggleButtonGroup>
            </Typography>
          </Box>
        </Box>
        {/* <Button variant="contained" onClick={() => onSearch({ period: selectedPeriod, status: selectedStatus, startDate, endDate, searchQuery, filterBy })}>
            조회하기
          </Button> */}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          ml: "80%",
          my: 2,
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FormControl
            sx={{
              minWidth: 100,
              height: "40px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
              },
            }}
          >
            <InputLabel>Filter By</InputLabel>
            <Select
              value={filterBy}
              onChange={handleFilterChange}
              label="Filter By"
            >
              <MenuItem value="PC">PC</MenuItem>
              <MenuItem value="SN">SN</MenuItem>
            </Select>
          </FormControl>
          <Search hasQuery={!!searchQuery}>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchQueryChange}
            />
          </Search>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportSearchFilter;
