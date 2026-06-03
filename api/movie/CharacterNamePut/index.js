const mongoose = require("mongoose");
const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../../movies/models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const body = req.body || {};
    const { movieId, characterId, name } = body;

    // An invalid ObjectId can't match any movie, so treat it as not found
    // rather than letting findById throw a CastError (which would 500).
    if (!movieId || !mongoose.Types.ObjectId.isValid(movieId)) {
      return res.status(404).json({ error: `Movie not found for id ${movieId}` });
    }

    const movie = await MovieModel.findById(movieId);

    if (!movie) {
      return res.status(404).json({ error: `Movie not found for id ${movieId}` });
    }

    // Locate the main character subdocument by its _id. An invalid ObjectId
    // can't match any character, so treat it as not found.
    const character =
      characterId && mongoose.Types.ObjectId.isValid(characterId)
        ? movie.characters.id(characterId)
        : null;

    if (!character) {
      return res.status(404).json({ error: `Character not found for id ${characterId}` });
    }

    // Character name must be present and at least three characters long.
    if (typeof name !== "string" || name.trim().length < 3) {
      return res.status(406).json({
        error: "Character Name is not valid. It must be at least three characters."
      });
    }

    character.name = name.trim();
    await movie.save();

    // Successful update returns 204 with no body.
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Database error" });
  }
});
