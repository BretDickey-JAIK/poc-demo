const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const { getJSON } = require("../../../helpers/readFile");

const MOVIE_DOCUMENT_PATH =
    "../api/movies/_test/documents/character-add-document.json";

describe("CharacterByParamsAddPost", () => {
    beforeEach(() => {
        mockingoose.resetAll();
    });

    test("adds a new main character and returns 200 with the full movie", async () => {
        const movieDocument = getJSON(MOVIE_DOCUMENT_PATH);

        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(movieDocument, "findOne");
        // Echo back the document being saved so the response reflects the push.
        mockingoose(MovieModel).toReturn((doc) => doc, "save");

        const req = {
            params: {
                movie_id: movieDocument._id,
                mainCharacterName: "Olwyn",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const body = res.json.mock.calls[0][0];
        const characterNames = body.characters.map((c) => c.name);

        expect(characterNames).toContain("Helm");
        expect(characterNames).toContain("Olwyn");
    });

    test("returns 406 when the character name is fewer than three characters", async () => {
        const MovieModel = require("../../movies/models/movie");

        const req = {
            params: {
                movie_id: "690b9436fb29d9d76b2a0dc2",
                mainCharacterName: "Ol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(406);
        expect(res.json).toHaveBeenCalledWith({
            error: "Main Character Name is not valid. It must be at least three characters.",
        });
    });

    test("returns 404 when no movie is found", async () => {
        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(null, "findOne");

        const req = {
            params: {
                movie_id: "690b9436fb29d9d76b2a0dc2",
                mainCharacterName: "Olwyn",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
    });

    test("returns 500 when the database errors", async () => {
        const MovieModel = require("../../movies/models/movie");
        MovieModel.findById = jest
            .fn()
            .mockRejectedValue(new Error("Database connection failed"));

        const req = {
            params: {
                movie_id: "690b9436fb29d9d76b2a0dc2",
                mainCharacterName: "Olwyn",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
});
