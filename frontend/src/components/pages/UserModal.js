import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const UserModal = ({ open, onClose, user, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    email: '',
    name: '',
    phone: '',
    authority: 1,
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // user가 변경될 때마다 formData를 업데이트
  useEffect(() => {
    if (user) {
      setFormData({
        user_id: user.user_id || '',
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || '',
        authority: user.authority || 1,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    console.log("Validating form data:", formData); // 디버그용 로그

    // Email: 올바른 이메일 형식인지 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('유효한 이메일 주소를 입력하세요.');
      return false;
    }

    // Name: 최소 2자 이상, 알파벳과 한글 허용
    const nameRegex = /^[a-zA-Z가-힣]{2,}$/;
    if (!nameRegex.test(formData.name)) {
      setErrorMessage('이름은 2자 이상, 영문 또는 한글만 가능합니다.');
      return false;
    }

    // Phone: 전화번호 형식 검증, 숫자와 하이픈만 허용
    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      setErrorMessage('전화번호 형식이 올바르지 않습니다. (예: 010-xxxx-xxxx)');
      return false;
    }

    // Authority: 숫자만 허용
    if (isNaN(formData.authority) || !Number.isInteger(parseFloat(formData.authority))) {
      setErrorMessage('권한은 숫자만 입력 가능합니다.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      console.log("Validation failed, form will not be submitted.");
      return;
    }
    console.log("Validation passed, form will be submitted.");
    onSave({
      ...formData,
      authority: parseInt(formData.authority, 10), // 숫자로 변환하여 저장
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(formData.user_id);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" mb={2}>
            사용자 정보 수정
          </Typography>
          <TextField
            label="ID"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="이메일"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            error={errorMessage.includes("이메일")}
            helperText={errorMessage.includes("이메일") && errorMessage}
          />
          <TextField
            label="이름"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            error={errorMessage.includes("이름")}
            helperText={errorMessage.includes("이름") && errorMessage}
          />
          <TextField
            label="전화번호"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            error={errorMessage.includes("전화번호")}
            helperText={errorMessage.includes("전화번호") && errorMessage}
          />
          <TextField
            label="권한"
            name="authority"
            value={formData.authority}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="number"
            error={errorMessage.includes("권한")}
            helperText={errorMessage.includes("권한") && errorMessage}
          />
          {errorMessage && !(
            errorMessage.includes("이메일") ||
            errorMessage.includes("이름") ||
            errorMessage.includes("전화번호") ||
            errorMessage.includes("권한")
          ) && (
            <Typography color="error" align="center" mt={2}>
              {errorMessage}
            </Typography>
          )}
          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="contained" color="primary" onClick={handleSave}>
              저장
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleDeleteClick}>
              삭제
            </Button>
          </Box>
        </Box>
      </Modal>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserModal;
