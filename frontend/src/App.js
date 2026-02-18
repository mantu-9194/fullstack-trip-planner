import React, { useState } from "react";
import MapView from "./MapView";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import ELDLogView from "./ELDLogView";
import DailyLogSheet from "./Components/DailyLogSheet";



function App() {
  const [currentLocation, setCurrentLocation] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [cycleUsed, setCycleUsed] = useState("");
  const [logs, setLogs] = useState([]);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geometry1, setGeometry1] = useState(null);
  const [geometry2, setGeometry2] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/plan/",
        {
          current_location: currentLocation,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          cycle_used: Number(cycleUsed),
        }
      );

      setLogs(response.data.logs);
      setDistance(response.data.total_distance);
      setGeometry1(response.data.geometry1);
      setGeometry2(response.data.geometry2);

    } catch (error) {
      const message =
        error.response?.data?.error || "Something went wrong.";
      alert(message);
    }


    setLoading(false);
  };
  const calculateSummary = () => {
    let driving = 0;
    let breakTime = 0;
    let offDuty = 0;

    logs.forEach(log => {
      const start = new Date(log.start);
      const end = new Date(log.end);
      const hours = (end - start) / (1000 * 60 * 60);

      if (log.status === "Driving") driving += hours;
      else if (log.status.includes("Break") || log.status.includes("Fuel"))
        breakTime += hours;
      else offDuty += hours;
    });

    return {
      driving: driving.toFixed(2),
      breakTime: breakTime.toFixed(2),
      offDuty: offDuty.toFixed(2),
    };
  };

  const groupLogsByDay = () => {
    const grouped = {};
    logs.forEach((log) => {
      const day = new Date(log.start).toDateString();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupLogsByDay();


  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Trip Planner
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Current Location"
            margin="normal"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Pickup Location"
            margin="normal"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Dropoff Location"
            margin="normal"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Cycle Used (Hours)"
            type="number"
            margin="normal"
            value={cycleUsed}
            onChange={(e) => setCycleUsed(e.target.value)}
            required
          />

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Calculate Trip"}
            </Button>
          </Box>
        </Box>

        {/* Distance */}
        {distance && (
          <Typography variant="h6" sx={{ mt: 4 }}>
            Total Distance: {distance} miles
          </Typography>
        )}

        {/* MAP SECTION */}
        {geometry1 && (
          <MapView geometry1={geometry1} geometry2={geometry2} />
        )}
        {logs.length > 0 && (
          <Box sx={{ mt: 4 }}>
            {(() => {
              const summary = calculateSummary();
              return (
                <>
                  <Typography>Total Driving Hours: {summary.driving}</Typography>
                  <Typography>Total Break/Fuel Hours: {summary.breakTime}</Typography>
                  <Typography>Total Off Duty Hours: {summary.offDuty}</Typography>
                </>
              );
            })()}
          </Box>
        )}

        {/* LOG TABLE */}
        {logs.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Miles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>
                      {new Date(log.start).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(log.end).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.miles || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {Object.keys(groupedLogs).map((day) => (
              <DailyLogSheet key={day} logs={groupedLogs[day]} date={day} />
            ))}
          </TableContainer>
        )}
        <ELDLogView logs={logs} />
      </Paper>
    </Container>
  );

}

export default App;
