const mongoose = require("mongoose");
const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const body = req.body || {};
    const { movieName, releaseYear } = body;

    // Movie name must be present.
    if (
      movieName === undefined ||
      movieName === null ||
      (typeof movieName === "string" && movieName.trim() === "")
    ) {
      return res.status(406).json({ error: "No movie name found" });
    }

    // Movie name must be more than three characters long.
    if (typeof movieName !== "string" || movieName.trim().length <= 3) {
      return res.status(406).json({ error: "Invalid movie name" });
    }

    // Release year must be a whole number between 1990 and the current year.
    const currentYear = new Date().getFullYear();
    const year = Number(releaseYear);
    if (!Number.isInteger(year) || year < 1990 || year > currentYear) {
      return res.status(406).json({ error: "Invalid release year" });
    }

    const newMovie = new MovieModel({
      _id: new mongoose.Types.ObjectId(),
      name: movieName.trim(),
      releaseYear: year,
      characters: []
    });

    const savedMovie = await newMovie.save();

    return res.status(200).json({
      _id: savedMovie._id,
      name: savedMovie.name,
      releaseYear: savedMovie.releaseYear,
      characters: savedMovie.characters
    });
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
