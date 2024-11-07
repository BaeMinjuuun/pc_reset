import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { styled, alpha } from "@mui/material/styles";
import axios from "axios";
import { API_URL } from "../../config/constants";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  border: "1px solid gray",
  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.25) },
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
    transition: theme.transitions.create("width"),
    width: "100%",
  },
}));

const SettingLog = () => {
  const [changesLogData, setChangesLogData] = useState([]);
  const [filteredLogData, setFilteredLogData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("item");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0); // 전체 로그 수
  const logsPerPage = 20; // 페이지당 표시할 로그 수


  const fetchData = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/getChangesLog`, {
        params: { page, limit: logsPerPage },
      });
      setChangesLogData(response.data.changesLog);
      setFilteredLogData(response.data.changesLog);
      setTotalLogs(response.data.totalLogs); // 전체 로그 수 업데이트
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const filtered = changesLogData.filter((log) => {
      if (filterBy === "item") {
        return log.item.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (filterBy === "user") {
        const user = log.user_id ? log.user_id.toLowerCase() : "N/A";
        return user.includes(searchQuery.toLowerCase());
      }
      return true;
    });
    setFilteredLogData(filtered);
  }, [searchQuery, filterBy, changesLogData]);

  const handleSearchQueryChange = (event) => setSearchQuery(event.target.value);
  const handleFilterByChange = (event) => setFilterBy(event.target.value);
  const handlePageChange = (event, value) => setCurrentPage(value); // 페이지 변경 핸들러

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          mb: 2,
        }}
      >
        <FormControl
          variant="outlined"
          sx={{
            minWidth: 100,
            height: "40px",
            "& .MuiOutlinedInput-root": { height: "40px" },
          }}
        >
          <InputLabel>Filter By</InputLabel>
          <Select
            value={filterBy}
            onChange={handleFilterByChange}
            label="Filter By"
          >
            <MenuItem value="item">Item</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search"
            inputProps={{ "aria-label": "search" }}
            value={searchQuery}
            onChange={handleSearchQueryChange}
          />
        </Search>
      </Box>

      <TableContainer component={Paper}>
        <Table
          sx={{
            "& .MuiTableCell-root": {
              textAlign: "center",
              padding: "3px",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Item</TableCell>
              <TableCell sx={{ width: "300px" }}>Description</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: "center" }}>
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogData.map((log, index) => (
                <TableRow key={log.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{log.item}</TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.user_id || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" marginTop="20px">
        <Pagination
          count={Math.ceil(totalLogs / logsPerPage)} // 총 페이지 수
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default SettingLog;
