const eventModel = require("../models/event.model");
const userModel = require("../models/user.model");
const cleanExpiredPayments = require("../helpers/cleanExpiredPayments");

module.exports = {
  listEvent: async (req, res) => {
    try {
      // Clean up expired payments before returning events
      // This ensures that tickets blocked by abandoned payments are released
      await cleanExpiredPayments();

      const { name, ...rest } = req.query;
      let query = { ...rest };
      if (name) {
        query = { ...query, name: { $regex: name, $options: "i" } };
      }

      const data = await eventModel.find(query).sort({ percent: -1 });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  getEventById: async (req, res) => {
    try {
      const data = await eventModel.findOne({ _id: req.params.id });

      // Check if user is authenticated before updating lastViewedTypeEvent
      if (req.user && req.user.id && data.typeEvent) {
        await userModel.findByIdAndUpdate(req.user.id, {
          lastViewedTypeEvent: data.typeEvent,
        });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error("Error fetching event by ID:", error);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  },

  getEventByUserId: async (req, res) => {
    try {
      const data = await eventModel.find({ owner: req.params.id });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  listApproveEvent: async (req, res) => {
    try {
      const data = await eventModel.find({ isApprove: 0 });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  create: async (req, res) => {
    try {
      const data = await eventModel.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  myEvent: async (req, res) => {
    try {
      const data = await eventModel.find({ owner: req.params.id });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },

  approveEvent: async (req, res) => {
    try {
      const data = await eventModel.findByIdAndUpdate(req.params.id, {
        isApprove: 1,
      });
      res.status(201).json(data);
    } catch (error) {
      throw error;
    }
  },
  deleteEvent: async (req, res) => {
    try {
      await eventModel.findOneAndDelete({ _id: req.params.id });
      res.status(201).json("Xóa event thành công");
    } catch (error) {
      throw error;
    }
  },

  updateEvent: async (req, res) => {
    try {
      // Đặt lại isApprove về 0 khi một sự kiện được cập nhật
      const payload = {
        ...req.body,
        isApprove: 0, // Yêu cầu phê duyệt lại sau khi cập nhật
      };

      const data = await eventModel.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true } // Trả về document đã được cập nhật
      );

      if (!data) {
        return res.status(404).json({ message: "Không tìm thấy sự kiện" });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Lỗi cập nhật sự kiện:", error);
      res.status(500).json({
        message: "Lỗi server khi cập nhật sự kiện",
        error: error.message,
      });
    }
  },
};
