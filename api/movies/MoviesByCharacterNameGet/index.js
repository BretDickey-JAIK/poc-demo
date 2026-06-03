const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const characterName = req.params && req.params.characterName;

    // Error checking: verify a character name was received.
    if (!characterName || characterName.trim() === "") {
      return res.status(400).json({ error: "A character name is required" });
    }

    // Case-insensitive exact match on a character's name.
    const nameMatch = new RegExp(`^${escapeRegExp(characterName.trim())}$`, "i");
    const movies = await MovieModel.find({ "characters.name": nameMatch });

    if (!movies || movies.length === 0) {
      return res
        .status(404)
        .json({ error: "No movie(s) with this Character were found" });
    }

    const result = movies
      .map((movie) => ({
        _id: movie._id,
        title: movie.title,
        releaseYear: movie.releaseYear,
      }))
      .sort((a, b) => a.releaseYear - b.releaseYear);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
