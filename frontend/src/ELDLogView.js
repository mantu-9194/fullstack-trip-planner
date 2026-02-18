import React from "react";
import { Box, Typography } from "@mui/material";

const getColor = (status) => {
  if (status === "Driving") return "#4caf50";
  if (status.includes("Break") || status.includes("Fuel")) return "#ff9800";
  if (status.includes("10 Hour")) return "#2196f3";
  return "#9e9e9e";
};

function ELDLogView({ logs }) {
  if (!logs.length) return null;

  const startOfDay = new Date(logs[0].start);
  startOfDay.setHours(0, 0, 0, 0);

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h6">Daily ELD Log View</Typography>

      <Box sx={{ display: "flex", height: 40, border: "1px solid #ccc" }}>
        {logs.map((log, index) => {
          const start = new Date(log.start);
          const end = new Date(log.end);

          const totalDayHours = 24;
          const durationHours = (end - start) / (1000 * 60 * 60);
          const widthPercent = (durationHours / totalDayHours) * 100;

          return (
            <Box
              key={index}
              sx={{
                width: `${widthPercent}%`,
                backgroundColor: getColor(log.status),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff"
              }}
            >
              {log.status}
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption">
        0h ————————————— 24h
      </Typography>
    </Box>
  );
}

export default ELDLogView;
