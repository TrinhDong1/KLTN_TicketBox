import { Box, Stack, Typography, styled } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Items = styled(Typography)({
  display: "flex",
  alignItems: "center",
  padding: "6px 0",
  paddingLeft: "16px",
  gap: 12,
  cursor: "pointer",
  "&:hover": {
    background: "rgb(255, 255, 255)",
  },
});

const Text = styled(Typography)({
  fontSize: 14,
  lineHeight: "24px",
  width: "100%",
  "&:hover": {
    fontWeight: "bold",
  },
});

const ItemsBottom = styled(Items)({
  paddingLeft: "unset",
  borderBottom: "1px solid rgb(230, 235, 245)",
});

const TextBottom = styled(Typography)({
  fontSize: 14,
  lineHeight: "24px",
  width: "100%",
});

const listSidebarTop = [
  { icon: "/img/sidebar1.png", name: "Home", path: "/" },
  { icon: "/img/sidebar2.png", name: "Live music" },
  { icon: "/img/sidebar3.png", name: "Theater - Art Culture" },
  { icon: "/img/sidebar4.png", name: "Nightlift" },
  { icon: "/img/sidebar5.png", name: "Community" },
  { icon: "/img/sidebar6.png", name: "Course" },
  { icon: "/img/sidebar7.png", name: "Attactions" },
  { icon: "/img/sidebar8.png", name: "Sport" },
  { icon: "/img/sidebar9.png", name: "Events at Ho Chi Minh City" },
  { icon: "/img/sidebar10.png", name: "Events at Ha Noi" },
];

const listSidebarBottom = [
  { icon: "/img/sidebar11.png", name: "About us" },
  { icon: "/img/sidebar12.png", name: "For Organizer" },
  { icon: "/img/sidebar13.png", name: "FAQ" },
  { icon: "/img/sidebar14.png", name: "Operational regulations" },
  { icon: "/img/sidebar15.png", name: "Information privacy policy" },
  { icon: "/img/sidebar16.png", name: "Dispute settlement policy" },
  { icon: "/img/sidebar17.png", name: "Payment privacy policy" },
  { icon: "/img/sidebar18.png", name: "Return and Inspection policy" },
  { icon: "/img/sidebar19.png", name: "Shipping and Delivery" },
  { icon: "/img/sidebar20.png", name: "Customer Terms of Use" },
  { icon: "/img/sidebar21.png", name: "Organixer Terms of Use" },
  { icon: "/img/sidebar22.png", name: "Payment Methods" },
];

function SidebarEvent() {
  const naviagte = useNavigate();
  return (
    <Stack position={"sticky"} top={100}>
      {listSidebarTop?.map((e, index) => (
        <Items key={index} onClick={() => naviagte(e.path)}>
          <Box
            component={"img"}
            src={e.icon}
            width={24}
            height={24}
            sx={{ objectFit: "cover" }}
          />
          <Text>{e.name}</Text>
        </Items>
      ))}
      <Box
        height={"1px"}
        width={"100%"}
        bgcolor={"rgb(230, 235, 245)"}
        mt={"16px"}
      />

      <Box paddingLeft={"16px"}>
        {listSidebarBottom?.map((e, index) => (
          <ItemsBottom key={index + 100}>
            <Box
              component={"img"}
              src={e.icon}
              width={24}
              height={24}
              sx={{ objectFit: "cover" }}
            />
            <TextBottom>{e.name}</TextBottom>
          </ItemsBottom>
        ))}
      </Box>

      <Box padding={"16px 16px 0"}>
        <Box src={"/img/sidebar23.png"} component={"img"} height={39} />
        <Typography
          mt={"4px"}
          fontSize={"10px"}
          color={"rgb(96,103,120)"}
          lineHeight={"16px"}
        >
          Ticketbox Co., Ltd
        </Typography>
        <Typography
          mt={"4px"}
          fontSize={"10px"}
          color={"rgb(96,103,120)"}
          lineHeight={"16px"}
        >
          Legal representative: Tran Ngoc Thai Son
        </Typography>
        <Typography
          mt={"4px"}
          fontSize={"10px"}
          color={"rgb(96,103,120)"}
          lineHeight={"16px"}
        >
          Address: 3rd floor, Tower A, Viettel Building, 285 Cach Mang Thang
          Tam, Ward 12, District 10, City. Ho Chi Minh
        </Typography>
        <Typography
          mt={"4px"}
          fontSize={"10px"}
          color={"rgb(96,103,120)"}
          lineHeight={"16px"}
        >
          Tel: 1900.6408 - Hotline: support@ticketbox.vn
        </Typography>
        <Typography
          mt={"4px"}
          fontSize={"10px"}
          color={"rgb(96,103,120)"}
          lineHeight={"16px"}
        >
          Business registration certificate number: 0313605444, first issued on
          January 7, 2016 by the Department of Planning and Investment of Ho Chi
          Minh City
        </Typography>
        <Box
          display={"flex"}
          gap={2}
          alignItems={"center"}
          mt={"16px"}
          sx={{ cursor: "pointer" }}
        >
          <Box component={"img"} src={"/img/sidebar24.png"} width={24} />
          <Box component={"img"} src={"/img/sidebar25.png"} width={24} />
          <Box component={"img"} src={"/img/sidebar26.png"} width={24} />
          <Box component={"img"} src={"/img/sidebar27.png"} width={24} />
        </Box>
      </Box>
    </Stack>
  );
}

export default SidebarEvent;
