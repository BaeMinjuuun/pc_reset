import React, { useState, useEffect } from "react";
import { styled, alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import { Box, Select, MenuItem, FormControl, InputLabel } from "@mui/material";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  border: "1px solid gray",
  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  width: "100%",
  maxWidth: "300px", // 검색창의 최대 너비 설정
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

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("PC");

  // 입력이 변경될 때마다 검색 실행
  useEffect(() => {
    onSearch(searchQuery, filterBy); // searchQuery가 빈 값이어도 onSearch 호출
  }, [searchQuery, filterBy]);

  const handleChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterBy(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* 필터 옵션을 선택할 수 있는 Select 컴포넌트 */}
      <FormControl
        variant="outlined"
        sx={{
          minWidth: 100,
          height: "40px", // 검색창과 동일한 높이로 설정
          "& .MuiOutlinedInput-root": {
            height: "40px", // Select 박스의 높이도 동일하게 설정
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
          <MenuItem value="IP">IP</MenuItem>
        </Select>
      </FormControl>

      {/* 검색창 */}
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search"
          inputProps={{ "aria-label": "search" }}
          value={searchQuery}
          onChange={handleChange}
        />
      </Search>
    </Box>
  );
};

export default SearchBar;
