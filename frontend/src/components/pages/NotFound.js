import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      navigate(-1);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prevCount) => prevCount - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.h1}>404</h1>
        <p style={styles.p}>
          잘못된 경로입니다. {countdown}초 후 이전 페이지로 이동합니다.
        </p>
      </div>
    </div>
  );
};

const styles = {
  body: {
    fontFamily: "Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    margin: 0,
    backgroundColor: "#f4f4f4",
  },
  container: {
    textAlign: "center",
  },
  h1: {
    fontSize: "48px",
    color: "#ff4d4d",
  },
  p: {
    fontSize: "24px",
    color: "#333",
  },
};

export default NotFound;
