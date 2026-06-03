const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const { movieId, characterName } = req.body || {};

    if (!characterName) {
      return res.status(404).json({ error: "No Main Character Name Provided" });
    }

    if (characterName.length < 3) {
      return res.status(406).json({
        error: "Character Name is not valid. It must be at least three characters."
      });
    }

    const movie = await MovieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    movie.characters.push({ name: characterName });
    const updatedMovie = await movie.save();

    return res.status(200).json(updatedMovie);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
