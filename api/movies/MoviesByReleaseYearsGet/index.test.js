const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

const makeReq = (startReleaseYear, endReleaseYear) => ({
    header: {},
    params: { startReleaseYear, endReleaseYear },
});

test("MoviesByReleaseYearsGet returns movies within the release year range", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-get-document.json"
    );

    // Movies released between 2000 and 2005 (mockingoose ignores the query filter,
    // so we hand it the expected subset).
    const expectedMovies = movieDocuments.filter(
        movie => movie.releaseYear >= 2000 && movie.releaseYear <= 2005
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(expectedMovies, "find");

    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "2005"), res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.length).toBe(3);
    body.forEach(movie => {
        expect(movie.releaseYear).toBeGreaterThanOrEqual(2000);
        expect(movie.releaseYear).toBeLessThanOrEqual(2005);
    });
});

test("MoviesByReleaseYearsGet returns movies sorted by releaseYear ascending", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-get-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "2020"), res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 1; i < body.length; i++) {
        expect(body[i].releaseYear).toBeGreaterThanOrEqual(body[i - 1].releaseYear);
    }
});

test("MoviesByReleaseYearsGet returns 406 when starting release year is not a number", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("abc", "2005"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Starting release year must be a number" });
});

test("MoviesByReleaseYearsGet returns 406 when starting release year is below 2000", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("1999", "2005"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Starting release year must be between 2000 and 2020" });
});

test("MoviesByReleaseYearsGet returns 406 when starting release year is above 2020", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2021", "2005"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Starting release year must be between 2000 and 2020" });
});

test("MoviesByReleaseYearsGet returns 406 when ending release year is not a number", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "xyz"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Ending release year must be a number" });
});

test("MoviesByReleaseYearsGet returns 406 when ending release year is below 2000", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "1999"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Ending release year must be between 1977 and 2020" });
});

test("MoviesByReleaseYearsGet returns 406 when ending release year is above 2020", async() => {
    const MovieModel = require("../models/movie");
    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "2021"), res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Ending release year must be between 1977 and 2020" });
});

test("MoviesByReleaseYearsGet returns 404 when no movies are found in range", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn([], "find");

    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "2005"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movies found" });
});

test("MoviesByReleaseYearsGet returns 500 when the database errors", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let res = makeMockRes();

    await func.inject({MovieModel})(makeReq("2000", "2005"), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
