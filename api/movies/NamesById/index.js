const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const { movieId, characterName } = req.params;

    const movie = await MovieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    const character = (movie.characters || []).find(
      (c) => c.name.toLowerCase() === characterName.toLowerCase()
    );

    if (!character) {
      return res.status(404).json({ error: "No character found" });
    }

    return res.status(200).json({
      movie: movie.title,
      name: character.name,
      race: character.race,
    });
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
