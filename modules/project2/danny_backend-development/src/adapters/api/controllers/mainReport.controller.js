const { asyncHandler } = require("tranxpress");
const Villager = require("../../db/VillagerModel");
const SuccessResponse = require("../../../domain/Responses/SuccessResponse");
const CustomError = require("../../../domain/CustomError");
const mongoose = require("mongoose");
const Master = require("../../db/MasterModel");

exports.getMainReport = asyncHandler(async (req, res, next) => {
  const { village, financialYear, noticeFees = 0, total = 0 } = req.query;

  if (!village) throw new CustomError("Please Select Village.", 400);
  if (!financialYear) throw new CustomError("Please Select Financial Year.", 400);

  const parsednoticeFees = parseFloat(noticeFees);
  const parsedTotal = parseFloat(total);

  if (!mongoose.Types.ObjectId.isValid(village)) throw new CustomError("Invalid village id", 400);
  if (!mongoose.Types.ObjectId.isValid(financialYear)) throw new CustomError("Invalid financial year id", 400);

  const villageId = new mongoose.Types.ObjectId(village);
  const financialYearId = new mongoose.Types.ObjectId(financialYear);

  const master = await Master.findOne({ status: 1 });

  let master_lSarkari = 0, master_lSivay = 0, master_sSarkari = 0, master_sSivay = 0;
  if (master) {
    master_lSarkari = parseFloat(master.lSarkari) || 0;
    master_lSivay   = parseFloat(master.lSivay)   || 0;
    master_sSarkari = parseFloat(master.sSarkari)  || 0;
    master_sSivay   = parseFloat(master.sSivay)    || 0;
  }

  const pipeline = [
    { $match: { village: villageId } },
    {
      $addFields: {
        sarkari: { $toDouble: "$sarkari" },
        sivay:   { $toDouble: "$sivay"   },
      },
    },

    // ── LandMaangnu (first pass) ──────────────────────────────────────────────
    {
      $lookup: {
        from: "LandMaangnu",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              fajal: { $divide: [{ $toDouble: "$fajal" }, 100] },
              left:  { $toDouble: "$left" },
            },
          },
        ],
        as: "landMaangnu",
      },
    },
    { $addFields: { landMaangnu: { $arrayElemAt: ["$landMaangnu", 0] } } },

    // ✅ KEY FIX: Save actual પાછલી બાકી NOW before second lookup overwrites landMaangnu
    {
      $addFields: {
        savedLandMaangnuLeft:      { $ifNull: ["$landMaangnu.left", 0] },
      },
    },

    // ── LandRevenue (first pass) ──────────────────────────────────────────────
    {
      $lookup: {
        from: "LandRevenue",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          {
            $project: {
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
              total:    { $divide: [{ $toDouble: "$total"    }, 100] },
            },
          },
        ],
        as: "landRevenue",
      },
    },
    {
      $addFields: {
        rotating:     { $sum: "$landRevenue.rotating" },
        revenueTotal: { $sum: "$landRevenue.total"    },
      },
    },
    {
      $addFields: {
        sivay:   { $ifNull: ["$sivay",             0] },
        sarkari: { $ifNull: ["$sarkari",           0] },
        left:    { $ifNull: ["$landMaangnu.left",  0] },
        fajal:   { $ifNull: ["$landMaangnu.fajal", 0] },
        total:   { $add: [{ $ifNull: ["$landMaangnu.fajal", 0] }, "$revenueTotal"] },
      },
    },
    {
      $addFields: {
        totalCalculated: {
          $add: [
            { $ifNull: ["$left",     0] },
            { $ifNull: ["$sivay",    0] },
            { $ifNull: ["$sarkari",  0] },
            { $ifNull: ["$rotating", 0] },
          ],
        },
        difference: {
          $subtract: [
            {
              $subtract: [
                {
                  $add: [
                    { $ifNull: ["$left",     0] },
                    { $ifNull: ["$sivay",    0] },
                    { $ifNull: ["$sarkari",  0] },
                    { $ifNull: ["$rotating", 0] },
                  ],
                },
                "$total",
              ],
            },
            "$sarkari",
          ],
        },
      },
    },
    {
      $addFields: {
        collumnTwentyOne: {
          $cond: [{ $gt: ["$difference", 0] }, { $round: ["$difference", 2] }, 0],
        },
      },
    },
    {
      $addFields: {
        landTotal: {
          $add: [
            { $ifNull: ["$collumnTwentyOne", 0] },
            { $ifNull: ["$rotating",         0] },
            { $ifNull: ["$sivay",            0] },
          ],
        },
      },
    },

    // ── LandMaangnu (second pass: full fields) ────────────────────────────────
    {
      $lookup: {
        from: "LandMaangnu",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              fajal:   { $divide: [{ $toDouble: "$fajal"   }, 100] },
              left:    { $toDouble: "$left" },
              sarkari: { $divide: [{ $toDouble: "$sarkari" }, 100] },
              sivay:   { $divide: [{ $toDouble: "$sivay"   }, 100] },
            },
          },
        ],
        as: "landMaangnu",
      },
    },
    { $addFields: { landMaangnu: { $arrayElemAt: ["$landMaangnu", 0] } } },

    // ── LandRevenue (second pass) ─────────────────────────────────────────────
    {
      $lookup: {
        from: "LandRevenue",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          {
            $project: {
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
              total:    { $divide: [{ $toDouble: "$total"    }, 100] },
            },
          },
        ],
        as: "landRevenue",
      },
    },
    {
      $addFields: {
        rotating:     { $sum: "$landRevenue.rotating" },
        revenueTotal: { $sum: "$landRevenue.total"    },
      },
    },
    {
      $addFields: {
        fajal: { $ifNull: ["$landMaangnu.fajal", 0] },
        left:  { $ifNull: ["$landMaangnu.left",  0] },
        total: {
          $add: [
            { $ifNull: ["$landMaangnu.fajal", 0] },
            { $sum: "$landRevenue.total" },
          ],
        },
      },
    },
    {
      $addFields: {
        totalCalculated: {
          $add: [
            { $ifNull: ["$left",     0] },
            { $ifNull: ["$sivay",    0] },
            { $ifNull: ["$sarkari",  0] },
            { $ifNull: ["$rotating", 0] },
          ],
        },
      },
    },
    {
      $addFields: {
        difference: {
          $subtract: [
            { $subtract: ["$totalCalculated", "$total"] },
            "$sarkari",
          ],
        },
      },
    },
    {
      $addFields: {
        collumnTwentyOne: {
          $cond: [{ $gt: ["$difference", 0] }, { $round: ["$difference", 2] }, 0],
        },
        collumnTwentyTwo: {
          $cond: [{ $lt: ["$difference", 0] }, { $round: ["$difference", 2] }, 0],
        },
        landTotal: {
          $add: [
            { $ifNull: ["$collumnTwentyOne", 0] },
            { $ifNull: ["$rotating",         0] },
            { $ifNull: ["$sivay",            0] },
          ],
        },
      },
    },

    // ── LocalFundMaangnu ──────────────────────────────────────────────────────
    {
      $lookup: {
        from: "LocalFundMaangnu",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              fajal:    { $divide: [{ $toDouble: "$fajal"    }, 100] },
              left:     { $toDouble: "$left" },
              pending:  { $divide: [{ $toDouble: "$pending"  }, 100] },
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
            },
          },
        ],
        as: "localMaangnu",
      },
    },
    { $addFields: { localMaangnu: { $arrayElemAt: ["$localMaangnu", 0] } } },

    // ✅ Save local પાછ્લી બાકી before any overwrite
    {
      $addFields: {
        savedLocalMaangnuLeft: { $ifNull: ["$localMaangnu.left", 0] },
      },
    },

    // ── LocalFundRevenue ──────────────────────────────────────────────────────
    {
      $lookup: {
        from: "LocalFundRevenue",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          {
            $project: {
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
              pending:  { $divide: [{ $toDouble: "$pending"  }, 100] },
              left:     { $divide: [{ $toDouble: "$left"     }, 100] },
            },
          },
        ],
        as: "localRevenue",
      },
    },
    {
      $addFields: {
        localRotating: { $sum: "$localRevenue.rotating" },
        localPending:  { $sum: "$localRevenue.pending"  },
        localLeft:     { $sum: "$localRevenue.left"     },
      },
    },
    {
      $addFields: {
        localFajal:           { $ifNull: ["$localMaangnu.fajal",    0] },
        localMaangnuLeft:     { $ifNull: ["$localMaangnu.left",     0] },
        localMaangnuPending:  { $ifNull: ["$localMaangnu.pending",  0] },
        localMaangnuRotating: { $ifNull: ["$localMaangnu.rotating", 0] },
      },
    },
    {
      $addFields: {
        totalCalculatedLocal: {
          $add: ["$localLeft", "$localPending", "$localFajal"],
        },
        totalCalcLocal: {
          $add: [
            "$localMaangnuLeft",
            { $divide: [{ $multiply: ["$sarkari", master_lSarkari] }, 100] },
            { $divide: [{ $multiply: ["$sivay",   master_lSivay  ] }, 100] },
            "$localRotating",
          ],
        },
      },
    },
    {
      $addFields: {
        collumnFourteenlocal: {
          $cond: [
            { $lt: ["$totalCalculatedLocal", "$totalCalcLocal"] },
            {
              $round: [
                { $subtract: ["$totalCalcLocal", "$totalCalculatedLocal"] },
                2,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        localFourFivePanding: {
          $add: [
            { $divide: [{ $multiply: ["$sarkari", master_lSarkari] }, 100] },
            { $divide: [{ $multiply: ["$sivay",   master_lSivay  ] }, 100] },
          ],
        },
      },
    },
    {
      $addFields: {
        localTotal: {
          $add: [
            "$collumnFourteenlocal",
            "$localFourFivePanding",
            "$localRotating",
          ],
        },
      },
    },

    // ── EducationMaangnu ──────────────────────────────────────────────────────
    {
      $lookup: {
        from: "EducationMaangnu",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              fajal:    { $divide: [{ $toDouble: "$fajal"    }, 100] },
              left:     { $toDouble: "$left" },
              pending:  { $divide: [{ $toDouble: "$pending"  }, 100] },
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
            },
          },
        ],
        as: "educationMaangnu",
      },
    },
    { $addFields: { educationMaangnu: { $arrayElemAt: ["$educationMaangnu", 0] } } },

    // ✅ Save education પાછ્લી બાકી before any overwrite
    {
      $addFields: {
        savedEducationMaangnuLeft: { $ifNull: ["$educationMaangnu.left", 0] },
      },
    },

    // ── EducationRevenue ──────────────────────────────────────────────────────
    {
      $lookup: {
        from: "EducationRevenue",
        let: { villagerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$villager", "$$villagerId"] },
                  { $eq: ["$financialYear", financialYearId] },
                ],
              },
            },
          },
          {
            $project: {
              rotating: { $divide: [{ $toDouble: "$rotating" }, 100] },
              pending:  { $divide: [{ $toDouble: "$pending"  }, 100] },
              left:     { $divide: [{ $toDouble: "$left"     }, 100] },
            },
          },
        ],
        as: "educationRevenue",
      },
    },
    {
      $addFields: {
        educationRotating: { $sum: "$educationRevenue.rotating" },
        educationPending:  { $sum: "$educationRevenue.pending"  },
        educationLeft:     { $sum: "$educationRevenue.left"     },
      },
    },
    {
      $addFields: {
        educationFajal:           { $ifNull: ["$educationMaangnu.fajal",    0] },
        educationMaangnuLeft:     { $ifNull: ["$educationMaangnu.left",     0] },
        educationMaangnuPending:  { $ifNull: ["$educationMaangnu.pending",  0] },
        educationMaangnuRotating: { $ifNull: ["$educationMaangnu.rotating", 0] },
      },
    },
    {
      $addFields: {
        totalCalculatedEducation: {
          $add: ["$educationLeft", "$educationPending", "$educationFajal"],
        },
        totalCalcEducation: {
          $add: [
            "$educationMaangnuLeft",
            { $divide: [{ $multiply: ["$sarkari", master_sSarkari] }, 100] },
            { $divide: [{ $multiply: ["$sivay",   master_sSivay  ] }, 100] },
            "$educationRotating",
          ],
        },
      },
    },
    {
      $addFields: {
        collumnFourteenEducation: {
          $cond: [
            { $lt: ["$totalCalculatedEducation", "$totalCalcEducation"] },
            {
              $round: [
                { $subtract: ["$totalCalcEducation", "$totalCalculatedEducation"] },
                2,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $addFields: {
        educationFourFivePanding: {
          $add: [
            { $divide: [{ $multiply: ["$sarkari", master_sSarkari] }, 100] },
            { $divide: [{ $multiply: ["$sivay",   master_sSivay  ] }, 100] },
          ],
        },
      },
    },
    {
      $addFields: {
        educationTotal: {
          $add: [
            "$collumnFourteenEducation",
            "$educationFourFivePanding",
            "$educationRotating",
          ],
        },
      },
    },

    // ── allTotals filter ──────────────────────────────────────────────────────
    {
      $addFields: {
        allTotals: {
          $ceil: {
            $add: [
              { $ifNull: ["$landTotal",      0] },
              { $ifNull: ["$localTotal",     0] },
              { $ifNull: ["$educationTotal", 0] },
            ],
          },
        },
      },
    },
    { $match: { allTotals: { $gt: parsedTotal } } },

    // ✅ NUMERIC SORT: accountNo string → number, then sort ascending
    // Use safe conversion so malformed accountNo values do not crash the aggregate.
    {
      $addFields: {
        accountNoInt: {
          $convert: {
            input: "$accountNo",
            to: "int",
            onError: 0,
            onNull: 0,
          },
        },
      },
    },
    { $sort: { accountNoInt: 1 } },

    // ── Final projection ──────────────────────────────────────────────────────
    {
      $project: {
        name:          1,
        accountNo:     1,
        village:       1,
        financialYear: 1,
        sarkari:       1,
        sivay:         1,
        left: "$left",

        landData: {
          collumnTwentyOne: "$collumnTwentyOne",
          rotating:         "$rotating",
          sivay:            "$sivay",
          landTotal:        "$landTotal",
          maangnuLeft: "$savedLandMaangnuLeft",
        },

        localFundData: {
          localFourFivePanding: "$localFourFivePanding",
          localRotating:        "$localRotating",
          collumnFourteenlocal: "$collumnFourteenlocal",
          localTotal:           "$localTotal",
          maangnuLeft: "$savedLocalMaangnuLeft",
        },

        educationData: {
          collumnFourteenEducation: "$collumnFourteenEducation",
          educationFourFivePanding: "$educationFourFivePanding",
          educationRotating:        "$educationRotating",
          educationTotal:           "$educationTotal",
          maangnuLeft: "$savedEducationMaangnuLeft",
        },

        allTotals: 1,
      },
    },
  ];

  const villagers = await Villager.aggregate(pipeline);

  // ✅ DEBUG: Check account 101
  const debug101 = villagers.find(v => v.accountNo === "101");
  if (debug101) {
    console.log("✅ 101 found in pipeline - allTotals:", debug101.allTotals);
    console.log("landData:", debug101.landData);
    console.log("localFundData:", debug101.localFundData);
    console.log("educationData:", debug101.educationData);
  } else {
    console.log("❌ 101 NOT in pipeline result");
    
    // Check if villager exists in DB
    const raw101 = await Villager.findOne({ 
      village: villageId, 
      accountNo: "101" 
    });
    console.log("Raw 101 villager exists:", !!raw101, "accountNo:", raw101?.accountNo);
  }

  res.status(200).json(
    new SuccessResponse(
      { data: villagers, totalDocs: villagers.length },
      "Fetched main report with totals"
    )
  );
});