const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const movies = await MovieModel.find();

    const sortedMovies = (movies || []).sort((a, b) => a.releaseYear - b.releaseYear);

    const seen = new Set();
    const characters = [];

    for (const movie of sortedMovies) {
      for (const { name, race } of movie.characters || []) {
        if (!seen.has(name)) {
          seen.add(name);
          characters.push({ name, race });
        }
      }
    }

    return res.status(200).json(characters);
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
