const mongoose = require("mongoose");
const MovieSchema = mongoose.Schema({ 
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    name: String,
    releaseYear: Number,
    characters: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        race: String,
    }]
});

MovieSchema.statics.getAllMovies = function() {
    return this.find({});
};

module.exports = mongoose.model("movies", MovieSchema, "BretDickey");

