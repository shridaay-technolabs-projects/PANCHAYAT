import Bank from "../models/Bank.js";

export const createBank = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Missing name" });

    // ✅ Sirf is user ki banks mein duplicate check
    const existing = await Bank.findOne({ 
      name: name.trim(), 
      createdBy: req.user._id,  // ✅
      isDeleted: false 
    });
    if (existing) return res.status(409).json({ message: "Bank already exists" });

    const bank = new Bank({ 
      name: name.trim(),
      createdBy: req.user._id  // ✅
    });
    await bank.save();
    res.status(201).json(bank);
  } catch (err) {
    next(err);
  }
};

export const getBanks = async (req, res, next) => {
  try {
    // ✅ Purane documents (createdBy null) + naye documents fetch karo
    const banks = await Bank.find({ 
      $or: [
        { createdBy: req.user._id },  // Naye documents
        { createdBy: null }  // Purane documents jisme createdBy nahi tha
      ],
      isDeleted: false 
    }).sort({ name: 1 });
    res.json(banks);
  } catch (err) {
    next(err);
  }
};

export const updateBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Missing name" });

    // ✅ Sirf apni bank update kar sakta hai
    const bank = await Bank.findOne({ _id: id, createdBy: req.user._id });
    if (!bank || bank.isDeleted) return res.status(404).json({ message: "Not found" });

    bank.name = name.trim();
    bank.updatedAt = Date.now();
    await bank.save();
    res.json(bank);
  } catch (err) {
    next(err);
  }
};

export const softDeleteBank = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Sirf apni bank delete kar sakta hai
    const bank = await Bank.findOne({ _id: id, createdBy: req.user._id });
    if (!bank || bank.isDeleted) return res.status(404).json({ message: "Not found" });

    bank.isDeleted = true;
    bank.updatedAt = Date.now();
    await bank.save();
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};