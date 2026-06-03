const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("MoviesByCharacterNameGet returns _id, title and releaseYear for a character", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-character-frodo-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { characterName: "Frodo Baggins" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);

    const movieResponse = getJSON(
        "../api/movies/_test/json-responses/movies-by-character-frodo-response.json"
    );

    // Remove _id from expected to match the received (mocked data without _id)
    movieResponse.forEach(movie => delete movie._id);

    expect(JSON.stringify(body)).toBe(JSON.stringify(movieResponse));
});

test("MoviesByCharacterNameGet returns only _id, title and releaseYear (no characters)", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-character-frodo-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { characterName: "Frodo Baggins" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    body.forEach(movie => {
        expect(Object.keys(movie).sort()).toEqual(["_id", "releaseYear", "title"]);
        expect(movie).not.toHaveProperty("characters");
    });
});

test("MoviesByCharacterNameGet returns movies sorted by releaseYear ascending", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-character-frodo-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { characterName: "Frodo Baggins" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 1; i < body.length; i++) {
        expect(body[i].releaseYear).toBeGreaterThanOrEqual(body[i - 1].releaseYear);
    }
});

test("MoviesByCharacterNameGet returns 400 when no character name is provided", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();

    let req = {
        params: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "A character name is required" });
});

test("MoviesByCharacterNameGet returns 404 when no movie with the character is found", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn([], "find");

    let req = {
        params: { characterName: "Oompa Loompa" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
        error: "No movie(s) with this Character were found",
    });
});

test("MoviesByCharacterNameGet returns 500 error when database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        params: { characterName: "Frodo Baggins" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
