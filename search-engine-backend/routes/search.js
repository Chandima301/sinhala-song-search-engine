'use strict'

const express = require('express');
const router = express.Router();

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

var stopwords = require("../../data/stopwords.json");
var stemwords = require("../../data/stemwords.json");
var named_entities = require("../../data/named_entities.json");

router.post('/', async function (req, res) {

    var query = req.body.query;
    var query_trimmed = query.trim();
    var query_words = query_trimmed.split(" ");
    var removing_stopwords = [];
    var size = 100;



    var range = 0;
    var sort_method = [];


    var field_type = 'most_fields';


    var writer_en = 1;
    var writer_si = 1;
    var artist_en = 1;
    var artist_si = 1;
    var song_title_en = 1;
    var song_title_si = 1;
    var year_en = 20;
    var year_si = 20;
    var metaphors = 1;
    var lyrics = 1;

    var time_range = [];

    query_words.forEach(word => {

        // Check language.
        if (/^[A-Za-z0-9/\s/]*$/.test(req.body.query)) {
            // English


            // Increase score based on stemwords
            stemwords.writer_en.forEach(stemword => {
                if (word.includes(stemword)) {
                    word = word.replace(stemword, "");
                    writer_en += 1;
                }
            })

            stemwords.artist_en.forEach(stemword => {
                if (word.includes(stemword)) {
                    word = word.replace(stemword, "");
                    artist_en += 1;
                }
            })

            // Increase score based on stopwords
            if (stopwords.artist_en.includes(word)) {
                artist_en += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.writer_en.includes(word)) {
                writer_en += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.song_title_en.includes(word)) {
                song_title_en += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.year_en.includes(word)) {
                year_en += 1;
                removing_stopwords.push(word);
            }

            // Increase score based on named_entities.
            if (named_entities.writers_en.includes(word)) {
                writer_en += 1;
            }

            if (named_entities.artists_en.includes(word)) {
                artist_en += 1;
            }

            if (named_entities.years.includes(word)) {
                year_en += 1;
            }






        } else {
            // Sinhala


            // Increase score based on stemwords
            stemwords.writer_si.forEach(stemword => {
                if (word.includes(stemword)) {
                    word = word.replace(stemword, "");
                    writer_si += 1;
                }
            })

            stemwords.artist_si.forEach(stemword => {
                if (word.includes(stemword)) {
                    word = word.replace(stemword, "");
                    artist_si += 1;
                }
            })

            // Increase score based on stopwords
            if (stopwords.artist_si.includes(word)) {
                artist_si += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.writer_si.includes(word)) {
                writer_si += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.song_title_si.includes(word)) {
                song_title_si += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.year_si.includes(word)) {
                year_si += 1;
                removing_stopwords.push(word);
            }

            if (stopwords.metaphors.includes(word)) {
                metaphors += 3;
                removing_stopwords.push(word);
            }

            // Increase score based on named_entities.
            if (named_entities.writers_si.includes(word)) {
                writer_si += 1;
            }

            if (named_entities.artists_si.includes(word)) {
                artist_si += 1;
            }


            if (named_entities.years.includes(word)) {
                year_si += 1;
                time_range.push(word);
            }

        }
        if (stopwords.sorting.includes(word)) {
            sorting += 1;
            removing_stopwords.push(word);
        }
    })

    removing_stopwords.forEach(word => {
        query = query.replace(word, '');
    });

    stopwords.common.forEach(word => {
        query = query.replace(word, '');
    });

    if (time_range.length == 2) {
        time_range.sort();
        var int_time_range = time_range.map(string => parseInt(string));


        console.log("==================================================");
        console.log("Reduced query: ", query.trim());
        console.log("Type: Time range Sinhala");
        console.log("From year: ", int_time_range[0]);
        console.log("To year: ", int_time_range[1]);
        console.log("==================================================");


        var result = await client.search({
            index: 'sinhala_songs_metaphor',
            body: {
                size: size,
                _source: {
                    includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.metaphor", "metaphors.source", "metaphors.target", "metaphors.meaning", "year"]
                },
                sort: sort_method,
                query: {
                    "range": {
                        "year": {
                            "gte": int_time_range[0],
                            "lte": int_time_range[1],
                            "boost": 2.0
                        }
                    }
                },
                aggs: {
                    "metaphore_filter": {
                        terms: {
                            field: "metaphors.meaning.raw",
                            size: 10
                        }
                    },
                    "song_title_filter": {
                        terms: {
                            field: "song_title_si.raw",
                            size: 10
                        }
                    },
                    "artist_filter": {
                        terms: {
                            field: "artist_si.raw",
                            size: 10
                        }
                    },
                    "writer_filter": {
                        terms: {
                            field: "writer_si.raw",
                            size: 10
                        }
                    },
                    "year_filter": {
                        terms: {
                            field: "year.raw",
                            size: 10
                        }
                    }
                }
            }
        });


    } else {

        if (/^[A-Za-z0-9]*$/.test(req.body.query)) {

            console.log("==================================================");
            console.log("Reduced query: ", query.trim());
            console.log("Type: English");
            console.log("Artist score: ", artist_en);
            console.log("Writer score: ", writer_en);
            console.log("Song title score: ", song_title_en);
            console.log("Year score: ", year_en);
            console.log("==================================================");

            var result = await client.search({
                index: 'sinhala_songs_metaphor',
                body: {
                    size: size,
                    _source: {
                        includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.metaphor", "metaphors.source", "metaphors.target", "metaphors.meaning", "year"]
                    },
                    sort: sort_method,
                    query: {
                        multi_match: {
                            query: query.trim(),
                            fields: [
                                `artist_en.case_insensitive_and_inflections^${artist_en}`,
                                `writer_en.case_insensitive_and_inflections^${writer_en}`,
                                `song_title_en.case_insensitive_and_inflections^${song_title_en}`,
                                `year^${year_en}`
                            ],
                            operator: "or",
                            type: field_type
                        }
                    },
                    aggs: {
                        "metaphore_filter": {
                            terms: {
                                field: "metaphors.meaning.raw",
                                size: 10
                            }
                        },
                        "song_title_filter": {
                            terms: {
                                field: "song_title_si.raw",
                                size: 10
                            }
                        },
                        "artist_filter": {
                            terms: {
                                field: "artist_si.raw",
                                size: 10
                            }
                        },
                        "writer_filter": {
                            terms: {
                                field: "writer_si.raw",
                                size: 10
                            }
                        },
                        "year_filter": {
                            terms: {
                                field: "year.raw",
                                size: 10
                            }
                        }
                    }
                }
            });

        } else {

            console.log("==================================================");
            console.log("Reduced query: ", query.trim());
            console.log("Type: Sinhala");
            console.log("Artist score: ", artist_si);
            console.log("Writer score: ", writer_si);
            console.log("Song title score: ", song_title_si);
            console.log("Year score: ", year_si);
            console.log("Metaphor score: ", metaphors);
            console.log("==================================================");

            var result = await client.search({
                index: 'sinhala_songs_metaphor',
                body: {
                    size: size,
                    _source: {
                        includes: ["song_title_si", "writer_si", "artist_si", "lyrics", "metaphors.metaphor", "metaphors.source", "metaphors.target", "metaphors.meaning", "year"]
                    },
                    sort: sort_method,
                    query: {
                        multi_match: {
                            query: query.trim(),
                            fields: [
                                `artist_si^${artist_si}`,
                                `writer_si^${writer_si}`,
                                `song_title_si^${song_title_si}`,
                                `year^${year_si}`,
                                `lyrics^${lyrics}`,
                                `metaphors.metaphor^${lyrics}`,
                                `metaphors.source^${lyrics}`,
                                `metaphors.target^${metaphors}`,
                                `metaphors.meaning^${metaphors}`,
                            ],
                            operator: "or",
                            type: field_type
                        }
                    },
                    aggs: {
                        "metaphore_filter": {
                            terms: {
                                field: "metaphors.meaning.raw",
                                size: 10
                            }
                        },
                        "song_title_filter": {
                            terms: {
                                field: "song_title_si.raw",
                                size: 10
                            }
                        },
                        "artist_filter": {
                            terms: {
                                field: "artist_si.raw",
                                size: 10
                            }
                        },
                        "writer_filter": {
                            terms: {
                                field: "writer_si.raw",
                                size: 10
                            }
                        },
                        "year_filter": {
                            terms: {
                                field: "year.raw",
                                size: 10
                            }
                        }
                    }
                }
            });
        }
    }
    res.send({
        aggs: result.body.aggregations,
        hits: result.body.hits.hits
    });
});

module.exports = router;