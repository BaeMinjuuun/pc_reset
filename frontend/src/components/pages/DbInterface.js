import { useEffect, useState } from "react";
import {
  Button,
  Box,
  Typography,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import axios from "axios";
import { API_URL } from "../../config/constants";
import { useSnackbar } from "notistack";

const DbInterface = () => {
  const [inputValue, setInputValue] = useState([]);
  const [dataFiles, setDataFiles] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  // dataFile 읽어오기
  useEffect(() => {
    const getDataFiles = async () => {
      try {
        const response = await axios.get(`${API_URL}/getDatafiles`);
        console.log(response.data);
        setDataFiles(response.data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    getDataFiles();
  }, []);

  // 업로드 버튼 클릭 시 실행되는 함수
  const handleUploadButtonClick = async (type) => {
    const inputValueArray = inputValue.split(",");
    try {
      const response = await axios.post(`${API_URL}/csvUpload/${type}`, {
        inputValueArray,
      });
      console.log(response.data);
      enqueueSnackbar(response.data.message, {
        variant: "success",
        autoHideDuration: 3000,
      });
    } catch (error) {
      console.error("Fetch error:", error);
      enqueueSnackbar(error.response.data.message, {
        variant: "error",
        autoHideDuration: 3000,
      });
    }
  };

  // TextField 값 변경 시 실행되는 함수
  const handleInputChange = (event) => {
    setInputValue(event.target.value); // TextField 값 변경 시 상태 업데이트
  };
  return (
    <div>
      <div>
        <Typography variant="h6">모듈 업로드</Typography>
        <Typography variant="body2">
          1 부터 12 까지의 숫자를 입력해주세요. 콤마를 사용해 중복입력
          가능합니다.
        </Typography>
        <Box>
          <TableContainer component={Paper} sx={{ mt: 2, width: "33%" }}>
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
                  <TableCell>FileName</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataFiles.map((dataFile, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{dataFile}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ mt: 3 }}>
          <TextField
            label="1~12 중복입력 가능"
            variant="outlined"
            size="small"
            value={inputValue}
            onChange={handleInputChange}
          />
          <Button
            variant="outlined"
            onClick={() => {
              handleUploadButtonClick("module");
            }}
            sx={{ ml: 1, mt: 0 }}
          >
            업로드요청
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default DbInterface;
