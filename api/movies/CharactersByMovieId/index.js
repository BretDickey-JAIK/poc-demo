const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const { movieId } = req.params;

    const movie = await MovieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({ error: "No movie found" });
    }

    const characters = (movie.characters || []).map(({ name }) => ({ name }));

    return res.status(200).json(characters);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
