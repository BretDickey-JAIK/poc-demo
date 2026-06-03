const makeInjectable = require("../../../helpers/makeInjectable");

module.exports = makeInjectable({
  defaults: {
    MovieModel: () => require("../models/movie")
  }
}, async function({MovieModel}, req, res) {
  try {
    const race = req.params && req.params.race;

    // Error checking: verify a race was received.
    if (!race || race.trim() === "") {
      return res.status(400).json({ error: "A race is required" });
    }

    const trimmedRace = race.trim();

    // Case-insensitive exact match on a character's race.
    const raceMatch = new RegExp(`^${escapeRegExp(trimmedRace)}$`, "i");
    const movies = await MovieModel.find({ "characters.race": raceMatch });

    if (!movies || movies.length === 0) {
      return res.status(404).json({
        error: `No movie(s) with characters of the ${trimmedRace} race were found`,
      });
    }

    const result = movies
      .map((movie) => ({
        _id: movie._id,
        title: movie.title,
        releaseYear: movie.releaseYear,
        characters: (movie.characters || [])
          .filter((c) => c.race && c.race.toLowerCase() === trimmedRace.toLowerCase())
          .map((c) => ({ name: c.name, race: c.race })),
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
