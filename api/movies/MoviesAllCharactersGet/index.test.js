const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("MoviesAllCharactersGet returns a deduplicated array of characters in the requested format", async() => {
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

    const charactersResponse = getJSON(
        "../api/movies/_test/json-responses/movies-all-characters-response.json"
    );

    expect(JSON.stringify(body)).toBe(JSON.stringify(charactersResponse));
});

test("MoviesAllCharactersGet returns only the name and race fields for each character", async() => {
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
    body.forEach(character => {
        expect(Object.keys(character)).toEqual(["name", "race"]);
    });
});

test("MoviesAllCharactersGet displays each character only once", async() => {
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
    const names = body.map(character => character.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
});

test("MoviesAllCharactersGet orders characters by movie release year (earliest first)", async() => {
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
    // The first character returned should belong to the earliest released movie (2001).
    expect(body[0]).toEqual({ name: "Frodo Baggins", race: "Hobbit" });
    // The first character unique to the second movie (2002) should appear after all
    // first-movie characters, confirming release-year ordering.
    const gollumIndex = body.findIndex(c => c.name === "Gollum");
    const saurumanIndex = body.findIndex(c => c.name === "Saruman the White");
    expect(gollumIndex).toBeGreaterThan(saurumanIndex);
});

test("MoviesAllCharactersGet returns empty array when no movies found", async() => {
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

test("MoviesAllCharactersGet returns 500 error when database is down", async() => {
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
