const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("MoviesAllGet returns list of Movies", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-get-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    //console.log("Received body:", JSON.stringify(body));

    expect(res.status).toHaveBeenCalledWith(200);

    const movieResponse = getJSON(
        "../api/movies/_test/json-responses/movies-get-response.json"
    );

    // Remove _id from expected to match the received (mocked data without _id)
    movieResponse.forEach(movie => delete movie._id);

    // Character _id is auto-generated (non-deterministic), so strip it before comparing
    const normalizedBody = JSON.parse(JSON.stringify(body));
    normalizedBody.forEach(movie => (movie.characters || []).forEach(character => delete character._id));

    expect(JSON.stringify(normalizedBody)).toBe(JSON.stringify(movieResponse));
});

test("MoviesAllGet returns list of Movies sorted by releaseYear from oldest to newest", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-get-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    // Verify movies are sorted by releaseYear in ascending order
    for (let i = 1; i < body.length; i++) {
        expect(body[i].releaseYear).toBeGreaterThanOrEqual(body[i - 1].releaseYear);
    }
});

test("MoviesAllGet returns empty array when no movies found", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn([], "find");

    let req = {
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).toEqual([]);
});

test("MoviesAllGet returns 500 error when database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        header: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});

