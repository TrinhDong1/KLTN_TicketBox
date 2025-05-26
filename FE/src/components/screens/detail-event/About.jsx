import { Box, Divider, Paper, Typography } from "@mui/material";
import React from "react";

function About({ event }) {
  return (
    <Box mt={8} id="about">
      <Paper>
        <Box p={2}>
          <Typography variant="h6">ABOUT</Typography>
        </Box>
        <Divider />
        <Box p={2}>
          <Typography variant="body1" fontWeight={600}>
            Thông tin sự kiện:
          </Typography>
          {event?.infoEvent?.split(".")?.map((e, index) => (
            <Typography mt={2} key={index}>
              🌹 {e}
            </Typography>
          ))}
          <Typography variant="body1" fontWeight={600} mt={2}>
            Thông tin nhà tổ chức:
          </Typography>
          {event?.infoOrganize?.split(".")?.map((e, index) => (
            <Typography mt={2} key={index}>
              🌹 {e}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

export default About;
