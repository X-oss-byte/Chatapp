module.exports = async (req, res) => {
  if (!req.variables.vapidPublicKey) {
    res.json({
      success: false,
      vapidPublicKey: null
    });

    return;
  }

  res.json({
    success: true,
    vapidPublicKey: req.variables.vapidPublicKey
  });
};