const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

const MOVIE_ID = "69efd1c1b2f8c7327f029fb0";

function findMovieDocument(movieId) {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-get-document.json"
    );

    return movieDocuments.find(movie => movie._id.$oid === movieId);
}

test("CharactersByMovieId returns an array of character names for a valid movie id", async() => {
    const movieDocument = findMovieDocument(MOVIE_ID);

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        params: { movieId: MOVIE_ID },
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);

    const charactersResponse = getJSON(
        "../api/movies/_test/json-responses/characters-by-movie-id-response.json"
    );

    expect(JSON.stringify(body)).toBe(JSON.stringify(charactersResponse));
});

test("CharactersByMovieId returns only the name field for each character", async() => {
    const movieDocument = findMovieDocument(MOVIE_ID);

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        params: { movieId: MOVIE_ID },
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    body.forEach(character => {
        expect(Object.keys(character)).toEqual(["name"]);
    });
});

test("CharactersByMovieId returns 404 when no movie is found", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(null, "findOne");

    let req = {
        params: { movieId: "000000000000000000000000" },
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("CharactersByMovieId returns 500 error when database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.findById = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        params: { movieId: MOVIE_ID },
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
