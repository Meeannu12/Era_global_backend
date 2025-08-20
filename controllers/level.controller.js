const levelModel = require("../models/level.model");

const createLevel = async (req, res) => {
  try {
    const { level, commission } = req.body;

    const levelCheck = await levelModel.findOne({ level });

    if (levelCheck) {
      return res
        .status(400)
        .json({ success: false, message: `${level} already exist in DB` });
    }

    const newLevel = new levelModel({ level, commission });
    await newLevel.save();

    res.status(201).json({
      success: true,
      message: "New Level Created",
    });
  } catch (error) {
    console.error("Create Level error:", error);
    return res.status(500).json({
      success: false,
      message: "Creating Level failed",
      error: error.message,
    });
  }
};

// export const updateLevel = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { commission } = req.body;

//     const updatedLevel = await levelModel.findByIdAndUpdate(
//       id,
//       { commission },
//       { new: true }
//     );

//     if (!updatedLevel) {
//       return res.status(404).json({ message: "Level not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Level updated successfully",
//       data: updatedLevel,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

module.exports = {
  createLevel,
};
