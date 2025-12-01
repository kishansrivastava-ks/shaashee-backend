const getStatus = (req, res) => {
  return res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
};

module.exports = { getStatus };
