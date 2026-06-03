const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const { movie_id, mainCharacterName } = req.params;

    if (!mainCharacterName || mainCharacterName.length < 3) {
      return res.status(406).json({
        error: "Main Character Name is not valid. It must be at least three characters."
      });
    }

    const movie = await MovieModel.findById(movie_id);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    movie.characters.push({ name: mainCharacterName });

    const updatedMovie = await movie.save();

    return res.status(200).json(updatedMovie);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
