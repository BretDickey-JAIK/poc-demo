const mongoose = require("mongoose");
const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const id = req.params && req.params.id;

    // Verify that an _id was received.
    if (!id) {
      return res.status(400).json({ error: "An _id is required" });
    }

    // An invalid ObjectId can't match any movie, so treat it as not found
    // rather than letting findById throw a CastError (which would 500).
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "No movie found" });
    }

    const movie = await MovieModel.findById(id);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    return res.status(200).json(movie);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
