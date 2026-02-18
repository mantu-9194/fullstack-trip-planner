import React from "react";
import dayjs from "dayjs";
import { Box, Typography, Paper } from "@mui/material";

const ROWS = [
  "Off Duty",
  "Sleeper Berth",
  "Driving",
  "On Duty"
];

const getRowIndex = (status) => {
  if (status === "Driving") return 2;
  if (status === "30 Min Break") return 3;
  if (status === "Fuel Stop") return 3;
  if (status === "10 Hour Break") return 0;
  return 0;
};

function DailyLogSheet({ logs, date }) {
  const startOfDay = dayjs(date).startOf("day");

  return (
    <Paper elevation={4} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Daily Log - {startOfDay.format("MMM DD, YYYY")}
      </Typography>

      <Box sx={{ position: "relative", border: "1px solid #ccc", height: 240 }}>

        {/* Hour vertical grid lines */}
        {[...Array(25)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              left: `${(i / 24) * 100}%`,
              top: 0,
              bottom: 0,
              width: "1px",
              backgroundColor: "#eee"
            }}
          />
        ))}

        {/* Horizontal rows */}
        {ROWS.map((row, index) => (
          <Box
            key={row}
            sx={{
              position: "absolute",
              top: `${(index / 4) * 100}%`,
              left: 0,
              right: 0,
              height: `${100 / 4}%`,
              borderBottom: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              pl: 1,
              fontSize: 12,
              color: "#555"
            }}
          >
            {row}
          </Box>
        ))}

        {/* Draw log segments */}
        {logs.map((log, index) => {
          const start = dayjs(log.start);
          const end = dayjs(log.end);

          const startHour = start.diff(startOfDay, "minute") / 60;
          const endHour = end.diff(startOfDay, "minute") / 60;

          const left = (startHour / 24) * 100;
          const width = ((endHour - startHour) / 24) * 100;

          const rowIndex = getRowIndex(log.status);

          return (
            <Box
              key={index}
              sx={{
                position: "absolute",
                left: `${left}%`,
                width: `${width}%`,
                top: `${(rowIndex / 4) * 100}%`,
                height: `${100 / 4}%`,
                backgroundColor:
                  log.status === "Driving"
                    ? "#1976d2"
                    : log.status.includes("Break")
                    ? "#ff9800"
                    : "#4caf50",
                opacity: 0.7
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

export default DailyLogSheet;
