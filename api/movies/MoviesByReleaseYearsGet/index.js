const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  const startReleaseYear = Number(req.params.startReleaseYear);
  const endReleaseYear = Number(req.params.endReleaseYear);

  if (Number.isNaN(startReleaseYear)) {
    return res.status(406).json({ error: "Starting release year must be a number" });
  }

  if (startReleaseYear < 2000 || startReleaseYear > 2020) {
    return res.status(406).json({ error: "Starting release year must be between 2000 and 2020" });
  }

  if (Number.isNaN(endReleaseYear)) {
    return res.status(406).json({ error: "Ending release year must be a number" });
  }

  if (endReleaseYear < 2000 || endReleaseYear > 2020) {
    return res.status(406).json({ error: "Ending release year must be between 1977 and 2020" });
  }

  try {
    let movies = await MovieModel.find({
      releaseYear: { $gte: startReleaseYear, $lte: endReleaseYear }
    });

    const sortedMovies = (movies || []).sort((a, b) => a.releaseYear - b.releaseYear);

    if (sortedMovies.length === 0) {
      return res.status(404).json({ error: "No movies found" });
    }

    return res.status(200).json(sortedMovies);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
