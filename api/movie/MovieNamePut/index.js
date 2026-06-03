const mongoose = require("mongoose");
const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const body = req.body || {};
    const { movieId, movieName } = body;

    // Movie name must be present and at least three characters long.
    if (typeof movieName !== "string" || movieName.trim().length < 3) {
      return res.status(406).json({
        error: "Movie Name is not valid. It must be at least three characters."
      });
    }

    // An invalid ObjectId can't match any movie, so treat it as not found
    // rather than letting findById throw a CastError (which would 500).
    if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(404).json({ error: "No movie found" });
    }

    const movie = await MovieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    movie.name = movieName.trim();
    await movie.save();

    // Successful update returns 204 with no body.
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
