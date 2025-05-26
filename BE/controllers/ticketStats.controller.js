const eventModel = require("../models/event.model");
const paymentModel = require("../models/payment.model");

module.exports = {
  getTicketStats: async (req, res) => {
    try {
      const allEvents = await eventModel.find({});
      const allPayments = await paymentModel.find({});

      const eventStatsMap = {};

      allEvents.forEach((event) => {
        let ticketInfo = [];
        try {
          if (event.ticket && typeof event.ticket === "string") {
            ticketInfo = JSON.parse(event.ticket);
          }
        } catch (error) {
          ticketInfo = [];
        }

        const totalAvailableTickets = ticketInfo.reduce((sum, ticket) => {
          const maxTicket = parseInt(ticket.maxTicket || "0");
          return sum + (isNaN(maxTicket) ? 0 : maxTicket);
        }, 0);

        eventStatsMap[event._id.toString()] = {
          _id: event._id,
          eventName: event.name || "Không có tên",
          eventImage: event.image || "",
          typeEvent: event.typeEvent || null,
          timeStart: event.timeStart || "",
          timeEnd: event.timeEnd || "",
          isApprove: event.isApprove || 0,
          totalAvailableTickets,
          ticketInfo,
          totalTickets: 0,
          totalAmount: 0,
          transactions: 0,
        };
      });
      console.log("eventStatsMap",eventStatsMap);

      allPayments.forEach((payment) => {
        const eventId = payment.event ? payment.event.toString() : null;

        if (eventId && eventStatsMap[eventId]) {
          const ticketCount = parseInt(payment.number || "0");
          const amount = parseInt(payment.amount || "0");

          eventStatsMap[eventId].totalTickets += isNaN(ticketCount)
            ? 0
            : ticketCount;
          eventStatsMap[eventId].totalAmount += isNaN(amount) ? 0 : amount;
          eventStatsMap[eventId].transactions += 1;
        }
      });

      const eventStatsList = Object.values(eventStatsMap);

      eventStatsList.forEach((stat) => {
        if (stat.totalAvailableTickets > 0) {
          stat.soldPercentage =
            (stat.totalTickets / stat.totalAvailableTickets) * 100;
        } else {
          stat.soldPercentage = 0;
        }

        delete stat.ticketInfo;
      });

      const sortedByTicketsSold = [...eventStatsList].sort(
        (a, b) => b.totalTickets - a.totalTickets
      );

      const topSelling = sortedByTicketsSold.slice(0, 5);

      const lowestSelling = [...eventStatsList]
        .sort((a, b) => a.totalTickets - b.totalTickets)
        .slice(0, 5);

      return res.status(200).json({
        success: true,
        totalEvents: eventStatsList.length,
        topSelling,
        lowestSelling,
        allStats: sortedByTicketsSold,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi thống kê vé",
        error: error.message,
      });
    }
  },

  getEventTicketDetail: async (req, res) => {
    try {
      const eventId = req.params.id;

      const event = await eventModel.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      let ticketInfo = [];
      try {
        if (event.ticket && typeof event.ticket === "string") {
          ticketInfo = JSON.parse(event.ticket);
        }
      } catch (error) {
        ticketInfo = [];
      }

      const ticketTypes = ticketInfo.map((ticket) => ({
        name: ticket.nameTicket || "Không tên",
        price: parseInt(ticket.priceTicket || "0"),
        total: parseInt(ticket.totalTicket || "0"),
        max: parseInt(ticket.maxTicket || "0"),
        timeStart: ticket.timeTicketStart || "",
        timeEnd: ticket.timeTicketEnd || "",
        description: ticket.descriptionTicket || "",
      }));

      const payments = await paymentModel.find({ event: eventId });

      let totalTickets = 0;
      let totalAmount = 0;
      const soldTicketsByType = {};

      payments.forEach((payment) => {
        const ticketName = payment.name || "Không xác định";
        const ticketCount = parseInt(payment.number || "0");
        const amount = parseInt(payment.amount || "0");

        totalTickets += isNaN(ticketCount) ? 0 : ticketCount;
        totalAmount += isNaN(amount) ? 0 : amount;

        if (!soldTicketsByType[ticketName]) {
          soldTicketsByType[ticketName] = {
            count: 0,
            revenue: 0,
          };
        }

        soldTicketsByType[ticketName].count += isNaN(ticketCount)
          ? 0
          : ticketCount;
        soldTicketsByType[ticketName].revenue += isNaN(amount) ? 0 : amount;
      });

      const transactionHistory = payments.map((payment) => ({
        id: payment._id,
        user: payment.user,
        ticketName: payment.name,
        price: payment.price,
        quantity: payment.number,
        amount: payment.amount,
        date: payment.createdAt,
      }));

      const ticketDetails = ticketTypes.map((ticket) => {
        const sold = soldTicketsByType[ticket.name] || { count: 0, revenue: 0 };
        return {
          ...ticket,
          sold: sold.count,
          revenue: sold.revenue,
          remainingTickets: ticket.total - sold.count,
          soldPercentage:
            ticket.total > 0 ? (sold.count / ticket.total) * 100 : 0,
        };
      });

      return res.status(200).json({
        success: true,
        eventId: event._id,
        eventName: event.name,
        eventImage: event.image,
        timeStart: event.timeStart,
        timeEnd: event.timeEnd,
        totalAvailableTickets: ticketTypes.reduce((sum, t) => sum + t.total, 0),
        totalSoldTickets: totalTickets,
        totalRevenue: totalAmount,
        soldPercentage:
          ticketTypes.reduce((sum, t) => sum + t.total, 0) > 0
            ? (totalTickets /
                ticketTypes.reduce((sum, t) => sum + t.total, 0)) *
              100
            : 0,
        ticketDetails,
        transactionCount: payments.length,
        transactionHistory,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi lấy chi tiết thống kê vé",
        error: error.message,
      });
    }
  },
};
