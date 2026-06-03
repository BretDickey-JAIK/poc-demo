const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");

const characterToAdd = {
    id: "6a15b1d58291c3d1a98c2ac1",
    name: "Dave Jones",
    race: "Man"
};

// Build a fake movie document with a spyable save method.
function makeMovie(id, characters = []) {
    return {
        _id: id,
        characters,
        save: jest.fn(function () {
            return Promise.resolve(this);
        })
    };
}

describe("CharacterToMoviesAddPost", () => {
    test("adds the character to every existing movie and returns 201 with no JSON", async () => {
        const movieA = makeMovie("69efd1c1b2f8c7327f029fae");
        const movieB = makeMovie("69efd1c1b2f8c7327f029fb1");

        const movies = {
            "69efd1c1b2f8c7327f029fae": movieA,
            "69efd1c1b2f8c7327f029fb1": movieB
        };

        const MovieModel = {
            findById: jest.fn((id) => Promise.resolve(movies[id]))
        };

        const req = {
            body: {
                movies: ["69efd1c1b2f8c7327f029fae", "69efd1c1b2f8c7327f029fb1"],
                characterToAdd
            }
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(movieA.characters.map((c) => c.name)).toContain("Dave Jones");
        expect(movieB.characters.map((c) => c.name)).toContain("Dave Jones");
        expect(movieA.save).toHaveBeenCalledTimes(1);
        expect(movieB.save).toHaveBeenCalledTimes(1);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test("ignores movies that do not exist without returning an error", async () => {
        const realMovie = makeMovie("69efd1c1b2f8c7327f029fae");

        const MovieModel = {
            findById: jest.fn((id) =>
                Promise.resolve(id === "69efd1c1b2f8c7327f029fae" ? realMovie : null)
            )
        };

        const req = {
            body: {
                movies: ["69efd1c1b2f8c7327f029fae", "000000000000000000000000"],
                characterToAdd
            }
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(realMovie.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).not.toHaveBeenCalled();
    });

    test("does not add the character again when it is already in the movie", async () => {
        const movie = makeMovie("69efd1c1b2f8c7327f029fae", [
            { _id: characterToAdd.id, name: "Dave Jones", race: "Man" }
        ]);

        const MovieModel = {
            findById: jest.fn(() => Promise.resolve(movie))
        };

        const req = {
            body: {
                movies: ["69efd1c1b2f8c7327f029fae"],
                characterToAdd
            }
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(movie.characters).toHaveLength(1);
        expect(movie.save).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).not.toHaveBeenCalled();
    });

    test.each([
        ["id", { name: "Dave Jones", race: "Man" }],
        ["name", { id: "6a15b1d58291c3d1a98c2ac1", race: "Man" }],
        ["race", { id: "6a15b1d58291c3d1a98c2ac1", name: "Dave Jones" }]
    ])("returns 406 when the character is missing %s", async (_field, partialCharacter) => {
        const MovieModel = {
            findById: jest.fn()
        };

        const req = {
            body: {
                movies: ["69efd1c1b2f8c7327f029fae"],
                characterToAdd: partialCharacter
            }
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(MovieModel.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(406);
        expect(res.json).toHaveBeenCalledWith({
            error: "Your character can not be added."
        });
    });

    test("returns 500 when the database errors", async () => {
        const MovieModel = {
            findById: jest.fn(() =>
                Promise.reject(new Error("Database connection failed"))
            )
        };

        const req = {
            body: {
                movies: ["69efd1c1b2f8c7327f029fae"],
                characterToAdd
            }
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
});
