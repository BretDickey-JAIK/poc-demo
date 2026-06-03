const mongoose = require("mongoose");
const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const { movies, characterToAdd } = req.body || {};

    // The character to add must have an id, a name and a race.
    if (
      !characterToAdd ||
      !characterToAdd.id ||
      !characterToAdd.name ||
      !characterToAdd.race
    ) {
      return res.status(406).json({ error: "Your character can not be added." });
    }

    const movieIds = Array.isArray(movies) ? movies : [];

    for (const movieId of movieIds) {
      const movie = await MovieModel.findById(movieId);

      // If the movie does not exist, ignore it. No error is returned.
      if (!movie) {
        continue;
      }

      // If the character is already in the movie, don't add it again.
      const alreadyPresent = (movie.characters || []).some(
        (character) =>
          character._id && character._id.toString() === characterToAdd.id
      );

      if (alreadyPresent) {
        continue;
      }

      movie.characters.push({
        _id: new mongoose.Types.ObjectId(characterToAdd.id),
        name: characterToAdd.name,
        race: characterToAdd.race
      });

      await movie.save();
    }

    return res.status(201).send();
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
