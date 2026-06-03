const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");

const MovieModel = require("../../movies/models/movie");

const movieId = "690b9436fb29d9d76b2a0dc2";

const baseMovieDocument = {
    _id: movieId,
    title: "The Lord of the Rings: The War of the Rohirrim",
    releaseYear: 2024,
    characters: []
};

beforeEach(() => {
    mockingoose.resetAll();
});

test("CharacterAddPost adds a main character and returns the movie with status 200", async () => {
    const savedDocument = {
        ...baseMovieDocument,
        characters: [{ name: "Helm" }]
    };

    mockingoose(MovieModel).toReturn(baseMovieDocument, "findOne");
    mockingoose(MovieModel).toReturn(savedDocument, "save");

    const req = {
        body: {
            movieId,
            characterName: "Helm"
        }
    };

    const res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.characters.map(c => c.name)).toContain("Helm");
});

test("CharacterAddPost returns 404 when the movie is not found", async () => {
    mockingoose(MovieModel).toReturn(null, "findOne");

    const req = {
        body: {
            movieId: "000000000000000000000000",
            characterName: "Helm"
        }
    };

    const res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("CharacterAddPost returns 404 when the characterName is missing", async () => {
    const req = {
        body: {
            movieId
        }
    };

    const res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No Main Character Name Provided" });
});

test("CharacterAddPost returns 406 when the characterName has fewer than three characters", async () => {
    const req = {
        body: {
            movieId,
            characterName: "Hi"
        }
    };

    const res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({
        error: "Character Name is not valid. It must be at least three characters."
    });
});

test("CharacterAddPost returns 500 when the database errors", async () => {
    mockingoose(MovieModel).toReturn(new Error("Database connection failed"), "findOne");

    const req = {
        body: {
            movieId,
            characterName: "Helm"
        }
    };

    const res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
